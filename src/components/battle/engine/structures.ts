/**
 * What is built on the field (BattleScenery.structures): the camps with
 * ditch, rampart, palisade, gates and tents; a citadel with its wall, towers
 * and store-houses; a village or a farm of small houses, some in ruins.
 *
 * Everything is made here from simple shapes, laid on the ground of the
 * battle and placed by a seeded generator: the same battle always looks the
 * same. The ground a structure covers is at true size; what stands on it is
 * drawn larger than life and fewer, as the men are (FIGURE_SCALE): one tent
 * stands for the tents of twenty men.
 *
 * Tents are left out wherever a unit stands or passes, so that no figure
 * walks through one.
 */

import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, MeshLambertMaterial } from "three";
import { type Battle, type Formation, MEN_PER_FIGURE, type SceneryStructure } from "@/lib/battle";
import { createRng, hashString } from "./rng";

type HeightAt = (x: number, y: number) => number;
type Rng = () => number;
/** A point in the world: x east, y up, z south. */
type P = [number, number, number];

/** Ground a Roman camp gives each man, m² (docs/data/battles/cannae.md, 12). */
const GROUND_PER_MAN = 19.1;

/** Surfaces, for the patterns the shader lays on them. */
const EARTH = 0;
const TIMBER = 1;
const CLOTH = 2;
const STONE = 3;
const PLASTER = 4;
const TILE = 5;
const THATCH = 6;

const COLORS = {
  ditch: new Color("#5d5140"),
  rampart: new Color("#9a8763"),
  rampartTop: new Color("#a8956c"),
  stake: new Color("#7a6247"),
  timber: new Color("#6b543c"),
  leather: new Color("#a88862"),
  leatherDark: new Color("#8c6c49"),
  linen: new Color("#c9bb98"),
  wool: new Color("#8c7f6a"),
  pavilion: new Color("#b9a27a"),
  stone: new Color("#c2b596"),
  stoneDark: new Color("#a89b7e"),
  plaster: new Color("#d6c8a8"),
  mudbrick: new Color("#b59a72"),
  tile: new Color("#a9603f"),
  thatch: new Color("#a08a55"),
  rubble: new Color("#a3977d"),
  door: new Color("#3d2f22"),
};

/** Triangles with a colour and a kind of surface per vertex. */
class Shapes {
  private readonly positions: number[] = [];
  private readonly colors: number[] = [];
  private readonly kinds: number[] = [];

  get empty(): boolean {
    return this.positions.length === 0;
  }

  tri(a: P, b: P, c: P, color: Color, kind: number, shade = 1): void {
    this.positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) {
      this.colors.push(color.r * shade, color.g * shade, color.b * shade);
      this.kinds.push(kind);
    }
  }

  quad(a: P, b: P, c: P, d: P, color: Color, kind: number, shade = 1): void {
    this.tri(a, b, c, color, kind, shade);
    this.tri(a, c, d, color, kind, shade);
  }

  geometry(): BufferGeometry {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(this.positions), 3));
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(this.colors), 3));
    geometry.setAttribute("aKind", new BufferAttribute(new Float32Array(this.kinds), 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }
}

/** The ground of a structure: metres across (u) and ahead (v) from its centre to the field. */
class Plot {
  readonly hw: number;
  readonly hd: number;
  private readonly alongX: number;
  private readonly alongY: number;
  private readonly aheadX: number;
  private readonly aheadY: number;

  constructor(
    private readonly structure: SceneryStructure,
    private readonly heightAt: HeightAt,
  ) {
    const a = (structure.facing * Math.PI) / 180;
    this.aheadX = Math.sin(a);
    this.aheadY = Math.cos(a);
    this.alongX = Math.cos(a);
    this.alongY = -Math.sin(a);
    this.hw = structure.width / 2;
    this.hd = structure.depth / 2;
  }

  fieldX(u: number, v: number): number {
    return this.structure.center.x + this.alongX * u + this.aheadX * v;
  }

  fieldY(u: number, v: number): number {
    return this.structure.center.y + this.alongY * u + this.aheadY * v;
  }

  ground(u: number, v: number): number {
    return this.heightAt(this.fieldX(u, v), this.fieldY(u, v));
  }

  /** The world point `up` metres above the ground at (u, v). */
  at(u: number, v: number, up = 0): P {
    const x = this.fieldX(u, v);
    const y = this.fieldY(u, v);
    return [x, this.heightAt(x, y) + up, -y];
  }

  /** The world point at a given height above sea level. */
  level(u: number, v: number, height: number): P {
    return [this.fieldX(u, v), height, -this.fieldY(u, v)];
  }
}

/**
 * A box-shaped building on the plot: walls from the ground (which may slope)
 * up to a level top, and a roof with a ridge along its length. `angle` turns
 * it on the plot, radians. Without `roof` the walls stand open and ragged.
 */
function building(
  shapes: Shapes,
  plot: Plot,
  u: number,
  v: number,
  length: number,
  width: number,
  wall: number,
  angle: number,
  look: { wall: Color; wallKind: number; roof?: { color: Color; kind: number; rise: number }; rng: Rng; door?: boolean },
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corner = (i: number, j: number): [number, number] => [
    u + cos * i * (length / 2) - sin * j * (width / 2),
    v + sin * i * (length / 2) + cos * j * (width / 2),
  ];
  const corners = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
  // The top is level: it stands `wall` above the highest corner of the ground.
  const base = Math.max(...corners.map(([cu, cv]) => plot.ground(cu, cv)));
  const top = base + wall;
  const shade = 0.92 + look.rng() * 0.16;
  for (let i = 0; i < 4; i++) {
    const [u0, v0] = corners[i];
    const [u1, v1] = corners[(i + 1) % 4];
    // Ruined walls end at uneven heights.
    const t0 = look.roof ? top : base + wall * (0.25 + look.rng() * 0.75);
    const t1 = look.roof ? top : base + wall * (0.25 + look.rng() * 0.75);
    shapes.quad(
      plot.at(u0, v0, -0.5),
      plot.at(u1, v1, -0.5),
      plot.level(u1, v1, t1),
      plot.level(u0, v0, t0),
      look.wall,
      look.wallKind,
      shade * (i % 2 === 0 ? 1 : 0.9),
    );
  }
  if (look.door) {
    // A dark doorway in the middle of one long side, just proud of the wall.
    const [du, dv] = corner(0, -1.02);
    const half = Math.min(length * 0.09, 1.6);
    const height = Math.min(wall * 0.62, 5.2);
    shapes.quad(
      plot.level(du - cos * half, dv - sin * half, base - 0.3),
      plot.level(du + cos * half, dv + sin * half, base - 0.3),
      plot.level(du + cos * half, dv + sin * half, base + height),
      plot.level(du - cos * half, dv - sin * half, base + height),
      COLORS.door,
      TIMBER,
    );
  }
  if (!look.roof) return;
  const { color, kind, rise } = look.roof;
  const eave = 0.07;
  const r0 = corner(-1 - eave, 0);
  const r1 = corner(1 + eave, 0);
  const e = [corner(-1 - eave, -1 - eave * 2), corner(1 + eave, -1 - eave * 2), corner(1 + eave, 1 + eave * 2), corner(-1 - eave, 1 + eave * 2)];
  const ridge0 = plot.level(r0[0], r0[1], top + rise);
  const ridge1 = plot.level(r1[0], r1[1], top + rise);
  const eaves = e.map(([eu, ev]) => plot.level(eu, ev, top - 0.2));
  const roofShade = 0.9 + look.rng() * 0.2;
  shapes.quad(eaves[0], eaves[1], ridge1, ridge0, color, kind, roofShade);
  shapes.quad(eaves[2], eaves[3], ridge0, ridge1, color, kind, roofShade * 0.88);
  // Gables.
  const g = [corner(-1, -1), corner(-1, 1), corner(1, -1), corner(1, 1)].map(([gu, gv]) => plot.level(gu, gv, top));
  shapes.tri(g[0], g[1], ridge0, look.wall, look.wallKind, shade * 0.95);
  shapes.tri(g[2], g[3], ridge1, look.wall, look.wallKind, shade * 0.95);
}

/** A tent: low walls and a ridged roof of hide or cloth, standing on the ground. */
function tent(shapes: Shapes, plot: Plot, u: number, v: number, length: number, width: number, wall: number, ridge: number, angle: number, color: Color, shade: number): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corner = (i: number, j: number): [number, number] => [
    u + cos * i * (length / 2) - sin * j * (width / 2),
    v + sin * i * (length / 2) + cos * j * (width / 2),
  ];
  const ground = plot.ground(u, v);
  const c = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
  const foot = c.map(([cu, cv]) => plot.level(cu, cv, ground - 0.3));
  const eave = c.map(([cu, cv]) => plot.level(cu, cv, ground + wall));
  const [a0, a1] = [corner(-1, 0), corner(1, 0)];
  const top0 = plot.level(a0[0], a0[1], ground + ridge);
  const top1 = plot.level(a1[0], a1[1], ground + ridge);
  shapes.quad(foot[0], foot[1], eave[1], eave[0], color, CLOTH, shade * 0.86);
  shapes.quad(foot[2], foot[3], eave[3], eave[2], color, CLOTH, shade * 0.8);
  shapes.quad(foot[1], foot[2], eave[2], eave[1], color, CLOTH, shade * 0.78);
  shapes.quad(foot[3], foot[0], eave[0], eave[3], color, CLOTH, shade * 0.78);
  shapes.quad(eave[0], eave[1], top1, top0, color, CLOTH, shade);
  shapes.quad(eave[2], eave[3], top0, top1, color, CLOTH, shade * 0.9);
  shapes.tri(eave[3], eave[0], top0, color, CLOTH, shade * 0.82);
  shapes.tri(eave[1], eave[2], top1, color, CLOTH, shade * 0.82);
}

/** An upright box of timber or stone on the ground at (u, v): a tower, a gate post. */
function tower(shapes: Shapes, plot: Plot, u: number, v: number, size: number, height: number, color: Color, kind: number, cap?: { color: Color; kind: number; rise: number }): void {
  const h = size / 2;
  const c: [number, number][] = [
    [u - h, v - h],
    [u + h, v - h],
    [u + h, v + h],
    [u - h, v + h],
  ];
  const base = Math.max(...c.map(([cu, cv]) => plot.ground(cu, cv)));
  const top = base + height;
  for (let i = 0; i < 4; i++) {
    const [u0, v0] = c[i];
    const [u1, v1] = c[(i + 1) % 4];
    shapes.quad(plot.at(u0, v0, -0.5), plot.at(u1, v1, -0.5), plot.level(u1, v1, top), plot.level(u0, v0, top), color, kind, i % 2 === 0 ? 1 : 0.88);
  }
  const t = c.map(([cu, cv]) => plot.level(cu, cv, top));
  if (cap) {
    const peak = plot.level(u, v, top + cap.rise);
    for (let i = 0; i < 4; i++) shapes.tri(t[i], t[(i + 1) % 4], peak, cap.color, cap.kind, i % 2 === 0 ? 1 : 0.86);
  } else {
    shapes.quad(t[0], t[1], t[2], t[3], color, kind, 1.05);
  }
}

/** The four sides of a plot as runs of points `step` apart, each side with a gap of `gap` metres in its middle. */
function perimeter(plot: Plot, inset: number, step: number, gap: number): { u: number; v: number; nu: number; nv: number }[][] {
  const hw = plot.hw - inset;
  const hd = plot.hd - inset;
  const sides: { from: [number, number]; to: [number, number]; n: [number, number] }[] = [
    { from: [-hw, hd], to: [hw, hd], n: [0, 1] },
    { from: [hw, hd], to: [hw, -hd], n: [1, 0] },
    { from: [hw, -hd], to: [-hw, -hd], n: [0, -1] },
    { from: [-hw, -hd], to: [-hw, hd], n: [-1, 0] },
  ];
  const runs: { u: number; v: number; nu: number; nv: number }[][] = [];
  for (const side of sides) {
    const length = Math.hypot(side.to[0] - side.from[0], side.to[1] - side.from[1]);
    const halves: [number, number][] = gap > 0 ? [[0, length / 2 - gap / 2], [length / 2 + gap / 2, length]] : [[0, length]];
    for (const [start, end] of halves) {
      const count = Math.max(Math.round((end - start) / step), 1);
      const run: { u: number; v: number; nu: number; nv: number }[] = [];
      for (let i = 0; i <= count; i++) {
        const t = (start + ((end - start) * i) / count) / length;
        run.push({
          u: side.from[0] + (side.to[0] - side.from[0]) * t,
          v: side.from[1] + (side.to[1] - side.from[1]) * t,
          nu: side.n[0],
          nv: side.n[1],
        });
      }
      runs.push(run);
    }
  }
  return runs;
}

/** Earthworks of a camp: ditch, rampart and palisade round it, with a gate in each side. */
function earthworks(shapes: Shapes, plot: Plot, rng: Rng): void {
  const GATE = 22;
  const HEIGHT = 3;
  for (const run of perimeter(plot, 4, 8, GATE)) {
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i];
      const b = run[i + 1];
      const off = (p: typeof a, out: number, up: number): P => plot.at(p.u + p.nu * out, p.v + p.nv * out, up);
      // Ditch: a dark strip outside the rampart.
      shapes.quad(off(a, 4.2, 0.12), off(b, 4.2, 0.12), off(b, 9.5, 0.12), off(a, 9.5, 0.12), COLORS.ditch, EARTH);
      // Rampart: outer slope, top, inner slope.
      shapes.quad(off(a, 4, -0.3), off(b, 4, -0.3), off(b, 1.3, HEIGHT), off(a, 1.3, HEIGHT), COLORS.rampart, EARTH, 0.95);
      shapes.quad(off(a, 1.3, HEIGHT), off(b, 1.3, HEIGHT), off(b, -1.3, HEIGHT), off(a, -1.3, HEIGHT), COLORS.rampartTop, EARTH);
      shapes.quad(off(a, -1.3, HEIGHT), off(b, -1.3, HEIGHT), off(b, -4.5, -0.3), off(a, -4.5, -0.3), COLORS.rampart, EARTH, 0.88);
      // Palisade: pointed stakes along the outer edge of the top.
      const length = Math.hypot(b.u - a.u, b.v - a.v);
      const stakes = Math.max(Math.round(length / 1.25), 1);
      for (let s = 0; s < stakes; s++) {
        const t0 = s / stakes;
        const t1 = (s + 0.78) / stakes;
        const tall = HEIGHT + 2.7 + rng() * 0.9;
        const at = (t: number, up: number): P => plot.at(a.u + (b.u - a.u) * t + a.nu * 1.1, a.v + (b.v - a.v) * t + a.nv * 1.1, up);
        const shade = 0.82 + rng() * 0.3;
        shapes.quad(at(t0, HEIGHT - 0.2), at(t1, HEIGHT - 0.2), at(t1, tall - 0.6), at(t0, tall - 0.6), COLORS.stake, TIMBER, shade);
        shapes.tri(at(t0, tall - 0.6), at(t1, tall - 0.6), at((t0 + t1) / 2, tall), COLORS.stake, TIMBER, shade);
      }
    }
  }
  // Gates: two timber towers and a beam across, in the middle of each side.
  const gates: [number, number, number, number][] = [
    [0, plot.hd - 4, 1, 0],
    [plot.hw - 4, 0, 0, 1],
    [0, -plot.hd + 4, 1, 0],
    [-plot.hw + 4, 0, 0, 1],
  ];
  for (const [u, v, du, dv] of gates) {
    const half = GATE / 2 + 1.5;
    for (const side of [-1, 1]) tower(shapes, plot, u + du * half * side, v + dv * half * side, 5.5, 11, COLORS.timber, TIMBER);
    const ground = plot.ground(u, v);
    const beam = (s: number, up: number, out: number): P => plot.level(u + du * half * s + dv * out, v + dv * half * s + du * out, ground + up);
    shapes.quad(beam(-1, 8.2, -0.8), beam(1, 8.2, -0.8), beam(1, 9.6, -0.8), beam(-1, 9.6, -0.8), COLORS.timber, TIMBER, 0.9);
    shapes.quad(beam(-1, 8.2, 0.8), beam(1, 8.2, 0.8), beam(1, 9.6, 0.8), beam(-1, 9.6, 0.8), COLORS.timber, TIMBER, 0.8);
    shapes.quad(beam(-1, 9.6, -0.8), beam(1, 9.6, -0.8), beam(1, 9.6, 0.8), beam(-1, 9.6, 0.8), COLORS.timber, TIMBER, 1.05);
  }
}

/**
 * The tents of a camp. A Roman camp is laid out by rule: straight rows, a
 * broad street across and one down the middle, a clear space inside the
 * rampart. Nothing is known of a Carthaginian camp: its tents stand loosely.
 */
function tents(chunks: Shapes[], plot: Plot, roman: boolean, occupied: (x: number, y: number) => boolean, rng: Rng): void {
  /** Clear space between rampart and tents: 200 Roman feet. */
  const CLEAR = 59;
  const hw = plot.hw - CLEAR;
  const hd = plot.hd - CLEAR;
  if (hw <= 20 || hd <= 20) return;
  // One tent drawn for the tents of MEN_PER_FIGURE men.
  const pitch = Math.sqrt(GROUND_PER_MAN * MEN_PER_FIGURE) * 0.94;
  const cols = Math.floor((hw * 2) / pitch);
  const rows = Math.floor((hd * 2) / pitch);
  const cross = hd * 0.3;
  const CHUNK = 14;
  const chunkCols = Math.ceil(cols / CHUNK) || 1;
  const byChunk = new Map<number, Shapes>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let u = -hw + (c + 0.5) * ((hw * 2) / cols);
      let v = -hd + (r + 0.5) * ((hd * 2) / rows);
      let angle = 0;
      let color = COLORS.leather;
      const roll = rng();
      const shade = 0.82 + rng() * 0.32;
      if (roman) {
        // Streets: the broad one across, one down the middle, and the headquarters' square.
        if (Math.abs(v - cross) < 17 || Math.abs(u) < 13) continue;
        if (Math.abs(u) < 60 && v > cross - 95 && v < cross) continue;
        // Lanes between the blocks of the maniples.
        if (c % 6 === 5 || r % 5 === 4) continue;
        if (roll < 0.25) color = COLORS.leatherDark;
      } else {
        if (roll < 0.1) continue;
        u += (rng() - 0.5) * pitch * 0.7;
        v += (rng() - 0.5) * pitch * 0.7;
        angle = rng() * Math.PI;
        color = roll < 0.4 ? COLORS.wool : roll < 0.7 ? COLORS.linen : COLORS.leather;
        if (Math.hypot(u, v) < 45) continue;
      }
      if (occupied(plot.fieldX(u, v), plot.fieldY(u, v))) continue;
      const key = Math.floor(r / CHUNK) * chunkCols + Math.floor(c / CHUNK);
      let shapes = byChunk.get(key);
      if (!shapes) {
        shapes = new Shapes();
        byChunk.set(key, shapes);
      }
      tent(shapes, plot, u, v, 9.5, 7.5, 1.1, 4.4, angle, color, shade);
    }
  }
  // The commander's tent: larger, in the square by the broad street.
  const head = new Shapes();
  const [pu, pv] = roman ? [0, cross - 50] : [0, 0];
  if (!occupied(plot.fieldX(pu, pv), plot.fieldY(pu, pv))) tent(head, plot, pu, pv, 26, 19, 3.2, 10, 0, COLORS.pavilion, 1);
  chunks.push(head, ...byChunk.values());
}

/** A walled stronghold: wall, corner towers, a gate in the front, store-houses inside. */
function citadel(shapes: Shapes, plot: Plot, rng: Rng): void {
  const WALL = 9;
  const GATE = 12;
  // The wall stands on the edge of the plot; only the front has a gate.
  const runs = perimeter(plot, 2, 6, 0);
  for (const run of runs) {
    const front = run[0].nv === 1;
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i];
      const b = run[i + 1];
      if (front && Math.abs((a.u + b.u) / 2) < GATE / 2) continue;
      const off = (p: typeof a, out: number): [number, number] => [p.u + p.nu * out, p.v + p.nv * out];
      const [ao, bo, ai, bi] = [off(a, 1.6), off(b, 1.6), off(a, -1.6), off(b, -1.6)];
      const topA = plot.ground(a.u, a.v) + WALL;
      const topB = plot.ground(b.u, b.v) + WALL;
      const shade = 0.94 + rng() * 0.1;
      shapes.quad(plot.at(ao[0], ao[1], -0.8), plot.at(bo[0], bo[1], -0.8), plot.level(bo[0], bo[1], topB), plot.level(ao[0], ao[1], topA), COLORS.stone, STONE, shade);
      shapes.quad(plot.at(ai[0], ai[1], -0.8), plot.at(bi[0], bi[1], -0.8), plot.level(bi[0], bi[1], topB), plot.level(ai[0], ai[1], topA), COLORS.stoneDark, STONE, shade * 0.9);
      shapes.quad(plot.level(ao[0], ao[1], topA), plot.level(bo[0], bo[1], topB), plot.level(bi[0], bi[1], topB), plot.level(ai[0], ai[1], topA), COLORS.stone, STONE, 1.04);
    }
  }
  const hw = plot.hw - 2;
  const hd = plot.hd - 2;
  for (const [u, v] of [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
    [-GATE / 2 - 4, hd],
    [GATE / 2 + 4, hd],
  ]) {
    tower(shapes, plot, u, v, 8, WALL + 5, COLORS.stone, STONE);
  }
  // Store-houses: long halls in two rows, their length across the plot.
  const halls = Math.max(Math.floor((plot.hd * 2 - 40) / 26), 1);
  for (let i = 0; i < halls; i++) {
    const v = -hd + 22 + i * ((hd * 2 - 44) / Math.max(halls - 1, 1));
    for (const side of [-1, 1]) {
      const length = Math.min(hw - 14, 30);
      if (length < 12) continue;
      building(shapes, plot, side * (hw - 10 - length / 2), v, length, 12, 7, 0, {
        wall: COLORS.stone,
        wallKind: STONE,
        roof: { color: COLORS.tile, kind: TILE, rise: 4 },
        rng,
        door: true,
      });
    }
  }
}

/** Small houses along lanes; `ruined` leaves most without a roof, among heaps of rubble. */
function houses(shapes: Shapes, plot: Plot, ruined: boolean, rng: Rng): void {
  const pitchU = 34;
  const pitchV = 30;
  const cols = Math.max(Math.floor((plot.hw * 2) / pitchU), 1);
  const rows = Math.max(Math.floor((plot.hd * 2) / pitchV), 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cols * rows > 2 && rng() < 0.14) continue;
      const u = -plot.hw + (c + 0.5) * ((plot.hw * 2) / cols) + (rng() - 0.5) * 8;
      const v = -plot.hd + (r + 0.5) * ((plot.hd * 2) / rows) + (rng() - 0.5) * 7;
      const length = 17 + rng() * 9;
      const width = 11 + rng() * 4;
      const angle = (rng() < 0.75 ? 0 : Math.PI / 2) + (rng() - 0.5) * 0.25;
      const broken = ruined && rng() < 0.65;
      const stone = rng() < 0.5;
      building(shapes, plot, u, v, length, width, 6.5 + rng() * 1.5, angle, {
        wall: stone ? COLORS.stone : rng() < 0.5 ? COLORS.plaster : COLORS.mudbrick,
        wallKind: stone ? STONE : PLASTER,
        roof: broken ? undefined : rng() < 0.6 ? { color: COLORS.tile, kind: TILE, rise: 3.6 } : { color: COLORS.thatch, kind: THATCH, rise: 5 },
        rng,
        door: !broken,
      });
      if (broken) {
        // Fallen stone beside the walls.
        for (let k = 0; k < 3; k++) {
          const ru = u + (rng() - 0.5) * length;
          const rv = v + (rng() - 0.5) * width * 1.6;
          const size = 2.5 + rng() * 3;
          const peak = plot.at(ru, rv, 1 + rng() * 1.4);
          const ring = [0, 1, 2, 3, 4].map((n) => plot.at(ru + Math.cos(n * 1.257) * size, rv + Math.sin(n * 1.257) * size, -0.2));
          for (let n = 0; n < 5; n++) shapes.tri(ring[n], ring[(n + 1) % 5], peak, COLORS.rubble, STONE, 0.85 + rng() * 0.25);
        }
      }
    }
  }
}

/** A farm: the house, a barn or two, and a yard inside a low wall. */
function farm(shapes: Shapes, plot: Plot, rng: Rng): void {
  const stone = rng() < 0.5;
  const wall = stone ? COLORS.stone : COLORS.plaster;
  const kind = stone ? STONE : PLASTER;
  const hw = plot.hw - 3;
  const hd = plot.hd - 3;
  // The yard wall, with a way in at the front.
  for (const run of perimeter(plot, 3, 9, 0)) {
    const front = run[0].nv === 1;
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i];
      const b = run[i + 1];
      if (front && Math.abs((a.u + b.u) / 2) < 6) continue;
      const top = 2.6;
      shapes.quad(plot.at(a.u, a.v, -0.4), plot.at(b.u, b.v, -0.4), plot.at(b.u, b.v, top), plot.at(a.u, a.v, top), COLORS.stoneDark, STONE, 0.9 + rng() * 0.15);
    }
  }
  building(shapes, plot, -hw * 0.3, -hd * 0.35, Math.min(hw * 1.1, 26), 12, 7, 0, {
    wall,
    wallKind: kind,
    roof: { color: COLORS.tile, kind: TILE, rise: 3.8 },
    rng,
    door: true,
  });
  building(shapes, plot, hw * 0.55, hd * 0.2, 16, 10, 5.5, Math.PI / 2, {
    wall: COLORS.mudbrick,
    wallKind: PLASTER,
    roof: { color: COLORS.thatch, kind: THATCH, rise: 4.6 },
    rng,
    door: true,
  });
  if (rng() < 0.6) {
    building(shapes, plot, -hw * 0.55, hd * 0.5, 11, 8, 4.5, 0, {
      wall: COLORS.mudbrick,
      wallKind: PLASTER,
      roof: { color: COLORS.thatch, kind: THATCH, rise: 3.6 },
      rng,
    });
  }
}

/** Where units stand or pass at any time of the battle, on a grid of `CELL` metres. */
function occupancy(battle: Battle): (x: number, y: number) => boolean {
  const CELL = 12;
  const { minX, maxX, minY, maxY } = battle.terrain;
  const cols = Math.ceil((maxX - minX) / CELL);
  const rows = Math.ceil((maxY - minY) / CELL);
  const taken = new Uint8Array(cols * rows);
  const mark = (f: Formation) => {
    const a = (f.facing * Math.PI) / 180;
    const hw = f.frontage / 2 + 8;
    const hd = f.depth / 2 + 8;
    for (let u = -hw; u <= hw; u += CELL / 2) {
      for (let v = -hd; v <= hd; v += CELL / 2) {
        const col = Math.floor((f.center.x + Math.cos(a) * u + Math.sin(a) * v - minX) / CELL);
        const row = Math.floor((f.center.y - Math.sin(a) * u + Math.cos(a) * v - minY) / CELL);
        if (col >= 0 && row >= 0 && col < cols && row < rows) taken[row * cols + col] = 1;
      }
    }
  };
  const keys = [battle.initial, ...battle.phases.map((p) => p.units)];
  for (let k = 0; k < keys.length; k++) {
    for (const state of keys[k]) {
      const next = keys[k + 1]?.find((s) => s.unit === state.unit);
      if (!next) {
        mark(state.formation);
        continue;
      }
      // Between two keys the unit moves in a straight line: mark the way.
      const from = state.formation;
      const to = next.formation;
      const distance = Math.hypot(to.center.x - from.center.x, to.center.y - from.center.y);
      const steps = Math.max(Math.ceil(distance / 15), 1);
      let turn = to.facing - from.facing;
      turn -= Math.round(turn / 360) * 360;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        mark({
          center: { x: from.center.x + (to.center.x - from.center.x) * t, y: from.center.y + (to.center.y - from.center.y) * t },
          frontage: from.frontage + (to.frontage - from.frontage) * t,
          depth: from.depth + (to.depth - from.depth) * t,
          facing: from.facing + turn * t,
        });
      }
    }
  }
  return (x, y) => {
    const col = Math.floor((x - minX) / CELL);
    const row = Math.floor((y - minY) / CELL);
    return col >= 0 && row >= 0 && col < cols && row < rows && taken[row * cols + col] === 1;
  };
}

export class Structures {
  readonly group = new Group();
  private readonly material: MeshLambertMaterial;

  constructor(battle: Battle, heightAt: HeightAt) {
    this.material = structureMaterial();
    const structures = battle.terrain.scenery?.structures ?? [];
    if (structures.length === 0) return;
    const occupied = occupancy(battle);
    for (const structure of structures) {
      const plot = new Plot(structure, heightAt);
      const rng = createRng(hashString(`${battle.id}/${structure.id}`));
      const chunks: Shapes[] = [];
      const main = new Shapes();
      chunks.push(main);
      if (structure.kind === "camp") {
        earthworks(main, plot, rng);
        // A camp of the Roman kind is laid out by rule; any other loosely.
        tents(chunks, plot, structure.side === "rome", occupied, rng);
      } else if (structure.kind === "citadel") {
        citadel(main, plot, rng);
      } else if (structure.kind === "farm") {
        farm(main, plot, rng);
      } else {
        houses(main, plot, structure.ruined === true, rng);
      }
      for (const shapes of chunks) {
        if (shapes.empty) continue;
        const mesh = new Mesh(shapes.geometry(), this.material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
      }
    }
  }

  dispose(): void {
    for (const child of this.group.children) (child as Mesh).geometry.dispose();
    this.material.dispose();
  }
}

/** One material for everything built: the colour of each vertex, with the grain of its surface. */
function structureMaterial(): MeshLambertMaterial {
  const material = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        attribute float aKind;
        varying float vKind;
        varying vec3 vBuilt;`,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        vKind = aKind;
        vBuilt = position;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        varying float vKind;
        varying vec3 vBuilt;
        float builtHash(vec2 p) {
          vec3 q = fract(vec3(p.xyx) * 0.1031);
          q += dot(q, q.yzx + 33.33);
          return fract((q.x + q.y) * q.z);
        }
        float builtNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(builtHash(i), builtHash(i + vec2(1.0, 0.0)), u.x),
            mix(builtHash(i + vec2(0.0, 1.0)), builtHash(i + vec2(1.0, 1.0)), u.x),
            u.y);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        {
          float distance = length(vViewPosition);
          float near = 1.0 - smoothstep(60.0, 420.0, distance);
          // Along the wall and up it, whichever way the wall runs.
          vec2 face = vec2(vBuilt.x + vBuilt.z, vBuilt.y);
          float grain = builtNoise(face * 1.7);
          float blotch = builtNoise(vBuilt.xz * 0.35 + vBuilt.y * 0.2);
          float tone = 1.0;
          if (vKind < 0.5) {
            // Earth: clods and trodden patches.
            tone = 0.88 + 0.2 * blotch + 0.1 * (builtNoise(vBuilt.xz * 2.3) - 0.5) * near;
          } else if (vKind < 1.5) {
            // Timber: grain running up the wood.
            tone = 0.86 + 0.24 * builtNoise(vec2(face.x * 3.1, face.y * 0.25)) * near + 0.08 * blotch;
          } else if (vKind < 2.5) {
            // Hide and cloth: panels sewn together, weathered.
            float seam = smoothstep(0.42, 0.5, abs(fract(face.x * 0.45) - 0.5));
            tone = 0.9 + 0.16 * blotch - 0.14 * seam * near;
          } else if (vKind < 3.5) {
            // Stone: courses of blocks, their joints staggered.
            float course = floor(face.y / 1.5);
            float bed = smoothstep(0.42, 0.5, abs(fract(face.y / 1.5) - 0.5));
            float joint = smoothstep(0.44, 0.5, abs(fract(face.x / 2.6 + 0.5 * mod(course, 2.0)) - 0.5));
            float block = builtHash(vec2(floor(face.x / 2.6 + 0.5 * mod(course, 2.0)), course));
            tone = 0.9 + 0.14 * block * near + 0.1 * blotch - 0.22 * max(bed, joint) * near;
          } else if (vKind < 4.5) {
            // Plaster and mud brick: stained, cracked at the foot.
            tone = 0.9 + 0.14 * blotch + 0.08 * (grain - 0.5) * near;
          } else if (vKind < 5.5) {
            // Tiles: rows down the slope.
            float row = smoothstep(0.3, 0.5, abs(fract(vBuilt.y * 1.1 + grain * 0.15) - 0.5));
            float ridge = smoothstep(0.38, 0.5, abs(fract(face.x * 0.9) - 0.5));
            tone = 0.88 + 0.16 * blotch - 0.16 * row * near - 0.1 * ridge * near;
          } else {
            // Thatch: streaks down the slope.
            tone = 0.86 + 0.2 * builtNoise(vec2(face.x * 2.6, face.y * 0.4)) * near + 0.1 * blotch;
          }
          diffuseColor.rgb *= tone;
        }`,
      );
  };
  material.customProgramCacheKey = () => "battle-structures";
  return material;
}
