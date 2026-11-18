/**
 * Hand-to-hand fighting: the clip on top of each figure. Pure data, no
 * three.js.
 *
 * A figure that fights hand to hand strikes blows of its own (the attack
 * clip) and takes the blows of its enemies (the clips block and hit). Every
 * frame, after melee.ts has paired the figures off:
 *
 * - First the blows struck. A blow is timed by the battle clock: the attack
 *   clip plays once every STRIKE_PERIOD, placed so that the blow lands on
 *   the beat of the enemy (swingBeat in melee.ts). A figure with a blow
 *   under way tells the man it is aimed at, until the blow lands. After a
 *   jump it tells him of a blow that has landed too, as long as its clip
 *   plays: the man struck is then in the middle of the blow he takes, as
 *   the man who strikes is in the middle of his.
 * - Then the blows taken. A figure told of a blow plays block or hit once,
 *   started REACTION_IMPACT before the blow lands: it answers the blow its
 *   enemy really strikes, so no shield goes up at a blow that never comes.
 *   One blow in HIT_SHARE gets through (hit), and so does the blow that
 *   fells the man; the others he takes on the shield (block). Which, is
 *   fixed per figure and blow. A model without the clips takes blows
 *   without moving.
 * - One clip at a time, and none cut short: a figure in a blow of its own
 *   takes none, nor does one whose next blow would begin before the clip
 *   ends; and a blow of its own waits until the blow it takes has played out
 *   but for REACT_TAIL seconds. Two men who fight each other take turns
 *   (melee.ts), so this matters when enemies or beats change. Only the blow
 *   that fells the enemy does not wait.
 *
 * A blow or a clip under way is played to its end even if the enemy has
 * fallen or the unit has stopped fighting; a unit that fights at a distance
 * (skirmish) drops them at once, and takes no blow while it throws.
 */

import { REACTION_IMPACT } from "@/lib/battle";
import { type MeleeFigures, swingBeat, swingInto } from "./melee";
import { ALIVE, STRIKE_PERIOD, type UnitTrack } from "./timeline";

const HIT_SHARE = 0.3;
const REACT_TAIL = 0.1;
/** A blow he takes may end this long after his own next blow begins, seconds: both fade. */
const REACT_OVERLAP = 0.05;

export interface BlowUnit {
  track: UnitTrack;
  /** The attack clip of the unit's model: its length, and how far in its blow lands, seconds. */
  seconds: number;
  impact: number;
  /** Its clips block and hit: their lengths in seconds, 0 for a model without. */
  block: number;
  hit: number;
}

/** The clips on top of the figures of a unit; one entry per figure of its track. */
export interface BlowFigures {
  /** The attack clip as the figures play it: its length, and how far in its blow lands, seconds. */
  seconds: number;
  impact: number;
  /** The length of the blow a figure takes (block, hit), seconds; 0 for a model without the clips. */
  reaction: number;
  /** The beat of the blow each figure is striking, or -1 between blows. */
  swing: Float32Array;
  /** When that blow began, seconds of playback (-Infinity after a jump): it fades in from there. */
  swingFrom: Float32Array;
  /** The same for the blow each figure is taking. */
  react: Float32Array;
  reactFrom: Float32Array;
  /** 1 when the blow a figure is taking gets through (hit), 0 when he meets it (block). Not kept up between blows. */
  through: Uint8Array;
}

export class Blows {
  readonly figures: BlowFigures[];
  private readonly units: BlowUnit[];
  /** The enemy the blow under way was aimed at when it began (see MeleeFigures.opponent), or -1. */
  private readonly aim: Int32Array[];
  /** The beat of the blow an enemy has under way on each figure and that has yet to land, or -1. */
  private readonly coming: Float32Array[];

  constructor(units: BlowUnit[]) {
    this.units = units;
    this.figures = units.map(({ track, seconds, impact, block, hit }) => {
      const length = Math.min(seconds, STRIKE_PERIOD * 0.8);
      return {
        seconds: length,
        impact: Math.min(impact, length),
        reaction: Math.max(block, hit),
        swing: new Float32Array(track.count).fill(-1),
        swingFrom: new Float32Array(track.count).fill(-Infinity),
        react: new Float32Array(track.count).fill(-1),
        reactFrom: new Float32Array(track.count).fill(-Infinity),
        through: new Uint8Array(track.count),
      };
    });
    this.aim = units.map(({ track }) => new Int32Array(track.count).fill(-1));
    this.coming = units.map(({ track }) => new Float32Array(track.count).fill(-1));
  }

  /**
   * Moves every figure's clips on to `clock`, seconds of playback: call
   * after the tracks were sampled at `time` and the figures paired off.
   * `fights[u]` is what the fight asks of unit u (Melee.figures, in the same
   * order as the units given here). After a jump (`snap`) every figure is at
   * once in whatever clip the clock has it in.
   */
  update(fights: readonly MeleeFigures[], time: number, clock: number, snap: boolean): void {
    const { units, figures, aim, coming } = this;
    for (const blows of coming) blows.fill(-1);

    // The blows struck.
    for (let u = 0; u < units.length; u++) {
      const { track } = units[u];
      const { seconds, impact, reaction, swing, swingFrom, react } = figures[u];
      const throwing = track.actionAt(time) === "skirmish";
      const fight = track.fighting ? fights[u] : null;
      const target = aim[u];
      for (let i = 0; i < track.count; i++) {
        if (throwing || track.status[i] !== ALIVE) {
          swing[i] = -1;
          react[i] = -1;
          continue;
        }
        const opponent = fight !== null ? fight.opponent[i] : -1;
        const engaged = fight !== null && opponent !== -1;
        const kill = engaged && fight.kill[i] === 1;
        // A blow of his own waits until the blow he takes has played out.
        const taking =
          !snap && !kill && react[i] >= 0 && reaction - swingInto(react[i], clock, REACTION_IMPACT) > REACT_TAIL;
        const beat = swingBeat(swing[i], engaged && !taking ? fight.beat[i] : -1, kill, snap, clock, seconds, impact);
        if (beat !== swing[i] || snap) {
          swing[i] = beat;
          swingFrom[i] = snap ? -Infinity : clock;
          target[i] = opponent;
        }
        if (beat < 0) continue;
        react[i] = -1;
        const enemy = target[i];
        // Only after a jump a blow that has landed: playing on, it could hide the next blow of another man.
        if (enemy !== -1 && (snap || swingInto(beat, clock, impact) <= impact)) coming[enemy >> 16][enemy & 0xffff] = beat;
      }
    }

    // The blows taken.
    for (let u = 0; u < units.length; u++) {
      const { track, block, hit } = units[u];
      const { impact, reaction, swing, react, reactFrom, through } = figures[u];
      // The men who throw take no blow, not even one begun before they fell back to throw.
      if (reaction <= 0 || track.actionAt(time) === "skirmish") continue;
      const fight = track.fighting ? fights[u] : null;
      const blows = coming[u];
      for (let i = 0; i < track.count; i++) {
        // In a blow of his own he takes none (and the fallen: cleared above).
        if (swing[i] >= 0 || track.status[i] !== ALIVE) continue;
        let incoming = blows[i];
        const own = fight !== null && fight.opponent[i] !== -1 ? fight.beat[i] : -1;
        if (incoming >= 0 && own >= 0) {
          // Not one that his own next blow would cut short.
          const next = (STRIKE_PERIOD - swingInto(own, clock, impact)) % STRIKE_PERIOD;
          if (next < reaction - swingInto(incoming, clock, REACTION_IMPACT) - REACT_OVERLAP) incoming = -1;
        }
        const taken = swingBeat(react[i], incoming, false, snap, clock, reaction, REACTION_IMPACT);
        if (taken !== react[i]) {
          react[i] = taken;
          reactFrom[i] = snap ? -Infinity : clock;
        }
        if (taken < 0) continue;
        // The blow that fells him gets through; of the others, one in HIT_SHARE.
        const fatal = track.deathSeconds[i] - clock <= REACTION_IMPACT + 0.05;
        const blow = Math.floor((clock - taken + REACTION_IMPACT) / STRIKE_PERIOD);
        const chance = (track.seed[i] * 97.3 + blow * 0.618034) % 1;
        through[i] = hit > 0 && (fatal || chance < HIT_SHARE || block === 0) ? 1 : 0;
      }
    }
  }
}
