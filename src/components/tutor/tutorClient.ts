import {
  TUTOR_ENDPOINT,
  type TutorErrorCode,
  type TutorRequest,
  type TutorStreamEvent,
} from "@/lib/tutor";

export type TutorOutcome =
  | { kind: "done"; truncated: boolean }
  | { kind: "error"; code: TutorErrorCode };

export interface StreamOptions {
  signal: AbortSignal;
  /** Called with each piece of answer text as it arrives. */
  onText: (text: string) => void;
  /** Called once if the dev-only simulated tutor answered instead. */
  onMock?: () => void;
}

const ERROR_CODES: readonly TutorErrorCode[] = [
  "not_configured",
  "invalid_key",
  "no_credits",
  "rate_limited",
  "overloaded",
  "refused",
  "bad_request",
  "unavailable",
];

/**
 * POSTs a TutorRequest and reads the NDJSON stream of TutorStreamEvents.
 * Resolves with how the answer ended; rejects only when `signal` aborts
 * (with the fetch AbortError), so callers can tell "stopped" from "failed".
 */
export async function streamTutor(
  request: TutorRequest,
  { signal, onText, onMock }: StreamOptions,
): Promise<TutorOutcome> {
  let response: Response;
  try {
    response = await fetch(TUTOR_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    return { kind: "error", code: "unavailable" };
  }

  // DEV-ONLY FALLBACK — remove together with ./devMockTutor.ts once
  // /api/tutor (T-005) is merged. Production builds drop this branch.
  if (process.env.NODE_ENV === "development" && response.status === 404) {
    const { mockTutorResponse } = await import("./devMockTutor");
    response = mockTutorResponse(request, signal);
    onMock?.();
  }

  if (!response.body) {
    return { kind: "error", code: errorFromStatus(response.status) };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line: string): TutorOutcome | null => {
    if (!line.trim()) return null;
    let event: TutorStreamEvent;
    try {
      event = JSON.parse(line) as TutorStreamEvent;
    } catch {
      return { kind: "error", code: errorFromStatus(response.status) };
    }
    if (event.type === "text") {
      onText(event.text);
      return null;
    }
    if (event.type === "done") return { kind: "done", truncated: event.truncated };
    if (event.type === "error") {
      return {
        kind: "error",
        code: ERROR_CODES.includes(event.code) ? event.code : "unavailable",
      };
    }
    return null;
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = done ? "" : (lines.pop() ?? "");
      for (const line of lines) {
        const outcome = handleLine(line);
        if (outcome) {
          void reader.cancel().catch(() => {});
          return outcome;
        }
      }
      if (done) break;
    }
  } catch (error) {
    if (signal.aborted) throw error;
    return { kind: "error", code: "unavailable" };
  }

  // The stream ended without `done` or `error`: the connection dropped.
  return {
    kind: "error",
    code: response.ok ? "unavailable" : errorFromStatus(response.status),
  };
}

/** Best guess when the body carries no usable error event. */
function errorFromStatus(status: number): TutorErrorCode {
  if (status === 429) return "rate_limited";
  if (status === 529 || status === 503) return "overloaded";
  if (status === 400 || status === 413) return "bad_request";
  return "unavailable";
}
