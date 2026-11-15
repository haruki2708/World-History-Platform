import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { TutorRequest, TutorStreamEvent } from "@/lib/tutor";
import {
  EFFORT_BY_DEPTH,
  FALLBACK_BETA,
  MAX_TOKENS_BY_DEPTH,
  TUTOR_MODEL,
} from "./config";
import { isAbort, logTutorError, toTutorErrorCode } from "./errors";
import { MapLinkStream } from "./mapLinks";
import { estimateCostUsd, mergeUsage, type TokenUsage } from "./pricing";
import { buildMessages, buildSystem } from "./prompt";

type StreamParams = Parameters<Anthropic["beta"]["messages"]["stream"]>[0];

let client: Anthropic | undefined;

/** Reads ANTHROPIC_API_KEY from the environment; the key never appears here. */
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** The complete Claude API request for one tutor question. */
export function buildClaudeParams(request: TutorRequest) {
  return {
    model: TUTOR_MODEL,
    max_tokens: MAX_TOKENS_BY_DEPTH[request.depth],
    // If a safety classifier declines the request, the API re-runs it on the
    // fallback model it recommends for that kind of refusal.
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    // Explicit so that a fallback model thinks too; Opus 5.5 always does.
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT_BY_DEPTH[request.depth] },
    // system[1] carries the breakpoint for the fixed prefix. This top-level
    // setting adds a moving one at the end of the conversation, so follow-up
    // questions re-read the earlier turns from the cache as well.
    cache_control: { type: "ephemeral" },
    system: buildSystem(request.depth),
    messages: buildMessages(request.messages),
  } satisfies StreamParams;
}

/**
 * Asks Claude and yields the answer as it is written. Ends with `done`, or
 * with `error` if the call fails or the model declines. If `signal` aborts
 * (the user pressed stop or left), the API request is cancelled and the
 * generator ends without a final event.
 *
 * Map-link markers in the model's text become `map_link` events (see
 * mapLinks.ts); the text sent on never contains them.
 *
 * `onCost` receives the estimated cost in USD once the request is over, also
 * when it stopped early: then it covers the usage reported so far (the input
 * side is known from the start; output only when the API reported it).
 */
export async function* streamClaudeAnswer(
  request: TutorRequest,
  signal: AbortSignal,
  onCost: (usd: number) => void = () => {},
): AsyncGenerator<TutorStreamEvent, void, void> {
  let stream: ReturnType<Anthropic["beta"]["messages"]["stream"]> | undefined;
  const usage: TokenUsage = {};
  let finished = false;
  // Validated requests end with the question, so there is always one.
  const question = request.messages.findLast((message) => message.role === "user");
  const links = new MapLinkStream(question!.context);
  try {
    stream = getClient().beta.messages.stream(buildClaudeParams(request), {
      signal,
    });

    for await (const event of stream) {
      if (event.type === "message_start") mergeUsage(usage, event.message.usage);
      else if (event.type === "message_delta") mergeUsage(usage, event.usage);
      // Thinking blocks and fallback markers are not shown; only text is.
      else if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta" &&
        event.delta.text !== ""
      ) {
        yield* links.push(event.delta.text);
      }
    }
    yield* finishLinks(links);

    const message = await stream.finalMessage();
    mergeUsage(usage, message.usage);
    finished = true;
    const costUsd = estimateCostUsd(usage);
    onCost(costUsd);
    console.info("[tutor] response finished", {
      model: message.model,
      stopReason: message.stop_reason,
      depth: request.depth,
      inputTokens: usage.input_tokens,
      cacheReadTokens: usage.cache_read_input_tokens,
      cacheWriteTokens: usage.cache_creation_input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: roundUsd(costUsd),
    });

    if (message.stop_reason === "refusal") {
      // Declined by the model, or by every model in the fallback chain.
      console.warn("[tutor] refused", {
        category: message.stop_details?.category ?? null,
      });
      yield { type: "error", code: "refused" };
    } else if (
      message.stop_reason === "max_tokens" ||
      message.stop_reason === "model_context_window_exceeded" ||
      message.stop_reason === "pause_turn"
    ) {
      yield { type: "done", truncated: true };
    } else if (!links.hasText) {
      console.error("[tutor] the model returned no text");
      yield { type: "error", code: "unavailable" };
    } else {
      yield { type: "done", truncated: false };
    }
  } catch (error) {
    if (isAbort(error, signal)) return;
    // Keep the text held back so far; the chat shows a partial answer.
    yield* finishLinks(links);
    const code = toTutorErrorCode(error);
    logTutorError(code, error);
    yield { type: "error", code };
  } finally {
    // Also runs when the consumer stops early: stop paying for output.
    stream?.abort();
    if (!finished) {
      const costUsd = estimateCostUsd(usage);
      if (costUsd > 0) {
        onCost(costUsd);
        console.info("[tutor] response stopped early", {
          depth: request.depth,
          inputTokens: usage.input_tokens ?? null,
          outputTokens: usage.output_tokens ?? null,
          costUsd: roundUsd(costUsd),
        });
      }
    }
  }
}

/** Sends what the link stream held back, and logs how many links it made. */
function finishLinks(links: MapLinkStream): TutorStreamEvent[] {
  if (links.finished) return [];
  const events = links.finish();
  const { sent, dropped } = links.report();
  // Counts only: the answer itself is never logged.
  if (sent > 0 || dropped > 0) console.info("[tutor] map links", { sent, dropped });
  return events;
}

/** Enough digits for a fraction of a cent, without float noise in logs. */
function roundUsd(usd: number): number {
  return Number(usd.toFixed(6));
}
