/**
 * Each man his own look (T-061): the looks of a unit model file (ModelLooks,
 * src/lib/battle.ts) read and turned into the uniform tables of the figure
 * shaders (material.ts). Each man's choices are drawn once, here, from his
 * seed (lookChoices), and handed to the shaders packed in the last two
 * numbers of his instance attribute iStrike: drawing them per vertex cost a
 * loop for every slot.
 */

import { Vector2, Vector3, Vector4 } from "three";
import { LOOK_LIMITS, type LookDesigns, type ModelLooks } from "@/lib/battle";

const OPTIONS = LOOK_LIMITS.options;
const DESIGN_OPTIONS = LOOK_LIMITS.designs + 1;

/**
 * Where each choice lies in iStrike.zw (lookChoices): in z, the option of slot s
 * at bit `option` x s (3 bits each); in w, the shape chosen in variant group
 * g at bit `shape` x g (4 bits each), the design's tile + 1 at bit `tile` (4
 * bits, 0 for a plain shield) and its colour at bit `color` (3 bits). Both
 * stay under 2^24, so a float holds them exactly.
 */
export const LOOK_BITS = { option: 3, shape: 4, tile: 16, color: 20 } as const;

/** The tables, in the layout material.ts declares. */
export interface LookTables {
  /** Slots and variant groups in the file. */
  slotCount: number;
  groupCount: number;
  /** Slot s, option o at s * OPTIONS + o: rgb the factor (dye: the colour over the slot's ref), w the chance up to it. */
  options: Vector4[];
  /** Per slot: x 1 for dye, 0 for tint. */
  modes: Vector2[];
  /** Group g, option o at g * OPTIONS + o: x the shape (0 none), y the chance up to it. */
  variants: Vector2[];
  /** Per shape (1..LOOK_LIMITS.shapes, index 0 unused): its group. */
  shapeGroup: number[];
  /** Designs: x the slot (0: none), y the number of colours. */
  designInfo: Vector2;
  designTiles: Vector4[];
  /** x the tile (-1 plain), y the chance up to it. */
  designOptions: Vector2[];
  /** rgb the factor (colour over the slot's ref), w the chance up to it. */
  designColors: Vector4[];
  /** The shield's frame: centre, long axis, short axis; and the extents (u0, u1, v0, v1). */
  designFrame: Vector3[];
  designExtent: Vector4;
}

const isNumbers = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) && value.length === length && value.every((x) => typeof x === "number" && Number.isFinite(x));

/** The looks in a file's scene extras, or null when there are none or they do not keep the contract. */
export function parseLooks(text: unknown, model: string): ModelLooks | null {
  if (typeof text !== "string") return null;
  try {
    const value = JSON.parse(text) as Partial<ModelLooks>;
    const slots = value.slots;
    if (!Array.isArray(slots) || slots.length === 0 || slots.length > LOOK_LIMITS.slots) throw new Error("slots");
    for (const slot of slots) {
      if ((slot.mode !== "tint" && slot.mode !== "dye") || !(slot.ref > 0)) throw new Error(`slot ${slot.name}`);
      if (!Array.isArray(slot.options) || slot.options.length === 0 || slot.options.length > OPTIONS) {
        throw new Error(`slot ${slot.name} options`);
      }
      if (!slot.options.every((o) => isNumbers(o, 4))) throw new Error(`slot ${slot.name} options`);
    }
    for (const group of value.variants ?? []) {
      if (!Array.isArray(group.options) || group.options.length > OPTIONS || !group.options.every((o) => isNumbers(o, 2))) {
        throw new Error(`variants ${group.name}`);
      }
    }
    if ((value.variants?.length ?? 0) > LOOK_LIMITS.groups) throw new Error("variant groups");
    const designs: LookDesigns | undefined = value.designs;
    if (designs) {
      const ok =
        designs.slot >= 1 &&
        designs.slot <= slots.length &&
        designs.tiles.length <= LOOK_LIMITS.designs &&
        designs.tiles.every((t) => isNumbers(t, 4)) &&
        designs.options.length <= DESIGN_OPTIONS &&
        designs.options.every((o) => isNumbers(o, 2) && o[0] < designs.tiles.length) &&
        designs.colors.length >= 1 &&
        designs.colors.length <= OPTIONS &&
        designs.colors.every((c) => isNumbers(c, 4)) &&
        isNumbers(designs.frame, 9) &&
        isNumbers(designs.extent, 4);
      if (!ok) throw new Error("designs");
    }
    return value as ModelLooks;
  } catch (error) {
    console.warn(`Unit model ${model}.glb: its looks do not keep the contract (${(error as Error).message}); every man looks the same.`);
    return null;
  }
}

/** Running sums of the weights, over their total: the chance up to each option (the last is 1). */
function chances(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + Math.max(w, 0), 0) || 1;
  let run = 0;
  return weights.map((w, i) => {
    run += Math.max(w, 0);
    return i === weights.length - 1 ? 1 : run / total;
  });
}

export function lookTables(looks: ModelLooks): LookTables {
  const options = Array.from({ length: LOOK_LIMITS.slots * OPTIONS }, () => new Vector4(1, 1, 1, 2));
  const modes = Array.from({ length: LOOK_LIMITS.slots }, () => new Vector2());
  looks.slots.forEach((slot, s) => {
    const dye = slot.mode === "dye";
    modes[s].set(dye ? 1 : 0, 0);
    const up = chances(slot.options.map((o) => o[3]));
    slot.options.forEach(([r, g, b], o) => {
      const k = dye ? 1 / slot.ref : 1;
      options[s * OPTIONS + o].set(r * k, g * k, b * k, up[o]);
    });
  });

  const variants = Array.from({ length: LOOK_LIMITS.groups * OPTIONS }, () => new Vector2(0, 2));
  const shapeGroup = new Array<number>(LOOK_LIMITS.shapes + 1).fill(0);
  (looks.variants ?? []).forEach((group, g) => {
    const up = chances(group.options.map((o) => o[1]));
    group.options.forEach(([shape], o) => {
      variants[g * OPTIONS + o].set(shape, up[o]);
      if (shape >= 1 && shape <= LOOK_LIMITS.shapes) shapeGroup[shape] = g;
    });
  });

  const designs = looks.designs;
  const designTiles = Array.from({ length: LOOK_LIMITS.designs }, () => new Vector4());
  const designOptions = Array.from({ length: DESIGN_OPTIONS }, () => new Vector2(-1, 2));
  const designColors = Array.from({ length: OPTIONS }, () => new Vector4(1, 1, 1, 2));
  const designFrame = [new Vector3(), new Vector3(0, 1, 0), new Vector3(1, 0, 0)];
  const designExtent = new Vector4(-1, 1, -1, 1);
  if (designs) {
    designs.tiles.forEach((t, i) => designTiles[i].fromArray(t));
    const up = chances(designs.options.map((o) => o[1]));
    designs.options.forEach(([tile], o) => designOptions[o].set(tile, up[o]));
    const ref = looks.slots[designs.slot - 1].ref;
    const upColor = chances(designs.colors.map((c) => c[3]));
    designs.colors.forEach(([r, g, b], c) => designColors[c].set(r / ref, g / ref, b / ref, upColor[c]));
    designFrame[0].fromArray(designs.frame, 0);
    designFrame[1].fromArray(designs.frame, 3);
    designFrame[2].fromArray(designs.frame, 6);
    designExtent.fromArray(designs.extent);
  }
  return {
    slotCount: looks.slots.length,
    groupCount: looks.variants?.length ?? 0,
    options,
    modes,
    variants,
    shapeGroup,
    designInfo: new Vector2(designs?.slot ?? 0, designs?.colors.length ?? 0),
    designTiles,
    designOptions,
    designColors,
    designFrame,
    designExtent,
  };
}

/** A fixed random number 0..1 of a man (his seed) for one choice (`salt`). */
function chance(seed: number, salt: number): number {
  const x = seed * (37 + 11 * salt) + 0.6180339 * salt;
  return x - Math.floor(x);
}

/** The first of `count` options whose chance up to it (`up`) lies above r. */
function pick(r: number, count: number, up: (o: number) => number): number {
  let o = 0;
  while (o < count - 1 && !(r < up(o))) o++;
  return o;
}

/**
 * One man's choices, drawn from his seed with the chances of the tables and
 * packed as LOOK_BITS says: the option of each slot, the shape of each
 * variant group, his design and its colour (never the colour of his paint:
 * then the next one).
 */
export function lookChoices(tables: LookTables, seed: number): [number, number] {
  let x = 0;
  for (let s = 0; s < tables.slotCount; s++) {
    const o = pick(chance(seed, s + 1), OPTIONS, (k) => tables.options[s * OPTIONS + k].w);
    x += o * 2 ** (LOOK_BITS.option * s);
  }
  let y = 0;
  for (let g = 0; g < tables.groupCount; g++) {
    const o = pick(chance(seed, 16 + g), OPTIONS, (k) => tables.variants[g * OPTIONS + k].y);
    y += tables.variants[g * OPTIONS + o].x * 2 ** (LOOK_BITS.shape * g);
  }
  const slot = tables.designInfo.x;
  if (slot >= 1) {
    const option = tables.designOptions[pick(chance(seed, 24), DESIGN_OPTIONS, (k) => tables.designOptions[k].y)];
    const count = Math.max(tables.designInfo.y, 1);
    let c = pick(chance(seed, 25), count, (k) => tables.designColors[k].w);
    const s = slot - 1;
    const paint = tables.options[s * OPTIONS + Math.floor(x / 2 ** (LOOK_BITS.option * s)) % 8];
    const k = tables.designColors[c];
    const far = Math.hypot(k.x - paint.x, k.y - paint.y, k.z - paint.z);
    if (far < 0.3 * Math.hypot(paint.x, paint.y, paint.z)) c = (c + 1) % count;
    y += (option.x + 1) * 2 ** LOOK_BITS.tile + c * 2 ** LOOK_BITS.color;
  }
  return [x, y];
}
