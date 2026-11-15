import { getEvent } from "@/data";
import type { Locale, Year } from "@/lib/types";
import { YEAR_MAX, YEAR_MIN } from "@/lib/years";
import { isLocale } from "./locale";

/**
 * The view as it appears in the address bar:
 * `/?year=-216&event=battle-of-cannae&lang=vi`.
 */
export interface UrlState {
  year: Year;
  eventId: string | null;
  locale: Locale;
}

/** Parameters this module owns; any others in the URL are left alone. */
const PARAMS = { year: "year", event: "event", lang: "lang" } as const;

/**
 * Reads the parameters of a link. Each one is checked on its own and dropped
 * if invalid (a year outside the range, an unknown event, another language),
 * so a bad parameter never stops the rest of the link from working.
 */
export function parseUrlState(search: string): Partial<UrlState> {
  const params = new URLSearchParams(search);
  const result: Partial<UrlState> = {};

  const year = params.get(PARAMS.year)?.trim();
  if (year && /^[-+]?\d+$/.test(year)) {
    const value = Number(year);
    if (value >= YEAR_MIN && value <= YEAR_MAX) result.year = value;
  }

  const eventId = params.get(PARAMS.event);
  if (eventId && getEvent(eventId)) result.eventId = eventId;

  const lang = params.get(PARAMS.lang);
  if (isLocale(lang)) result.locale = lang;

  return result;
}

/**
 * `search` with this module's parameters set to `state`, keeping any other
 * parameters as they were. Always returns a string starting with "?".
 */
export function buildSearch(state: UrlState, search = ""): string {
  const params = new URLSearchParams(search);
  // Ours come first, in a fixed order, followed by anything else the link had.
  for (const name of Object.values(PARAMS)) params.delete(name);
  const ordered = new URLSearchParams();
  ordered.set(PARAMS.year, String(state.year));
  if (state.eventId) ordered.set(PARAMS.event, state.eventId);
  ordered.set(PARAMS.lang, state.locale);
  for (const [name, value] of params) ordered.append(name, value);
  return `?${ordered.toString()}`;
}

/** The full shareable link for `state`, based on the current page address. */
export function buildShareUrl(state: UrlState): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${buildSearch(state, search)}`;
}
