/**
 * What grows on the field: trees, bushes and reeds.
 *
 * - along a river with `banks`: reeds at the water's edge, bushes, and a line
 *   of poplars and willows;
 * - lone trees on open ground (BattleScenery.trees): olives and oaks;
 * - woods and scrub in the areas of the scenery (BattleScenery.areas);
 * - a few trees round every farm, and bushes on steep ground.
 *
 * A plant is a trunk and a crown of leafy cards: flat pieces that carry a
 * picture of leaves with holes in it, set round the crown and lit as if they
 * lay on its surface. The pictures are drawn here once, into one texture.
 * Plants are larger than life, as the figures are, and sway in the wind.
 *
 * Nothing grows where a unit stands or passes, in a river, in the sea or on
 * the ground of a structure. Placing is seeded: the same battle always looks
 * the same.
 */

import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshDepthMaterial,
  MeshLambertMaterial,
  RGBADepthPacking,
  SRGBColorSpace,
} from "three";
import type { Battle, FieldPoint, SceneryStructure } from "@/lib/battle";
import { createRng, hashString } from "./rng";
import { occupancy } from "./structures";

type HeightAt = (x: number, y: number) => number;
type Rng = () => number;

/**
 * Plants are grouped by squares of this side, metres: a square out of view is
 * not drawn. Large squares, because every square is a draw call (two for the
 * trees, which also cast shadows), and those cost more than the triangles do.
 */
const CHUNK = 2600;
/** Ground at or below this height is sea (terrain.ts). */
const SEA_LEVEL = 0.05;

/** The pictures in the texture: four squares, two by two. */
const BROAD = 0;
const FINE = 1;
const BLADES = 2;
const SOLID = 3;

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
    leaf: new Color("#5f7440"),
    leafDark: new Color("#3d4d2b"),
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
    leaf: new Color("#86a058"),
    leafDark: new Color("#5d7740"),
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
    leaf: new Color("#98aa62"),
    leafDark: new Color("#6c7f45"),
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
    leaf: new Color("#7d8a56"),
    leafDark: new Color("#566238"),
    bark: new Color("#5a4d3e"),
  },
} satisfies Record<string, Kind>;

/** Triangles with normals, texture coordinates, colours and how far each vertex sways. */
class Leaves {
  readonly positions: number[] = [];
  readonly normals: number[] = [];
  readonly uvs: number[] = [];
  readonly colors: number[] = [];
  readonly sways: number[] = [];

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number, color: Color, shade: number, sway: number): void {
    this.positions.push(x, y, z);
    this.normals.push(nx, ny, nz);
    this.uvs.push(u, v);
    this.colors.push(color.r * shade, color.g * shade, color.b * shade);
    this.sways.push(sway);
  }

  geometry(): BufferGeometry {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(this.positions), 3));
    geometry.setAttribute("normal", new BufferAttribute(new Float32Array(this.normals), 3));
    geometry.setAttribute("uv", new BufferAttribute(new Float32Array(this.uvs), 2));
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(this.colors), 3));
    geometry.setAttribute("aSway", new BufferAttribute(new Float32Array(this.sways), 1));
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
  const corners: [number, number, number, number, number][] = [
    [-h, -height / 2, 0, 0, swayLow],
    [h, -height / 2, 1, 0, swayLow],
    [h, height / 2, 1, 1, swayHigh],
    [-h, height / 2, 0, 1, swayHigh],
  ];
  const points = corners.map(([a, up, u, v, sway]) => ({
    x: cx + ax * a + fx * up * lean,
    y: cy + up,
    z: cz + az * a + fz * up * lean,
    u: u0 + u * side,
    v: v0 + v * side,
    sway,
  }));
  for (const i of [0, 1, 2, 0, 2, 3]) {
    const p = points[i];
    out.vertex(p.x, p.y, p.z, normal[0], normal[1], normal[2], p.u, p.v, color, shade, p.sway);
  }
}

/** A tree or a bush standing at world (x, ground, z), `scale` times its usual size. */
function plant(out: Leaves, kind: Kind, x: number, ground: number, z: number, scale: number, rng: Rng): void {
  const [su, sv, side] = pictureAt(SOLID);
  const solidU = su + side / 2;
  const solidV = sv + side / 2;
  const lean = (rng() - 0.5) * 0.12;
  const leanTurn = rng() * Math.PI * 2;
  const topX = x + Math.cos(leanTurn) * lean * kind.centre * scale;
  const topZ = z + Math.sin(leanTurn) * lean * kind.centre * scale;
  const crownY = ground + kind.centre * scale;

  if (kind.trunk > 0) {
    // The trunk: a tapering post of six sides, from below the ground into the crown.
    const SIDES = 6;
    const base = (kind.girth * scale) / 2;
    const top = base * 0.45;
    const height = (kind.centre - kind.tall * 0.35) * scale;
    for (let s = 0; s < SIDES; s++) {
      const a0 = (s / SIDES) * Math.PI * 2;
      const a1 = ((s + 1) / SIDES) * Math.PI * 2;
      const shade = 0.75 + 0.3 * Math.max(Math.cos(a0 - 0.8), 0);
      const lowX = x;
      const lowZ = z;
      const highX = x + (topX - x) * 0.8;
      const highZ = z + (topZ - z) * 0.8;
      const ring = (a: number, r: number, bx: number, by: number, bz: number): [number, number, number, number, number, number] => [
        bx + Math.cos(a) * r,
        by,
        bz + Math.sin(a) * r,
        Math.cos(a),
        0.1,
        Math.sin(a),
      ];
      const quad = [ring(a0, base, lowX, ground - 0.4, lowZ), ring(a1, base, lowX, ground - 0.4, lowZ), ring(a1, top, highX, ground + height, highZ), ring(a0, top, highX, ground + height, highZ)];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const p = quad[i];
        out.vertex(p[0], p[1], p[2], p[3], p[4], p[5], solidU, solidV, kind.bark, shade, i >= 2 ? 0.25 : 0);
      }
    }
  }

  // The crown: cards set round an egg-shaped body, each lit as the body's surface there.
  for (let c = 0; c < kind.cards; c++) {
    // A point on the body, evenly spread, with some thrown inside it for depth.
    const up = 1 - (2 * (c + 0.5)) / kind.cards;
    const turn = c * 2.399963 + rng() * 0.6;
    const ring = Math.sqrt(Math.max(1 - up * up, 0));
    const depth = 0.55 + 0.45 * rng();
    const dx = Math.cos(turn) * ring;
    const dz = Math.sin(turn) * ring;
    const px = topX + dx * kind.wide * scale * depth;
    const py = crownY + up * kind.tall * scale * depth;
    const pz = topZ + dz * kind.wide * scale * depth;
    // Lit as a rounded body: the normal points outwards and a little up.
    const nl = Math.hypot(dx, up * 0.9 + 0.35, dz) || 1;
    const normal: [number, number, number] = [dx / nl, (up * 0.9 + 0.35) / nl, dz / nl];
    const size = Math.min(kind.wide, kind.tall * 1.3) * scale * (1.1 + rng() * 0.5);
    // Darker inside and below, lighter outside and on top.
    const shade = (0.72 + 0.28 * depth) * (0.86 + 0.2 * (up * 0.5 + 0.5)) * (0.92 + rng() * 0.16);
    const color = rng() < 0.35 ? kind.leafDark : kind.leaf;
    const face = rng() * Math.PI * 2;
    const swing = 0.35 + 0.65 * (up * 0.5 + 0.5);
    card(out, px, py, pz, size, size, Math.cos(face), Math.sin(face), (rng() - 0.5) * 0.5, normal, kind.picture, color, shade, swing, swing);
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

const REED_GREEN = new Color("#8e9a58");
const REED_DRY = new Color("#b4a570");

/** The pictures of leaves and blades, drawn once: white shapes on nothing, tinted by the plant. */
function drawPictures(): CanvasTexture {
  const SIZE = 512;
  const HALF = SIZE / 2;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const rng = createRng(20161118);
  ctx.clearRect(0, 0, SIZE, SIZE);

  // A clump of leaves: many small leaves, thick in the middle, loose at the edge.
  const clump = (ox: number, oy: number, leaves: number, length: number, breadth: number) => {
    for (let i = 0; i < leaves; i++) {
      const r = Math.pow(rng(), 0.7) * (HALF * 0.46);
      const a = rng() * Math.PI * 2;
      const x = ox + HALF / 2 + Math.cos(a) * r;
      const y = oy + HALF / 2 + Math.sin(a) * r * 0.92;
      const light = Math.round(150 + rng() * 105 - (r / (HALF * 0.46)) * 10);
      ctx.fillStyle = `rgb(${light},${light},${light})`;
      ctx.beginPath();
      ctx.ellipse(x, y, length * (0.7 + rng() * 0.6), breadth * (0.7 + rng() * 0.6), rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  // The picture is flipped by the texture: its row 0 is the top of the canvas.
  clump(0, HALF, 520, 9, 5.5); // BROAD: texture square 0 (bottom left)
  clump(HALF, HALF, 900, 8, 2.4); // FINE: square 1 (bottom right)

  // Blades: reeds rising from the foot of the card, with plumes on some.
  const bx = 0;
  const by = 0;
  for (let i = 0; i < 150; i++) {
    const x0 = bx + 14 + rng() * (HALF - 28);
    const top = by + 10 + rng() * HALF * 0.5;
    const lean = (rng() - 0.5) * 46;
    const light = Math.round(150 + rng() * 105);
    ctx.strokeStyle = `rgb(${light},${light},${light})`;
    ctx.lineWidth = 1.6 + rng() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x0, by + HALF - 2);
    ctx.quadraticCurveTo(x0 + lean * 0.3, (by + HALF + top) / 2, x0 + lean, top);
    ctx.stroke();
    if (rng() < 0.3) {
      ctx.fillStyle = `rgb(${light},${light},${light})`;
      ctx.beginPath();
      ctx.ellipse(x0 + lean, top + 6, 3.2, 10, lean * 0.01, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Solid: for trunks.
  ctx.fillStyle = "rgb(235,235,235)";
  ctx.fillRect(HALF, 0, HALF, HALF);

  const texture = new CanvasTexture(canvas);
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
  private readonly texture: CanvasTexture;
  private readonly time = { value: 0 };
  private readonly wind = { value: [1, 0] as [number, number] };

  constructor(battle: Battle, heightAt: HeightAt) {
    this.texture = drawPictures();
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
    const dry = (x: number, y: number) => x > minX + 20 && x < maxX - 20 && y > minY + 20 && y < maxY - 20 && heightAt(x, y) > SEA_LEVEL + 0.4;
    const inBed = (x: number, y: number, margin: number) => beds.some(({ river, half }) => distanceToLine(x, y, river.points) < half + margin);
    const built = (x: number, y: number, margin: number) => structures.some((s) => insideStructure(x, y, s, margin));
    const slope = (x: number, y: number) => Math.hypot(heightAt(x + 8, y) - heightAt(x - 8, y), heightAt(x, y + 8) - heightAt(x, y - 8)) / 16;
    const treeOk = (x: number, y: number) => dry(x, y) && !troopsWide(x, y) && !built(x, y, 12) && !inBed(x, y, 6);
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
      if (leaves.positions.length === 0) continue;
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
