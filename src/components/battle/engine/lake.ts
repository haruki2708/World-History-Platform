/**
 * Lakes (BattleTerrain.lakes, batch K): where their water lies, and how far
 * every point is from the nearest shore, the shores of the islands
 * included.
 *
 * One grid covers every lake with a margin of land: each cell holds the
 * distance from its centre to the nearest shore, positive on the water and
 * negative on land (islands are land). The ground shader reads it as a
 * texture to paint the water and the strip along its edge at any distance
 * from the camera, on the ground of the battle and on the country around
 * alike (terrain.ts). The scene reads it here for the depth a man wades at
 * (Terrain.footingAt), and to keep plants, grass and dust out of the water.
 *
 * Distances are exact near the shore (to the segments of the outlines) and
 * stop at REACH metres: farther out, all that matters is that it is deep.
 */

import { ClampToEdgeWrapping, DataTexture, LinearFilter, RedFormat, UnsignedByteType } from "three";
import type { BattleLake, BattleTerrain, FieldPoint } from "@/lib/battle";

/** Metres of land round the lakes that the grid still covers. */
const MARGIN = 300;
/** Finest cell of the grid, metres, and the most cells it may have. */
const CELL = 10;
const MAX_CELLS = 2_400_000;
const MAX_SIDE = 4096;
/** Distances are stored in steps of this many metres, from -256 to +254 m. */
const STEP = 2;
const REACH = 254;

/** Distance from (px, py) to the segment a–b. */
function toSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.min(Math.max(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0), 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function insideRing(x: number, y: number, ring: FieldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export class LakeField {
  readonly lakes: BattleLake[];
  /** Field metres of the centre of the first cell (south-west), and the cell size. */
  readonly minX: number;
  readonly minY: number;
  readonly cell: number;
  readonly cols: number;
  readonly rows: number;
  /** Rows from south to north: 128 + distance / STEP, clamped to a byte. */
  private readonly grid: Uint8Array;
  private textureMade: DataTexture | null = null;

  /** The lakes of a battle as a field, or null when it has none. */
  static of(terrain: BattleTerrain): LakeField | null {
    const lakes = (terrain.lakes ?? []).filter((lake) => lake.outline.length >= 3);
    return lakes.length > 0 ? new LakeField(lakes) : null;
  }

  private constructor(lakes: BattleLake[]) {
    this.lakes = lakes;
    const rings: FieldPoint[][] = [];
    for (const lake of lakes) {
      rings.push(lake.outline);
      for (const island of lake.islands ?? []) if (island.length >= 3) rings.push(island);
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const lake of lakes) {
      for (const p of lake.outline) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
    minX -= MARGIN;
    maxX += MARGIN;
    minY -= MARGIN;
    maxY += MARGIN;
    const cell = Math.max(
      CELL,
      Math.sqrt(((maxX - minX) * (maxY - minY)) / MAX_CELLS),
      (maxX - minX) / (MAX_SIDE - 1),
      (maxY - minY) / (MAX_SIDE - 1),
    );
    const cols = Math.ceil((maxX - minX) / cell) + 1;
    const rows = Math.ceil((maxY - minY) / cell) + 1;
    this.minX = minX;
    this.minY = minY;
    this.cell = cell;
    this.cols = cols;
    this.rows = rows;

    // Unsigned distance to the nearest shore, near each segment.
    const distance = new Float32Array(cols * rows).fill(REACH);
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j];
        const b = ring[i];
        const c0 = Math.max(Math.floor((Math.min(a.x, b.x) - REACH - minX) / cell), 0);
        const c1 = Math.min(Math.ceil((Math.max(a.x, b.x) + REACH - minX) / cell), cols - 1);
        const r0 = Math.max(Math.floor((Math.min(a.y, b.y) - REACH - minY) / cell), 0);
        const r1 = Math.min(Math.ceil((Math.max(a.y, b.y) + REACH - minY) / cell), rows - 1);
        for (let r = r0; r <= r1; r++) {
          const y = minY + r * cell;
          const row = r * cols;
          for (let c = c0; c <= c1; c++) {
            const d = toSegment(minX + c * cell, y, a.x, a.y, b.x, b.y);
            if (d < distance[row + c]) distance[row + c] = d;
          }
        }
      }
    }

    // Water or land: crossings of every ring along each row. Islands lie
    // inside their lake, so an odd count of crossings to the west is water.
    const grid = new Uint8Array(cols * rows);
    const crossings: number[] = [];
    for (let r = 0; r < rows; r++) {
      const y = minY + r * cell;
      crossings.length = 0;
      for (const ring of rings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i];
          const b = ring[j];
          if (a.y > y !== b.y > y) crossings.push(((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x);
        }
      }
      crossings.sort((p, q) => p - q);
      let next = 0;
      let wet = false;
      for (let c = 0; c < cols; c++) {
        const x = minX + c * cell;
        while (next < crossings.length && crossings[next] <= x) {
          wet = !wet;
          next++;
        }
        const d = wet ? distance[r * cols + c] : -distance[r * cols + c];
        grid[r * cols + c] = Math.min(Math.max(Math.round(128 + d / STEP), 0), 255);
      }
    }
    this.grid = grid;
  }

  /**
   * Metres from the nearest shore at a field point: positive on the water,
   * negative on land, between -256 and +254. Off the grid it is land.
   */
  readonly distanceAt = (x: number, y: number): number => {
    const gx = (x - this.minX) / this.cell;
    const gy = (y - this.minY) / this.cell;
    const c = Math.floor(gx);
    const r = Math.floor(gy);
    if (c < 0 || r < 0 || c >= this.cols - 1 || r >= this.rows - 1) return -REACH;
    const fx = gx - c;
    const fy = gy - r;
    const k = r * this.cols + c;
    const g = this.grid;
    const value =
      (g[k] * (1 - fx) + g[k + 1] * fx) * (1 - fy) + (g[k + this.cols] * (1 - fx) + g[k + this.cols + 1] * fx) * fy;
    return (value - 128) * STEP;
  };

  /** True on the water, or within `margin` metres of it. */
  readonly wet = (x: number, y: number, margin = 0): boolean => this.distanceAt(x, y) > -margin;

  /** Height of the water at a point on it: the level of the lake whose shore holds it. */
  levelAt(x: number, y: number): number {
    if (this.lakes.length === 1) return this.lakes[0].level;
    for (const lake of this.lakes) if (insideRing(x, y, lake.outline)) return lake.level;
    return this.lakes[0].level;
  }

  /**
   * The grid for the ground shader: texel (c, r) is the cell centred at
   * minX + c·cell, minY + r·cell, so a field point maps to
   * uv = ((p - min) / cell + 0.5) / size.
   */
  get texture(): DataTexture {
    if (!this.textureMade) {
      const texture = new DataTexture(this.grid, this.cols, this.rows, RedFormat, UnsignedByteType);
      texture.minFilter = texture.magFilter = LinearFilter;
      texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
      texture.unpackAlignment = 1;
      texture.needsUpdate = true;
      this.textureMade = texture;
    }
    return this.textureMade;
  }

  dispose(): void {
    this.textureMade?.dispose();
  }
}

/** GLSL for the ground shader: `lakeDistance(field)`, metres from the shore as LakeField.distanceAt. */
export const LAKE_GLSL = /* glsl */ `
uniform sampler2D uLakeMap;
// Field metres of the first cell's centre, then 1 / cell size; the grid's columns and rows.
uniform vec3 uLakeGrid;
uniform vec2 uLakeSize;
float lakeDistance(vec2 field) {
  vec2 uv = ((field - uLakeGrid.xy) * uLakeGrid.z + 0.5) / uLakeSize;
  return (texture2D(uLakeMap, uv).r * 255.0 - 128.0) * ${STEP.toFixed(1)};
}
`;
