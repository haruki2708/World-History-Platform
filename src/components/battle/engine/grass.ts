/**
 * Grass with a shape: tufts of blades standing on the ground round the
 * camera, with flowers among them.
 *
 * The tufts are one instanced mesh. Each has a place in a square of SPAN
 * metres; the vertex shader moves it to the copy of that square nearest the
 * camera, so the same tufts serve wherever the camera goes, and a tuft always
 * comes back to the same spot of ground. It reads the height of the ground
 * from a texture of the elevation grid, shrinks to nothing towards the edge
 * of the ring, and does not grow in water.
 */

import {
  BufferAttribute,
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshLambertMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { createRng } from "./rng";

/** Side of the square of tufts that repeats, metres. */
const SPAN = 300;
/** Tufts fade out at this distance from the camera, metres. */
const REACH = 145;
const TUFTS = 42000;

/** What the grass needs to know of the ground. */
export interface GrassGround {
  /** Heights of the elevation grid, one float a point, rows north to south. */
  heights: DataTexture;
  /** 255 where grass grows, 0 where it does not; any grid over the same ground. */
  mask: DataTexture;
  /** Columns and rows of the elevation grid. */
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Blades fanning from the foot of the picture: white on nothing, tinted by the shader. */
function drawBlades(): CanvasTexture {
  const SIZE = 256;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const rng = createRng(4107);
  ctx.clearRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 46; i++) {
    const foot = SIZE / 2 + (rng() - 0.5) * SIZE * 0.42;
    const lean = (rng() - 0.5) * SIZE * 0.85;
    const top = SIZE * (0.04 + rng() * 0.5);
    const base = 5 + rng() * 6;
    const light = Math.round(165 + rng() * 90);
    ctx.fillStyle = `rgb(${light},${light},${light})`;
    // A blade: broad at the foot, a point at the tip, bent to one side.
    ctx.beginPath();
    ctx.moveTo(foot - base, SIZE);
    ctx.quadraticCurveTo(foot + lean * 0.25 - base * 0.6, (SIZE + top) / 2, foot + lean, top);
    ctx.quadraticCurveTo(foot + lean * 0.35 + base * 0.6, (SIZE + top) / 2, foot + base, SIZE);
    ctx.closePath();
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export class Grass {
  readonly mesh: Mesh;
  private readonly texture: CanvasTexture;
  private readonly uniforms = {
    uEye: { value: new Vector3() },
    uGrassTime: { value: 0 },
    uWind: { value: new Vector2(1, 0) },
    uHeights: { value: null as DataTexture | null },
    uMask: { value: null as DataTexture | null },
    uGrid: { value: new Vector2() },
    uBounds: { value: new Vector4() },
    uFoot: { value: new Color("#4a6b2c") },
    uTip: { value: new Color("#93b356") },
  };

  constructor(ground: GrassGround, windFromDegrees?: number) {
    this.texture = drawBlades();
    const u = this.uniforms;
    u.uHeights.value = ground.heights;
    u.uMask.value = ground.mask;
    u.uGrid.value.set(ground.width, ground.height);
    u.uBounds.value.set(ground.minX, ground.maxX, ground.minY, ground.maxY);
    if (windFromDegrees !== undefined) {
      const a = ((windFromDegrees + 180) * Math.PI) / 180;
      u.uWind.value.set(Math.sin(a), -Math.cos(a));
    }

    // One tuft: three cards standing crosswise, a unit wide and a unit tall.
    const positions: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    for (let c = 0; c < 3; c++) {
      const a = (c * Math.PI) / 3;
      const dx = Math.cos(a) * 0.5;
      const dz = Math.sin(a) * 0.5;
      const corners: [number, number, number, number, number][] = [
        [-dx, 0, -dz, 0, 0],
        [dx, 0, dz, 1, 0],
        [dx, 1, dz, 1, 1],
        [-dx, 1, -dz, 0, 1],
      ];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const [x, y, z, s, t] = corners[i];
        positions.push(x, y, z);
        uvs.push(s, t);
        normals.push(0, 1, 0);
      }
    }
    const geometry = new InstancedBufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
    const rng = createRng(90210);
    const spots = new Float32Array(TUFTS * 3);
    for (let i = 0; i < TUFTS; i++) {
      spots[i * 3] = rng() * SPAN;
      spots[i * 3 + 1] = rng() * SPAN;
      spots[i * 3 + 2] = rng();
    }
    geometry.setAttribute("aSpot", new InstancedBufferAttribute(spots, 3));
    geometry.instanceCount = TUFTS;

    const material = new MeshLambertMaterial({ map: this.texture, alphaTest: 0.5, alphaToCoverage: true, side: DoubleSide });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          attribute vec3 aSpot;
          uniform vec3 uEye;
          uniform float uGrassTime;
          uniform vec2 uWind;
          uniform sampler2D uHeights;
          uniform sampler2D uMask;
          uniform vec2 uGrid;
          uniform vec4 uBounds;
          varying float vBlade;
          varying float vSeed;
          // Height of the ground at a field point (x east, y north), as the ground mesh
          // has it: each cell is two triangles split from north-west to south-east.
          float groundAt(vec2 field) {
            float gx = clamp((field.x - uBounds.x) / (uBounds.y - uBounds.x) * (uGrid.x - 1.0), 0.0, uGrid.x - 1.0);
            float gy = clamp((uBounds.w - field.y) / (uBounds.w - uBounds.z) * (uGrid.y - 1.0), 0.0, uGrid.y - 1.0);
            float col = min(floor(gx), uGrid.x - 2.0);
            float row = min(floor(gy), uGrid.y - 2.0);
            float fx = gx - col;
            float fy = gy - row;
            ivec2 at = ivec2(int(col), int(row));
            float nw = texelFetch(uHeights, at, 0).r;
            float ne = texelFetch(uHeights, at + ivec2(1, 0), 0).r;
            float sw = texelFetch(uHeights, at + ivec2(0, 1), 0).r;
            float se = texelFetch(uHeights, at + ivec2(1, 1), 0).r;
            return fx >= fy ? nw + (ne - nw) * fx + (se - ne) * fy : nw + (sw - nw) * fy + (se - sw) * fx;
          }`,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `
          // The copy of this tuft's spot that lies nearest the camera.
          vec2 spot = aSpot.xy + floor((uEye.xz - aSpot.xy) / ${SPAN.toFixed(1)} + 0.5) * ${SPAN.toFixed(1)};
          vec2 field = vec2(spot.x, -spot.y);
          float away = distance(spot, uEye.xz);
          float shown = 1.0 - smoothstep(${(REACH * 0.6).toFixed(1)}, ${REACH.toFixed(1)}, away);
          vec2 maskAt = vec2((field.x - uBounds.x) / (uBounds.y - uBounds.x), (uBounds.w - field.y) / (uBounds.w - uBounds.z));
          float inside = step(0.0, maskAt.x) * step(maskAt.x, 1.0) * step(0.0, maskAt.y) * step(maskAt.y, 1.0);
          shown *= smoothstep(0.35, 0.75, texture2D(uMask, maskAt).r) * inside;
          float seed = aSpot.z;
          float size = shown * (0.65 + 0.7 * fract(seed * 7.31));
          float turn = seed * 6.2832;
          vec3 blade = vec3(position.x * cos(turn) - position.z * sin(turn), position.y, position.x * sin(turn) + position.z * cos(turn));
          blade.xz *= 2.0 * size;
          blade.y *= 1.15 * size * (0.8 + 0.5 * fract(seed * 3.77));
          // The tips lean with the wind and stir.
          float stir = sin(uGrassTime * 2.1 + spot.x * 0.37 + spot.y * 0.29);
          blade.xz += (uWind * (0.22 + 0.12 * stir)) * position.y * position.y * size;
          vec3 transformed = vec3(spot.x, groundAt(field) - 0.05, spot.y) + blade;
          vBlade = position.y;
          vSeed = seed;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform vec3 uFoot;
          uniform vec3 uTip;
          varying float vBlade;
          varying float vSeed;`,
        )
        .replace(
          "#include <map_fragment>",
          /* glsl */ `#include <map_fragment>
          {
            // Dark at the foot, bright at the tip; every tuft of its own green.
            vec3 green = mix(uFoot, uTip, vBlade * (0.75 + 0.5 * fract(vSeed * 13.7)));
            green *= 0.85 + 0.3 * fract(vSeed * 5.3);
            // A few tufts are in flower: white, yellow or violet towards the tip.
            float flower = step(0.955, fract(vSeed * 91.3));
            vec3 petal = fract(vSeed * 17.1) < 0.4 ? vec3(0.95, 0.94, 0.86) : fract(vSeed * 17.1) < 0.75 ? vec3(0.96, 0.82, 0.25) : vec3(0.62, 0.5, 0.86);
            green = mix(green, petal, flower * smoothstep(0.55, 0.9, vBlade));
            diffuseColor.rgb *= green;
          }`,
        )
        .replace(
          "#include <normal_fragment_begin>",
          /* glsl */ `#include <normal_fragment_begin>
          normal = normalize(vNormal);`,
        );
    };
    material.customProgramCacheKey = () => "battle-grass";

    this.mesh = new Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
  }

  /** Call every frame with where the camera looks from. */
  update(eye: Vector3, seconds: number): void {
    this.uniforms.uEye.value.copy(eye);
    this.uniforms.uGrassTime.value = seconds;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshLambertMaterial).dispose();
    this.texture.dispose();
  }
}
