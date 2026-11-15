/*
 * A raster grid over the map region, in Web Mercator, used to place polity
 * labels. Cells are square on screen at every zoom, so distances measured in
 * cells convert to pixels with a single factor.
 *
 * "World units" are MapLibre's pixels at zoom 0: the whole world is 512
 * units wide, and at zoom z one unit is 2^z screen pixels.
 */

const WORLD_SIZE = 512;

/** Region of the base map (see DATA_BOUNDS in ../mapStyle.ts). */
const WEST = -40;
const EAST = 80;
const NORTH = 70;
const SOUTH = 5;

/** About 5.5 km: fine enough for the smallest polities in the data. */
const CELL_DEGREES = 0.05;

export function worldX(lng: number): number {
  return ((lng + 180) / 360) * WORLD_SIZE;
}

export function worldY(lat: number): number {
  const phi = (lat * Math.PI) / 180;
  const mercator = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  return ((Math.PI - mercator) / (2 * Math.PI)) * WORLD_SIZE;
}

export function lngFromWorldX(x: number): number {
  return (x / WORLD_SIZE) * 360 - 180;
}

export function latFromWorldY(y: number): number {
  const mercator = Math.PI - (y / WORLD_SIZE) * 2 * Math.PI;
  return ((2 * Math.atan(Math.exp(mercator)) - Math.PI / 2) * 180) / Math.PI;
}

/** Size of one cell, in world units. */
export const CELL = (CELL_DEGREES / 360) * WORLD_SIZE;

const ORIGIN_X = worldX(WEST);
const ORIGIN_Y = worldY(NORTH);

export const GRID_COLUMNS = Math.ceil((worldX(EAST) - ORIGIN_X) / CELL);
export const GRID_ROWS = Math.ceil((worldY(SOUTH) - ORIGIN_Y) / CELL);

/** Grid coordinates (in cells, fractional) of a longitude and latitude. */
export function toGrid(lng: number, lat: number): [number, number] {
  return [(worldX(lng) - ORIGIN_X) / CELL, (worldY(lat) - ORIGIN_Y) / CELL];
}

/** Longitude and latitude of a point given in grid coordinates. */
export function fromGrid(column: number, row: number): [number, number] {
  return [
    lngFromWorldX(ORIGIN_X + column * CELL),
    latFromWorldY(ORIGIN_Y + row * CELL),
  ];
}

/** A rectangle of grid cells: columns [x, x + width), rows [y, y + height). */
export interface Window {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FULL_GRID: Window = {
  x: 0,
  y: 0,
  width: GRID_COLUMNS,
  height: GRID_ROWS,
};

/** A ring of a polygon in grid coordinates, as a flat [x0, y0, x1, y1…]. */
export type GridRing = Float64Array;

export function ringToGrid(ring: GeoJSON.Position[]): GridRing {
  const out = new Float64Array(ring.length * 2);
  ring.forEach(([lng, lat], i) => {
    const [x, y] = toGrid(lng, lat);
    out[i * 2] = x;
    out[i * 2 + 1] = y;
  });
  return out;
}

/**
 * Marks the cells of `window` whose centre lies inside `rings` (even-odd
 * rule, so holes and islands in holes come out right), by scanlines.
 * `target[i]` is set to 1 for each inside cell, with i = row * width + col
 * relative to the window. Cells already set stay set.
 */
export function fillRings(
  rings: GridRing[],
  window: Window,
  target: Uint8Array,
): void {
  // Only the rows the rings span get a list of crossings.
  let minY = Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i += 2) {
      if (ring[i] < minY) minY = ring[i];
      if (ring[i] > maxY) maxY = ring[i];
    }
  }
  const rowFrom = Math.max(0, Math.floor(minY - window.y));
  const rowTo = Math.min(window.height - 1, Math.ceil(maxY - window.y));
  if (rowFrom > rowTo) return;
  const crossings: number[][] = Array.from({ length: rowTo - rowFrom + 1 }, () => []);

  for (const ring of rings) {
    const points = ring.length / 2;
    for (let i = 0; i < points; i++) {
      const j = (i + 1) % points;
      const x0 = ring[i * 2];
      const y0 = ring[i * 2 + 1];
      const x1 = ring[j * 2];
      const y1 = ring[j * 2 + 1];
      if (y0 === y1) continue;
      const low = Math.min(y0, y1);
      const high = Math.max(y0, y1);
      // Rows whose centre (row + 0.5) lies in [low, high).
      const first = Math.max(rowFrom, Math.ceil(low - 0.5 - window.y));
      const last = Math.min(rowTo, Math.ceil(high - 0.5 - window.y) - 1);
      for (let row = first; row <= last; row++) {
        const y = window.y + row + 0.5;
        crossings[row - rowFrom].push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
      }
    }
  }

  for (let row = rowFrom; row <= rowTo; row++) {
    const xs = crossings[row - rowFrom].sort((a, b) => a - b);
    const offset = row * window.width;
    for (let k = 0; k + 1 < xs.length; k += 2) {
      // Columns whose centre (col + 0.5) lies in [xs[k], xs[k + 1]).
      const from = Math.max(0, Math.ceil(xs[k] - 0.5 - window.x));
      const to = Math.min(window.width - 1, Math.ceil(xs[k + 1] - 0.5 - window.x) - 1);
      if (from <= to) target.fill(1, offset + from, offset + to + 1);
    }
  }
}
