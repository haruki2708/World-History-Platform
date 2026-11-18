/**
 * A river: one strip laid on the ground along its course, wide enough for the
 * bed and for the belt of growth on both banks. The shader paints, from the
 * middle outwards, the water, the bars of gravel of the bed and the banks.
 *
 * At low water (BattleRiver.level) the stream is narrower than its bed and
 * wanders from side to side in it, leaving bars of gravel; at a ford it
 * spreads thin over the whole bed. Without that it fills the bed.
 *
 * The water (water.ts) mirrors the sky and breaks the sun into sparkles on
 * its waves, which run downstream; foam gathers along its edges and over a
 * ford. The bed is a photograph of river gravel.
 */

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  type IUniform,
  Mesh,
  MeshLambertMaterial,
  type Texture,
  Vector3,
} from "three";
import type { BattleLandmark, BattleRiver } from "@/lib/battle";
import { WATER_GLSL } from "./water";

type HeightAt = (x: number, y: number) => number;

/** Ground at or below this height, metres above sea level, is sea (terrain.ts has the same). */
const SEA_LEVEL = 0.05;

/** What the water reflects; the engine's Sky has all of it. */
export interface RiverLight {
  readonly envZenith: Color;
  readonly envHorizon: Color;
  /** Unit vector towards the sun (the moon by night). */
  readonly lightDirection: Vector3;
  readonly light: { color: Color; intensity: number };
}

/** Along the course, a vertex every so many metres. */
const STEP = 8;
/** Quads across the strip. */
const ACROSS = 12;
/** The strip lies this far above the ground mesh, metres. */
const LIFT = 0.35;
/** The outer edge of the banks fades into the ground over this many metres. */
const FADE = 8;
/** A ford counts for a river when it lies within this many metres of its course. */
const FORD_REACH = 150;
const MAX_FORDS = 8;

const COLORS = {
  deep: new Color("#173a55"),
  shallow: new Color("#2c5662"),
  gravel: new Color("#8a7a5e"),
  earth: new Color("#7a6447"),
  reedDark: new Color("#66783f"),
  reedLight: new Color("#98985a"),
};

export class River {
  readonly mesh: Mesh;
  private readonly uniforms: Record<string, IUniform>;

  /** gravel: a photograph of river gravel, repeating (terrain.ts loads it). */
  constructor(river: BattleRiver, landmarks: BattleLandmark[], heightAt: HeightAt, gravel: Texture) {
    const low = river.level?.stage === "low";
    const waterHalf = river.width / 2;
    // At low water the bed is the wider thing; otherwise the water fills it.
    const bedHalf = low ? river.width * 0.95 : waterHalf * 1.08;
    const belt = river.banks ? river.banks.width + FADE : 0;
    const half = bedHalf + belt + 2;

    const curve = new CatmullRomCurve3(
      river.points.map((p) => new Vector3(p.x, 0, -p.y)),
      false,
      "centripetal",
    );
    const length = curve.getLength();
    const segments = Math.min(Math.max(Math.ceil(length / STEP), 4), 4000);
    const vertices = (segments + 1) * (ACROSS + 1);
    const positions = new Float32Array(vertices * 3);
    // Per vertex: metres along the course, metres left of its centre line;
    // then 1 on land and 0 in the sea, where the river ends.
    const coords = new Float32Array(vertices * 2);
    const land = new Float32Array(vertices);
    // Per vertex: the way the course runs, on the field (x east, then z).
    const flow = new Float32Array(vertices * 2);
    const point = new Vector3();
    const tangent = new Vector3();
    const centres: Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      curve.getPointAt(u, point);
      curve.getTangentAt(u, tangent);
      centres.push(point.clone());
      const nx = tangent.z;
      const nz = -tangent.x;
      const norm = Math.hypot(nx, nz) || 1;
      for (let j = 0; j <= ACROSS; j++) {
        const offset = ((j / ACROSS) * 2 - 1) * half;
        const x = point.x + (nx / norm) * offset;
        const z = point.z + (nz / norm) * offset;
        const k = i * (ACROSS + 1) + j;
        positions[k * 3] = x;
        const ground = heightAt(x, -z);
        positions[k * 3 + 1] = ground + LIFT;
        land[k] = ground > SEA_LEVEL ? 1 : 0;
        positions[k * 3 + 2] = z;
        coords[k * 2] = u * length;
        coords[k * 2 + 1] = offset;
        flow[k * 2] = tangent.x / norm;
        flow[k * 2 + 1] = tangent.z / norm;
      }
    }

    const index = new Uint32Array(segments * ACROSS * 6);
    let k = 0;
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < ACROSS; j++) {
        const a = i * (ACROSS + 1) + j;
        const b = a + 1;
        const c = a + ACROSS + 1;
        const d = c + 1;
        index[k++] = a;
        index[k++] = c;
        index[k++] = b;
        index[k++] = b;
        index[k++] = c;
        index[k++] = d;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aCourse", new BufferAttribute(coords, 2));
    geometry.setAttribute("aLand", new BufferAttribute(land, 1));
    geometry.setAttribute("aFlow", new BufferAttribute(flow, 2));
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    // Where the fords are, in metres along the course.
    const fords = new Float32Array(MAX_FORDS).fill(-1e6);
    let fordCount = 0;
    for (const mark of landmarks) {
      if (mark.kind !== "ford" || fordCount >= MAX_FORDS) continue;
      let best = Infinity;
      let at = 0;
      for (let i = 0; i <= segments; i++) {
        const d = Math.hypot(centres[i].x - mark.point.x, centres[i].z + mark.point.y);
        if (d < best) {
          best = d;
          at = (i / segments) * length;
        }
      }
      if (best <= FORD_REACH) fords[fordCount++] = at;
    }

    this.uniforms = {
      uTime: { value: 0 },
      uLow: { value: low ? 1 : 0 },
      uWaterHalf: { value: waterHalf },
      uBedHalf: { value: bedHalf },
      uHalf: { value: half },
      uBelt: { value: belt },
      uFords: { value: fords },
      uDeep: { value: COLORS.deep },
      uShallow: { value: COLORS.shallow },
      uGravel: { value: COLORS.gravel },
      uEarth: { value: COLORS.earth },
      uReedDark: { value: COLORS.reedDark },
      uReedLight: { value: COLORS.reedLight },
      uSkyZenith: { value: new Color() },
      uSkyHorizon: { value: new Color() },
      uSunDir: { value: new Vector3(0, 1, 0) },
      uGlint: { value: new Color() },
      uGravelMap: { value: gravel },
    };

    const material = new MeshLambertMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    const uniforms = this.uniforms;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          attribute vec2 aCourse;
          attribute float aLand;
          attribute vec2 aFlow;
          varying vec2 vCourse;
          varying float vLand;
          varying vec2 vFlow;
          varying vec3 vRiverWorld;`,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          vCourse = aCourse;
          vLand = aLand;
          vFlow = aFlow;
          vRiverWorld = (modelMatrix * vec4(position, 1.0)).xyz;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform float uTime;
          uniform float uLow;
          uniform float uWaterHalf;
          uniform float uBedHalf;
          uniform float uHalf;
          uniform float uBelt;
          uniform float uFords[${MAX_FORDS}];
          uniform vec3 uDeep;
          uniform vec3 uShallow;
          uniform vec3 uGravel;
          uniform vec3 uEarth;
          uniform vec3 uReedDark;
          uniform vec3 uReedLight;
          uniform vec3 uSkyZenith;
          uniform vec3 uSkyHorizon;
          uniform vec3 uSunDir;
          uniform vec3 uGlint;
          uniform sampler2D uGravelMap;
          varying vec2 vCourse;
          varying float vLand;
          varying vec2 vFlow;
          varying vec3 vRiverWorld;
          vec3 riverGlow = vec3(0.0);
          ${WATER_GLSL}
          float riverHash(vec2 p) {
            vec3 q = fract(vec3(p.xyx) * 0.1031);
            q += dot(q, q.yzx + 33.33);
            return fract((q.x + q.y) * q.z);
          }
          float riverNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(riverHash(i), riverHash(i + vec2(1.0, 0.0)), u.x),
              mix(riverHash(i + vec2(0.0, 1.0)), riverHash(i + vec2(1.0, 1.0)), u.x),
              u.y);
          }
`,
        )
        .replace(
          "#include <color_fragment>",
          /* glsl */ `{
            float s = vCourse.x;
            float m = vCourse.y;
            float distance = length(vViewPosition);
            float ford = 0.0;
            for (int i = 0; i < ${MAX_FORDS}; i++) {
              ford = max(ford, 1.0 - smoothstep(35.0, 110.0, abs(s - uFords[i])));
            }
            ford *= uLow;

            // The stream in its bed: its width and its place change along the course.
            float wander = (riverNoise(vec2(s / 170.0, 3.0)) - 0.5) * 2.0;
            float swell = riverNoise(vec2(s / 95.0, 41.0));
            float waterHalf = mix(uBedHalf * 0.97, uWaterHalf * mix(0.55, 1.05, swell), uLow);
            waterHalf = mix(waterHalf, uBedHalf * 0.92, ford);
            float centre = wander * (uBedHalf - waterHalf) * 0.85;
            float ragged = (riverNoise(vec2(s, m) * 0.3) - 0.5) * 3.0;
            // Metres inside the water, the bed and the strip; negative is outside.
            float inWater = waterHalf - abs(m - centre) + ragged;
            float inBed = uBedHalf - abs(m) + ragged * 0.5;
            float inStrip = uHalf - abs(m);
            // Edges are softened by about a pixel, more with distance.
            float soft = 0.35 + distance * 0.004;

            // Banks: a belt of reeds and low trees, seen from above as mottled green.
            float clumps = riverNoise(vec2(s, m) * 0.11);
            float fine = riverNoise(vec2(s, m) * 0.9 + 13.0);
            vec3 bank = mix(uReedDark, uReedLight, smoothstep(0.3, 0.75, clumps * 0.7 + fine * 0.3));
            float bankAlpha = uBelt > 0.0
              ? smoothstep(0.0, ${FADE.toFixed(1)}, inStrip) * (0.55 + 0.4 * clumps)
              : 0.0;

            // Bed: gravel (a photograph at two sizes, so that no repeat
            // shows), lighter on the bars, darker where it is wet.
            float bars = riverNoise(vec2(s * 0.06, m * 0.2) + 19.0);
            vec3 stones = mix(
              texture2D(uGravelMap, vec2(s, m) / 4.3 + 0.21).rgb,
              texture2D(uGravelMap, vec2(m, s) / 1.6).rgb,
              1.0 - smoothstep(25.0, 90.0, distance));
            // Gravel by the water; up the bank, earth: the bank is a slope
            // down to the stream, darker at its foot.
            float upBank = smoothstep(1.5, 6.0, -inWater);
            vec3 gravel = mix(uGravel, stones, 0.8) * (0.85 + 0.25 * bars);
            vec3 earth = uEarth * (0.8 + 0.4 * fine) * (0.85 + 0.3 * stones.g);
            vec3 bed = mix(gravel, earth, upBank * (0.55 + 0.45 * bars));
            // Grass and weeds take hold on the bars and up the bank.
            float weeds = smoothstep(0.45, 0.75, clumps * 0.6 + bars * 0.4) * smoothstep(-3.0, -10.0, inWater);
            bed = mix(bed, mix(uReedDark, uReedLight, fine) * 0.9, weeds * 0.75);
            // In the shade of the bank by the water, and wet.
            bed *= mix(1.0, 0.62, smoothstep(-4.0, 0.0, inWater));
            // The top of the bank, where the field ends: a darker lip.
            bed *= 1.0 - 0.25 * smoothstep(3.0, 0.0, inBed);

            // Water: the bed shows through at the edges and at a ford.
            float depth = smoothstep(0.0, waterHalf * 0.5, inWater) * (1.0 - 0.7 * ford);
            vec3 water = mix(mix(bed, uShallow, 0.75), uDeep, depth);

            float waterMask = smoothstep(-soft, soft, inWater);
            float bedMask = smoothstep(-soft, soft, inBed);
            vec3 color = mix(bank, bed, bedMask);
            color = mix(color, water, waterMask);
            float alpha = mix(bankAlpha, 1.0, bedMask);

            // What the water throws back (water.ts). The waves run
            // downstream with the current, rougher over a ford.
            vec2 rp = vec2(s - uTime * 0.6, m);
            float footprint = max(length(fwidth(vec2(s, m))), 0.01);
            // A lowland river in summer: smooth, ripples only where it runs over a ford.
            vec2 slope = waterSlope(rp, uTime, 0.0, 1.3, footprint, 0.72 - 0.5 * ford);
            // From the frame of the course (along, across) to the field.
            vec2 along = normalize(vFlow);
            vec2 across = vec2(along.y, -along.x);
            vec2 g = slope.x * along + slope.y * across;
            vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
            vec3 toEye = normalize(cameraPosition - vRiverWorld);
            float fresnel;
            vec3 thrown = waterLight(n, toEye, uSunDir, uGlint, uSkyZenith, uSkyHorizon, fresnel);
            float shine = waterMask * (0.35 + 0.65 * depth);

            // Foam: a broken line along the edges of the stream, more over a ford.
            float edge = 1.0 - smoothstep(0.0, 0.9 + 2.5 * ford, inWater);
            float foam = waterFoam(rp * vec2(0.9, 1.6), uTime) * waterMask
              * max(edge * 0.5, ford * 0.45 * smoothstep(0.3, 0.8, riverNoise(vec2(s * 0.08, m * 0.3) + 31.0)));
            foam *= 1.0 - smoothstep(250.0, 1200.0, distance) * 0.6;
            riverGlow = thrown * shine * (1.0 - foam);
            color *= 1.0 - fresnel * 0.8 * shine;
            color = mix(color, vec3(0.9, 0.92, 0.9), foam);

            // The river ends where the ground does: the sea takes over.
            float ashore = smoothstep(0.3, 0.7, vLand);
            riverGlow *= ashore;
            diffuseColor.rgb = color;
            diffuseColor.a = alpha * ashore;
          }`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          /* glsl */ `#include <emissivemap_fragment>
          totalEmissiveRadiance += riverGlow;`,
        );
    };
    material.customProgramCacheKey = () => "battle-river";

    this.mesh = new Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = 1;
  }

  /** Call every frame: the ripples move, and the water takes the sky of the hour. */
  update(seconds: number, sky: RiverLight): void {
    const u = this.uniforms;
    u.uTime.value = seconds;
    (u.uSkyZenith.value as Color).copy(sky.envZenith);
    (u.uSkyHorizon.value as Color).copy(sky.envHorizon);
    (u.uSunDir.value as Vector3).copy(sky.lightDirection);
    (u.uGlint.value as Color).copy(sky.light.color).multiplyScalar(sky.light.intensity * 0.5);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshLambertMaterial).dispose();
  }
}
