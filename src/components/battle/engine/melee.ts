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

import { STRIKE_PERIOD, type UnitTrack } from "./timeline";

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

export interface MeleeUnit {
  track: UnitTrack;
  /** Units with different numbers are enemies. */
  side: number;
  /** How far the weapon reaches in front of a figure when its blow lands, field metres. */
  reach: number;
  /** How far the figure itself (its shield, its horse) reaches in front of where it stands, field metres. */
  front: number;
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

  // The men at the head of a file this frame, one entry each.
  private capacity = 0;
  private unitOf = new Int16Array(0);
  private indexOf = new Int32Array(0);
  /** Where each stands in his formation. */
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  /** The place of each in the front rank (see the note on top). */
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
  /** How many men picked each as their enemy. */
  private picked = new Int32Array(0);
  private cells = new Int32Array(0);

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
  }

  /**
   * Pairs the figures off as the tracks stand: call after every track was
   * sampled at the same battle time, `now` in seconds of playback.
   */
  update(now: number): void {
    const { units, figures } = this;

    // Forget the pairs of the last update.
    let heads = 0;
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
      const { track } = units[u];
      if (!track.fighting) continue;
      for (let i = 0; i < track.count; i++) heads += track.head[i];
      longest = Math.max(longest, units[u].reach * (1 + GUARD), 2 * units[u].front);
    }
    if (heads === 0) return;
    this.reserve(heads);
    const { unitOf, indexOf, px, py, nx, ny, sin, cos, target, distance, ex, ey, own, next, left, right, picked } = this;

    let n = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let u = 0; u < units.length; u++) {
      const { track } = units[u];
      if (!track.fighting) continue;
      for (let i = 0; i < track.count; i++) {
        if (track.head[i] === 0) continue;
        unitOf[n] = u;
        indexOf[n] = i;
        px[n] = track.x[i];
        py[n] = track.y[i];
        nx[n] = track.frontX[i];
        ny[n] = track.frontY[i];
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
    const range = longest + 2 * MAX_STEP;
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

    // Each man picks the nearest enemy in front of him who also has him in front.
    for (let a = 0; a < n; a++) {
      const unit = units[unitOf[a]];
      const column = Math.floor((nx[a] - minX) / cell);
      const row = Math.floor((ny[a] - minY) / cell);
      let best = -1;
      let bestSquared = Infinity;
      for (let r = Math.max(row - 1, 0); r <= Math.min(row + 1, rows - 1); r++) {
        for (let c = Math.max(column - 1, 0); c <= Math.min(column + 1, columns - 1); c++) {
          for (let b = cells[r * columns + c]; b !== -1; b = next[b]) {
            const other = units[unitOf[b]];
            if (other.side === unit.side) continue;
            const dx = nx[b] - nx[a];
            const dy = ny[b] - ny[a];
            const squared = dx * dx + dy * dy;
            if (squared >= bestSquared) continue;
            const apart = this.strikingDistance(unit, other);
            const reach = apart + 2 * MAX_STEP;
            if (squared > reach * reach) continue;
            // As they stand, the two can step up to where a blow lands.
            const sx = px[b] - px[a];
            const sy = py[b] - py[a];
            const meet = apart * REACH_SLACK + 2 * MAX_STEP;
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

    // A man about to fall whom nobody picked: the enemy he picked turns on
    // him (unless that enemy is busy with another man about to fall), so
    // somebody strikes the blow that fells him.
    const fallsSoon = (a: number) => {
      const left = units[unitOf[a]].track.deathSeconds[indexOf[a]] - now;
      return left > 0 && left <= STRIKE_PERIOD;
    };
    picked.fill(0, 0, n);
    for (let a = 0; a < n; a++) if (target[a] !== -1) picked[target[a]]++;
    for (let a = 0; a < n; a++) {
      const b = target[a];
      if (b === -1 || picked[a] > 0 || !fallsSoon(a)) continue;
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
      const d = Math.hypot(dx, dy);
      if (d > MAX_STEP) {
        dx *= MAX_STEP / d;
        dy *= MAX_STEP / d;
      }
      ex[a] = px[a] + dx;
      ey[a] = py[a] + dy;
    }

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
      const reaches = dx * dx + dy * dy <= apart * apart * REACH_SLACK * REACH_SLACK;
      out.engaged = true;
      out.offsetX[i] = ex[a] - px[a];
      out.offsetY[i] = ey[a] - py[a];
      out.bearing[i] = Math.atan2(dx, dy);
      out.opponent[i] = (unitOf[b] << 16) | indexOf[b];
      out.beat[i] = reaches ? own[b] : -1;
      out.kill[i] = fallsSoon(b) ? 1 : 0;
    }
  }
}
