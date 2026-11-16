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

/** A point where a label can be centred, in grid and map coordinates. */
export interface LabelPoint {
  /** Grid coordinates (cell centre). */
  column: number;
  row: number;
  lng: number;
  lat: number;
}

/**
 * Where a polity's label goes in one border snapshot. A polity whose land
 * falls into several large separate pieces gets a spot in each of them.
 * The spot's own point, the preferred one, is the point of the piece
 * farthest from its edges and the sea.
 */
export interface LabelSpot extends LabelPoint {
  /** `polityId` for the main spot, `polityId#2`, `#3` for further pieces. */
  id: string;
  /**
   * The id and the position. Two snapshots that put the same label in the
   * same place share it, so the label stays put while the borders change.
   */
  key: string;
  polityId: string;
  /** The main spot sits in the piece with the most room for a label. */
  main: boolean;
  /**
   * Visible (land) area, in world units²: of the whole territory for a main
   * spot, of the piece otherwise. Ranks labels.
   */
  area: number;
  /**
   * Other points of the same piece, best first, spread over it: where the
   * label goes when something on screen covers the spot. A main spot then
   * also has the best point of each piece that has no label of its own.
   */
  alternatives: LabelPoint[];
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

/** A further piece gets its own label if it is at least this share of the largest. */
const MIN_PIECE_SHARE = 0.25;
/** Most labels for one polity. */
const MAX_SPOTS_PER_POLITY = 3;

interface Piece {
  /** Number of the piece in the `labels` array of `findPieces`, from 1. */
  label: number;
  cells: number;
  /** Index of the cell farthest from the piece's edges. */
  best: number;
}

/**
 * Connected pieces of the inside cells (8-neighbour), with their best cell,
 * and the piece number of each cell (0 outside).
 */
function findPieces(
  inside: Uint8Array,
  field: Float64Array,
  width: number,
): { pieces: Piece[]; label: Int32Array } {
  const label = new Int32Array(inside.length);
  const pieces: Piece[] = [];
  const stack: number[] = [];
  for (let start = 0; start < inside.length; start++) {
    if (!inside[start] || label[start]) continue;
    const piece: Piece = { label: pieces.length + 1, cells: 0, best: start };
    label[start] = pieces.length + 1;
    stack.push(start);
    while (stack.length > 0) {
      const i = stack.pop()!;
      piece.cells++;
      if (field[i] > field[piece.best]) piece.best = i;
      // The window has an outside border, so neighbours never wrap around.
      for (const step of [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1]) {
        const j = i + step;
        if (j >= 0 && j < inside.length && inside[j] && !label[j]) {
          label[j] = pieces.length + 1;
          stack.push(j);
        }
      }
    }
    pieces.push(piece);
  }
  return { pieces, label };
}

/** Most alternative points kept per piece. */
const MAX_ALTERNATIVES = 40;
/** Alternative points lie at least this many cells from the piece's edges. */
const MIN_ALTERNATIVE_DEPTH = 2;

/**
 * Alternative label points of each piece, keyed by piece number: the
 * deepest cell of each block of a coarse grid laid over the window, deepest
 * first, without the piece's best cell. Blocks are half the depth of the
 * piece's best cell, so the points spread over the whole piece and follow
 * its shape, with little cost for large territories. One pass over the
 * window serves every piece.
 */
function alternativesByPiece(
  pieces: Piece[],
  label: Int32Array,
  field: Float64Array,
  window: Window,
): Map<number, LabelPoint[]> {
  const blockSize = new Int32Array(pieces.length + 1);
  const blocksX = new Int32Array(pieces.length + 1);
  for (const piece of pieces) {
    blockSize[piece.label] = Math.max(3, Math.round(Math.sqrt(field[piece.best]) / 2));
    blocksX[piece.label] = Math.ceil(window.width / blockSize[piece.label]);
  }
  const best = new Set(pieces.map((piece) => piece.best));
  const minField = MIN_ALTERNATIVE_DEPTH * MIN_ALTERNATIVE_DEPTH;
  // Per piece, block number -> deepest cell.
  const deepest = new Map<number, Map<number, number>>();
  for (let i = 0; i < label.length; i++) {
    const piece = label[i];
    if (!piece || field[i] < minField || best.has(i)) continue;
    const block = blockSize[piece];
    const blockId =
      Math.floor(Math.floor(i / window.width) / block) * blocksX[piece] +
      Math.floor((i % window.width) / block);
    let blocks = deepest.get(piece);
    if (!blocks) deepest.set(piece, (blocks = new Map()));
    const current = blocks.get(blockId);
    if (current === undefined || field[i] > field[current]) blocks.set(blockId, i);
  }
  const result = new Map<number, LabelPoint[]>();
  for (const [piece, blocks] of deepest) {
    result.set(
      piece,
      [...blocks.values()]
        .sort((a, b) => field[b] - field[a])
        .slice(0, MAX_ALTERNATIVES)
        .map((i) => pointAt(window, i)),
    );
  }
  return result;
}

/** The label point at the centre of cell `i` of `window`. */
function pointAt(window: Window, i: number): LabelPoint {
  const column = window.x + (i % window.width) + 0.5;
  const row = window.y + Math.floor(i / window.width) + 0.5;
  const [lng, lat] = fromGrid(column, row);
  return { column, row, lng, lat };
}

function spotsFor(polityId: string, polygons: GridRing[][], land: LandMask): LabelSpot[] {
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
  if (x1 - x0 < 3 || y1 - y0 < 3) return [];
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
  if (cells === 0) return [];

  const field = distanceField(inside, window.width, window.height);
  const { pieces, label } = findPieces(inside, field, window.width);
  // The main label goes where there is the most room; then the other large
  // pieces, largest first.
  const main = pieces.reduce((a, b) => (field[b.best] > field[a.best] ? b : a));
  const largest = Math.max(...pieces.map((piece) => piece.cells));
  const chosen = [
    main,
    ...pieces
      .filter((piece) => piece !== main && piece.cells >= MIN_PIECE_SHARE * largest)
      .sort((a, b) => b.cells - a.cells),
  ].slice(0, MAX_SPOTS_PER_POLITY);
  const alternatives = alternativesByPiece(pieces, label, field, window);
  // The best points of the pieces without a label of their own, for the
  // main label when every point of its own piece is covered.
  const unlabelled = pieces
    .filter((piece) => !chosen.includes(piece))
    .sort((a, b) => field[b.best] - field[a.best])
    .slice(0, MAX_ALTERNATIVES)
    .map((piece) => pointAt(window, piece.best));

  return chosen.map((piece, index) => {
    const point = pointAt(window, piece.best);
    const id = index === 0 ? polityId : `${polityId}#${index + 1}`;
    return {
      ...point,
      id,
      key: `${id}@${point.column},${point.row}`,
      polityId,
      main: index === 0,
      area: (index === 0 ? cells : piece.cells) * CELL * CELL,
      alternatives: [
        ...(alternatives.get(piece.label) ?? []),
        ...(index === 0 ? unlabelled : []),
      ],
      window,
      inside,
    };
  });
}

/**
 * Label spots of a snapshot, in order of priority: the main spot of every
 * polity, largest territory first, then the spots of further pieces. Runs
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
    spots.push(...spotsFor(polityId, polygons, land));
  }
  return spots.sort((a, b) => Number(b.main) - Number(a.main) || b.area - a.area);
}

/** Share of the label box that must lie on the polity's own land. */
const MIN_INSIDE_SHARE = 0.8;
const SAMPLES_X = 9;
const SAMPLES_Y = 3;

/**
 * True when a label of `width` × `height` pixels, centred on `point` (the
 * spot itself or one of its alternatives), lies (almost) entirely on the
 * territory's land at `zoom`.
 */
export function labelFits(
  spot: LabelSpot,
  point: LabelPoint,
  width: number,
  height: number,
  zoom: number,
): boolean {
  const cellPixels = CELL * 2 ** zoom;
  const halfWidth = width / 2 / cellPixels;
  const halfHeight = height / 2 / cellPixels;
  const { window, inside } = spot;
  let hits = 0;
  for (let j = 0; j < SAMPLES_Y; j++) {
    const y = point.row + (-1 + (2 * j) / (SAMPLES_Y - 1)) * halfHeight;
    const row = Math.floor(y) - window.y;
    for (let i = 0; i < SAMPLES_X; i++) {
      const x = point.column + (-1 + (2 * i) / (SAMPLES_X - 1)) * halfWidth;
      const col = Math.floor(x) - window.x;
      if (row >= 0 && row < window.height && col >= 0 && col < window.width) {
        hits += inside[row * window.width + col];
      }
    }
  }
  return hits >= MIN_INSIDE_SHARE * SAMPLES_X * SAMPLES_Y;
}
