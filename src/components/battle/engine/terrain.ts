/**
 * The ground: a mesh built from the elevation grid of the battle, coloured by
 * height and slope and by what covers it (BattleScenery.ground), with the
 * rivers laid on top (river.ts).
 *
 * Where the ground is harvested fields (`stubble`), the level parts are a
 * patchwork of fields: stubble, fallow and ploughed, each with its own tone
 * and its rows, with grassy baulks between. Close to the camera the rows show
 * one by one and catch the light.
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
import { type BattleTerrain, type FieldPoint, type GroundCover, terrainUrl } from "@/lib/battle";
import { River, type RiverLight } from "./river";

export type HeightAt = (x: number, y: number) => number;

/** How far the flat apron around the grid reaches, metres, when the battle has no far ground. */
const APRON = 40000;
/** Ground at or below this height, metres above sea level, is sea. */
export const SEA_LEVEL = 0.05;
/** The far ground sinks with distance as the curve of the earth makes it: d² / 2R. */
const EARTH_DIAMETER = 2 * 6371000;
const drop = (x: number, y: number): number => (x * x + y * y) / EARTH_DIAMETER;

const PALETTE = {
  stubble: new Color("#b9a66a"),
  grass: new Color("#8e9655"),
  earth: new Color("#a38a62"),
  scrub: new Color("#7f8552"),
  rock: new Color("#958b7b"),
  cliff: new Color("#86837d"),
  bank: new Color("#6d8546"),
  forest: new Color("#566643"),
  sea: new Color("#2c566e"),
  strand: new Color("#d3c59c"),
};

/**
 * The three colours the open ground is mixed from, by cover: the main one,
 * the one of its greener or darker regions, and the bare patches. `fields`
 * lays the patchwork of fields over level ground.
 */
const COVERS: Record<GroundCover, { main: Color; other: Color; bare: Color; fields: boolean }> = {
  stubble: { main: PALETTE.stubble, other: PALETTE.grass, bare: PALETTE.earth, fields: true },
  grass: { main: new Color("#a3a162"), other: PALETTE.grass, bare: PALETTE.earth, fields: false },
  scrub: { main: PALETTE.scrub, other: new Color("#6f7a4a"), bare: PALETTE.earth, fields: false },
  reeds: { main: new Color("#8a8f52"), other: PALETTE.bank, bare: PALETTE.earth, fields: false },
  woodland: { main: new Color("#6f7a4a"), other: new Color("#5d6b40"), bare: PALETTE.earth, fields: false },
  bare: { main: PALETTE.earth, other: new Color("#b09a72"), bare: PALETTE.rock, fields: false },
};
/** A battle without scenery: the ground as it was drawn before there was any. */
const PLAIN_COVER = { main: PALETTE.stubble, other: PALETTE.grass, bare: PALETTE.earth, fields: false };

/** Reads a grid: Int16 little-endian decimetres, rows north to south. */
async function readGrid(grid: { file: string; width: number; height: number }, signal: AbortSignal): Promise<Float32Array> {
  const cells = grid.width * grid.height;
  const heights = new Float32Array(cells);
  const response = await fetch(terrainUrl(grid.file), { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < cells * 2) {
    throw new Error(`expected ${cells * 2} bytes, got ${buffer.byteLength}`);
  }
  const view = new DataView(buffer);
  for (let i = 0; i < cells; i++) heights[i] = view.getInt16(i * 2, true) / 10;
  return heights;
}

/** The ground of the battle. If the file cannot be read: flat ground. */
export async function loadHeights(
  terrain: BattleTerrain,
  signal: AbortSignal,
): Promise<Float32Array> {
  try {
    return await readGrid(terrain, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn(`Battle terrain ${terrain.file} could not be read; using flat ground.`, error);
    return new Float32Array(terrain.width * terrain.height);
  }
}

/** The country around (BattleTerrain.far), or null: the scene then does without it. */
export async function loadFarHeights(
  terrain: BattleTerrain,
  signal: AbortSignal,
): Promise<Float32Array | null> {
  if (!terrain.far) return null;
  try {
    return await readGrid(terrain.far, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn(`Far terrain ${terrain.far.file} could not be read; the horizon stays flat.`, error);
    return null;
  }
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
  private readonly far: Float32Array | null;
  /** What the sea gives back of the sky; set every frame. */
  private readonly seaGlow = { value: new Color() };
  private readonly rivers: River[] = [];
  private readonly cellX: number;
  private readonly cellY: number;

  constructor(data: BattleTerrain, heights: Float32Array, far: Float32Array | null = null) {
    this.data = data;
    this.heights = heights;
    this.far = data.far ? far : null;
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
      const drawn = new River(river, data.landmarks, this.heightAt);
      this.rivers.push(drawn);
      this.group.add(drawn.mesh);
    }
  }

  /** Call every frame: moving water, and the sky it reflects. */
  update(seconds: number, sky: RiverLight): void {
    for (const river of this.rivers) river.update(seconds, sky);
    // The sea is always seen at a low angle: it mirrors the sky near the horizon.
    this.seaGlow.value.copy(sky.envHorizon).multiplyScalar(0.42);
  }

  /** Height of the far ground at a field point, metres above sea level (the sea is 0). */
  private farHeightAt(x: number, y: number): number {
    const far = this.data.far;
    const heights = this.far;
    if (!far || !heights) return 0;
    const gx = Math.min(Math.max(((x - far.minX) / (far.maxX - far.minX)) * (far.width - 1), 0), far.width - 1);
    const gy = Math.min(Math.max(((far.maxY - y) / (far.maxY - far.minY)) * (far.height - 1), 0), far.height - 1);
    const col = Math.min(Math.floor(gx), far.width - 2);
    const row = Math.min(Math.floor(gy), far.height - 2);
    const fx = gx - col;
    const fy = gy - row;
    const at = (c: number, r: number) => Math.max(heights[r * far.width + c], 0);
    return (
      (at(col, row) * (1 - fx) + at(col + 1, row) * fx) * (1 - fy) +
      (at(col, row + 1) * (1 - fx) + at(col + 1, row + 1) * fx) * fy
    );
  }

  /**
   * The hole the far ground leaves for the ground of the battle: whole cells
   * of the far grid, at least half a cell beyond the near grid on every side.
   */
  private farHole(): { colMin: number; colMax: number; rowMin: number; rowMax: number; minX: number; maxX: number; minY: number; maxY: number } | null {
    const far = this.data.far;
    if (!far || !this.far) return null;
    const cellX = (far.maxX - far.minX) / (far.width - 1);
    const cellY = (far.maxY - far.minY) / (far.height - 1);
    const colMin = Math.max(Math.floor((this.data.minX - far.minX) / cellX - 0.5), 0);
    const colMax = Math.min(Math.ceil((this.data.maxX - far.minX) / cellX + 0.5), far.width - 1);
    const rowMin = Math.max(Math.floor((far.maxY - this.data.maxY) / cellY - 0.5), 0);
    const rowMax = Math.min(Math.ceil((far.maxY - this.data.minY) / cellY + 0.5), far.height - 1);
    return {
      colMin,
      colMax,
      rowMin,
      rowMax,
      minX: far.minX + colMin * cellX,
      maxX: far.minX + colMax * cellX,
      maxY: far.maxY - rowMin * cellY,
      minY: far.maxY - rowMax * cellY,
    };
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
    // One extra ring of vertices carries the ground beyond the grid: onto
    // the edge of the far ground when there is one, and otherwise level and
    // far out, so that the ground reaches the horizon instead of ending in
    // a cliff.
    const hole = this.farHole();
    const cols = width + 2;
    const rows = height + 2;
    const positions = new Float32Array(cols * rows * 3);
    // Per vertex: a colour laid over the procedural ground (rock on slopes,
    // scrub on heights) and how strongly; then how steep the ground is (rise
    // over run) and how far the nearest river is, metres from its water.
    const colors = new Float32Array(cols * rows * 3);
    const overlay = new Float32Array(cols * rows);
    const lie = new Float32Array(cols * rows * 2);
    const sea = new Float32Array(cols * rows);
    const cover = this.data.scenery ? COVERS[this.data.scenery.ground.cover] : PLAIN_COVER;
    const relief = Math.max(this.maxHeight - this.minHeight, 1);
    const hasRelief = this.maxHeight - this.minHeight > 20;
    const color = new Color();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gc = Math.min(Math.max(c - 1, 0), width - 1);
        const gr = Math.min(Math.max(r - 1, 0), height - 1);
        let x = minX + gc * this.cellX;
        let y = maxY - gr * this.cellY;
        let h = this.heights[gr * width + gc];
        const onRing = c === 0 || c === cols - 1 || r === 0 || r === rows - 1;
        if (onRing && hole) {
          // Spread evenly along the edge of the hole, at the height of the far ground there.
          x = c === 0 ? hole.minX : c === cols - 1 ? hole.maxX : hole.minX + ((hole.maxX - hole.minX) * (c - 1)) / (width - 1);
          y = r === 0 ? hole.maxY : r === rows - 1 ? hole.minY : hole.maxY - ((hole.maxY - hole.minY) * (r - 1)) / (height - 1);
          const level = this.farHeightAt(x, y);
          h = level - drop(x, y);
          sea[r * cols + c] = level <= SEA_LEVEL ? 1 : 0;
        } else if (onRing) {
          if (c === 0) x = minX - APRON;
          if (c === cols - 1) x = maxX + APRON;
          if (r === 0) y = maxY + APRON;
          if (r === rows - 1) y = minY - APRON;
        }
        if (!onRing && h <= SEA_LEVEL) sea[r * cols + c] = 1;
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
        overlay[r * cols + c] = weight;
        lie[(r * cols + c) * 2] = slope;
        lie[(r * cols + c) * 2 + 1] = Math.min(Math.max(nearest, 0), 2000);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
    }

    // The elevation data steps from land to sea cell by cell; blurring the
    // mask rounds the shore that the shader draws where it crosses one half.
    for (let pass = 0; pass < 2; pass++) {
      const before = sea.slice();
      for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
          let sum = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) sum += before[(r + dr) * cols + c + dc];
          }
          sea[r * cols + c] = sum / 9;
        }
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
    geometry.setAttribute("aLie", new BufferAttribute(lie, 2));
    geometry.setAttribute("aSea", new BufferAttribute(sea, 1));
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const material = new MeshLambertMaterial({ vertexColors: true });
    // The ground colour is made in the shader from layered noise, so it stays
    // crisp however coarse the elevation grid is.
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uStubble = { value: cover.main };
      shader.uniforms.uGrass = { value: cover.other };
      shader.uniforms.uEarth = { value: cover.bare };
      shader.uniforms.uBank = { value: PALETTE.bank };
      shader.uniforms.uFields = { value: cover.fields ? 1 : 0 };
      shader.uniforms.uSea = { value: PALETTE.sea };
      shader.uniforms.uStrand = { value: PALETTE.strand };
      shader.uniforms.uSeaGlow = this.seaGlow;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          attribute float aOverlay;
          attribute vec2 aLie;
          attribute float aSea;
          varying vec3 vGroundPos;
          varying float vOverlay;
          varying vec2 vLie;
          varying float vSea;`,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          vGroundPos = position;
          vOverlay = aOverlay;
          vLie = aLie;
          vSea = aSea;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform vec3 uStubble;
          uniform vec3 uGrass;
          uniform vec3 uEarth;
          uniform vec3 uBank;
          uniform float uFields;
          uniform vec3 uSea;
          uniform vec3 uSeaGlow;
          uniform vec3 uStrand;
          varying vec3 vGroundPos;
          varying float vOverlay;
          varying vec2 vLie;
          varying float vSea;
          vec3 groundGlow = vec3(0.0);
          // The small relief of the ground (rows, clods, tufts), 0 to 1, and
          // how much of it shows at this distance: set with the colour, used
          // to bend the normal.
          float groundRelief = 0.0;
          float groundReliefShown = 0.0;
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
            float near = 1.0 - smoothstep(40.0, 420.0, distance);
            float mid = 1.0 - smoothstep(300.0, 2600.0, distance);
            float grain = groundNoise(g * 1.3) * 0.6 + groundNoise(g * 0.31) * 0.4;
            float tuft = groundNoise(g * 2.7 + 5.0);
            groundRelief = tuft * 0.5 + grain * 0.3;

            // Fields on level ground away from the river: long plots laid
            // like bricks, their edges bent a little so that no line is ruled.
            // Not all of it is tilled: stretches of open pasture lie between.
            float tilled = smoothstep(0.4, 0.5, groundFbm(g * 0.0008 + 91.0));
            float fieldShare = uFields * tilled * (1.0 - smoothstep(0.05, 0.12, vLie.x)) * smoothstep(45.0, 130.0, vLie.y);
            {
              vec2 plot = vec2(280.0, 140.0);
              vec2 fp = mat2(0.951, 0.309, -0.309, 0.951) * g;
              fp += (vec2(groundNoise(g * 0.0035 + 3.1), groundNoise(g * 0.0035 + 17.7)) - 0.5) * 170.0;
              fp += (vec2(groundNoise(g * 0.019 + 8.3), groundNoise(g * 0.019 + 27.1)) - 0.5) * 22.0;
              vec2 fc = fp / plot;
              fc.x += 0.5 * mod(floor(fc.y), 2.0);
              vec2 cell = floor(fc);
              vec2 inCell = fract(fc);
              // Half of the plots are split in two along their length.
              float split = step(0.5, groundHash(cell + 7.7));
              float part = floor(inCell.x * 2.0) * split;
              cell += vec2(part * 0.37, part * 0.11);
              inCell.x = mix(inCell.x, fract(inCell.x * 2.0), split);
              plot.x *= mix(1.0, 0.5, split);
              float kind = groundHash(cell * 1.7 + 9.1);
              float tone = groundHash(cell + 0.37);
              float turned = step(0.5, groundHash(cell * 0.61 + 4.2));
              vec2 toEdge = min(inCell, 1.0 - inCell) * plot;
              // The baulk between plots: 2.5 m of grass. Far off it is thinner
              // than a pixel, so it is drawn a pixel wide and that much fainter.
              float toBaulk = min(toEdge.x, toEdge.y);
              float baulkWidth = max(2.5, fwidth(toBaulk) * 1.5);
              float baulk = (1.0 - smoothstep(baulkWidth * 0.5, baulkWidth, toBaulk)) * (2.5 / baulkWidth);

              // Rows: the drill lines of the stubble, the furrows of the plough.
              float spacing = kind > 0.9 ? 1.9 : 1.15;
              float rowCoord = mix(fp.y, fp.x, turned) / spacing + (groundNoise(g * 0.09) - 0.5) * 0.7;
              float rowShown = 1.0 - smoothstep(0.18, 0.5, fwidth(rowCoord));
              float ridge = 1.0 - abs(fract(rowCoord) - 0.5) * 2.0;

              vec3 straw = uStubble * (0.93 + 0.16 * tone);
              vec3 soil = uEarth * (0.86 + 0.12 * tone);
              vec3 field;
              float relief;
              if (kind < 0.66) {
                // Stubble: pale rows of cut stalks over straw and soil.
                float stalk = smoothstep(0.35, 0.8, ridge) * (0.45 + 0.55 * tuft);
                vec3 between = mix(straw * 0.86, soil, 0.25);
                field = mix(between, straw * 1.12, mix(0.31, stalk, rowShown));
                relief = stalk * 0.7 + tuft * 0.2;
              } else if (kind < 0.9) {
                // Fallow: dry grass in clumps, no rows.
                float clump = smoothstep(0.4, 0.75, groundNoise(g * 0.8 + 11.0));
                vec3 fallow = mix(uGrass, uStubble, 0.45) * (0.9 + 0.15 * tone);
                field = mix(fallow, fallow * 0.8, clump * near);
                relief = clump * 0.6 + tuft * 0.3;
              } else {
                // Ploughed: dark furrows and lighter crests.
                float crest = smoothstep(0.2, 0.8, ridge);
                float clod = groundNoise(g * 1.9 + 23.0);
                field = mix(soil * 0.95, mix(soil * 0.82, soil * 1.08, crest) * (0.9 + 0.2 * clod), rowShown);
                relief = crest * 0.55 + clod * 0.45;
              }
              field = mix(field, mix(uGrass, uEarth, 0.35) * 0.9, baulk * 0.75);
              ground = mix(ground, field, fieldShare);
              groundRelief = mix(groundRelief, relief, fieldShare * rowShown);
            }

            ground = mix(ground, vColor.rgb, vOverlay);
            // Greener where the river keeps the ground moist.
            ground = mix(ground, uBank, (1.0 - smoothstep(10.0, 150.0, vLie.y)) * 0.32);
            // Close up, the cover breaks into tufts and bare spots.
            float speck = groundNoise(g * 6.3 + 2.0);
            ground *= 1.0 + (0.16 * (tuft - 0.5) + 0.1 * (speck - 0.5)) * (1.0 - smoothstep(25.0, 160.0, distance));
            ground *= 0.9 + 0.2 * (mottle - 0.5) * mid + 0.22 * (grain - 0.5) * near + 0.16 * (regions - 0.5);
            groundReliefShown = 1.0 - smoothstep(30.0, 190.0, distance);
            // The shore: a strand of sand, then shallows, then the sea.
            float shore = vSea + (mottle - 0.5) * 0.12;
            float seaShare = smoothstep(0.42, 0.6, shore);
            ground = mix(ground, uStrand * (0.92 + 0.16 * grain), smoothstep(0.05, 0.3, shore));
            ground = mix(ground, mix(uStrand, uSea, 0.55 + 0.45 * smoothstep(0.6, 0.95, shore)), seaShare);
            groundGlow = uSeaGlow * seaShare;
            groundReliefShown *= 1.0 - smoothstep(0.05, 0.3, shore);
            diffuseColor.rgb *= ground;
          }`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          /* glsl */ `#include <normal_fragment_maps>
          if (groundReliefShown > 0.0) {
            // The relief as a bump: its slope across the screen bends the normal.
            float bump = groundRelief * groundReliefShown * 0.22;
            vec3 across = dFdx(-vViewPosition);
            vec3 down = dFdy(-vViewPosition);
            vec3 r1 = cross(down, normal);
            vec3 r2 = cross(normal, across);
            float det = dot(across, r1);
            vec3 gradient = sign(det) * (dFdx(bump) * r1 + dFdy(bump) * r2);
            normal = normalize(abs(det) * normal - gradient);
          }`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          /* glsl */ `#include <emissivemap_fragment>
          totalEmissiveRadiance += groundGlow;`,
        );
    };
    material.customProgramCacheKey = () => "battle-ground";

    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    if (hole) this.group.add(this.buildFar(material, hole));
    return mesh;
  }

  /**
   * The country around, from the far grid, with a hole where the ground of
   * the battle lies. It shares the material of that ground, so the two meet
   * without a seam in colour.
   */
  private buildFar(material: MeshLambertMaterial, hole: { colMin: number; colMax: number; rowMin: number; rowMax: number }): Mesh {
    const far = this.data.far!;
    const heights = this.far!;
    const { width, height } = far;
    const cellX = (far.maxX - far.minX) / (width - 1);
    const cellY = (far.maxY - far.minY) / (height - 1);
    const positions = new Float32Array(width * height * 3);
    const colors = new Float32Array(width * height * 3);
    const overlay = new Float32Array(width * height);
    const lie = new Float32Array(width * height * 2);
    const sea = new Float32Array(width * height);
    const color = new Color();
    const at = (c: number, r: number) =>
      Math.max(heights[Math.min(Math.max(r, 0), height - 1) * width + Math.min(Math.max(c, 0), width - 1)], 0);

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const x = far.minX + c * cellX;
        const y = far.maxY - r * cellY;
        const h = at(c, r);
        const k = r * width + c;
        positions[k * 3] = x;
        positions[k * 3 + 1] = h - drop(x, y);
        positions[k * 3 + 2] = -y;
        sea[k] = heights[k] <= SEA_LEVEL ? 1 : 0;
        const slope = Math.hypot((at(c + 1, r) - at(c - 1, r)) / (2 * cellX), (at(c, r - 1) - at(c, r + 1)) / (2 * cellY));
        // Hills are wooded, and their steep sides bare; the coarse grid makes
        // every slope gentler than it is, so the thresholds are low.
        let weight = 0;
        const mix = (target: Color, amount: number) => {
          if (amount <= 0) return;
          const total = weight + amount * (1 - weight);
          color.lerp(target, amount / total);
          weight = total;
        };
        color.copy(PALETTE.forest);
        mix(PALETTE.scrub, smooth(60, 160, h) * 0.6);
        mix(PALETTE.forest, smooth(170, 480, h) * 0.8);
        mix(PALETTE.rock, smooth(0.16, 0.34, slope) * 0.7);
        overlay[k] = weight;
        colors[k * 3] = color.r;
        colors[k * 3 + 1] = color.g;
        colors[k * 3 + 2] = color.b;
        lie[k * 2] = slope;
        lie[k * 2 + 1] = 2000;
      }
    }

    const cells: number[] = [];
    for (let r = 0; r < height - 1; r++) {
      for (let c = 0; c < width - 1; c++) {
        if (c >= hole.colMin && c < hole.colMax && r >= hole.rowMin && r < hole.rowMax) continue;
        const nw = r * width + c;
        const ne = nw + 1;
        const sw = nw + width;
        const se = sw + 1;
        cells.push(nw, se, ne, nw, sw, se);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("aOverlay", new BufferAttribute(overlay, 1));
    geometry.setAttribute("aLie", new BufferAttribute(lie, 2));
    geometry.setAttribute("aSea", new BufferAttribute(sea, 1));
    geometry.setIndex(new BufferAttribute(new Uint32Array(cells), 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return new Mesh(geometry, material);
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
