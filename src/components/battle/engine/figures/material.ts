/**
 * Materials that draw a crowd of figures in one call per block. The vertex
 * shader reads the bone matrices of the current frame from the bone texture
 * of the model, skins the vertex, then moves it to the place of its figure.
 *
 * Per-figure attributes:
 *   iPosYaw  xyz = world position of the feet, w = rotation about +Y
 *   iAnim    x = clip, y = clip to blend towards, z = blend 0..1,
 *            w = for a standing figure, the ground it has covered on foot
 *            (metres), which sets the pose of the walk, run and jog clips; for a
 *            fallen one, seconds into the clip that does not loop
 *   iSeed    a fixed random number 0..1: animation offset, size, tint
 *   iStrike  (vec4) x: seconds into the clip for a figure fighting hand to hand
 *            (attack, block or hit; engine/melee.ts times the blows) or bowled
 *            over by a horse (knockdown; engine/overrun.ts), or negative:
 *            attack then loops on the clock like idle;
 *            y: how far it has put away what its model stows to fight, 0..1;
 *            plus 2 when the clip on top is for the rider alone: his horse
 *            keeps the clip below (its gallop);
 *            zw: with looks, his choices, packed (looks.ts, LOOK_BITS)
 *
 * Each man his own look (T-061): a model with looks (UnitModel.looks) is
 * drawn with FIG_LOOKS defined. Its vertices carry their look in aPart.y
 * (slots and variant shape, see ModelLooks in src/lib/battle.ts); each
 * figure carries his choices, drawn once from his seed (looks.ts,
 * lookChoices), in iStrike.zw. The vertex
 * shader hands the fragment shader the factors of the vertex's two slots,
 * which the dye mask (red of the roughness-metalness map) lays on texel by
 * texel, with the shield's design. A variant shape he did not draw is
 * gathered into one point, in the shadow pass too.
 *
 * Two looks share that vertex work:
 *   - `material`: diffuse light only (Lambert). Every figure at low quality,
 *     and the far levels of detail at high quality.
 *   - `detailed`: physically based, with the normal and roughness-metalness
 *     maps of the model, for close figures at high quality. There is no
 *     environment map: reflections come from a sky gradient in the shader,
 *     fed from the sky lights, so bronze and iron read as metal.
 *
 * Both take the fill light of the sky (Sky.fill) on top of the lights of the
 * scene: without it the side of a figure turned from the sun is one flat
 * dark colour.
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
  Vector3,
  Vector4,
} from "three";
import { LOOK_LIMITS, LOOK_SECONDARY_STEP, LOOK_VARIANT_STEP, UNIT_CLIPS } from "@/lib/battle";
import { LOOK_BITS } from "./looks";
import { CLIP_INDEX, type UnitModel } from "./model";

const OPTIONS = LOOK_LIMITS.options;

export interface FigureShared {
  /** Seconds since the scene opened. */
  uTime: IUniform<number>;
  /** How much larger than life the figures are drawn. */
  uFigScale: IUniform<number>;
  /** Sky dome colours overhead, at the horizon and below it, for reflections. */
  uEnvZenith: IUniform<Color>;
  uEnvHorizon: IUniform<Color>;
  uEnvGround: IUniform<Color>;
  /** Sky.fill: light for the figures alone, and the two directions it comes from (world). */
  uFillSky: IUniform<Color>;
  uFillBounce: IUniform<Color>;
  uFillKick: IUniform<Color>;
  uFillSun: IUniform<Color>;
  uFillKickDir: IUniform<Vector3>;
  uFillSunDir: IUniform<Vector3>;
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
attribute vec4 iStrike;
attribute vec4 aBoneIndex;
attribute vec4 aBoneWeight;
attribute float aTeam;
// Of the vertex's part: x how much of it is skinned to the horse of a mounted figure; y its look (T-061).
attribute vec2 aPart;
uniform highp sampler2D uBoneTex;
uniform vec4 uClips[${UNIT_CLIPS.length}];
// Ground covered by one cycle of walk, run and jog, metres.
uniform vec3 uStride;
uniform float uTime;
uniform float uFigScale;
uniform vec3 uTeam;
// What the model puts away to fight (UnitModel.stow): the point it shrinks to, and its bone (-1: nothing).
uniform vec4 uStow;
float figSize;
vec3 figPosition;
vec3 figNormal;
vec4 figR0;
vec4 figR1;
vec4 figR2;
float figCos;
float figSin;

#ifdef FIG_LOOKS
// This man's choices (looks.ts, LOOK_BITS), in the last two numbers of iStrike.
#define iLook (iStrike.zw)
uniform float uLookShapeGroup[${LOOK_LIMITS.shapes + 1}];

/** \`width\` bits of a packed choice (LOOK_BITS), from bit \`shift\`. */
int figBits(float packed, int shift, int width) {
  return (int(packed + 0.5) >> shift) & ((1 << width) - 1);
}

/** This vertex's primary slot, secondary slot and variant shape. */
vec3 figLook() {
  float n = floor(aPart.y + 0.5);
  return vec3(
    mod(n, ${LOOK_SECONDARY_STEP}.0),
    mod(floor(n / ${LOOK_SECONDARY_STEP}.0), ${LOOK_VARIANT_STEP / LOOK_SECONDARY_STEP}.0),
    floor(n / ${LOOK_VARIANT_STEP}.0));
}

/** True when the vertex belongs to a variant shape this man did not draw. */
bool figHidden(float shape) {
  if (shape < 0.5) return false;
  int s = int(shape + 0.5);
  int g = int(uLookShapeGroup[s] + 0.5);
  return figBits(iLook.y, ${LOOK_BITS.shape} * g, ${LOOK_BITS.shape}) != s;
}
#endif

float figFrame(float clip) {
  int index = int(clip + 0.5);
  vec4 info = uClips[index];
  float frame;
  if (index == ${CLIP_INDEX.walk} || index == ${CLIP_INDEX.run} || index == ${CLIP_INDEX.jog}) {
    // Walk, run and jog follow the ground covered, not the clock: one cycle
    // per stride of this figure, so a foot on the ground stays where it is.
    float stride =
      (index == ${CLIP_INDEX.walk} ? uStride.x : index == ${CLIP_INDEX.run} ? uStride.y : uStride.z) * figSize;
    frame = fract(iAnim.w / stride + iSeed * 23.0) * info.y;
  } else if ((index == ${CLIP_INDEX.attack} || index == ${CLIP_INDEX.block} || index == ${CLIP_INDEX.hit} || index == ${CLIP_INDEX.knockdown} || index == ${CLIP_INDEX.ridedown} || index == ${CLIP_INDEX.die}) && iStrike.x >= 0.0) {
    // A blow struck or taken, timed by the fight, or a man bowled over by a
    // horse: played once, from the moment given.
    frame = min(iStrike.x * info.z, info.y - 1.0);
  } else if (info.w > 0.5) {
    float seconds = uTime * (0.88 + 0.24 * fract(iSeed * 7.31)) + iSeed * 23.0;
    frame = mod(seconds * info.z, info.y);
  } else {
    // Played once, then held on its last frame (die).
    frame = iAnim.w * info.z;
  }
  return info.x + min(floor(frame), info.y - 1.0);
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
  figSize = uFigScale * (0.94 + 0.12 * fract(iSeed * 3.17));
  figBones(figFrame(iAnim.x), figR0, figR1, figR2);
  if (iAnim.z > 0.001) {
    vec4 s0;
    vec4 s1;
    vec4 s2;
    figBones(figFrame(iAnim.y), s0, s1, s2);
    // A clip for the rider alone leaves his horse to the clip below.
    float share = iAnim.z * (1.0 - step(1.5, iStrike.y) * aPart.x);
    figR0 = mix(figR0, s0, share);
    figR1 = mix(figR1, s1, share);
    figR2 = mix(figR2, s2, share);
  }
  float stowed = iStrike.y - 2.0 * step(1.5, iStrike.y);
  if (uStow.w >= 0.0 && stowed > 0.0) {
    // Put away: the vertices of that bone shrink into the hand that held them.
    float held = 0.0;
    for (int k = 0; k < 4; k++) {
      if (abs(aBoneIndex[k] - uStow.w) < 0.5) held += aBoneWeight[k];
    }
    if (held > 0.5) p = mix(p, uStow.xyz, stowed);
  }
  vec4 p4 = vec4(p, 1.0);
  vec3 sp = vec3(dot(figR0, p4), dot(figR1, p4), dot(figR2, p4)) * figSize;
  figCos = cos(iPosYaw.w);
  figSin = sin(iPosYaw.w);
  figPosition = vec3(figCos * sp.x + figSin * sp.z, sp.y, figCos * sp.z - figSin * sp.x) + iPosYaw.xyz;
  figNormal = figDirection(n);
  #ifdef FIG_LOOKS
    // A shape he did not draw: all its vertices at one point, so nothing is drawn.
    if (figHidden(figLook().z)) figPosition = iPosYaw.xyz;
  #endif
}
`;

/**
 * The looks in the vertex shader of the two looks that colour (not the
 * shadow's): this man's option of each slot of the vertex, and his design if
 * the vertex is on the painted shield.
 */
const LOOK_VERTEX = /* glsl */ `
#ifdef FIG_LOOKS
#ifdef FIG_DESIGNS
uniform vec2 uLookDesignInfo;
uniform vec4 uLookDesignTile[${LOOK_LIMITS.designs}];
uniform vec3 uLookDesignFrame[3];
uniform vec4 uLookDesignExtent;
#endif
// What the fragment shader needs of this man's looks, packed: the option of the vertex's primary slot,
// of its secondary slot (each 1 + its index in uLookOption, 0 for none), and his design's colour (1 + its
// index, 0 for no design), 6, 6 and 4 bits. The same at the three corners of a triangle (a part has one
// look): few varyings, as each one costs on millions of small triangles. Not "flat": ANGLE on Direct3D
// draws flat varyings through a slow path, to emulate their provoking vertex.
varying float vLook;
#ifdef FIG_DESIGNS
// Where the design's mask lies in the atlas under this point (a model without designs has no such varying).
varying vec2 vLookDesignUv;
#endif

/** 1 + this man's option of the slot, as an index into uLookOption; 0 for no slot. */
float figOption(float slot) {
  if (slot < 0.5) return 0.0;
  int s = int(slot + 0.5) - 1;
  return float(1 + s * ${OPTIONS} + figBits(iLook.x, ${LOOK_BITS.option} * s, ${LOOK_BITS.option}));
}

void figLooks(vec3 bindPosition) {
  vec3 look = figLook();
  float design = 0.0;
  #ifdef FIG_DESIGNS
  vLookDesignUv = vec2(0.0);
  int tile = figBits(iLook.y, ${LOOK_BITS.tile}, 4) - 1;
  if (tile >= 0 && abs(look.x - uLookDesignInfo.x) < 0.5) {
    design = float(1 + figBits(iLook.y, ${LOOK_BITS.color}, 3));
    vec4 t = uLookDesignTile[tile];
    vec3 d = bindPosition - uLookDesignFrame[0];
    vec2 f = vec2(
      (dot(d, uLookDesignFrame[2]) - uLookDesignExtent.x) / (uLookDesignExtent.y - uLookDesignExtent.x),
      (dot(d, uLookDesignFrame[1]) - uLookDesignExtent.z) / (uLookDesignExtent.w - uLookDesignExtent.z));
    // The frame spans the shield's vertices, so f stays in 0..1 (and the tiles have a margin).
    vLookDesignUv = t.xy + vec2(f.x, 1.0 - f.y) * t.zw;
  }
  #endif
  vLook = figOption(look.x) + 64.0 * figOption(look.y) + 4096.0 * design;
}
#endif
`;

/**
 * The looks in the fragment shader: the dye mask lays the two slots'
 * colours over the atlas's (1: primary, 0.5: secondary, 0: none), then the
 * design over the shield's paint, both keeping the atlas's light and shade.
 */
const LOOK_FRAGMENT = /* glsl */ `
#ifdef FIG_LOOKS
uniform sampler2D uLookDye;
uniform vec4 uLookOption[${LOOK_LIMITS.slots * OPTIONS}];
uniform vec2 uLookMode[${LOOK_LIMITS.slots}];
varying float vLook;
#ifdef FIG_DESIGNS
uniform vec4 uLookDesignColor[${OPTIONS}];
varying vec2 vLookDesignUv;
#endif

/** A texel under an option (1 + its index; 0: none): tinted, or dyed from its luminance. */
vec3 figSlotColor(vec3 c, float lum, int option) {
  if (option == 0) return c;
  vec3 k = uLookOption[option - 1].rgb;
  return uLookMode[(option - 1) / ${OPTIONS}].x > 0.5 ? lum * k : c * k;
}

vec3 figDyed(vec3 c, vec2 uv) {
  int packed = int(vLook + 0.5);
  float dye = texture2D(uLookDye, uv).r;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 a = figSlotColor(c, lum, packed & 63);
  vec3 b = figSlotColor(c, lum, (packed >> 6) & 63);
  vec3 dyed = dye < 0.5 ? mix(c, b, dye * 2.0) : mix(b, a, dye * 2.0 - 1.0);
  #ifdef FIG_DESIGNS
  int design = packed >> 12;
  if (design > 0) {
    float mask = texture2D(map, vLookDesignUv).g;
    dyed = mix(dyed, lum * uLookDesignColor[design - 1].rgb, mask * smoothstep(0.6, 0.9, dye));
  }
  #endif
  return dyed;
}
#endif
`;

/** map_fragment of three.js, with the looks laid on the atlas's colour. */
const MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  #ifdef FIG_LOOKS
    sampledDiffuseColor.rgb = figDyed( sampledDiffuseColor.rgb, vMapUv );
  #endif
  diffuseColor *= sampledDiffuseColor;
#endif
`;

/**
 * Sky reflections for the detailed material, in place of an environment
 * map: the gradient of the sky dome (sky.ts) along the reflected ray, so a
 * polished surface shows the sky as the viewer sees it. Rough surfaces see a
 * blurred version: a softer horizon and an average of the upper sky.
 */
const SKY_PARS = /* glsl */ `
uniform vec3 uEnvZenith;
uniform vec3 uEnvHorizon;
uniform vec3 uEnvGround;
vec3 figSkyRadiance(vec3 viewDir, vec3 normal, float roughness) {
  vec3 r = reflect(-viewDir, normal);
  r = normalize(mix(r, normal, roughness * roughness));
  r = transformDirectionByInverseViewMatrix(r, viewMatrix);
  float up = mix(pow(clamp(r.y, 0.0, 1.0), 0.5), 0.6, roughness);
  vec3 sky = mix(uEnvHorizon, uEnvZenith, up);
  float spread = 0.04 + 0.5 * roughness;
  return mix(sky, uEnvGround, smoothstep(spread * 0.5, -spread, r.y));
}
`;

/**
 * The fill light of the figures, as irradiance on a surface with the given
 * normal (view space): more sky from above, the ground's bounce from below,
 * a soft light from the side away from the sun, and a share of the sun that
 * no shadow takes away.
 */
const FILL_PARS = /* glsl */ `
uniform vec3 uFillSky;
uniform vec3 uFillBounce;
uniform vec3 uFillKick;
uniform vec3 uFillSun;
uniform vec3 uFillKickDir;
uniform vec3 uFillSunDir;
vec3 figFill(vec3 viewNormal) {
  vec3 n = transformDirectionByInverseViewMatrix(viewNormal, viewMatrix);
  float up = 0.5 + 0.5 * n.y;
  vec3 light = uFillSky * up + uFillBounce * (1.0 - up);
  light += uFillKick * clamp((dot(n, uFillKickDir) + 0.35) / 1.35, 0.0, 1.0);
  light += uFillSun * clamp(dot(n, uFillSunDir), 0.0, 1.0);
  return light;
}
`;

/** The fragment changes common to both looks: the looks on the atlas colour. */
function figureFragment(fragmentShader: string): string {
  return fragmentShader
    .replace("#include <map_pars_fragment>", `#include <map_pars_fragment>\n${LOOK_FRAGMENT}`)
    .replace("#include <map_fragment>", MAP_FRAGMENT);
}

/** The vertex changes common to both looks. */
function figureVertex(vertexShader: string): string {
  return vertexShader
    .replace("#include <common>", `#include <common>\n${PARS}\n${LOOK_VERTEX}`)
    .replace(
      "#include <color_vertex>",
      `#include <color_vertex>
      // Each man a little lighter or darker; less where his looks vary.
      #ifdef FIG_LOOKS
        vColor.rgb *= mix(vec3(1.0), uTeam, aTeam) * (0.95 + 0.1 * fract(iSeed * 5.77));
        figLooks(position);
      #else
        vColor.rgb *= mix(vec3(1.0), uTeam, aTeam) * (0.84 + 0.3 * fract(iSeed * 5.77));
      #endif`,
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
    uStride: { value: new Vector3(model.gait.walk.metres, model.gait.run.metres, model.gait.jog.metres) },
    uTeam: { value: new Color(team) },
    uStow: { value: model.stow ? new Vector4(...model.stow.pivot, model.stow.bone) : new Vector4(0, 0, 0, -1) },
  };
  const looks = model.looks;
  const lookUniforms: Record<string, IUniform> = looks
    ? {
        uLookShapeGroup: { value: looks.shapeGroup },
        uLookOption: { value: looks.options },
        uLookMode: { value: looks.modes },
        uLookDesignInfo: { value: looks.designInfo },
        uLookDesignTile: { value: looks.designTiles },
        uLookDesignColor: { value: looks.designColors },
        uLookDesignFrame: { value: looks.designFrame },
        uLookDesignExtent: { value: looks.designExtent },
        uLookDye: { value: model.surface?.roughnessMap ?? null },
      }
    : {};
  // Designs need one more varying: only the models that have them pay for it.
  const designs = !!looks && looks.designInfo.x >= 1;
  const defines: Record<string, string> = looks ? { FIG_LOOKS: "", ...(designs ? { FIG_DESIGNS: "" } : {}) } : {};
  const variant = looks ? (designs ? "-looks-designs" : "-looks") : "";
  const bind = (shader: { uniforms: Record<string, IUniform> }) => {
    shader.uniforms.uBoneTex = uniforms.uBoneTex;
    shader.uniforms.uClips = uniforms.uClips;
    shader.uniforms.uStride = uniforms.uStride;
    shader.uniforms.uTeam = uniforms.uTeam;
    shader.uniforms.uStow = uniforms.uStow;
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uFigScale = shared.uFigScale;
    Object.assign(shader.uniforms, lookUniforms);
  };
  const bindFill = (shader: { uniforms: Record<string, IUniform> }) => {
    shader.uniforms.uFillSky = shared.uFillSky;
    shader.uniforms.uFillBounce = shared.uFillBounce;
    shader.uniforms.uFillKick = shared.uFillKick;
    shader.uniforms.uFillSun = shared.uFillSun;
    shader.uniforms.uFillKickDir = shared.uFillKickDir;
    shader.uniforms.uFillSunDir = shared.uFillSunDir;
  };
  const side = model.doubleSided ? DoubleSide : FrontSide;

  const material = new MeshLambertMaterial({ vertexColors: true, map: model.map, side });
  material.defines = { ...defines };
  material.onBeforeCompile = (shader) => {
    bind(shader);
    bindFill(shader);
    shader.vertexShader = figureVertex(shader.vertexShader);
    shader.fragmentShader = figureFragment(shader.fragmentShader)
      .replace("#include <common>", `#include <common>\n${FILL_PARS}`)
      .replace(
        "#include <lights_fragment_maps>",
        `#include <lights_fragment_maps>
        irradiance += figFill(geometryNormal);`,
      );
  };
  material.customProgramCacheKey = () => `battle-figure${variant}`;

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
    detailed.defines = { ...detailed.defines, ...defines };
    detailed.onBeforeCompile = (shader) => {
      bind(shader);
      bindFill(shader);
      shader.uniforms.uEnvZenith = shared.uEnvZenith;
      shader.uniforms.uEnvHorizon = shared.uEnvHorizon;
      shader.uniforms.uEnvGround = shared.uEnvGround;
      shader.vertexShader = figureVertex(shader.vertexShader);
      shader.fragmentShader = figureFragment(shader.fragmentShader)
        .replace("#include <common>", `#include <common>\n${SKY_PARS}\n${FILL_PARS}`)
        .replace(
          "#include <lights_fragment_maps>",
          `#include <lights_fragment_maps>
          irradiance += figFill(geometryNormal);
          #if defined( RE_IndirectSpecular )
            radiance += figSkyRadiance(geometryViewDir, geometryNormal, material.roughness);
          #endif`,
        );
    };
    detailed.customProgramCacheKey = () => `battle-figure-detailed${variant}`;
  }

  const depthMaterial = new MeshDepthMaterial();
  depthMaterial.defines = { ...depthMaterial.defines, ...defines };
  depthMaterial.onBeforeCompile = (shader) => {
    bind(shader);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${PARS}`)
      .replace(
        "#include <begin_vertex>",
        "figureTransform(position, vec3(0.0, 1.0, 0.0));\nvec3 transformed = figPosition;",
      );
  };
  depthMaterial.customProgramCacheKey = () => `battle-figure-depth${variant}`;

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
