/**
 * Sky, sun and moon for a clock time: the direction and colour of the light,
 * the gradient of the sky dome and the haze, from before dawn to deep night.
 */

import {
  BackSide,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  type PerspectiveCamera,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { MIST_SHAPE } from "./mist";

const DEG = Math.PI / 180;

/**
 * Without a day of the year in the battle data, the sun runs as in the
 * campaigning season (late spring to early autumn).
 */
const DEFAULT_DECLINATION = 14 * DEG;

/**
 * The sun's declination on a day of the solar year (1 = 1 January,
 * proleptic Gregorian), in radians: within a degree of the true value,
 * plenty for light and shadows. Without a valid day, a summer value.
 */
export function solarDeclination(dayOfYear?: number): number {
  if (dayOfYear === undefined || !Number.isFinite(dayOfYear) || dayOfYear < 1 || dayOfYear > 366) {
    return DEFAULT_DECLINATION;
  }
  return -23.44 * DEG * Math.cos(((2 * Math.PI) / 365.25) * (dayOfYear + 10));
}

/** Direction towards the sun in world axes (+X east, +Y up, -Z north). */
export function sunDirection(hour: number, latitude: number, declination: number, out: Vector3): Vector3 {
  const hourAngle = (hour - 12) * 15 * DEG;
  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);
  const sinDec = Math.sin(declination);
  const cosDec = Math.cos(declination);
  const east = -cosDec * Math.sin(hourAngle);
  const north = cosLat * sinDec - sinLat * cosDec * Math.cos(hourAngle);
  const up = sinLat * sinDec + cosLat * cosDec * Math.cos(hourAngle);
  return out.set(east, up, -north).normalize();
}

type Stop<T> = [elevation: number, value: T];

function sampleNumber(stops: Stop<number>[], elevation: number): number {
  if (elevation <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (elevation <= stops[i][0]) {
      const t = (elevation - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * t;
    }
  }
  return stops[stops.length - 1][1];
}

function sampleColor(stops: Stop<Color>[], elevation: number, out: Color): Color {
  if (elevation <= stops[0][0]) return out.copy(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (elevation <= stops[i][0]) {
      const t = (elevation - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return out.copy(stops[i - 1][1]).lerp(stops[i][1], t);
    }
  }
  return out.copy(stops[stops.length - 1][1]);
}

const c = (hex: string) => new Color(hex);

// All keyed by the elevation of the sun, in degrees.
const ZENITH: Stop<Color>[] = [
  [-18, c("#03050c")], [-6, c("#101a38")], [0, c("#2a4a80")], [8, c("#3470c2")], [25, c("#2f74d6")], [60, c("#2a70d8")],
];
const HORIZON: Stop<Color>[] = [
  [-18, c("#070b16")], [-6, c("#2b3050")], [0, c("#c9a48a")], [8, c("#d9c3a8")], [25, c("#b4d2f0")], [60, c("#a6caf2")],
];
const SUN_COLOR: Stop<Color>[] = [
  [-4, c("#ff7a3a")], [0, c("#ff8a48")], [8, c("#ffb878")], [25, c("#ffe9cc")], [60, c("#fff6e8")],
];
const SUN_INTENSITY: Stop<number>[] = [[-4, 0], [0, 0.35], [8, 2.4], [25, 3.2], [60, 3.5]];
const AMBIENT_INTENSITY: Stop<number>[] = [[-18, 0.55], [-6, 0.7], [0, 1.1], [8, 1.9], [25, 2.05], [60, 2.1]];
// The colour of the light from the sky: moonlit blue by night.
const AMBIENT_COLOR: Stop<Color>[] = [
  [-18, c("#5d74a8")], [-6, c("#6f7fa6")], [0, c("#b9b3c0")], [8, c("#c9d2e0")], [25, c("#cfdcee")],
];
const GROUND_BOUNCE: Stop<Color>[] = [[-18, c("#1b2030")], [-6, c("#2f3038")], [0, c("#5c4d3c")], [25, c("#7a6a4c")]];
const MOON_COLOR = c("#9db4e0");

/**
 * Light that only the figures get, by day (Sky.fill). Men and horses are
 * small, upright things in a crowd: with the sun and the sky light alone,
 * the side turned from the sun is one flat dark colour. `sky` and `kick`
 * are shares of the sky light, `sun` a share of the sun.
 */
const FILL = { sky: 0.9, kick: 1.0, sun: 0.22 };
/** What sunlit ground throws back up at them: its reflectance (linear). */
const FILL_GROUND = new Color(0.2, 0.21, 0.13);
const KICK_ELEVATION = 25 * DEG;

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export class Sky {
  readonly dome: Mesh;
  /** The sun by day, the moon by night; the only light that casts shadows. */
  readonly light = new DirectionalLight();
  readonly ambient = new HemisphereLight();
  /** The colour of the haze at the horizon, for the fog. */
  readonly haze = new Color();
  /**
   * The mist as a colour on screen (Mist.screen); the dome takes it towards
   * the horizon when the camera is down in the mist (mist.ts).
   */
  readonly mistColor: Color;
  /**
   * The colours of the sky dome overhead, at the horizon and below it: what
   * shiny surfaces reflect, in place of an environment map. Updated in place.
   */
  readonly envZenith: Color;
  readonly envHorizon: Color;
  readonly envGround: Color;
  /**
   * Extra light for the figures alone (figures/material.ts), all zero by
   * night. `sky`: more of the sky light from above. `bounce`: the sun
   * thrown back by the ground, from below. `kick`: a soft second light from
   * the side away from the sun (`kickDir`, towards it), which gives the
   * shaded side its form. `sun`: the part of the sun that still reaches a
   * man standing in the shadow of his neighbours. Updated in place.
   */
  readonly fill = {
    sky: new Color(0, 0, 0),
    bounce: new Color(0, 0, 0),
    kick: new Color(0, 0, 0),
    sun: new Color(0, 0, 0),
    kickDir: new Vector3(0, 1, 0),
  };
  /**
   * How bright the field is, 1 at noon and low at night: for the flat
   * markings on the ground (arrows, block outlines), which take no light.
   */
  daylight = 1;

  private readonly latitude: number;
  private readonly declination: number;
  private readonly material: ShaderMaterial;
  private readonly sunDir = new Vector3();
  private readonly moonDir = new Vector3();
  private readonly lightDir = new Vector3(0, 1, 0);
  private readonly right = new Vector3();
  private readonly up = new Vector3();
  private readonly snapped = new Vector3();
  private hour = NaN;

  /** Unit vector towards the light that casts shadows: the sun by day, the moon by night. */
  get lightDirection(): Vector3 {
    return this.lightDir;
  }

  /** dayOfYear: Battle.dayOfYear; without it the sun runs as in summer. */
  constructor(latitudeDeg: number, dayOfYear?: number) {
    this.latitude = latitudeDeg * DEG;
    this.declination = solarDeclination(dayOfYear);
    this.material = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: new Color() },
        uHorizon: { value: new Color() },
        uGround: { value: new Color() },
        uSunColor: { value: new Color() },
        uSunDir: { value: this.sunDir },
        uMoonDir: { value: this.moonDir },
        uSun: { value: 0 },
        uMoon: { value: 0 },
        uStars: { value: 0 },
        uMistColor: { value: new Color() },
        // Shared with every material (mist.ts): read in place each frame.
        mistShape: { value: MIST_SHAPE },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position.z = gl_Position.w; // always behind everything
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uGround;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform vec3 uMoonDir;
        uniform float uSun;
        uniform float uMoon;
        uniform float uStars;
        uniform vec3 uMistColor;
        uniform vec4 mistShape;
        varying vec3 vDir;
        float starHash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        void main() {
          vec3 d = normalize(vDir);
          vec3 color = mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.5));
          color = mix(color, uGround, smoothstep(0.0, -0.06, d.y));
          float sun = max(dot(d, uSunDir), 0.0);
          color += uSunColor * uSun * (pow(sun, 6.0) * 0.18 + pow(sun, 48.0) * 0.4);
          color += uSunColor * uSun * smoothstep(0.9997, 0.99985, sun) * 12.0;
          float moon = max(dot(d, uMoonDir), 0.0);
          color += vec3(0.8, 0.86, 1.0) * uMoon * (smoothstep(0.9997, 0.9998, moon) * 1.6 + pow(moon, 300.0) * 0.12);
          if (uStars > 0.0 && d.y > 0.0) {
            vec3 p = d * 180.0;
            float seed = starHash(floor(p));
            float point = smoothstep(0.3, 0.0, length(fract(p) - 0.5));
            color += vec3(step(0.992, seed) * point * (0.3 + 0.7 * fract(seed * 91.7))) * uStars * smoothstep(0.0, 0.25, d.y);
          }
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          if (mistShape.x > 0.0) {
            // The mist from the camera up to the sky: the density falls off
            // with height (mist.ts), so the sum to infinity is in closed form.
            float k = mistShape.z;
            float above = max(cameraPosition.y - mistShape.y, 0.0) * k;
            float tau = mistShape.x * exp(-above) / (k * max(d.y, 0.03));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uMistColor, 1.0 - exp(-tau));
          }
        }`,
    });
    this.envZenith = this.material.uniforms.uZenith.value;
    this.envHorizon = this.material.uniforms.uHorizon.value;
    this.envGround = this.material.uniforms.uGround.value;
    this.mistColor = this.material.uniforms.uMistColor.value;
    this.dome = new Mesh(new SphereGeometry(100, 32, 16), this.material);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;

    this.light.shadow.mapSize.set(2048, 2048);
    this.light.shadow.bias = -0.0003;
    this.setHour(12);
  }

  /** Sets every light and colour for a clock time in hours. */
  setHour(hour: number): void {
    if (hour === this.hour) return;
    this.hour = hour;
    sunDirection(hour, this.latitude, this.declination, this.sunDir);
    // A full moon: opposite the sun.
    sunDirection(hour + 12, this.latitude, -this.declination, this.moonDir);
    const elevation = Math.asin(this.sunDir.y) / DEG;
    const moonElevation = Math.asin(this.moonDir.y) / DEG;
    const night = 1 - smooth(-8, -4, elevation);
    const moon = night * smooth(0, 10, moonElevation);

    const uniforms = this.material.uniforms;
    sampleColor(ZENITH, elevation, uniforms.uZenith.value);
    sampleColor(HORIZON, elevation, uniforms.uHorizon.value);
    sampleColor(GROUND_BOUNCE, elevation, uniforms.uGround.value);
    sampleColor(SUN_COLOR, elevation, uniforms.uSunColor.value);
    uniforms.uSun.value = smooth(-6, 2, elevation);
    uniforms.uMoon.value = moon;
    uniforms.uStars.value = 1 - smooth(-12, -4, elevation);
    this.haze.copy(uniforms.uHorizon.value).lerp(uniforms.uZenith.value, 0.25);

    if (elevation > -4) {
      this.light.color.copy(uniforms.uSunColor.value);
      this.light.intensity = sampleNumber(SUN_INTENSITY, elevation);
      this.lightDir.copy(this.sunDir);
    } else {
      this.light.color.copy(MOON_COLOR);
      this.light.intensity = 0.9 * moon;
      this.lightDir.copy(this.moonDir);
    }
    // Keep the light off the horizon: endless shadows are all artefacts.
    if (this.lightDir.y < 0.07) {
      this.lightDir.y = 0.07;
      this.lightDir.normalize();
    }

    sampleColor(AMBIENT_COLOR, elevation, this.ambient.color);
    sampleColor(GROUND_BOUNCE, elevation, this.ambient.groundColor);
    this.ambient.intensity = sampleNumber(AMBIENT_INTENSITY, elevation) + 0.15 * moon;
    this.daylight = Math.min(
      (this.ambient.intensity + this.light.intensity * Math.max(this.lightDir.y, 0)) / 4.5,
      1,
    );

    const day = smooth(-4, 10, elevation);
    const fill = this.fill;
    fill.sky.copy(this.ambient.color).multiplyScalar(FILL.sky * day);
    fill.kick.copy(this.ambient.color).multiplyScalar(FILL.kick * day);
    fill.sun.copy(this.light.color).multiplyScalar(this.light.intensity * FILL.sun * day);
    fill.bounce
      .copy(this.light.color)
      .multiply(FILL_GROUND)
      .multiplyScalar(this.light.intensity * Math.max(this.lightDir.y, 0) * day);
    const flat = Math.hypot(this.lightDir.x, this.lightDir.z);
    const along = Math.cos(KICK_ELEVATION) / (flat > 1e-3 ? flat : 1);
    fill.kickDir.set(
      flat > 1e-3 ? -this.lightDir.x * along : 0,
      Math.sin(KICK_ELEVATION),
      flat > 1e-3 ? -this.lightDir.z * along : Math.cos(KICK_ELEVATION),
    );
  }

  setShadows(enabled: boolean): void {
    this.light.castShadow = enabled;
  }

  /**
   * Call every frame: keeps the dome on the camera and the shadow map on the
   * part of the field the camera looks at.
   */
  follow(camera: PerspectiveCamera, target: Vector3, distance: number): void {
    this.dome.position.copy(camera.position);

    // The shadow box grows with the zoom, in steps so it does not shimmer.
    const wanted = Math.min(Math.max(distance * 0.75, 60), 4000);
    const half = Math.pow(1.3, Math.ceil(Math.log(wanted) / Math.log(1.3)));
    const texel = (half * 2) / this.light.shadow.mapSize.x;
    this.right.set(0, 1, 0).cross(this.lightDir).normalize();
    this.up.copy(this.lightDir).cross(this.right);
    const tx = Math.round(target.dot(this.right) / texel) * texel;
    const ty = Math.round(target.dot(this.up) / texel) * texel;
    this.snapped
      .copy(this.right)
      .multiplyScalar(tx)
      .addScaledVector(this.up, ty)
      .addScaledVector(this.lightDir, target.dot(this.lightDir));

    const reach = half * 2 + 600;
    this.light.target.position.copy(this.snapped);
    this.light.position.copy(this.snapped).addScaledVector(this.lightDir, reach);
    this.light.target.updateMatrixWorld();
    const shadowCamera = this.light.shadow.camera;
    if (shadowCamera.right !== half) {
      shadowCamera.left = -half;
      shadowCamera.right = half;
      shadowCamera.top = half;
      shadowCamera.bottom = -half;
      shadowCamera.near = 10;
      shadowCamera.far = reach * 2;
      shadowCamera.updateProjectionMatrix();
      this.light.shadow.normalBias = texel * 1.5;
    }
  }

  dispose(): void {
    this.dome.geometry.dispose();
    this.material.dispose();
    this.light.shadow.dispose();
    this.light.dispose();
    this.ambient.dispose();
  }
}
