import "server-only";
import { streamClaudeAnswer } from "./claude";
import { hasApiKey, isMockMode } from "./config";
import {
  admitQuestion,
  clientId,
  isForeignOrigin,
  recordSpend,
} from "./limits";
import { streamMockAnswer } from "./mock";
import { errorResponse, streamResponse } from "./respond";
import { readTutorRequest } from "./validate";

/**
 * POST /api/tutor: checks where the request comes from, validates the
 * question and its context, applies the usage limits, then streams the
 * answer as NDJSON (see TutorStreamEvent in src/lib/tutor.ts).
 *
 * Every check runs before the Claude API is called, and a refused request
 * costs nothing and uses up no question.
 */
export async function handleTutorPost(request: Request): Promise<Response> {
  if (isForeignOrigin(request)) {
    console.warn("[tutor] request from another origin refused");
    return errorResponse("bad_request", 403);
  }

  const parsed = await readTutorRequest(request);
  if (!parsed.ok) {
    console.warn(`[tutor] bad request: ${parsed.reason}`);
    return errorResponse("bad_request");
  }

  const mock = isMockMode();
  if (!mock && !hasApiKey()) {
    console.warn(
      "[tutor] ANTHROPIC_API_KEY is not set and TUTOR_MOCK is not 1; see .env.example",
    );
    return errorResponse("not_configured");
  }

  let refused;
  try {
    refused = await admitQuestion(clientId(request));
  } catch (error) {
    // Only a shared store can fail here. Without counters, do not spend.
    console.error("[tutor] usage limits could not be checked", String(error));
    return errorResponse("unavailable");
  }
  if (refused) return errorResponse(refused);

  // Aborted when the browser disconnects, which cancels the upstream call.
  const abort = new AbortController();
  if (request.signal.aborted) abort.abort();
  else request.signal.addEventListener("abort", () => abort.abort());

  const events = mock
    ? streamMockAnswer(parsed.request, abort.signal)
    : streamClaudeAnswer(parsed.request, abort.signal, (usd) => {
        recordSpend(usd).catch((error: unknown) => {
          console.error("[tutor] spending could not be recorded", String(error));
        });
      });
  return streamResponse(events, abort);
}
