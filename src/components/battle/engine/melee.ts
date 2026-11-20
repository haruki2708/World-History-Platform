/**
 * Hand-to-hand fighting: who fights whom. Pure data, no three.js.
 *
 * Every frame, after the tracks were sampled, the men at the head of the
 * files of the units that fight hand to hand (`UnitTrack.head`) are paired
 * off with the nearest such man of the enemy in front of them. A man and the
 * enemy who chose each other step up to striking distance and face each
 * other; a man whose enemy is busy with somebody else joins in from the
 * side. A man with no enemy in reach does not strike.
 *
 * Who is nearest is measured between the places the heads of the files hold
 * in the front rank (`UnitTrack.frontX`), not between the men as they stand:
 * a man still stepping up into the place of the one who fell is already the
 * enemy of the man that one fought, so pairs change less often than men
 * fall. Only enemies who can close from where they stand are picked: a man
 * far behind his place in the front rank (several fell ahead of him, or he
 * drifts to another rank of the next formation) leaves his enemy to others.
 *
 * Foot against foot the fight does not stay two straight lines of duels
 * ("Hỗn chiến" in docs/ARCHITECTURE.md; batch L, asked for by the user):
 *
 * - Each pair is pushed off the line where the two fronts meet, into one
 *   side or the other and a little along it, and turned away from straight
 *   across (MELEE_DEPTH, MELEE_SIDE, MELEE_TURN). How far and which way is a
 *   smooth field over the ground that drifts with the battle clock (FIELD),
 *   read at the place of the pair in the front ranks: neighbouring pairs
 *   push and give ground together here and there, the line bends and
 *   breaks, and the pairs shift about as they fight.
 * - Men of the second rank step in by turns (JOIN_SHARE of the time, each
 *   man his own) to strike at an enemy who is fighting another, from his
 *   side, then fall back.
 * - Fighters keep a little room between them (FIGHTER_ROOM), and the men
 *   behind keep clear of them (`clear`, PRESS_ROOM; units.ts asks).
 *
 * Horse against horse, and horse against foot, the pairs stand as before.
 *
 * The result is a function of the battle time alone, so a seek gives the same
 * pairs as playing up to that moment; the scene (units.ts) eases the figures
 * towards it.
 *
 * Blows are timed by the man who takes them: a man is struck at his beat and
 * every STRIKE_PERIOD before and after. The beat of a man about to fall is
 * the moment he falls (`UnitTrack.beat`), so the last blow of his enemy
 * lands as he goes down. Two men who fight each other take turns: the beat
 * of one is half a period after the beat of the other.
 */

import { ALIVE, STRIKE_PERIOD, type UnitTrack } from "./timeline";

/** How far a man leaves his place in the formation to close with an enemy, metres. */
const MAX_STEP = 5;
/** An enemy further off than this to one side is not his to fight: cosine of 70°. */
const FRONT_COS = Math.cos((70 * Math.PI) / 180);
/** Standing this many times the striking distance apart, a blow still lands. */
const REACH_SLACK = 1.3;
/**
 * The point of a weapon stops this far short of the middle of the enemy, as
 * a share of what the shorter weapon reaches: on his shield.
 */
const GUARD = 0.3;
/** A blow begins only this early in its clip, seconds; later the figure waits for the next. */
const STRIKE_START = 0.3;
/** A man who joins in against an enemy stands at least this far round him from the man he fights. */
const SIDE_ANGLE = (55 * Math.PI) / 180;

/**
 * Foot against foot: how far a pair is pushed off the line where the fronts
 * meet, into one side or the other, as a share of their striking distance;
 * how far along that line; and how far, radians, it turns away from
 * straight across.
 */
const MELEE_DEPTH = 2.6;
const MELEE_SIDE = 0.9;
const MELEE_TURN = 1.2;
/**
 * The field those come from: waves over the ground, each of `length`
 * metres, running the way `angle` (radians from east) and drifting through
 * a whole wave every `period` seconds of playback, summed with `weight`.
 * The shortest is about two files wide, so neighbouring pairs differ; the
 * longer ones bend the line over tens of metres.
 */
const FIELD = [
  { length: 11, angle: 0.37, period: 9.1, weight: 0.42 },
  { length: 27, angle: 1.91, period: 15.7, weight: 0.36 },
  { length: 61, angle: 3.03, period: 26.3, weight: 0.22 },
];
/**
 * Men of the second rank of foot step in to strike at an enemy who fights
 * another, for JOIN_SHARE of the time, in turns of JOIN_PERIOD to
 * JOIN_PERIOD + JOIN_SPAN seconds (each man his own; in one turn of
 * 1 / JOIN_SKIP he stays back). They go up to JOIN_STEP metres from their
 * place, and strike only once there: JOIN_WALK metres a second, and a
 * breath, after the turn begins; and not in its last JOIN_LAST seconds.
 */
const JOIN_SHARE = 0.5;
const JOIN_PERIOD = 6;
const JOIN_SPAN = 5;
const JOIN_SKIP = 0.2;
const JOIN_STEP = 9;
const JOIN_WALK = 5;
const JOIN_LAST = 0.8;
/**
 * Two fighters on foot stand at least this far apart, metres (but a man and
 * the enemy he strikes): each gives way by at most FIGHTER_SHOVE, a pair as
 * one.
 */
const FIGHTER_ROOM = 2.6;
const FIGHTER_SHOVE = 1.1;
/** A man in the press behind keeps this far from the fighters, metres (see `clear`). */
const PRESS_ROOM = 2.8;

function fract(v: number): number {
  return v - Math.floor(v);
}

/** A fixed random number in [0, 1) for a whole number and a figure's seed. */
function hash01(n: number, seed: number): number {
  let h = (Math.imul(n | 0, 0x9e3779b1) ^ Math.floor(seed * 4294967296)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The field of FIELD at field point (x, y), `seconds` of playback, between -1 and 1; `salt` picks one of several. */
function field(x: number, y: number, seconds: number, salt: number): number {
  let sum = 0;
  for (let k = 0; k < FIELD.length; k++) {
    const { length, angle, period, weight } = FIELD[k];
    const a = angle + salt * 2.39996;
    const along = x * Math.cos(a) + y * Math.sin(a);
    sum += weight * Math.sin((2 * Math.PI * along) / length + (2 * Math.PI * seconds) / period + salt * (k + 1) * 1.7);
  }
  return sum;
}

export interface MeleeUnit {
  track: UnitTrack;
  /** Units with different numbers are enemies. */
  side: number;
  /** How far the weapon reaches in front of a figure when its blow lands, field metres. */
  reach: number;
  /** How far the figure itself (its shield, its horse) reaches in front of where it stands, field metres. */
  front: number;
  /** Horsemen: their fights stay pairs in a line (see the note on top). */
  mounted?: boolean;
}

/** What the fight asks of every figure of a unit; one entry per figure of its track. */
export interface MeleeFigures {
  /** Where the figure should stand, from its place in the formation, field metres east and north. */
  offsetX: Float32Array;
  offsetY: Float32Array;
  /** The way to its enemy, radians clockwise from north (figures with an enemy only). */
  bearing: Float32Array;
  /**
   * When its blows land: the beat of its enemy, seconds of playback. -1 for
   * a figure with no enemy in reach.
   */
  beat: Float32Array;
  /** 1 when that enemy falls before another blow could land: the blow that fells him must not be missed. */
  kill: Uint8Array;
  /** Its enemy, a number that differs for every figure on the field, or -1. */
  opponent: Int32Array;
  /** The unit had men at the head of a file at the last update: the arrays above hold their fight. */
  engaged: boolean;
}

/**
 * The blow a figure strikes, as the beat it is timed to (-1 between blows):
 * `current` is the blow under way, `wanted` the beat of its enemy (-1
 * without an enemy in reach), `clock` the battle time in seconds of
 * playback. The attack clip is `seconds` long and its blow lands `impact`
 * seconds in, on the beat.
 *
 * A blow under way is played to its end, and a new one begins only at the
 * start of the clip, so nothing pops. The blow that fells the enemy (`kill`)
 * is the exception: it may begin any time before it lands, and it cuts short
 * the blow under way. After a jump (`snap`) the figure is at once in
 * whatever blow the clock has it in.
 */
export function swingBeat(
  current: number,
  wanted: number,
  kill: boolean,
  snap: boolean,
  clock: number,
  seconds: number,
  impact: number,
): number {
  let beat = snap ? -1 : current;
  if (beat >= 0 && swingInto(beat, clock, impact) >= seconds) beat = -1;
  if (wanted >= 0 && wanted !== beat) {
    const begun = swingInto(wanted, clock, impact);
    if (beat < 0) {
      if (begun < (snap ? seconds : kill ? impact : STRIKE_START)) beat = wanted;
    } else if (kill && begun <= impact) {
      beat = wanted;
    }
  }
  return beat;
}

/** How far into a clip, seconds, a figure is at `clock` when the clip's moment `impact` falls on `beat`. */
export function swingInto(beat: number, clock: number, impact: number): number {
  return (((clock - beat + impact) % STRIKE_PERIOD) + STRIKE_PERIOD) % STRIKE_PERIOD;
}

export class Melee {
  readonly figures: MeleeFigures[];
  private readonly units: MeleeUnit[];

  // The men at the head of a file this frame, and the men of the second
  // rank whose turn it is to step in, one entry each.
  private capacity = 0;
  private unitOf = new Int16Array(0);
  private indexOf = new Int32Array(0);
  /** Where each stands in his formation. */
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  /** The place of each in the front rank (see the note on top); for a man of the second rank, where he stands. */
  private nx = new Float32Array(0);
  private ny = new Float32Array(0);
  private sin = new Float32Array(0);
  private cos = new Float32Array(0);
  private target = new Int32Array(0);
  private distance = new Float32Array(0);
  /** Where each stands once closed up. */
  private ex = new Float32Array(0);
  private ey = new Float32Array(0);
  /** The beat of the blows on each. */
  private own = new Float32Array(0);
  /** Next entry in the same cell of the grid, or -1. */
  private next = new Int32Array(0);
  /** The man who joins in against each from his left and from his right, or -1. */
  private left = new Int32Array(0);
  private right = new Int32Array(0);
  /** How many men at the head of a file picked each as their enemy. */
  private picked = new Int32Array(0);
  /** 1 for a man of the second rank who steps in (see JOIN_SHARE); seconds into his turn, and left of it. */
  private second = new Uint8Array(0);
  private joined = new Float32Array(0);
  private joinLeft = new Float32Array(0);
  /** 1 for a man on foot. */
  private onFoot = new Uint8Array(0);
  /** How far each fighter gives way to the others (see FIGHTER_ROOM). */
  private shoveX = new Float32Array(0);
  private shoveY = new Float32Array(0);
  private cells = new Int32Array(0);

  // The fighters as they stand once closed up, in a fine grid, for `clear`
  // and for the room between them.
  private fineCells = new Int32Array(0);
  private fineNext = new Int32Array(0);
  private fineSize = 1;
  private fineColumns = 0;
  private fineRows = 0;
  private fineMinX = 0;
  private fineMinY = 0;
  private fighters = 0;

  constructor(units: MeleeUnit[]) {
    this.units = units;
    this.figures = units.map(({ track }) => ({
      offsetX: new Float32Array(track.count),
      offsetY: new Float32Array(track.count),
      bearing: new Float32Array(track.count),
      beat: new Float32Array(track.count).fill(-1),
      kill: new Uint8Array(track.count),
      opponent: new Int32Array(track.count).fill(-1),
      engaged: false,
    }));
  }

  /** How far apart the feet of two enemies stand when they fight, field metres. */
  private strikingDistance(a: MeleeUnit, b: MeleeUnit): number {
    return Math.max(Math.min(a.reach, b.reach) * (1 + GUARD), a.front + b.front);
  }

  private reserve(count: number): void {
    if (count <= this.capacity) return;
    this.capacity = Math.ceil(count * 1.5) + 16;
    this.unitOf = new Int16Array(this.capacity);
    this.indexOf = new Int32Array(this.capacity);
    this.px = new Float32Array(this.capacity);
    this.py = new Float32Array(this.capacity);
    this.nx = new Float32Array(this.capacity);
    this.ny = new Float32Array(this.capacity);
    this.sin = new Float32Array(this.capacity);
    this.cos = new Float32Array(this.capacity);
    this.target = new Int32Array(this.capacity);
    this.distance = new Float32Array(this.capacity);
    this.ex = new Float32Array(this.capacity);
    this.ey = new Float32Array(this.capacity);
    this.own = new Float32Array(this.capacity);
    this.next = new Int32Array(this.capacity);
    this.left = new Int32Array(this.capacity);
    this.right = new Int32Array(this.capacity);
    this.picked = new Int32Array(this.capacity);
    this.second = new Uint8Array(this.capacity);
    this.joined = new Float32Array(this.capacity);
    this.joinLeft = new Float32Array(this.capacity);
    this.onFoot = new Uint8Array(this.capacity);
    this.shoveX = new Float32Array(this.capacity);
    this.shoveY = new Float32Array(this.capacity);
    this.fineNext = new Int32Array(this.capacity);
  }

  /**
   * Whether man `i` of `track`, of the second rank, is to step in at `now`
   * (see JOIN_SHARE): seconds into his turn, or -1. `left` gets the seconds
   * left of it.
   */
  private turnOf(track: UnitTrack, i: number, now: number, left: { seconds: number }): number {
    const s = track.seed[i];
    const period = JOIN_PERIOD + JOIN_SPAN * fract(s * 5.71);
    const at = now + s * 37.3;
    const cycle = Math.floor(at / period);
    const into = at - cycle * period;
    const share = JOIN_SHARE * period;
    if (into >= share || hash01(cycle, s) < JOIN_SKIP) return -1;
    left.seconds = share - into;
    return into;
  }

  /**
   * Pairs the figures off as the tracks stand: call after every track was
   * sampled at the same battle time, `now` in seconds of playback.
   */
  update(now: number): void {
    const { units, figures } = this;
    this.fighters = 0;

    // Forget the pairs of the last update.
    let entries = 0;
    let longest = 0;
    for (let u = 0; u < units.length; u++) {
      const out = figures[u];
      if (out.engaged) {
        out.offsetX.fill(0);
        out.offsetY.fill(0);
        out.beat.fill(-1);
        out.kill.fill(0);
        out.opponent.fill(-1);
        out.engaged = false;
      }
      const { track, mounted } = units[u];
      if (!track.fighting) continue;
      for (let i = 0; i < track.count; i++) {
        if (track.head[i] === 1) entries++;
        else if (!mounted && track.status[i] === ALIVE && track.before[i] === 1 && track.turningAbout[i] === 0) entries++;
      }
      longest = Math.max(longest, units[u].reach * (1 + GUARD), 2 * units[u].front);
    }
    if (entries === 0) return;
    this.reserve(entries);
    const { unitOf, indexOf, px, py, nx, ny, sin, cos, target, distance, ex, ey, own, next, left, right, picked } = this;
    const { second, joined, joinLeft, onFoot } = this;

    let n = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const turnLeft = { seconds: 0 };
    for (let u = 0; u < units.length; u++) {
      const { track, mounted } = units[u];
      if (!track.fighting) continue;
      for (let i = 0; i < track.count; i++) {
        let into = -1;
        if (track.head[i] === 0) {
          // The second rank of foot, in its turn to step in.
          if (mounted || track.status[i] !== ALIVE || track.before[i] !== 1 || track.turningAbout[i] !== 0) continue;
          into = this.turnOf(track, i, now, turnLeft);
          if (into < 0) continue;
        }
        unitOf[n] = u;
        indexOf[n] = i;
        px[n] = track.x[i];
        py[n] = track.y[i];
        second[n] = into >= 0 ? 1 : 0;
        joined[n] = into;
        joinLeft[n] = into >= 0 ? turnLeft.seconds : 0;
        onFoot[n] = mounted ? 0 : 1;
        nx[n] = into >= 0 ? track.x[i] : track.frontX[i];
        ny[n] = into >= 0 ? track.y[i] : track.frontY[i];
        sin[n] = Math.sin(track.heading[i]);
        cos[n] = Math.cos(track.heading[i]);
        own[n] = track.beat[i];
        if (nx[n] < minX) minX = nx[n];
        if (nx[n] > maxX) maxX = nx[n];
        if (ny[n] < minY) minY = ny[n];
        if (ny[n] > maxY) maxY = ny[n];
        n++;
      }
    }

    // A grid of cells as wide as the farthest two enemies may pair from.
    const range = longest + MAX_STEP + Math.max(MAX_STEP, JOIN_STEP);
    let cell = range;
    let columns = Math.floor((maxX - minX) / cell) + 1;
    let rows = Math.floor((maxY - minY) / cell) + 1;
    while (columns * rows > 65536) {
      cell *= 2;
      columns = Math.floor((maxX - minX) / cell) + 1;
      rows = Math.floor((maxY - minY) / cell) + 1;
    }
    if (this.cells.length < columns * rows) this.cells = new Int32Array(columns * rows);
    const cells = this.cells;
    cells.fill(-1, 0, columns * rows);
    for (let a = 0; a < n; a++) {
      const c = Math.floor((ny[a] - minY) / cell) * columns + Math.floor((nx[a] - minX) / cell);
      next[a] = cells[c];
      cells[c] = a;
    }

    // Each man picks the nearest enemy at the head of a file in front of him
    // who also has him in front.
    for (let a = 0; a < n; a++) {
      const unit = units[unitOf[a]];
      const step = second[a] === 1 ? JOIN_STEP : MAX_STEP;
      const column = Math.floor((nx[a] - minX) / cell);
      const row = Math.floor((ny[a] - minY) / cell);
      let best = -1;
      let bestSquared = Infinity;
      for (let r = Math.max(row - 1, 0); r <= Math.min(row + 1, rows - 1); r++) {
        for (let c = Math.max(column - 1, 0); c <= Math.min(column + 1, columns - 1); c++) {
          for (let b = cells[r * columns + c]; b !== -1; b = next[b]) {
            if (second[b] === 1) continue;
            const other = units[unitOf[b]];
            if (other.side === unit.side) continue;
            const dx = nx[b] - nx[a];
            const dy = ny[b] - ny[a];
            const squared = dx * dx + dy * dy;
            if (squared >= bestSquared) continue;
            const apart = this.strikingDistance(unit, other);
            const reach = apart + MAX_STEP + step;
            if (squared > reach * reach) continue;
            // As they stand, the two can step up to where a blow lands.
            const sx = px[b] - px[a];
            const sy = py[b] - py[a];
            const meet = apart * REACH_SLACK + MAX_STEP + step;
            if (sx * sx + sy * sy > meet * meet) continue;
            const d = Math.sqrt(squared);
            if (d > 0.001) {
              // In front of a, and a in front of b.
              if (dx * sin[a] + dy * cos[a] < FRONT_COS * d) continue;
              if (-dx * sin[b] - dy * cos[b] < FRONT_COS * d) continue;
            }
            best = b;
            bestSquared = squared;
          }
        }
      }
      target[a] = best;
      distance[a] = best === -1 ? 0 : Math.sqrt(bestSquared);
      ex[a] = px[a];
      ey[a] = py[a];
    }

    // A man about to fall whom nobody at the head of a file picked: the
    // enemy he picked turns on him (unless that enemy is busy with another
    // man about to fall), so somebody strikes the blow that fells him.
    const fallsSoon = (a: number) => {
      const left = units[unitOf[a]].track.deathSeconds[indexOf[a]] - now;
      return left > 0 && left <= STRIKE_PERIOD;
    };
    picked.fill(0, 0, n);
    for (let a = 0; a < n; a++) if (target[a] !== -1 && second[a] === 0) picked[target[a]]++;
    for (let a = 0; a < n; a++) {
      const b = target[a];
      if (second[a] === 1 || b === -1 || picked[a] > 0 || !fallsSoon(a)) continue;
      const busy = target[b];
      if (busy !== -1) {
        if (fallsSoon(busy) && picked[busy] === 1) continue;
        picked[busy]--;
      }
      target[b] = a;
      distance[b] = distance[a];
      picked[a]++;
    }

    // Two men who picked each other meet halfway from where they stand, at
    // striking distance (a man still stepping up is met further out), and
    // take turns: the blows on one land half a period after the blows on
    // the other. A man about to fall keeps his beat, the moment he falls.
    for (let a = 0; a < n; a++) {
      const b = target[a];
      if (b === -1 || b < a || target[b] !== a) continue;
      const d = Math.max(Math.hypot(px[b] - px[a], py[b] - py[a]), 0.001);
      const apart = this.strikingDistance(units[unitOf[a]], units[unitOf[b]]);
      const step = Math.min(Math.max((d - apart) / 2, -MAX_STEP), MAX_STEP);
      const ux = (px[b] - px[a]) / d;
      const uy = (py[b] - py[a]) / d;
      ex[a] = px[a] + ux * step;
      ey[a] = py[a] + uy * step;
      ex[b] = px[b] - ux * step;
      ey[b] = py[b] - uy * step;
      // Foot against foot: off the line, and turned (see MELEE_DEPTH).
      if (onFoot[a] === 1 && onFoot[b] === 1) this.scatter(a, b, apart, now);
      const soonA = fallsSoon(a);
      const soonB = fallsSoon(b);
      if (soonB && !soonA) own[a] = (own[b] + STRIKE_PERIOD / 2) % STRIKE_PERIOD;
      else if (!soonB) own[b] = (own[a] + STRIKE_PERIOD / 2) % STRIKE_PERIOD;
    }
    // A man whose enemy is busy with another joins in from the side: one
    // man on either side of the enemy at most, the nearest. The others stand.
    left.fill(-1, 0, n);
    right.fill(-1, 0, n);
    for (let a = 0; a < n; a++) {
      const b = target[a];
      if (b === -1 || target[b] === a) continue;
      // Which side of the way the enemy fights (or faces) this man comes
      // from, as they stand (the angle below is measured the same way).
      const partner = target[b];
      const mutual = partner !== -1 && target[partner] === b;
      const rx = mutual ? ex[partner] - ex[b] : sin[b];
      const ry = mutual ? ey[partner] - ey[b] : cos[b];
      const onLeft = rx * (py[a] - ey[b]) - ry * (px[a] - ex[b]) > 0;
      const taken = onLeft ? left : right;
      if (taken[b] === -1 || distance[a] < distance[taken[b]]) taken[b] = a;
    }
    for (let a = 0; a < n; a++) {
      const b = target[a];
      if (b === -1 || target[b] === a) continue;
      if (left[b] !== a && right[b] !== a) {
        target[a] = -1;
        continue;
      }
      const partner = target[b];
      const mutual = partner !== -1 && target[partner] === b;
      const reference = mutual ? Math.atan2(ex[partner] - ex[b], ey[partner] - ey[b]) : Math.atan2(sin[b], cos[b]);
      // Clockwise from the way the enemy fights to where this man comes from.
      let angle = Math.atan2(px[a] - ex[b], py[a] - ey[b]) - reference;
      angle -= 2 * Math.PI * Math.round(angle / (2 * Math.PI));
      const room = mutual ? SIDE_ANGLE : SIDE_ANGLE / 2;
      if (Math.abs(angle) < room) angle = left[b] === a ? -room : room;
      const apart = this.strikingDistance(units[unitOf[a]], units[unitOf[b]]);
      // Where he would stand to strike, and as far towards it as he may go.
      let dx = ex[b] + Math.sin(reference + angle) * apart - px[a];
      let dy = ey[b] + Math.cos(reference + angle) * apart - py[a];
      const most = second[a] === 1 ? JOIN_STEP : MAX_STEP;
      const d = Math.hypot(dx, dy);
      if (d > most) {
        dx *= most / d;
        dy *= most / d;
      }
      ex[a] = px[a] + dx;
      ey[a] = py[a] + dy;
    }

    // Fighters on foot give each other room (see FIGHTER_ROOM).
    this.layFine(n);
    this.makeRoom(n);
    this.layFine(n);

    for (let a = 0; a < n; a++) {
      const u = unitOf[a];
      const i = indexOf[a];
      const out = figures[u];
      out.engaged = true;
      const b = target[a];
      if (b === -1) continue;
      const other = units[unitOf[b]];
      const dx = ex[b] - ex[a];
      const dy = ey[b] - ey[a];
      const apart = this.strikingDistance(units[u], other);
      let reaches = dx * dx + dy * dy <= apart * apart * REACH_SLACK * REACH_SLACK;
      if (second[a] === 1) {
        // A man of the second rank strikes once he is there, and not as his turn runs out.
        const walk = Math.hypot(ex[a] - px[a], ey[a] - py[a]);
        if (joined[a] < walk / JOIN_WALK + 0.3 || joinLeft[a] < JOIN_LAST) reaches = false;
      }
      out.offsetX[i] = ex[a] - px[a];
      out.offsetY[i] = ey[a] - py[a];
      out.bearing[i] = Math.atan2(dx, dy);
      out.opponent[i] = (unitOf[b] << 16) | indexOf[b];
      out.beat[i] = reaches ? own[b] : -1;
      out.kill[i] = fallsSoon(b) ? 1 : 0;
    }
  }

  /**
   * Foot against foot: moves the pair of a and b (closed up at striking
   * distance or on their way to it) off the line where their fronts meet,
   * along it, and turns it, as the field has it at the place of the pair.
   */
  private scatter(a: number, b: number, apart: number, now: number): void {
    const { ex, ey, nx, ny, sin, cos } = this;
    // The place of the pair, and the way across the line: from a's place in the front rank to b's.
    const mx = (nx[a] + nx[b]) / 2;
    const my = (ny[a] + ny[b]) / 2;
    let wx = nx[b] - nx[a];
    let wy = ny[b] - ny[a];
    const w = Math.hypot(wx, wy);
    if (w > 0.001) {
      wx /= w;
      wy /= w;
    } else {
      wx = sin[a];
      wy = cos[a];
    }
    const depth = MELEE_DEPTH * apart * field(mx, my, now, 0);
    const along = MELEE_SIDE * apart * field(mx, my, now, 1);
    const turn = MELEE_TURN * field(mx, my, now, 2);
    // The middle of the pair moves; the two keep their distance, turned about it.
    const cx = (ex[a] + ex[b]) / 2 + wx * depth + wy * along;
    const cy = (ey[a] + ey[b]) / 2 + wy * depth - wx * along;
    let ux = ex[b] - ex[a];
    let uy = ey[b] - ey[a];
    const half = Math.hypot(ux, uy) / 2;
    if (half < 0.001) {
      ux = wx;
      uy = wy;
    } else {
      ux /= 2 * half;
      uy /= 2 * half;
    }
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    const rx = ux * c + uy * s;
    const ry = uy * c - ux * s;
    ex[a] = cx - rx * half;
    ey[a] = cy - ry * half;
    ex[b] = cx + rx * half;
    ey[b] = cy + ry * half;
  }

  /** Lays the fighters (the men with an enemy) as they stand once closed up into the fine grid. */
  private layFine(n: number): void {
    const { target, ex, ey } = this;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let count = 0;
    for (let a = 0; a < n; a++) {
      if (target[a] === -1) continue;
      count++;
      if (ex[a] < minX) minX = ex[a];
      if (ex[a] > maxX) maxX = ex[a];
      if (ey[a] < minY) minY = ey[a];
      if (ey[a] > maxY) maxY = ey[a];
    }
    this.fighters = count;
    if (count === 0) return;
    let size = Math.max(FIGHTER_ROOM, PRESS_ROOM);
    let columns = Math.floor((maxX - minX) / size) + 1;
    let rows = Math.floor((maxY - minY) / size) + 1;
    while (columns * rows > 262144) {
      size *= 2;
      columns = Math.floor((maxX - minX) / size) + 1;
      rows = Math.floor((maxY - minY) / size) + 1;
    }
    if (this.fineCells.length < columns * rows) this.fineCells = new Int32Array(columns * rows);
    const cells = this.fineCells;
    cells.fill(-1, 0, columns * rows);
    const nextOf = this.fineNext;
    for (let a = 0; a < n; a++) {
      if (target[a] === -1) continue;
      const c = Math.floor((ey[a] - minY) / size) * columns + Math.floor((ex[a] - minX) / size);
      nextOf[a] = cells[c];
      cells[c] = a;
    }
    this.fineSize = size;
    this.fineColumns = columns;
    this.fineRows = rows;
    this.fineMinX = minX;
    this.fineMinY = minY;
  }

  /**
   * Fighters on foot closer than FIGHTER_ROOM to another fighter (but the
   * enemy each strikes) give way, half the shortfall each, at most
   * FIGHTER_SHOVE; two who fight each other give way as one.
   */
  private makeRoom(n: number): void {
    if (this.fighters === 0) return;
    const { target, ex, ey, onFoot, shoveX, shoveY, fineCells, fineNext, fineSize, fineColumns, fineRows, fineMinX, fineMinY } = this;
    for (let a = 0; a < n; a++) {
      shoveX[a] = 0;
      shoveY[a] = 0;
      if (target[a] === -1 || onFoot[a] === 0) continue;
      const column = Math.floor((ex[a] - fineMinX) / fineSize);
      const row = Math.floor((ey[a] - fineMinY) / fineSize);
      let sx = 0;
      let sy = 0;
      for (let r = Math.max(row - 1, 0); r <= Math.min(row + 1, fineRows - 1); r++) {
        for (let c = Math.max(column - 1, 0); c <= Math.min(column + 1, fineColumns - 1); c++) {
          for (let b = fineCells[r * fineColumns + c]; b !== -1; b = fineNext[b]) {
            if (b === a || target[a] === b || target[b] === a) continue;
            const dx = ex[a] - ex[b];
            const dy = ey[a] - ey[b];
            const squared = dx * dx + dy * dy;
            if (squared >= FIGHTER_ROOM * FIGHTER_ROOM) continue;
            const d = Math.sqrt(squared);
            if (d < 0.001) {
              // Standing on the same spot: the one with the lower number steps aside.
              if (a < b) sx += FIGHTER_ROOM / 2;
              continue;
            }
            const give = (FIGHTER_ROOM - d) / 2 / d;
            sx += dx * give;
            sy += dy * give;
          }
        }
      }
      const size = Math.hypot(sx, sy);
      if (size > FIGHTER_SHOVE) {
        sx *= FIGHTER_SHOVE / size;
        sy *= FIGHTER_SHOVE / size;
      }
      shoveX[a] = sx;
      shoveY[a] = sy;
    }
    for (let a = 0; a < n; a++) {
      const b = target[a];
      if (b === -1 || onFoot[a] === 0) continue;
      if (target[b] === a) {
        // A pair gives way as one: by what the two would give, on average.
        if (b < a) continue;
        const gx = (shoveX[a] + shoveX[b]) / 2;
        const gy = (shoveY[a] + shoveY[b]) / 2;
        ex[a] += gx;
        ey[a] += gy;
        ex[b] += gx;
        ey[b] += gy;
      } else {
        ex[a] += shoveX[a];
        ey[a] += shoveY[a];
      }
    }
  }

  /**
   * How a man of the press who would stand at field point (x, y) gives way
   * to the fighters (see PRESS_ROOM): written into `out`, field metres east
   * and north; zero when none is near. As the fighters stand at the last
   * update.
   */
  clear(x: number, y: number, out: { x: number; y: number }): void {
    out.x = 0;
    out.y = 0;
    if (this.fighters === 0) return;
    const { ex, ey, fineCells, fineNext, fineSize, fineColumns, fineRows, fineMinX, fineMinY } = this;
    const column = Math.floor((x - fineMinX) / fineSize);
    const row = Math.floor((y - fineMinY) / fineSize);
    if (column < -1 || row < -1 || column > fineColumns || row > fineRows) return;
    let sx = 0;
    let sy = 0;
    for (let r = Math.max(row - 1, 0); r <= Math.min(row + 1, fineRows - 1); r++) {
      for (let c = Math.max(column - 1, 0); c <= Math.min(column + 1, fineColumns - 1); c++) {
        for (let f = fineCells[r * fineColumns + c]; f !== -1; f = fineNext[f]) {
          const dx = x - ex[f];
          const dy = y - ey[f];
          const squared = dx * dx + dy * dy;
          if (squared >= PRESS_ROOM * PRESS_ROOM || squared < 1e-6) continue;
          const d = Math.sqrt(squared);
          const give = (PRESS_ROOM - d) / d;
          sx += dx * give;
          sy += dy * give;
        }
      }
    }
    const size = Math.hypot(sx, sy);
    if (size > PRESS_ROOM) {
      sx *= PRESS_ROOM / size;
      sy *= PRESS_ROOM / size;
    }
    out.x = sx;
    out.y = sy;
  }
}
