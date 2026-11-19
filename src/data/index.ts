import type { Battle, UnitType } from "@/lib/battle";
import type {
  BorderSnapshot,
  HistoricalEvent,
  Polity,
  Year,
} from "@/lib/types";
import unitTypesJson from "./battles/unit-types.json";
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

/** Kinds of soldiers in the 3D battle scenes, shared by every battle. */
export const unitTypes = unitTypesJson as UnitType[];

/**
 * Battles with a 3D scene, keyed by event id. A battle file is large, so it is
 * loaded only when its scene opens.
 */
const battleLoaders = new Map<string, () => Promise<{ default: unknown }>>([
  ["battle-of-cannae", () => import("./battles/battle-of-cannae.json")],
  ["battle-of-lake-trasimene", () => import("./battles/battle-of-lake-trasimene.json")],
]);

/** True when the event has a 3D battle scene. */
export function hasBattle(eventId: string): boolean {
  return battleLoaders.has(eventId);
}

export async function loadBattle(id: string): Promise<Battle | undefined> {
  const load = battleLoaders.get(id);
  if (!load) return undefined;
  return (await load()).default as Battle;
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
