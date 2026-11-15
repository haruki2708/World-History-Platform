// Builds the border snapshots from the hand-drawn source in scripts/borders/.
//
// Usage:
//   node scripts/build-borders.mjs          write public/data/borders/*.geojson
//                                           and src/data/border-snapshots.json
//   node scripts/build-borders.mjs --check  only run the checks, write nothing
//
// The source describes every territory as rings built from shared, named
// border lines ("arcs") and inline points, so a border drawn once is reused
// by both neighbours and by every snapshot (see docs/data/BORDERS.md).
//
// Checks, using the base map (public/map/basemap.json) as the land mask:
//   - no two territories overlap on land (overlaps at sea are hidden by the
//     water layer and are allowed);
//   - every polity exists in polities.json and existed in the snapshot year;
//   - every snapshot lists at least one source.
// No dependencies.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { arcs } from "./borders/arcs.mjs";
import { snapshots } from "./borders/snapshots.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bordersDir = join(root, "public", "data", "borders");
const catalogPath = join(root, "src", "data", "border-snapshots.json");
const basemapPath = join(root, "public", "map", "basemap.json");
const politiesPath = join(root, "src", "data", "polities.json");

/** Decimal places kept in the output (0.001° is about 100 m). */
const PRECISION = 3;
/** Cell size of the land-overlap check, in degrees. */
const CELL = 0.05;
/** Simplification of island coastlines taken from the base map, in degrees. */
const ISLAND_TOLERANCE = 0.004;
/** A `coast` end point must lie this close to the base map's coastline. */
const COAST_SNAP = 0.05;
/** [west, south, east, north] of the base map. */
const REGION = [-40, 5, 80, 70];

const checkOnly = process.argv.includes("--check");
const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

// ---------------------------------------------------------------------------
// Geometry from the source

const round = (value) => Number(value.toFixed(PRECISION));

function arcPoints(name, where) {
  const reversed = name.startsWith("-");
  const key = reversed ? name.slice(1) : name;
  const points = arcs[key];
  if (!points) {
    fail(where, `unknown arc "${key}"`);
    return [];
  }
  return reversed ? points.slice().reverse() : points;
}

/**
 * The base map's coastline from the vertex nearest `from` to the vertex
 * nearest `to`, along the shorter way round the ring that holds both.
 */
let coastRings;
function coastPoints([from, to], where) {
  if (!coastRings) {
    const basemap = JSON.parse(readFileSync(basemapPath, "utf8"));
    coastRings = basemap.features
      .filter((feature) => feature.properties?.kind === "ocean")
      .flatMap((feature) => polygonsOf(feature.geometry))
      .flat();
  }
  const nearest = (point) => {
    let best = { distance: Infinity };
    coastRings.forEach((ring, r) => {
      ring.forEach(([x, y], i) => {
        const distance = Math.hypot(x - point[0], y - point[1]);
        if (distance < best.distance) best = { distance, r, i };
      });
    });
    return best;
  };
  const a = nearest(from);
  const b = nearest(to);
  if (a.distance > COAST_SNAP || b.distance > COAST_SNAP || a.r !== b.r) {
    fail(where, `coast [${from}] to [${to}] is not on one coastline`);
    return [];
  }
  const ring = coastRings[a.r].slice(0, -1);
  const n = ring.length;
  const forward = (b.i - a.i + n) % n;
  const steps = Math.min(forward, n - forward);
  const direction = forward <= n - forward ? 1 : -1;
  const path = [];
  for (let k = 0; k <= steps; k++) path.push(ring[(a.i + direction * k + n) % n]);
  return simplifyLine(path, ISLAND_TOLERANCE);
}

/**
 * Expands a ring into positions. Pieces: [lng, lat]; "arc-name" or
 * "-arc-name" (reversed); { coast: [from, to] } for a stretch of coastline.
 */
function expandRing(pieces, where) {
  const ring = [];
  for (const piece of pieces) {
    const points =
      typeof piece === "string"
        ? arcPoints(piece, where)
        : piece.coast
          ? coastPoints(piece.coast, where)
          : [piece];
    for (const point of points) {
      const position = [round(point[0]), round(point[1])];
      const last = ring[ring.length - 1];
      if (last && last[0] === position[0] && last[1] === position[1]) continue;
      ring.push(position);
    }
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([...first]);
  }
  if (ring.length < 4) fail(where, "a ring needs at least three distinct points");
  return ring;
}

function signedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return sum / 2;
}

/** RFC 7946: outer rings counter-clockwise, holes clockwise. */
function orient(ring, outer) {
  const ccw = signedArea(ring) > 0;
  return ccw === outer ? ring : ring.slice().reverse();
}

/** Douglas–Peucker simplification of an open polyline. */
function simplifyLine(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1e-12;
  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const distance = Math.abs((by - ay) * x - (bx - ax) * y + bx * ay - by * ax) / length;
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }
  if (farthest <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplifyLine(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplifyLine(points.slice(index), tolerance),
  ];
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Islands are the holes of the base map's ocean polygons (Natural Earth). */
let islandRings;
function islandAt(point, where) {
  if (!islandRings) {
    const basemap = JSON.parse(readFileSync(basemapPath, "utf8"));
    islandRings = basemap.features
      .filter((feature) => feature.properties?.kind === "ocean")
      .flatMap((feature) => polygonsOf(feature.geometry))
      .flatMap((polygon) => polygon.slice(1));
  }
  const matches = islandRings.filter((ring) => pointInRing(point, ring));
  if (matches.length !== 1) {
    fail(where, `no single island contains [${point}] (found ${matches.length})`);
    return [];
  }
  // Split the closed ring in two so both halves keep their end points.
  const ring = matches[0];
  const half = Math.floor(ring.length / 2);
  return [
    ...simplifyLine(ring.slice(0, half + 1), ISLAND_TOLERANCE).slice(0, -1),
    ...simplifyLine(ring.slice(half), ISLAND_TOLERANCE),
  ];
}

/**
 * A feature's `polygons` is a list of polygons. A polygon is a ring (list of
 * pieces), `{ outer, holes }`, or `{ island: [lng, lat] }` for the whole
 * island of the base map that contains that point.
 */
function buildGeometry(feature, where) {
  const polygons = feature.polygons.map((polygon, index) => {
    const at = `${where}, polygon ${index}`;
    if (polygon.island) return [orient(expandRing(islandAt(polygon.island, at), at), true)];
    const outer = Array.isArray(polygon) ? polygon : polygon.outer;
    const holes = Array.isArray(polygon) ? [] : (polygon.holes ?? []);
    return [
      orient(expandRing(outer, at), true),
      ...holes.map((hole) => orient(expandRing(hole, at), false)),
    ];
  });
  return polygons.length === 1
    ? { type: "Polygon", coordinates: polygons[0] }
    : { type: "MultiPolygon", coordinates: polygons };
}

// ---------------------------------------------------------------------------
// Raster check: scanline fill on a regular grid

const [west, south, east, north] = REGION;
const cols = Math.round((east - west) / CELL);
const rows = Math.round((north - south) / CELL);
const cellX = (i) => west + (i + 0.5) * CELL;
const cellY = (j) => south + (j + 0.5) * CELL;
const cellLabel = (index) =>
  `[${cellX(index % cols).toFixed(2)}, ${cellY(Math.floor(index / cols)).toFixed(2)}]`;

/**
 * Calls `visit(cellIndex)` for every cell whose centre is inside the rings
 * (even-odd). Edges are always walked from their lower end and intervals are
 * half-open, so a cell centre on an edge shared by two territories is given
 * to exactly one of them.
 */
function rasterize(rings, visit) {
  const crossings = new Map();
  for (const ring of rings) {
    for (let k = 0; k < ring.length - 1; k++) {
      let [x1, y1] = ring[k];
      let [x2, y2] = ring[k + 1];
      if (y1 === y2) continue;
      if (y1 > y2) [x1, y1, x2, y2] = [x2, y2, x1, y1];
      const firstRow = Math.max(0, Math.ceil((y1 - south) / CELL - 0.5));
      const lastRow = Math.min(rows - 1, Math.ceil((y2 - south) / CELL - 0.5) - 1);
      for (let j = firstRow; j <= lastRow; j++) {
        const y = cellY(j);
        const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1);
        let list = crossings.get(j);
        if (!list) crossings.set(j, (list = []));
        list.push(x);
      }
    }
  }
  const column = (x) => Math.ceil((x - west) / CELL - 0.5);
  for (const [j, list] of crossings) {
    list.sort((a, b) => a - b);
    for (let k = 0; k + 1 < list.length; k += 2) {
      const from = Math.max(0, column(list[k]));
      const to = Math.min(cols - 1, column(list[k + 1]) - 1);
      for (let i = from; i <= to; i++) visit(j * cols + i);
    }
  }
}

function polygonsOf(geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

function buildWaterMask() {
  const basemap = JSON.parse(readFileSync(basemapPath, "utf8"));
  const water = new Uint8Array(cols * rows);
  for (const feature of basemap.features) {
    if (feature.properties?.kind === "river") continue;
    for (const polygon of polygonsOf(feature.geometry)) {
      rasterize(polygon, (cell) => {
        water[cell] = 1;
      });
    }
  }
  return water;
}

function checkLandOverlaps(where, features, water) {
  const owner = new Int32Array(cols * rows).fill(-1);
  const parts = [];
  const clashes = new Map();
  features.forEach((feature) => {
    polygonsOf(feature.geometry).forEach((polygon, index) => {
      const part = parts.push(`${feature.properties.polityId}#${index}`) - 1;
      rasterize(polygon, (cell) => {
        if (water[cell]) return;
        if (owner[cell] === -1) {
          owner[cell] = part;
          return;
        }
        const key = `${parts[owner[cell]]} and ${parts[part]}`;
        const clash = clashes.get(key) ?? { count: 0, at: cellLabel(cell) };
        clash.count += 1;
        clashes.set(key, clash);
      });
    });
  });
  for (const [key, clash] of clashes) {
    fail(where, `${key} overlap on land in ${clash.count} cells, e.g. at ${clash.at}`);
  }
  // Land area per polity, as a rough sanity figure (cells of CELL degrees).
  const area = new Map();
  for (let cell = 0; cell < owner.length; cell++) {
    if (owner[cell] === -1) continue;
    const polityId = parts[owner[cell]].split("#")[0];
    const lat = cellY(Math.floor(cell / cols));
    const km2 = (CELL * 111.32) ** 2 * Math.cos((lat * Math.PI) / 180);
    area.set(polityId, (area.get(polityId) ?? 0) + km2);
  }
  return area;
}

// ---------------------------------------------------------------------------

const polities = new Map(
  JSON.parse(readFileSync(politiesPath, "utf8")).map((polity) => [polity.id, polity]),
);
const water = buildWaterMask();
const catalog = [];
const outputs = [];

for (const snapshot of [...snapshots].sort((a, b) => a.year - b.year)) {
  const where = `snapshot ${snapshot.year}`;
  if (!Array.isArray(snapshot.sources) || snapshot.sources.length === 0) {
    fail(where, "needs at least one source");
  }
  const seen = new Set();
  const features = snapshot.features.map((feature) => {
    const at = `${where}, ${feature.polityId}`;
    const polity = polities.get(feature.polityId);
    if (!polity) {
      fail(at, "unknown polityId");
    } else {
      if (polity.startYear !== undefined && snapshot.year < polity.startYear) {
        fail(at, `polity starts in ${polity.startYear}`);
      }
      if (polity.endYear !== undefined && snapshot.year > polity.endYear) {
        fail(at, `polity ended in ${polity.endYear}`);
      }
    }
    if (seen.has(feature.polityId)) fail(at, "listed twice; merge its polygons");
    seen.add(feature.polityId);
    return {
      type: "Feature",
      properties: { polityId: feature.polityId },
      geometry: buildGeometry(feature, at),
    };
  });

  const area = checkLandOverlaps(where, features, water);
  const file = `${snapshot.year}.geojson`;
  catalog.push({ year: snapshot.year, file, sources: snapshot.sources });
  const text = `{"type":"FeatureCollection","features":[\n${features
    .map((feature) => JSON.stringify(feature))
    .join(",\n")}\n]}\n`;
  outputs.push({ file, text });

  const summary = [...area]
    .sort((a, b) => b[1] - a[1])
    .map(([id, km2]) => `${id} ${Math.round(km2).toLocaleString("en")}`)
    .join(", ");
  console.log(`${snapshot.year}: ${(text.length / 1024).toFixed(1)} KB; land km²: ${summary}`);
}

if (errors.length > 0) {
  console.error(`Border build failed:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (!checkOnly) {
  mkdirSync(bordersDir, { recursive: true });
  for (const { file, text } of outputs) writeFileSync(join(bordersDir, file), text);
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Wrote ${outputs.length} border files and border-snapshots.json.`);
} else {
  console.log("Checks passed; nothing written (--check).");
}
