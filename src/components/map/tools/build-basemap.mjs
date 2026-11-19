// Builds public/map/basemap.json from Natural Earth 1:10m data (public domain).
//
// Usage:
//   node src/components/map/tools/build-basemap.mjs <dir-with-natural-earth-geojson>
//
// The directory must hold these files from
// https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
//   ne_10m_ocean.geojson
//   ne_10m_lakes.geojson
//   ne_10m_lakes_europe.geojson
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

/**
 * The lakes taken from Natural Earth's European supplement
 * (ne_10m_lakes_europe), by its stable `ne_id`. The supplement holds the
 * smaller lakes that ne_10m_lakes leaves out, Lake Trasimene among them. Its
 * classes do not tell natural lakes from dam lakes (La Serena, Kremasta and
 * Lake Assad are all "Lake") and half its lakes have no name, so it is not
 * filtered but picked from: natural lakes and lagoons that already held water
 * in antiquity, checked one by one between 11° W and 45° E, 30° N and 53° N
 * (T-056). Lakes outside that window are not used. The build stops if an id
 * goes missing, so a new Natural Earth release cannot drop a lake silently.
 */
const EUROPE_LAKES = new Map([
  // Iberia and Gaul
  [1159110139, "Albufera de València"],
  [1159109319, "Lac de Grand-Lieu"],
  [1159109491, "Étang de Biscarrosse et de Parentis"],
  [1159109503, "Étang de Cazaux et de Sanguinet"],
  [1159109561, "Lac d'Hourtin-Carcans"],
  [1159109927, "Étang de Thau"],
  [1159109843, "Étang de Vaccarès"],
  [1159109573, "Lac du Bourget"],
  [1159109391, "Lac d'Annecy"],
  // The Alps
  [1159109265, "Lake Neuchâtel"],
  [1159109277, "Lake Murten"],
  [1159109183, "Lake Biel"],
  [1159109425, "Lake Thun"],
  [1159109411, "Lake Brienz"],
  [1159109311, "Lake Lucerne"],
  [1159109167, "Lake Zug"],
  [1159109215, "Lake Zurich"],
  [1159109157, "Walensee"],
  [1159109403, "Lake Lugano"],
  [1159109333, "Lake Como"],
  [1159109535, "Lake Iseo"],
  [1159109071, "Starnberger See"],
  [1159109123, "Ammersee"],
  [1159109053, "Chiemsee"],
  [1159109063, "Attersee"],
  [1159109095, "Traunsee"],
  [1159109357, "Wörthersee"],
  // Italy and the Adriatic
  [1159109725, "Lake Trasimene"],
  [1159109787, "Lake Bracciano"],
  [1159110217, "Lago di Lesina"],
  [1159110185, "Lago di Varano"],
  [1159110151, "Salpi lagoon (Salapia), now salt pans"],
  [1159109521, "Vransko jezero"],
  [1159109881, "Prokljansko jezero"],
  // Pannonia and the lower Danube
  [1159109133, "Lake Neusiedl"],
  [1159109463, "Lacul Bistreț"],
  [1159109545, "Lacul Oltina"],
  [1159109297, "Lacul Brateș"],
  [1159109243, "Lake Manta"],
  [1159109255, "Lake Kagul"],
  [1159109193, "Lakes Yalpug and Kugurlui"],
  [1159109205, "Lake Katlabukh"],
  [1159109227, "Lake Kytai"],
  [1159109287, "Danube delta lake"],
  [1159109363, "Lacul Dranov"],
  [1159109443, "Lacul Isacov"],
  [1159109339, "Lacul Babadag"],
  [1159109381, "Lacul Tașaul"],
  // Greece and Thrace
  [1159109967, "Lake Pamvotis (Ioannina)"],
  [1159110053, "Lake Orestiada (Kastoria)"],
  [1159110327, "Lake Trichonida"],
  [1159110285, "Lake Vegoritida"],
  [1159110197, "Lake Dojran"],
  [1159110175, "Lake Koroneia"],
  [1159110165, "Lake Volvi"],
  [1159110383, "Lake Yliki"],
  [1159109761, "Lake Vistonida"],
  [1159109869, "Lake Burgas (Vaya)"],
  [1159109941, "Lake Mandra"],
  // Anatolia
  [1159109697, "Lake Terkos (Durusu)"],
  [1159109805, "Lake İznik"],
  [1159115637, "Lake Sapanca"],
  [1159110271, "Lake Uluabat"],
  [1159110241, "Lake Manyas (Kuş)"],
  [1159109995, "Lake Marmara (the Gygaean lake)"],
  // In antiquity the sea (the Gulf of Latmus): water there either way.
  [1159110343, "Lake Bafa"],
  [1159110367, "Lake Köyceğiz"],
  [1159115871, "Lake Salda"],
  [1159115845, "Lake Acıgöl"],
  [1159115763, "Lake Işıklı"],
  [1159115851, "Lake Burdur"],
  [1159115815, "Lake Akşehir"],
  [1159115743, "Lake Eber"],
  [1159115797, "Salt lake of the Konya basin"],
  [1159115705, "Lake Seyfe"],
  [1159115929, "Lake Yay"],
  [1159116017, "Lake Hazar"],
  [1159115977, "Lake Nazik"],
  [1159116107, "Lake Erçek"],
  [1159115581, "Lake Balık"],
  [1159115467, "Lake Çıldır"],
  [1159115491, "Lake Aktaş"],
  [1159115411, "Lake Paravani"],
  // Syria
  [1159116159, "Sabkhat al-Jabbul"],
  [1159116245, "Sabkhat al-Jabbul (south basin)"],
  // The north coast of the Black Sea and the Sea of Azov
  [1159115191, "Kuchurhan liman"],
  [1159115311, "Khadzhibey liman"],
  [1159115331, "Kuyalnik liman"],
  [1159112611, "Tiligul liman"],
  [1159115451, "Lake Sasyk-Sivash"],
  [1159115245, "Perekop lakes"],
  [1159115297, "Perekop lakes"],
  [1159115349, "Perekop lakes"],
  [1159115371, "Perekop lakes"],
  [1159114921, "Molochnyi liman"],
  [1159115221, "Lake Aktash"],
  [1159115127, "Lake Uzunlar"],
  [1159115173, "Lake Tobechik"],
  [1159115257, "Kiziltash liman"],
  [1159115147, "Vityazevo liman"],
  [1159115039, "Akhtanizovsky liman"],
  [1159115111, "Kuban delta liman"],
  [1159114965, "Kuban delta liman"],
  [1159114947, "Akhtarsky liman"],
  [1159114837, "Beysug liman"],
  [1159114621, "Lake Manych-Gudilo"],
  // North of the Roman world
  [1159108593, "Lough Leane"],
  [1159108757, "Steinhuder Meer"],
  [1159108743, "Lake Gopło"],
  [1159108777, "Lake Svitiaz"],
]);

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
  const add = (feature) => {
    for (const rings of polygonsOf(feature.geometry)) {
      const outer = processRing(rings[0]);
      if (!outer) continue;
      polygons.push([outer, ...rings.slice(1).map(processRing).filter(Boolean)]);
    }
  };
  for (const feature of read("ne_10m_lakes.geojson").features) {
    const { featurecla, name } = feature.properties;
    if (featurecla === "Reservoir" || MODERN_LAKES.has(name)) continue;
    add(feature);
  }
  // After the main lakes, so those come out exactly as before.
  const found = new Set();
  for (const feature of read("ne_10m_lakes_europe.geojson").features) {
    const id = feature.properties.ne_id;
    if (!EUROPE_LAKES.has(id)) continue;
    found.add(id);
    add(feature);
  }
  const missing = [...EUROPE_LAKES].filter(([id]) => !found.has(id));
  if (missing.length > 0) {
    const list = missing.map(([id, name]) => `${name} (${id})`).join(", ");
    throw new Error(`Not in ne_10m_lakes_europe any more: ${list}`);
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
