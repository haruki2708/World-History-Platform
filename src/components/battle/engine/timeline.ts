/**
 * Where every figure of a unit stands at any battle time. Pure data, no
 * three.js: the scene asks `UnitTrack.sample(time)` and draws the answer.
 *
 * A unit has one keyframe per phase boundary (0 = `initial`, k = the end of
 * phase k). At each keyframe the surviving figures fill the frontage × depth
 * of the formation in files (front to back, then the next file), so when men
 * fall the files behind close up and the block shrinks sideways.
 */

import {
  type Battle,
  type BattleUnit,
  type Formation,
  MEN_PER_FIGURE,
  type UnitAction,
  type UnitState,
} from "@/lib/battle";
import { createRng, hashString } from "./rng";

const DEG = Math.PI / 180;

/**
 * A change of facing this large between two keyframes is an about-face: the
 * men turn round where they stand, and the rear rank becomes the front,
 * instead of the whole block swinging round its centre (a block 800 m wide
 * would sweep across the field). It applies whether or not the block also
 * moves: a body of troops that turns to flee turns about, then goes.
 */
const ABOUT_FACE = 135 * DEG;
/** Share of the phase over which each man turns about. */
const TURN_SPAN = 0.08;
/** The men do not all turn at once: up to this share of the phase apart. */
const TURN_STAGGER = 0.08;

export interface UnitKey {
  center: { x: number; y: number };
  frontage: number;
  depth: number;
  /** Radians clockwise from north. */
  facing: number;
  bulge: number;
  men: number;
  action: UnitAction;
}

/** Figure status in a sample. */
export const ALIVE = 0;
export const DYING = 1;
export const GONE = 2;

function toKey(state: UnitState): UnitKey {
  const f: Formation = state.formation;
  return {
    center: { x: f.center.x, y: f.center.y },
    frontage: Math.max(f.frontage, 1),
    depth: Math.max(f.depth, 1),
    facing: f.facing * DEG,
    bulge: f.bulge ?? 0,
    men: Math.max(state.men, 0),
    action: state.action,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** From angle a to angle b the shorter way round, in (-π, π]. */
function angleDelta(a: number, b: number): number {
  let delta = (b - a) % (2 * Math.PI);
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta <= -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/** Interpolates an angle along the shorter way round. */
function lerpAngle(a: number, b: number, t: number): number {
  return a + angleDelta(a, b) * t;
}

/** 0 → 1 with a gentle start and end. */
function smoothstep(t: number): number {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
}

/**
 * The same formation seen from behind: facing turned half round, the bulge
 * the other way. Slot (u, v) of the original is slot (-u, 1 - v) of this one,
 * at the same point on the field.
 */
function reversed(key: UnitKey): UnitKey {
  return { ...key, center: { ...key.center }, facing: key.facing + Math.PI, bulge: -key.bulge };
}

/** Battle time (in phases) to seconds of playback at normal speed. */
export class BattleClock {
  private readonly cumulative: number[];

  constructor(battle: Battle) {
    this.cumulative = [0];
    for (const phase of battle.phases) {
      const last = this.cumulative[this.cumulative.length - 1];
      this.cumulative.push(last + Math.max(phase.playSeconds, 0.001));
    }
  }

  get phases(): number {
    return this.cumulative.length - 1;
  }

  seconds(time: number): number {
    if (this.phases === 0) return 0;
    const t = Math.min(Math.max(time, 0), this.phases);
    const index = Math.min(Math.floor(t), this.phases - 1);
    const span = this.cumulative[index + 1] - this.cumulative[index];
    return this.cumulative[index] + span * (t - index);
  }
}

export class UnitTrack {
  readonly unit: BattleUnit;
  /** Figures at the start of the battle. */
  readonly count: number;
  readonly keys: UnitKey[];
  /** Battle time at which each figure falls; Infinity if it never does. */
  readonly deathTime: Float32Array;

  // The latest sample, one entry per figure.
  /** Field metres east. */
  readonly x: Float32Array;
  /** Field metres north. */
  readonly y: Float32Array;
  /** Heading, radians clockwise from north. */
  readonly heading: Float32Array;
  /** ALIVE, DYING (fell a moment ago, still drawn) or GONE. */
  readonly status: Uint8Array;
  /** Playback seconds since the figure fell (DYING only). */
  readonly since: Float32Array;
  /** 0 at the front rank, 1 at the rear (ALIVE only). */
  readonly rank: Float32Array;
  /** A fixed random number in [0, 1) per figure. */
  readonly seed: Float32Array;

  /** Per keyframe: u (across, -0.5..0.5) and v (front 0 to rear 1) per figure. */
  private readonly slots: Float32Array[];
  /**
   * Per phase k (keyframe k to k + 1) that is an about-face: the end keyframe
   * seen from behind (`reversed`), its slots to match, and which way the men
   * turn (+1 clockwise, -1 the other way). Null for an ordinary phase.
   */
  private readonly aboutFace: ({ to: UnitKey; slots: Float32Array; turn: number } | null)[];
  private readonly deathSeconds: Float32Array;
  private readonly deathX: Float32Array;
  private readonly deathY: Float32Array;
  private readonly deathHeading: Float32Array;
  private readonly clock: BattleClock;
  private readonly scratch: UnitKey;

  constructor(battle: Battle, unit: BattleUnit, clock: BattleClock) {
    this.unit = unit;
    this.clock = clock;

    // One keyframe per phase boundary; a unit missing from a phase holds its
    // last state, and men never go up.
    const first = battle.initial.find((s) => s.unit === unit.id);
    const start: UnitKey = first
      ? toKey(first)
      : {
          center: { x: 0, y: 0 },
          frontage: 100,
          depth: 20,
          facing: 0,
          bulge: 0,
          men: unit.men,
          action: "stand",
        };
    this.keys = [start];
    for (const phase of battle.phases) {
      const previous = this.keys[this.keys.length - 1];
      const state = phase.units.find((s) => s.unit === unit.id);
      const key = state ? toKey(state) : { ...previous, center: { ...previous.center } };
      key.men = Math.min(key.men, previous.men);
      this.keys.push(key);
    }
    this.scratch = { ...start, center: { ...start.center } };

    const n = Math.max(Math.ceil(start.men / MEN_PER_FIGURE), 0);
    this.count = n;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.heading = new Float32Array(n);
    this.status = new Uint8Array(n);
    this.since = new Float32Array(n);
    this.rank = new Float32Array(n);
    this.seed = new Float32Array(n);
    this.deathTime = new Float32Array(n).fill(Infinity);
    this.deathSeconds = new Float32Array(n).fill(Infinity);
    this.deathX = new Float32Array(n);
    this.deathY = new Float32Array(n);
    this.deathHeading = new Float32Array(n);

    const random = createRng(hashString(`${battle.id}/${unit.id}`));
    const jitterU = new Float32Array(n);
    const jitterV = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.seed[i] = random();
      jitterU[i] = random() - 0.5;
      jitterV[i] = random() - 0.5;
    }

    // Who falls first: random, leaning towards the front ranks.
    const startRows = gridRows(n, start);
    const order = Array.from({ length: n }, (_, i) => ({
      i,
      key: random() + 0.6 * ((i % startRows) / Math.max(startRows - 1, 1)),
    })).sort((a, b) => a.key - b.key);
    // lifeRank: the figure stands while lifeRank < men / MEN_PER_FIGURE.
    const lifeRank = new Float32Array(n);
    order.forEach((entry, position) => {
      lifeRank[entry.i] = n - 1 - position;
    });
    for (let i = 0; i < n; i++) {
      const threshold = lifeRank[i] * MEN_PER_FIGURE;
      for (let k = 1; k < this.keys.length; k++) {
        const before = this.keys[k - 1].men;
        const after = this.keys[k].men;
        if (after <= threshold && before > after) {
          const fraction = Math.min(Math.max((before - threshold) / (before - after), 0), 1);
          this.deathTime[i] = k - 1 + fraction;
          break;
        }
      }
    }

    // Slots at every keyframe: survivors in id order fill the files.
    this.slots = this.keys.map((key, k) => {
      const slots = new Float32Array(n * 2).fill(NaN);
      let alive = 0;
      for (let i = 0; i < n; i++) if (this.deathTime[i] > k) alive++;
      if (alive === 0) return slots;
      const rows = gridRows(alive, key);
      const files = Math.ceil(alive / rows);
      let slot = 0;
      for (let i = 0; i < n; i++) {
        if (!(this.deathTime[i] > k)) continue;
        const file = Math.floor(slot / rows);
        const row = slot % rows;
        slot++;
        slots[i * 2] = (file + 0.5 + jitterU[i] * 0.45) / files - 0.5;
        slots[i * 2 + 1] = (row + 0.5 + jitterV[i] * 0.45) / rows;
      }
      return slots;
    });

    // About-faces: the end of the phase in the frame of its start.
    this.aboutFace = this.keys.slice(1).map((to, k) => {
      const delta = angleDelta(this.keys[k].facing, to.facing);
      if (Math.abs(delta) < ABOUT_FACE) return null;
      const from = this.slots[k + 1];
      const slots = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        slots[i * 2] = -from[i * 2];
        slots[i * 2 + 1] = 1 - from[i * 2 + 1];
      }
      return { to: reversed(to), slots, turn: delta >= 0 ? 1 : -1 };
    });

    // Where and when each fallen figure lies.
    for (let i = 0; i < n; i++) {
      const t = this.deathTime[i];
      if (!Number.isFinite(t)) continue;
      const k = Math.min(Math.floor(t), this.keys.length - 2);
      const key = this.formationAt(t);
      this.place(key, this.slots[k][i * 2], this.slots[k][i * 2 + 1], i);
      this.deathX[i] = this.x[i];
      this.deathY[i] = this.y[i];
      this.deathHeading[i] = this.heading[i];
      this.deathSeconds[i] = clock.seconds(t);
    }
  }

  /** The action of the unit under way at `time`. */
  actionAt(time: number): UnitAction {
    if (time <= 0 || this.keys.length === 1) return this.keys[0].action;
    const phase = Math.min(Math.ceil(time), this.keys.length - 1);
    return this.keys[phase].action;
  }

  /**
   * The formation at `time`, interpolated; the result is reused between calls.
   * During an about-face it is the formation of the start of the phase, moving
   * towards the end one seen from behind: the same ground, without the swing.
   */
  formationAt(time: number): UnitKey {
    const last = this.keys.length - 1;
    const t = Math.min(Math.max(time, 0), last);
    const k = Math.min(Math.floor(t), Math.max(last - 1, 0));
    const s = t - k;
    // At the very end of the battle, the last keyframe as it is.
    const turning = s < 1 ? this.aboutFace[k] : null;
    return this.interpolate(k, s, turning?.to ?? null);
  }

  /** Keyframe k towards keyframe k + 1 (or `to` in its place) by s. */
  private interpolate(k: number, s: number, to: UnitKey | null): UnitKey {
    const last = this.keys.length - 1;
    const a = this.keys[k];
    const b = to ?? this.keys[Math.min(k + 1, last)];
    const out = this.scratch;
    out.center.x = lerp(a.center.x, b.center.x, s);
    out.center.y = lerp(a.center.y, b.center.y, s);
    out.frontage = lerp(a.frontage, b.frontage, s);
    out.depth = lerp(a.depth, b.depth, s);
    out.facing = lerpAngle(a.facing, b.facing, s);
    out.bulge = lerp(a.bulge, b.bulge, s);
    out.men = lerp(a.men, b.men, s);
    out.action = b.action;
    return out;
  }

  /**
   * Fills x, y, heading, status, since and rank for `time`. A fallen figure
   * stays DYING for `lingerSeconds` of playback, then is GONE: pass Infinity
   * to leave the fallen on the field, 0 when the model has no death clip. Returns the number of figures still standing.
   */
  sample(time: number, lingerSeconds: number): number {
    const last = this.keys.length - 1;
    const t = Math.min(Math.max(time, 0), last);
    const k = Math.min(Math.floor(t), Math.max(last - 1, 0));
    const s = t - k;
    const turning = this.aboutFace[k] ?? null;
    const from = this.slots[k];
    const to = turning ? turning.slots : this.slots[Math.min(k + 1, last)];
    // In an about-face the whole phase, its end included, is drawn in the
    // frame of its start: the slots above are in that frame.
    const f = this.interpolate(k, s, turning?.to ?? null);
    const now = this.clock.seconds(t);
    // The same placement as formationPoint, with the trigonometry hoisted
    // out of the loop: this runs for every figure on every frame of playback.
    const sin = Math.sin(f.facing);
    const cos = Math.cos(f.facing);
    const curve = (8 * f.bulge) / f.frontage;
    let standing = 0;

    for (let i = 0; i < this.count; i++) {
      const death = this.deathTime[i];
      if (death <= t) {
        const since = now - this.deathSeconds[i];
        if (since < lingerSeconds) {
          this.status[i] = DYING;
          this.since[i] = since;
          this.x[i] = this.deathX[i];
          this.y[i] = this.deathY[i];
          this.heading[i] = this.deathHeading[i];
        } else {
          this.status[i] = GONE;
        }
        continue;
      }
      let u = from[i * 2];
      let v = from[i * 2 + 1];
      if (death > k + 1) {
        u = lerp(u, to[i * 2], s);
        v = lerp(v, to[i * 2 + 1], s);
      }
      const across = u * f.frontage;
      const forward = f.depth * (0.5 - v) + f.bulge * (1 - 4 * u * u);
      this.x[i] = f.center.x + cos * across + sin * forward;
      this.y[i] = f.center.y - sin * across + cos * forward;
      // Each man turns about on his own, early in the phase, a moment
      // before or after his neighbours.
      const turned = turning
        ? smoothstep((s - this.seed[i] * TURN_STAGGER) / TURN_SPAN)
        : 0;
      this.heading[i] =
        f.facing +
        (turning ? turning.turn * Math.PI * turned : 0) +
        (curve === 0 ? 0 : Math.atan(curve * u)) +
        (this.seed[i] - 0.5) * 0.25;
      this.status[i] = ALIVE;
      // Once turned, the rear of the old formation is the front.
      this.rank[i] = turned > 0.5 ? 1 - v : v;
      standing++;
    }
    return standing;
  }

  /** Writes the position and heading of figure i for slot (u, v) of a formation. */
  private place(f: UnitKey, u: number, v: number, i: number): void {
    formationPoint(f, u, v, point);
    this.x[i] = point.x;
    this.y[i] = point.y;
    // Follow the curve of a bulged line, plus a little individual turn.
    const curve = Math.atan((8 * u * f.bulge) / f.frontage);
    this.heading[i] = f.facing + curve + (this.seed[i] - 0.5) * 0.25;
  }
}

const point = { x: 0, y: 0 };

/**
 * The field point of slot (u, v) in a formation: u runs across the front
 * from -0.5 (left) to 0.5 (right), v from 0 (front rank) to 1 (rear). A
 * bulge pushes the middle of the whole line forward.
 */
export function formationPoint(
  f: UnitKey,
  u: number,
  v: number,
  out: { x: number; y: number },
): void {
  const across = u * f.frontage;
  const forward = f.depth * (0.5 - v) + f.bulge * (1 - 4 * u * u);
  const sin = Math.sin(f.facing);
  const cos = Math.cos(f.facing);
  out.x = f.center.x + cos * across + sin * forward;
  out.y = f.center.y - sin * across + cos * forward;
}

/** Ranks (front to back) for `count` figures: cells as square as possible. */
function gridRows(count: number, key: { frontage: number; depth: number }): number {
  if (count <= 1) return 1;
  const rows = Math.round(Math.sqrt((count * key.depth) / key.frontage));
  return Math.min(Math.max(rows, 1), count);
}
