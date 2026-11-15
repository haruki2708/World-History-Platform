/**
 * Contract between the tutor chat (src/components/tutor, lane 1) and the
 * tutor API route (src/app/api/tutor, lane 2). Change it only through the
 * main session — see docs/ARCHITECTURE.md, section "AI tutor".
 */
import type { Locale, MapViewport, Year } from "./types";

export const TUTOR_ENDPOINT = "/api/tutor";

export const TUTOR_LIMITS = {
  /** Longest question the user may send, in characters. */
  maxQuestionChars: 2000,
  /** Most messages (user + assistant) in one request. */
  maxMessages: 40,
  /** Most map links in one answer. */
  maxMapLinks: 3,
} as const;

/**
 * What the user was looking at when they sent a question. It is stored with
 * each user message and sent again unchanged on every later request, so the
 * server renders the same history every time (this keeps the prompt cache
 * warm and the conversation valid for the model).
 */
export interface TutorContext {
  year: Year;
  locale: Locale;
  viewport: MapViewport;
  selectedEventId: string | null;
}

export type TutorMessage =
  | { role: "user"; content: string; context: TutorContext }
  | { role: "assistant"; content: string };

/**
 * A place in the app the tutor suggests looking at, shown under its answer
 * as a button that moves the timeline (and, for an event, the map) there.
 * The chat builds the button's label from the data, in the user's language.
 *
 * The server guarantees: `year` is within [YEAR_MIN, YEAR_MAX]; `eventId`,
 * when set, is an event in the data set and `year` lies within that event's
 * years; no two links of one answer are equal; at most
 * TUTOR_LIMITS.maxMapLinks per answer.
 */
export interface TutorMapLink {
  year: Year;
  /** An event id from the data set, or null for "go to this year". */
  eventId: string | null;
}

/** "standard" answers at effort high; "deep" at effort xhigh. */
export type TutorDepth = "standard" | "deep";

/** Body of POST /api/tutor. `messages` must end with a user message. */
export interface TutorRequest {
  messages: TutorMessage[];
  depth: TutorDepth;
}

export type TutorErrorCode =
  /** No API key on the server, and mock mode is off. */
  | "not_configured"
  /** The API key is wrong or revoked. */
  | "invalid_key"
  /** The Claude account has no credit left (API billing_error). */
  | "no_credits"
  /** Too many requests; try again shortly. */
  | "rate_limited"
  /**
   * A usage limit of this app was reached (questions per person per day, or
   * the daily spending cap); trying again soon will not help.
   */
  | "limit_reached"
  /** The API is overloaded or down; try again shortly. */
  | "overloaded"
  /** The model declined to answer. */
  | "refused"
  /** The request broke TUTOR_LIMITS or was malformed. */
  | "bad_request"
  /** Anything else. */
  | "unavailable";

/**
 * The response is newline-delimited JSON (`application/x-ndjson`): one
 * TutorStreamEvent per line. A successful answer is any number of `text`
 * events followed by one `done`. A failure is a single `error` event, either
 * on its own (with a 4xx/5xx status) or later in a 200 stream.
 *
 * `ping` carries nothing: the server sends it while the model is still
 * thinking, to start the response early and keep the connection alive.
 * Clients ignore it.
 *
 * `map_link` may arrive at any point before `done`, mixed with `text`.
 * The text never contains the markup the model used to request the links.
 */
export type TutorStreamEvent =
  | { type: "ping" }
  | { type: "text"; text: string }
  | { type: "map_link"; link: TutorMapLink }
  | { type: "done"; truncated: boolean }
  | { type: "error"; code: TutorErrorCode };
