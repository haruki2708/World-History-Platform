import type { TutorDepth, TutorErrorCode } from "@/lib/tutor";

export const TUTOR_MODEL = "claude-opus-5-5";

/** Opus 5.5 defaults to `medium`, so the effort is always set explicitly. */
export const EFFORT_BY_DEPTH = {
  standard: "high",
  deep: "xhigh",
} as const satisfies Record<TutorDepth, string>;

/**
 * Ceiling on thinking plus answer, per request. Thinking counts towards it
 * even though its text is never returned, so it is far above the length of
 * an answer; it exists to bound the cost of one request.
 */
export const MAX_TOKENS_BY_DEPTH: Record<TutorDepth, number> = {
  standard: 16_000,
  deep: 32_000,
};

/**
 * Lets the API re-run a request on another model when a safety classifier
 * declines it, so a false positive does not become a failed answer.
 */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/**
 * Server-side sanity limits that are not part of the shared contract. No
 * genuine conversation comes near them.
 */
export const SERVER_LIMITS = {
  /** An answer of MAX_TOKENS_BY_DEPTH.deep tokens is well under this. */
  maxAssistantChars: 200_000,
  maxBodyChars: 2_000_000,
} as const;

/** HTTP status used when an error is the whole response. */
export const ERROR_STATUS: Record<TutorErrorCode, number> = {
  bad_request: 400,
  refused: 422,
  rate_limited: 429,
  limit_reached: 429,
  unavailable: 502,
  not_configured: 503,
  invalid_key: 503,
  no_credits: 503,
  overloaded: 503,
};

/** TUTOR_MOCK=1: answer from the request alone and never call the API. */
export function isMockMode(): boolean {
  return process.env.TUTOR_MOCK === "1";
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
