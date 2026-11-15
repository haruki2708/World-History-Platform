/**
 * Shared data contract for the whole app.
 * Every lane builds against these types. Change them only through the main
 * (coordinating) session — see docs/ARCHITECTURE.md.
 */

export type Locale = "en" | "vi";

/** Every user-facing string in the data set exists in both languages. */
export type LocalizedText = Record<Locale, string>;

/**
 * Years are integers. Negative = BCE (509 BCE is -509), positive = CE.
 * There is no year 0.
 */
export type Year = number;

export type EventCategory = "political" | "military" | "social" | "cultural";

export interface EventLocation {
  name: LocalizedText;
  /** WGS84 decimal degrees. */
  lng: number;
  lat: number;
  /** True when the site is uncertain or debated. */
  approximate?: boolean;
}

export interface SourceRef {
  title: string;
  url?: string;
}

export interface HistoricalEvent {
  /** Stable kebab-case slug, e.g. "battle-of-cannae". */
  id: string;
  year: Year;
  /** Set for events that span several years (wars, reforms). */
  endYear?: Year;
  title: LocalizedText;
  /** Two to four sentences. */
  summary: LocalizedText;
  location?: EventLocation;
  /** Ids from polities.json. */
  polityIds: string[];
  category: EventCategory;
  /** 3 = turning point, 2 = notable, 1 = detail. */
  importance: 1 | 2 | 3;
  /** At least one source per event. */
  sources: SourceRef[];
}

export interface Polity {
  /** Stable kebab-case slug, e.g. "rome". */
  id: string;
  name: LocalizedText;
  /** Hex colour used for this polity's territory on the map. */
  color: string;
  startYear?: Year;
  endYear?: Year;
}

/**
 * One entry per border snapshot. The geometry lives in
 * public/data/borders/<file>, a GeoJSON FeatureCollection whose features each
 * carry `properties.polityId`.
 */
export interface BorderSnapshot {
  /** The snapshot shows the borders as of this year. */
  year: Year;
  /** File name inside public/data/borders/, e.g. "-264.geojson". */
  file: string;
  sources: SourceRef[];
}

/** What the map is currently showing. Written by the map, read by the tutor. */
export interface MapViewport {
  center: { lng: number; lat: number };
  zoom: number;
  /** [west, south, east, north] */
  bounds?: [number, number, number, number];
}
