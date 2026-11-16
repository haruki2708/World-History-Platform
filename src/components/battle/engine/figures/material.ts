/**
 * Materials that draw a crowd of figures in one call per block. The vertex
 * shader reads the bone matrices of the current frame from the bone texture
 * of the model, skins the vertex, then moves it to the place of its figure.
 *
 * Per-figure attributes:
 *   iPosYaw  xyz = world position of the feet, w = rotation about +Y
 *   iAnim    x = clip, y = clip to blend towards, z = blend 0..1,
 *            w = seconds into the clip, for clips that do not loop
 *   iSeed    a fixed random number 0..1: animation offset, size, tint
 *
 * Two looks share that vertex work:
 *   - `material`: diffuse light only (Lambert). Every figure at low quality,
 *     and the far levels of detail at high quality.
 *   - `detailed`: physically based, with the normal and roughness-metalness
 *     maps of the model, for close figures at high quality. There is no
 *     environment map: reflections come from a sky gradient in the shader,
 *     fed from the sky lights, so bronze and iron read as metal.
 */

import {
  Color,
  DoubleSide,
  FrontSide,
  type IUniform,
  MeshDepthMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Vector2,
} from "three";
import type { UnitModel } from "./model";

export interface FigureShared {
  /** Seconds since the scene opened. */
  uTime: IUniform<number>;
  /** How much larger than life the figures are drawn. */
  uFigScale: IUniform<number>;
  /** Radiance of the sky overhead and of the ground below, for reflections. */
  uEnvSky: IUniform<Color>;
  uEnvGround: IUniform<Color>;
}

export interface FigureMaterials {
  material: MeshLambertMaterial;
  /** Null when the model has no maps beyond its colour (placeholders). */
  detailed: MeshStandardMaterial | null;
  depthMaterial: MeshDepthMaterial;
  dispose(): void;
}

const PARS = /* glsl */ `
attribute vec4 iPosYaw;
attribute vec4 iAnim;
attribute float iSeed;
attribute vec4 aBoneIndex;
attribute vec4 aBoneWeight;
attribute float aTeam;
uniform highp sampler2D uBoneTex;
uniform vec4 uClips[5];
uniform float uTime;
uniform float uFigScale;
uniform vec3 uTeam;
vec3 figPosition;
vec3 figNormal;
vec4 figR0;
vec4 figR1;
vec4 figR2;
float figCos;
float figSin;

float figFrame(float clip) {
  vec4 info = uClips[int(clip + 0.5)];
  float seconds = info.w > 0.5
    ? uTime * (0.88 + 0.24 * fract(iSeed * 7.31)) + iSeed * 23.0
    : iAnim.w;
  float frame = seconds * info.z;
  frame = info.w > 0.5 ? mod(frame, info.y) : min(frame, info.y - 1.0);
  return info.x + floor(frame);
}

void figBones(float row, out vec4 r0, out vec4 r1, out vec4 r2) {
  int y = int(row + 0.5);
  r0 = vec4(0.0);
  r1 = vec4(0.0);
  r2 = vec4(0.0);
  for (int k = 0; k < 4; k++) {
    float weight = aBoneWeight[k];
    if (weight > 0.0) {
      int x = int(aBoneIndex[k] + 0.5) * 3;
      r0 += weight * texelFetch(uBoneTex, ivec2(x, y), 0);
      r1 += weight * texelFetch(uBoneTex, ivec2(x + 1, y), 0);
      r2 += weight * texelFetch(uBoneTex, ivec2(x + 2, y), 0);
    }
  }
}

/** A direction in model space, turned like the figure: skinning, then yaw. */
vec3 figDirection(vec3 d) {
  vec3 m = vec3(dot(figR0.xyz, d), dot(figR1.xyz, d), dot(figR2.xyz, d));
  return normalize(vec3(figCos * m.x + figSin * m.z, m.y, figCos * m.z - figSin * m.x));
}

void figureTransform(vec3 p, vec3 n) {
  figBones(figFrame(iAnim.x), figR0, figR1, figR2);
  if (iAnim.z > 0.001) {
    vec4 s0;
    vec4 s1;
    vec4 s2;
    figBones(figFrame(iAnim.y), s0, s1, s2);
    figR0 = mix(figR0, s0, iAnim.z);
    figR1 = mix(figR1, s1, iAnim.z);
    figR2 = mix(figR2, s2, iAnim.z);
  }
  vec4 p4 = vec4(p, 1.0);
  float size = uFigScale * (0.94 + 0.12 * fract(iSeed * 3.17));
  vec3 sp = vec3(dot(figR0, p4), dot(figR1, p4), dot(figR2, p4)) * size;
  figCos = cos(iPosYaw.w);
  figSin = sin(iPosYaw.w);
  figPosition = vec3(figCos * sp.x + figSin * sp.z, sp.y, figCos * sp.z - figSin * sp.x) + iPosYaw.xyz;
  figNormal = figDirection(n);
}
`;

/** Sky reflections for the detailed material, in place of an environment map. */
const SKY_PARS = /* glsl */ `
uniform vec3 uEnvSky;
uniform vec3 uEnvGround;
vec3 figSkyRadiance(vec3 viewDir, vec3 normal, float roughness) {
  vec3 r = reflect(-viewDir, normal);
  r = normalize(mix(r, normal, roughness * roughness));
  r = transformDirectionByInverseViewMatrix(r, viewMatrix);
  // Rough surfaces see a softer horizon.
  float spread = 0.08 + 0.5 * roughness;
  return mix(uEnvGround, uEnvSky, smoothstep(-spread, spread, r.y));
}
`;

/** The vertex changes common to both looks. */
function figureVertex(vertexShader: string): string {
  return vertexShader
    .replace("#include <common>", `#include <common>\n${PARS}`)
    .replace(
      "#include <color_vertex>",
      `#include <color_vertex>
      vColor.rgb *= mix(vec3(1.0), uTeam, aTeam) * (0.84 + 0.3 * fract(iSeed * 5.77));`,
    )
    .replace(
      "#include <beginnormal_vertex>",
      `figureTransform(position, normal);
      vec3 objectNormal = figNormal;
      #ifdef USE_TANGENT
        vec3 objectTangent = figDirection(tangent.xyz);
      #endif`,
    )
    .replace("#include <begin_vertex>", "vec3 transformed = figPosition;");
}

export function createFigureMaterials(
  model: UnitModel,
  team: Color,
  shared: FigureShared,
): FigureMaterials {
  const uniforms = {
    uBoneTex: { value: model.boneTexture },
    uClips: { value: model.clipTable },
    uTeam: { value: new Color(team) },
  };
  const bind = (shader: { uniforms: Record<string, IUniform> }) => {
    shader.uniforms.uBoneTex = uniforms.uBoneTex;
    shader.uniforms.uClips = uniforms.uClips;
    shader.uniforms.uTeam = uniforms.uTeam;
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uFigScale = shared.uFigScale;
  };
  const side = model.doubleSided ? DoubleSide : FrontSide;

  const material = new MeshLambertMaterial({ vertexColors: true, map: model.map, side });
  material.onBeforeCompile = (shader) => {
    bind(shader);
    shader.vertexShader = figureVertex(shader.vertexShader);
  };
  material.customProgramCacheKey = () => "battle-figure";

  let detailed: MeshStandardMaterial | null = null;
  const surface = model.surface;
  if (surface) {
    detailed = new MeshStandardMaterial({
      vertexColors: true,
      map: model.map,
      side,
      normalMap: surface.normalMap,
      normalScale: new Vector2(surface.normalScale[0], surface.normalScale[1]),
      roughnessMap: surface.roughnessMap,
      metalnessMap: surface.metalnessMap,
      roughness: surface.roughness,
      metalness: surface.metalness,
    });
    detailed.onBeforeCompile = (shader) => {
      bind(shader);
      shader.uniforms.uEnvSky = shared.uEnvSky;
      shader.uniforms.uEnvGround = shared.uEnvGround;
      shader.vertexShader = figureVertex(shader.vertexShader);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${SKY_PARS}`)
        .replace(
          "#include <lights_fragment_maps>",
          `#include <lights_fragment_maps>
          #if defined( RE_IndirectSpecular )
            radiance += figSkyRadiance(geometryViewDir, geometryNormal, material.roughness);
          #endif`,
        );
    };
    detailed.customProgramCacheKey = () => "battle-figure-detailed";
  }

  const depthMaterial = new MeshDepthMaterial();
  depthMaterial.onBeforeCompile = (shader) => {
    bind(shader);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${PARS}`)
      .replace(
        "#include <begin_vertex>",
        "figureTransform(position, vec3(0.0, 1.0, 0.0));\nvec3 transformed = figPosition;",
      );
  };
  depthMaterial.customProgramCacheKey = () => "battle-figure-depth";

  return {
    material,
    detailed,
    depthMaterial,
    dispose() {
      material.dispose();
      detailed?.dispose();
      depthMaterial.dispose();
    },
  };
}
