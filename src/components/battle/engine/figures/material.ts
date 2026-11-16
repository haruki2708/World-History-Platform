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
 */

import {
  Color,
  DoubleSide,
  FrontSide,
  type IUniform,
  MeshDepthMaterial,
  MeshLambertMaterial,
} from "three";
import type { UnitModel } from "./model";

export interface FigureShared {
  /** Seconds since the scene opened. */
  uTime: IUniform<number>;
  /** How much larger than life the figures are drawn. */
  uFigScale: IUniform<number>;
}

export interface FigureMaterials {
  material: MeshLambertMaterial;
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

void figureTransform(vec3 p, vec3 n) {
  vec4 r0;
  vec4 r1;
  vec4 r2;
  figBones(figFrame(iAnim.x), r0, r1, r2);
  if (iAnim.z > 0.001) {
    vec4 s0;
    vec4 s1;
    vec4 s2;
    figBones(figFrame(iAnim.y), s0, s1, s2);
    r0 = mix(r0, s0, iAnim.z);
    r1 = mix(r1, s1, iAnim.z);
    r2 = mix(r2, s2, iAnim.z);
  }
  vec4 p4 = vec4(p, 1.0);
  float size = uFigScale * (0.94 + 0.12 * fract(iSeed * 3.17));
  vec3 sp = vec3(dot(r0, p4), dot(r1, p4), dot(r2, p4)) * size;
  vec3 sn = vec3(dot(r0.xyz, n), dot(r1.xyz, n), dot(r2.xyz, n));
  float c = cos(iPosYaw.w);
  float s = sin(iPosYaw.w);
  figPosition = vec3(c * sp.x + s * sp.z, sp.y, c * sp.z - s * sp.x) + iPosYaw.xyz;
  figNormal = normalize(vec3(c * sn.x + s * sn.z, sn.y, c * sn.z - s * sn.x));
}
`;

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

  const material = new MeshLambertMaterial({
    vertexColors: true,
    map: model.map,
    side: model.doubleSided ? DoubleSide : FrontSide,
  });
  material.onBeforeCompile = (shader) => {
    bind(shader);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${PARS}`)
      .replace(
        "#include <color_vertex>",
        `#include <color_vertex>
        vColor.rgb *= mix(vec3(1.0), uTeam, aTeam) * (0.84 + 0.3 * fract(iSeed * 5.77));`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        "figureTransform(position, normal);\nvec3 objectNormal = figNormal;",
      )
      .replace("#include <begin_vertex>", "vec3 transformed = figPosition;");
  };
  material.customProgramCacheKey = () => "battle-figure";

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
    depthMaterial,
    dispose() {
      material.dispose();
      depthMaterial.dispose();
    },
  };
}
