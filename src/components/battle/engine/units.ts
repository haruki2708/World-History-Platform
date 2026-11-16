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
import type { UnitAction, UnitClip } from "@/lib/battle";
import type { FigureMaterials } from "./figures/material";
import { CLIP_INDEX, type UnitModel } from "./figures/model";
import type { HeightAt } from "./terrain";
import { ALIVE, DYING, formationPoint, GONE, type UnitTrack } from "./timeline";

/**
 * Figures are drawn larger than life: one figure stands for twenty men, and
 * at true size a block seen from across the field would be a few faint dots.
 */
export const FIGURE_SCALE = 3;

/** Most figures in one chunk (one draw call). */
const CHUNK_SIZE = 256;
/** Seconds of playback a fallen figure lies on the ground, then sinks away. */
const LIE_SECONDS = 5;
const SINK_SECONDS = 1.5;
/** Seconds to blend from one clip to the next. */
const BLEND_SECONDS = 0.35;

const ACTION_CLIP: Record<UnitAction, UnitClip> = {
  stand: "idle",
  advance: "walk",
  charge: "run",
  fight: "attack",
  retreat: "walk",
  rout: "run",
  pursue: "run",
};

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
    materials: FigureMaterials,
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

  setLod(lod: number, shadows: boolean): void {
    this.lod = lod;
    this.mesh.geometry = this.display[lod];
    this.mesh.visible = this.drawn > 0;
    this.shadowMesh.geometry = this.shadow[lod === 0 ? 1 : 2];
    this.shadowMesh.visible = shadows && this.drawn > 0;
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
  private clipFrom = IDLE;
  private clipTo = IDLE;
  private blendStart = -Infinity;
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
   * Moves the figures to where they stand at `time`. `playing` is false
   * while the battle clock is stopped: marching units then stand at ease
   * instead of walking on the spot. `now` is wall-clock seconds.
   */
  update(time: number, playing: boolean, now: number, heightAt: HeightAt): void {
    let clip = CLIP_INDEX[ACTION_CLIP[this.track.actionAt(time)]];
    if (!playing && (clip === WALK || clip === RUN)) clip = IDLE;
    if (clip !== this.clipTo) {
      this.clipFrom = this.clipTo;
      this.clipTo = clip;
      this.blendStart = Number.isNaN(this.lastTime) ? -Infinity : now;
    }
    const blend = Math.min((now - this.blendStart) / BLEND_SECONDS, 1);
    if (time === this.lastTime && blend === this.lastBlend) return;
    this.lastTime = time;
    this.lastBlend = blend;

    const { track, model } = this;
    const fallSeconds = model.dieSeconds + LIE_SECONDS;
    this.standing = track.sample(time, model.hasDie ? fallSeconds + SINK_SECONDS : 0);
    const figureHeight = model.height * FIGURE_SCALE;
    const from = blend >= 1 ? this.clipTo : this.clipFrom;
    const to = this.clipTo;
    const weight = blend >= 1 ? 0 : blend;

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
        const z = -track.y[i];
        let y = heightAt(x, track.y[i]);
        const o = n * 4;
        if (status === DYING) {
          const since = track.since[i];
          if (since > fallSeconds) y -= ((since - fallSeconds) / SINK_SECONDS) * figureHeight * 0.5;
          anim[o] = DIE;
          anim[o + 1] = DIE;
          anim[o + 2] = 0;
          anim[o + 3] = since;
        } else {
          // In a fight only the front ranks strike; the rest wait their turn.
          const waits = status === ALIVE && track.rank[i] > 0.34 && track.seed[i] > 0.2;
          anim[o] = from === ATTACK && waits ? IDLE : from;
          anim[o + 1] = to === ATTACK && waits ? IDLE : to;
          anim[o + 2] = weight;
          anim[o + 3] = 0;
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

    this.updateFootprint(time, heightAt);
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

const frustum = new Frustum();
const projection = new Matrix4();

export class Crowd {
  readonly group = new Group();
  readonly blocks: UnitBlock[] = [];
  private readonly chunks: Chunk[] = [];
  private readonly ordered: Chunk[] = [];

  add(block: UnitBlock): void {
    this.blocks.push(block);
    this.chunks.push(...block.chunks);
  }

  update(time: number, playing: boolean, now: number, heightAt: HeightAt): void {
    for (const block of this.blocks) block.update(time, playing, now, heightAt);
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
          chunk.setLod(chunk.lod, settings.shadows);
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
      chunk.setLod(chunk.lod, settings.shadows);
      if (chunk.inView) {
        counts.drawn += chunk.drawn;
        counts.lods[chunk.lod]++;
      }
    }
    return counts;
  }

  dispose(): void {
    for (const block of this.blocks) block.dispose();
    this.blocks.length = 0;
    this.chunks.length = 0;
  }
}
