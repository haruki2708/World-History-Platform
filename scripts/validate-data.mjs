// Validates the historical data set. Run: node scripts/validate-data.mjs
// Exits with a non-zero code when anything is wrong.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src", "data");
const bordersDir = join(root, "public", "data", "borders");

const YEAR_MIN = -509;
const YEAR_MAX = -27;
const MAX_GAP_YEARS = 25;
const LOCALES = ["en", "vi"];
const CATEGORIES = ["political", "military", "social", "cultural"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
// The area the base map covers: [west, south, east, north].
const MAP_BOUNDS = [-40, 5, 80, 70];

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(file, `cannot be read as JSON (${error.message})`);
    return null;
  }
}

function isYear(value) {
  return Number.isInteger(value) && value !== 0;
}

function checkLocalized(where, field, value) {
  if (typeof value !== "object" || value === null) {
    fail(where, `${field} must be an object with ${LOCALES.join(" and ")}`);
    return;
  }
  for (const locale of LOCALES) {
    if (typeof value[locale] !== "string" || value[locale].trim() === "") {
      fail(where, `${field}.${locale} is missing or empty`);
    }
  }
}

function checkSources(where, sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    fail(where, "needs at least one source");
    return;
  }
  sources.forEach((source, index) => {
    if (typeof source?.title !== "string" || source.title.trim() === "") {
      fail(where, `sources[${index}].title is missing or empty`);
    }
    if (source?.url !== undefined && !/^https:\/\//.test(source.url)) {
      fail(where, `sources[${index}].url must start with https://`);
    }
  });
}

function inBounds(lng, lat) {
  const [west, south, east, north] = MAP_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

// ---------------------------------------------------------------------------
// Polities

const polities = readJson(join(dataDir, "polities.json")) ?? [];
const polityIds = new Set();
const colors = new Map();

for (const polity of polities) {
  const where = `polity ${polity?.id ?? "(no id)"}`;
  if (typeof polity?.id !== "string" || !SLUG.test(polity.id)) {
    fail(where, "id must be kebab-case");
    continue;
  }
  if (polityIds.has(polity.id)) fail(where, "duplicate id");
  polityIds.add(polity.id);
  checkLocalized(where, "name", polity.name);
  if (typeof polity.color !== "string" || !HEX_COLOR.test(polity.color)) {
    fail(where, "color must be a #rrggbb hex value");
  } else {
    const key = polity.color.toLowerCase();
    if (colors.has(key)) fail(where, `shares its colour with ${colors.get(key)}`);
    colors.set(key, polity.id);
  }
  for (const field of ["startYear", "endYear"]) {
    if (polity[field] !== undefined && !isYear(polity[field])) {
      fail(where, `${field} must be a non-zero integer`);
    }
  }
  if (
    polity.startYear !== undefined &&
    polity.endYear !== undefined &&
    polity.endYear < polity.startYear
  ) {
    fail(where, "endYear is before startYear");
  }
}

// ---------------------------------------------------------------------------
// Events

const events = readJson(join(dataDir, "events.json")) ?? [];
const eventIds = new Set();
const usedPolities = new Set();

for (const event of events) {
  const where = `event ${event?.id ?? "(no id)"}`;
  if (typeof event?.id !== "string" || !SLUG.test(event.id)) {
    fail(where, "id must be kebab-case");
    continue;
  }
  if (eventIds.has(event.id)) fail(where, "duplicate id");
  eventIds.add(event.id);

  if (!isYear(event.year) || event.year < YEAR_MIN || event.year > YEAR_MAX) {
    fail(where, `year must be an integer in [${YEAR_MIN}, ${YEAR_MAX}]`);
  }
  if (event.endYear !== undefined) {
    if (!isYear(event.endYear) || event.endYear > YEAR_MAX) {
      fail(where, `endYear must be an integer no later than ${YEAR_MAX}`);
    } else if (event.endYear < event.year) {
      fail(where, "endYear is before year");
    }
  }

  checkLocalized(where, "title", event.title);
  checkLocalized(where, "summary", event.summary);

  if (!CATEGORIES.includes(event.category)) {
    fail(where, `category must be one of ${CATEGORIES.join(", ")}`);
  }
  if (![1, 2, 3].includes(event.importance)) {
    fail(where, "importance must be 1, 2 or 3");
  }

  if (!Array.isArray(event.polityIds) || event.polityIds.length === 0) {
    fail(where, "needs at least one polityId");
  } else {
    for (const id of event.polityIds) {
      usedPolities.add(id);
      if (!polityIds.has(id)) fail(where, `unknown polityId "${id}"`);
    }
  }

  if (event.location !== undefined) {
    const { name, lng, lat, approximate } = event.location ?? {};
    checkLocalized(where, "location.name", name);
    if (typeof lng !== "number" || typeof lat !== "number") {
      fail(where, "location needs numeric lng and lat");
    } else if (!inBounds(lng, lat)) {
      fail(where, `location [${lng}, ${lat}] is outside the map area`);
    }
    if (approximate !== undefined && typeof approximate !== "boolean") {
      fail(where, "location.approximate must be true or false");
    }
  }

  checkSources(where, event.sources);
}

// No stretch of the timeline may be left without an event starting in it.
const startYears = [...new Set(events.map((event) => event.year))]
  .filter(isYear)
  .sort((a, b) => a - b);
const marks = [YEAR_MIN, ...startYears, YEAR_MAX];
for (let i = 1; i < marks.length; i++) {
  const gap = marks[i] - marks[i - 1];
  if (gap > MAX_GAP_YEARS) {
    fail(
      "timeline",
      `${gap} years without an event between ${marks[i - 1]} and ${marks[i]}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Border snapshots
//
// A polity must be used by at least one event or at least one border file
// (some, such as Persia, appear only on the map); checked once the border
// files have been read, below.

const snapshots = readJson(join(dataDir, "border-snapshots.json")) ?? [];
const listedFiles = new Set();

function checkRing(where, ring) {
  if (!Array.isArray(ring) || ring.length < 4) {
    fail(where, "a polygon ring needs at least 4 positions");
    return;
  }
  for (const position of ring) {
    const [lng, lat] = position ?? [];
    if (typeof lng !== "number" || typeof lat !== "number") {
      fail(where, "a position must be [lng, lat]");
      return;
    }
    if (!inBounds(lng, lat)) {
      fail(where, `position [${lng}, ${lat}] is outside the map area`);
      return;
    }
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    fail(where, "a polygon ring must end where it starts");
  }
}

for (const snapshot of snapshots) {
  const where = `border snapshot ${snapshot?.year ?? "(no year)"}`;
  if (!isYear(snapshot?.year) || snapshot.year < YEAR_MIN || snapshot.year > YEAR_MAX) {
    fail(where, `year must be an integer in [${YEAR_MIN}, ${YEAR_MAX}]`);
  }
  checkSources(where, snapshot?.sources);
  if (typeof snapshot?.file !== "string" || !snapshot.file.endsWith(".geojson")) {
    fail(where, "file must be a .geojson file name");
    continue;
  }
  if (listedFiles.has(snapshot.file)) fail(where, `file ${snapshot.file} is listed twice`);
  listedFiles.add(snapshot.file);

  const path = join(bordersDir, snapshot.file);
  if (!existsSync(path)) {
    fail(where, `file ${snapshot.file} does not exist in public/data/borders`);
    continue;
  }
  const collection = readJson(path);
  if (!collection) continue;
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    fail(where, "file must be a GeoJSON FeatureCollection");
    continue;
  }
  if (collection.features.length === 0) fail(where, "file has no features");
  collection.features.forEach((feature, index) => {
    const at = `${where}, feature ${index}`;
    const polityId = feature?.properties?.polityId;
    if (!polityIds.has(polityId)) fail(at, `unknown polityId "${polityId}"`);
    usedPolities.add(polityId);
    const geometry = feature?.geometry;
    if (geometry?.type === "Polygon") {
      geometry.coordinates.forEach((ring) => checkRing(at, ring));
    } else if (geometry?.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) =>
        polygon.forEach((ring) => checkRing(at, ring)),
      );
    } else {
      fail(at, "geometry must be a Polygon or MultiPolygon");
    }
  });
}

if (existsSync(bordersDir)) {
  for (const file of readdirSync(bordersDir)) {
    if (file.endsWith(".geojson") && !listedFiles.has(file)) {
      fail(`public/data/borders/${file}`, "is not listed in border-snapshots.json");
    }
  }
}

for (const id of polityIds) {
  if (!usedPolities.has(id)) {
    fail(`polity ${id}`, "is not used by any event or border file");
  }
}

// ---------------------------------------------------------------------------

const counts = `${events.length} events, ${polities.length} polities, ${snapshots.length} border snapshots`;
if (errors.length > 0) {
  console.error(`Data validation failed (${counts}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log(`Data is valid: ${counts}.`);
