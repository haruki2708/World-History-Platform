/**
 * The troops on the field. Each battle unit is a UnitBlock; its figures are
 * split into chunks of neighbouring files, each with its own bounds for
 * culling. Every figure is drawn at its own level of detail: a chunk draws
 * its figures with one instanced draw call per level in use.
 */

import {
  BufferAttribute,
  BufferGeometry,
  type Camera,
  Color,
  CustomBlending,
  DynamicDrawUsage,
  Frustum,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OneMinusSrcAlphaFactor,
  Sphere,
  SrcAlphaFactor,
  Vector3,
} from "three";
import { lookChoices } from "./figures/looks";
import type { FigureMaterials } from "./figures/material";
import { CLIP_INDEX, type UnitModel } from "./figures/model";
import { type BlowFigures, Blows } from "./blows";
import { Melee, type MeleeFigures, swingInto } from "./melee";
import { type MissileKind, Missiles } from "./missiles";
import type { Occluder } from "./occlusion";
import { blankRiding, type Ride, type Riding } from "./overrun";
import type { HeightAt } from "./terrain";
import { DYING, GONE, type UnitTrack } from "./timeline";
import { KNOCKDOWN_SECONDS, LOOK_VARIANT_STEP, REACTION_IMPACT, RIDEDOWN_IMPACT } from "@/lib/battle";

/**
 * Figures are drawn larger than life: one figure stands for twenty men, and
 * at true size a block seen from across the field would be a few faint dots.
 */
export const FIGURE_SCALE = 3;

/** Most figures in one chunk (one draw call). */
const CHUNK_SIZE = 256;
/** Seconds to blend from one clip to the next. */
const BLEND_SECONDS = 0.35;

/**
 * Draw order among the opaque objects: the ground (0), then what is painted
 * on it (the tinted patch under each block, the movement arrows), then the
 * figures. The paint writes no depth, so the figures drawn after it always
 * cover it, feet included.
 */
export const FOOTPRINT_ORDER = 1;
export const ARROW_ORDER = 2;
const FIGURE_ORDER = 3;

/**
 * The layer of the meshes that only cast shadows: the camera of the shadow
 * map sees it (the engine enables it there), the camera of the view does not.
 */
export const SHADOW_LAYER = 1;

/**
 * What the legs do follows how fast a block really moves over the ground,
 * not the action in the data: a block that stands still idles whatever its
 * orders, and one that moves walks or runs.
 *
 * Speeds are metres of field per second of real time, as seen on screen.
 * They are compared with the natural speeds of the clips of the model at the
 * size figures are drawn. For the shared animation library at FIGURE_SCALE 3
 * that is 3.0 m/s for walk and 17.7 m/s for run (its run clip is a sprint).
 *
 * - Below MOVE_STOP of the walking speed a block idles; it starts to walk
 *   above MOVE_START (0.18 and 0.36 m/s).
 * - The gaits of a model, slowest first, are walk, jog (when the model has
 *   one) and run. One turns into the next where both clips are stretched by
 *   the same factor, the geometric mean of their speeds (walk to run without
 *   a jog: 7.2 m/s), with GAIT_SLACK either way so a block on a threshold
 *   does not flicker (run above 8.0 m/s, walk again below 6.5 m/s).
 * - The clips play at the speed that matches the ground covered, up to
 *   MAX_RATE times their own (walk 8.9 m/s, run 26.6 m/s); the run of men
 *   on foot up to RUN_RATE_FOOT (38.6 m/s). A battle is shown many times
 *   faster than it was fought, so blocks can move faster than that; the
 *   legs then keep the fastest pace that still looks like running, and the
 *   feet slide.
 */
const MOVE_START = 0.12;
const MOVE_STOP = 0.06;
const GAIT_SLACK = 0.1;
/** Seconds over which the measured speed of a block is smoothed. */
const SPEED_SMOOTHING = 0.12;
/**
 * The battle clock running more than this many times faster than normal
 * playback is a jump (a click on the seek bar, a drag), not a march: the
 * figures move without stepping.
 */
const MAX_PLAYBACK_RATE = 5;
/** A frame longer than this, seconds, is a pause (a hidden tab), not a step. */
const MAX_STEP_SECONDS = 1;

const IDLE = CLIP_INDEX.idle;
const WALK = CLIP_INDEX.walk;
const RUN = CLIP_INDEX.run;
const JOG = CLIP_INDEX.jog;
const ATTACK = CLIP_INDEX.attack;
const DIE = CLIP_INDEX.die;

/**
 * How many times faster than its own speed each gait may play.
 *
 * The jog may play fast enough to reach the next gait: a gait gives way to
 * the next at the geometric mean of their speeds, plus GAIT_SLACK. The horse
 * gallops 5.8 times as fast as it trots (T-030), so its trot plays up to
 * 2.65 times before the gallop takes over (cavalry: 6.6 m/s trotting, gallop
 * above 17.4 m/s); a lower cap here made the hooves slide in between. On
 * foot the jog gives way to the run at 1.6 times its speed, well below
 * this cap.
 */
const MAX_RATE: Record<number, number> = { [WALK]: 3, [JOG]: 2.7, [RUN]: 1.5 };
/**
 * Men on foot may run faster than that (batch L, B2; the user chose it with
 * longer phases in the data, 2026-11-20): at 2.2 times its own speed the run
 * clip (a sprint) takes about 4.7 steps a second, near the cadence of a
 * sprinter. With the longer phases the feet slide in 1-3% of the time on
 * the move, against 20-29% before (main-tools/gait/slide.mjs). The gallop
 * stays at MAX_RATE: a horse already strides faster there than any horse
 * does.
 */
const RUN_RATE_FOOT = 2.2;

/**
 * Marching askew. The clips step straight ahead (or straight back), never
 * sideways, so a figure that faces one way and goes another slides its
 * planted foot. When a block that is not fighting moves well off the way it
 * faces, each figure turns towards where it goes, and turns back to the
 * facing of the block when the block stops or starts to fight.
 *
 * - The angle is taken per figure, between the facing the formation gives it
 *   and its own direction over the ground (smoothed over VELOCITY_SMOOTHING),
 *   so the ends of a wheeling block turn each by their own amount.
 * - Off by less than TURN_FROM (35°) a figure keeps the facing of the block;
 *   from TURN_FULL (55°) it faces the way it goes; in between it turns part
 *   of the way, so nothing snaps when the angle passes the threshold (45°).
 * - Going more back than forward, a figure steps back facing the enemy as
 *   before and turns only to step straight back: off by 120° it turns 60°,
 *   not 120°. Forward and back trade places past 90° ± BACK_SLACK, so a
 *   figure moving straight sideways does not flip between the two.
 * - Turning is at most TURN_RATE (about a quarter turn in half a second, as a
 *   man turns), in real time, whatever the playback speed. While the battle
 *   clock is paused the figures hold the way they face; after a jump (a seek)
 *   they stand facing their block.
 * - The figures that strike in a fight face the block. The others of a
 *   fighting block (the ranks waiting their turn) may turn towards where they
 *   go by at most WAITING_TURN (45°), so the press of a melee drifting
 *   sideways does not leave every rear rank walking crabwise. Set it to 0 to
 *   keep a whole fighting block facing the enemy.
 */
const TURN_FROM = (35 * Math.PI) / 180;
const TURN_FULL = (55 * Math.PI) / 180;
const BACK_SLACK = (12 * Math.PI) / 180;
const TURN_RATE = 3;
const WAITING_TURN = Math.PI / 4;
/** Seconds over which the direction of each figure over the ground is smoothed. */
const VELOCITY_SMOOTHING = 0.25;

/**
 * Hand to hand (melee.ts, and "Giáp lá cà" in docs/ARCHITECTURE.md). In a
 * unit whose action is `fight` only the men with an enemy in reach strike:
 * the heads of the files, paired off by melee.ts.
 *
 * - A figure with an enemy leaves its place in the formation for where
 *   melee.ts wants it, and goes back when the enemy is gone, at CLOSE_SPEED
 *   in real time. After a jump it stands there at once.
 * - It turns to face its enemy, at most FIGHT_TURN from the facing of its
 *   block (FIGHT_TURN_FOOT on foot, where the melee turns pairs every way),
 *   at TURN_RATE like any other turn.
 * - Its blows are timed by the battle clock, not by the wall clock: the
 *   attack clip plays once every STRIKE_PERIOD seconds of playback, placed so
 *   that the blow lands on the beat of the enemy (the moment he falls, if he
 *   does), and the figure stands on guard in between. A blow that has begun
 *   is played to its end even if the enemy has fallen meanwhile; a new one
 *   begins only at the start of the clip, so nothing pops. Only the blow
 *   that fells the enemy may begin late and cut another short (swingBeat in
 *   melee.ts).
 * - A figure an enemy strikes at takes the blow: the clip block or hit
 *   plays once, as the blow lands. Which clip is on top of a figure, its
 *   own blow or the blow it takes, is worked out in blows.ts.
 * - The clip on top fades in over STRIKE_IN and out over STRIKE_OUT seconds
 *   on top of what the legs do.
 * - A figure that falls lies where it fought: it keeps the place it had left
 *   its file for. After a jump, where a man stood to fight is not known
 *   without playing up to it: the fallen of a fight on foot lie scattered
 *   about their places in the files, up to SCATTER metres forward or back
 *   and half that to the side; the others lie in their files.
 * - In a block that stands still, a figure that moves (to close with an
 *   enemy, to step up behind a man who fell) walks: between STEP_FROM and
 *   STEP_FULL times the walking speed its legs go from idle to the walk.
 * - The men at the head of the files put away what their model stows to
 *   fight (UnitModel.stow: the spare javelins of a hastatus), over
 *   STOW_SECONDS of real time, and take it up again when the unit stops
 *   fighting or they are no longer at the head of a file. The clips of the
 *   fight scale it away themselves; without this it would come and go with
 *   every blow.
 */
const CLOSE_SPEED = 6;
const FIGHT_TURN = (80 * Math.PI) / 180;
const FIGHT_TURN_FOOT = (135 * Math.PI) / 180;
const SCATTER = 4;
const STRIKE_IN = 0.15;
const STRIKE_OUT = 0.25;
const STEP_FROM = 0.12;
const STEP_FULL = 0.45;
const STOW_SECONDS = 0.3;
const BLOCK = CLIP_INDEX.block;
const HIT = CLIP_INDEX.hit;

/**
 * Horsemen riding through foot (overrun.ts, and "Kỵ binh xông qua" in
 * docs/ARCHITECTURE.md).
 *
 * - A rider on his loop is drawn where overrun.ts has him, facing the way
 *   he rides: a function of the battle clock, with no easing, so nothing is
 *   left to catch up after a jump. His horse moves by the ground he covers:
 *   at the trot (jog) below where the trot gives way to the gallop, at the
 *   gallop above, fading from one to the other over RIDE_CHANGE either way;
 *   from a stand the legs fade in from idle up to RIDE_START of the walking
 *   speed.
 * - As he passes a man within reach (the blows overrun.ts lists for him), he
 *   strikes: the clip ridedown, or attack on a model without it, played once
 *   so that the blow lands as he passes, on the rider alone: his horse keeps
 *   its gallop (the 2 added to the second number of iStrike; material.ts).
 * - A rider who falls on his loop lies where he was on it.
 * - A man on foot a horse runs into is bowled over: the clip knockdown, on
 *   top of whatever he was doing, begun REACTION_IMPACT before the horse
 *   reaches him. He turns to face the horse as it comes (KNOCK_TURN, radians
 *   a second: quicker than a man turns at leisure), since the clip throws
 *   him on his back. A model without the clip falls as in die, lies
 *   FALLEN_LIES seconds and gets up the way he fell, the clip played
 *   backwards (begun FALL_LEAD before the horse reaches him); one without
 *   die either flinches (hit).
 * - A man a rider strikes at in passing flinches (hit).
 */
const RIDE_START = 0.5;
const RIDE_CHANGE = 0.12;
const KNOCK_TURN = 14;
const FALLEN_LIES = 0.9;
const FALL_LEAD = 0.1;
/** Getting up takes this share of the time falling took. */
const RISE_SHARE = 0.8;
const KNOCKDOWN = CLIP_INDEX.knockdown;
const RIDEDOWN = CLIP_INDEX.ridedown;

/**
 * The press behind the front rank ("Hỗn chiến" in docs/ARCHITECTURE.md). In
 * a unit that fights hand to hand, the men who have no enemy of their own do
 * not stand in their files like men on parade:
 *
 * - Each sways about his place, up to PRESS_SHARE of the room a man has in
 *   the block (PRESS_MAX metres at most), and turns as he does, up to
 *   PRESS_TURN: most in the ranks next to the front (PRESS_RANKS, by the men
 *   who stand before him in his file), less further back.
 * - Now and then (every PRESS_PERIOD to PRESS_PERIOD + PRESS_PERIOD_SPAN
 *   seconds of playback) he thrusts past the man in front of him, or puts
 *   his shield up: the attack and block clips, on top of what his legs do.
 *   From the fourth rank back a thrust is a javelin thrown over the heads of
 *   the ranks in front (PRESS_THROWS of his turns; foot only).
 *
 * - On foot (batch L, A4) the files loosen as well: each man stands up to
 *   LOOSE_SHARE of his room off his place, his own way (LOOSE_MAX metres at
 *   most), and keeps clear of the fighters, who no longer stand in a line
 *   (Melee.clear in melee.ts).
 *
 * All of it follows from the battle clock and the figure's fixed random
 * number, so a seek shows what playing up to that moment shows. It is drawn
 * to look like a fight, not taken from a source.
 */
const PRESS_SHARE = 0.3;
const PRESS_MAX = 2.4;
const PRESS_TURN = 0.55;
const PRESS_RANKS = [0.5, 1, 1, 0.85, 0.7, 0.55, 0.45, 0.4];
const PRESS_PERIOD = 5;
const LOOSE_SHARE = 0.4;
const LOOSE_MAX = 2.6;
const PRESS_PERIOD_SPAN = 6;
/**
 * Of his turns, how many a man spends on a thrust, by the men before him: the
 * head of a file without an enemy in reach does not strike at the air.
 */
const PRESS_THRUSTS = [0, 0.5, 0.35];
const PRESS_THROWS = 0.22;
const PRESS_GUARDS = 0.2;
/** From this many men before him, his thrust is a throw. */
const THROW_FROM = 3;

/**
 * Missiles (missiles.ts). A javelin or a stone leaves the hand as the blow
 * of the attack clip lands, and flies at this speed, metres a second as
 * drawn, to a point in the enemy: for a unit that fights at a distance, as
 * far as the nearest enemy before it (Crowd.aim), between RANGE_MIN and
 * RANGE_MAX; over the front rank of a fight hand to hand, a little beyond
 * that rank. Every throw goes a little wide and long or short.
 */
const MISSILE_SPEED: Record<MissileKind, number> = { javelin: 46, stone: 70 };
const LOB_SPEED = 30;
const RANGE_MIN = 25;
const RANGE_MAX = 110;
const RANGE_DEFAULT = 60;
/** Where it leaves the hand, and where it comes down, as shares of the figure's height. */
const HAND_HEIGHT = 0.95;
const LAND_HEIGHT = 0.3;

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

/** One gait of a model: its clip and its natural ground speed (m/s, as drawn). */
interface Gait {
  clip: number;
  speed: number;
}

export interface LodSettings {
  /** A figure taller than this on screen (CSS pixels) gets LOD0. */
  lod0Pixels: number;
  /** A figure taller than this gets LOD1; smaller ones LOD2. */
  lod1Pixels: number;
  /** Most triangles of figures in view, before the farthest figures are coarsened. */
  triangleBudget: number;
  shadows: boolean;
  /**
   * How many of the finest levels use the detailed material (normal and
   * roughness-metalness maps) when the model has one: 0 for none.
   */
  detailedLods: number;
}

export interface CrowdCounts {
  /** Figures still standing, in the whole battle. */
  standing: number;
  /** Figures sent to the graphics card this frame (standing or fallen, in view). */
  drawn: number;
  /** Figures in view per level of detail. */
  lods: number[];
}

/** Numbers per figure in iStrike (Chunk.strike): the blow, the stowing, the looks (two). */
const STRIKE = 4;

/** What the depth pass of the shadows reads from a figure mesh (see material.ts). */
const DEPTH_ATTRIBUTES = ["position", "aBoneIndex", "aBoneWeight", "aPart"] as const;
const PART = DEPTH_ATTRIBUTES.indexOf("aPart");
const depthGeometries = new WeakMap<BufferGeometry, BufferGeometry>();

/**
 * The mesh the shadow of a figure is drawn from: the same triangles, with
 * only what the depth pass reads, and every vertex that shares its position
 * and skin with another merged into one. The models split a vertex wherever
 * the texture coordinates of its faces differ, so most vertices of LOD1 and
 * LOD2 come three or four times over; the depth pass does not read texture
 * coordinates, so merged it draws the very same shadow, shading each point of
 * the mesh once instead of three or four times (T-031).
 */
function depthGeometry(base: BufferGeometry): BufferGeometry {
  const cached = depthGeometries.get(base);
  if (cached) return cached;
  const index = base.index;
  const attributes = DEPTH_ATTRIBUTES.map((name) => base.getAttribute(name) as BufferAttribute | undefined);
  if (!index || attributes.some((attribute) => !attribute || !(attribute instanceof BufferAttribute))) {
    depthGeometries.set(base, base);
    return base;
  }
  const sources = attributes as BufferAttribute[];
  const count = sources[0].count;
  const firstOf = new Map<string, number>();
  const merged = new Uint32Array(count);
  const kept: number[] = [];
  // Of a vertex's look (aPart.y) the depth pass needs only its variant shape (a beard it may gather into a
  // point, material.ts): the slots would keep apart vertices it can merge.
  const value = (a: number, v: number, c: number): number => {
    const x = sources[a].array[v * sources[a].itemSize + c];
    return a === PART && c === 1 ? Math.floor((x + 0.5) / LOOK_VARIANT_STEP) * LOOK_VARIANT_STEP : x;
  };
  for (let v = 0; v < count; v++) {
    let key = "";
    sources.forEach((source, a) => {
      for (let c = 0; c < source.itemSize; c++) key += `${value(a, v, c)},`;
    });
    let to = firstOf.get(key);
    if (to === undefined) {
      to = kept.length;
      firstOf.set(key, to);
      kept.push(v);
    }
    merged[v] = to;
  }
  const geometry = new BufferGeometry();
  DEPTH_ATTRIBUTES.forEach((name, a) => {
    const { itemSize, normalized } = sources[a];
    const out = new Float32Array(kept.length * itemSize);
    kept.forEach((v, i) => {
      for (let c = 0; c < itemSize; c++) out[i * itemSize + c] = value(a, v, c);
    });
    geometry.setAttribute(name, new BufferAttribute(out, itemSize, normalized));
  });
  const triangles = kept.length < 65536 ? new Uint16Array(index.count) : new Uint32Array(index.count);
  for (let i = 0; i < index.count; i++) triangles[i] = merged[index.getX(i)];
  geometry.setIndex(new BufferAttribute(triangles, 1));
  depthGeometries.set(base, geometry);
  return geometry;
}

/** Levels of detail of every figure model: LOD0, LOD1, LOD2 (UNIT_LODS). */
const LEVELS = 3;
/**
 * A figure keeps its level until its size on screen is this far past the
 * threshold, so one standing on a threshold does not flicker.
 */
const KEEP = 0.88;
/** Most the triangle budget may stretch the thresholds (Crowd.selectLods). */
const MAX_STRETCH = 64;
/**
 * Per frame, the share of the stretch kept once fewer triangles are in view.
 * It rises at once, so a crowd coming into view never overruns the budget,
 * and eases back over a fraction of a second, so men do not flicker between
 * levels as the crowd in view changes.
 */
const STRETCH_EASE = 0.97;
/**
 * The stretch eases back only while the triangles at the eased stretch stay
 * this far under the budget. Without the room, the men it brings up a level
 * put the count back over the budget, the stretch jumps, and men near a
 * threshold flick back and forth (48 times in 8 s of Cannae playing, B4).
 */
const EASE_ROOM = 0.95;

/**
 * The figures of a chunk drawn at one level of detail this frame: their own
 * instance buffers, filled from the chunk's every frame (Chunk.sort), a mesh
 * for the view and one for the shadow map.
 */
class Level {
  readonly posYaw: InstancedBufferAttribute;
  readonly anim: InstancedBufferAttribute;
  readonly seed: InstancedBufferAttribute;
  readonly strike: InstancedBufferAttribute;
  readonly geometry: InstancedBufferGeometry;
  readonly mesh: Mesh;
  readonly shadowMesh: Mesh;
  count = 0;

  constructor(capacity: number, display: BufferGeometry, shadow: BufferGeometry, sphere: Sphere, materials: FigureMaterials) {
    this.posYaw = new InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    this.anim = new InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    this.seed = new InstancedBufferAttribute(new Float32Array(capacity), 1);
    this.strike = new InstancedBufferAttribute(new Float32Array(capacity * STRIKE), STRIKE);
    for (const attribute of this.attributes) attribute.setUsage(DynamicDrawUsage);
    const instanced = (base: BufferGeometry) => {
      const geometry = new InstancedBufferGeometry();
      geometry.setIndex(base.index);
      for (const [name, attribute] of Object.entries(base.attributes)) {
        geometry.setAttribute(name, attribute);
      }
      geometry.setAttribute("iPosYaw", this.posYaw);
      geometry.setAttribute("iAnim", this.anim);
      geometry.setAttribute("iSeed", this.seed);
      geometry.setAttribute("iStrike", this.strike);
      geometry.boundingSphere = sphere;
      geometry.instanceCount = 0;
      return geometry;
    };
    this.geometry = instanced(display);
    this.mesh = new Mesh(this.geometry, materials.material);
    this.mesh.receiveShadow = true;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.renderOrder = FIGURE_ORDER;
    this.mesh.visible = false;

    // Shadows come from a coarser mesh than the one on screen. This second
    // mesh stands on SHADOW_LAYER, which only the camera of the shadow map
    // sees, so the main pass does not even set it up; it gets its instances
    // only while the shadow map is drawn.
    this.shadowMesh = new Mesh(instanced(shadow), materials.material);
    this.shadowMesh.layers.set(SHADOW_LAYER);
    this.shadowMesh.customDepthMaterial = materials.depthMaterial;
    this.shadowMesh.castShadow = true;
    this.shadowMesh.matrixAutoUpdate = false;
    this.shadowMesh.visible = false;
    this.shadowMesh.onBeforeShadow = (_renderer, _scene, _camera, _shadowCamera, geometry) => {
      (geometry as InstancedBufferGeometry).instanceCount = this.count;
    };
    this.shadowMesh.onAfterShadow = (_renderer, _scene, _camera, _shadowCamera, geometry) => {
      (geometry as InstancedBufferGeometry).instanceCount = 0;
    };
  }

  get attributes(): InstancedBufferAttribute[] {
    return [this.posYaw, this.anim, this.seed, this.strike];
  }

  /** Draws the first `count` figures of the buffers, sending them to the graphics card. */
  commit(count: number, shadows: boolean): void {
    this.count = count;
    this.geometry.instanceCount = count;
    this.mesh.visible = count > 0;
    this.shadowMesh.visible = shadows && count > 0;
    if (count === 0) return;
    for (const attribute of this.attributes) {
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, count * attribute.itemSize);
      attribute.needsUpdate = true;
    }
  }

  dispose(): void {
    this.geometry.dispose();
    this.shadowMesh.geometry.dispose();
  }
}

/**
 * Up to CHUNK_SIZE figures of a block, with one set of bounds for culling.
 * Each figure is drawn at its own level of detail: every frame the figures
 * drawn are written here in turn (UnitBlock.update), then sorted into the
 * buffers of their levels (sort). A man at the camera's feet is then drawn
 * in full while the far end of his file, a few hundred metres off, is not.
 * When the whole chunk had one level, one near man put all of it at LOD0,
 * and the triangle budget then took LOD0 from every chunk in view (B4).
 */
class Chunk {
  // Per figure drawn, in the order written: what the figure shader reads (material.ts).
  readonly posYaw: Float32Array;
  readonly anim: Float32Array;
  readonly seed: Float32Array;
  /**
   * Per figure: seconds into its blow (-1: none); how far it has put away
   * what it stows to fight; and its looks, drawn once (figures/looks.ts,
   * lookChoices; 0 for a model without looks). One attribute: each is a
   * stream the graphics card fetches on its own (T-061).
   */
  readonly strike: Float32Array;
  /** Per figure drawn: which figure of the chunk it is, 0 to count - 1. */
  readonly slot: Uint16Array;
  /** Per figure drawn: how tall it stands on screen this frame, CSS pixels. */
  readonly pixels: Float32Array;
  /** Per figure of the chunk (by slot): the level it was last drawn at, for KEEP. */
  readonly level: Uint8Array;
  readonly sphere = new Sphere();
  readonly levels: Level[];
  private readonly fill = [0, 0, 0];
  /** Scratch of `sort`: the level of each figure drawn, in the order written. */
  private readonly order: Uint8Array;
  drawn = 0;
  /** From the camera to the nearest figure drawn, metres. */
  distance = 0;
  /** How tall the nearest figure drawn stands on screen, CSS pixels. */
  nearest = 0;
  inView = false;

  constructor(
    readonly first: number,
    readonly count: number,
    readonly model: UnitModel,
    readonly materials: FigureMaterials,
  ) {
    this.posYaw = new Float32Array(count * 4);
    this.anim = new Float32Array(count * 4);
    this.seed = new Float32Array(count);
    this.strike = new Float32Array(count * STRIKE);
    for (let k = 0; k < count; k++) this.strike[k * STRIKE] = -1;
    this.slot = new Uint16Array(count);
    this.pixels = new Float32Array(count);
    this.level = new Uint8Array(count).fill(LEVELS - 1);
    this.order = new Uint8Array(count);
    // The men drawn at LOD0 cast their shadows from LOD1, the rest from LOD2.
    this.levels = model.lods.map(
      (lod, l) =>
        new Level(count, lod.geometry, depthGeometry(model.lods[l === 0 ? 1 : 2].geometry), this.sphere, materials),
    );
  }

  /** The meshes to add to the scene. */
  get meshes(): Mesh[] {
    return this.levels.flatMap((level) => [level.mesh, level.shadowMesh]);
  }

  /**
   * Measures every figure drawn: how tall it stands on screen (`pixels`; `size`
   * is what it covers at one metre from the camera) and how far off the
   * nearest one is (`distance`). The nearest figure, not the middle of the
   * chunk, which for a loose screen of skirmishers may lie half a kilometre
   * off while some of its men stand at the camera's feet.
   */
  measure(camera: Vector3, size: number): void {
    const { posYaw, pixels } = this;
    let nearest = Infinity;
    for (let k = 0; k < this.drawn; k++) {
      const o = k * 4;
      const dx = posYaw[o] - camera.x;
      const dy = posYaw[o + 1] - camera.y;
      const dz = posYaw[o + 2] - camera.z;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 1);
      pixels[k] = size / d;
      if (d < nearest) nearest = d;
    }
    this.distance = nearest;
    this.nearest = size / nearest;
  }

  /**
   * True when every figure drawn is at LOD2 for these thresholds, whatever
   * level it had: even the nearest is below the LOD1 threshold with KEEP.
   * Most chunks in a view of the whole field; they skip the figure by figure.
   */
  private allFar(lod1: number): boolean {
    return this.nearest <= lod1 * KEEP;
  }

  /** The level of figure `k` for the thresholds given (CSS pixels). */
  private levelOf(k: number, lod0: number, lod1: number): number {
    const pixels = this.pixels[k];
    const last = this.level[this.slot[k]];
    if (pixels > lod0 * (last === 0 ? KEEP : 1)) return 0;
    return pixels > lod1 * (last <= 1 ? KEEP : 1) ? 1 : 2;
  }

  /** Triangles of the figures drawn, at the levels the thresholds give them. */
  triangles(lod0: number, lod1: number): number {
    const lods = this.model.lods;
    const t0 = lods[0].triangles;
    const t1 = lods[1].triangles;
    const t2 = lods[2].triangles;
    if (this.allFar(lod1)) return this.drawn * t2;
    let total = 0;
    for (let k = 0; k < this.drawn; k++) {
      const l = this.levelOf(k, lod0, lod1);
      total += l === 0 ? t0 : l === 1 ? t1 : t2;
    }
    return total;
  }

  /**
   * Sorts the figures drawn into the buffers of their levels and draws them;
   * adds the figures in view at each level to `counts`. A chunk out of view
   * is only drawn into the shadow map, all of it at LOD2.
   */
  sort(lod0: number, lod1: number, settings: LodSettings, counts: number[]): void {
    const { posYaw, anim, seed, strike, slot, level, levels, fill, order, inView } = this;
    const drawn = this.drawn;
    fill[0] = 0;
    fill[1] = 0;
    fill[2] = 0;
    // The level of every figure drawn, or -1 when they differ.
    let all = LEVELS - 1;
    if (inView && this.allFar(lod1)) {
      level.fill(LEVELS - 1);
    } else if (inView) {
      for (let k = 0; k < drawn; k++) {
        const l = this.levelOf(k, lod0, lod1);
        level[slot[k]] = l;
        order[k] = l;
        if (k === 0) all = l;
        else if (l !== all) all = -1;
      }
    }
    if (all >= 0) {
      // One level for the whole chunk (most chunks, and all those out of view): copied in one go.
      const to = levels[all];
      (to.posYaw.array as Float32Array).set(posYaw.subarray(0, drawn * 4));
      (to.anim.array as Float32Array).set(anim.subarray(0, drawn * 4));
      (to.seed.array as Float32Array).set(seed.subarray(0, drawn));
      (to.strike.array as Float32Array).set(strike.subarray(0, drawn * STRIKE));
      fill[all] = drawn;
    }
    for (let k = 0; all < 0 && k < drawn; k++) {
      const l = order[k];
      const to = levels[l];
      const j = fill[l]++;
      const toPosYaw = to.posYaw.array as Float32Array;
      const toAnim = to.anim.array as Float32Array;
      const toStrike = to.strike.array as Float32Array;
      const a = k * 4;
      const b = j * 4;
      toPosYaw[b] = posYaw[a];
      toPosYaw[b + 1] = posYaw[a + 1];
      toPosYaw[b + 2] = posYaw[a + 2];
      toPosYaw[b + 3] = posYaw[a + 3];
      toAnim[b] = anim[a];
      toAnim[b + 1] = anim[a + 1];
      toAnim[b + 2] = anim[a + 2];
      toAnim[b + 3] = anim[a + 3];
      (to.seed.array as Float32Array)[j] = seed[k];
      const s = k * STRIKE;
      const t = j * STRIKE;
      for (let c = 0; c < STRIKE; c++) toStrike[t + c] = strike[s + c];
    }
    const { material, detailed } = this.materials;
    for (let l = 0; l < LEVELS; l++) {
      const to = levels[l];
      to.mesh.material = l < settings.detailedLods && detailed ? detailed : material;
      to.commit(fill[l], settings.shadows);
      if (inView) counts[l] += fill[l];
    }
  }

  dispose(): void {
    for (const level of this.levels) level.dispose();
  }
}

const FOOT_U = 24;
const FOOT_V = 2;

/** From angle a to angle b the shorter way round, in (-π, π]. */
function angleDelta(a: number, b: number): number {
  let delta = (b - a) % (2 * Math.PI);
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta <= -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * A figure going within TURN_FROM of straight ahead, or of straight back,
 * keeps the facing of its block. Tested on the cosine of the angle, so the
 * angle itself (an atan2) is needed only for the few figures in between.
 */
const COS_TURN_FROM_SQUARED = Math.cos(TURN_FROM) ** 2;

/**
 * How far a figure turns from the facing of its block, radians, when it goes
 * `motion` radians off it (see TURN_FROM). `back` is whether it steps back.
 */
function askewTurn(motion: number, back: boolean): number {
  const off = back ? angleDelta(Math.PI, motion) : motion;
  const size = Math.abs(off);
  if (size <= TURN_FROM) return 0;
  if (size >= TURN_FULL) return off;
  const k = (size - TURN_FROM) / (TURN_FULL - TURN_FROM);
  return off * k * k * (3 - 2 * k);
}

export class UnitBlock {
  readonly chunks: Chunk[] = [];
  /** A tinted patch of ground under the block, so it reads from far away. */
  readonly footprint: Mesh;
  standing = 0;

  private readonly footprintMaterial: MeshBasicMaterial;
  // Clips of the figures that act (the front ranks in a fight) and of those
  // that only keep their place, each blending from one clip to the next.
  private fromActing = IDLE;
  private toActing = IDLE;
  private fromRest = IDLE;
  private toRest = IDLE;
  private blendStart = -Infinity;
  /** IDLE, WALK, JOG or RUN: what the legs of the block do. */
  private gait = IDLE;
  private gaitList: Gait[] | null = null;
  /** Ground speed of the block, metres per second of real time, smoothed. */
  private speed = 0;
  /** Each figure's looks, packed (figures/looks.ts, lookChoices): two numbers a figure; null without looks. */
  private readonly looks: Float32Array | null;
  /** Where each figure stood in the last frame, to measure its step. */
  private readonly lastX: Float32Array;
  private readonly lastY: Float32Array;
  private placed = false;
  /** Ground each figure has covered on foot, metres: the phase of its stride. */
  private readonly walked: Float32Array;
  /** Velocity of each figure over the ground, m/s of real time, smoothed. */
  private readonly velocityX: Float32Array;
  private readonly velocityY: Float32Array;
  /** How far each figure has turned from the facing of its block (see TURN_FROM). */
  private readonly turn: Float32Array;
  /** 1 while a figure steps back, facing away from where it goes. */
  private readonly back: Uint8Array;
  /** Some figure is still turned away from its block's facing. */
  private turned = false;
  /** Where each figure last sampled the ground, and the height there: a figure that stays put need not sample again. */
  private readonly groundX: Float32Array;
  private readonly groundY: Float32Array;
  private readonly groundH: Float32Array;
  /** The formation the ground patch was last laid for (see updateFootprint). */
  private readonly footprintKey = new Float64Array(6).fill(NaN);
  private lastNow = NaN;
  private lastTime = NaN;
  private lastBlend = NaN;
  private readonly center = new Vector3();
  /** What the hand-to-hand fight asks of each figure (see CLOSE_SPEED); set by Crowd.engage. */
  fight: MeleeFigures | null = null;
  /** The blow each figure strikes or takes (blows.ts); set by Crowd.engage. */
  blows: BlowFigures | null = null;
  /** How far each figure stands from its place in the formation, field metres east and north. */
  private readonly offX: Float32Array;
  private readonly offY: Float32Array;
  /** How far each figure has put away what its model stows to fight, 0..1 (see STOW_SECONDS). */
  private readonly stowed: Float32Array;
  /** What the unit throws when it fights at a distance. */
  private readonly missile: MissileKind;
  /** Its rear ranks throw over the front of a fight hand to hand: foot who do not sling. */
  private readonly lobs: boolean;
  /** How far its missiles fly when it fights at a distance, metres; set by Crowd.aim. */
  range = RANGE_DEFAULT;
  /** The loops of its riders when it rides through the enemy (overrun.ts), or null: foot, and horse that never does. */
  ride: Ride | null = null;
  /** Horsemen: their fights hand to hand stay in lines (melee.ts). Set when the block is made. */
  mounted = false;
  /** Where the fighters stand, for the press to keep clear of them (Melee.clear); set by Crowd.engage. */
  clearance: Melee | null = null;
  /** Scratch of the press: how far a man gives way to the fighters. */
  private readonly giveWay = { x: 0, y: 0 };
  /** Scratch: where a rider is on his loop. */
  private readonly riding: Riding = blankRiding();
  /** Per figure that fell on its loop: 1 once where it lies has been worked out. */
  private readonly fell: Uint8Array;

  constructor(
    readonly track: UnitTrack,
    readonly model: UnitModel,
    materials: FigureMaterials,
    private readonly color: Color,
    group: Group,
    /** Blocks with different numbers are enemies. */
    readonly side = 0,
  ) {
    const slings = track.unit.type.includes("sling");
    this.missile = slings ? "stone" : "javelin";
    this.lobs = !slings && !track.unit.type.includes("cavalry");
    this.offX = new Float32Array(track.count);
    this.offY = new Float32Array(track.count);
    this.stowed = new Float32Array(track.count);
    this.fell = new Uint8Array(track.count);
    this.lastX = new Float32Array(track.count);
    this.lastY = new Float32Array(track.count);
    this.walked = new Float32Array(track.count);
    this.velocityX = new Float32Array(track.count);
    this.velocityY = new Float32Array(track.count);
    this.turn = new Float32Array(track.count);
    this.back = new Uint8Array(track.count);
    this.groundX = new Float32Array(track.count).fill(NaN);
    this.groundY = new Float32Array(track.count).fill(NaN);
    this.groundH = new Float32Array(track.count);
    const tables = model.looks;
    this.looks = tables ? new Float32Array(track.count * 2) : null;
    if (tables && this.looks) {
      for (let i = 0; i < track.count; i++) this.looks.set(lookChoices(tables, track.seed[i]), i * 2);
    }
    const chunkCount = Math.ceil(track.count / CHUNK_SIZE);
    for (let c = 0; c < chunkCount; c++) {
      const first = Math.floor((c * track.count) / chunkCount);
      const end = Math.floor(((c + 1) * track.count) / chunkCount);
      const chunk = new Chunk(first, end - first, model, materials);
      this.chunks.push(chunk);
      group.add(...chunk.meshes);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array((FOOT_U + 1) * (FOOT_V + 1) * 3), 3).setUsage(DynamicDrawUsage),
    );
    const index: number[] = [];
    for (let i = 0; i < FOOT_U; i++) {
      for (let j = 0; j < FOOT_V; j++) {
        const a = i * (FOOT_V + 1) + j;
        const b = a + 1;
        const c = a + FOOT_V + 1;
        const d = c + 1;
        index.push(a, b, c, b, d, c);
      }
    }
    geometry.setIndex(index);
    // Blended like a transparent material, but not marked transparent: that
    // keeps it among the opaque objects, drawn before the figures (see
    // FOOTPRINT_ORDER) instead of after them.
    this.footprintMaterial = new MeshBasicMaterial({
      color,
      opacity: 0.3,
      blending: CustomBlending,
      blendSrc: SrcAlphaFactor,
      blendDst: OneMinusSrcAlphaFactor,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    this.footprint = new Mesh(geometry, this.footprintMaterial);
    this.footprint.renderOrder = FOOTPRINT_ORDER;
    this.footprint.matrixAutoUpdate = false;
    group.add(this.footprint);
  }

  /** Works out where the figures stand at `time` (the track); `update` then draws them there. */
  sample(time: number): void {
    // The fallen stay where they fell for the rest of the battle: the die
    // clip plays once and holds its last frame. Without a die clip a figure
    // that falls is simply no longer drawn.
    this.standing = this.track.sample(time, this.model.hasDie ? Infinity : 0);
  }

  /**
   * Moves the figures to where they stand at `time`, as last sampled. `clock`
   * is `time` in seconds of playback, `now` is wall-clock seconds. `march`
   * says how the battle clock got here: figures step only while it runs, and
   * stand at ease when it is stopped or jumps.
   */
  update(
    time: number,
    clock: number,
    now: number,
    march: March,
    heightAt: HeightAt,
    missiles: Missiles | null = null,
  ): void {
    const { track, model } = this;
    if (march.halted) {
      this.speed = 0;
      this.gait = IDLE;
    } else {
      this.gait = this.pickGait();
    }
    // In a fight at a distance (skirmish) the front ranks throw; everyone
    // else keeps pace with the block. Hand to hand (fight), a man strikes
    // when he has an enemy in reach (see CLOSE_SPEED).
    const action = track.actionAt(time);
    const throwing = action === "skirmish";
    const fighting = throwing || action === "fight";
    const acting = throwing ? ATTACK : this.gait;
    if (acting !== this.toActing || this.gait !== this.toRest) {
      this.fromActing = this.toActing;
      this.fromRest = this.toRest;
      this.toActing = acting;
      this.toRest = this.gait;
      this.blendStart = Number.isNaN(this.lastTime) ? -Infinity : now;
    }
    const blend = Math.min((now - this.blendStart) / BLEND_SECONDS, 1);
    // Wall-clock seconds since the last frame, for turning.
    const tick = Number.isNaN(this.lastNow) ? 0 : Math.min(Math.max(now - this.lastNow, 0), MAX_STEP_SECONDS);
    this.lastNow = now;
    if (march.jumped) {
      // After a jump the figures stand facing their block, without a turn to play out.
      this.turn.fill(0);
      this.back.fill(0);
      this.velocityX.fill(0);
      this.velocityY.fill(0);
      this.turned = false;
    }
    // Still frames are skipped, unless figures are still turning.
    if (time === this.lastTime && blend === this.lastBlend && (!this.turned || march.halted)) return;
    this.lastTime = time;
    this.lastBlend = blend;

    const figureHeight = model.height * FIGURE_SCALE;
    const done = blend >= 1;
    const fromActing = done ? this.toActing : this.fromActing;
    const fromRest = done ? this.toRest : this.fromRest;
    const weight = done ? 0 : blend;

    // Legs keep up with the ground covered, up to the fastest pace of the
    // clip. Beyond it every stride is shortened alike, by the speed of the
    // block and not frame by frame: frame times are uneven, and a limit per
    // frame would clip steps that are within the pace on average.
    const stepping = march.step > 0 && this.placed;
    const current = this.gaits.find((g) => g.clip === this.gait) ?? this.gaits[0];
    const pace = current.speed * (current.clip === RUN && !this.mounted ? RUN_RATE_FOOT : MAX_RATE[current.clip]);
    const reach = this.speed > pace ? pace / this.speed : 1;
    const { lastX, lastY, walked, velocityX, velocityY, turn, back, groundX, groundY, groundH } = this;
    // Marching askew (see TURN_FROM). While the clock stands still the men
    // hold the way they face: a pause keeps the moment as it was. Whether a
    // man is on the move is his own smoothed speed, not the gait of the
    // block, which idles for a frame or two when playback resumes.
    const steer = !march.halted;
    const turnLimit = fighting ? WAITING_TURN : Math.PI;
    const turnStep = TURN_RATE * tick;
    const smoothing = stepping ? 1 - Math.exp(-march.step / VELOCITY_SMOOTHING) : 0;
    // velocity += (step / seconds - velocity) * smoothing, without a division per figure.
    const smoothingPerSecond = stepping ? smoothing / march.step : 0;
    // Slower than this a figure has no direction of its own to turn to.
    const slowest = this.gaits[0].speed * MOVE_START;
    const slowestSquared = slowest * slowest;
    let turned = false;
    let moved = 0;
    let movers = 0;
    // Hand to hand (see CLOSE_SPEED).
    const { offX, offY, blows, stowed } = this;
    const figures = track.fighting ? this.fight : null;
    const stows = model.stow !== null && track.fighting;
    const stowStep = march.step / STOW_SECONDS;
    // After a jump, and when first placed, the figures stand where the fight has them.
    const snap = march.jumped || !this.placed;
    const closeStep = CLOSE_SPEED * march.step;
    // In a block that stands, the legs of a figure that moves on its own.
    const ownLegs = track.fighting && fromRest === IDLE && this.toRest === IDLE;
    const stepFrom = this.gaits[0].speed * STEP_FROM;
    const stepFull = this.gaits[0].speed * STEP_FULL;
    // The press behind the front rank (see PRESS_SHARE): the room a man has, and how far he sways.
    let room = 0;
    let press = 0;
    if (figures !== null && this.standing > 0) {
      const key = track.formationAt(time);
      room = Math.sqrt((key.frontage * key.depth) / this.standing);
      press = Math.min(room * PRESS_SHARE, PRESS_MAX);
    }
    // Foot in a melee (see FIGHT_TURN_FOOT, LOOSE_SHARE): the turn towards an enemy, how far the files loosen, and the fighters to keep clear of.
    const onFoot = !this.mounted;
    const fightTurn = onFoot ? FIGHT_TURN_FOOT : FIGHT_TURN;
    const loose = onFoot && press > 0 ? Math.min(room * LOOSE_SHARE, LOOSE_MAX) : 0;
    const clearance = onFoot && figures !== null ? this.clearance : null;
    const giveWay = this.giveWay;
    const ahead = track.before;
    // Missiles (see MISSILE_SPEED).
    const strikeSeconds = model.strike.seconds;
    const strikeImpact = Math.min(model.strike.impact, strikeSeconds);
    const handHeight = figureHeight * HAND_HEIGHT;
    const landDrop = figureHeight * (LAND_HEIGHT - HAND_HEIGHT);
    // Riding through the enemy (see RIDE_GALLOP): the way the block faces, for the loops of its riders.
    const { ride, riding, fell } = this;
    let faceSin = 0;
    let faceCos = 1;
    let facing = 0;
    if (ride !== null) {
      facing = track.formationAt(time).facing;
      faceSin = Math.sin(facing);
      faceCos = Math.cos(facing);
      if (snap) fell.fill(0);
    }
    // The gaits of a rider on his loop: the trot up to where it gives way to the gallop.
    const walkSpeed = this.gaits[0].speed;
    const trot = this.gaits.find((g) => g.clip === JOG) ?? null;
    const gallop = this.gaits.find((g) => g.clip === RUN) ?? this.gaits[this.gaits.length - 1];
    const slowClip = trot ? JOG : gallop.clip;
    const change = trot ? Math.sqrt(trot.speed * gallop.speed) : 0;
    // The blows he strikes in passing: the clip, how long it is, and when in it the blow lands.
    const rideClip = model.ridedown > 0 ? RIDEDOWN : ATTACK;
    const rideLength = model.ridedown > 0 ? model.ridedown : strikeSeconds;
    const rideImpact = model.ridedown > 0 ? Math.min(RIDEDOWN_IMPACT, model.ridedown) : strikeImpact;
    // Bowled over by a horse (see KNOCK_TURN): the clip, how long it is, and how long before the horse it begins.
    const { knockStart, knockSeconds, knockBearing, knockBlade } = track;
    const knocked = knockSeconds.length > 0;
    const falls = model.knockdown === 0 && model.hasDie && model.dieSeconds > 0;
    const fallSeconds = model.dieSeconds;
    const riseSeconds = Math.max(Math.min(fallSeconds * RISE_SHARE, KNOCKDOWN_SECONDS - fallSeconds - FALLEN_LIES), 0.3);
    const knockClip = model.knockdown > 0 ? KNOCKDOWN : falls ? DIE : HIT;
    const knockLength =
      model.knockdown > 0 ? model.knockdown : falls ? fallSeconds + FALLEN_LIES + riseSeconds : model.reaction.hit;
    const knockLead = model.knockdown > 0 || !falls ? REACTION_IMPACT : FALL_LEAD;
    const flinchLength = model.reaction.hit;
    const knockStep = KNOCK_TURN * tick;

    for (const chunk of this.chunks) {
      const { posYaw, anim, seed, strike, slot } = chunk;
      const looks = this.looks;
      let n = 0;
      let minX = Infinity;
      let minY = Infinity;
      let minZ = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (let i = chunk.first; i < chunk.first + chunk.count; i++) {
        const status = track.status[i];
        if (status === GONE) continue;
        // A figure with an enemy stands where the fight has it; one without,
        // or fallen, goes back to its place in the formation.
        let opponent = -1;
        let wantX = 0;
        let wantY = 0;
        // In the press behind the front rank: how much, 0..1, and which way he leans, -1..1.
        let restless = 0;
        let sway = 0;
        if (figures !== null && status !== DYING) {
          opponent = figures.opponent[i];
          if (opponent !== -1) {
            wantX = figures.offsetX[i];
            wantY = figures.offsetY[i];
          } else if (press > 0 && track.turningAbout[i] === 0) {
            // In the press: he sways about his place.
            const s = track.seed[i];
            restless = PRESS_RANKS[Math.min(ahead[i], PRESS_RANKS.length - 1)];
            const a = clock * (0.55 + 0.5 * s) + s * 91.7;
            const b = clock * (0.83 + 0.4 * fract(s * 7.3)) + s * 37.1;
            sway = Math.sin(b);
            const span = press * restless;
            wantX = span * (0.62 * Math.sin(a) + 0.38 * sway);
            wantY = span * (0.62 * Math.sin(a * 1.31 + 2) + 0.38 * Math.sin(b * 0.71 + 4));
            // On foot the files loosen, and the men keep clear of the fighters.
            if (loose > 0) {
              wantX += loose * (2 * fract(s * 41.17) - 1);
              wantY += loose * (2 * fract(s * 73.91) - 1);
            }
            if (clearance !== null) {
              clearance.clear(track.x[i] + wantX, track.y[i] + wantY, giveWay);
              wantX += giveWay.x;
              wantY += giveWay.y;
            }
          }
        }
        let ox = offX[i];
        let oy = offY[i];
        // On his loop through the enemy: where the clock has him, at once.
        let rides = false;
        if (ride !== null) {
          if (status === DYING) {
            // He lies where he was on his loop when he fell.
            if (fell[i] === 0 && ride.sample(i, track.deathSeconds[i], riding)) {
              fell[i] = 1;
              const there = track.formationAt(track.deathTime[i]).facing;
              ox = Math.sin(there) * riding.forward + Math.cos(there) * riding.right;
              oy = Math.cos(there) * riding.forward - Math.sin(there) * riding.right;
              offX[i] = ox;
              offY[i] = oy;
              turn[i] = angleDelta(track.heading[i], there + riding.turn);
            }
          } else if (ride.sample(i, clock, riding)) {
            rides = true;
            ox = faceSin * riding.forward + faceCos * riding.right;
            oy = faceCos * riding.forward - faceSin * riding.right;
            offX[i] = ox;
            offY[i] = oy;
            wantX = ox;
            wantY = oy;
          }
        }
        // After a jump the fallen of a fight on foot lie scattered about their places (see SCATTER).
        if (status === DYING && snap && onFoot && ride === null && track.actionAt(track.deathTime[i]) === "fight") {
          const s = track.seed[i];
          const h = track.heading[i];
          const forward = SCATTER * (2 * fract(s * 17.13) - 1);
          const across = SCATTER * 0.5 * (2 * fract(s * 29.71) - 1);
          wantX = Math.sin(h) * forward + Math.cos(h) * across;
          wantY = Math.cos(h) * forward - Math.sin(h) * across;
        }
        // The fallen lie where they fought; after a jump, in their files (or scattered, above).
        if ((ox !== wantX || oy !== wantY) && (status !== DYING || snap) && fell[i] === 0) {
          const dx = wantX - ox;
          const dy = wantY - oy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (snap || d <= closeStep) {
            ox = wantX;
            oy = wantY;
          } else if (closeStep > 0) {
            ox += (dx / d) * closeStep;
            oy += (dy / d) * closeStep;
          }
          offX[i] = ox;
          offY[i] = oy;
        }
        const x = track.x[i] + ox;
        const north = track.y[i] + oy;
        const z = -north;
        let y = groundH[i];
        if (x !== groundX[i] || north !== groundY[i]) {
          y = heightAt(x, north);
          groundX[i] = x;
          groundY[i] = north;
          groundH[i] = y;
        }
        const o = n * 4;
        if (model.stow !== null) {
          // At the head of a file in a fight hand to hand, or fighting from the second rank: put away. The fallen keep what they had.
          let away = stowed[i];
          if (status !== DYING) {
            const want = stows && (track.head[i] === 1 || opponent !== -1) ? 1 : 0;
            if (away !== want) {
              if (snap) away = want;
              else away = want > away ? Math.min(away + stowStep, want) : Math.max(away - stowStep, want);
              stowed[i] = away;
            }
          }
          strike[n * STRIKE + 1] = away;
        }
        if (status === DYING) {
          const since = track.since[i];
          anim[o] = DIE;
          anim[o + 1] = DIE;
          anim[o + 2] = 0;
          anim[o + 3] = since;
          strike[n * STRIKE] = -1;
        } else {
          const heading = track.heading[i];
          // In a fight at a distance only the front ranks throw; the rest wait their turn.
          const acts = throwing && (track.rank[i] <= 0.34 || track.seed[i] <= 0.2);
          let dx = 0;
          let dy = 0;
          let step = 0;
          if (stepping) {
            dx = x - lastX[i];
            dy = north - lastY[i];
            step = Math.sqrt(dx * dx + dy * dy);
            velocityX[i] += dx * smoothingPerSecond - velocityX[i] * smoothing;
            velocityY[i] += dy * smoothingPerSecond - velocityY[i] * smoothing;
            movers++;
          }
          // The way the formation faces this figure, worked out only when it
          // moves or may turn: most of a still block needs none of it.
          let sinHeading = 0;
          let cosHeading = 0;
          let headingKnown = false;
          // Facing the block, or turned towards where the figure goes. A man
          // turning about (timeline.ts) does that first.
          let target = 0;
          let t = turn[i];
          // The men who throw face the way of the block; so does a man turning about.
          const limit = (fighting && acts) || track.turningAbout[i] ? 0 : turnLimit;
          // Bowled over by a horse, or struck at by its rider: seconds into the clip, or -1.
          let down = -1;
          let flinch = -1;
          if (knocked) {
            for (let q = knockStart[i]; q < knockStart[i + 1]; q++) {
              if (knockBlade[q] === 1) {
                const begun = clock - knockSeconds[q] + REACTION_IMPACT;
                if (begun >= 0 && begun < flinchLength) flinch = begun;
                continue;
              }
              const begun = clock - knockSeconds[q] + knockLead;
              if (begun < 0) continue;
              if (begun < knockLength) {
                down = begun;
                flinch = -1;
                // He faces the horse: the clip throws him on his back.
                target = angleDelta(heading, knockBearing[q] + Math.PI);
              }
            }
          }
          if (rides) {
            // On his loop: the way he rides.
            t = angleDelta(heading, facing + riding.turn);
            target = t;
            turn[i] = t;
            back[i] = 0;
          } else if (down >= 0) {
            back[i] = 0;
            if (snap) t = target;
            else t += Math.min(Math.max(angleDelta(t, target), -knockStep), knockStep);
            turn[i] = t;
            target = t;
          } else if (opponent !== -1 && figures !== null) {
            // Hand to hand: facing his enemy.
            target = Math.min(Math.max(angleDelta(heading, figures.bearing[i]), -fightTurn), fightTurn);
            back[i] = 0;
            if (snap) {
              t = target;
              turn[i] = t;
            }
          } else if (restless > 0) {
            // In the press: he turns as he sways.
            target = PRESS_TURN * restless * sway;
            back[i] = 0;
            if (snap) {
              t = target;
              turn[i] = t;
            }
          } else if (steer && limit > 0) {
            const vx = velocityX[i];
            const vy = velocityY[i];
            const speedSquared = vx * vx + vy * vy;
            if (speedSquared > slowestSquared) {
              sinHeading = Math.sin(heading);
              cosHeading = Math.cos(heading);
              headingKnown = true;
              // Speed times the cosine of the angle between facing and going,
              // compared squared with the speed times cos(TURN_FROM).
              const along = vx * sinHeading + vy * cosHeading;
              const straight = along * along > COS_TURN_FROM_SQUARED * speedSquared;
              if (straight && along > 0) {
                // Within TURN_FROM of straight ahead: no turn.
                back[i] = 0;
              } else if (straight) {
                // Within TURN_FROM of straight back: stepping back, no turn.
                back[i] = 1;
              } else {
                const motion = Math.atan2(vx * cosHeading - vy * sinHeading, along);
                const off = Math.abs(motion);
                if (off > Math.PI / 2 + BACK_SLACK) back[i] = 1;
                else if (off < Math.PI / 2 - BACK_SLACK) back[i] = 0;
                target = Math.min(Math.max(askewTurn(motion, back[i] === 1), -limit), limit);
              }
            }
          }
          if (steer && t !== target) {
            t = target > t ? Math.min(t + turnStep, target) : Math.max(t - turnStep, target);
            turn[i] = t;
          }
          if (t !== 0) turned = true;
          if (step > 0) {
            // Giving ground while facing the enemy: the stride runs backwards.
            let forward: number;
            if (t === 0) {
              if (!headingKnown) {
                sinHeading = Math.sin(heading);
                cosHeading = Math.cos(heading);
              }
              forward = dx * sinHeading + dy * cosHeading;
            } else {
              const facing = heading + t;
              forward = dx * Math.sin(facing) + dy * Math.cos(facing);
            }
            // A rider on his loop covers the ground at his own pace, not that of the block.
            const stride = rides ? step : step * reach;
            walked[i] += forward < -0.5 * step ? -stride : stride;
            moved += step;
          }
          lastX[i] = x;
          lastY[i] = north;
          // What the legs do: as the block, or the figure's own steps in a
          // block that stands (see STEP_FROM).
          let from = acts ? fromActing : fromRest;
          let to = acts ? this.toActing : this.toRest;
          let mix = weight;
          if (rides) {
            // From a stand into the trot, and the trot into the gallop.
            const pace = riding.speed;
            if (pace < walkSpeed * RIDE_START) {
              from = IDLE;
              to = slowClip;
              mix = pace / (walkSpeed * RIDE_START);
            } else if (pace < change * (1 - RIDE_CHANGE)) {
              from = slowClip;
              to = slowClip;
              mix = 0;
            } else {
              from = slowClip;
              to = gallop.clip;
              mix = Math.min((pace - change * (1 - RIDE_CHANGE)) / (2 * RIDE_CHANGE * Math.max(change, 0.001)), 1);
            }
          } else if (ownLegs) {
            const vx = velocityX[i];
            const vy = velocityY[i];
            const speedSquared = vx * vx + vy * vy;
            if (speedSquared > stepFrom * stepFrom) {
              to = WALK;
              mix = Math.min((Math.sqrt(speedSquared) - stepFrom) / (stepFull - stepFrom), 1);
            }
          }
          // The clip on top (blows.ts): his own blow, or the blow he takes.
          let into = -1;
          let overlay = ATTACK;
          // Seconds since the clip on top began, and until it ends: it fades in and out.
          let since = 0;
          let left = 0;
          // The clip on top is for the rider alone: his horse keeps its gallop.
          let riderOnly = false;
          if (down >= 0) {
            since = down;
            left = knockLength - down;
            overlay = knockClip;
            // Without a clip of its own: down as in die, a moment on the ground, up the way he fell.
            into = !falls
              ? down
              : down < fallSeconds
                ? down
                : down < fallSeconds + FALLEN_LIES
                  ? fallSeconds
                  : Math.max(fallSeconds * (1 - (down - fallSeconds - FALLEN_LIES) / riseSeconds), 0);
          } else if (flinch >= 0) {
            into = flinch;
            since = flinch;
            left = flinchLength - flinch;
            overlay = HIT;
          } else if (rides && ride !== null) {
            // The blow he strikes as he passes a man.
            const { strikeStart, strikeSeconds: lands } = ride;
            for (let q = strikeStart[i]; q < strikeStart[i + 1]; q++) {
              const begun = clock - lands[q] + rideImpact;
              if (begun < 0) break;
              if (begun < rideLength) {
                into = begun;
                since = begun;
                left = rideLength - begun;
                overlay = rideClip;
                riderOnly = true;
              }
            }
          } else if (blows !== null) {
            const struck = blows.swing[i];
            const taken = blows.react[i];
            if (struck >= 0) {
              into = swingInto(struck, clock, blows.impact);
              since = clock - blows.swingFrom[i];
              left = blows.seconds - into;
            } else if (taken >= 0) {
              into = swingInto(taken, clock, REACTION_IMPACT);
              since = clock - blows.reactFrom[i];
              left = blows.reaction - into;
              overlay = blows.through[i] === 1 ? HIT : BLOCK;
            } else if (restless > 0) {
              // In the press: a thrust past the man in front, a throw over him, or the shield up.
              const s = track.seed[i];
              const before = ahead[i];
              const period = PRESS_PERIOD + PRESS_PERIOD_SPAN * fract(s * 13.37);
              const at = clock + s * 61;
              const cycle = Math.floor(at / period);
              const local = at - cycle * period;
              const pick = hash01(cycle, s);
              const throws = before >= THROW_FROM;
              const thrusts = throws ? (this.lobs ? PRESS_THROWS : 0) : PRESS_THRUSTS[before];
              if (pick < thrusts) {
                if (local < blows.seconds) {
                  into = local;
                  since = local;
                  left = blows.seconds - local;
                }
                if (throws && missiles !== null && local >= blows.impact) {
                  // Over the ranks in front, to come down a little beyond the front rank.
                  const far = before * room + 6 + 22 * hash01(cycle + 7, s);
                  const seconds = far / LOB_SPEED;
                  const flown = local - blows.impact;
                  if (flown < seconds) {
                    const bearing = track.heading[i] + (hash01(cycle + 3, s) - 0.5) * 0.3;
                    missiles.add(
                      "javelin",
                      x,
                      y + handHeight,
                      z,
                      Math.sin(bearing),
                      Math.cos(bearing),
                      far,
                      landDrop,
                      seconds,
                      flown / seconds,
                    );
                  }
                }
              } else if (pick < thrusts + PRESS_GUARDS && local < blows.reaction) {
                into = local;
                since = local;
                left = blows.reaction - local;
                overlay = BLOCK;
              }
            }
          }
          if (acts && missiles !== null) {
            // He throws as the figure shader plays him (figFrame in figures/material.ts):
            // the attack clip over and over on the wall clock, at his own pace.
            const s = track.seed[i];
            const rate = 0.88 + 0.24 * fract(s * 7.31);
            const played = now * rate + s * 23;
            let loop = Math.floor(played / strikeSeconds);
            let released = played - loop * strikeSeconds - strikeImpact;
            if (released < 0) {
              released += strikeSeconds;
              loop--;
            }
            const far = this.range * (0.8 + 0.4 * hash01(loop, s));
            const seconds = far / MISSILE_SPEED[this.missile];
            const flown = released / rate;
            if (flown < seconds) {
              const bearing = heading + (hash01(loop + 5, s) - 0.5) * 0.24;
              missiles.add(
                this.missile,
                x,
                y + handHeight,
                z,
                Math.sin(bearing),
                Math.cos(bearing),
                far,
                landDrop,
                seconds,
                flown / seconds,
              );
            }
          }
          if (into >= 0) {
            anim[o] = mix > 0.5 ? to : from;
            anim[o + 1] = overlay;
            anim[o + 2] = Math.min(since / STRIKE_IN, left / STRIKE_OUT, 1);
          } else {
            anim[o] = from;
            anim[o + 1] = to;
            anim[o + 2] = mix;
          }
          anim[o + 3] = walked[i];
          strike[n * STRIKE] = into;
          if (riderOnly) strike[n * STRIKE + 1] = 2;
          else if (ride !== null) strike[n * STRIKE + 1] = 0;
        }
        posYaw[o] = x;
        posYaw[o + 1] = y;
        posYaw[o + 2] = z;
        // A fallen figure keeps the turn it had when it fell.
        posYaw[o + 3] = Math.PI - (track.heading[i] + turn[i]);
        seed[n] = track.seed[i];
        slot[n] = i - chunk.first;
        if (looks) {
          strike[n * STRIKE + 2] = looks[i * 2];
          strike[n * STRIKE + 3] = looks[i * 2 + 1];
        }
        n++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      // Drawn once Crowd.selectLods has sorted them into their levels.
      chunk.drawn = n;
      if (n === 0) continue;
      chunk.sphere.center.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
      chunk.sphere.radius =
        Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + figureHeight * 1.2;
    }

    this.placed = true;
    this.turned = turned;
    if (march.step > 0) {
      const measured = movers > 0 ? moved / movers / march.step : 0;
      this.speed += (measured - this.speed) * (1 - Math.exp(-march.step / SPEED_SMOOTHING));
    }

    this.updateFootprint(time, heightAt);
  }

  /**
   * The gaits of the model, slowest first: walk, then jog and run when it
   * has them, each with its natural ground speed at the size figures are
   * drawn.
   */
  private get gaits(): Gait[] {
    if (this.gaitList) return this.gaitList;
    const { gait, hasJog, hasRun } = this.model;
    const speedOf = (cycle: { metres: number; seconds: number }) =>
      (cycle.metres / cycle.seconds) * FIGURE_SCALE;
    const list: Gait[] = [{ clip: WALK, speed: speedOf(gait.walk) }];
    if (hasJog) list.push({ clip: JOG, speed: speedOf(gait.jog) });
    if (hasRun) list.push({ clip: RUN, speed: speedOf(gait.run) });
    this.gaitList = list.sort((a, b) => a.speed - b.speed);
    return this.gaitList;
  }

  /** Idle or a gait for the speed measured, with slack around each threshold. */
  private pickGait(): number {
    const { speed, gait, gaits } = this;
    if (speed < gaits[0].speed * (gait === IDLE ? MOVE_START : MOVE_STOP)) return IDLE;
    // Where one gait gives way to the next.
    const change = (i: number) => Math.sqrt(gaits[i].speed * gaits[i + 1].speed);
    let i = gaits.findIndex((g) => g.clip === gait);
    if (i < 0) {
      // From standing: straight to the gait of this speed.
      i = 0;
      while (i + 1 < gaits.length && speed > change(i)) i++;
      return gaits[i].clip;
    }
    while (i + 1 < gaits.length && speed > change(i) * (1 + GAIT_SLACK)) i++;
    while (i > 0 && speed < change(i - 1) * (1 - GAIT_SLACK)) i--;
    return gaits[i].clip;
  }

  private updateFootprint(time: number, heightAt: HeightAt): void {
    // A unit lying in ambush shows no colour of its side (UnitState.concealed).
    this.footprint.visible = this.standing > 0 && !this.track.hiddenAt(time);
    if (!this.footprint.visible) return;
    const formation = this.track.formationAt(time);
    // A block standing still keeps its patch: the ground under it is the same.
    const key = this.footprintKey;
    if (
      key[0] === formation.center.x &&
      key[1] === formation.center.y &&
      key[2] === formation.frontage &&
      key[3] === formation.depth &&
      key[4] === formation.facing &&
      key[5] === formation.bulge
    ) {
      return;
    }
    key[0] = formation.center.x;
    key[1] = formation.center.y;
    key[2] = formation.frontage;
    key[3] = formation.depth;
    key[4] = formation.facing;
    key[5] = formation.bulge;
    const position = this.footprint.geometry.attributes.position as BufferAttribute;
    const margin = 3 * FIGURE_SCALE;
    const wide = 1 + (2 * margin) / formation.frontage;
    const deep = 1 + (2 * margin) / formation.depth;
    // formationPoint (timeline.ts), with its trigonometry taken out of the loop.
    const { center, frontage, depth, bulge } = formation;
    const sin = Math.sin(formation.facing);
    const cos = Math.cos(formation.facing);
    const array = position.array as Float32Array;
    let k = 0;
    for (let i = 0; i <= FOOT_U; i++) {
      const u = (i / FOOT_U - 0.5) * wide;
      const across = u * frontage;
      const bulged = bulge * (1 - 4 * u * u);
      for (let j = 0; j <= FOOT_V; j++) {
        const v = (j / FOOT_V - 0.5) * deep + 0.5;
        const forward = depth * (0.5 - v) + bulged;
        const x = center.x + cos * across + sin * forward;
        const y = center.y - sin * across + cos * forward;
        array[k++] = x;
        array[k++] = heightAt(x, y) + 0.3;
        array[k++] = -y;
      }
    }
    position.needsUpdate = true;
    this.footprint.geometry.computeBoundingSphere();
    this.center.set(formation.center.x, heightAt(formation.center.x, formation.center.y), -formation.center.y);
  }

  /**
   * Fades the ground patch in as the figures shrink to dots, and dims it
   * with the daylight (it is a flat colour that takes no light). Once the
   * figures are large enough to read on their own the patch is gone: close
   * up, a tint under their feet only looks like bare earth (T-046).
   * Runs after `update` in a frame, so hiding the patch here holds for the
   * frame drawn next.
   */
  setFootprintLook(cameraPosition: Vector3, pixelsPerMetreAtOne: number, daylight: number): void {
    this.footprintMaterial.color.copy(this.color).multiplyScalar(daylight);
    // How large the nearest figures look: a long line seen from one end is
    // close, though its middle is far.
    let distance = Infinity;
    for (const chunk of this.chunks) if (chunk.drawn > 0) distance = Math.min(distance, chunk.distance);
    if (!Number.isFinite(distance)) distance = Math.max(cameraPosition.distanceTo(this.center), 1);
    const pixels = (this.model.height * FIGURE_SCALE * pixelsPerMetreAtOne) / distance;
    const far = 1 - Math.min(Math.max((pixels - 5) / 13, 0), 1);
    this.footprintMaterial.opacity = 0.52 * far;
    if (far === 0) this.footprint.visible = false;
  }

  dispose(): void {
    for (const chunk of this.chunks) chunk.dispose();
    this.footprint.geometry.dispose();
    this.footprintMaterial.dispose();
  }
}

/** How the battle clock moved since the last frame. */
export interface March {
  /** Seconds of real time the figures marched for, or 0. */
  step: number;
  /** The clock is stopped or has jumped: figures stand at ease. */
  halted: boolean;
  /** The clock has jumped (a seek): the figures are placed afresh. */
  jumped: boolean;
}

const frustum = new Frustum();
const projection = new Matrix4();

export class Crowd {
  readonly group = new Group();
  readonly blocks: UnitBlock[] = [];
  private readonly chunks: Chunk[] = [];
  /** Scratch of `selectLods`: the chunks in view. */
  private readonly shown: Chunk[] = [];
  /** How far the triangle budget stretches the thresholds now (selectLods), 1 when it does not. */
  private stretch = 1;
  private readonly march: March = { step: 0, halted: true, jumped: false };
  private lastNow = NaN;
  private lastClock = NaN;
  private melee: Melee | null = null;
  private blows: Blows | null = null;
  /** What is in the air (missiles.ts). */
  readonly missiles = new Missiles();
  // Scratch of `aim`: where each block stands and which way it faces.
  private aimX = new Float32Array(0);
  private aimY = new Float32Array(0);
  private aimDepth = new Float32Array(0);
  private aimSin = new Float32Array(0);
  private aimCos = new Float32Array(0);

  constructor() {
    this.group.add(this.missiles.group);
  }

  add(block: UnitBlock): void {
    this.blocks.push(block);
    this.chunks.push(...block.chunks);
  }

  /**
   * Sets up the hand-to-hand fighting between the blocks (melee.ts): call
   * once every block is added. How far a figure strikes and how much room it
   * takes come from its model, at the size figures are drawn.
   */
  engage(): void {
    const melee = new Melee(
      this.blocks.map((block) => ({
        track: block.track,
        side: block.side,
        reach: block.model.strike.reach * FIGURE_SCALE,
        front: block.model.strike.front * FIGURE_SCALE,
        mounted: block.mounted,
      })),
    );
    const blows = new Blows(
      this.blocks.map((block) => ({
        track: block.track,
        seconds: block.model.strike.seconds,
        impact: block.model.strike.impact,
        block: block.model.reaction.block,
        hit: block.model.reaction.hit,
      })),
    );
    this.melee = melee;
    this.blows = blows;
    this.blocks.forEach((block, b) => {
      block.fight = melee.figures[b];
      block.blows = blows.figures[b];
      block.clearance = melee;
    });
  }

  /**
   * `clock` is `time` in seconds of playback at normal speed; `playing` is
   * false once the battle clock has stood still for a moment; `now` is
   * wall-clock seconds.
   */
  update(time: number, clock: number, playing: boolean, now: number, heightAt: HeightAt): void {
    const { march } = this;
    const elapsed = now - this.lastNow;
    const advance = clock - this.lastClock;
    this.lastNow = now;
    this.lastClock = clock;
    march.step = 0;
    march.halted = !playing;
    if (playing && elapsed > 0 && elapsed < MAX_STEP_SECONDS) {
      const rate = advance / elapsed;
      // Backwards or far too fast: the user is seeking.
      if (rate < 0 || rate > MAX_PLAYBACK_RATE) march.halted = true;
      else if (rate > 0) march.step = elapsed;
    }
    // The clock moved, but not as a march.
    march.jumped = advance !== 0 && march.step === 0;
    // Where everybody stands, then who fights whom and who strikes, then the figures.
    if (advance !== 0) {
      for (const block of this.blocks) block.sample(time);
      if (this.melee !== null && this.blows !== null) {
        this.melee.update(clock);
        this.blows.update(this.melee.figures, time, clock, march.jumped);
      }
    }
    // What is in the air is told afresh whenever the clock moves; while it
    // stands still, the missiles hang where they were.
    const missiles = advance !== 0 ? this.missiles : null;
    if (missiles !== null) {
      this.aim(time);
      missiles.begin();
    }
    for (const block of this.blocks) block.update(time, clock, now, march, heightAt, missiles);
    missiles?.end();
  }

  /**
   * How far the missiles of each block that fights at a distance fly: to
   * the middle of the nearest enemy block before it, from its own front.
   */
  private aim(time: number): void {
    const { blocks } = this;
    if (this.aimX.length !== blocks.length) {
      this.aimX = new Float32Array(blocks.length);
      this.aimY = new Float32Array(blocks.length);
      this.aimDepth = new Float32Array(blocks.length);
      this.aimSin = new Float32Array(blocks.length);
      this.aimCos = new Float32Array(blocks.length);
    }
    const { aimX, aimY, aimDepth, aimSin, aimCos } = this;
    let throwing = false;
    for (let b = 0; b < blocks.length; b++) {
      const track = blocks[b].track;
      // The formation is a scratch value of the track: take what is needed at once.
      const key = track.formationAt(time);
      aimX[b] = key.center.x;
      aimY[b] = key.center.y;
      aimDepth[b] = key.depth;
      aimSin[b] = Math.sin(key.facing);
      aimCos[b] = Math.cos(key.facing);
      if (track.actionAt(time) === "skirmish") throwing = true;
    }
    if (!throwing) return;
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      if (block.track.actionAt(time) !== "skirmish") continue;
      let nearest = Infinity;
      for (let e = 0; e < blocks.length; e++) {
        const enemy = blocks[e];
        if (enemy.side === block.side || enemy.standing === 0) continue;
        const dx = aimX[e] - aimX[b];
        const dy = aimY[e] - aimY[b];
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Before it: within 70° of the way it faces.
        const along = dx * aimSin[b] + dy * aimCos[b];
        if (along < distance * 0.34) continue;
        if (distance < nearest) nearest = distance;
      }
      block.range =
        nearest === Infinity
          ? RANGE_DEFAULT
          : Math.min(Math.max(nearest - aimDepth[b] / 2, RANGE_MIN), RANGE_MAX);
    }
  }

  /**
   * Picks a level of detail for every figure from its size on screen. When
   * the figures in view would come to more triangles than the budget, both
   * thresholds are stretched by the smallest factor that fits: the smallest
   * figures on screen, the farthest, are coarsened first, and the ratio of
   * the two thresholds holds, so neither level is emptied for the other.
   */
  selectLods(
    camera: Camera,
    viewportHeight: number,
    fovRadians: number,
    settings: LodSettings,
    daylight: number,
  ): CrowdCounts {
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection);
    const pixelsPerMetreAtOne = viewportHeight / (2 * Math.tan(fovRadians / 2));
    const counts: CrowdCounts = { standing: 0, drawn: 0, lods: [0, 0, 0] };
    const shown = this.shown;
    shown.length = 0;

    for (const block of this.blocks) {
      counts.standing += block.standing;
      const size = block.model.height * FIGURE_SCALE * pixelsPerMetreAtOne;
      for (const chunk of block.chunks) {
        if (chunk.drawn === 0) {
          chunk.inView = false;
          continue;
        }
        chunk.inView = frustum.intersectsSphere(chunk.sphere);
        chunk.measure(camera.position, size);
        if (chunk.inView) {
          shown.push(chunk);
          counts.drawn += chunk.drawn;
        }
      }
      block.setFootprintLook(camera.position, pixelsPerMetreAtOne, daylight);
    }

    const { lod0Pixels, lod1Pixels, triangleBudget } = settings;
    const triangles = (stretch: number): number => {
      let total = 0;
      for (const chunk of shown) total += chunk.triangles(lod0Pixels * stretch, lod1Pixels * stretch);
      return total;
    };
    // The stretch comes down by STRETCH_EASE a frame at most: if that much
    // less fits with EASE_ROOM to spare, that is the answer; if only last
    // frame's fits, it holds. Mostly one or two passes.
    const eased = Math.max(this.stretch * STRETCH_EASE, 1);
    if (triangles(eased) <= triangleBudget * EASE_ROOM) {
      this.stretch = eased;
    } else if (eased === this.stretch || triangles(this.stretch) > triangleBudget) {
      // More men in view than last frame: the least stretch that fits, at
      // once. Double until it fits, then halve the gap a few times: within 5%.
      let over = this.stretch;
      let fits = this.stretch * 2;
      while (fits < MAX_STRETCH && triangles(fits) > triangleBudget) {
        over = fits;
        fits *= 2;
      }
      for (let step = 0; step < 5; step++) {
        const middle = Math.sqrt(over * fits);
        if (triangles(middle) > triangleBudget) over = middle;
        else fits = middle;
      }
      this.stretch = fits;
    }

    for (const chunk of this.chunks) {
      chunk.sort(lod0Pixels * this.stretch, lod1Pixels * this.stretch, settings, counts.lods);
    }
    return counts;
  }

  /**
   * Meshes that show every material a figure may be drawn with, for compiling
   * the shaders up front: otherwise the first zoom onto a block would stall
   * while the detailed material compiles. Remove them once compiled.
   */
  warmUpMeshes(): Mesh[] {
    const meshes: Mesh[] = [];
    const seen = new Set<unknown>();
    for (const chunk of this.chunks) {
      for (const material of [chunk.materials.material, chunk.materials.detailed]) {
        if (!material || seen.has(material)) continue;
        seen.add(material);
        for (const level of chunk.levels) {
          const mesh = new Mesh(level.geometry, material);
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;
          meshes.push(mesh);
        }
      }
    }
    return meshes;
  }

  /**
   * The blocks with men standing at `time`, as boxes that hide what lies
   * behind them (see occlusion.ts). Written into `out`; `owners` gets the
   * block of each box.
   */
  occluders(time: number, heightAt: HeightAt, out: Occluder[], owners: UnitBlock[]): void {
    out.length = 0;
    owners.length = 0;
    for (const block of this.blocks) {
      if (block.standing === 0) continue;
      owners.push(block);
      const f = block.track.formationAt(time);
      const sin = Math.sin(f.facing);
      const cos = Math.cos(f.facing);
      // A bulge pushes the middle of the line up to `bulge` forward.
      const shift = f.bulge / 2;
      const x = f.center.x + sin * shift;
      const y = f.center.y + cos * shift;
      const bottom = heightAt(x, y);
      out.push({
        x,
        y,
        sin,
        cos,
        halfAcross: f.frontage / 2,
        halfDepth: f.depth / 2 + Math.abs(f.bulge) / 2,
        bottom,
        // Up to the shoulders: a crest or a spear point hides nothing.
        top: bottom + block.model.height * FIGURE_SCALE * 0.85,
      });
    }
  }

  dispose(): void {
    for (const block of this.blocks) block.dispose();
    this.blocks.length = 0;
    this.chunks.length = 0;
    this.missiles.dispose();
  }
}
