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

/**
 * A response that is a single `error` event, with a 4xx/5xx status: the one
 * of ERROR_STATUS unless `status` is given.
 */
export function errorResponse(code: TutorErrorCode, status?: number): Response {
  return new Response(toLine({ type: "error", code }), {
    status: status ?? ERROR_STATUS[code],
    headers: HEADERS,
  });
}

export interface ResponseTiming {
  /** How long to hold the response for the first event. */
  firstEventWaitMs: number;
  /** Silence after which a `ping` is sent. */
  pingIntervalMs: number;
}

export const RESPONSE_TIMING: ResponseTiming = {
  firstEventWaitMs: 2_000,
  pingIntervalMs: 15_000,
};

const TIMED_OUT = Symbol("timed out");

/** `promise`, or TIMED_OUT if it takes longer than `ms`. */
async function within<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

type Next = Promise<IteratorResult<TutorStreamEvent, void>>;

/**
 * Turns a stream of tutor events into the NDJSON response.
 *
 * The first event is awaited for up to `firstEventWaitMs`: if the answer
 * fails in that time, the error is sent with its proper HTTP status, as the
 * contract asks. If nothing has come by then (the model is still thinking),
 * the response starts anyway, with status 200 and a `ping`, and any later
 * error travels in that 200 stream. While the stream is open, a `ping` goes
 * out after every `pingIntervalMs` of silence so that proxies do not drop
 * the connection. Calling `abort.abort()` must make `events` stop.
 */
export async function streamResponse(
  events: AsyncGenerator<TutorStreamEvent, void, void>,
  abort: AbortController,
  timing: ResponseTiming = RESPONSE_TIMING,
): Promise<Response> {
  let next: Next | undefined = events.next();
  // Nobody may be waiting on it when the client leaves.
  next.catch(() => undefined);

  let pending: TutorStreamEvent;
  const first = await within(next, timing.firstEventWaitMs);
  if (first === TIMED_OUT) {
    pending = { type: "ping" };
  } else {
    next = undefined;
    if (first.done) {
      // The client went away before anything was produced; nobody reads this.
      return new Response(null, { status: 200, headers: HEADERS });
    }
    if (first.value.type === "error") {
      await events.return();
      return errorResponse(first.value.code);
    }
    pending = first.value;
  }

  let queued: TutorStreamEvent | undefined = pending;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        let event = queued;
        queued = undefined;
        if (!event) {
          if (!next) {
            next = events.next();
            next.catch(() => undefined);
          }
          const result = await within(next, timing.pingIntervalMs);
          if (result === TIMED_OUT) {
            controller.enqueue(encoder.encode(toLine({ type: "ping" })));
            return;
          }
          next = undefined;
          if (result.done) return controller.close();
          event = result.value;
        }
        controller.enqueue(encoder.encode(toLine(event)));
        if (event.type === "done" || event.type === "error") {
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
