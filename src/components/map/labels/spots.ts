import type { Territories } from "../borders";
import {
  CELL,
  GRID_COLUMNS,
  GRID_ROWS,
  fillRings,
  fromGrid,
  ringToGrid,
  type GridRing,
  type Window,
} from "./grid";
import type { LandMask } from "./landMask";

/** Where a polity's label goes in one border snapshot. */
export interface LabelSpot {
  polityId: string;
  /** The point of the territory farthest from its edges and the sea. */
  lng: number;
  lat: number;
  /** Visible (land) area of the territory, in world units²; ranks labels. */
  area: number;
  /** The same point in grid coordinates (cell centre). */
  column: number;
  row: number;
  /** Land cells of the territory within `window`, 1 inside and 0 outside. */
  window: Window;
  inside: Uint8Array;
}

/**
 * Squared Euclidean distance transform of one line (Felzenszwalb and
 * Huttenlocher, 2012): `out[q] = min_p (q - p)² + f[p]`.
 */
function transformLine(
  f: Float64Array,
  n: number,
  out: Float64Array,
  v: Int32Array,
  z: Float64Array,
): void {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const p = v[k];
    out[q] = (q - p) * (q - p) + f[p];
  }
}

/** Stands in for infinity; finite so that the parabola maths stays exact. */
const FAR = 1e20;

/**
 * For each inside cell, the squared distance (in cells) to the nearest
 * outside cell. The window has an outside border, so every line has one.
 */
function distanceField(inside: Uint8Array, width: number, height: number): Float64Array {
  const field = new Float64Array(width * height);
  for (let i = 0; i < field.length; i++) field[i] = inside[i] ? FAR : 0;

  const size = Math.max(width, height);
  const f = new Float64Array(size);
  const out = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = field[y * width + x];
    transformLine(f, height, out, v, z);
    for (let y = 0; y < height; y++) field[y * width + x] = out[y];
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) f[x] = field[row + x];
    transformLine(f, width, out, v, z);
    for (let x = 0; x < width; x++) field[row + x] = out[x];
  }
  return field;
}

function spotFor(polityId: string, polygons: GridRing[][], land: LandMask): LabelSpot | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length; i += 2) {
        minX = Math.min(minX, ring[i]);
        maxX = Math.max(maxX, ring[i]);
        minY = Math.min(minY, ring[i + 1]);
        maxY = Math.max(maxY, ring[i + 1]);
      }
    }
  }
  // One outside cell around the territory, clipped to the grid plus that
  // border; cells beyond the grid count as sea.
  const x0 = Math.max(-1, Math.floor(minX) - 1);
  const y0 = Math.max(-1, Math.floor(minY) - 1);
  const x1 = Math.min(GRID_COLUMNS, Math.ceil(maxX) + 1);
  const y1 = Math.min(GRID_ROWS, Math.ceil(maxY) + 1);
  if (x1 - x0 < 3 || y1 - y0 < 3) return null;
  const window: Window = { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };

  const inside = new Uint8Array(window.width * window.height);
  for (const polygon of polygons) fillRings(polygon, window, inside);

  let cells = 0;
  for (let row = 0; row < window.height; row++) {
    const y = window.y + row;
    for (let col = 0; col < window.width; col++) {
      const i = row * window.width + col;
      if (!inside[i]) continue;
      const x = window.x + col;
      const onLand =
        x >= 0 && y >= 0 && x < GRID_COLUMNS && y < GRID_ROWS && land[y * GRID_COLUMNS + x] === 1;
      if (onLand) cells++;
      else inside[i] = 0;
    }
  }
  if (cells === 0) return null;

  const field = distanceField(inside, window.width, window.height);
  let best = 0;
  for (let i = 1; i < field.length; i++) if (field[i] > field[best]) best = i;

  const column = window.x + (best % window.width) + 0.5;
  const row = window.y + Math.floor(best / window.width) + 0.5;
  const [lng, lat] = fromGrid(column, row);
  return { polityId, lng, lat, area: cells * CELL * CELL, column, row, window, inside };
}

/**
 * One label spot per polity of a snapshot, largest territory first. Runs
 * once per snapshot: a few tens of milliseconds for a full Mediterranean.
 */
export function computeLabelSpots(territories: Territories, land: LandMask): LabelSpot[] {
  const byPolity = new Map<string, GridRing[][]>();
  for (const feature of territories.collection.features) {
    const { geometry } = feature;
    const polygons =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const list = byPolity.get(feature.properties.polityId) ?? [];
    for (const polygon of polygons) list.push(polygon.map(ringToGrid));
    byPolity.set(feature.properties.polityId, list);
  }

  const spots: LabelSpot[] = [];
  for (const [polityId, polygons] of byPolity) {
    const spot = spotFor(polityId, polygons, land);
    if (spot) spots.push(spot);
  }
  return spots.sort((a, b) => b.area - a.area);
}

/** Share of the label box that must lie on the polity's own land. */
const MIN_INSIDE_SHARE = 0.8;
const SAMPLES_X = 9;
const SAMPLES_Y = 3;

/**
 * True when a label of `width` × `height` pixels, centred on the spot, lies
 * (almost) entirely on the territory's land at `zoom`.
 */
export function labelFits(spot: LabelSpot, width: number, height: number, zoom: number): boolean {
  const cellPixels = CELL * 2 ** zoom;
  const halfWidth = width / 2 / cellPixels;
  const halfHeight = height / 2 / cellPixels;
  const { window, inside } = spot;
  let hits = 0;
  for (let j = 0; j < SAMPLES_Y; j++) {
    const y = spot.row + (-1 + (2 * j) / (SAMPLES_Y - 1)) * halfHeight;
    const row = Math.floor(y) - window.y;
    for (let i = 0; i < SAMPLES_X; i++) {
      const x = spot.column + (-1 + (2 * i) / (SAMPLES_X - 1)) * halfWidth;
      const col = Math.floor(x) - window.x;
      if (row >= 0 && row < window.height && col >= 0 && col < window.width) {
        hits += inside[row * window.width + col];
      }
    }
  }
  return hits >= MIN_INSIDE_SHARE * SAMPLES_X * SAMPLES_Y;
}
