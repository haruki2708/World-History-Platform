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
  DynamicDrawUsage,
  Frustum,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Sphere,
  Vector3,
} from "three";
import type { FigureMaterials } from "./figures/material";
import { CLIP_INDEX, type UnitModel } from "./figures/model";
import type { HeightAt } from "./terrain";
import { DYING, formationPoint, GONE, type UnitTrack } from "./timeline";

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
 * - Walk turns into run where both clips are stretched by the same factor,
 *   the geometric mean of the two speeds (7.2 m/s), with GAIT_SLACK either
 *   way so a block on the threshold does not flicker (run above 8.0 m/s,
 *   walk again below 6.5 m/s).
 * - The clips play at the speed that matches the ground covered, up to
 *   MAX_WALK_RATE and MAX_RUN_RATE times their own (8.9 and 26.6 m/s). A
 *   battle is shown many times faster than it was fought, so blocks can
 *   move faster than that; the legs then keep the fastest pace that still
 *   looks like running, and the feet slide.
 */
const MOVE_START = 0.12;
const MOVE_STOP = 0.06;
const GAIT_SLACK = 0.1;
const MAX_WALK_RATE = 3;
const MAX_RUN_RATE = 1.5;
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
const ATTACK = CLIP_INDEX.attack;
const DIE = CLIP_INDEX.die;

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

class Chunk {
  readonly posYaw: InstancedBufferAttribute;
  readonly anim: InstancedBufferAttribute;
  readonly seed: InstancedBufferAttribute;
  readonly sphere = new Sphere();
  readonly display: InstancedBufferGeometry[];
  readonly shadow: InstancedBufferGeometry[];
  readonly mesh: Mesh;
  readonly shadowMesh: Mesh;
  drawn = 0;
  lod = 2;
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
    for (const attribute of [this.posYaw, this.anim, this.seed]) {
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
      geometry.boundingSphere = this.sphere;
      geometry.instanceCount = 0;
      return geometry;
    };
    this.display = model.lods.map((lod) => instanced(lod.geometry));
    this.shadow = model.lods.map((lod) => instanced(lod.geometry));

    this.mesh = new Mesh(this.display[2], materials.material);
    this.mesh.receiveShadow = true;
    this.mesh.matrixAutoUpdate = false;

    // Shadows come from a coarser mesh than the one on screen. This second
    // mesh has no instances in the main pass and gets them only while the
    // shadow map is drawn.
    this.shadowMesh = new Mesh(this.shadow[2], materials.material);
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

  dispose(): void {
    for (const geometry of [...this.display, ...this.shadow]) geometry.dispose();
  }
}

const FOOT_U = 24;
const FOOT_V = 2;
const point = { x: 0, y: 0 };

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
  /** IDLE, WALK or RUN: what the legs of the block do. */
  private gait = IDLE;
  /** Ground speed of the block, metres per second of real time, smoothed. */
  private speed = 0;
  /** Where each figure stood in the last frame, to measure its step. */
  private readonly lastX: Float32Array;
  private readonly lastY: Float32Array;
  private placed = false;
  /** Ground each figure has covered on foot, metres: the phase of its stride. */
  private readonly walked: Float32Array;
  private lastTime = NaN;
  private lastBlend = NaN;
  private readonly center = new Vector3();

  constructor(
    readonly track: UnitTrack,
    readonly model: UnitModel,
    materials: FigureMaterials,
    private readonly color: Color,
    group: Group,
  ) {
    this.lastX = new Float32Array(track.count);
    this.lastY = new Float32Array(track.count);
    this.walked = new Float32Array(track.count);
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
    this.footprintMaterial = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    this.footprint = new Mesh(geometry, this.footprintMaterial);
    this.footprint.renderOrder = 2;
    this.footprint.matrixAutoUpdate = false;
    group.add(this.footprint);
  }

  /**
   * Moves the figures to where they stand at `time`. `now` is wall-clock
   * seconds. `march` says how the battle clock got here: figures step only
   * while it runs, and stand at ease when it is stopped or jumps.
   */
  update(time: number, now: number, march: March, heightAt: HeightAt): void {
    const { track, model } = this;
    if (march.halted) {
      this.speed = 0;
      this.gait = IDLE;
    } else {
      this.gait = this.pickGait();
    }
    // In a fight the front ranks strike; everyone else keeps pace with the block.
    const acting = track.actionAt(time) === "fight" ? ATTACK : this.gait;
    if (acting !== this.toActing || this.gait !== this.toRest) {
      this.fromActing = this.toActing;
      this.fromRest = this.toRest;
      this.toActing = acting;
      this.toRest = this.gait;
      this.blendStart = Number.isNaN(this.lastTime) ? -Infinity : now;
    }
    const blend = Math.min((now - this.blendStart) / BLEND_SECONDS, 1);
    if (time === this.lastTime && blend === this.lastBlend) return;
    this.lastTime = time;
    this.lastBlend = blend;

    // The fallen stay where they fell for the rest of the battle: the die
    // clip plays once and holds its last frame. Without a die clip a figure
    // that falls is simply no longer drawn.
    this.standing = track.sample(time, model.hasDie ? Infinity : 0);
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
    const pace = this.gait === RUN ? this.runSpeed * MAX_RUN_RATE : this.walkSpeed * MAX_WALK_RATE;
    const reach = this.speed > pace ? pace / this.speed : 1;
    const { lastX, lastY, walked } = this;
    let moved = 0;
    let movers = 0;

    for (const chunk of this.chunks) {
      const posYaw = chunk.posYaw.array as Float32Array;
      const anim = chunk.anim.array as Float32Array;
      const seed = chunk.seed.array as Float32Array;
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
        const x = track.x[i];
        const north = track.y[i];
        const z = -north;
        const y = heightAt(x, north);
        const o = n * 4;
        if (status === DYING) {
          const since = track.since[i];
          anim[o] = DIE;
          anim[o + 1] = DIE;
          anim[o + 2] = 0;
          anim[o + 3] = since;
        } else {
          if (stepping) {
            const dx = x - lastX[i];
            const dy = north - lastY[i];
            const step = Math.hypot(dx, dy);
            if (step > 0) {
              // Giving ground while facing the enemy: the stride runs backwards.
              const heading = track.heading[i];
              const forward = dx * Math.sin(heading) + dy * Math.cos(heading);
              const stride = step * reach;
              walked[i] += forward < -0.5 * step ? -stride : stride;
              moved += step;
            }
            movers++;
          }
          lastX[i] = x;
          lastY[i] = north;
          // In a fight only the front ranks strike; the rest wait their turn.
          const acts = track.rank[i] <= 0.34 || track.seed[i] <= 0.2;
          anim[o] = acts ? fromActing : fromRest;
          anim[o + 1] = acts ? this.toActing : this.toRest;
          anim[o + 2] = weight;
          anim[o + 3] = walked[i];
        }
        posYaw[o] = x;
        posYaw[o + 1] = y;
        posYaw[o + 2] = z;
        posYaw[o + 3] = Math.PI - track.heading[i];
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
      for (const attribute of [chunk.posYaw, chunk.anim, chunk.seed]) {
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0, n * attribute.itemSize);
        attribute.needsUpdate = true;
      }
      chunk.sphere.center.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
      chunk.sphere.radius =
        Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + figureHeight * 1.2;
    }

    this.placed = true;
    if (march.step > 0) {
      const measured = movers > 0 ? moved / movers / march.step : 0;
      this.speed += (measured - this.speed) * (1 - Math.exp(-march.step / SPEED_SMOOTHING));
    }

    this.updateFootprint(time, heightAt);
  }

  /** Natural ground speeds of the clips at the size figures are drawn, m/s. */
  private get walkSpeed(): number {
    const { walk } = this.model.gait;
    return (walk.metres / walk.seconds) * FIGURE_SCALE;
  }

  private get runSpeed(): number {
    const { run } = this.model.gait;
    return (run.metres / run.seconds) * FIGURE_SCALE;
  }

  /** Idle, walk or run for the speed measured, with slack around each threshold. */
  private pickGait(): number {
    const { speed, gait } = this;
    const walk = this.walkSpeed;
    if (speed < walk * (gait === IDLE ? MOVE_START : MOVE_STOP)) return IDLE;
    if (!this.model.hasRun) return WALK;
    const change = Math.sqrt(walk * this.runSpeed);
    if (gait === RUN) return speed < change * (1 - GAIT_SLACK) ? WALK : RUN;
    if (gait === WALK) return speed > change * (1 + GAIT_SLACK) ? RUN : WALK;
    return speed > change ? RUN : WALK;
  }

  private updateFootprint(time: number, heightAt: HeightAt): void {
    this.footprint.visible = this.standing > 0;
    if (!this.footprint.visible) return;
    const formation = this.track.formationAt(time);
    const position = this.footprint.geometry.attributes.position as BufferAttribute;
    const margin = 3 * FIGURE_SCALE;
    const wide = 1 + (2 * margin) / formation.frontage;
    const deep = 1 + (2 * margin) / formation.depth;
    let k = 0;
    for (let i = 0; i <= FOOT_U; i++) {
      for (let j = 0; j <= FOOT_V; j++) {
        const u = (i / FOOT_U - 0.5) * wide;
        const v = (j / FOOT_V - 0.5) * deep + 0.5;
        formationPoint(formation, u, v, point);
        position.setXYZ(k++, point.x, heightAt(point.x, point.y) + 0.3, -point.y);
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
    const distance = Math.max(cameraPosition.distanceTo(this.center), 1);
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
}

const frustum = new Frustum();
const projection = new Matrix4();

export class Crowd {
  readonly group = new Group();
  readonly blocks: UnitBlock[] = [];
  private readonly chunks: Chunk[] = [];
  private readonly ordered: Chunk[] = [];
  private readonly march: March = { step: 0, halted: true };
  private lastNow = NaN;
  private lastClock = NaN;

  add(block: UnitBlock): void {
    this.blocks.push(block);
    this.chunks.push(...block.chunks);
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
    for (const block of this.blocks) block.update(time, now, march, heightAt);
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
      block.setFootprintLook(camera.position, pixelsPerMetreAtOne, daylight);
      const height = block.model.height * FIGURE_SCALE;
      for (const chunk of block.chunks) {
        if (chunk.drawn === 0) {
          chunk.inView = false;
          chunk.setLod(chunk.lod, settings);
          continue;
        }
        const sphere = chunk.sphere;
        chunk.inView = frustum.intersectsSphere(sphere);
        chunk.distance = Math.max(camera.position.distanceTo(sphere.center) - sphere.radius * 0.7, 1);
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

  dispose(): void {
    for (const block of this.blocks) block.dispose();
    this.blocks.length = 0;
    this.chunks.length = 0;
  }
}
