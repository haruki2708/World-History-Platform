import { borderSnapshots, getBorderSnapshot, getPolity, polities } from "@/data";
import type { Year } from "@/lib/types";

type BorderGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

/** A border file as described in docs/ARCHITECTURE.md. */
type BorderCollection = GeoJSON.FeatureCollection<
  BorderGeometry,
  { polityId?: string } | null
>;

/** Where the borders for a span of years come from. One object per snapshot. */
export interface BorderSource {
  key: string;
  /** The borders are shown as of this year. */
  year: Year;
  /** True for the rough development fixtures, never for real data. */
  isFixture: boolean;
  load: () => Promise<BorderCollection>;
}

/** A border file made ready for the map. */
export interface Territories {
  /** Every feature carries the colour of its polity in `properties.color`. */
  collection: GeoJSON.FeatureCollection<
    BorderGeometry,
    { polityId: string; color: string }
  >;
  /** Polities present in this snapshot, in the order of polities.json. */
  polityIds: string[];
}

async function fetchBorderFile(file: string): Promise<BorderCollection> {
  const response = await fetch(`/data/borders/${encodeURIComponent(file)}`);
  if (!response.ok) {
    throw new Error(`Border file ${file}: HTTP ${response.status}`);
  }
  return (await response.json()) as BorderCollection;
}

/**
 * Rough hand-drawn borders used only while Lane 3 has not delivered real
 * snapshots (task T-004): `next dev` with an empty border-snapshots.json.
 * They are never loaded in a production build.
 */
const fixtureSources: BorderSource[] =
  process.env.NODE_ENV === "development" && borderSnapshots.length === 0
    ? [
        { year: -500, load: () => import("./__fixtures__/-500.json") },
        { year: -264, load: () => import("./__fixtures__/-264.json") },
        { year: -146, load: () => import("./__fixtures__/-146.json") },
      ].map(({ year, load }) => ({
        key: `fixture:${year}`,
        year,
        isFixture: true,
        load: async () => (await load()).default as unknown as BorderCollection,
      }))
    : [];

const realSources = new Map<string, BorderSource>();

/**
 * The border source in effect for `year`: the latest snapshot at or before
 * it. Returns the same object for every year served by the same snapshot.
 */
export function getBorderSource(year: Year): BorderSource | undefined {
  if (fixtureSources.length > 0) {
    return fixtureSources.findLast((source) => source.year <= year);
  }

  const snapshot = getBorderSnapshot(year);
  if (!snapshot) return undefined;

  let source = realSources.get(snapshot.file);
  if (!source) {
    source = {
      key: snapshot.file,
      year: snapshot.year,
      isFixture: false,
      load: () => fetchBorderFile(snapshot.file),
    };
    realSources.set(snapshot.file, source);
  }
  return source;
}

function toTerritories(source: BorderSource, raw: BorderCollection): Territories {
  if (raw?.type !== "FeatureCollection" || !Array.isArray(raw.features)) {
    throw new Error(`Border source ${source.key} is not a FeatureCollection`);
  }

  const present = new Set<string>();
  const features: Territories["collection"]["features"] = [];
  for (const feature of raw.features) {
    const polityId = feature.properties?.polityId;
    const polity = polityId ? getPolity(polityId) : undefined;
    if (!polity) {
      console.warn(
        `Border source ${source.key}: skipped a feature with unknown polityId`,
        polityId,
      );
      continue;
    }
    present.add(polity.id);
    features.push({
      type: "Feature",
      geometry: feature.geometry,
      properties: { polityId: polity.id, color: polity.color },
    });
  }

  return {
    collection: { type: "FeatureCollection", features },
    polityIds: polities.map((polity) => polity.id).filter((id) => present.has(id)),
  };
}

const loads = new Map<string, Promise<Territories>>();

/** Loads and prepares a border source. Results are cached; failures are not. */
export function loadTerritories(source: BorderSource): Promise<Territories> {
  let pending = loads.get(source.key);
  if (!pending) {
    pending = source.load().then((raw) => toTerritories(source, raw));
    pending.catch(() => loads.delete(source.key));
    loads.set(source.key, pending);
  }
  return pending;
}
