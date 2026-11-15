import { getEvent, isEventActive } from "@/data";
import { TUTOR_LIMITS, type TutorMapLink } from "@/lib/tutor";
import { YEAR_MAX, YEAR_MIN } from "@/lib/years";

/**
 * Checks a map link from the stream again on the client: the year is an
 * integer within the app's range; the event, when set, exists in this build's
 * data and is under way in that year. Returns a clean copy, or null to drop it.
 */
export function sanitizeMapLink(raw: unknown): TutorMapLink | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { year, eventId } = raw as Record<string, unknown>;
  if (typeof year !== "number" || !Number.isInteger(year)) return null;
  if (year < YEAR_MIN || year > YEAR_MAX) return null;
  if (eventId === null) return { year, eventId: null };
  if (typeof eventId !== "string") return null;
  const event = getEvent(eventId);
  if (!event || !isEventActive(event, year)) return null;
  return { year, eventId };
}

export function sameMapLink(a: TutorMapLink, b: TutorMapLink): boolean {
  return a.year === b.year && a.eventId === b.eventId;
}

/**
 * `links` with `link` appended, unless it is a duplicate or the answer already
 * has TUTOR_LIMITS.maxMapLinks links (then `links` itself is returned).
 */
export function addMapLink(
  links: readonly TutorMapLink[],
  link: TutorMapLink,
): readonly TutorMapLink[] {
  if (links.length >= TUTOR_LIMITS.maxMapLinks) return links;
  if (links.some((other) => sameMapLink(other, link))) return links;
  return [...links, link];
}
