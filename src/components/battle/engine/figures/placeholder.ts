/**
 * Stand-in figures for unit models that are not in public/battles/models/
 * yet: a blocky foot soldier and a blocky horseman, each with a skeleton, the
 * five contract clips and three levels of detail. They are built as ordinary
 * skinned meshes and go through the same baking and drawing as a model file.
 */

import {
  AnimationClip,
  Bone,
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  Color,
  Euler,
  Group,
  type KeyframeTrack,
  MeshBasicMaterial,
  Quaternion,
  QuaternionKeyframeTrack,
  Skeleton,
  SkinnedMesh,
  VectorKeyframeTrack,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { SkinnedSource } from "./model";

type Vec3 = [number, number, number];

interface BoneSpec {
  name: string;
  parent?: string;
  /** Rest position in model space, metres. */
  at: Vec3;
}

interface PartSpec {
  bone: string;
  size: Vec3;
  at: Vec3;
  color: string;
  /** Tinted with the colour of the side. */
  team?: boolean;
  tilt?: Vec3;
  /** Left out of the coarsest level. */
  detail?: boolean;
}

const SKIN = "#c79a70";
const METAL = "#9a9ca3";
const LEATHER = "#6a4f38";
const HORSE = "#6f4c30";
const HORSE_DARK = "#4a3423";
const CLOTH = "#ffffff";
const CLOTH_DARK = "#b8b8b8";

const FOOT_BONES: BoneSpec[] = [
  { name: "hips", at: [0, 0.95, 0] },
  { name: "chest", parent: "hips", at: [0, 1.05, 0] },
  { name: "head", parent: "chest", at: [0, 1.52, 0] },
  { name: "armL", parent: "chest", at: [0.27, 1.42, 0] },
  { name: "armR", parent: "chest", at: [-0.27, 1.42, 0] },
  { name: "legL", parent: "hips", at: [0.11, 0.92, 0] },
  { name: "legR", parent: "hips", at: [-0.11, 0.92, 0] },
];

// The figure faces +Z; its left is +X. Shield on the left, sword on the right.
const FOOT_PARTS: PartSpec[] = [
  { bone: "hips", size: [0.4, 0.28, 0.25], at: [0, 0.92, 0], color: CLOTH_DARK, team: true },
  { bone: "chest", size: [0.44, 0.5, 0.26], at: [0, 1.3, 0], color: CLOTH, team: true },
  { bone: "head", size: [0.2, 0.22, 0.21], at: [0, 1.66, 0], color: SKIN },
  { bone: "head", size: [0.24, 0.1, 0.25], at: [0, 1.8, 0], color: METAL, detail: true },
  { bone: "head", size: [0.05, 0.1, 0.24], at: [0, 1.9, 0], color: CLOTH, team: true, detail: true },
  { bone: "armL", size: [0.11, 0.52, 0.11], at: [0.29, 1.18, 0], color: SKIN, detail: true },
  { bone: "armR", size: [0.11, 0.52, 0.11], at: [-0.29, 1.18, 0], color: SKIN, detail: true },
  { bone: "legL", size: [0.15, 0.9, 0.16], at: [0.11, 0.45, 0], color: LEATHER },
  { bone: "legR", size: [0.15, 0.9, 0.16], at: [-0.11, 0.45, 0], color: LEATHER },
  { bone: "chest", size: [0.5, 0.8, 0.05], at: [0.33, 1.12, 0.18], color: CLOTH, team: true },
  { bone: "chest", size: [0.13, 0.13, 0.05], at: [0.33, 1.12, 0.22], color: METAL, detail: true },
  { bone: "armR", size: [0.04, 0.04, 0.7], at: [-0.29, 0.95, 0.36], color: METAL, detail: true },
];

const MOUNTED_BONES: BoneSpec[] = [
  { name: "root", at: [0, 0, 0] },
  { name: "body", parent: "root", at: [0, 1.25, 0] },
  { name: "neck", parent: "body", at: [0, 1.45, 0.65] },
  { name: "legFL", parent: "body", at: [0.2, 1.05, 0.6] },
  { name: "legFR", parent: "body", at: [-0.2, 1.05, 0.6] },
  { name: "legBL", parent: "body", at: [0.2, 1.05, -0.6] },
  { name: "legBR", parent: "body", at: [-0.2, 1.05, -0.6] },
  { name: "rider", parent: "body", at: [0, 1.55, -0.05] },
  { name: "riderHead", parent: "rider", at: [0, 2.1, -0.05] },
  { name: "riderArm", parent: "rider", at: [-0.27, 2.0, -0.05] },
];

const MOUNTED_PARTS: PartSpec[] = [
  { bone: "body", size: [0.5, 0.55, 1.5], at: [0, 1.25, 0], color: HORSE },
  { bone: "neck", size: [0.24, 0.7, 0.3], at: [0, 1.7, 0.8], color: HORSE, tilt: [0.6, 0, 0] },
  { bone: "neck", size: [0.2, 0.24, 0.5], at: [0, 2.0, 1.12], color: HORSE_DARK, tilt: [0.5, 0, 0] },
  { bone: "body", size: [0.08, 0.5, 0.08], at: [0, 1.2, -0.85], color: HORSE_DARK, tilt: [-0.4, 0, 0], detail: true },
  { bone: "legFL", size: [0.13, 1.05, 0.14], at: [0.2, 0.525, 0.6], color: HORSE_DARK },
  { bone: "legFR", size: [0.13, 1.05, 0.14], at: [-0.2, 0.525, 0.6], color: HORSE_DARK },
  { bone: "legBL", size: [0.13, 1.05, 0.14], at: [0.2, 0.525, -0.6], color: HORSE_DARK },
  { bone: "legBR", size: [0.13, 1.05, 0.14], at: [-0.2, 0.525, -0.6], color: HORSE_DARK },
  { bone: "rider", size: [0.42, 0.5, 0.25], at: [0, 1.85, -0.05], color: CLOTH, team: true },
  { bone: "body", size: [0.13, 0.6, 0.18], at: [0.31, 1.35, 0.05], color: LEATHER, detail: true },
  { bone: "body", size: [0.13, 0.6, 0.18], at: [-0.31, 1.35, 0.05], color: LEATHER, detail: true },
  { bone: "riderHead", size: [0.2, 0.22, 0.21], at: [0, 2.21, -0.05], color: SKIN },
  { bone: "riderHead", size: [0.24, 0.1, 0.25], at: [0, 2.35, -0.05], color: METAL, detail: true },
  { bone: "riderHead", size: [0.05, 0.1, 0.24], at: [0, 2.45, -0.05], color: CLOTH, team: true, detail: true },
  { bone: "rider", size: [0.05, 0.6, 0.6], at: [0.3, 1.8, 0], color: CLOTH, team: true },
  { bone: "riderArm", size: [0.11, 0.5, 0.11], at: [-0.29, 1.76, -0.05], color: SKIN, detail: true },
  { bone: "riderArm", size: [0.04, 0.04, 0.9], at: [-0.29, 1.52, 0.45], color: METAL, detail: true },
];

function buildGeometry(parts: PartSpec[], boneNames: string[]): BufferGeometry {
  const color = new Color();
  const euler = new Euler();
  const boxes = parts.map((part) => {
    const box = new BoxGeometry(part.size[0], part.size[1], part.size[2]);
    if (part.tilt) box.applyQuaternion(new Quaternion().setFromEuler(euler.set(...part.tilt)));
    box.translate(part.at[0], part.at[1], part.at[2]);
    const count = box.attributes.position.count;
    color.set(part.color);
    const colors = new Float32Array(count * 3);
    const team = new Float32Array(count).fill(part.team ? 1 : 0);
    const skinIndex = new Uint16Array(count * 4);
    const skinWeight = new Float32Array(count * 4);
    const bone = boneNames.indexOf(part.bone);
    for (let i = 0; i < count; i++) {
      colors.set([color.r, color.g, color.b], i * 3);
      skinIndex[i * 4] = bone;
      skinWeight[i * 4] = 1;
    }
    box.setAttribute("color", new BufferAttribute(colors, 3));
    box.setAttribute("aTeam", new BufferAttribute(team, 1));
    box.setAttribute("skinIndex", new BufferAttribute(skinIndex, 4));
    box.setAttribute("skinWeight", new BufferAttribute(skinWeight, 4));
    return box;
  });
  const merged = mergeGeometries(boxes);
  for (const box of boxes) box.dispose();
  return merged;
}

// --- Animation helpers -----------------------------------------------------

const quaternion = new Quaternion();
const euler = new Euler();

/** A rotation track from Euler angles (radians) at the given times. */
function rotate(bone: string, times: number[], angles: Vec3[]): KeyframeTrack {
  const values: number[] = [];
  for (const angle of angles) {
    quaternion.setFromEuler(euler.set(angle[0], angle[1], angle[2]));
    values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }
  return new QuaternionKeyframeTrack(`${bone}.quaternion`, times, values);
}

/** A position track: offsets from the rest position of the bone. */
function move(bone: string, rest: Vec3, times: number[], offsets: Vec3[]): KeyframeTrack {
  const values: number[] = [];
  for (const offset of offsets) {
    values.push(rest[0] + offset[0], rest[1] + offset[1], rest[2] + offset[2]);
  }
  return new VectorKeyframeTrack(`${bone}.position`, times, values);
}

/** Samples one full cycle: `fn` receives the phase in radians, 0..2π. */
function cycle(duration: number, fn: (phase: number) => Vec3): { times: number[]; values: Vec3[] } {
  const steps = 12;
  const times: number[] = [];
  const values: Vec3[] = [];
  for (let i = 0; i <= steps; i++) {
    times.push((duration * i) / steps);
    values.push(fn((2 * Math.PI * i) / steps));
  }
  return { times, values };
}

function swing(bone: string, duration: number, fn: (phase: number) => Vec3): KeyframeTrack {
  const { times, values } = cycle(duration, fn);
  return rotate(bone, times, values);
}

function bob(bone: string, rest: Vec3, duration: number, fn: (phase: number) => Vec3): KeyframeTrack {
  const { times, values } = cycle(duration, fn);
  return move(bone, rest, times, values);
}

function footClips(): AnimationClip[] {
  const hips: Vec3 = [0, 0.95, 0];
  const strike = [0, 0.35, 0.55, 0.7, 1.1, 1.5];
  const fall = [0, 0.4, 0.9, 1.2, 1.4];
  return [
    new AnimationClip("idle", 3, [
      swing("chest", 3, (p) => [0.03 * Math.sin(p), 0, 0]),
      swing("head", 3, (p) => [0, 0.3 * Math.sin(p), 0]),
    ]),
    new AnimationClip("walk", 1, [
      swing("legL", 1, (p) => [0.55 * Math.sin(p), 0, 0]),
      swing("legR", 1, (p) => [-0.55 * Math.sin(p), 0, 0]),
      swing("armR", 1, (p) => [0.3 * Math.sin(p), 0, 0]),
      swing("armL", 1, (p) => [-0.2 * Math.sin(p), 0, 0]),
      swing("chest", 1, (p) => [0.04, 0.08 * Math.sin(p), 0]),
      bob("hips", hips, 1, (p) => [0, 0.025 * Math.cos(2 * p), 0]),
    ]),
    new AnimationClip("run", 0.62, [
      swing("legL", 0.62, (p) => [0.95 * Math.sin(p), 0, 0]),
      swing("legR", 0.62, (p) => [-0.95 * Math.sin(p), 0, 0]),
      swing("armR", 0.62, (p) => [0.6 * Math.sin(p), 0, 0]),
      swing("armL", 0.62, (p) => [-0.3 * Math.sin(p), 0, 0]),
      swing("chest", 0.62, (p) => [0.28, 0.1 * Math.sin(p), 0]),
      bob("hips", hips, 0.62, (p) => [0, 0.05 * Math.cos(2 * p), 0]),
    ]),
    new AnimationClip("attack", 1.5, [
      rotate("armR", strike, [[-0.2, 0, 0], [-2.5, 0, 0], [-2.6, 0, 0], [-0.6, 0, 0], [-0.4, 0, 0], [-0.2, 0, 0]]),
      rotate("chest", strike, [[0, 0, 0], [-0.12, -0.3, 0], [-0.15, -0.35, 0], [0.3, 0.3, 0], [0.1, 0.1, 0], [0, 0, 0]]),
      rotate("legL", strike, [[0, 0, 0], [0.1, 0, 0], [0.1, 0, 0], [-0.45, 0, 0], [-0.1, 0, 0], [0, 0, 0]]),
      rotate("legR", strike, [[0, 0, 0], [-0.1, 0, 0], [-0.1, 0, 0], [0.3, 0, 0], [0.05, 0, 0], [0, 0, 0]]),
      move("hips", hips, strike, [[0, 0, 0], [0, 0, -0.05], [0, 0, -0.05], [0, -0.04, 0.2], [0, 0, 0.05], [0, 0, 0]]),
    ]),
    new AnimationClip("die", 1.4, [
      rotate("hips", fall, [[0, 0, 0], [-0.4, 0, 0.05], [-1.2, 0, 0.1], [-1.5708, 0, 0.1], [-1.5708, 0, 0.1]]),
      move("hips", hips, fall, [[0, 0, 0], [0, -0.1, -0.1], [0, -0.6, -0.4], [0, -0.79, -0.5], [0, -0.79, -0.5]]),
      rotate("armR", fall, [[0, 0, 0], [-0.6, 0, -0.3], [-1.0, 0, -0.8], [-0.4, 0, -1.2], [-0.4, 0, -1.2]]),
      rotate("armL", fall, [[0, 0, 0], [-0.4, 0, 0.3], [-0.6, 0, 0.7], [-0.2, 0, 1.0], [-0.2, 0, 1.0]]),
      rotate("legL", fall, [[0, 0, 0], [0.3, 0, 0], [0.2, 0, 0.1], [0, 0, 0.15], [0, 0, 0.15]]),
    ]),
  ];
}

function mountedClips(): AnimationClip[] {
  const body: Vec3 = [0, 1.25, 0];
  const root: Vec3 = [0, 0, 0];
  const strike = [0, 0.35, 0.55, 0.75, 1.4];
  const fall = [0, 0.4, 1.0, 1.4, 1.6];
  const front = ["legFL", "legFR"];
  const back = ["legBL", "legBR"];
  return [
    new AnimationClip("idle", 3, [
      swing("neck", 3, (p) => [0.08 * Math.sin(p), 0, 0]),
      swing("riderHead", 3, (p) => [0, 0.3 * Math.sin(p), 0]),
    ]),
    new AnimationClip("walk", 1.1, [
      swing("legFL", 1.1, (p) => [0.4 * Math.sin(p), 0, 0]),
      swing("legBR", 1.1, (p) => [0.4 * Math.sin(p), 0, 0]),
      swing("legFR", 1.1, (p) => [-0.4 * Math.sin(p), 0, 0]),
      swing("legBL", 1.1, (p) => [-0.4 * Math.sin(p), 0, 0]),
      swing("neck", 1.1, (p) => [0.05 * Math.sin(2 * p), 0, 0]),
      bob("body", body, 1.1, (p) => [0, 0.02 * Math.cos(2 * p), 0]),
    ]),
    new AnimationClip("run", 0.5, [
      ...front.map((leg) => swing(leg, 0.5, (p) => [0.8 * Math.sin(p), 0, 0])),
      ...back.map((leg) => swing(leg, 0.5, (p) => [0.8 * Math.sin(p + 2.5), 0, 0])),
      swing("body", 0.5, (p) => [0.07 * Math.cos(p), 0, 0]),
      swing("neck", 0.5, (p) => [0.1 * Math.sin(p), 0, 0]),
      swing("rider", 0.5, (p) => [0.2 + 0.05 * Math.sin(p), 0, 0]),
      bob("body", body, 0.5, (p) => [0, 0.08 * Math.sin(p), 0]),
    ]),
    new AnimationClip("attack", 1.4, [
      rotate("riderArm", strike, [[-0.2, 0, 0], [-2.4, 0, 0], [-2.5, 0, 0], [-0.5, 0, 0], [-0.2, 0, 0]]),
      rotate("rider", strike, [[0, 0, 0], [-0.1, -0.25, 0], [-0.1, -0.3, 0], [0.25, 0.25, 0], [0, 0, 0]]),
      rotate("body", strike, [[0, 0, 0], [-0.12, 0, 0], [-0.15, 0, 0], [0, 0, 0], [0, 0, 0]]),
      ...front.map((leg) => rotate(leg, strike, [[0, 0, 0], [-0.5, 0, 0], [-0.6, 0, 0], [0, 0, 0], [0, 0, 0]])),
    ]),
    new AnimationClip("die", 1.6, [
      rotate("root", fall, [[0, 0, 0], [0, 0, 0.3], [0, 0, 1.2], [0, 0, 1.5708], [0, 0, 1.5708]]),
      move("root", root, fall, [[0, 0, 0], [0, 0, 0], [0, 0.1, 0], [0, 0.27, 0], [0, 0.27, 0]]),
      ...front.map((leg) => rotate(leg, fall, [[0, 0, 0], [-0.3, 0, 0], [-0.7, 0, 0], [-0.9, 0, 0], [-0.9, 0, 0]])),
      ...back.map((leg) => rotate(leg, fall, [[0, 0, 0], [0.3, 0, 0], [0.6, 0, 0], [0.8, 0, 0], [0.8, 0, 0]])),
      rotate("rider", fall, [[0, 0, 0], [0, 0, 0.3], [0.2, 0, 0.5], [0.3, 0, 0.6], [0.3, 0, 0.6]]),
    ]),
  ];
}

/** The stand-in for a model that is missing, as a source for buildUnitModel. */
export function createPlaceholderSource(mounted: boolean): SkinnedSource {
  const boneSpecs = mounted ? MOUNTED_BONES : FOOT_BONES;
  const parts = mounted ? MOUNTED_PARTS : FOOT_PARTS;
  const root = new Group();
  root.name = mounted ? "placeholder-mounted" : "placeholder-foot";

  const bones = new Map<string, Bone>();
  for (const spec of boneSpecs) {
    const bone = new Bone();
    bone.name = spec.name;
    const parent = spec.parent ? boneSpecs.find((b) => b.name === spec.parent) : undefined;
    const origin = parent ? parent.at : [0, 0, 0];
    bone.position.set(spec.at[0] - origin[0], spec.at[1] - origin[1], spec.at[2] - origin[2]);
    (spec.parent ? bones.get(spec.parent)! : root).add(bone);
    bones.set(spec.name, bone);
  }
  root.updateMatrixWorld(true);
  const skeleton = new Skeleton([...bones.values()]);
  const boneNames = boneSpecs.map((spec) => spec.name);

  const material = new MeshBasicMaterial();
  const full = buildGeometry(parts, boneNames);
  const coarse = buildGeometry(parts.filter((part) => !part.detail), boneNames);
  // The middle level reuses the full mesh (buildUnitModel fills the gap).
  const lods = [full, null, coarse].map((geometry) => {
    if (!geometry) return [];
    const mesh = new SkinnedMesh(geometry, material);
    root.add(mesh);
    mesh.bind(skeleton);
    return [mesh];
  });

  return {
    name: root.name,
    placeholder: true,
    root,
    lods,
    clips: mounted ? mountedClips() : footClips(),
    map: null,
    release() {
      full.dispose();
      coarse.dispose();
      material.dispose();
      skeleton.dispose();
    },
  };
}
