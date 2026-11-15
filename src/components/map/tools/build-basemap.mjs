// Builds public/map/basemap.json from Natural Earth 1:10m data (public domain).
//
// Usage:
//   node src/components/map/tools/build-basemap.mjs <dir-with-natural-earth-geojson>
//
// The directory must hold these files from
// https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
//   ne_10m_ocean.geojson
//   ne_10m_lakes.geojson
//   ne_10m_rivers_lake_centerlines.geojson
//
// Output: one FeatureCollection with `properties.kind` = "ocean" | "lake" |
// "river" (rivers also carry `rank`, Natural Earth's scalerank). Everything is
// clipped to REGION, simplified and rounded to keep the file small. Modern
// features (reservoirs, canals) are dropped. No dependencies.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** [west, south, east, north]. Keep in sync with DATA_BOUNDS in mapStyle.ts. */
const REGION = [-40, 5, 80, 70];
/** Simplification tolerance in degrees (about 2 px at the map's max zoom). */
const TOLERANCE = 0.006;
/** Islands and lakes smaller than this (square degrees, ~1 km²) are dropped. */
const MIN_AREA = 0.0001;
const MAX_RIVER_RANK = 9;
const MODERN_WATERWAY = /canal|csatorna|kanal|channel/i;
/** Flooded by the Suez Canal; dry salt basins in antiquity. */
const MODERN_LAKES = new Set(["Great Bitter Lake", "Little Bitter Lake"]);

const [west, south, east, north] = REGION;
const inputDir = process.argv[2];
if (!inputDir) {
  console.error("Usage: node build-basemap.mjs <natural-earth-geojson-dir>");
  process.exit(1);
}
const here = dirname(fileURLToPath(import.meta.url));
const outputPath = join(here, "../../../../public/map/basemap.json");

function read(name) {
  return JSON.parse(readFileSync(join(inputDir, name), "utf8"));
}

function polygonsOf(geometry) {
  if (!geometry) return [];
  return geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;
}

function linesOf(geometry) {
  if (!geometry) return [];
  return geometry.type === "LineString"
    ? [geometry.coordinates]
    : geometry.coordinates;
}

/** Sutherland–Hodgman clip of a closed ring against REGION. */
function clipRing(ring) {
  let points = ring.slice(0, -1);
  const edges = [
    { inside: (p) => p[0] >= west, cut: (a, b) => cutX(a, b, west) },
    { inside: (p) => p[0] <= east, cut: (a, b) => cutX(a, b, east) },
    { inside: (p) => p[1] >= south, cut: (a, b) => cutY(a, b, south) },
    { inside: (p) => p[1] <= north, cut: (a, b) => cutY(a, b, north) },
  ];
  for (const { inside, cut } of edges) {
    const output = [];
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const previous = points[(i + points.length - 1) % points.length];
      if (inside(current)) {
        if (!inside(previous)) output.push(cut(previous, current));
        output.push(current);
      } else if (inside(previous)) {
        output.push(cut(previous, current));
      }
    }
    points = output;
    if (points.length === 0) return null;
  }
  points.push(points[0]);
  return points;
}

function cutX(a, b, x) {
  return [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
}

function cutY(a, b, y) {
  return [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2);
}

function segmentDistanceSq(p, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/** Iterative Douglas–Peucker on an open line. */
function simplifyLine(points, tolerance) {
  if (points.length <= 2) return points;
  const toleranceSq = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let maxDistance = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const distance = segmentDistanceSq(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > toleranceSq) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplifies a closed ring by splitting it at its two most distant ends. */
function simplifyRing(ring, tolerance) {
  const points = ring.slice(0, -1);
  let far = 0;
  let farDistance = -1;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[0][0];
    const dy = points[i][1] - points[0][1];
    if (dx * dx + dy * dy > farDistance) {
      farDistance = dx * dx + dy * dy;
      far = i;
    }
  }
  const firstHalf = simplifyLine(points.slice(0, far + 1), tolerance);
  const secondHalf = simplifyLine([...points.slice(far), points[0]], tolerance);
  return [...firstHalf, ...secondHalf.slice(1)];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function roundPoints(points) {
  const output = [];
  for (const [x, y] of points) {
    const point = [round(x), round(y)];
    const previous = output[output.length - 1];
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      output.push(point);
    }
  }
  return output;
}

/** Clip, simplify and round one ring; null when nothing worth keeping is left. */
function processRing(ring) {
  const clipped = clipRing(ring);
  if (!clipped || clipped.length < 4 || ringArea(clipped) < MIN_AREA) return null;
  for (const tolerance of [TOLERANCE, TOLERANCE / 4, 0]) {
    const simplified =
      tolerance > 0 ? simplifyRing(clipped, tolerance) : clipped;
    const rounded = roundPoints(simplified);
    if (rounded.length >= 4 && ringArea(rounded) >= MIN_AREA / 2) return rounded;
  }
  return null;
}

function isRegionRectangle(ring) {
  return Math.abs(ringArea(ring) - (east - west) * (north - south)) < 1e-6;
}

function buildOcean() {
  const polygons = [];
  for (const feature of read("ne_10m_ocean.geojson").features) {
    for (const rings of polygonsOf(feature.geometry)) {
      const outer = processRing(rings[0]);
      if (!outer) continue;
      const holes = rings.slice(1).map(processRing).filter(Boolean);
      if (isRegionRectangle(outer)) {
        // The open sea fills the whole region. Push its outer ring out a
        // little so land rings cut at the region edge sit strictly inside.
        const pad = 2;
        polygons.push([
          [
            [west - pad, south - pad],
            [east + pad, south - pad],
            [east + pad, north + pad],
            [west - pad, north + pad],
            [west - pad, south - pad],
          ],
          ...holes,
        ]);
      } else {
        polygons.push([outer, ...holes]);
      }
    }
  }
  return polygons;
}

function buildLakes() {
  const polygons = [];
  for (const feature of read("ne_10m_lakes.geojson").features) {
    const { featurecla, name } = feature.properties;
    if (featurecla === "Reservoir" || MODERN_LAKES.has(name)) continue;
    for (const rings of polygonsOf(feature.geometry)) {
      const outer = processRing(rings[0]);
      if (!outer) continue;
      polygons.push([outer, ...rings.slice(1).map(processRing).filter(Boolean)]);
    }
  }
  return polygons;
}

/** Rivers grouped by rank; points outside the region split a line. */
function buildRivers() {
  const byRank = new Map();
  const inside = ([x, y]) => x >= west && x <= east && y >= south && y <= north;
  for (const feature of read("ne_10m_rivers_lake_centerlines.geojson").features) {
    const { scalerank, name } = feature.properties;
    if (scalerank > MAX_RIVER_RANK || MODERN_WATERWAY.test(name ?? "")) continue;
    for (const line of linesOf(feature.geometry)) {
      let run = [];
      const flush = () => {
        const rounded = roundPoints(simplifyLine(run, TOLERANCE));
        if (rounded.length >= 2) {
          if (!byRank.has(scalerank)) byRank.set(scalerank, []);
          byRank.get(scalerank).push(rounded);
        }
        run = [];
      };
      for (const point of line) {
        if (inside(point)) run.push(point);
        else flush();
      }
      flush();
    }
  }
  return [...byRank.entries()].sort((a, b) => a[0] - b[0]);
}

const features = [
  {
    type: "Feature",
    properties: { kind: "ocean" },
    geometry: { type: "MultiPolygon", coordinates: buildOcean() },
  },
  {
    type: "Feature",
    properties: { kind: "lake" },
    geometry: { type: "MultiPolygon", coordinates: buildLakes() },
  },
  ...buildRivers().map(([rank, lines]) => ({
    type: "Feature",
    properties: { kind: "river", rank },
    geometry: { type: "MultiLineString", coordinates: lines },
  })),
];

const json = JSON.stringify({ type: "FeatureCollection", features });
writeFileSync(outputPath, json);

for (const feature of features) {
  const parts = feature.geometry.coordinates;
  console.log(
    `${feature.properties.kind}${feature.properties.rank ?? ""}: ${parts.length} parts`,
  );
}
console.log(`${outputPath}: ${(json.length / 1024).toFixed(0)} kB`);
