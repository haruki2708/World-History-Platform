import { getEvent } from "@/data";
import {
  TUTOR_LIMITS,
  type TutorContext,
  type TutorMessage,
  type TutorRequest,
} from "@/lib/tutor";
import type { MapViewport } from "@/lib/types";
import { YEAR_MAX, YEAR_MIN } from "@/lib/years";
import { SERVER_LIMITS } from "./config";

export type ParseResult =
  | { ok: true; request: TutorRequest }
  /** `reason` is for the server log only; the browser just gets bad_request. */
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberIn(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function parseViewport(value: unknown): MapViewport | string {
  if (!isRecord(value)) return "viewport is not an object";
  const { center, zoom, bounds } = value;
  if (
    !isRecord(center) ||
    !isNumberIn(center.lng, -180, 180) ||
    !isNumberIn(center.lat, -90, 90)
  ) {
    return "viewport.center is invalid";
  }
  if (!isNumberIn(zoom, 0, 24)) return "viewport.zoom is invalid";

  const viewport: MapViewport = {
    center: { lng: center.lng, lat: center.lat },
    zoom,
  };
  if (bounds !== undefined) {
    if (
      !Array.isArray(bounds) ||
      bounds.length !== 4 ||
      !isNumberIn(bounds[0], -360, 360) ||
      !isNumberIn(bounds[1], -90, 90) ||
      !isNumberIn(bounds[2], -360, 360) ||
      !isNumberIn(bounds[3], -90, 90)
    ) {
      return "viewport.bounds is invalid";
    }
    viewport.bounds = [bounds[0], bounds[1], bounds[2], bounds[3]];
  }
  return viewport;
}

function parseContext(value: unknown): TutorContext | string {
  if (!isRecord(value)) return "context is not an object";
  const { year, locale, selectedEventId } = value;

  if (!Number.isInteger(year) || !isNumberIn(year, YEAR_MIN, YEAR_MAX)) {
    return "context.year is out of range";
  }
  if (locale !== "en" && locale !== "vi") return "context.locale is invalid";
  if (selectedEventId !== null) {
    if (typeof selectedEventId !== "string" || !getEvent(selectedEventId)) {
      return "context.selectedEventId is not a known event";
    }
  }
  const viewport = parseViewport(value.viewport);
  if (typeof viewport === "string") return `context.${viewport}`;

  return { year, locale, viewport, selectedEventId };
}

function parseMessage(value: unknown): TutorMessage | string {
  if (!isRecord(value)) return "is not an object";
  const { role, content } = value;
  if (typeof content !== "string") return "content is not a string";

  if (role === "assistant") {
    if (content.length > SERVER_LIMITS.maxAssistantChars) {
      return "assistant content is too long";
    }
    return { role, content };
  }
  if (role === "user") {
    if (content.trim() === "") return "question is empty";
    if (content.length > TUTOR_LIMITS.maxQuestionChars) {
      return "question is too long";
    }
    const context = parseContext(value.context);
    if (typeof context === "string") return context;
    return { role, content, context };
  }
  return "role is invalid";
}

/**
 * Checks an untrusted request body against the contract in src/lib/tutor.ts
 * and returns a clean copy that holds only the contract's fields.
 */
export function parseTutorRequest(body: unknown): ParseResult {
  if (!isRecord(body)) return { ok: false, reason: "body is not an object" };

  const { depth, messages } = body;
  if (depth !== "standard" && depth !== "deep") {
    return { ok: false, reason: "depth is invalid" };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, reason: "messages is empty or not an array" };
  }
  if (messages.length > TUTOR_LIMITS.maxMessages) {
    return { ok: false, reason: "too many messages" };
  }

  const parsed: TutorMessage[] = [];
  for (const [index, raw] of messages.entries()) {
    const message = parseMessage(raw);
    if (typeof message === "string") {
      return { ok: false, reason: `messages[${index}]: ${message}` };
    }
    parsed.push(message);
  }
  if (parsed[0].role !== "user") {
    return { ok: false, reason: "the first message is not from the user" };
  }
  if (parsed[parsed.length - 1].role !== "user") {
    return { ok: false, reason: "the last message is not from the user" };
  }

  return { ok: true, request: { depth, messages: parsed } };
}

/** Reads and validates the body of a POST /api/tutor request. */
export async function readTutorRequest(request: Request): Promise<ParseResult> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, reason: "body could not be read" };
  }
  if (text.length > SERVER_LIMITS.maxBodyChars) {
    return { ok: false, reason: "body is too large" };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, reason: "body is not JSON" };
  }
  return parseTutorRequest(body);
}
