/**
 * Horsemen riding through foot (UnitAction "overrun"; "Kỵ binh xông qua" in
 * docs/ARCHITECTURE.md). Pure data, no three.js.
 *
 * In a phase of `overrun` a rider does not keep his place in the block. He
 * gallops out of it straight ahead, through the enemy foot before him,
 * wheels, gallops back a little to one side, wheels again behind where he
 * started, and goes round again: a long loop anchored at his place in the
 * formation, a whole number of times, so that he is in his place when the
 * phase begins and when it ends. Every rider has his own loop (how deep he
 * goes, which way he wheels, how fast), so after the first charge the block
 * comes apart into a swirl of horses.
 *
 * A block that comes up at a charge does not halt before the foot: its
 * riders ride on into it at the speed they came at, gathering speed. Only a
 * block that stood before the foot sets off from a standing start.
 *
 * Where a rider is, is a function of the battle time alone (`Ride.sample`):
 * a seek shows what playing up to that moment shows.
 *
 * A man on foot in the way of a horse is bowled over, and a rider passing a
 * man within reach of his weapon strikes at him, whether he stands or lies
 * on the ground. Which men, and when, is worked out once, when the battle is
 * loaded (`trampling`): the horses are walked along their loops in small
 * steps against the men of every enemy unit on foot nearby. The track of
 * that unit (timeline.ts) keeps the list of what befalls its men: most get
 * up again; those the data has fall in the phase fall under a horse, and
 * stay down. The ride keeps the list of the blows its riders strike.
 */

import type { UnitTrack } from "./timeline";
import { ALIVE, type BattleClock, type Knock, type Placing, type Trampling, type UnitKey } from "./timeline";

/** Enemy foot this far ahead of the front of the unit, metres, is foot it rides into (as `npm run validate` checks). */
const GAP = 12;
/** A rider goes no deeper into the enemy than this, metres: in a deeper mass he wheels inside it. */
const REACH_MAX = 90;
/** Out of the far side of the foot he rides on about this far before he wheels, metres. */
const EXIT = 14;
/** The radius he wheels on, metres: a horse is drawn some 7 m long. */
const WHEEL = 12;
/** How fast he rides, as a share of the natural speed of the gallop clip. */
const RIDE_RATE = 0.7;
/** ...and never faster than this share of it: a shorter loop instead. */
const RIDE_RATE_MAX = 1.15;
/** From a standing start, the riders set off within this many seconds of the start of the phase... */
const START_SPREAD = 1.5;
/** ...and all are back in their places at least this long before its end, unless they ride on in the next. */
const REST = 0.4;
const REST_SPREAD = 0.8;
/** Seconds a rider takes to gather speed, and to pull up. */
const RAMP = 1.2;
/** A phase must leave a rider this many seconds to ride in. */
const MIN_SPAN = 5;
/** Riding straight, he weaves this far to either side, metres, once about every WEAVE_LENGTH. */
const WEAVE = 2.2;
const WEAVE_LENGTH = 38;
/** A change of facing this large in the phase is an about-face (timeline.ts): no riding through in such a phase. */
const ABOUT_FACE = (135 * Math.PI) / 180;
/** A block that came on within this of the way it faces, radians, came on at a charge: its riders ride on. */
const CHARGE_CONE = Math.PI / 4;

/** The horses are walked along their loops in steps of this many seconds of playback. */
const STEP = 0.1;
/** A horse that passes this close to a man, metres, runs into him. */
const CONTACT = 2.4;
/** The same horse, or the next, does not run into him again within this many seconds. */
const AGAIN = 1;
/** A rider strikes at a man he passes within this, metres: the reach of his weapon from the saddle, as drawn. */
const BLADE = 5.5;
/** A man struck at with a weapon is not struck at again, by any rider, within this many seconds. */
const BLADE_AGAIN = 1.5;
/** A man bowled over lies on the ground this long, seconds: riders strike at him there. */
const DOWN = 3.2;
/** The men are sorted into cells of this size, metres, to find those near a horse. */
const CELL = 6;

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

/** A fixed random number in [0, 1) for a whole number and a figure's seed. */
function hash01(n: number, seed: number): number {
  let h = (Math.imul(n | 0, 0x9e3779b1) ^ Math.floor(seed * 4294967296)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A formation between two keyframes, as a box on the ground. */
interface Box {
  x: number;
  y: number;
  halfAcross: number;
  halfDepth: number;
  sin: number;
  cos: number;
}

const blankBox = (): Box => ({ x: 0, y: 0, halfAcross: 0, halfDepth: 0, sin: 0, cos: 1 });

function boxBetween(a: UnitKey, b: UnitKey, s: number, out: Box): Box {
  const facing = a.facing + angleDelta(a.facing, b.facing) * s;
  out.x = lerp(a.center.x, b.center.x, s);
  out.y = lerp(a.center.y, b.center.y, s);
  out.halfAcross = lerp(a.frontage, b.frontage, s) / 2;
  out.halfDepth = lerp(a.depth, b.depth, s) / 2;
  out.sin = Math.sin(facing);
  out.cos = Math.cos(facing);
  return out;
}

/**
 * How far straight ahead of (px, py), the way (wx, wy), the enemy foot
 * reaches: the far side of the block that begins within GAP, and of any
 * block that begins within GAP of the far side of the one before. 0 when no
 * foot begins within GAP.
 */
function throughFoot(boxes: Box[], px: number, py: number, wx: number, wy: number): number {
  const spans: [number, number][] = [];
  for (const box of boxes) {
    const dx = px - box.x;
    const dy = py - box.y;
    // The point and the way ahead in the frame of the block: across its front, and towards its front.
    const at = [dx * box.cos - dy * box.sin, dx * box.sin + dy * box.cos];
    const way = [wx * box.cos - wy * box.sin, wx * box.sin + wy * box.cos];
    const half = [box.halfAcross, box.halfDepth];
    let enter = 0;
    let leave = Infinity;
    for (let axis = 0; axis < 2; axis++) {
      if (Math.abs(way[axis]) < 1e-9) {
        if (Math.abs(at[axis]) > half[axis]) leave = -1;
        continue;
      }
      const one = (-half[axis] - at[axis]) / way[axis];
      const other = (half[axis] - at[axis]) / way[axis];
      enter = Math.max(enter, Math.min(one, other));
      leave = Math.min(leave, Math.max(one, other));
    }
    if (enter <= leave) spans.push([enter, leave]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let far = 0;
  for (const [enter, leave] of spans) {
    if (enter > far + GAP) break;
    far = Math.max(far, leave);
  }
  return far;
}

/**
 * The share of the front of the formation `own`, tried at `samples` points
 * across it, that has enemy foot (the formations `foot`) straight ahead:
 * under it, or beginning within GAP. What `npm run validate` asks of a unit
 * that rides through.
 */
export function frontOnFoot(own: UnitKey, foot: UnitKey[], samples: number): number {
  const boxes = foot.map((key) => boxBetween(key, key, 0, blankBox()));
  const f = boxBetween(own, own, 0, blankBox());
  let meeting = 0;
  for (let k = 0; k < samples; k++) {
    const across = ((k + 0.5) / samples - 0.5) * 2 * f.halfAcross;
    const px = f.x + f.cos * across + f.sin * f.halfDepth;
    const py = f.y - f.sin * across + f.cos * f.halfDepth;
    if (throughFoot(boxes, px, py, f.sin, f.cos) > 0) meeting++;
  }
  return meeting / samples;
}

/** The loops of the riders of a unit through one phase; one entry per figure of its track. */
interface RidePhase {
  /** The phase, in seconds of playback. */
  from: number;
  until: number;
  /** The straight of the loop, metres: 0 for a rider who keeps his place. */
  length: Float32Array;
  /** The radius he wheels on, and which way: 1 to the right, -1 to the left. */
  radius: Float32Array;
  side: Int8Array;
  /** He sets off this long after the phase begins, and rides for `span` seconds. */
  delay: Float32Array;
  span: Float32Array;
  /**
   * His pace, metres a second: `enter` as he sets off (0 from a standing
   * start), `cruise` once `rampIn` seconds have passed, and from `rampOut`
   * seconds before the end down to a stand (0: he rides on into the next
   * phase).
   */
  enter: Float32Array;
  cruise: Float32Array;
  rampIn: Float32Array;
  rampOut: Float32Array;
  /** From his place to the front of his block, and to the far side of the foot before it, metres. */
  ahead: Float32Array;
  deep: Float32Array;
  /** Where the riders are at every STEP (see `Ride.positions`), once asked for. */
  cache: RideSteps | null;
}

/** Where the riders of a unit are, step by step through a phase. */
export interface RideSteps {
  from: number;
  steps: number;
  count: number;
  /** (steps + 1) × count field metres; NaN for a rider who is not riding at that step. */
  x: Float32Array;
  y: Float32Array;
}

/** Where a rider is on his loop. */
export interface Riding {
  /** From his place in the formation, metres: the way the block faces, and to its right. */
  forward: number;
  right: number;
  /** The way he rides, radians clockwise from the way the block faces. */
  turn: number;
  /** Metres a second of playback. */
  speed: number;
  /** 0 to 1: how far he is among the enemy foot. */
  inside: number;
}

export function blankRiding(): Riding {
  return { forward: 0, right: 0, turn: 0, speed: 0, inside: 0 };
}

export class Ride {
  /** Per phase: the loops, or null when the unit does not ride through in it. */
  readonly phases: (RidePhase | null)[];
  readonly track: UnitTrack;
  /**
   * The blows the riders strike at men they pass (see BLADE): rider i has
   * the entries strikeStart[i] to strikeStart[i + 1] of `strikeSeconds`, the
   * moments his blows land, seconds of playback, in order. Filled by
   * `seal`, once the tracks of the foot have been made.
   */
  readonly strikeStart: Int32Array;
  strikeSeconds: Float32Array = new Float32Array(0);
  private readonly clock: BattleClock;
  private readonly starts: number[];
  /** A rider strikes no more often than once in this many seconds. */
  private readonly strikeEvery: number;
  private readonly struck: number[][];

  /**
   * `foot` is the keyframes (timeline.unitKeys) of every enemy unit on foot;
   * `gallop` the natural speed of the unit's gallop clip, metres a second as
   * the figures are drawn; `strikeEvery` the seconds a rider needs from one
   * blow to the next (the length of his clip, and a breath).
   */
  constructor(track: UnitTrack, clock: BattleClock, foot: UnitKey[][], gallop: number, strikeEvery = 1.6) {
    this.track = track;
    this.clock = clock;
    this.strikeEvery = strikeEvery;
    this.strikeStart = new Int32Array(track.count + 1);
    this.struck = Array.from({ length: track.count }, () => []);
    const { keys } = track;
    const phases = keys.length - 1;
    this.starts = Array.from({ length: phases + 1 }, (_, k) => clock.seconds(k));
    this.phases = [];
    const rides = (k: number) =>
      k >= 0 && k < phases && keys[k + 1].action === "overrun" && Math.abs(angleDelta(keys[k].facing, keys[k + 1].facing)) < ABOUT_FACE;
    for (let k = 0; k < phases; k++) {
      const a = keys[k];
      const b = keys[k + 1];
      if (!rides(k)) {
        this.phases.push(null);
        continue;
      }
      const from = this.starts[k];
      const until = this.starts[k + 1];
      const seconds = until - from;
      const n = track.count;
      const plan: RidePhase = {
        from,
        until,
        length: new Float32Array(n),
        radius: new Float32Array(n),
        side: new Int8Array(n),
        delay: new Float32Array(n),
        span: new Float32Array(n),
        enter: new Float32Array(n),
        cruise: new Float32Array(n),
        rampIn: new Float32Array(n),
        rampOut: new Float32Array(n),
        ahead: new Float32Array(n),
        deep: new Float32Array(n),
        cache: null,
      };
      this.phases.push(plan);
      const before = k > 0 ? this.phases[k - 1] : null;
      // The pace the block came on at, if it came on the way it faces: its riders ride on at it.
      let charge = 0;
      if (k > 0 && before === null) {
        const dx = a.center.x - keys[k - 1].center.x;
        const dy = a.center.y - keys[k - 1].center.y;
        const came = Math.hypot(dx, dy);
        if (came > 1 && Math.abs(angleDelta(a.facing, Math.atan2(dx, dy))) < CHARGE_CONE) {
          charge = came / Math.max(this.starts[k] - this.starts[k - 1], 0.001);
        }
      }
      const ridesOn = rides(k + 1);

      // The enemy foot at three moments of the phase, and the unit itself at the same moments.
      const moments = [0.5, 0, 1];
      const enemy = moments.map((s) =>
        foot
          .filter((other) => lerp(other[k].men, other[k + 1].men, s) > 0)
          .map((other) => boxBetween(other[k], other[k + 1], s, blankBox())),
      );
      const own = moments.map((s) => boxBetween(a, b, s, blankBox()));

      // Where the riders stand as the phase begins.
      track.sample(k, Infinity);
      const sin = Math.sin(a.facing);
      const cos = Math.cos(a.facing);
      for (let i = 0; i < n; i++) {
        if (track.status[i] !== ALIVE) continue;
        const seed = track.seed[i];
        const dx = track.x[i] - a.center.x;
        const dy = track.y[i] - a.center.y;
        const across = dx * cos - dy * sin;
        const ahead = Math.max(a.depth / 2 - (dx * sin + dy * cos), 0);
        const lane = across / a.frontage;
        // How far the foot reaches, straight ahead of his place in the front.
        let reach = 0;
        for (let m = 0; m < moments.length && reach <= 0; m++) {
          const f = own[m];
          const px = f.x + f.cos * lane * 2 * f.halfAcross + f.sin * f.halfDepth;
          const py = f.y - f.sin * lane * 2 * f.halfAcross + f.cos * f.halfDepth;
          reach = throughFoot(enemy[m], px, py, f.sin, f.cos);
        }
        if (reach <= 0) continue;
        // He rides on from the phase before, or with the block as it comes up; or he sets off from a stand.
        const rodeBefore = before !== null && before.length[i] > 0 && before.rampOut[i] === 0;
        const enter = rodeBefore ? before.cruise[i] : charge;
        const delay = enter > 0 ? 0 : hash01(1, seed) * Math.min(START_SPREAD, 0.12 * seconds);
        const span = seconds - delay - (ridesOn ? 0 : REST + REST_SPREAD * hash01(2, seed));
        if (span < MIN_SPAN) continue;
        // Right through and out of the far side, or, in a deep mass and for one rider in four, a wheel inside it.
        const through = reach < REACH_MAX && hash01(3, seed) > 0.25;
        let length = through
          ? ahead + reach + EXIT * (0.4 + 0.9 * hash01(4, seed))
          : ahead + Math.min(reach, REACH_MAX) * (0.45 + 0.5 * hash01(4, seed));
        const radius = WHEEL * (0.85 + 0.35 * hash01(5, seed));
        // He wheels towards the middle of the block rather than out past its end.
        let side = hash01(6, seed) < 0.5 ? -1 : 1;
        if (Math.abs(across + side * 2 * radius) > a.frontage / 2 + radius) side = -side;
        const rampIn = rodeBefore ? 0 : Math.min(RAMP, span / 4);
        const rampOut = ridesOn ? 0 : Math.min(RAMP, span / 4);
        // The ground covered is cruise × `riding` + `head`: see `sample`.
        const riding = span - rampIn / 2 - rampOut / 2;
        const head = (enter * rampIn) / 2;
        let loop = 2 * length + 2 * Math.PI * radius;
        let laps = Math.max(Math.round((riding * gallop * RIDE_RATE + head) / loop), 1);
        if ((laps * loop - head) / riding > gallop * RIDE_RATE_MAX) {
          // One loop, as deep as he can ride it in the time.
          laps = 1;
          loop = riding * gallop * RIDE_RATE_MAX + head;
          length = (loop - 2 * Math.PI * radius) / 2;
          if (length < ahead + GAP) continue;
        }
        plan.length[i] = length;
        plan.radius[i] = radius;
        plan.side[i] = side;
        plan.delay[i] = delay;
        plan.span[i] = span;
        plan.enter[i] = enter;
        plan.cruise[i] = (laps * loop - head) / riding;
        plan.rampIn[i] = rampIn;
        plan.rampOut[i] = rampOut;
        plan.ahead[i] = ahead;
        plan.deep[i] = ahead + Math.min(reach, REACH_MAX);
      }
    }
  }

  /** Whether any rider rides through in phase `k`. */
  rides(k: number): boolean {
    return this.phases[k] != null;
  }

  /**
   * Where rider `i` is on his loop at `seconds` of playback (a rider who has
   * fallen: where he fell). False when he is in his place in the formation:
   * `out` is then left as it was.
   */
  sample(i: number, seconds: number, out: Riding): boolean {
    const t = Math.min(seconds, this.track.deathSeconds[i]);
    const { starts } = this;
    let k = starts.length - 2;
    while (k > 0 && starts[k] > t) k--;
    const plan = this.phases[k];
    if (!plan) return false;
    const length = plan.length[i];
    if (length === 0) return false;
    const span = plan.span[i];
    const at = t - plan.from - plan.delay[i];
    if (at <= 0 || at >= span) return false;

    // How far he has ridden: gathering speed, at speed, pulling up.
    const enter = plan.enter[i];
    const cruise = plan.cruise[i];
    const rampIn = plan.rampIn[i];
    const rampOut = plan.rampOut[i];
    let distance: number;
    let speed: number;
    if (at < rampIn) {
      speed = enter + ((cruise - enter) * at) / rampIn;
      distance = ((enter + speed) * at) / 2;
    } else {
      distance = ((enter + cruise) * rampIn) / 2 + cruise * (at - rampIn);
      speed = cruise;
      const left = span - at;
      if (left < rampOut) {
        const over = rampOut - left;
        speed = (cruise * left) / rampOut;
        distance -= (cruise * over * over) / (2 * rampOut);
      }
    }
    out.speed = speed;

    // Where that is on the loop: out, the wheel at the far end, back, the wheel at the near end.
    const radius = plan.radius[i];
    const side = plan.side[i];
    const wheel = Math.PI * radius;
    const loop = 2 * length + 2 * wheel;
    const lap = Math.floor(distance / loop);
    let along = distance - lap * loop;
    const seed = this.track.seed[i];
    let forward: number;
    let right: number;
    let turn: number;
    if (along < length) {
      const w = weaving(along, length, hash01(lap * 2 + 11, seed));
      forward = along;
      right = w.off;
      turn = Math.atan2(w.slope, 1);
    } else if ((along -= length) < wheel) {
      const angle = along / radius;
      forward = length + radius * Math.sin(angle);
      right = side * radius * (1 - Math.cos(angle));
      turn = side * angle;
    } else if ((along -= wheel) < length) {
      const w = weaving(along, length, hash01(lap * 2 + 12, seed));
      forward = length - along;
      right = side * 2 * radius + w.off;
      turn = Math.atan2(w.slope, -1);
    } else {
      const angle = (along - length) / radius;
      forward = -radius * Math.sin(angle);
      right = side * radius * (1 + Math.cos(angle));
      turn = Math.PI + side * angle;
    }
    out.forward = forward;
    out.right = right;
    out.turn = turn;
    const ahead = plan.ahead[i];
    out.inside =
      Math.min(Math.max((forward - ahead + 2) / 5, 0), 1) * Math.min(Math.max((plan.deep[i] + 6 - forward) / 5, 0), 1);
    return true;
  }

  /**
   * Where every rider is at each STEP of phase `k`, in field metres: worked
   * out once and kept. Call only while the battle is being loaded: it
   * samples the track.
   */
  positions(k: number): RideSteps | null {
    const plan = this.phases[k];
    if (!plan) return null;
    if (plan.cache) return plan.cache;
    const { track, clock } = this;
    const count = track.count;
    const steps = Math.max(Math.ceil((plan.until - plan.from) / STEP), 1);
    const x = new Float32Array((steps + 1) * count).fill(NaN);
    const y = new Float32Array((steps + 1) * count).fill(NaN);
    const riding = blankRiding();
    for (let m = 0; m <= steps; m++) {
      const seconds = Math.min(plan.from + m * STEP, plan.until - 0.001);
      const time = clock.time(seconds);
      track.sample(time, Infinity);
      const facing = track.formationAt(time).facing;
      const sin = Math.sin(facing);
      const cos = Math.cos(facing);
      for (let i = 0; i < count; i++) {
        if (track.status[i] !== ALIVE || !this.sample(i, seconds, riding)) continue;
        x[m * count + i] = track.x[i] + sin * riding.forward + cos * riding.right;
        y[m * count + i] = track.y[i] + cos * riding.forward - sin * riding.right;
      }
    }
    plan.cache = { from: plan.from, steps, count, x, y };
    return plan.cache;
  }

  /**
   * Rider `i` strikes a blow that lands at `seconds`, if he has not struck,
   * and is not to strike, within `strikeEvery` of it. True when he does.
   */
  strike(i: number, seconds: number): boolean {
    const blows = this.struck[i];
    for (const other of blows) if (Math.abs(other - seconds) < this.strikeEvery) return false;
    blows.push(seconds);
    return true;
  }

  /** Lays the blows out rider by rider, in order: call once every track of the foot has been made. */
  seal(): void {
    const total = this.struck.reduce((sum, blows) => sum + blows.length, 0);
    this.strikeSeconds = new Float32Array(total);
    let q = 0;
    this.struck.forEach((blows, i) => {
      blows.sort((a, b) => a - b);
      for (const seconds of blows) this.strikeSeconds[q++] = seconds;
      this.strikeStart[i + 1] = q;
    });
  }
}

const weaveOut = { off: 0, slope: 0 };

/**
 * The weave of a rider `along` a straight of `length` metres: how far he is
 * off the line and the slope of his path. Nothing at either end of the
 * straight, where the wheels begin.
 */
function weaving(along: number, length: number, random: number): { off: number; slope: number } {
  const q = (Math.PI * along) / length;
  const envelope = Math.sin(q) ** 2;
  const wave = (2 * Math.PI * along) / WEAVE_LENGTH + 2 * Math.PI * random;
  weaveOut.off = WEAVE * envelope * Math.sin(wave);
  weaveOut.slope =
    WEAVE * ((Math.PI / length) * Math.sin(2 * q) * Math.sin(wave) + envelope * ((2 * Math.PI) / WEAVE_LENGTH) * Math.cos(wave));
  return weaveOut;
}

/**
 * The horses of `rides` (the enemy units that ride through, each with a
 * phase or more of `overrun`) as a unit on foot with the keyframes `keys`
 * meets them. Null when no enemy rides through at all.
 */
export function trampling(keys: UnitKey[], rides: Ride[]): Trampling | null {
  if (rides.length === 0) return null;
  /** The enemy units that ride through, or close by, in phase k. */
  const near = (k: number): Ride[] =>
    rides.filter((ride) => {
      if (!ride.rides(k)) return false;
      const theirs = ride.track.keys;
      for (const m of [k, k + 1]) {
        const reach = Math.hypot(theirs[m].frontage, theirs[m].depth) / 2 + REACH_MAX + EXIT + 3 * WHEEL;
        const own = Math.hypot(keys[m].frontage, keys[m].depth) / 2;
        const apart = Math.hypot(theirs[m].center.x - keys[m].center.x, theirs[m].center.y - keys[m].center.y);
        if (apart < reach + own) return true;
      }
      return false;
    });

  let cells = new Int32Array(0);
  return {
    active: (k) => near(k).length > 0,
    contacts(k, count, place: Placing, rest, blades) {
      const hits: Knock[] = [];
      const riders: { ride: Ride; horses: RideSteps }[] = [];
      for (const ride of near(k)) {
        const horses = ride.positions(k);
        if (horses) riders.push({ ride, horses });
      }
      if (riders.length === 0) return hits;
      const x = new Float32Array(count);
      const y = new Float32Array(count);
      const up = new Uint8Array(count);
      const next = new Int32Array(count);
      const lastHit = new Float32Array(count).fill(-Infinity);
      const lastBlade = new Float32Array(count).fill(-Infinity);
      const again = Math.max(rest, AGAIN);
      const reach = blades ? BLADE : CONTACT;
      const { from, steps } = riders[0].horses;
      for (let m = 0; m < steps; m++) {
        const seconds = from + m * STEP;
        place(seconds, x, y, up);
        // The men who stand, sorted into cells.
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < count; i++) {
          if (up[i] === 0) continue;
          if (x[i] < minX) minX = x[i];
          if (x[i] > maxX) maxX = x[i];
          if (y[i] < minY) minY = y[i];
          if (y[i] > maxY) maxY = y[i];
        }
        if (minX > maxX) continue;
        let cell = CELL;
        let columns = Math.floor((maxX - minX) / cell) + 1;
        let rows = Math.floor((maxY - minY) / cell) + 1;
        while (columns * rows > 262144) {
          cell *= 2;
          columns = Math.floor((maxX - minX) / cell) + 1;
          rows = Math.floor((maxY - minY) / cell) + 1;
        }
        if (cells.length < columns * rows) cells = new Int32Array(columns * rows);
        cells.fill(-1, 0, columns * rows);
        for (let i = 0; i < count; i++) {
          if (up[i] === 0) continue;
          const c = Math.floor((y[i] - minY) / cell) * columns + Math.floor((x[i] - minX) / cell);
          next[i] = cells[c];
          cells[c] = i;
        }
        // Each horse, from where it is at this step to where it is at the next.
        for (const { ride, horses } of riders) {
          if (m >= horses.steps) continue;
          const base = m * horses.count;
          for (let j = 0; j < horses.count; j++) {
            const x0 = horses.x[base + j];
            const x1 = horses.x[base + horses.count + j];
            if (Number.isNaN(x0) || Number.isNaN(x1)) continue;
            const y0 = horses.y[base + j];
            const y1 = horses.y[base + horses.count + j];
            const sx = x1 - x0;
            const sy = y1 - y0;
            const squared = sx * sx + sy * sy;
            if (squared < 0.0025) continue;
            const c0 = Math.max(Math.floor((Math.min(x0, x1) - reach - minX) / cell), 0);
            const c1 = Math.min(Math.floor((Math.max(x0, x1) + reach - minX) / cell), columns - 1);
            const r0 = Math.max(Math.floor((Math.min(y0, y1) - reach - minY) / cell), 0);
            const r1 = Math.min(Math.floor((Math.max(y0, y1) + reach - minY) / cell), rows - 1);
            for (let r = r0; r <= r1; r++) {
              for (let c = c0; c <= c1; c++) {
                for (let i = cells[r * columns + c]; i !== -1; i = next[i]) {
                  // Where on its way the horse comes nearest the man.
                  const share = Math.min(Math.max(((x[i] - x0) * sx + (y[i] - y0) * sy) / squared, 0), 1);
                  const dx = x0 + sx * share - x[i];
                  const dy = y0 + sy * share - y[i];
                  const apart = dx * dx + dy * dy;
                  if (apart > reach * reach) continue;
                  const when = seconds + share * STEP;
                  const since = when - lastHit[i];
                  if (apart <= CONTACT * CONTACT && since >= again) {
                    // The horse runs into him.
                    lastHit[i] = when;
                    hits.push({ figure: i, seconds: when, bearing: Math.atan2(sx, sy), blade: false });
                  } else if (blades && share > 0 && share < 1) {
                    // The rider strikes at him as he passes: a man on the ground, or one who stands.
                    const down = since < DOWN;
                    if (!down && (since < again || when - lastBlade[i] < BLADE_AGAIN)) continue;
                    if (!ride.strike(j, when)) continue;
                    if (!down) {
                      lastBlade[i] = when;
                      hits.push({ figure: i, seconds: when, bearing: Math.atan2(sx, sy), blade: true });
                    }
                  }
                }
              }
            }
          }
        }
      }
      hits.sort((a, b) => a.seconds - b.seconds);
      return hits;
    },
  };
}
