/**
 * Where every figure of a unit stands at any battle time. Pure data, no
 * three.js: the scene asks `UnitTrack.sample(time)` and draws the answer.
 *
 * A unit has one keyframe per phase boundary (0 = `initial`, k = the end of
 * phase k). At each keyframe the surviving figures fill the frontage × depth
 * of the formation in files (front to back, then the next file), so when men
 * fall the files behind close up and the block shrinks sideways.
 *
 * Hand to hand (a unit that is not `ranged`, in a phase whose action is
 * `fight`), the men who fall are the men at the head of a file, one after
 * the other, and the men behind step up into their place. See "Giáp lá cà" in
 * docs/ARCHITECTURE.md and melee.ts, which pairs the heads of the files off
 * with the enemy's.
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

/**
 * Seconds of playback between two blows a man takes in a hand-to-hand fight.
 * The blows on a man who falls are timed so that the last one lands as he
 * does (`UnitTrack.beat`).
 */
export const STRIKE_PERIOD = 2.4;
/** A man waits this long, seconds of playback, after the man in front of him fell... */
const STEP_UP_DELAY = 0.4;
/** ...then takes this long to step up into his place. */
const STEP_UP_SECONDS = 1.5;
/** A man with fewer than this many men standing in front of him leads his file. */
const HEAD_DEPTH = 0.6;

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

/** How far a man has stepped up, 0 to 1, `seconds` of playback after the man in front of him fell. */
function steppedUp(seconds: number): number {
  return smoothstep((seconds - STEP_UP_DELAY) / STEP_UP_SECONDS);
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

/**
 * A phase a unit spends fighting hand to hand: its files as they stand at
 * the start of the phase, each a queue. In the frame of the start keyframe.
 */
interface FightPhase {
  /** The figures standing at the start, file after file, each file from its head. */
  order: Int32Array;
  /** Per file: where its figures end in `order` (the next file starts there). */
  fileEnd: Int32Array;
  /** One rank, as a share of the depth of the formation. */
  step: number;
  /** Which way the head of a file lies in v: -1 towards v = 0, +1 after an about-face. */
  toFront: number;
  /**
   * Per figure that outlives the phase: how far, in v, the regrouping at the
   * end of the phase moves it from where the queue of its file leaves it.
   */
  drift: Float32Array;
}

export class UnitTrack {
  readonly unit: BattleUnit;
  /** The unit fights hand to hand (its type is not `ranged`). */
  readonly melee: boolean;
  /** Figures at the start of the battle. */
  readonly count: number;
  readonly keys: UnitKey[];
  /** Battle time at which each figure falls; Infinity if it never does. */
  readonly deathTime: Float32Array;
  /**
   * When the blows on each figure land in a hand-to-hand fight: at this many
   * seconds of playback and every STRIKE_PERIOD before and after. For a
   * figure that falls it is the moment it falls.
   */
  readonly beat: Float32Array;

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
  /** 1 while the figure is turning about (ALIVE only). */
  readonly turningAbout: Uint8Array;
  /** 1 for a figure at the head of its file in a hand-to-hand fight (ALIVE only). */
  readonly head: Uint8Array;
  /** The unit is in a hand-to-hand fight at the time of the latest sample. */
  fighting = false;
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
  /** Per phase: the queues of a hand-to-hand fight, or null. */
  private readonly fights: (FightPhase | null)[];
  /** The phase in which each figure falls, or -1. */
  private readonly deathPhase: Int16Array;
  private readonly deathSeconds: Float32Array;
  private readonly deathX: Float32Array;
  private readonly deathY: Float32Array;
  private readonly deathHeading: Float32Array;
  /** Scratch of `queue`: how far each figure has stepped up (in v) and how many men stand before it. */
  private readonly shift: Float32Array;
  private readonly before: Float32Array;
  private readonly clock: BattleClock;
  private readonly scratch: UnitKey;

  constructor(battle: Battle, unit: BattleUnit, clock: BattleClock, melee = false) {
    this.unit = unit;
    this.melee = melee;
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
    const phases = this.keys.length - 1;

    const n = Math.max(Math.ceil(start.men / MEN_PER_FIGURE), 0);
    this.count = n;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.heading = new Float32Array(n);
    this.status = new Uint8Array(n);
    this.since = new Float32Array(n);
    this.rank = new Float32Array(n);
    this.turningAbout = new Uint8Array(n);
    this.head = new Uint8Array(n);
    this.seed = new Float32Array(n);
    this.beat = new Float32Array(n);
    this.deathTime = new Float32Array(n).fill(Infinity);
    this.deathPhase = new Int16Array(n).fill(-1);
    this.deathSeconds = new Float32Array(n).fill(Infinity);
    this.deathX = new Float32Array(n);
    this.deathY = new Float32Array(n);
    this.deathHeading = new Float32Array(n);
    this.shift = new Float32Array(n);
    this.before = new Float32Array(n);

    const random = createRng(hashString(`${battle.id}/${unit.id}`));
    const jitterU = new Float32Array(n);
    const jitterV = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.seed[i] = random();
      jitterU[i] = random() - 0.5;
      jitterV[i] = random() - 0.5;
    }

    // Who falls first outside a hand-to-hand fight (missiles, a rout):
    // random, leaning towards the front ranks.
    const startRows = gridRows(n, start);
    const fallOrder = Array.from({ length: n }, (_, i) => ({
      i,
      key: random() + 0.6 * ((i % startRows) / Math.max(startRows - 1, 1)),
    }))
      .sort((a, b) => a.key - b.key)
      .map((entry) => entry.i);

    this.slots = [];
    this.aboutFace = [];
    this.fights = [];
    // The file and the rank of each figure at the keyframe being worked on.
    const fileOf = new Int32Array(n);
    const rowOf = new Int32Array(n);

    // Keyframe 0: the figures fill the files in id order.
    let standing = Array.from({ length: n }, (_, i) => i);
    this.slots.push(this.fill(this.keys[0], standing, jitterU, jitterV, fileOf, rowOf));

    for (let k = 0; k < phases; k++) {
      const from = this.keys[k];
      const to = this.keys[k + 1];
      const slots = this.slots[k];
      const turn = angleDelta(from.facing, to.facing);
      const about = Math.abs(turn) >= ABOUT_FACE;
      const fighting = melee && to.action === "fight";
      const rows = gridRows(standing.length, from);
      const files = Math.ceil(standing.length / rows);
      // After an about-face the old rear rank leads.
      const toFront = about ? 1 : -1;

      // The files as they stand at the start of the phase, each from its head.
      const order = new Int32Array(standing.length);
      const fileEnd = new Int32Array(files);
      {
        const length = new Int32Array(files);
        for (const i of standing) length[fileOf[i]]++;
        let end = 0;
        for (let f = 0; f < files; f++) {
          end += length[f];
          fileEnd[f] = end;
        }
        for (const i of standing) {
          const begin = fileEnd[fileOf[i]] - length[fileOf[i]];
          const place = about ? length[fileOf[i]] - 1 - rowOf[i] : rowOf[i];
          order[begin + place] = i;
        }
      }

      // Who falls in this phase, in the order they fall.
      const left = Math.min(standing.length, Math.ceil(to.men / MEN_PER_FIGURE));
      const falls = standing.length - left;
      const fallen: number[] = [];
      if (falls > 0 && fighting) {
        // Hand to hand: the head of a file falls, then the man who stepped
        // up behind him, and so on. The file is drawn at random, a longer
        // file more often; of three draws the file that lost a man longest
        // ago is taken, so the next man has time to step up and fight.
        const next = new Int32Array(files);
        const lastFall = new Int32Array(files).fill(-1);
        for (let f = 0; f < files; f++) next[f] = f === 0 ? 0 : fileEnd[f - 1];
        let remaining = standing.length;
        const draw = () => {
          let r = Math.floor(random() * remaining);
          for (let f = 0; f < files; f++) {
            const size = fileEnd[f] - next[f];
            if (r < size) return f;
            r -= size;
          }
          return files - 1;
        };
        for (let j = 0; j < falls; j++) {
          let file = draw();
          for (let again = 0; again < 2; again++) {
            const other = draw();
            if (lastFall[other] < lastFall[file]) file = other;
          }
          fallen.push(order[next[file]++]);
          lastFall[file] = j;
          remaining--;
        }
      } else if (falls > 0) {
        for (const i of fallOrder) {
          if (fallen.length === falls) break;
          if (this.deathPhase[i] === -1) fallen.push(i);
        }
      }
      // Hand to hand nobody falls in the last moments of the phase: the men
      // behind must have stepped up by the keyframe, where the files regroup.
      const seconds = clock.seconds(k + 1) - clock.seconds(k);
      const span = fighting
        ? 1 - Math.min((STEP_UP_DELAY + STEP_UP_SECONDS) / Math.max(seconds, 0.001), 0.25)
        : 1;
      fallen.forEach((i, j) => {
        // The share of the losses of the phase this man is: men are lost evenly.
        const threshold = (standing.length - 1 - j) * MEN_PER_FIGURE;
        const lost = from.men - to.men;
        const fraction = lost > 0 ? Math.min(Math.max((from.men - threshold) / lost, 0), 1) : 1;
        this.deathPhase[i] = k;
        this.deathTime[i] = k + fraction * span;
        this.deathSeconds[i] = clock.seconds(k + fraction * span);
      });

      // Where the queue of its file leaves each survivor at the end of the
      // phase, in the frame of the start keyframe: stepped up by as many
      // ranks as men fell in front of him.
      const step = 1 / rows;
      const endV = new Float32Array(n);
      {
        let p = 0;
        for (let f = 0; f < files; f++) {
          let gone = 0;
          for (; p < fileEnd[f]; p++) {
            const i = order[p];
            if (this.deathPhase[i] === k) gone++;
            else endV[i] = slots[i * 2 + 1] + (fighting ? toFront * gone * step : 0);
          }
        }
      }

      // The next keyframe: the survivors regroup into the files of the new
      // grid by where they stand across the front, each file in the order
      // its men stand front to back, so nobody passes through anybody. After
      // an about-face the frame of the keyframe is the old one seen from
      // behind: (u, v) becomes (-u, 1 - v).
      standing = standing.filter((i) => this.deathPhase[i] !== k);
      const across = new Float32Array(n);
      const along = new Float32Array(n);
      for (const i of standing) {
        across[i] = about ? -slots[i * 2] : slots[i * 2];
        along[i] = about ? 1 - endV[i] : endV[i];
      }
      const nextRows = gridRows(standing.length, to);
      standing.sort((a, b) => across[a] - across[b] || a - b);
      for (let begin = 0; begin < standing.length; begin += nextRows) {
        const file = standing.slice(begin, begin + nextRows).sort((a, b) => along[a] - along[b] || a - b);
        for (let r = 0; r < file.length; r++) standing[begin + r] = file[r];
      }
      const nextSlots = this.fill(to, standing, jitterU, jitterV, fileOf, rowOf);
      this.slots.push(nextSlots);

      // An about-face: the end of the phase in the frame of its start.
      let ends = nextSlots;
      if (about) {
        ends = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) {
          ends[i * 2] = -nextSlots[i * 2];
          ends[i * 2 + 1] = 1 - nextSlots[i * 2 + 1];
        }
        this.aboutFace.push({ to: reversed(to), slots: ends, turn: turn >= 0 ? 1 : -1 });
      } else {
        this.aboutFace.push(null);
      }

      if (fighting) {
        const drift = new Float32Array(n);
        for (const i of standing) drift[i] = ends[i * 2 + 1] - endV[i];
        this.fights.push({ order, fileEnd, step, toFront, drift });
      } else {
        this.fights.push(null);
      }
    }

    // Where each fallen figure lies, and the beat of the blows on every figure.
    for (let i = 0; i < n; i++) {
      if (this.deathPhase[i] === -1) {
        this.beat[i] = ((this.seed[i] * 61.7) % 1) * STRIKE_PERIOD;
        continue;
      }
      this.beat[i] = this.deathSeconds[i] % STRIKE_PERIOD;
      this.locateFall(i);
    }
  }

  /**
   * Lays `ranked` (the figures standing at a keyframe, in filling order: the
   * first file from its front, then the next) into the grid of the keyframe.
   * Returns their slots and writes the file and rank of each.
   */
  private fill(
    key: UnitKey,
    ranked: number[],
    jitterU: Float32Array,
    jitterV: Float32Array,
    fileOf: Int32Array,
    rowOf: Int32Array,
  ): Float32Array {
    const slots = new Float32Array(this.count * 2).fill(NaN);
    if (ranked.length === 0) return slots;
    const rows = gridRows(ranked.length, key);
    const files = Math.ceil(ranked.length / rows);
    ranked.forEach((i, slot) => {
      const file = Math.floor(slot / rows);
      const row = slot % rows;
      fileOf[i] = file;
      rowOf[i] = row;
      slots[i * 2] = (file + 0.5 + jitterU[i] * 0.45) / files - 0.5;
      slots[i * 2 + 1] = (row + 0.5 + jitterV[i] * 0.45) / rows;
    });
    return slots;
  }

  /** Where and how figure i lies: where it stood the moment it fell. */
  private locateFall(i: number): void {
    const k = this.deathPhase[i];
    const s = this.deathTime[i] - k;
    const turning = this.aboutFace[k];
    const fight = this.fights[k];
    const f = this.interpolate(k, s, turning?.to ?? null);
    const u = this.slots[k][i * 2];
    let v = this.slots[k][i * 2 + 1];
    if (fight) {
      // Stepped up behind the men of his file who fell before him.
      const { order, fileEnd } = fight;
      let p = 0;
      let file = 0;
      while (order[p] !== i) {
        p++;
        if (p === fileEnd[file]) file++;
      }
      let ahead = 0;
      for (let q = file === 0 ? 0 : fileEnd[file - 1]; q < p; q++) {
        ahead += steppedUp(this.deathSeconds[i] - this.deathSeconds[order[q]]);
      }
      v += fight.toFront * ahead * fight.step;
    }
    this.place(f, u, v, i);
    const turned = turning ? smoothstep((s - this.seed[i] * TURN_STAGGER) / TURN_SPAN) : 0;
    this.deathX[i] = this.x[i];
    this.deathY[i] = this.y[i];
    this.deathHeading[i] = this.heading[i] + (turning ? turning.turn * Math.PI * turned : 0);
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
   * The queues of a hand-to-hand fight at battle time t (`now` seconds of
   * playback): how far each standing figure has stepped up behind the men of
   * its file who fell (`shift`, in v) and how many men still stand before it
   * (`before`).
   */
  private queue(fight: FightPhase, t: number, now: number): void {
    const { order, fileEnd, step, toFront } = fight;
    const { deathTime, deathSeconds, shift, before } = this;
    let p = 0;
    for (let f = 0; f < fileEnd.length; f++) {
      const end = fileEnd[f];
      let gone = 0;
      let ahead = 0;
      for (; p < end; p++) {
        const i = order[p];
        if (deathTime[i] <= t) {
          gone += steppedUp(now - deathSeconds[i]);
        } else {
          shift[i] = toFront * gone * step;
          before[i] = ahead - gone;
        }
        ahead++;
      }
    }
  }

  /**
   * Fills x, y, heading, status, since, rank and head for `time`. A fallen
   * figure stays DYING for `lingerSeconds` of playback, then is GONE: pass
   * Infinity to leave the fallen on the field, 0 when the model has no death
   * clip. Returns the number of figures still standing.
   */
  sample(time: number, lingerSeconds: number): number {
    const last = this.keys.length - 1;
    const t = Math.min(Math.max(time, 0), last);
    const k = Math.min(Math.floor(t), Math.max(last - 1, 0));
    const s = t - k;
    const turning = this.aboutFace[k] ?? null;
    const fight = this.fights[k] ?? null;
    const from = this.slots[k];
    const to = turning ? turning.slots : this.slots[Math.min(k + 1, last)];
    // In an about-face the whole phase, its end included, is drawn in the
    // frame of its start: the slots above are in that frame.
    const f = this.interpolate(k, s, turning?.to ?? null);
    const now = this.clock.seconds(t);
    this.fighting = fight !== null;
    if (fight) this.queue(fight, t, now);
    const { shift, before } = this;
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
        this.head[i] = 0;
        continue;
      }
      let u = from[i * 2];
      let v = from[i * 2 + 1];
      const survives = death > k + 1;
      if (survives) u = lerp(u, to[i * 2], s);
      if (fight) {
        // His place in the queue of his file; the regrouping at the end of
        // the phase comes on top, little by little.
        v += shift[i];
        if (survives) v += s * fight.drift[i];
      } else if (survives) {
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
      this.turningAbout[i] = turned > 0 && turned < 1 ? 1 : 0;
      // A man fights once he has turned to face the enemy.
      this.head[i] = fight && before[i] < HEAD_DEPTH && (!turning || turned >= 1) ? 1 : 0;
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
