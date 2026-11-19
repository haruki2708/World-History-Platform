/**
 * What grows on the field: trees, bushes and reeds.
 *
 * - along a river with `banks`: reeds at the water's edge, bushes, and a line
 *   of poplars and willows;
 * - lone trees on open ground (BattleScenery.trees): olives and oaks;
 * - woods and scrub in the areas of the scenery (BattleScenery.areas);
 * - a few trees round every farm, and bushes on steep ground.
 *
 * A plant is a trunk with a few limbs and a crown of leafy cards: flat pieces
 * that carry a picture of a spray of leaves, set round the crown and lit as
 * if they lay on its surface. The pictures are photographs of leaves and of
 * bark, put together by scripts/battles/build-foliage.py into one texture
 * (public/battles/textures/foliage.webp) and tinted here with the colour of
 * each plant. Plants are larger than life, as the figures are, and sway in
 * the wind.
 *
 * Nothing grows where a unit stands or passes, in a river, in the sea, in a
 * lake (reeds stop at its edge, trees keep a little farther off) or on the
 * ground of a structure. Placing is seeded: the same battle always looks
 * the same.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshDepthMaterial,
  MeshLambertMaterial,
  RGBADepthPacking,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from "three";
import type { Battle, FieldPoint, SceneryStructure } from "@/lib/battle";
import { createRng, hashString } from "./rng";
import { occupancy } from "./structures";

type HeightAt = (x: number, y: number) => number;
/** True on the water of a lake, or within `margin` metres of it (LakeField.wet). */
type Wet = (x: number, y: number, margin?: number) => boolean;
type Rng = () => number;

/**
 * Plants are grouped by squares of this side, metres: a square out of view is
 * not drawn. Large squares, because every square is a draw call (two for the
 * trees, which also cast shadows), and those cost more than the triangles do.
 */
const CHUNK = 2600;
/** Ground at or below this height is sea (terrain.ts). */
const SEA_LEVEL = 0.05;

/** The pictures in the texture: four squares, two by two, counted from its bottom left. */
const BLADES = 0;
const BARK = 1;
const BROAD = 2;
const FINE = 3;
/** One repeat of the bark covers this much of a trunk's height, metres. */
const BARK_SPAN = 7;
/** Sides of a trunk; even, so that the bark runs round it there and back without a seam. */
const TRUNK_SIDES = 8;

interface Kind {
  /** Height of the bare trunk, the crown's centre above the ground, its half width and half height, metres. */
  trunk: number;
  girth: number;
  centre: number;
  wide: number;
  tall: number;
  cards: number;
  picture: number;
  leaf: Color;
  leafDark: Color;
  bark: Color;
}

const KINDS = {
  olive: {
    trunk: 3.6,
    girth: 1.3,
    centre: 7.2,
    wide: 5.6,
    tall: 3.6,
    cards: 15,
    picture: FINE,
    leaf: new Color("#93a078"),
    leafDark: new Color("#66744f"),
    bark: new Color("#6d6353"),
  },
  oak: {
    trunk: 6,
    girth: 1.6,
    centre: 13,
    wide: 8.5,
    tall: 6.5,
    cards: 19,
    picture: BROAD,
    leaf: new Color("#6d9440"),
    leafDark: new Color("#4c7230"),
    bark: new Color("#5a4d3e"),
  },
  poplar: {
    trunk: 9,
    girth: 1.2,
    centre: 21,
    wide: 4.6,
    tall: 12,
    cards: 19,
    picture: BROAD,
    leaf: new Color("#8fb854"),
    leafDark: new Color("#679040"),
    bark: new Color("#8f8a7a"),
  },
  willow: {
    trunk: 4.5,
    girth: 1.5,
    centre: 9.5,
    wide: 7.5,
    tall: 5.5,
    cards: 17,
    picture: FINE,
    leaf: new Color("#a3c060"),
    leafDark: new Color("#779646"),
    bark: new Color("#6a5f4c"),
  },
  bush: {
    trunk: 0,
    girth: 0,
    centre: 1.9,
    wide: 2.8,
    tall: 1.9,
    cards: 5,
    picture: FINE,
    leaf: new Color("#84a24e"),
    leafDark: new Color("#5e7c38"),
    bark: new Color("#5a4d3e"),
  },
} satisfies Record<string, Kind>;

/**
 * Quads with normals, texture coordinates, colours and how far each vertex
 * sways: four vertices and two triangles each (0 1 2, 0 2 3), written
 * straight into typed arrays that double as they fill. A wooded field such
 * as Lake Trasimene has millions of vertices (T-055): plain arrays of
 * numbers, and three loose vertices to a triangle, made the scene slow to
 * open.
 */
class Leaves {
  /** Vertices written. */
  count = 0;
  private capacity = 0;
  private positions = new Float32Array(0);
  private normals = new Float32Array(0);
  private uvs = new Float32Array(0);
  private colors = new Float32Array(0);
  private sways = new Float32Array(0);

  /** Starts a quad: call `vertex` four times after it, in order round the quad. */
  quad(): void {
    const needed = this.count + 4;
    if (needed <= this.capacity) return;
    const capacity = Math.max(needed, this.capacity * 2, 4096);
    const grow = (array: Float32Array, size: number) => {
      const next = new Float32Array(capacity * size);
      next.set(array.subarray(0, this.count * size));
      return next;
    };
    this.positions = grow(this.positions, 3);
    this.normals = grow(this.normals, 3);
    this.uvs = grow(this.uvs, 2);
    this.colors = grow(this.colors, 3);
    this.sways = grow(this.sways, 1);
    this.capacity = capacity;
  }

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number, color: Color, shade: number, sway: number): void {
    const i = this.count++;
    const p = this.positions;
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
    const n = this.normals;
    n[i * 3] = nx;
    n[i * 3 + 1] = ny;
    n[i * 3 + 2] = nz;
    this.uvs[i * 2] = u;
    this.uvs[i * 2 + 1] = v;
    const c = this.colors;
    c[i * 3] = color.r * shade;
    c[i * 3 + 1] = color.g * shade;
    c[i * 3 + 2] = color.b * shade;
    this.sways[i] = sway;
  }

  geometry(): BufferGeometry {
    const vertices = this.count;
    const quads = vertices / 4;
    const index = vertices > 65535 ? new Uint32Array(quads * 6) : new Uint16Array(quads * 6);
    for (let q = 0, v = 0, k = 0; q < quads; q++, v += 4, k += 6) {
      index[k] = v;
      index[k + 1] = v + 1;
      index[k + 2] = v + 2;
      index[k + 3] = v;
      index[k + 4] = v + 2;
      index[k + 5] = v + 3;
    }
    const geometry = new BufferGeometry();
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.setAttribute("position", new BufferAttribute(this.positions.slice(0, vertices * 3), 3));
    geometry.setAttribute("normal", new BufferAttribute(this.normals.slice(0, vertices * 3), 3));
    geometry.setAttribute("uv", new BufferAttribute(this.uvs.slice(0, vertices * 2), 2));
    geometry.setAttribute("color", new BufferAttribute(this.colors.slice(0, vertices * 3), 3));
    geometry.setAttribute("aSway", new BufferAttribute(this.sways.slice(0, vertices), 1));
    geometry.computeBoundingSphere();
    return geometry;
  }
}

/** The corner of a picture in the texture, and its side, in texture coordinates. */
function pictureAt(picture: number): [number, number, number] {
  const margin = 0.012;
  return [(picture % 2) * 0.5 + margin, Math.floor(picture / 2) * 0.5 + margin, 0.5 - margin * 2];
}

/** A flat card standing at (cx, cy, cz), `size` across, facing the direction (fx, fz) and leaning back by `lean`. */
function card(
  out: Leaves,
  cx: number,
  cy: number,
  cz: number,
  size: number,
  height: number,
  fx: number,
  fz: number,
  lean: number,
  normal: [number, number, number],
  picture: number,
  color: Color,
  shade: number,
  swayLow: number,
  swayHigh: number,
): void {
  const [u0, v0, side] = pictureAt(picture);
  // Across the card: at right angles to the way it faces, in the ground plane.
  const ax = -fz;
  const az = fx;
  const h = size / 2;
  const up = height / 2;
  const [nx, ny, nz] = normal;
  out.quad();
  // Round the card from its lower left corner.
  out.vertex(cx - ax * h - fx * up * lean, cy - up, cz - az * h - fz * up * lean, nx, ny, nz, u0, v0, color, shade, swayLow);
  out.vertex(cx + ax * h - fx * up * lean, cy - up, cz + az * h - fz * up * lean, nx, ny, nz, u0 + side, v0, color, shade, swayLow);
  out.vertex(cx + ax * h + fx * up * lean, cy + up, cz + az * h + fz * up * lean, nx, ny, nz, u0 + side, v0 + side, color, shade, swayHigh);
  out.vertex(cx - ax * h + fx * up * lean, cy + up, cz - az * h + fz * up * lean, nx, ny, nz, u0, v0 + side, color, shade, swayHigh);
}

/**
 * Round a tube of `sides` sides: for each side, the cosine, the sine and the
 * texture's "there and back" share at its first edge and just short of its
 * second (see limb), six numbers to a side. Worked out once for each number
 * of sides: a wood has thousands of trunks.
 */
const RINGS = new Map<number, Float64Array>();

function ringTable(sides: number): Float64Array {
  let table = RINGS.get(sides);
  if (table) return table;
  table = new Float64Array(sides * 6);
  for (let s = 0; s < sides; s++) {
    for (const [k, at] of [[0, s], [3, s + 1 - 1e-4]] as const) {
      const a = (at / sides) * Math.PI * 2;
      table[s * 6 + k] = Math.cos(a);
      table[s * 6 + k + 1] = Math.sin(a);
      table[s * 6 + k + 2] = 1 - Math.abs(1 - ((at / sides) * 2) % 2);
    }
  }
  RINGS.set(sides, table);
  return table;
}

/**
 * A tapering tube of bark from one point to another, `sides` round. The bark
 * runs round it there and back and up it in `spans` repeats, there and back
 * as well: the picture is one square of a larger texture and cannot repeat.
 */
function limb(
  out: Leaves,
  from: [number, number, number],
  to: [number, number, number],
  radiusFrom: number,
  radiusTo: number,
  sides: number,
  spans: number,
  color: Color,
  swayFrom: number,
  swayTo: number,
): void {
  const [u0, v0, side] = pictureAt(BARK);
  const ax = to[0] - from[0];
  const ay = to[1] - from[1];
  const az = to[2] - from[2];
  const length = Math.hypot(ax, ay, az) || 1;
  // Two directions across the tube.
  let px = -az;
  let pz = ax;
  const flat = Math.hypot(px, pz);
  if (flat < 1e-4) {
    px = 1;
    pz = 0;
  } else {
    px /= flat;
    pz /= flat;
  }
  const qx = (ay * pz) / length;
  const qy = (az * px - ax * pz) / length;
  const qz = (-ay * px) / length;
  const table = ringTable(sides);
  // `i`: where in the table the edge's cosine, sine and share round are.
  const ring = (t: number, i: number): void => {
    const c = table[i];
    const d = table[i + 1];
    const r = radiusFrom + (radiusTo - radiusFrom) * t;
    const nx = px * c + qx * d;
    const ny = qy * d;
    const nz = pz * c + qz * d;
    // There and back, round and along.
    const round = table[i + 2];
    const along = 1 - Math.abs(1 - ((t * spans) % 2));
    out.vertex(
      from[0] + ax * t + nx * r,
      from[1] + ay * t + ny * r,
      from[2] + az * t + nz * r,
      nx,
      ny,
      nz,
      u0 + round * side,
      v0 + along * side,
      color,
      1,
      swayFrom + (swayTo - swayFrom) * t,
    );
  };
  for (let k = 0; k < spans; k++) {
    const t0 = k / spans;
    // Just short of the next repeat, so that it is not read as the start of one.
    const t1 = (k + 1) / spans - 1e-4;
    for (let s = 0; s < sides; s++) {
      out.quad();
      ring(t0, s * 6);
      ring(t0, s * 6 + 3);
      ring(t1, s * 6 + 3);
      ring(t1, s * 6);
    }
  }
}

/** A tree or a bush standing at world (x, ground, z), `scale` times its usual size. */
function plant(out: Leaves, kind: Kind, x: number, ground: number, z: number, scale: number, rng: Rng): void {
  const lean = (rng() - 0.5) * 0.12;
  const leanTurn = rng() * Math.PI * 2;
  const topX = x + Math.cos(leanTurn) * lean * kind.centre * scale;
  const topZ = z + Math.sin(leanTurn) * lean * kind.centre * scale;
  const crownY = ground + kind.centre * scale;
  // Where the limbs end: among the first cards of the crown.
  const ends: [number, number, number][] = [];

  // The crown: cards set round an egg-shaped body, each lit as the body's surface there.
  const cards = Math.round(kind.cards * 1.5);
  for (let c = 0; c < cards; c++) {
    // A point on the body, evenly spread, with some thrown inside it for depth.
    const up = 1 - (2 * (c + 0.5)) / cards;
    const turn = c * 2.399963 + rng() * 0.6;
    const ring = Math.sqrt(Math.max(1 - up * up, 0));
    const depth = 0.55 + 0.45 * rng();
    const dx = Math.cos(turn) * ring;
    const dz = Math.sin(turn) * ring;
    const px = topX + dx * kind.wide * scale * depth;
    const py = crownY + up * kind.tall * scale * depth;
    const pz = topZ + dz * kind.wide * scale * depth;
    // Lit as a rounded body: the normal points outwards and a little up.
    const nl = Math.hypot(dx * 0.55, up * 0.5 + 0.85, dz * 0.55) || 1;
    const normal: [number, number, number] = [(dx * 0.55) / nl, (up * 0.5 + 0.85) / nl, (dz * 0.55) / nl];
    const size = Math.min(kind.wide, kind.tall * 1.3) * scale * (0.85 + rng() * 0.45);
    // Darker inside and below, lighter outside and on top.
    const shade = (0.72 + 0.34 * depth) * (0.82 + 0.3 * (up * 0.5 + 0.5)) * (0.92 + rng() * 0.16);
    const color = rng() < 0.35 ? kind.leafDark : kind.leaf;
    const face = rng() * Math.PI * 2;
    const swing = 0.35 + 0.65 * (up * 0.5 + 0.5);
    card(out, px, py, pz, size, size, Math.cos(face), Math.sin(face), (rng() - 0.5) * 0.5, normal, kind.picture, color, shade, swing, swing);
    if (up < 0.35 && up > -0.75 && ends.length < 4 && c % 3 === 0) ends.push([px, py - size * 0.15, pz]);
  }

  if (kind.trunk > 0) {
    // The trunk: spread at the foot like roots, tapering into the crown; then a few limbs out into it.
    const base = (kind.girth * scale) / 2;
    const top = base * 0.5;
    const height = (kind.centre - kind.tall * 0.35) * scale;
    const foot = Math.min(1.1 * scale, height * 0.2);
    const headX = x + (topX - x) * 0.8;
    const headZ = z + (topZ - z) * 0.8;
    const kneeX = x + (headX - x) * (foot / height);
    const kneeZ = z + (headZ - z) * (foot / height);
    limb(out, [x, ground - 0.5, z], [kneeX, ground + foot, kneeZ], base * 1.7, base, TRUNK_SIDES, 1, kind.bark, 0, 0);
    limb(
      out,
      [kneeX, ground + foot, kneeZ],
      [headX, ground + height, headZ],
      base,
      top,
      TRUNK_SIDES,
      Math.max(Math.round((height - foot) / BARK_SPAN), 1),
      kind.bark,
      0,
      0.25,
    );
    for (const end of ends) {
      const from = 0.72 + rng() * 0.22;
      limb(
        out,
        [kneeX + (headX - kneeX) * from, ground + foot + (height - foot) * from, kneeZ + (headZ - kneeZ) * from],
        end,
        top * 0.7,
        top * 0.18,
        4,
        1,
        kind.bark,
        0.2,
        0.45,
      );
    }
  }
}

/** A clump of reeds: three cards of blades standing crosswise. */
function reeds(out: Leaves, x: number, ground: number, z: number, scale: number, rng: Rng): void {
  const height = 5.2 * scale;
  const width = 4.6 * scale;
  const tint = rng() < 0.4 ? REED_DRY : REED_GREEN;
  const turn = rng() * Math.PI;
  for (let c = 0; c < 3; c++) {
    const a = turn + (c * Math.PI) / 3;
    card(out, x, ground + height / 2 - 0.3, z, width, height, Math.cos(a), Math.sin(a), 0, [0, 1, 0], BLADES, tint, 0.9 + rng() * 0.2, 0, 1);
  }
}

const REED_GREEN = new Color("#7f9450");
const REED_DRY = new Color("#a89a66");

/** The photographed leaves and bark (scripts/battles/build-foliage.py), tinted by each plant. */
function loadPictures(): Texture {
  const texture = new TextureLoader().load("/battles/textures/foliage.webp");
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function distanceToLine(x: number, y: number, points: FieldPoint[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, y - a.y - dy * t));
  }
  return best;
}

function insideStructure(x: number, y: number, structure: SceneryStructure, margin: number): boolean {
  const a = (structure.facing * Math.PI) / 180;
  const dx = x - structure.center.x;
  const dy = y - structure.center.y;
  const across = dx * Math.cos(a) - dy * Math.sin(a);
  const ahead = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(across) <= structure.width / 2 + margin && Math.abs(ahead) <= structure.depth / 2 + margin;
}

function insideOutline(x: number, y: number, outline: FieldPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i];
    const b = outline[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export class Vegetation {
  readonly group = new Group();
  private readonly material: MeshLambertMaterial;
  private readonly depthMaterial: MeshDepthMaterial;
  private readonly texture: Texture;
  private readonly time = { value: 0 };
  private readonly wind = { value: [1, 0] as [number, number] };

  constructor(battle: Battle, heightAt: HeightAt, wet: Wet = () => false) {
    this.texture = loadPictures();
    this.material = this.leafMaterial();
    this.depthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: this.texture, alphaTest: 0.45, side: DoubleSide });
    const scenery = battle.terrain.scenery;
    if (!scenery) return;
    if (scenery.wind) {
      // The wind blows from `from`: plants lean the other way.
      const a = ((scenery.wind.from + 180) * Math.PI) / 180;
      this.wind.value = [Math.sin(a), -Math.cos(a)];
    }

    const { minX, maxX, minY, maxY, rivers } = battle.terrain;
    const rng = createRng(hashString(`${battle.id}/vegetation`));
    // Trees keep well clear of where the armies stand and move; low growth less so.
    const troopsWide = occupancy(battle, 55);
    const troops = occupancy(battle, 14);
    const structures = scenery.structures;
    const beds = rivers.map((river) => ({ river, half: river.level?.stage === "low" ? river.width * 0.95 : river.width * 0.54 }));
    const dry = (x: number, y: number) =>
      x > minX + 20 && x < maxX - 20 && y > minY + 20 && y < maxY - 20 && heightAt(x, y) > SEA_LEVEL + 0.4 && !wet(x, y, 1);
    const inBed = (x: number, y: number, margin: number) => beds.some(({ river, half }) => distanceToLine(x, y, river.points) < half + margin);
    const built = (x: number, y: number, margin: number) => structures.some((s) => insideStructure(x, y, s, margin));
    const slope = (x: number, y: number) => Math.hypot(heightAt(x + 8, y) - heightAt(x - 8, y), heightAt(x, y + 8) - heightAt(x, y - 8)) / 16;
    const treeOk = (x: number, y: number) => dry(x, y) && !troopsWide(x, y) && !built(x, y, 12) && !inBed(x, y, 6) && !wet(x, y, 10);
    const lowOk = (x: number, y: number) => dry(x, y) && !troops(x, y) && !built(x, y, 4);

    // Trees apart from the low growth: only the trees cast shadows.
    const chunks = new Map<string, Leaves>();
    const chunkAt = (x: number, y: number, tall: boolean): Leaves => {
      const key = `${tall ? "t" : "l"}${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`;
      let leaves = chunks.get(key);
      if (!leaves) {
        leaves = new Leaves();
        chunks.set(key, leaves);
      }
      return leaves;
    };
    const leavesAt = (x: number, y: number): Leaves => chunkAt(x, y, false);
    const grow = (kind: Kind, x: number, y: number, scale: number) =>
      plant(chunkAt(x, y, kind.trunk > 0), kind, x, heightAt(x, y), -y, scale, rng);

    // Along the rivers.
    for (const { river, half } of beds) {
      if (!river.banks) continue;
      const belt = river.banks.width;
      for (let i = 0; i + 1 < river.points.length; i++) {
        const a = river.points[i];
        const b = river.points[i + 1];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const nx = -(b.y - a.y) / (length || 1);
        const ny = (b.x - a.x) / (length || 1);
        for (let s = 0; s < length; s += 6) {
          for (const sideOf of [-1, 1]) {
            const along = s + rng() * 6;
            const px = a.x + ((b.x - a.x) * along) / length;
            const py = a.y + ((b.y - a.y) * along) / length;
            const place = (offset: number): [number, number] => [px + nx * sideOf * offset, py + ny * sideOf * offset];
            const roll = rng();
            // Reeds at the water's edge and on the bars; bushes and trees behind them.
            if (roll < 0.55) {
              const [x, y] = place(half * (0.75 + rng() * 0.3) + rng() * 5);
              if (lowOk(x, y)) reeds(leavesAt(x, y), x, heightAt(x, y), -y, 0.8 + rng() * 0.5, rng);
            }
            if (roll > 0.35 && roll < 0.7) {
              const [x, y] = place(half + 5 + rng() * belt);
              if (lowOk(x, y) && !inBed(x, y, 2)) grow(KINDS.bush, x, y, 0.9 + rng() * 0.9);
            }
            if (roll > 0.8) {
              const [x, y] = place(half + 9 + rng() * (belt + 8));
              if (treeOk(x, y)) grow(rng() < 0.55 ? KINDS.poplar : KINDS.willow, x, y, 0.8 + rng() * 0.5);
            }
          }
        }
      }
    }

    // Lone trees on open ground, one to a square of the size the density gives.
    if (scenery.trees && scenery.trees.perSquareKm > 0) {
      const cell = Math.sqrt(1e6 / scenery.trees.perSquareKm);
      for (let y = minY; y < maxY; y += cell) {
        for (let x = minX; x < maxX; x += cell) {
          const tx = x + rng() * cell;
          const ty = y + rng() * cell;
          const olive = rng() < 0.6;
          const scale = 0.8 + rng() * 0.5;
          if (!treeOk(tx, ty) || slope(tx, ty) > 0.2 || inBed(tx, ty, 60)) continue;
          grow(olive ? KINDS.olive : KINDS.oak, tx, ty, scale);
        }
      }
    }

    // Woods, scrub and reed beds in the areas of the scenery.
    for (const area of scenery.areas) {
      const spacing = area.cover === "woodland" ? 15 : area.cover === "scrub" ? 9 : area.cover === "reeds" ? 5 : 0;
      if (spacing === 0) continue;
      const xs = area.outline.map((p) => p.x);
      const ys = area.outline.map((p) => p.y);
      for (let y = Math.min(...ys); y <= Math.max(...ys); y += spacing) {
        for (let x = Math.min(...xs); x <= Math.max(...xs); x += spacing) {
          const px = x + (rng() - 0.5) * spacing;
          const py = y + (rng() - 0.5) * spacing;
          const roll = rng();
          if (!insideOutline(px, py, area.outline)) continue;
          if (area.cover === "woodland") {
            if (!treeOk(px, py)) continue;
            if (roll < 0.62) grow(KINDS.oak, px, py, 0.7 + rng() * 0.6);
            else if (roll < 0.8) grow(KINDS.olive, px, py, 0.9 + rng() * 0.5);
            else grow(KINDS.bush, px, py, 1 + rng());
          } else if (area.cover === "scrub") {
            if (lowOk(px, py) && roll < 0.7) grow(KINDS.bush, px, py, 0.8 + rng() * 1.1);
          } else if (lowOk(px, py)) {
            reeds(leavesAt(px, py), px, heightAt(px, py), -py, 0.8 + rng() * 0.5, rng);
          }
        }
      }
    }

    // A few trees stand round every farm and village.
    for (const structure of structures) {
      if (structure.kind !== "farm" && structure.kind !== "village") continue;
      const count = structure.kind === "farm" ? 5 : 9;
      const reach = Math.hypot(structure.width, structure.depth) / 2;
      for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2;
        const r = reach + 6 + rng() * 22;
        const x = structure.center.x + Math.cos(a) * r;
        const y = structure.center.y + Math.sin(a) * r;
        if (treeOk(x, y)) grow(rng() < 0.5 ? KINDS.olive : KINDS.oak, x, y, 0.75 + rng() * 0.45);
      }
    }

    // Bushes take hold on steep ground, which no plough reaches.
    for (let y = minY; y < maxY; y += 22) {
      for (let x = minX; x < maxX; x += 22) {
        const px = x + rng() * 22;
        const py = y + rng() * 22;
        const roll = rng();
        const steep = slope(px, py);
        if (steep < 0.13 || roll > Math.min((steep - 0.1) * 5, 0.8)) continue;
        if (lowOk(px, py) && !inBed(px, py, 4)) grow(KINDS.bush, px, py, 0.9 + rng() * 1.2);
      }
    }

    for (const [key, leaves] of chunks) {
      if (leaves.count === 0) continue;
      const mesh = new Mesh(leaves.geometry(), this.material);
      mesh.customDepthMaterial = this.depthMaterial;
      mesh.castShadow = key.startsWith("t");
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  /** Call every frame: the plants sway. */
  update(seconds: number): void {
    this.time.value = seconds;
  }

  dispose(): void {
    for (const child of this.group.children) (child as Mesh).geometry.dispose();
    this.material.dispose();
    this.depthMaterial.dispose();
    this.texture.dispose();
  }

  private leafMaterial(): MeshLambertMaterial {
    const material = new MeshLambertMaterial({
      map: this.texture,
      vertexColors: true,
      alphaTest: 0.45,
      alphaToCoverage: true,
      side: DoubleSide,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSwayTime = this.time;
      shader.uniforms.uWind = this.wind;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          attribute float aSway;
          uniform float uSwayTime;
          uniform vec2 uWind;`,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          {
            // A slow lean with the wind and a quicker flutter, more at the top of the plant.
            float gust = sin(uSwayTime * 0.7 + position.x * 0.013 + position.z * 0.011);
            float flutter = sin(uSwayTime * 2.6 + position.x * 0.9 + position.y * 0.7 + position.z * 0.8);
            vec2 push = uWind * (0.35 + 0.3 * gust) + vec2(flutter, -flutter) * 0.07;
            transformed.xz += push * aSway;
          }`,
        );
      // Both faces of a card are lit alike, as the surface of the crown it stands for.
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_begin>",
        /* glsl */ `#include <normal_fragment_begin>
        normal = normalize(vNormal);`,
      );
    };
    material.customProgramCacheKey = () => "battle-vegetation";
    return material;
  }
}
