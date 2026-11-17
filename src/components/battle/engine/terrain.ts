/**
 * The ground: a mesh built from the elevation grid of the battle, coloured by
 * height and slope, with river surfaces laid on top.
 *
 * World axes: +X east, +Y up, -Z north, so a field point (x, y) sits at
 * world (x, height, -y).
 */

import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshLambertMaterial,
  Vector3,
} from "three";
import { type BattleTerrain, type FieldPoint, terrainUrl } from "@/lib/battle";

export type HeightAt = (x: number, y: number) => number;

/** How far the flat apron around the grid reaches, metres. */
const APRON = 40000;

const PALETTE = {
  stubble: new Color("#b9a66a"),
  grass: new Color("#8e9655"),
  earth: new Color("#a38a62"),
  scrub: new Color("#7f8552"),
  rock: new Color("#958b7b"),
  cliff: new Color("#86837d"),
  bank: new Color("#6d8546"),
  water: new Color("#4d7688"),
};

/** Reads the grid: Int16 little-endian decimetres, rows north to south. */
export async function loadHeights(
  terrain: BattleTerrain,
  signal: AbortSignal,
): Promise<Float32Array> {
  const cells = terrain.width * terrain.height;
  const heights = new Float32Array(cells);
  try {
    const response = await fetch(terrainUrl(terrain.file), { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < cells * 2) {
      throw new Error(`expected ${cells * 2} bytes, got ${buffer.byteLength}`);
    }
    const view = new DataView(buffer);
    for (let i = 0; i < cells; i++) heights[i] = view.getInt16(i * 2, true) / 10;
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn(`Battle terrain ${terrain.file} could not be read; using flat ground.`, error);
    heights.fill(0);
  }
  return heights;
}

function distanceToSegment(px: number, py: number, a: FieldPoint, b: FieldPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.min(Math.max(((px - a.x) * dx + (py - a.y) * dy) / lengthSq, 0), 1);
  return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t));
}

export class Terrain {
  readonly group = new Group();
  readonly minHeight: number;
  readonly maxHeight: number;
  readonly data: BattleTerrain;
  private readonly heights: Float32Array;
  private readonly cellX: number;
  private readonly cellY: number;

  constructor(data: BattleTerrain, heights: Float32Array) {
    this.data = data;
    this.heights = heights;
    this.cellX = (data.maxX - data.minX) / Math.max(data.width - 1, 1);
    this.cellY = (data.maxY - data.minY) / Math.max(data.height - 1, 1);
    let min = Infinity;
    let max = -Infinity;
    for (const h of heights) {
      if (h < min) min = h;
      if (h > max) max = h;
    }
    this.minHeight = Number.isFinite(min) ? min : 0;
    this.maxHeight = Number.isFinite(max) ? max : 0;

    this.group.add(this.buildGround());
    for (const river of data.rivers) {
      if (river.points.length < 2) continue;
      const water = new Mesh(
        buildRibbon(river.points, () => river.width / 2, this.heightAt, 0.35, 4),
        new MeshLambertMaterial({
          color: PALETTE.water,
          transparent: true,
          opacity: 0.88,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -4,
        }),
      );
      water.receiveShadow = true;
      water.renderOrder = 1;
      this.group.add(water);
    }
  }

  /**
   * Ground height at a field point, metres. Matches the mesh exactly: each
   * cell is two triangles split from north-west to south-east.
   */
  readonly heightAt: HeightAt = (x, y) => {
    const { width, height, minX, maxY } = this.data;
    const gx = Math.min(Math.max((x - minX) / this.cellX, 0), width - 1);
    const gy = Math.min(Math.max((maxY - y) / this.cellY, 0), height - 1);
    const col = Math.min(Math.floor(gx), Math.max(width - 2, 0));
    const row = Math.min(Math.floor(gy), Math.max(height - 2, 0));
    const fx = gx - col;
    const fy = gy - row;
    const col1 = Math.min(col + 1, width - 1);
    const row1 = Math.min(row + 1, height - 1);
    const nw = this.heights[row * width + col];
    const ne = this.heights[row * width + col1];
    const sw = this.heights[row1 * width + col];
    const se = this.heights[row1 * width + col1];
    return fx >= fy
      ? nw + (ne - nw) * fx + (se - ne) * fy
      : nw + (sw - nw) * fy + (se - sw) * fx;
  };

  private buildGround(): Mesh {
    const { width, height, minX, maxX, minY, maxY, rivers } = this.data;
    // One extra ring of vertices carries the edge heights far out, so the
    // ground reaches the horizon instead of ending in a cliff.
    const cols = width + 2;
    const rows = height + 2;
    const positions = new Float32Array(cols * rows * 3);
    // Per vertex: a colour laid over the procedural ground (rock on slopes,
    // scrub on heights, green by the river) and how strongly.
    const colors = new Float32Array(cols * rows * 3);
    const overlay = new Float32Array(cols * rows);
    const relief = Math.max(this.maxHeight - this.minHeight, 1);
    const hasRelief = this.maxHeight - this.minHeight > 20;
    const color = new Color();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gc = Math.min(Math.max(c - 1, 0), width - 1);
        const gr = Math.min(Math.max(r - 1, 0), height - 1);
        let x = minX + gc * this.cellX;
        let y = maxY - gr * this.cellY;
        if (c === 0) x = minX - APRON;
        if (c === cols - 1) x = maxX + APRON;
        if (r === 0) y = maxY + APRON;
        if (r === rows - 1) y = minY - APRON;
        const h = this.heights[gr * width + gc];
        const i = (r * cols + c) * 3;
        positions[i] = x;
        positions[i + 1] = h;
        positions[i + 2] = -y;

        // Slope from the neighbouring cells, as rise over run.
        const west = this.heights[gr * width + Math.max(gc - 1, 0)];
        const east = this.heights[gr * width + Math.min(gc + 1, width - 1)];
        const north = this.heights[Math.max(gr - 1, 0) * width + gc];
        const south = this.heights[Math.min(gr + 1, height - 1) * width + gc];
        const slope = Math.hypot((east - west) / (2 * this.cellX), (north - south) / (2 * this.cellY));

        const gx = minX + gc * this.cellX;
        const gy = maxY - gr * this.cellY;
        let weight = 0;
        const mix = (target: Color, amount: number) => {
          if (amount <= 0) return;
          const total = weight + amount * (1 - weight);
          color.lerp(target, amount / total);
          weight = total;
        };
        color.copy(PALETTE.scrub);
        if (hasRelief) mix(PALETTE.scrub, smooth(0.45, 0.95, (h - this.minHeight) / relief) * 0.6);
        mix(PALETTE.rock, smooth(0.18, 0.4, slope));
        mix(PALETTE.cliff, smooth(0.45, 0.8, slope));
        let nearest = Infinity;
        for (const river of rivers) {
          for (let p = 1; p < river.points.length; p++) {
            const d = distanceToSegment(gx, gy, river.points[p - 1], river.points[p]) - river.width / 2;
            if (d < nearest) nearest = d;
          }
        }
        if (nearest < 400) mix(PALETTE.bank, (1 - smooth(20, 400, nearest)) * 0.75);
        overlay[r * cols + c] = weight;
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
    }

    const quads = (cols - 1) * (rows - 1);
    const index = new Uint32Array(quads * 6);
    let k = 0;
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const nw = r * cols + c;
        const ne = nw + 1;
        const sw = nw + cols;
        const se = sw + 1;
        index[k++] = nw;
        index[k++] = se;
        index[k++] = ne;
        index[k++] = nw;
        index[k++] = sw;
        index[k++] = se;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("aOverlay", new BufferAttribute(overlay, 1));
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const material = new MeshLambertMaterial({ vertexColors: true });
    // The ground colour is made in the shader from layered noise, so it stays
    // crisp however coarse the elevation grid is.
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uStubble = { value: PALETTE.stubble };
      shader.uniforms.uGrass = { value: PALETTE.grass };
      shader.uniforms.uEarth = { value: PALETTE.earth };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          attribute float aOverlay;
          varying vec3 vGroundPos;
          varying float vOverlay;`,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          vGroundPos = position;
          vOverlay = aOverlay;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform vec3 uStubble;
          uniform vec3 uGrass;
          uniform vec3 uEarth;
          varying vec3 vGroundPos;
          varying float vOverlay;
          float groundHash(vec2 p) {
            vec3 q = fract(vec3(p.xyx) * 0.1031);
            q += dot(q, q.yzx + 33.33);
            return fract((q.x + q.y) * q.z);
          }
          float groundNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(groundHash(i), groundHash(i + vec2(1.0, 0.0)), u.x),
              mix(groundHash(i + vec2(0.0, 1.0)), groundHash(i + vec2(1.0, 1.0)), u.x),
              u.y);
          }
          float groundFbm(vec2 p) {
            float sum = 0.0;
            float amplitude = 0.5;
            for (int octave = 0; octave < 4; octave++) {
              sum += amplitude * groundNoise(p);
              p = p * 2.03 + 19.7;
              amplitude *= 0.5;
            }
            return sum / 0.9375;
          }`,
        )
        .replace(
          "#include <color_fragment>",
          /* glsl */ `{
            vec2 g = vGroundPos.xz;
            float distance = length(vViewPosition);
            // Broad regions of dry stubble and greener pasture, patches of
            // bare earth, then finer and finer mottling as the camera nears.
            float regions = groundFbm(g * 0.0011);
            float patches = groundFbm(g * 0.006 + 51.0);
            float mottle = groundFbm(g * 0.045 + 7.0);
            vec3 ground = mix(uStubble, uGrass, smoothstep(0.42, 0.62, regions * 0.65 + patches * 0.35));
            ground = mix(ground, uEarth, smoothstep(0.55, 0.78, patches * 0.6 + mottle * 0.4) * 0.55);
            ground = mix(ground, vColor.rgb, vOverlay);
            float near = 1.0 - smoothstep(40.0, 420.0, distance);
            float mid = 1.0 - smoothstep(300.0, 2600.0, distance);
            float grain = groundNoise(g * 1.3) * 0.6 + groundNoise(g * 0.31) * 0.4;
            ground *= 0.9 + 0.2 * (mottle - 0.5) * mid + 0.22 * (grain - 0.5) * near + 0.16 * (regions - 0.5);
            diffuseColor.rgb *= ground;
          }`,
        );
    };
    material.customProgramCacheKey = () => "battle-ground";

    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        (object.material as MeshLambertMaterial).dispose();
      }
    });
  }
}

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * A strip laid on the ground along a path of field points: rivers, arrows.
 * `halfWidth(s, length)` gives the half width at distance s along the path.
 * The strip carries `uv`: u runs 0..1 along the path, v 0..1 across it.
 */
export function buildRibbon(
  points: FieldPoint[],
  halfWidth: (s: number, length: number) => number,
  heightAt: HeightAt,
  lift: number,
  across: number,
  step = 20,
): BufferGeometry {
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(p.x, 0, -p.y)),
    false,
    "centripetal",
  );
  const length = curve.getLength();
  const segments = Math.min(Math.max(Math.ceil(length / step), 4), 400);
  const positions = new Float32Array((segments + 1) * (across + 1) * 3);
  const uvs = new Float32Array((segments + 1) * (across + 1) * 2);
  const point = new Vector3();
  const tangent = new Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, point);
    curve.getTangentAt(u, tangent);
    // Left of the direction of travel, in the ground plane.
    const nx = tangent.z;
    const nz = -tangent.x;
    const norm = Math.hypot(nx, nz) || 1;
    const half = halfWidth(u * length, length);
    for (let j = 0; j <= across; j++) {
      const v = j / across;
      const offset = (v * 2 - 1) * half;
      const x = point.x + (nx / norm) * offset;
      const z = point.z + (nz / norm) * offset;
      const k = i * (across + 1) + j;
      positions[k * 3] = x;
      positions[k * 3 + 1] = heightAt(x, -z) + lift;
      positions[k * 3 + 2] = z;
      uvs[k * 2] = u;
      uvs[k * 2 + 1] = v;
    }
  }

  const index = new Uint16Array(segments * across * 6);
  let k = 0;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * (across + 1) + j;
      const b = a + 1;
      const c = a + across + 1;
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
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(index, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
