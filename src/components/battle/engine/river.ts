/**
 * A river: one strip laid on the ground along its course, wide enough for the
 * bed and for the belt of growth on both banks. The shader paints, from the
 * middle outwards, the water, the bars of gravel of the bed and the banks.
 *
 * At low water (BattleRiver.level) the stream is narrower than its bed and
 * wanders from side to side in it, leaving bars of gravel; at a ford it
 * spreads thin over the whole bed. Without that it fills the bed.
 *
 * The water takes the colour of the sky at a low angle and a glint of the
 * sun, and its ripples run downstream.
 */

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  type IUniform,
  Mesh,
  MeshLambertMaterial,
  Vector3,
} from "three";
import type { BattleLandmark, BattleRiver } from "@/lib/battle";

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
  deep: new Color("#3f6672"),
  shallow: new Color("#7d8f78"),
  gravel: new Color("#b9ad95"),
  reedDark: new Color("#66783f"),
  reedLight: new Color("#98985a"),
};

export class River {
  readonly mesh: Mesh;
  private readonly uniforms: Record<string, IUniform>;

  constructor(river: BattleRiver, landmarks: BattleLandmark[], heightAt: HeightAt) {
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
      uReedDark: { value: COLORS.reedDark },
      uReedLight: { value: COLORS.reedLight },
      uSkyZenith: { value: new Color() },
      uSkyHorizon: { value: new Color() },
      uSunDir: { value: new Vector3(0, 1, 0) },
      uGlint: { value: new Color() },
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
          varying vec2 vCourse;
          varying float vLand;
          varying vec3 vRiverWorld;`,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          vCourse = aCourse;
          vLand = aLand;
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
          uniform vec3 uReedDark;
          uniform vec3 uReedLight;
          uniform vec3 uSkyZenith;
          uniform vec3 uSkyHorizon;
          uniform vec3 uSunDir;
          uniform vec3 uGlint;
          varying vec2 vCourse;
          varying float vLand;
          varying vec3 vRiverWorld;
          vec3 riverGlow = vec3(0.0);
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
          // The height of the ripples: two layers running downstream at different speeds.
          float riverRipple(vec2 p) {
            return riverNoise(vec2(p.x - uTime * 1.1, p.y) * 0.35)
              + 0.4 * riverNoise(vec2(p.x - uTime * 1.9, p.y + uTime * 0.2) * 1.1 + 7.0);
          }`,
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

            // Bed: pale gravel, speckled, darker where it is wet by the water.
            float pebbles = riverNoise(vec2(s, m) * 2.3 + 5.0);
            float bars = riverNoise(vec2(s * 0.06, m * 0.2) + 19.0);
            vec3 bed = uGravel * (0.8 + 0.28 * bars) * (0.93 + 0.14 * pebbles * (1.0 - smoothstep(40.0, 260.0, distance)));
            // Weeds take hold on the bars away from the water.
            float weeds = smoothstep(0.55, 0.8, clumps * 0.6 + bars * 0.4) * smoothstep(-2.0, -9.0, inWater);
            bed = mix(bed, uReedLight * 0.95, weeds * 0.6);
            bed = mix(bed, bed * 0.66, smoothstep(-3.0, 0.0, inWater));

            // Water: the bed shows through at the edges and at a ford.
            float depth = smoothstep(0.0, waterHalf * 0.75, inWater) * (1.0 - 0.75 * ford);
            vec3 water = mix(mix(bed, uShallow, 0.7), uDeep, depth);

            float waterMask = smoothstep(-soft, soft, inWater);
            float bedMask = smoothstep(-soft, soft, inBed);
            vec3 color = mix(bank, bed, bedMask);
            color = mix(color, water, waterMask);
            float alpha = mix(bankAlpha, 1.0, bedMask);

            // What the water throws back: the sky by Fresnel, and the sun.
            vec2 rp = vec2(s, m);
            float h0 = riverRipple(rp);
            float steep = (0.16 + 0.3 * ford) * (1.0 - smoothstep(120.0, 900.0, distance));
            vec3 n = normalize(vec3(
              (h0 - riverRipple(rp + vec2(0.4, 0.0))) * steep,
              1.0,
              (h0 - riverRipple(rp + vec2(0.0, 0.4))) * steep));
            vec3 toEye = normalize(cameraPosition - vRiverWorld);
            float facing = clamp(dot(n, toEye), 0.0, 1.0);
            float fresnel = 0.03 + 0.97 * pow(1.0 - facing, 5.0);
            vec3 mirrored = reflect(-toEye, n);
            vec3 sky = mix(uSkyHorizon, uSkyZenith, pow(clamp(mirrored.y, 0.0, 1.0), 0.5));
            float sun = pow(max(dot(mirrored, uSunDir), 0.0), 180.0);
            float shine = waterMask * (0.35 + 0.65 * depth);
            riverGlow = (sky * fresnel * 0.7 + uGlint * sun) * shine;
            color *= 1.0 - fresnel * 0.7 * shine;

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
