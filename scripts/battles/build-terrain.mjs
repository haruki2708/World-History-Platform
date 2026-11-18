// Builds the elevation grid of a 3D battle (see BattleTerrain in src/lib/battle.ts)
// from GeoTIFF elevation tiles kept outside the repo. No npm dependencies.
//
//   node scripts/battles/build-terrain.mjs                       # writes public/data/terrain/battle-of-cannae.bin
//                                                                # and battle-of-cannae-far.bin (the country around)
//   node scripts/battles/build-terrain.mjs --preview out.png     # also writes a shaded relief image
//   node scripts/battles/build-terrain.mjs --trace "x,y;x,y;..." # prints the river channel through the points
//   node scripts/battles/build-terrain.mjs --source srtm         # build from the fallback source
//
// Preview and exploring options:
//   --phase n          draw the unit blocks at the end of phase n (0: the start) and its arrows
//   --range lo,hi      elevation range of the preview tint, metres
//   --extent minX,maxX,minY,maxY, --spacing m, --origin lng,lat
//                      look at other ground or at finer spacing; the grid is then not written
//
// The river of battle-of-cannae.json was traced with:
//   --trace "-5400,-2690;-4727,-2210;-3350,-1300;-2316,-728;-1482,-790;-1366,13;-670,785;-485,1248;-760,2990"
//
// Sources, both downloadable without an account (details and licences in
// docs/data/battles/cannae.md):
//
//   copernicus (default): Copernicus DEM GLO-30, public AWS bucket:
//     https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N41_00_E016_00_DEM/Copernicus_DSM_COG_10_N41_00_E016_00_DEM.tif
//     saved as <assets>\copernicus-glo30\N41E016.tif. The licence is
//     INFO/eula_F.pdf in the same folder of the bucket: free use, distribution
//     and modification, with this notice: "produced using Copernicus
//     WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH
//     2014-2018 provided under COPERNICUS by the European Union and ESA; all
//     rights reserved". The organisations in charge of the Copernicus programme
//     by law or by delegation do not incur any liability for any use of the
//     Copernicus WorldDEM-30.
//
//   srtm: SRTM GL1 (NASA/USGS, public domain) from OpenTopography's public bucket:
//     https://opentopography.s3.sdsc.edu/raster/SRTM_GL1/SRTM_GL1_srtm/N41E016.tif
//     saved as <assets>\srtm-gl1\N41E016.tif. Noisier (about ±2 m) on the flat
//     valley floor, where it does not show the river channel.
//
// <assets> is E:\World_History_Platform_assets\terrain, or TERRAIN_SOURCE_DIR.
//
// The far grid (BattleTerrain.far: the hills and the sea on the horizon) of
// Cannae reaches 54 km each way and needs three more Copernicus tiles, from
// the same bucket and under the same licence: N41E015, N40E015, N40E016.
// Each of its values is the mean of the ground around the grid point, so that
// a coarse grid does not pick out single peaks and pits.
//
// Output: Int16 little-endian, decimetres above sea level, rows north to south,
// columns west to east, first value at (minX, maxY). Grid points lie on the
// edges of the covered ground: column i is at x = minX + i * spacing.
//
// Projection: metres from the battle origin on a local tangent plane, using
// the WGS84 radii of curvature at the origin's latitude. Over 10 km the error
// against a true geodesic is far below one grid cell.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const assetsDir = process.env.TERRAIN_SOURCE_DIR ?? "E:\\World_History_Platform_assets\\terrain";

/** Folder of each source's tiles inside assetsDir; tiles are named like N41E016.tif. */
const SOURCES = {
  copernicus: "copernicus-glo30",
  srtm: "srtm-gl1",
};

/** Battles with terrain built by this script. Keep in step with the battle JSON. */
const BATTLES = {
  "battle-of-cannae": {
    // Must equal Battle.origin in src/data/battles/battle-of-cannae.json.
    origin: { lng: 16.2085, lat: 41.3327 },
    minX: -5400,
    maxX: 4800,
    minY: -4800,
    maxY: 3300,
    spacing: 30,
    source: "copernicus",
    // Must equal Battle.terrain.far in the battle file. The edges of the near
    // grid need not fall on its lines.
    far: { minX: -54000, maxX: 54000, minY: -54000, maxY: 54000, spacing: 400 },
  },
};

// --- WGS84 local projection -------------------------------------------------

const A = 6378137;
const E2 = 6.69437999014e-3;
const RAD = Math.PI / 180;

function projection(origin) {
  const phi = origin.lat * RAD;
  const s = Math.sin(phi);
  const w = Math.sqrt(1 - E2 * s * s);
  const metresPerDegLat = ((A * (1 - E2)) / (w * w * w)) * RAD;
  const metresPerDegLng = ((A / w) * Math.cos(phi)) * RAD;
  return {
    toLngLat: (x, y) => ({ lng: origin.lng + x / metresPerDegLng, lat: origin.lat + y / metresPerDegLat }),
    toXY: (lng, lat) => ({ x: (lng - origin.lng) * metresPerDegLng, y: (lat - origin.lat) * metresPerDegLat }),
  };
}

// --- Minimal GeoTIFF reader ------------------------------------------------
// Enough for the two source products: tiled or stripped, deflate or none;
// Int16 (SRTM) or Float32 with the floating-point predictor (Copernicus).

function readGeoTiff(path) {
  const b = readFileSync(path);
  if (b.toString("latin1", 0, 2) !== "II" || b.readUInt16LE(2) !== 42) throw new Error(`${path}: not a little-endian TIFF`);
  const ifd = b.readUInt32LE(4);
  const tags = new Map();
  const sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 12: 8, 16: 8 };
  for (let i = 0, n = b.readUInt16LE(ifd); i < n; i++) {
    const e = ifd + 2 + i * 12;
    const tag = b.readUInt16LE(e);
    const type = b.readUInt16LE(e + 2);
    const count = b.readUInt32LE(e + 4);
    const size = sizes[type] ?? 1;
    const at = size * count <= 4 ? e + 8 : b.readUInt32LE(e + 8);
    const values = [];
    for (let k = 0; k < count && type !== 2; k++) {
      const p = at + k * size;
      values.push(type === 3 ? b.readUInt16LE(p) : type === 4 ? b.readUInt32LE(p) : type === 12 ? b.readDoubleLE(p) : b[p]);
    }
    tags.set(tag, type === 2 ? b.toString("latin1", at, at + count).replace(/\0+$/, "") : values);
  }
  const one = (tag, fallback) => (tags.has(tag) ? tags.get(tag)[0] : fallback);
  const width = one(256);
  const height = one(257);
  const compression = one(259, 1);
  const bits = one(258);
  const format = one(339, 1);
  const predictor = one(317, 1);
  const int16 = bits === 16 && format === 2;
  const float32 = bits === 32 && format === 3;
  if (!int16 && !float32) throw new Error(`${path}: expected Int16 or Float32 samples`);
  if (compression !== 1 && compression !== 8 && compression !== 32946) throw new Error(`${path}: compression ${compression} not supported`);
  if (!(predictor === 1 || (predictor === 3 && float32))) throw new Error(`${path}: predictor ${predictor} not supported`);

  const data = new Float32Array(width * height);
  const tiled = tags.has(322);
  const blockW = tiled ? one(322) : width;
  const blockH = tiled ? one(323) : one(278, height);
  const offsets = tags.get(tiled ? 324 : 273);
  const counts = tags.get(tiled ? 325 : 279);
  const across = Math.ceil(width / blockW);
  const row = Buffer.alloc(blockW * 4);
  for (let k = 0; k < offsets.length; k++) {
    let raw = b.subarray(offsets[k], offsets[k] + counts[k]);
    if (compression !== 1) raw = inflateSync(raw);
    const bx = (k % across) * blockW;
    const by = Math.floor(k / across) * blockH;
    for (let r = 0; r < blockH && by + r < height; r++) {
      let value;
      if (predictor === 3) {
        // Floating-point predictor: bytes are differenced along the row, then
        // stored as planes from the most to the least significant byte.
        const src = raw.subarray(r * blockW * 4, (r + 1) * blockW * 4);
        let acc = 0;
        const undiff = Buffer.alloc(src.length);
        for (let i = 0; i < src.length; i++) undiff[i] = acc = (acc + src[i]) & 0xff;
        for (let c = 0; c < blockW; c++) {
          for (let byte = 0; byte < 4; byte++) row[c * 4 + 3 - byte] = undiff[byte * blockW + c];
        }
        value = (c) => row.readFloatLE(c * 4);
      } else if (float32) {
        value = (c) => raw.readFloatLE((r * blockW + c) * 4);
      } else {
        value = (c) => raw.readInt16LE((r * blockW + c) * 2);
      }
      for (let c = 0; c < blockW && bx + c < width; c++) data[(by + r) * width + bx + c] = value(c);
    }
  }

  const [, , , tieLng, tieLat] = tags.get(33922);
  const [scaleLng, scaleLat] = tags.get(33550);
  // GeoKey 1025 (GTRasterTypeGeoKey): 1 = pixel is area, 2 = pixel is point.
  const keys = tags.get(34735) ?? [];
  let pixelIsPoint = false;
  for (let i = 4; i + 3 < keys.length; i += 4) if (keys[i] === 1025) pixelIsPoint = keys[i + 3] === 2;
  const half = pixelIsPoint ? 0 : 0.5;
  const nodata = tags.has(42113) ? Number(tags.get(42113)) : -32768;
  return {
    width,
    height,
    nodata,
    data,
    // Fractional pixel coordinates of a point, measured between pixel centres.
    toPixel: (lng, lat) => ({ px: (lng - tieLng) / scaleLng - half, py: (tieLat - lat) / scaleLat - half }),
  };
}

function sampler(origin, source) {
  const cache = new Map();
  const tileFor = (lng, lat) => {
    const la = Math.floor(lat);
    const lo = Math.floor(lng);
    const name = `${la >= 0 ? "N" : "S"}${String(Math.abs(la)).padStart(2, "0")}${lo >= 0 ? "E" : "W"}${String(Math.abs(lo)).padStart(3, "0")}.tif`;
    if (!cache.has(name)) {
      const path = join(assetsDir, SOURCES[source], name);
      if (!existsSync(path)) throw new Error(`missing source tile ${path}; see the header of this script`);
      cache.set(name, readGeoTiff(path));
    }
    return cache.get(name);
  };
  const proj = projection(origin);
  // Bilinear interpolation in metres.
  return (x, y) => {
    const { lng, lat } = proj.toLngLat(x, y);
    const t = tileFor(lng, lat);
    const { px, py } = t.toPixel(lng, lat);
    const x0 = Math.min(Math.max(Math.floor(px), 0), t.width - 2);
    const y0 = Math.min(Math.max(Math.floor(py), 0), t.height - 2);
    const fx = px - x0;
    const fy = py - y0;
    const at = (c, r) => {
      const v = t.data[r * t.width + c];
      if (v === t.nodata) throw new Error(`no data at ${lng.toFixed(5)}, ${lat.toFixed(5)}`);
      return v;
    };
    const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
    const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
}

// --- Grid -------------------------------------------------------------------

function buildGrid(config) {
  const { minX, maxX, minY, maxY, spacing } = config;
  const width = Math.round((maxX - minX) / spacing) + 1;
  const height = Math.round((maxY - minY) / spacing) + 1;
  if (minX + (width - 1) * spacing !== maxX || minY + (height - 1) * spacing !== maxY) {
    throw new Error("the extent must be a whole number of grid cells");
  }
  const sample = sampler(config.origin, config.source);
  const metres = new Float64Array(width * height);
  for (let r = 0; r < height; r++) {
    const y = maxY - r * spacing;
    for (let c = 0; c < width; c++) metres[r * width + c] = sample(minX + c * spacing, y);
  }
  return { width, height, metres };
}

/** The far grid: every value is the mean over the cell around the grid point. */
function buildFarGrid(config) {
  const { minX, maxX, minY, maxY, spacing } = config.far;
  const width = Math.round((maxX - minX) / spacing) + 1;
  const height = Math.round((maxY - minY) / spacing) + 1;
  if (minX + (width - 1) * spacing !== maxX || minY + (height - 1) * spacing !== maxY) {
    throw new Error("the far extent must be a whole number of grid cells");
  }
  const sample = sampler(config.origin, config.source);
  const SUB = 5;
  const metres = new Float64Array(width * height);
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      let sum = 0;
      for (let i = 0; i < SUB; i++) {
        for (let j = 0; j < SUB; j++) {
          sum += sample(minX + (c + (i + 0.5) / SUB - 0.5) * spacing, maxY - (r + (j + 0.5) / SUB - 0.5) * spacing);
        }
      }
      metres[r * width + c] = sum / (SUB * SUB);
    }
  }
  return { width, height, metres };
}

function encode(grid) {
  const out = Buffer.alloc(grid.width * grid.height * 2);
  grid.metres.forEach((m, i) => out.writeInt16LE(Math.round(m * 10), i * 2));
  return out;
}

// --- Valley-floor tracing (to draw the modern river course from the DEM) ----

/**
 * Cheapest path over the grid through the waypoints, where a cell costs more
 * the higher it stands above the median of the ground around it (about 1 km
 * across): it follows the incised channel of a river even where the whole
 * valley slopes. Returns points in metres, simplified to within `tolerance`.
 */
function trace(grid, config, waypoints, tolerance = 20) {
  const { width, height, metres } = grid;
  const { minX, maxY, spacing } = config;
  const radius = Math.round(500 / spacing);
  const cost = new Float64Array(width * height);
  const around = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      around.length = 0;
      for (let dr = -radius; dr <= radius; dr += 3) {
        for (let dc = -radius; dc <= radius; dc += 3) {
          const rr = Math.min(Math.max(r + dr, 0), height - 1);
          const cc = Math.min(Math.max(c + dc, 0), width - 1);
          around.push(metres[rr * width + cc]);
        }
      }
      around.sort((a, b) => a - b);
      const relative = metres[r * width + c] - around[around.length >> 1];
      cost[r * width + c] = Math.exp(1.5 * Math.min(Math.max(relative, -3), 6));
    }
  }
  const cell = (p) => {
    const c = Math.round((p.x - minX) / spacing);
    const r = Math.round((maxY - p.y) / spacing);
    return Math.min(Math.max(r, 0), height - 1) * width + Math.min(Math.max(c, 0), width - 1);
  };
  const leg = (from, to) => {
    const dist = new Float64Array(width * height).fill(Infinity);
    const prev = new Int32Array(width * height).fill(-1);
    // Binary heap of [cost, index].
    const heap = [];
    const push = (d, i) => {
      heap.push([d, i]);
      for (let k = heap.length - 1; k > 0; ) {
        const p = (k - 1) >> 1;
        if (heap[p][0] <= heap[k][0]) break;
        [heap[p], heap[k]] = [heap[k], heap[p]];
        k = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length > 0) {
        heap[0] = last;
        for (let k = 0; ; ) {
          const l = 2 * k + 1;
          const r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    dist[from] = 0;
    push(0, from);
    while (heap.length > 0) {
      const [d, i] = pop();
      if (i === to) break;
      if (d > dist[i]) continue;
      const r = Math.floor(i / width);
      const c = i % width;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if ((!dr && !dc) || r + dr < 0 || r + dr >= height || c + dc < 0 || c + dc >= width) continue;
          const j = i + dr * width + dc;
          const step = (dr && dc ? Math.SQRT2 : 1) * cost[j];
          if (d + step < dist[j]) {
            dist[j] = d + step;
            prev[j] = i;
            push(d + step, j);
          }
        }
      }
    }
    const path = [];
    for (let i = to; i !== -1; i = prev[i]) path.push(i);
    return path.reverse();
  };
  const cells = [];
  for (let k = 0; k + 1 < waypoints.length; k++) {
    const part = leg(cell(waypoints[k]), cell(waypoints[k + 1]));
    cells.push(...(k === 0 ? part : part.slice(1)));
  }
  const points = cells.map((i) => ({ x: minX + (i % width) * spacing, y: maxY - Math.floor(i / width) * spacing }));
  return simplify(points, tolerance);
}

/** Douglas–Peucker. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [a, b] = stack.pop();
    const pa = points[a];
    const pb = points[b];
    const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
    let worst = -1;
    let at = -1;
    for (let k = a + 1; k < b; k++) {
      const p = points[k];
      const d = Math.abs((pb.x - pa.x) * (pa.y - p.y) - (pa.x - p.x) * (pb.y - pa.y)) / len;
      if (d > worst) {
        worst = d;
        at = k;
      }
    }
    if (worst > tolerance) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return points.filter((_, k) => keep[k]);
}

// --- Preview image (grayscale shaded relief with elevation tint) -----------

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function png(width, height, rgb) {
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "latin1");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let r = 0; r < height; r++) rgb.copy(raw, r * (width * 3 + 1) + 1, r * width * 3, (r + 1) * width * 3);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function preview(grid, config, overlay = [], range) {
  const { width, height, metres } = grid;
  let lo = Infinity;
  let hi = -Infinity;
  for (const m of metres) {
    lo = Math.min(lo, m);
    hi = Math.max(hi, m);
  }
  if (range) [lo, hi] = range;
  const rgb = Buffer.alloc(width * height * 3);
  const at = (r, c) => metres[Math.min(Math.max(r, 0), height - 1) * width + Math.min(Math.max(c, 0), width - 1)];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      // Light from the north-west, exaggerated 4x.
      const dx = (at(r, c + 1) - at(r, c - 1)) / (2 * config.spacing);
      const dy = (at(r - 1, c) - at(r + 1, c)) / (2 * config.spacing);
      const shade = Math.min(Math.max(0.6 + 4 * (-dx + dy) * 0.5, 0), 1);
      const t = Math.min(Math.max((at(r, c) - lo) / (hi - lo || 1), 0), 1);
      const i = (r * width + c) * 3;
      rgb[i] = Math.round(255 * shade * (0.35 + 0.65 * t));
      rgb[i + 1] = Math.round(255 * shade * (0.55 + 0.35 * t));
      rgb[i + 2] = Math.round(255 * shade * (0.45 + 0.2 * t));
      // 10 m contour lines.
      if (Math.floor(at(r, c) / 10) !== Math.floor(at(r, c + 1) / 10) || Math.floor(at(r, c) / 10) !== Math.floor(at(r + 1, c) / 10)) {
        rgb[i] = rgb[i + 1] = rgb[i + 2] = 60;
      }
      // 1 km grid, thicker through the origin.
      const x = config.minX + c * config.spacing;
      const y = config.maxY - r * config.spacing;
      const onLine = (v) => Math.abs(v - Math.round(v / 1000) * 1000) < config.spacing / 2;
      if (onLine(x) || onLine(y)) {
        const origin = Math.abs(x) < config.spacing / 2 || Math.abs(y) < config.spacing / 2;
        rgb[i] = origin ? 255 : 200;
        rgb[i + 1] = origin ? 255 : 200;
        rgb[i + 2] = origin ? 0 : 200;
      }
    }
  }
  const dot = (p, color, size = 2) => {
    const c0 = Math.round((p.x - config.minX) / config.spacing);
    const r0 = Math.round((config.maxY - p.y) / config.spacing);
    for (let r = r0 - size; r <= r0 + size; r++) {
      for (let c = c0 - size; c <= c0 + size; c++) {
        if (r < 0 || c < 0 || r >= height || c >= width) continue;
        rgb.set(color, (r * width + c) * 3);
      }
    }
  };
  for (const { points, color, line } of overlay) {
    for (let k = 0; k < points.length; k++) {
      dot(points[k], color, line ? 0 : 3);
      if (line && k + 1 < points.length) {
        const a = points[k];
        const b = points[k + 1];
        const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (config.spacing / 2));
        for (let s = 0; s <= steps; s++) dot({ x: a.x + ((b.x - a.x) * s) / steps, y: a.y + ((b.y - a.y) * s) / steps }, color, 0);
      }
    }
  }
  return { image: png(width, height, rgb), lo, hi };
}

// --- Main -------------------------------------------------------------------

function parsePoints(text) {
  return text.split(";").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return { x, y };
  });
}

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const id = option("--battle") ?? "battle-of-cannae";
if (!BATTLES[id]) throw new Error(`no terrain settings for ${id}`);
// Exploring: --origin lng,lat and --extent minX,maxX,minY,maxY override the
// settings and skip writing the grid.
const exploring = ["--origin", "--extent", "--spacing"].some((name) => option(name) !== undefined);
const config = { ...BATTLES[id] };
if (option("--origin")) {
  const [lng, lat] = option("--origin").split(",").map(Number);
  config.origin = { lng, lat };
}
if (option("--source")) {
  if (!SOURCES[option("--source")]) throw new Error(`unknown source ${option("--source")}`);
  config.source = option("--source");
}
if (option("--spacing")) config.spacing = Number(option("--spacing"));
if (option("--extent")) [config.minX, config.maxX, config.minY, config.maxY] = option("--extent").split(",").map(Number);

const grid = buildGrid(config);
const out = join(root, "public", "data", "terrain", `${id}.bin`);
if (!exploring) writeFileSync(out, encode(grid));
let lo = Infinity;
let hi = -Infinity;
for (const m of grid.metres) {
  lo = Math.min(lo, m);
  hi = Math.max(hi, m);
}
console.log(`${id}: ${grid.width} × ${grid.height} cells, ${config.spacing} m, elevation ${lo.toFixed(1)}–${hi.toFixed(1)} m`);
if (!exploring) console.log(`wrote ${out}`);

if (!exploring && config.far) {
  const far = buildFarGrid(config);
  const farOut = join(root, "public", "data", "terrain", `${id}-far.bin`);
  writeFileSync(farOut, encode(far));
  let farHi = -Infinity;
  let sea = 0;
  for (const m of far.metres) {
    farHi = Math.max(farHi, m);
    if (m <= 0.05) sea++;
  }
  console.log(
    `${id}-far: ${far.width} × ${far.height} cells, ${config.far.spacing} m, up to ${farHi.toFixed(0)} m, ${((sea / far.metres.length) * 100).toFixed(1)}% at sea level`,
  );
  console.log(`wrote ${farOut}`);
}

const traced = option("--trace") ? trace(grid, config, parsePoints(option("--trace"))) : null;
if (traced) console.log(JSON.stringify(traced.map((p) => ({ x: p.x, y: p.y }))));

const previewPath = option("--preview");
if (previewPath) {
  // Overlay the rivers, landmarks and starting positions from the battle file.
  const battlePath = join(root, "src", "data", "battles", `${id}.json`);
  const overlay = [];
  if (existsSync(battlePath) && option("--origin") === undefined) {
    const battle = JSON.parse(readFileSync(battlePath, "utf8"));
    for (const river of battle.terrain?.rivers ?? []) overlay.push({ points: river.points, color: [40, 90, 220], line: true });
    overlay.push({ points: (battle.terrain?.landmarks ?? []).map((m) => m.point), color: [220, 40, 40] });
    // --phase n draws the unit blocks at the end of phase n (0: the start) and
    // that phase's arrows: the outline of the front and depth, a tick on the front.
    const phase = Number(option("--phase") ?? 0);
    const states = phase === 0 ? battle.initial : battle.phases?.[phase - 1]?.units;
    const colorOf = (sideId) => (sideId === battle.sides[0].id ? [230, 30, 30] : [20, 20, 20]);
    for (const s of states ?? []) {
      const side = battle.units.find((u) => u.id === s.unit)?.side;
      const { center, frontage, depth, facing } = s.formation;
      const a = facing * RAD;
      const ahead = { x: Math.sin(a), y: Math.cos(a) };
      const right = { x: Math.cos(a), y: -Math.sin(a) };
      const at = (along, forward) => ({
        x: center.x + right.x * along + ahead.x * forward,
        y: center.y + right.y * along + ahead.y * forward,
      });
      const w = frontage / 2;
      const d = depth / 2;
      overlay.push({ points: [at(-w, d), at(w, d), at(w, -d), at(-w, -d), at(-w, d)], color: colorOf(side), line: true });
      overlay.push({ points: [at(0, d), at(0, d + 40)], color: colorOf(side), line: true });
    }
    for (const arrow of (phase > 0 && battle.phases?.[phase - 1]?.arrows) || []) {
      overlay.push({ points: arrow.points, color: arrow.side === battle.sides[0].id ? [255, 140, 0] : [120, 0, 160], line: true });
    }
  }
  if (traced) overlay.push({ points: traced, color: [0, 200, 255], line: true });
  writeFileSync(previewPath, preview(grid, config, overlay, option("--range")?.split(",").map(Number)).image);
  console.log(`wrote ${previewPath}`);
}
