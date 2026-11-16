/**
 * A unit model ready for crowds. Whatever the source (a .glb file or the
 * built-in placeholder), it arrives here as skinned meshes, a skeleton and
 * animation clips, and leaves as:
 *
 * - one plain geometry per level of detail, carrying bone indices and weights;
 * - one float texture holding every bone matrix of every frame of every clip
 *   (a row per frame, three texels per bone).
 *
 * The vertex shader then skins each figure on the graphics card from that
 * texture, so thousands of figures animate without any per-frame CPU work.
 */

import {
  AnimationClip,
  AnimationMixer,
  type Bone,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  FloatType,
  LoopOnce,
  Matrix3,
  Matrix4,
  NearestFilter,
  type Object3D,
  RGBAFormat,
  type SkinnedMesh,
  type Texture,
  Vector3,
  Vector4,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { UNIT_CLIPS, UNIT_LODS, type UnitClip } from "@/lib/battle";

/** Clip indices as the shader knows them: the order of UNIT_CLIPS. */
export const CLIP_INDEX = Object.fromEntries(
  UNIT_CLIPS.map((name, index) => [name, index]),
) as Record<UnitClip, number>;

const LOOPING: Record<UnitClip, boolean> = {
  idle: true,
  walk: true,
  run: true,
  attack: true,
  die: false,
};

/** Frames per second baked into the texture. */
const BAKE_FPS = 30;
/** No more than this many frames in total; longer clip sets bake at a lower rate. */
const MAX_FRAMES = 2048;

/** One cycle of a walk or run clip: how long it lasts and how far it carries the figure. */
export interface GaitCycle {
  seconds: number;
  /** Ground covered in one cycle, metres, at the size of the model. */
  metres: number;
}

/**
 * Ground covered by one cycle of the walk and run clips, metres, for a model
 * whose stride cannot be measured (see plantedStride): what the clips of the
 * shared animation library measure on the Roman models.
 */
const FALLBACK_STRIDES = { walk: 1.3, run: 5.5 };
/** Sole vertices: this close to the lowest point of the bind pose, metres. */
const SOLE_HEIGHT = 0.03;
/** No more sole vertices than this are followed. */
const SOLE_SAMPLES = 240;
/** A sole this close to the lowest point of the clip is on the ground, metres. */
const GROUND_REACH = 0.02;

export interface FigureLod {
  geometry: BufferGeometry;
  triangles: number;
}

export interface UnitModel {
  name: string;
  /** True for the built-in stand-in, false for a model file. */
  placeholder: boolean;
  /** Always UNIT_LODS.length entries; a missing level reuses its neighbour. */
  lods: FigureLod[];
  boneTexture: DataTexture;
  /** Per UNIT_CLIPS entry: first row, frame count, frames per second, loops (1/0). */
  clipTable: Vector4[];
  hasDie: boolean;
  dieSeconds: number;
  /** False when the model has no run clip and the scene plays walk instead. */
  hasRun: boolean;
  /** The walk and run cycles, for matching the legs to the ground speed. */
  gait: { walk: GaitCycle; run: GaitCycle };
  /** Height of the figure in its bind pose, metres. */
  height: number;
  /** Base colour texture, if the model has one. */
  map: Texture | null;
  /**
   * Normal and roughness-metalness maps for the detailed material of close
   * figures, or null when the model has none (placeholders, simple files).
   */
  surface: ModelSurface | null;
  /** Draw both faces of every triangle (cloaks, crests). */
  doubleSided: boolean;
  dispose(): void;
}

/** The maps of a model file beyond its colour, as the file gives them. */
export interface SurfaceMaps {
  normalMap: Texture | null;
  /** glTF normalTexture.scale. */
  normalStrength: number;
  /** roughnessMap and metalnessMap are one glTF texture: G roughness, B metalness. */
  roughnessMap: Texture | null;
  metalnessMap: Texture | null;
  /** Factors that multiply the maps (glTF roughnessFactor, metallicFactor). */
  roughness: number;
  metalness: number;
}

export interface ModelSurface extends SurfaceMaps {
  /**
   * normalScale for three.js: y is negated when the geometry carries no
   * tangents and the shader derives the tangent frame from the uv.
   */
  normalScale: [number, number];
}

export interface SkinnedSource {
  name: string;
  placeholder: boolean;
  /** The object the clips animate; holds the bones. */
  root: Object3D;
  /**
   * By UNIT_LODS index: the meshes of that level (several when the level was
   * exported in pieces, none when the level is missing). One level at least
   * has a mesh.
   */
  lods: SkinnedMesh[][];
  clips: AnimationClip[];
  map: Texture | null;
  surface?: SurfaceMaps | null;
  doubleSided?: boolean;
  /** Frees whatever the source loaded (textures of a .glb, for instance). */
  release?: () => void;
}

/** "Armature|walk" and "Walk" both mean the clip "walk". */
function clipKey(name: string): string {
  const parts = name.toLowerCase().split(/[|:./\\]/);
  return parts[parts.length - 1].trim();
}

export function buildUnitModel(source: SkinnedSource): UnitModel {
  source.root.updateMatrixWorld(true);

  // Tangents from the file give the best normal mapping, but only if every
  // level has them: one material serves all levels, and its normalScale
  // must match the way the shader finds the tangent frame.
  const surface = source.surface ?? null;
  const tangents =
    surface?.normalMap != null &&
    source.lods.every((meshes) => meshes.every((mesh) => mesh.geometry.attributes.tangent !== undefined));

  // One bone list for all levels, in case they came with separate skins.
  const bones: Bone[] = [];
  const inverses: Matrix4[] = [];
  const prepared = source.lods.map((meshes) => {
    if (meshes.length === 0) return null;
    const pieces = meshes.map((mesh) => {
      const remap = mesh.skeleton.bones.map((bone, j) => {
        let index = bones.indexOf(bone);
        if (index === -1) {
          index = bones.length;
          bones.push(bone);
          inverses.push(mesh.skeleton.boneInverses[j]);
        }
        return index;
      });
      return prepareGeometry(mesh, remap, tangents);
    });
    let geometry = pieces[0];
    if (pieces.length > 1) {
      geometry = mergeGeometries(pieces);
      for (const piece of pieces) piece.dispose();
    }
    return { geometry, triangles: (geometry.index?.count ?? 0) / 3 };
  });
  const lods: FigureLod[] = UNIT_LODS.map((_, level) => {
    for (let reach = 0; reach < UNIT_LODS.length; reach++) {
      const found = prepared[level - reach] ?? prepared[level + reach];
      if (found) return found;
    }
    throw new Error(`Unit model ${source.name} has no mesh.`);
  });

  // Clips by contract name, with the fallbacks of the contract.
  const byName = new Map<string, AnimationClip>();
  for (const clip of source.clips) {
    const key = clipKey(clip.name);
    if (!byName.has(key)) byName.set(key, clip);
  }
  const idle = byName.get("idle") ?? byName.get("walk") ?? source.clips[0] ?? null;
  const walk = byName.get("walk") ?? idle;
  const chosen: Record<UnitClip, AnimationClip | null> = {
    idle,
    walk,
    run: byName.get("run") ?? walk,
    attack: byName.get("attack") ?? idle,
    die: byName.get("die") ?? null,
  };

  // Bake each distinct clip once. Without any clip, bake the rest pose.
  const rest = new AnimationClip("rest", 1 / BAKE_FPS, []);
  const distinct = [...new Set(UNIT_CLIPS.map((name) => chosen[name] ?? rest))];
  const loops = new Map<AnimationClip, boolean>();
  for (const name of UNIT_CLIPS) {
    const clip = chosen[name] ?? rest;
    loops.set(clip, (loops.get(clip) ?? false) || LOOPING[name]);
  }
  const seconds = distinct.reduce((sum, clip) => sum + Math.max(clip.duration, 0), 0);
  const fps = Math.max(Math.min(BAKE_FPS, Math.floor((MAX_FRAMES - distinct.length * 2) / Math.max(seconds, 0.001))), 1);
  const frameCount = (clip: AnimationClip) =>
    Math.max(Math.round(clip.duration * fps) + (loops.get(clip) ? 0 : 1), 1);
  const totalFrames = distinct.reduce((sum, clip) => sum + frameCount(clip), 0);

  const width = bones.length * 3;
  const data = new Float32Array(width * totalFrames * 4);
  const firstRow = new Map<AnimationClip, number>();
  const mixer = new AnimationMixer(source.root);
  const matrix = new Matrix4();
  const translation = new Vector3();
  let row = 0;

  const writeRow = (target: number) => {
    source.root.updateMatrixWorld(true);
    for (let b = 0; b < bones.length; b++) {
      matrix.multiplyMatrices(bones[b].matrixWorld, inverses[b]);
      const e = matrix.elements;
      const o = (target * width + b * 3) * 4;
      // Three texels: the rows of the 3×4 matrix.
      data.set([e[0], e[4], e[8], e[12], e[1], e[5], e[9], e[13], e[2], e[6], e[10], e[14]], o);
    }
  };

  for (const clip of distinct) {
    const frames = frameCount(clip);
    const looping = loops.get(clip) ?? false;
    const action = mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    firstRow.set(clip, row);
    // Set the clip time directly: stepping the mixer would stop at the end.
    const pose = (time: number) => {
      action.time = time;
      mixer.update(0);
    };

    // A walk exported with root motion would drift away from its slot:
    // measure how far the root travels over the loop and take it back out.
    let driftX = 0;
    let driftZ = 0;
    if (looping && bones.length > 0 && clip.duration > 0) {
      pose(0);
      source.root.updateMatrixWorld(true);
      translation.setFromMatrixPosition(bones[0].matrixWorld);
      const startX = translation.x;
      const startZ = translation.z;
      pose(clip.duration);
      source.root.updateMatrixWorld(true);
      translation.setFromMatrixPosition(bones[0].matrixWorld);
      driftX = translation.x - startX;
      driftZ = translation.z - startZ;
      if (Math.hypot(driftX, driftZ) < 0.25) {
        driftX = 0;
        driftZ = 0;
      }
    }

    for (let f = 0; f < frames; f++) {
      pose(Math.min(f / fps, clip.duration));
      writeRow(row);
      if (driftX !== 0 || driftZ !== 0) {
        const back = Math.min(f / fps / clip.duration, 1);
        for (let b = 0; b < bones.length; b++) {
          const o = (row * width + b * 3) * 4;
          data[o + 3] -= driftX * back;
          data[o + 11] -= driftZ * back;
        }
      }
      row++;
    }
    action.stop();
    mixer.uncacheAction(clip);
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(source.root);

  const boneTexture = new DataTexture(data, width, totalFrames, RGBAFormat, FloatType);
  boneTexture.minFilter = NearestFilter;
  boneTexture.magFilter = NearestFilter;
  boneTexture.generateMipmaps = false;
  boneTexture.needsUpdate = true;

  const clipTable = UNIT_CLIPS.map((name) => {
    const clip = chosen[name] ?? chosen.idle ?? rest;
    return new Vector4(firstRow.get(clip) ?? 0, frameCount(clip), fps, LOOPING[name] ? 1 : 0);
  });

  lods[0].geometry.computeBoundingBox();
  const height = Math.max(lods[0].geometry.boundingBox?.max.y ?? 1.8, 0.5);
  // How far one cycle of walk and run carries the figure, read off the
  // baked clips themselves (without a run clip, run is the walk clip).
  const gaitOf = (name: "walk" | "run"): GaitCycle => {
    const clip = chosen[name];
    const frames = clip ? frameCount(clip) : 1;
    const measured = clip
      ? plantedStride(lods[0].geometry, data, width, firstRow.get(clip) ?? 0, frames, fps)
      : 0;
    const fallback = name === "run" && chosen.run === chosen.walk ? "walk" : name;
    return {
      seconds: Math.max(frames / fps, 0.05),
      metres: measured > 0.05 ? measured : FALLBACK_STRIDES[fallback],
    };
  };
  const geometries = new Set(lods.map((lod) => lod.geometry));

  return {
    name: source.name,
    placeholder: source.placeholder,
    lods,
    boneTexture,
    clipTable,
    hasDie: chosen.die !== null,
    dieSeconds: chosen.die?.duration ?? 0,
    hasRun: chosen.run !== chosen.walk,
    gait: { walk: gaitOf("walk"), run: gaitOf("run") },
    height,
    map: source.map,
    surface: surface && {
      ...surface,
      normalScale: [surface.normalStrength, tangents ? surface.normalStrength : -surface.normalStrength],
    },
    doubleSided: source.doubleSided ?? false,
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      boneTexture.dispose();
      source.release?.();
    },
  };
}

/**
 * The ground one cycle of a walk or run clip covers, in metres, measured on
 * the baked frames: while a foot (or a hoof) is on the ground it slides back
 * under the figure at the speed the figure is meant to travel, and that speed
 * times the length of the cycle is the stride.
 *
 * Not the distance the feet slide while they touch the ground: a run has
 * moments with both feet in the air, and the figure travels through those
 * too. Returns 0 when nothing stays on the ground from one frame to the next.
 */
function plantedStride(
  geometry: BufferGeometry,
  bones: Float32Array,
  width: number,
  firstRow: number,
  frames: number,
  fps: number,
): number {
  const position = geometry.attributes.position;
  const boneIndex = geometry.attributes.aBoneIndex;
  const boneWeight = geometry.attributes.aBoneWeight;
  if (frames < 2 || !position || !boneIndex || !boneWeight) return 0;

  // The soles: the lowest vertices of the bind pose.
  let lowest = Infinity;
  for (let v = 0; v < position.count; v++) lowest = Math.min(lowest, position.getY(v));
  const all: number[] = [];
  for (let v = 0; v < position.count; v++) {
    if (position.getY(v) < lowest + SOLE_HEIGHT) all.push(v);
  }
  const every = Math.max(Math.ceil(all.length / SOLE_SAMPLES), 1);
  const soles = all.filter((_, i) => i % every === 0);
  if (soles.length === 0) return 0;

  // Where each sole vertex is in every frame: skinned as the shader does.
  const at = new Float32Array(frames * soles.length * 3);
  let ground = Infinity;
  for (let f = 0; f < frames; f++) {
    const row = (firstRow + f) * width;
    for (let s = 0; s < soles.length; s++) {
      const v = soles[s];
      const x = position.getX(v);
      const y = position.getY(v);
      const z = position.getZ(v);
      const o = (f * soles.length + s) * 3;
      for (let k = 0; k < 4; k++) {
        const weight = boneWeight.getComponent(v, k);
        if (weight <= 0) continue;
        const m = (row + Math.round(boneIndex.getComponent(v, k)) * 3) * 4;
        for (let axis = 0; axis < 3; axis++) {
          const r = m + axis * 4;
          at[o + axis] += weight * (bones[r] * x + bones[r + 1] * y + bones[r + 2] * z + bones[r + 3]);
        }
      }
      ground = Math.min(ground, at[o + 1]);
    }
  }

  // Speed over the ground of every vertex that is on it in two frames running.
  const speeds: number[] = [];
  for (let f = 0; f < frames; f++) {
    // A loop: the last frame is followed by the first.
    const next = (f + 1) % frames;
    for (let s = 0; s < soles.length; s++) {
      const a = (f * soles.length + s) * 3;
      const b = (next * soles.length + s) * 3;
      if (at[a + 1] > ground + GROUND_REACH || at[b + 1] > ground + GROUND_REACH) continue;
      speeds.push(Math.hypot(at[b] - at[a], at[b + 2] - at[a + 2]) * fps);
    }
  }
  if (speeds.length < 3) return 0;
  speeds.sort((p, q) => p - q);
  return (speeds[Math.floor(speeds.length / 2)] * frames) / fps;
}

/**
 * Copies a skinned mesh into a plain geometry in model space: position,
 * normal, uv, colour, the team-colour mask, up to four bone influences and,
 * when asked, the tangents.
 */
function prepareGeometry(mesh: SkinnedMesh, remap: number[], withTangents: boolean): BufferGeometry {
  const source = mesh.geometry;
  const count = source.attributes.position.count;
  const geometry = new BufferGeometry();

  const position = new BufferAttribute(new Float32Array(count * 3), 3);
  const point = new Vector3();
  for (let i = 0; i < count; i++) {
    point.fromBufferAttribute(source.attributes.position, i).applyMatrix4(mesh.bindMatrix);
    position.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.setAttribute("position", position);

  if (source.attributes.normal) {
    const normal = new BufferAttribute(new Float32Array(count * 3), 3);
    const normalMatrix = new Matrix3().getNormalMatrix(mesh.bindMatrix);
    for (let i = 0; i < count; i++) {
      point.fromBufferAttribute(source.attributes.normal, i).applyMatrix3(normalMatrix).normalize();
      normal.setXYZ(i, point.x, point.y, point.z);
    }
    geometry.setAttribute("normal", normal);
  }

  const sourceTangent = source.attributes.tangent;
  if (withTangents && sourceTangent) {
    const tangent = new BufferAttribute(new Float32Array(count * 4), 4);
    const linear = new Matrix3().setFromMatrix4(mesh.bindMatrix);
    for (let i = 0; i < count; i++) {
      point.fromBufferAttribute(sourceTangent, i).applyMatrix3(linear).normalize();
      tangent.setXYZW(i, point.x, point.y, point.z, sourceTangent.getW(i) < 0 ? -1 : 1);
    }
    geometry.setAttribute("tangent", tangent);
  }

  const uv = new BufferAttribute(new Float32Array(count * 2), 2);
  if (source.attributes.uv) {
    for (let i = 0; i < count; i++) {
      uv.setXY(i, source.attributes.uv.getX(i), source.attributes.uv.getY(i));
    }
  }
  geometry.setAttribute("uv", uv);

  const color = new BufferAttribute(new Float32Array(count * 3).fill(1), 3);
  if (source.attributes.color) {
    const from = source.attributes.color;
    for (let i = 0; i < count; i++) color.setXYZ(i, from.getX(i), from.getY(i), from.getZ(i));
  }
  geometry.setAttribute("color", color);

  const team = new BufferAttribute(new Float32Array(count), 1);
  if (source.attributes.aTeam) {
    for (let i = 0; i < count; i++) team.setX(i, source.attributes.aTeam.getX(i));
  }
  geometry.setAttribute("aTeam", team);

  const boneIndex = new BufferAttribute(new Float32Array(count * 4), 4);
  const boneWeight = new BufferAttribute(new Float32Array(count * 4), 4);
  const skinIndex = source.attributes.skinIndex;
  const skinWeight = source.attributes.skinWeight;
  const weights = new Vector4();
  for (let i = 0; i < count; i++) {
    weights.set(skinWeight.getX(i), skinWeight.getY(i), skinWeight.getZ(i), skinWeight.getW(i));
    const sum = weights.x + weights.y + weights.z + weights.w;
    if (sum > 0) weights.divideScalar(sum);
    else weights.set(1, 0, 0, 0);
    boneWeight.setXYZW(i, weights.x, weights.y, weights.z, weights.w);
    boneIndex.setXYZW(
      i,
      remap[skinIndex.getX(i)] ?? 0,
      remap[skinIndex.getY(i)] ?? 0,
      remap[skinIndex.getZ(i)] ?? 0,
      remap[skinIndex.getW(i)] ?? 0,
    );
  }
  geometry.setAttribute("aBoneIndex", boneIndex);
  geometry.setAttribute("aBoneWeight", boneWeight);

  if (source.index) {
    geometry.setIndex(new BufferAttribute(source.index.array.slice(), 1));
  } else {
    const index = new Uint32Array(count);
    for (let i = 0; i < count; i++) index[i] = i;
    geometry.setIndex(new BufferAttribute(index, 1));
  }
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  return geometry;
}
