// Writes a unit model that keeps the contract of docs/ARCHITECTURE.md
// ("Mô hình lính") at its upper limits, to test the battle scene before the
// real models exist and to measure the worst case:
//
//   - one skeleton of 67 bones (named like the Unreal mannequin);
//   - meshes LOD0 (8 000 triangles), LOD1 (1 500) and LOD2 (300), every vertex
//     weighted to up to four bones;
//   - one material with a 2048 x 2048 colour texture;
//   - clips idle, walk, run, attack and die.
//
// It is a mannequin made of tubes, not a soldier. No dependencies.
//
//   node src/components/battle/tools/make-test-model.mjs <out.glb> [--no-die] [--no-run]
//
// To try it in /battle-lab, write it to public/battles/models/<model>.glb for
// a model name in src/data/battles/unit-types.json, then delete the file
// again: that folder belongs to the real models.

import { writeFileSync } from "node:fs";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const out = args.find((arg) => !arg.startsWith("--"));
if (!out) {
  console.error("Usage: node make-test-model.mjs <out.glb> [--no-die] [--no-run]");
  process.exit(1);
}
const skipClips = new Set(args.filter((arg) => arg.startsWith("--no-")).map((arg) => arg.slice(5)));

// --- Skeleton ----------------------------------------------------------------

/** name, parent, rest position in model space (metres; +Y up, facing +Z, left is +X). */
const BONES = [["root", null, [0, 0, 0]]];
const bone = (name, parent, at) => BONES.push([name, parent, at]);
bone("pelvis", "root", [0, 1.0, 0]);
bone("spine_01", "pelvis", [0, 1.1, 0]);
bone("spine_02", "spine_01", [0, 1.25, 0]);
bone("spine_03", "spine_02", [0, 1.4, 0]);
bone("neck_01", "spine_03", [0, 1.52, 0]);
bone("head", "neck_01", [0, 1.6, 0]);
for (const [side, sign] of [["l", 1], ["r", -1]]) {
  const x = 0.2 * sign;
  bone(`clavicle_${side}`, "spine_03", [0.05 * sign, 1.47, 0]);
  bone(`upperarm_${side}`, `clavicle_${side}`, [x, 1.45, 0]);
  bone(`upperarm_twist_01_${side}`, `upperarm_${side}`, [x, 1.3, 0]);
  bone(`lowerarm_${side}`, `upperarm_${side}`, [x, 1.15, 0]);
  bone(`lowerarm_twist_01_${side}`, `lowerarm_${side}`, [x, 1.0, 0]);
  bone(`hand_${side}`, `lowerarm_${side}`, [x, 0.87, 0]);
  ["thumb", "index", "middle", "ring", "pinky"].forEach((finger, f) => {
    let parent = `hand_${side}`;
    for (let joint = 1; joint <= 3; joint++) {
      const name = `${finger}_0${joint}_${side}`;
      bone(name, parent, [x + (f - 2) * 0.015 * sign, 0.87 - joint * 0.03, 0.01]);
      parent = name;
    }
  });
  const legX = 0.1 * sign;
  bone(`thigh_${side}`, "pelvis", [legX, 0.98, 0]);
  bone(`thigh_twist_01_${side}`, `thigh_${side}`, [legX, 0.75, 0]);
  bone(`calf_${side}`, `thigh_${side}`, [legX, 0.52, 0]);
  bone(`calf_twist_01_${side}`, `calf_${side}`, [legX, 0.3, 0]);
  bone(`foot_${side}`, `calf_${side}`, [legX, 0.08, 0]);
  bone(`ball_${side}`, `foot_${side}`, [legX, 0.02, 0.12]);
}
bone("ik_foot_root", "root", [0, 0, 0]);
bone("ik_foot_l", "ik_foot_root", [0.1, 0.08, 0]);
bone("ik_foot_r", "ik_foot_root", [-0.1, 0.08, 0]);
bone("ik_hand_root", "root", [0, 0, 0]);
bone("ik_hand_l", "ik_hand_root", [0.2, 0.87, 0]);
bone("ik_hand_r", "ik_hand_root", [-0.2, 0.87, 0]);

const boneIndex = new Map(BONES.map(([name], i) => [name, i]));
if (BONES.length !== 67) throw new Error(`Expected 67 bones, built ${BONES.length}.`);

// --- Meshes ------------------------------------------------------------------

/**
 * A tube along a straight axis. `stations` say which bones hold the tube at
 * which fraction of its length; a vertex blends the two stations around it,
 * so it has up to four influences.
 */
function tube({ from, to, radius, stations, uvBand }, rings, radial, mesh) {
  const first = mesh.positions.length / 3;
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const center = from.map((v, k) => v + (to[k] - v) * t);
    const rad = radius(t);
    let s = 0;
    while (s < stations.length - 2 && t > stations[s + 1].t) s++;
    const a = stations[s];
    const b = stations[s + 1];
    const blend = Math.min(Math.max((t - a.t) / (b.t - a.t), 0), 1);
    const influence = new Map();
    for (const [name, weight] of a.bones) influence.set(name, (influence.get(name) ?? 0) + weight * (1 - blend));
    for (const [name, weight] of b.bones) influence.set(name, (influence.get(name) ?? 0) + weight * blend);
    const top = [...influence].filter(([, w]) => w > 0).sort((p, q) => q[1] - p[1]).slice(0, 4);
    const total = top.reduce((sum, [, w]) => sum + w, 0);
    for (let k = 0; k <= radial; k++) {
      const angle = (k / radial) * 2 * Math.PI;
      const nx = Math.cos(angle);
      const nz = Math.sin(angle);
      mesh.positions.push(center[0] + nx * rad, center[1], center[2] + nz * rad);
      mesh.normals.push(nx, 0, nz);
      mesh.uvs.push(k / radial, uvBand[0] + (uvBand[1] - uvBand[0]) * t);
      for (let j = 0; j < 4; j++) {
        mesh.joints.push(top[j] ? boneIndex.get(top[j][0]) : 0);
        mesh.weights.push(top[j] ? top[j][1] / total : 0);
      }
    }
  }
  const direction = to[1] < from[1] ? 1 : -1; // keep the faces pointing outwards
  for (let r = 0; r < rings; r++) {
    for (let k = 0; k < radial; k++) {
      const a = first + r * (radial + 1) + k;
      const b = a + 1;
      const c = a + radial + 1;
      const d = c + 1;
      if (direction > 0) mesh.indices.push(a, b, c, b, d, c);
      else mesh.indices.push(a, c, b, b, c, d);
    }
  }
}

function limb(side, sign) {
  const x = 0.2 * sign;
  const legX = 0.1 * sign;
  return [
    {
      from: [x, 1.47, 0], to: [x, 0.8, 0], uvBand: [0.25, 0.5],
      radius: (t) => 0.055 - 0.015 * t,
      stations: [
        { t: 0, bones: [[`upperarm_${side}`, 0.8], [`clavicle_${side}`, 0.2]] },
        { t: 0.25, bones: [[`upperarm_${side}`, 0.6], [`upperarm_twist_01_${side}`, 0.4]] },
        { t: 0.5, bones: [[`lowerarm_${side}`, 0.6], [`upperarm_twist_01_${side}`, 0.4]] },
        { t: 0.75, bones: [[`lowerarm_${side}`, 0.5], [`lowerarm_twist_01_${side}`, 0.5]] },
        { t: 1, bones: [[`hand_${side}`, 0.8], [`lowerarm_twist_01_${side}`, 0.2]] },
      ],
    },
    {
      from: [legX, 1.0, 0], to: [legX, 0, 0], uvBand: [0, 0.25],
      radius: (t) => 0.09 - 0.04 * t,
      stations: [
        { t: 0, bones: [[`thigh_${side}`, 0.7], ["pelvis", 0.3]] },
        { t: 0.25, bones: [[`thigh_${side}`, 0.6], [`thigh_twist_01_${side}`, 0.4]] },
        { t: 0.5, bones: [[`calf_${side}`, 0.6], [`thigh_twist_01_${side}`, 0.4]] },
        { t: 0.75, bones: [[`calf_${side}`, 0.5], [`calf_twist_01_${side}`, 0.5]] },
        { t: 1, bones: [[`foot_${side}`, 0.8], [`calf_twist_01_${side}`, 0.2]] },
      ],
    },
  ];
}

const PARTS = {
  torso: {
    from: [0, 0.95, 0], to: [0, 1.5, 0], uvBand: [0.5, 0.75],
    radius: (t) => 0.16 + 0.05 * Math.sin(t * Math.PI) - 0.05 * t * t,
    stations: [
      { t: 0, bones: [["pelvis", 1]] },
      { t: 0.3, bones: [["spine_01", 0.6], ["pelvis", 0.4]] },
      { t: 0.55, bones: [["spine_02", 0.6], ["spine_01", 0.4]] },
      { t: 0.85, bones: [["spine_03", 0.6], ["clavicle_l", 0.2], ["clavicle_r", 0.2]] },
      { t: 1, bones: [["neck_01", 0.7], ["spine_03", 0.3]] },
    ],
  },
  head: {
    from: [0, 1.5, 0], to: [0, 1.82, 0], uvBand: [0.75, 1],
    radius: (t) => 0.05 + 0.075 * Math.sin(Math.min(t * 1.15, 1) * Math.PI),
    stations: [
      { t: 0, bones: [["neck_01", 0.8], ["spine_03", 0.2]] },
      { t: 0.35, bones: [["head", 0.7], ["neck_01", 0.3]] },
      { t: 1, bones: [["head", 1]] },
    ],
  },
  limbs: [...limb("l", 1), ...limb("r", -1)],
};

/** rings: torso, head, each arm, each leg; radial segments. */
const LODS = [
  { name: "LOD0", radial: 24, rings: [40, 26, 25, 25] }, // about 8 000 triangles
  { name: "LOD1", radial: 12, rings: [14, 10, 9, 10] }, // about 1 500
  { name: "LOD2", radial: 6, rings: [5, 4, 4, 4] }, // 300
];

function buildMesh(lod) {
  const mesh = { positions: [], normals: [], uvs: [], joints: [], weights: [], indices: [] };
  tube(PARTS.torso, lod.rings[0], lod.radial, mesh);
  tube(PARTS.head, lod.rings[1], lod.radial, mesh);
  PARTS.limbs.forEach((part, i) => tube(part, lod.rings[i % 2 === 0 ? 2 : 3], lod.radial, mesh));
  return mesh;
}

// --- Animation ---------------------------------------------------------------

const FPS = 30;
const rotX = (a) => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
const rotY = (a) => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
/** Linear keys: [[time, value], ...] sampled at t. */
function keys(points, t) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const f = (t - points[i - 1][0]) / (points[i][0] - points[i - 1][0]);
      return points[i - 1][1] + (points[i][1] - points[i - 1][1]) * f;
    }
  }
  return points[points.length - 1][1];
}

function gait(duration, stride, knee, arm, lean, bobHeight) {
  const phase = (t) => (2 * Math.PI * t) / duration;
  return {
    duration,
    rotations: {
      thigh_l: (t) => rotX(-stride * Math.sin(phase(t))),
      thigh_r: (t) => rotX(stride * Math.sin(phase(t))),
      calf_l: (t) => rotX(knee * Math.max(0, Math.cos(phase(t)))),
      calf_r: (t) => rotX(knee * Math.max(0, -Math.cos(phase(t)))),
      upperarm_l: (t) => rotX(arm * Math.sin(phase(t))),
      upperarm_r: (t) => rotX(-arm * Math.sin(phase(t))),
      lowerarm_l: () => rotX(-0.4),
      lowerarm_r: () => rotX(-0.4),
      spine_01: () => rotX(lean),
      spine_02: (t) => rotY(0.08 * Math.sin(phase(t))),
    },
    translations: { pelvis: (t) => [0, 1.0 + bobHeight * Math.cos(2 * phase(t)), 0] },
  };
}

const CLIPS = {
  idle: {
    duration: 3,
    rotations: {
      spine_02: (t) => rotX(0.03 * Math.sin((2 * Math.PI * t) / 3)),
      head: (t) => rotY(0.3 * Math.sin((2 * Math.PI * t) / 3)),
      upperarm_l: (t) => rotX(0.05 * Math.sin((2 * Math.PI * t) / 3)),
      upperarm_r: (t) => rotX(-0.05 * Math.sin((2 * Math.PI * t) / 3)),
    },
    translations: {},
  },
  walk: gait(1.0, 0.5, 0.6, 0.4, 0.04, 0.02),
  run: gait(0.7, 0.9, 1.1, 0.8, 0.25, 0.05),
  attack: {
    duration: 1.5,
    rotations: {
      upperarm_r: (t) => rotX(keys([[0, -0.2], [0.4, -2.5], [0.55, -2.6], [0.7, -0.6], [1.5, -0.2]], t)),
      lowerarm_r: (t) => rotX(keys([[0, -0.4], [0.4, -1.2], [0.7, -0.2], [1.5, -0.4]], t)),
      spine_02: (t) => rotY(keys([[0, 0], [0.4, -0.35], [0.7, 0.3], [1.5, 0]], t)),
      spine_01: (t) => rotX(keys([[0, 0], [0.4, -0.12], [0.7, 0.3], [1.5, 0]], t)),
      thigh_l: (t) => rotX(keys([[0, 0], [0.5, 0.1], [0.7, -0.45], [1.5, 0]], t)),
      thigh_r: (t) => rotX(keys([[0, 0], [0.5, -0.1], [0.7, 0.3], [1.5, 0]], t)),
    },
    translations: {},
  },
  die: {
    duration: 1.5,
    rotations: {
      pelvis: (t) => rotX(keys([[0, 0], [0.4, -0.4], [0.9, -1.2], [1.2, -1.5708], [1.5, -1.5708]], t)),
      upperarm_l: (t) => rotX(keys([[0, 0], [1.2, -0.6], [1.5, -0.6]], t)),
      upperarm_r: (t) => rotX(keys([[0, 0], [1.2, -0.9], [1.5, -0.9]], t)),
      thigh_l: (t) => rotX(keys([[0, 0], [0.9, 0.3], [1.5, 0.1]], t)),
    },
    translations: {
      pelvis: (t) => [
        0,
        keys([[0, 1.0], [0.4, 0.9], [0.9, 0.4], [1.2, 0.17], [1.5, 0.17]], t),
        keys([[0, 0], [0.9, -0.4], [1.2, -0.5], [1.5, -0.5]], t),
      ],
    },
  },
};

// --- Texture -----------------------------------------------------------------

function crcChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

/** Bands for legs, arms, torso and head (top to bottom of the image). */
function makeTexture(size) {
  const bands = [[92, 66, 46], [200, 152, 112], [176, 40, 32], [205, 160, 120]];
  const row = Buffer.alloc(1 + size * 3);
  const rows = [];
  for (let y = 0; y < size; y++) {
    const band = bands[Math.min(Math.floor((y / size) * 4), 3)];
    const stripe = Math.floor(y / 64) % 2 === 0 ? 1 : 0.9;
    for (let x = 0; x < size; x++) {
      const check = Math.floor(x / 128) % 2 === 0 ? 1 : 0.94;
      row[1 + x * 3] = band[0] * stripe * check;
      row[2 + x * 3] = band[1] * stripe * check;
      row[3 + x * 3] = band[2] * stripe * check;
    }
    rows.push(Buffer.from(row));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8 bits, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    crcChunk("IHDR", header),
    crcChunk("IDAT", zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    crcChunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- glTF --------------------------------------------------------------------

const chunks = [];
let byteLength = 0;
const bufferViews = [];
const accessors = [];

function addView(buffer, target) {
  const padding = (4 - (byteLength % 4)) % 4;
  if (padding) {
    chunks.push(Buffer.alloc(padding));
    byteLength += padding;
  }
  bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: buffer.length, ...(target ? { target } : {}) });
  chunks.push(buffer);
  byteLength += buffer.length;
  return bufferViews.length - 1;
}

function addAccessor(typed, type, componentType, { target, minMax = false, normalized = false } = {}) {
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
  const accessor = {
    bufferView: addView(Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength), target),
    componentType,
    count: typed.length / size,
    type,
    ...(normalized ? { normalized } : {}),
  };
  if (minMax) {
    accessor.min = new Array(size).fill(Infinity);
    accessor.max = new Array(size).fill(-Infinity);
    for (let i = 0; i < typed.length; i++) {
      accessor.min[i % size] = Math.min(accessor.min[i % size], typed[i]);
      accessor.max[i % size] = Math.max(accessor.max[i % size], typed[i]);
    }
  }
  accessors.push(accessor);
  return accessors.length - 1;
}

const FLOAT = 5126;
const USHORT = 5123;
const UBYTE = 5121;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

// Nodes: 0..66 the bones, then the three meshes, then the armature.
const worldOf = new Map(BONES.map((entry) => [entry[0], entry[2]]));
const nodes = BONES.map(([name, parent, at]) => {
  const origin = parent ? worldOf.get(parent) : [0, 0, 0];
  return { name, translation: at.map((v, k) => v - origin[k]) };
});
BONES.forEach((entry, i) => {
  const parent = entry[1];
  if (!parent) return;
  const parentNode = nodes[boneIndex.get(parent)];
  (parentNode.children ??= []).push(i);
});

const inverseBind = new Float32Array(BONES.length * 16);
BONES.forEach(([, , at], i) => {
  inverseBind.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -at[0], -at[1], -at[2], 1], i * 16);
});
const skins = [
  {
    joints: BONES.map((_, i) => i),
    inverseBindMatrices: addAccessor(inverseBind, "MAT4", FLOAT),
    skeleton: 0,
  },
];

const meshes = [];
const report = [];
for (const lod of LODS) {
  const mesh = buildMesh(lod);
  report.push(`${lod.name}: ${mesh.indices.length / 3} triangles, ${mesh.positions.length / 3} vertices`);
  meshes.push({
    name: lod.name,
    primitives: [
      {
        attributes: {
          POSITION: addAccessor(new Float32Array(mesh.positions), "VEC3", FLOAT, { target: ARRAY_BUFFER, minMax: true }),
          NORMAL: addAccessor(new Float32Array(mesh.normals), "VEC3", FLOAT, { target: ARRAY_BUFFER }),
          TEXCOORD_0: addAccessor(new Float32Array(mesh.uvs), "VEC2", FLOAT, { target: ARRAY_BUFFER }),
          JOINTS_0: addAccessor(new Uint8Array(mesh.joints), "VEC4", UBYTE, { target: ARRAY_BUFFER }),
          WEIGHTS_0: addAccessor(new Float32Array(mesh.weights), "VEC4", FLOAT, { target: ARRAY_BUFFER }),
        },
        indices: addAccessor(new Uint16Array(mesh.indices), "SCALAR", USHORT, { target: ELEMENT_ARRAY_BUFFER }),
        material: 0,
      },
    ],
  });
  nodes.push({ name: lod.name, mesh: meshes.length - 1, skin: 0 });
}
const meshNodes = LODS.map((_, i) => BONES.length + i);
nodes.push({ name: "Armature", children: [0, ...meshNodes] });

const animations = [];
for (const [name, clip] of Object.entries(CLIPS)) {
  if (skipClips.has(name)) continue;
  const frames = Math.round(clip.duration * FPS) + 1;
  const times = new Float32Array(frames);
  for (let f = 0; f < frames; f++) times[f] = Math.min(f / FPS, clip.duration);
  const input = addAccessor(times, "SCALAR", FLOAT, { minMax: true });
  const animation = { name, samplers: [], channels: [] };
  const add = (boneName, path, size, type, sample) => {
    const values = new Float32Array(frames * size);
    for (let f = 0; f < frames; f++) values.set(sample(times[f]), f * size);
    animation.samplers.push({ input, output: addAccessor(values, type, FLOAT), interpolation: "LINEAR" });
    animation.channels.push({
      sampler: animation.samplers.length - 1,
      target: { node: boneIndex.get(boneName), path },
    });
  };
  for (const [boneName, sample] of Object.entries(clip.rotations)) add(boneName, "rotation", 4, "VEC4", sample);
  for (const [boneName, sample] of Object.entries(clip.translations)) add(boneName, "translation", 3, "VEC3", sample);
  animations.push(animation);
}

const image = addView(makeTexture(2048));

const gltf = {
  asset: { version: "2.0", generator: "World History Platform: make-test-model.mjs" },
  scene: 0,
  scenes: [{ nodes: [nodes.length - 1] }],
  nodes,
  meshes,
  skins,
  animations,
  materials: [
    {
      name: "TestSoldier",
      pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.9 },
    },
  ],
  textures: [{ source: 0, sampler: 0 }],
  samplers: [{ magFilter: 9729, minFilter: 9987 }],
  images: [{ bufferView: image, mimeType: "image/png" }],
  accessors,
  bufferViews,
  buffers: [{ byteLength: 0 }],
};

const binPadding = (4 - (byteLength % 4)) % 4;
const bin = Buffer.concat([...chunks, Buffer.alloc(binPadding)]);
gltf.buffers[0].byteLength = bin.length;
let json = Buffer.from(JSON.stringify(gltf), "utf8");
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); // "glTF"
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
const chunkHeader = (length, type) => {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32LE(length, 0);
  buffer.writeUInt32LE(type, 4);
  return buffer;
};
const glb = Buffer.concat([
  header,
  chunkHeader(json.length, 0x4e4f534a), // "JSON"
  json,
  chunkHeader(bin.length, 0x004e4942), // "BIN"
  bin,
]);
writeFileSync(out, glb);
console.log(`${out}: ${(glb.length / 1024).toFixed(0)} KB, ${BONES.length} bones, clips ${animations.map((a) => a.name).join(", ")}`);
for (const line of report) console.log(`  ${line}`);
