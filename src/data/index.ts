import type {
  BorderSnapshot,
  HistoricalEvent,
  Polity,
  Year,
} from "@/lib/types";
import borderSnapshotsJson from "./border-snapshots.json";
import eventsJson from "./events.json";
import politiesJson from "./polities.json";

export const events = (eventsJson as HistoricalEvent[])
  .slice()
  .sort((a, b) => a.year - b.year);

export const polities = politiesJson as Polity[];

export const borderSnapshots = (borderSnapshotsJson as BorderSnapshot[])
  .slice()
  .sort((a, b) => a.year - b.year);

const eventsById = new Map(events.map((event) => [event.id, event]));
const politiesById = new Map(polities.map((polity) => [polity.id, polity]));

export function getEvent(id: string): HistoricalEvent | undefined {
  return eventsById.get(id);
}

export function getPolity(id: string): Polity | undefined {
  return politiesById.get(id);
}

/** True when the event is happening in `year` (single-year or spanning). */
export function isEventActive(event: HistoricalEvent, year: Year): boolean {
  return year >= event.year && year <= (event.endYear ?? event.year);
}

/**
 * Events that start within `windowYears` of `year`, plus any spanning event
 * that is under way in `year`. Sorted by start year.
 */
export function getEventsAround(
  year: Year,
  windowYears = 30,
): HistoricalEvent[] {
  return events.filter(
    (event) =>
      Math.abs(event.year - year) <= windowYears || isEventActive(event, year),
  );
}

/** The latest border snapshot at or before `year`, if any. */
export function getBorderSnapshot(year: Year): BorderSnapshot | undefined {
  let match: BorderSnapshot | undefined;
  for (const snapshot of borderSnapshots) {
    if (snapshot.year > year) break;
    match = snapshot;
  }
  return match;
}
