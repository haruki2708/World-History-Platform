/**
 * Mist (BattleScenery.mist, batch K): a layer of fog lying on the low ground,
 * thickest on the water and the plain and thin on the heights (Livy 22.4.6:
 * it rose from the lake, thicker on the plain than on the hills, and the
 * men in ambush on the hills could see one another). It thins as the
 * morning goes on and is gone at `clearsAt`.
 *
 * It is drawn in the fog step that three.js runs at the end of every
 * material's fragment shader: the chunks are replaced here once for the
 * page. The haze by distance is as before; on top of it, the share of the
 * light the mist takes away along the line of sight. The density of the mist
 * falls off exponentially with height above its base (the lake, or the low
 * ground), so its sum along a straight line has a closed form and costs a
 * few instructions a pixel. Seen from above, the line of sight crosses the
 * thick layer only near the ground, so the field shows through; seen from
 * the plain, it runs through the layer and the distance is lost. Banks of
 * it, thicker and thinner, drift down the wind. The sky takes the mist too
 * (sky.ts), towards the horizon, when the camera is down in it.
 *
 * Everything follows from the battle clock, as the dust does: a seek shows
 * the mist of that moment, and a paused battle holds it still. The labels
 * and the viewer's controls are HTML over the scene, so the mist never
 * hides them; the movement arrows take no fog.
 *
 * The values reach every material through two uniforms that the engine
 * sets once a frame. three.js gives each material its own copy of the
 * uniforms of its kind (ShaderLib), but a typed array is copied by
 * reference (UniformsUtils.clone), so every copy reads the same numbers;
 * installMist checks that this still holds.
 */

import { Color, ShaderChunk, ShaderLib, UniformsLib, UniformsUtils } from "three";
import { type Battle, hourAt } from "@/lib/battle";
import type { Sky } from "./sky";

/**
 * Density of the mist at its base, per metre, at `level` 1. Seen level
 * across the plain the field fades out at about 3 / density: 150 m as drawn
 * (figures are three times life size), two throws of a javelin. Level 0.8 at
 * its thickest leaves about half of the field showing from the opening view.
 */
const THICKEST = 0.02;
/** The density halves every 0.69 × this many metres above the base. */
const SCALE_HEIGHT = 25;
/** How much the banks of mist differ from the mean: 0 none, 1 from nothing to twice. */
const PATCHES = 0.35;
/** The banks drift down the wind at this share of its speed, and at least this fast, metres per second of playback. */
const DRIFT = 0.9;
const MIN_DRIFT = 1.5;
/**
 * The colour of the mist: what a white matte surface would show in the
 * light of the hour, the sun at this share of its strength (the mist itself
 * dims it). Through the scene's colour curve, as the rest of the scene.
 */
const MIST_ALBEDO = 0.9;
const MIST_SUN = 0.45;
const EXPOSURE = 0.8;

/** Density at the base (per metre), base height (metres), 1 / scale height, patchiness. */
const SHAPE = new Float32Array(4);
/** Offset of the banks along the ground, world x and z (metres); unused; unused. */
const SHIFT = new Float32Array(4);

/** The uniforms of the mist, for a ShaderMaterial that draws the mist itself (the sky). */
export const MIST_SHAPE = SHAPE;

let installed = false;

/** Call once before the first frame: every material with fog then draws the mist too. */
export function installMist(): void {
  if (installed) return;
  installed = true;
  ShaderChunk.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogRay;
#endif
`;
  ShaderChunk.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  // From the camera to the point, in world axes: the view rotation undone.
  vFogRay = mvPosition.xyz * mat3( viewMatrix );
#endif
`;
  ShaderChunk.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogRay;
  uniform vec4 mistShape;
  uniform vec4 mistShift;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  float mistHash( vec2 p ) {
    vec3 q = fract( vec3( p.xyx ) * 0.1031 );
    q += dot( q, q.yzx + 33.33 );
    return fract( ( q.x + q.y ) * q.z );
  }
  float mistNoise( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    vec2 u = f * f * ( 3.0 - 2.0 * f );
    return mix( mix( mistHash( i ), mistHash( i + vec2( 1.0, 0.0 ) ), u.x ),
      mix( mistHash( i + vec2( 0.0, 1.0 ) ), mistHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
  }
  // The mist along the line of sight to a point: its optical depth.
  float mistDepth( vec3 ray ) {
    float k = mistShape.z;
    float a = max( cameraPosition.y - mistShape.y, 0.0 ) * k;
    float b = max( cameraPosition.y + ray.y - mistShape.y, 0.0 ) * k;
    float rise = b - a;
    // The mean density along the line, as a share of the density at the base.
    float share = abs( rise ) < 1e-3 ? exp( - a ) : ( exp( - a ) - exp( - b ) ) / rise;
    float tau = mistShape.x * length( ray ) * share;
    // Banks of mist where the line ends, drifting down the wind.
    vec2 p = cameraPosition.xz + ray.xz + mistShift.xy;
    float n = mistNoise( p * 0.004 ) * 0.65 + mistNoise( p * 0.013 + 7.3 ) * 0.35;
    return tau * ( 1.0 + mistShape.w * ( n - 0.5 ) * 2.0 );
  }
#endif
`;
  ShaderChunk.fog_fragment = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  if ( mistShape.x > 0.0 ) fogFactor = 1.0 - ( 1.0 - fogFactor ) * exp( - mistDepth( vFogRay ) );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;
  const uniforms = { mistShape: { value: SHAPE }, mistShift: { value: SHIFT } };
  Object.assign(UniformsLib.fog, uniforms);
  for (const lib of Object.values(ShaderLib)) {
    if ("fogColor" in lib.uniforms) Object.assign(lib.uniforms, uniforms);
  }
  if (UniformsUtils.clone(uniforms).mistShape.value !== SHAPE) {
    console.warn("three.js now copies typed arrays in uniforms: the battle scene's mist will not show.");
  }
}

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** The scene's colour curve (grade.ts), from linear light to a colour on screen, one channel. */
function graded(linear: number): number {
  const c = linear * EXPOSURE;
  const curved = Math.min(Math.max((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0), 1);
  return curved;
}

export class Mist {
  /** The mist as a colour on screen (sRGB numbers), for the sky; see update. */
  readonly screen = new Color();
  /** How thick the mist is in the frame drawn last, 0 to 1 (its level, thinned by the hour). */
  amount = 0;
  private readonly battle: Battle;
  private readonly level: number;
  private readonly base: number;
  private readonly shiftEast: number;
  private readonly shiftNorth: number;
  private readonly light = new Color();
  private readonly sun = new Color();

  /** `base`: the height where the mist is thickest, metres (the lake, or the low ground). */
  constructor(battle: Battle, base: number) {
    this.battle = battle;
    this.level = Math.min(Math.max(battle.terrain.scenery?.mist?.level ?? 0, 0), 1);
    this.base = base;
    const wind = battle.terrain.scenery?.wind;
    const a = (((wind?.from ?? 0) + 180) * Math.PI) / 180;
    const drift = wind ? Math.max(wind.speed * DRIFT, MIN_DRIFT) : MIN_DRIFT * 0.5;
    this.shiftEast = Math.sin(a) * drift;
    this.shiftNorth = Math.cos(a) * drift;
  }

  /**
   * Share of the mist still lying at a clock time: all of it at the start,
   * thinning slowly at first and then faster, none from `clearsAt`. Without
   * `clearsAt` it stays as it began to the end.
   */
  remaining(hour: number): number {
    const mist = this.battle.terrain.scenery?.mist;
    if (!mist || this.level <= 0) return 0;
    if (mist.clearsAt === undefined) return 1;
    const span = mist.clearsAt - this.battle.startHour;
    if (!(span > 0)) return hour < mist.clearsAt ? 1 : 0;
    const u = Math.min(Math.max((hour - this.battle.startHour) / span, 0), 1);
    return 1 - u * u * u;
  }

  /**
   * Call every frame, before drawing: sets the uniforms of the mist for the
   * battle time (hours from hourAt, playback seconds from the clock) and
   * blends the colour of the fog, `fog` (linear), from the haze towards the
   * mist as much as there is of it.
   */
  update(time: number, playSeconds: number, sky: Sky, fog: Color): void {
    const amount = this.level * this.remaining(hourAt(this.battle, time));
    this.amount = amount;
    SHAPE[0] = THICKEST * amount;
    SHAPE[1] = this.base;
    SHAPE[2] = 1 / SCALE_HEIGHT;
    SHAPE[3] = PATCHES;
    // World z runs south.
    SHIFT[0] = -this.shiftEast * playSeconds;
    SHIFT[1] = this.shiftNorth * playSeconds;
    if (amount <= 0) return;
    // The light a white matte surface sends back, then the colour curve:
    // linear light still, as it leaves the curve.
    const sun = this.sun
      .copy(sky.light.color)
      .multiplyScalar(sky.light.intensity * MIST_SUN * Math.max(sky.lightDirection.y, 0));
    const light = this.light
      .copy(sky.ambient.color)
      .multiplyScalar(sky.ambient.intensity)
      .add(sun)
      .multiplyScalar(MIST_ALBEDO / Math.PI);
    light.setRGB(graded(light.r), graded(light.g), graded(light.b));
    // The fog is mixed in after the curve and the conversion to the screen;
    // three.js converts the fog's colour, so it is given in linear light.
    fog.lerp(light, smooth(0, 0.25, amount));
    // The sky dome mixes it in itself, after its conversion: screen numbers.
    this.screen.copy(light).convertLinearToSRGB();
  }

  /** The uniforms are shared by the page: no mist once the scene is gone. */
  dispose(): void {
    SHAPE[0] = 0;
  }
}
