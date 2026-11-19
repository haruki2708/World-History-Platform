/**
 * Dust (batch H, stage 4; T-048): what the feet and hooves of moving units
 * raise from the plain, and the wind carries off. Livy 22.43 and 22.46: the
 * Volturnus rolled the dust of the drought-parched plain into the faces of
 * the Romans. How much a unit raises is the scene's guess; the battle data
 * only gives how dusty the ground is (`scenery.dust.level`) and the wind.
 *
 * No puff is kept from one frame to the next. Every STEP seconds of playback
 * each unit may raise a few puffs where it stands at that moment, as many as
 * its speed (or a fight at its front) calls for. A puff then stays where it
 * rose, drifts down the wind, swells and thins out. Each frame works out
 * every puff still alive from the battle clock and the units' tracks, so a
 * seek shows the same dust as playing up to that moment, and a paused battle
 * holds its dust still.
 *
 * Drawn as quads that face the camera (one instanced mesh) with a soft cloud
 * texture made here; lit by the sky (sun, sky light, brighter against the
 * sun), and through the fog and the colour grade like the rest of the scene.
 */

import {
  BufferAttribute,
  Color,
  DataTexture,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  RGBAFormat,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
} from "three";
import type { Battle } from "@/lib/battle";
import { createRng } from "./rng";
import type { Sky } from "./sky";
import { type BattleClock, formationPoint, type UnitKey, type UnitTrack } from "./timeline";

type HeightAt = (x: number, y: number) => number;
/** True on the water of a lake (LakeField.wet): no dust rises there. */
type Wet = (x: number, y: number) => boolean;

/** A unit that can raise dust. */
export interface DustSource {
  track: UnitTrack;
  mounted: boolean;
}

/** Seconds of playback between two risings of dust. */
const STEP = 0.25;
/** The longest a puff lasts, seconds of playback. */
const LIFE = 5.5;
/** Risings of one unit that can still have a puff alive, kept in a ring. */
const RING = Math.ceil(LIFE / STEP) + 2;
/** How far back the speed of a unit is measured, seconds of playback. */
const SPEED_WINDOW = 0.5;
/** Puffs drawn at once; more than this are not drawn. */
const CAPACITY = 9000;
/**
 * Speeds of a unit on the field, metres per second of playback, where it
 * starts to raise dust and where it raises all it can. The battle runs on a
 * stretched clock: infantry deploying cross the field at 30–70 m/s, cavalry
 * riding round the Roman army at 45–60 (docs/tasks/T-048-dust-wind.md).
 */
const FOOT_SPEED: [number, number] = [6, 45];
const HORSE_SPEED: [number, number] = [5, 32];
/** A fight hand to hand stirs dust at its front: as much as this share of a unit at full speed. */
const FIGHT_DUST = 0.35;
/** Men to a puff, and the most puffs a unit raises at once. */
const MEN_PER_PUFF_FOOT = 1000;
const MEN_PER_PUFF_HORSE = 200;
const MAX_PUFFS = 12;
/**
 * A puff of infantry dust lasts this share of LIFE: men on foot raise less
 * than horses, and the many units deploying at once are the costliest
 * moment to draw (T-048, "Hiệu năng").
 */
const FOOT_LIFE = 0.8;
/** Radius of a puff as it rises, metres (figures are drawn three times life size), and how fast it swells, m/s. */
const RADIUS_FOOT = 12;
const RADIUS_HORSE = 16;
const GROWTH = 3.5;
/** How fast a puff rises, m/s. */
const RISE = 0.9;
/**
 * The share of the wind's speed that carries the puffs, and the least drift.
 * On the stretched clock the true speed would whisk them off; a gentle drift
 * reads as wind.
 */
const DRIFT = 0.9;
const MIN_DRIFT = 1.5;
/** Random sideways drift of a puff, m/s. */
const SPREAD = 2;
/** The most a puff covers what is behind it, at its thickest, before the dust level of the battle. */
const OPACITY_FOOT = 0.34;
const OPACITY_HORSE = 0.48;
/**
 * What a puff keeps from its rising, per slot of the ring: alive (0 or 1),
 * x and y where it rose, the ground there, its first radius, its life, its
 * opacity at the thickest, its drift east and north, the seed of its look,
 * its first turn and its spin.
 */
const FIELDS = 12;
/** Dry earth of the plain. */
const ALBEDO = new Color("#bba783");

/** An unsigned 32-bit mix of an integer (from the "lowbias32" hash). */
function mix(n: number): number {
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}

/** The n-th number in [0, 1) of a puff's seed. */
function draw(seed: number, n: number): number {
  return mix((seed + Math.imul(n + 1, 0x9e3779b9)) | 0) / 4294967296;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Four soft clouds in a 2 × 2 atlas, each a cluster of round lumps fading to
 * nothing at the edge of its cell. Red: how thick the dust is. Green: how
 * much of the light from above reaches it (the tops of the lumps are lighter).
 */
function cloudTexture(): DataTexture {
  const SIZE = 256;
  const CELL = SIZE / 2;
  const data = new Uint8Array(SIZE * SIZE * 4);
  const rng = createRng(0x5eed);
  for (let cell = 0; cell < 4; cell++) {
    const lumps: { x: number; y: number; r: number }[] = [];
    const count = 7 + Math.floor(rng() * 4);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const d = Math.sqrt(rng()) * 0.24;
      // Lumps sit a little lower than the middle: dust is thicker near the ground.
      lumps.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 + 0.03, r: 0.09 + rng() * 0.09 });
    }
    const ox = (cell % 2) * CELL;
    const oy = Math.floor(cell / 2) * CELL;
    for (let py = 0; py < CELL; py++) {
      for (let px = 0; px < CELL; px++) {
        // Cell coordinates in -0.5..0.5, y up.
        const x = (px + 0.5) / CELL - 0.5;
        const y = 0.5 - (py + 0.5) / CELL;
        let thick = 0;
        let top = 0;
        for (const lump of lumps) {
          const dx = (x - lump.x) / lump.r;
          const dy = (y - lump.y) / lump.r;
          const g = Math.exp(-(dx * dx + dy * dy) * 2.2);
          thick += g;
          // Lit from above: lighter where the point is high on its lump.
          top += g * Math.min(Math.max(0.5 + dy * 0.45, 0), 1);
        }
        const edge = 1 - smoothstep(0.32, 0.49, Math.hypot(x, y));
        const density = Math.min(1 - Math.exp(-thick * 2), 1) * edge;
        const shade = thick > 1e-4 ? top / thick : 0.5;
        const o = ((oy + py) * SIZE + ox + px) * 4;
        data[o] = Math.round(density * 255);
        data[o + 1] = Math.round(shade * 255);
        data[o + 2] = 0;
        data[o + 3] = 255;
      }
    }
  }
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const VERTEX = /* glsl */ `
  attribute vec4 aPuff;   // centre (world), radius
  attribute vec4 aLook;   // opacity, seed, ground height under the centre, turn
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying float vOpacity;
  varying float vSeed;
  varying float vAbove;
  varying float vAgainst;
  #include <fog_pars_vertex>
  void main() {
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world = aPuff.xyz + (right * position.x + up * position.y) * aPuff.w;
    float c = cos(aLook.w);
    float s = sin(aLook.w);
    vUv = vec2(c * position.x - s * position.y, s * position.x + c * position.y) * 0.5 + 0.5;
    vOpacity = aLook.x;
    vSeed = aLook.y;
    // Height above the ground, in radii: the puff thins out where it meets the ground.
    vAbove = (world.y - aLook.z) / aPuff.w;
    // Looking towards the sun through the dust: the light it scatters forward.
    vAgainst = max(dot(normalize(aPuff.xyz - cameraPosition), uSunDir), 0.0);
    vec4 mvPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uCloud;
  uniform vec3 uAlbedo;
  uniform vec3 uSun;
  uniform vec3 uSky;
  uniform vec3 uGround;
  varying vec2 vUv;
  varying float vOpacity;
  varying float vSeed;
  varying float vAbove;
  varying float vAgainst;
  #include <fog_pars_fragment>
  void main() {
    float cell = floor(vSeed * 4.0);
    vec2 corner = vec2(mod(cell, 2.0), floor(cell / 2.0)) * 0.5;
    // Rows of the texture run top to bottom; the cell's v runs bottom to top.
    vec2 inCell = clamp(vec2(vUv.x, 1.0 - vUv.y), 0.0, 1.0);
    vec4 cloud = texture2D(uCloud, corner + inCell * 0.5);
    float alpha = cloud.r * vOpacity * smoothstep(0.0, 0.35, vAbove);
    if (alpha < 0.002) discard;
    float lit = cloud.g;
    vec3 light = mix(uGround, uSky, 0.35 + 0.65 * lit)
      + uSun * (0.35 + 0.45 * lit + 1.6 * pow(vAgainst, 8.0));
    gl_FragColor = vec4(uAlbedo * light, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export class Dust {
  readonly mesh: Mesh;
  private readonly geometry: InstancedBufferGeometry;
  private readonly material: ShaderMaterial;
  private readonly cloud: DataTexture;
  private readonly puffs: InstancedBufferAttribute;
  private readonly looks: InstancedBufferAttribute;
  private readonly level: number;
  private readonly sources: DustSource[];
  private readonly clock: BattleClock;
  private readonly heightAt: HeightAt;
  private readonly wet: Wet;
  /** Down the wind, on the field (east, north), metres per second of playback. */
  private readonly windEast: number;
  private readonly windNorth: number;
  private readonly key: UnitKey = {
    center: { x: 0, y: 0 },
    frontage: 0,
    depth: 0,
    facing: 0,
    bulge: 0,
    men: 0,
    action: "stand",
  };
  private readonly point = { x: 0, y: 0 };
  /**
   * What each rising left (FIELDS numbers per puff, MAX_PUFFS puffs per
   * rising, RING risings per unit), and which rising each ring slot holds.
   * Only a memo: a rising is worked out from the clock alone, so a slot
   * worked out again holds the same numbers.
   */
  private readonly slots: Float32Array;
  private readonly risen: Int32Array;
  private count = 0;
  private lastSeconds = NaN;
  private readonly lastCamera = new Vector3(NaN, NaN, NaN);

  constructor(battle: Battle, sources: DustSource[], clock: BattleClock, heightAt: HeightAt, wet: Wet = () => false) {
    this.level = Math.min(Math.max(battle.terrain.scenery?.dust?.level ?? 0, 0), 1);
    this.sources = sources;
    this.clock = clock;
    this.heightAt = heightAt;
    this.wet = wet;
    const wind = battle.terrain.scenery?.wind;
    // `from` is where the wind blows from: the dust goes the other way.
    const a = (((wind?.from ?? 0) + 180) * Math.PI) / 180;
    const drift = wind ? Math.max(wind.speed * DRIFT, MIN_DRIFT) : 0;
    this.windEast = Math.sin(a) * drift;
    this.windNorth = Math.cos(a) * drift;
    this.slots = new Float32Array(sources.length * RING * MAX_PUFFS * FIELDS);
    this.risen = new Int32Array(sources.length * RING).fill(-1);

    this.geometry = new InstancedBufferGeometry();
    this.geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3),
    );
    this.geometry.setIndex([0, 1, 2, 0, 2, 3]);
    this.puffs = new InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4);
    this.looks = new InstancedBufferAttribute(new Float32Array(CAPACITY * 4), 4);
    this.puffs.setUsage(DynamicDrawUsage);
    this.looks.setUsage(DynamicDrawUsage);
    this.geometry.setAttribute("aPuff", this.puffs);
    this.geometry.setAttribute("aLook", this.looks);
    this.geometry.instanceCount = 0;

    this.cloud = cloudTexture();
    this.material = new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        UniformsLib.fog,
        {
          uCloud: { value: null },
          uAlbedo: { value: new Color() },
          uSun: { value: new Color() },
          uSky: { value: new Color() },
          uGround: { value: new Color() },
          uSunDir: { value: new Vector3(0, 1, 0) },
        },
      ]),
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    this.material.uniforms.uCloud.value = this.cloud;
    this.material.uniforms.uAlbedo.value.copy(ALBEDO);

    this.mesh = new Mesh(this.geometry, this.material);
    // Puffs are all over the field: one sphere round them would be the field.
    this.mesh.frustumCulled = false;
    // After the markings on the ground and the figures.
    this.mesh.renderOrder = 5;
    this.mesh.visible = this.level > 0;
  }

  /** Whether the battle has any dust to raise. */
  get active(): boolean {
    return this.level > 0 && this.sources.length > 0;
  }

  /** Puffs drawn this frame, for tests. */
  get drawn(): number {
    return this.count;
  }

  /**
   * Every frame the dust is shown: `seconds` of playback at the battle time
   * shown, the camera's position (puffs close to it fade out, so the camera
   * never sits inside a wall of dust), the sky for the light.
   */
  update(seconds: number, camera: Vector3, sky: Sky): void {
    this.light(sky);
    if (!this.active) return;
    // The puffs follow from the clock: same time, same camera, same puffs.
    if (seconds === this.lastSeconds && camera.equals(this.lastCamera)) return;
    this.lastSeconds = seconds;
    this.lastCamera.copy(camera);

    const puffs = this.puffs.array as Float32Array;
    const looks = this.looks.array as Float32Array;
    const slots = this.slots;
    let n = 0;
    const first = Math.max(Math.ceil((seconds - LIFE) / STEP), 0);
    const last = Math.floor(seconds / STEP);
    for (let i = 0; i < this.sources.length && n < CAPACITY; i++) {
      for (let j = first; j <= last && n < CAPACITY; j++) {
        const ring = i * RING + (j % RING);
        if (this.risen[ring] !== j) this.rise(i, j, ring);
        const age = seconds - j * STEP;
        const base = ring * MAX_PUFFS * FIELDS;
        for (let k = 0; k < MAX_PUFFS && n < CAPACITY; k++) {
          const s = base + k * FIELDS;
          if (slots[s] === 0) continue;
          const life = slots[s + 5];
          if (age > life) continue;
          const x = slots[s + 1] + slots[s + 8] * age;
          const y = slots[s + 2] + slots[s + 9] * age;
          const ground = slots[s + 3];
          const radius = slots[s + 4] + GROWTH * age;
          const height = ground + radius * 0.42 + RISE * age;
          // In world space: x east, y up, z south.
          const dx = x - camera.x;
          const dy = height - camera.y;
          const dz = -y - camera.z;
          const near = smoothstep(radius * 0.6, radius * 2, Math.sqrt(dx * dx + dy * dy + dz * dz));
          const fade = 1 - age / life;
          const opacity = slots[s + 6] * smoothstep(0, 0.5, age) * fade * Math.sqrt(fade) * near;
          if (opacity < 0.003) continue;
          const o = n * 4;
          puffs[o] = x;
          puffs[o + 1] = height;
          puffs[o + 2] = -y;
          puffs[o + 3] = radius;
          looks[o] = opacity;
          looks[o + 1] = slots[s + 7];
          looks[o + 2] = ground;
          // A slow turn as it drifts, so the lumps roll.
          looks[o + 3] = slots[s + 10] + slots[s + 11] * age;
          n++;
        }
      }
    }
    this.count = n;
    this.geometry.instanceCount = n;
    if (n > 0) {
      for (const attribute of [this.puffs, this.looks]) {
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0, n * 4);
        attribute.needsUpdate = true;
      }
    }
  }

  /**
   * The j-th rising of dust by source i, into its ring slot: how many puffs
   * the unit raises then and where, from its formation and its speed at that
   * moment of the battle.
   */
  private rise(i: number, j: number, ring: number): void {
    this.risen[ring] = j;
    const slots = this.slots;
    const base = ring * MAX_PUFFS * FIELDS;
    for (let k = 0; k < MAX_PUFFS; k++) slots[base + k * FIELDS] = 0;

    const { track, mounted } = this.sources[i];
    const rose = j * STEP;
    // Where the unit was a moment before, then where it is: its speed.
    const before = Math.max(rose - SPEED_WINDOW, 0);
    const was = track.formationAt(this.clock.time(before));
    const wasX = was.center.x;
    const wasY = was.center.y;
    this.copyKey(track.formationAt(this.clock.time(rose)));
    const key = this.key;
    if (key.men < 1) return;
    const [from, full] = mounted ? HORSE_SPEED : FOOT_SPEED;
    const speed = rose > before ? Math.hypot(key.center.x - wasX, key.center.y - wasY) / (rose - before) : 0;
    const moving = smoothstep(from, full, speed);
    const fighting = key.action === "fight" ? FIGHT_DUST : 0;
    const strength = Math.max(moving, fighting);
    if (strength < 0.02) return;
    const atFront = fighting > moving;
    const count = Math.min(Math.max(Math.round(key.men / (mounted ? MEN_PER_PUFF_HORSE : MEN_PER_PUFF_FOOT)), 1), MAX_PUFFS);
    const thickest = (mounted ? OPACITY_HORSE : OPACITY_FOOT) * this.level * (atFront ? 0.8 : 0.6 + 0.4 * moving);
    for (let k = 0; k < count; k++) {
      const seed = mix(Math.imul(i + 1, 0x27d4eb2d) ^ mix(Math.imul(j + 1, 0x165667b1) ^ Math.imul(k + 1, 0x9e3779b1)));
      // Not every slot rises: as many as the strength calls for.
      if (draw(seed, 0) >= strength) continue;
      // Where it rose: the rear part of a moving unit and a little behind it, the front of a fight.
      const u = draw(seed, 2) - 0.5;
      const v = atFront ? -0.05 + 0.2 * draw(seed, 3) : 0.3 + 0.9 * draw(seed, 3);
      formationPoint(key, u, v, this.point);
      // Men wading raise no dust.
      if (this.wet(this.point.x, this.point.y)) continue;
      const s = base + k * FIELDS;
      slots[s] = 1;
      slots[s + 1] = this.point.x;
      slots[s + 2] = this.point.y;
      // The plain is flat enough that a puff keeps the ground it rose from.
      slots[s + 3] = this.heightAt(this.point.x, this.point.y);
      slots[s + 4] = (mounted ? RADIUS_HORSE : RADIUS_FOOT) * (0.8 + 0.4 * draw(seed, 6));
      slots[s + 5] = LIFE * (mounted ? 1 : FOOT_LIFE) * (0.65 + 0.35 * draw(seed, 1));
      slots[s + 6] = thickest;
      slots[s + 7] = draw(seed, 7);
      slots[s + 8] = this.windEast + (draw(seed, 4) - 0.5) * SPREAD;
      slots[s + 9] = this.windNorth + (draw(seed, 5) - 0.5) * SPREAD;
      slots[s + 10] = draw(seed, 8) * Math.PI * 2;
      slots[s + 11] = (draw(seed, 9) - 0.5) * 0.25;
    }
  }

  /** The light on the dust, from the sky of this frame (the same sums as a matte surface). */
  private light(sky: Sky): void {
    const u = this.material.uniforms;
    const scale = 1 / Math.PI;
    u.uSun.value.copy(sky.light.color).multiplyScalar(sky.light.intensity * scale);
    u.uSky.value.copy(sky.ambient.color).multiplyScalar(sky.ambient.intensity * scale);
    u.uGround.value.copy(sky.ambient.groundColor).multiplyScalar(sky.ambient.intensity * scale);
    u.uSunDir.value.copy(sky.lightDirection);
  }

  private copyKey(from: UnitKey): void {
    const key = this.key;
    key.center.x = from.center.x;
    key.center.y = from.center.y;
    key.frontage = from.frontage;
    key.depth = from.depth;
    key.facing = from.facing;
    key.bulge = from.bulge;
    key.men = from.men;
    key.action = from.action;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.cloud.dispose();
  }
}
