/**
 * The troops on the field. Each battle unit is a UnitBlock; its figures are
 * split into chunks of neighbouring files, and every chunk is one instanced
 * draw call with its own level of detail and its own bounds for culling.
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
import type { FigureMaterials } from "./figures/material";
import { CLIP_INDEX, type UnitModel } from "./figures/model";
import { type BlowFigures, Blows } from "./blows";
import { Melee, type MeleeFigures, swingInto } from "./melee";
import type { Occluder } from "./occlusion";
import type { HeightAt } from "./terrain";
import { DYING, GONE, type UnitTrack } from "./timeline";
import { REACTION_IMPACT } from "@/lib/battle";

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
 *   MAX_RATE times their own (walk 8.9 m/s, run 26.6 m/s). A battle is
 *   shown many times faster than it was fought, so blocks can move faster
 *   than that; the legs then keep the fastest pace that still looks like
 *   running, and the feet slide.
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
 *   block, at TURN_RATE like any other turn.
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
 *   its file for. (After a jump the fallen lie in their files, a few metres
 *   off: where a man stood to fight is not known without playing up to it.)
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
const STRIKE_IN = 0.15;
const STRIKE_OUT = 0.25;
const STEP_FROM = 0.12;
const STEP_FULL = 0.45;
const STOW_SECONDS = 0.3;
const BLOCK = CLIP_INDEX.block;
const HIT = CLIP_INDEX.hit;

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
  /** Most triangles of figures in view, before the far blocks are coarsened. */
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
  /** Chunks in view per level of detail. */
  lods: number[];
}

/** What the depth pass of the shadows reads from a figure mesh (see material.ts). */
const DEPTH_ATTRIBUTES = ["position", "aBoneIndex", "aBoneWeight"] as const;
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
  for (let v = 0; v < count; v++) {
    let key = "";
    for (const source of sources) {
      for (let c = 0; c < source.itemSize; c++) key += `${source.array[v * source.itemSize + c]},`;
    }
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
    const { array, itemSize, normalized } = sources[a];
    const out = new Float32Array(kept.length * itemSize);
    kept.forEach((v, i) => {
      for (let c = 0; c < itemSize; c++) out[i * itemSize + c] = array[v * itemSize + c];
    });
    geometry.setAttribute(name, new BufferAttribute(out, itemSize, normalized));
  });
  const triangles = kept.length < 65536 ? new Uint16Array(index.count) : new Uint32Array(index.count);
  for (let i = 0; i < index.count; i++) triangles[i] = merged[index.getX(i)];
  geometry.setIndex(new BufferAttribute(triangles, 1));
  depthGeometries.set(base, geometry);
  return geometry;
}

class Chunk {
  readonly posYaw: InstancedBufferAttribute;
  readonly anim: InstancedBufferAttribute;
  readonly seed: InstancedBufferAttribute;
  readonly strike: InstancedBufferAttribute;
  readonly sphere = new Sphere();
  readonly display: InstancedBufferGeometry[];
  readonly shadow: InstancedBufferGeometry[];
  readonly mesh: Mesh;
  readonly shadowMesh: Mesh;
  drawn = 0;
  lod = 2;
  /** From the camera to the nearest figure drawn, metres. */
  distance = 0;
  inView = false;

  constructor(
    readonly first: number,
    readonly count: number,
    readonly model: UnitModel,
    private readonly materials: FigureMaterials,
  ) {
    this.posYaw = new InstancedBufferAttribute(new Float32Array(count * 4), 4);
    this.anim = new InstancedBufferAttribute(new Float32Array(count * 4), 4);
    this.seed = new InstancedBufferAttribute(new Float32Array(count), 1);
    // Per figure: seconds into its blow (-1: none), and how far it has put away what it stows to fight.
    const strike = new Float32Array(count * 2);
    for (let k = 0; k < count; k++) strike[k * 2] = -1;
    this.strike = new InstancedBufferAttribute(strike, 2);
    for (const attribute of [this.posYaw, this.anim, this.seed, this.strike]) {
      attribute.setUsage(DynamicDrawUsage);
    }
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
      geometry.boundingSphere = this.sphere;
      geometry.instanceCount = 0;
      return geometry;
    };
    this.display = model.lods.map((lod) => instanced(lod.geometry));
    // Shadows are drawn from LOD1 and LOD2 only (see setLod).
    this.shadow = model.lods.map((lod, level) => instanced(level === 0 ? lod.geometry : depthGeometry(lod.geometry)));

    this.mesh = new Mesh(this.display[2], materials.material);
    this.mesh.receiveShadow = true;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.renderOrder = FIGURE_ORDER;

    // Shadows come from a coarser mesh than the one on screen. This second
    // mesh stands on SHADOW_LAYER, which only the camera of the shadow map
    // sees, so the main pass does not even set it up; it gets its instances
    // only while the shadow map is drawn.
    this.shadowMesh = new Mesh(this.shadow[2], materials.material);
    this.shadowMesh.layers.set(SHADOW_LAYER);
    this.shadowMesh.customDepthMaterial = materials.depthMaterial;
    this.shadowMesh.castShadow = true;
    this.shadowMesh.matrixAutoUpdate = false;
    this.shadowMesh.onBeforeShadow = (_renderer, _scene, _camera, _shadowCamera, geometry) => {
      (geometry as InstancedBufferGeometry).instanceCount = this.drawn;
    };
    this.shadowMesh.onAfterShadow = (_renderer, _scene, _camera, _shadowCamera, geometry) => {
      (geometry as InstancedBufferGeometry).instanceCount = 0;
    };
  }

  setLod(lod: number, settings: LodSettings): void {
    const { shadows, detailedLods } = settings;
    this.lod = lod;
    this.mesh.geometry = this.display[lod];
    this.mesh.material =
      lod < detailedLods && this.materials.detailed ? this.materials.detailed : this.materials.material;
    this.mesh.visible = this.drawn > 0;
    this.shadowMesh.geometry = this.shadow[lod === 0 ? 1 : 2];
    this.shadowMesh.visible = shadows && this.drawn > 0;
  }

  get detailedMaterial(): FigureMaterials["detailed"] {
    return this.materials.detailed;
  }

  /**
   * Measures `distance`: to the nearest figure, not to the middle of the
   * chunk, which for a loose screen of skirmishers may lie half a kilometre
   * off while some of its men stand at the camera's feet.
   */
  measureDistance(camera: Vector3): void {
    const posYaw = this.posYaw.array as Float32Array;
    let nearest = Infinity;
    for (let o = 0; o < this.drawn * 4; o += 4) {
      const dx = posYaw[o] - camera.x;
      const dy = posYaw[o + 1] - camera.y;
      const dz = posYaw[o + 2] - camera.z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < nearest) nearest = d;
    }
    this.distance = Math.max(Math.sqrt(nearest), 1);
  }

  dispose(): void {
    for (const geometry of [...this.display, ...this.shadow]) geometry.dispose();
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

  constructor(
    readonly track: UnitTrack,
    readonly model: UnitModel,
    materials: FigureMaterials,
    private readonly color: Color,
    group: Group,
    /** Blocks with different numbers are enemies. */
    readonly side = 0,
  ) {
    this.offX = new Float32Array(track.count);
    this.offY = new Float32Array(track.count);
    this.stowed = new Float32Array(track.count);
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
    const chunkCount = Math.ceil(track.count / CHUNK_SIZE);
    for (let c = 0; c < chunkCount; c++) {
      const first = Math.floor((c * track.count) / chunkCount);
      const end = Math.floor(((c + 1) * track.count) / chunkCount);
      const chunk = new Chunk(first, end - first, model, materials);
      this.chunks.push(chunk);
      group.add(chunk.mesh, chunk.shadowMesh);
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
  update(time: number, clock: number, now: number, march: March, heightAt: HeightAt): void {
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
    const pace = current.speed * MAX_RATE[current.clip];
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

    for (const chunk of this.chunks) {
      const posYaw = chunk.posYaw.array as Float32Array;
      const anim = chunk.anim.array as Float32Array;
      const seed = chunk.seed.array as Float32Array;
      const strike = chunk.strike.array as Float32Array;
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
        if (figures !== null && status !== DYING) {
          opponent = figures.opponent[i];
          if (opponent !== -1) {
            wantX = figures.offsetX[i];
            wantY = figures.offsetY[i];
          }
        }
        let ox = offX[i];
        let oy = offY[i];
        // The fallen lie where they fought; after a jump, in their files.
        if ((ox !== wantX || oy !== wantY) && (status !== DYING || snap)) {
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
          // At the head of a file in a fight hand to hand: put away. The fallen keep what they had.
          let away = stowed[i];
          if (status !== DYING) {
            const want = stows && track.head[i] === 1 ? 1 : 0;
            if (away !== want) {
              if (snap) away = want;
              else away = want > away ? Math.min(away + stowStep, want) : Math.max(away - stowStep, want);
              stowed[i] = away;
            }
          }
          strike[n * 2 + 1] = away;
        }
        if (status === DYING) {
          const since = track.since[i];
          anim[o] = DIE;
          anim[o + 1] = DIE;
          anim[o + 2] = 0;
          anim[o + 3] = since;
          strike[n * 2] = -1;
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
          if (opponent !== -1 && figures !== null) {
            // Hand to hand: facing his enemy.
            target = Math.min(Math.max(angleDelta(heading, figures.bearing[i]), -FIGHT_TURN), FIGHT_TURN);
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
            const stride = step * reach;
            walked[i] += forward < -0.5 * step ? -stride : stride;
            moved += step;
          }
          lastX[i] = x;
          lastY[i] = north;
          // What the legs do: as the block, or the figure's own steps in a
          // block that stands (see STEP_FROM).
          const from = acts ? fromActing : fromRest;
          let to = acts ? this.toActing : this.toRest;
          let mix = weight;
          if (ownLegs) {
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
          if (blows !== null) {
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
          strike[n * 2] = into;
        }
        posYaw[o] = x;
        posYaw[o + 1] = y;
        posYaw[o + 2] = z;
        // A fallen figure keeps the turn it had when it fell.
        posYaw[o + 3] = Math.PI - (track.heading[i] + turn[i]);
        seed[n] = track.seed[i];
        n++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      chunk.drawn = n;
      for (const geometry of chunk.display) geometry.instanceCount = n;
      chunk.mesh.visible = n > 0;
      if (n === 0) continue;
      for (const attribute of [chunk.posYaw, chunk.anim, chunk.seed, chunk.strike]) {
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0, n * attribute.itemSize);
        attribute.needsUpdate = true;
      }
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
    this.footprint.visible = this.standing > 0;
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
   * with the daylight (it is a flat colour that takes no light).
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
    this.footprintMaterial.opacity = 0.1 + 0.42 * far;
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
  private readonly ordered: Chunk[] = [];
  private readonly march: March = { step: 0, halted: true, jumped: false };
  private lastNow = NaN;
  private lastClock = NaN;
  private melee: Melee | null = null;
  private blows: Blows | null = null;

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
    for (const block of this.blocks) block.update(time, clock, now, march, heightAt);
  }

  /**
   * Picks a level of detail for every chunk from its size on screen, then
   * coarsens the farthest chunks until the triangles in view fit the budget.
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
    let triangles = 0;
    this.ordered.length = 0;

    for (const block of this.blocks) {
      counts.standing += block.standing;
      const height = block.model.height * FIGURE_SCALE;
      for (const chunk of block.chunks) {
        if (chunk.drawn === 0) {
          chunk.inView = false;
          chunk.setLod(chunk.lod, settings);
          continue;
        }
        chunk.inView = frustum.intersectsSphere(chunk.sphere);
        chunk.measureDistance(camera.position);
        const pixels = (height * pixelsPerMetreAtOne) / chunk.distance;
        // A little hysteresis, so a chunk on a threshold does not flicker.
        const keep = 0.88;
        let lod = 2;
        if (pixels > settings.lod0Pixels * (chunk.lod === 0 ? keep : 1)) lod = 0;
        else if (pixels > settings.lod1Pixels * (chunk.lod <= 1 ? keep : 1)) lod = 1;
        chunk.lod = lod;
        if (chunk.inView) {
          this.ordered.push(chunk);
          triangles += chunk.drawn * block.model.lods[lod].triangles;
        }
      }
      block.setFootprintLook(camera.position, pixelsPerMetreAtOne, daylight);
    }

    if (triangles > settings.triangleBudget) {
      this.ordered.sort((a, b) => b.distance - a.distance);
      for (let pass = 0; pass < 2 && triangles > settings.triangleBudget; pass++) {
        for (const chunk of this.ordered) {
          if (triangles <= settings.triangleBudget) break;
          if (chunk.lod >= 2) continue;
          const lods = chunk.model.lods;
          triangles -= chunk.drawn * (lods[chunk.lod].triangles - lods[chunk.lod + 1].triangles);
          chunk.lod++;
        }
      }
    }

    for (const chunk of this.chunks) {
      if (chunk.drawn === 0) continue;
      chunk.setLod(chunk.lod, settings);
      if (chunk.inView) {
        counts.drawn += chunk.drawn;
        counts.lods[chunk.lod]++;
      }
    }
    return counts;
  }

  /**
   * Meshes that show every material a chunk may switch to, for compiling the
   * shaders up front: otherwise the first zoom onto a block would stall
   * while the detailed material compiles. Remove them once compiled.
   */
  warmUpMeshes(): Mesh[] {
    const meshes: Mesh[] = [];
    const seen = new Set<unknown>();
    for (const chunk of this.chunks) {
      for (const material of [chunk.mesh.material, chunk.detailedMaterial]) {
        if (!material || seen.has(material)) continue;
        seen.add(material);
        for (const geometry of chunk.display) {
          const mesh = new Mesh(geometry, material);
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
  }
}
