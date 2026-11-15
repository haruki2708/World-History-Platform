import Anthropic from "@anthropic-ai/sdk";
import type { TutorErrorCode } from "@/lib/tutor";

/** True when the request was cancelled on purpose (the user pressed stop). */
export function isAbort(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || error instanceof Anthropic.APIUserAbortError;
}

/** Maps a failure of the Claude API call to the code the chat understands. */
export function toTutorErrorCode(error: unknown): TutorErrorCode {
  // Connection errors subclass APIError in this SDK, so they are tested first.
  if (error instanceof Anthropic.APIConnectionError) return "unavailable";
  if (error instanceof Anthropic.AuthenticationError) return "invalid_key";
  if (error instanceof Anthropic.RateLimitError) return "rate_limited";
  if (error instanceof Anthropic.InternalServerError) return "overloaded";
  if (error instanceof Anthropic.APIError) {
    if (error.status === 402 || error.type === "billing_error") {
      return "no_credits";
    }
    // Errors sent inside an open stream have no HTTP status, only a type.
    if (error.type === "authentication_error") return "invalid_key";
    if (error.type === "rate_limit_error") return "rate_limited";
    if (
      error.type === "overloaded_error" ||
      error.type === "api_error" ||
      error.type === "timeout_error"
    ) {
      return "overloaded";
    }
  }
  return "unavailable";
}

function redact(text: string): string {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  const clean = key ? text.split(key).join("[redacted]") : text;
  return clean.length > 600 ? `${clean.slice(0, 600)}…` : clean;
}

/**
 * Writes the details of a failure to the server log. Only chosen fields are
 * logged, never the error object itself, and the API key is scrubbed from
 * the message in case a lower layer ever echoes it.
 */
export function logTutorError(code: TutorErrorCode, error: unknown): void {
  const details: Record<string, unknown> = { code };
  if (error instanceof Anthropic.APIError) {
    details.status = error.status;
    details.type = error.type;
    details.requestId = error.requestID;
  }
  if (error instanceof Error) {
    details.name = error.name;
    details.message = redact(error.message);
  } else {
    details.message = redact(String(error));
  }
  console.error("[tutor] request to the Claude API failed", details);
}
