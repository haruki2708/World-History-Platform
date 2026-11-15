import type { TutorErrorCode, TutorStreamEvent } from "@/lib/tutor";
import { ERROR_STATUS } from "./config";

const HEADERS = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-store",
  // Ask proxies and browsers to pass each line on as it is written.
  "X-Accel-Buffering": "no",
  "X-Content-Type-Options": "nosniff",
};

const encoder = new TextEncoder();

/** One NDJSON line. */
function toLine(event: TutorStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/** A response that is a single `error` event, with a 4xx/5xx status. */
export function errorResponse(code: TutorErrorCode): Response {
  return new Response(toLine({ type: "error", code }), {
    status: ERROR_STATUS[code],
    headers: HEADERS,
  });
}

/**
 * Turns a stream of tutor events into the NDJSON response.
 *
 * The first event is awaited before the response is created: if the answer
 * fails before any text, the error can still be sent with a proper HTTP
 * status, as the contract asks. Everything after that is streamed with
 * status 200. Calling `abort.abort()` must make `events` stop.
 */
export async function streamResponse(
  events: AsyncGenerator<TutorStreamEvent, void, void>,
  abort: AbortController,
): Promise<Response> {
  const first = await events.next();
  if (first.done) {
    // The client went away before anything was produced; nobody reads this.
    return new Response(null, { status: 200, headers: HEADERS });
  }
  if (first.value.type === "error") {
    await events.return();
    return errorResponse(first.value.code);
  }

  let pending: TutorStreamEvent | undefined = first.value;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        let event = pending;
        pending = undefined;
        if (!event) {
          const next = await events.next();
          if (next.done) return controller.close();
          event = next.value;
        }
        controller.enqueue(encoder.encode(toLine(event)));
        if (event.type !== "text") {
          await events.return();
          controller.close();
        }
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      // The browser closed the connection (the user pressed stop).
      abort.abort();
      await events.return();
    },
  });
  return new Response(body, { status: 200, headers: HEADERS });
}
