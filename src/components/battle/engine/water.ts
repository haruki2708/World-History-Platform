/**
 * The surface of water, shared by the river (river.ts) and the sea (the
 * ground shader in terrain.ts): GLSL to paste into a fragment shader.
 *
 * - `waterSlope`: the slope of the water at a point, as a sum of waves of
 *   nine lengths, from 9 m down to under half a metre, each running its own
 *   way round the main one at the speed of a real wave of its length. A wave
 *   shorter than about two pixels at that distance is left out, so the far
 *   water does not shimmer; what it would have added becomes `waterRough`.
 * - `waterLight`: what the water sends to the eye besides its own colour:
 *   the sky by Fresnel and the sun. Close by, the sun breaks into sparkles
 *   on the short waves; far off, where they are gone, the same light spreads
 *   into a broad trail.
 * - `waterFoam`: broken white foam, drifting.
 */

export const WATER_GLSL = /* glsl */ `
float waterHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float waterNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(waterHash(i), waterHash(i + vec2(1.0, 0.0)), u.x),
    mix(waterHash(i + vec2(0.0, 1.0)), waterHash(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
// Set by waterSlope: how much of the short waves is too small to draw here, 0..1.
float waterRough = 0.0;
// p: metres on the water; heading: the way the main waves run (radians, in
// the frame of p); spread: how far round it the others run; footprint:
// metres a pixel covers; calm: 0..1, less of every wave.
vec2 waterSlope(vec2 p, float t, float heading, float spread, float footprint, float calm) {
  // Bend the plane a little, so that no wave runs in a straight line for long.
  p += 2.2 * vec2(waterNoise(p * 0.045 + 3.1), waterNoise(p * 0.045 + 8.7)) - 1.1;
  vec2 g = vec2(0.0);
  float lost = 0.0;
  float total = 0.0;
  float L = 9.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    // Every other wave runs well off the main way, so that no two lie parallel.
    float a = heading + spread * (fract(fi * 0.6180339 + 0.31) * 2.0 - 1.0) * (mod(fi, 2.0) < 0.5 ? 1.0 : 1.8);
    vec2 d = vec2(cos(a), sin(a));
    float k = 6.2831853 / L;
    float w = sqrt(9.8 * k);
    // Slope of this wave at its steepest; the shorter ones are a little steeper.
    float steep = (0.022 + 0.011 * fi) * (1.0 - 0.75 * calm);
    // Gusts: the waves are higher in some patches than in others.
    steep *= 0.35 + 1.3 * waterNoise(p * (0.012 + 0.004 * fi) + vec2(fi * 7.3, t * 0.04));
    float shown = 1.0 - smoothstep(0.35, 1.0, footprint * 2.2 / L);
    float phase = k * dot(d, p) - w * t + fi * 1.913;
    g += d * (steep * cos(phase) * shown);
    lost += steep * (1.0 - shown);
    total += steep;
    L *= 0.69;
  }
  waterRough = clamp(lost / max(total, 1e-4), 0.0, 1.0);
  return g;
}
// n: normal (world); toEye: unit vector to the eye; sunDir: unit vector to
// the sun; sun: its light; zenith, horizon: the sky. Writes the Fresnel
// share to fresnel.
vec3 waterLight(vec3 n, vec3 toEye, vec3 sunDir, vec3 sun, vec3 zenith, vec3 horizon, out float fresnel) {
  float facing = clamp(dot(n, toEye), 0.0, 1.0);
  fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  vec3 mirrored = reflect(-toEye, n);
  vec3 sky = mix(horizon, zenith, pow(clamp(mirrored.y, 0.0, 1.0), 0.5));
  // Sharp sparkles close by; a broad trail where the short waves are gone.
  float shine = mix(2400.0, 70.0, sqrt(waterRough));
  float glint = pow(max(dot(mirrored, sunDir), 0.0), shine) * (shine + 8.0) / 25.0;
  glint = min(glint, 40.0);
  return sky * fresnel + sun * glint * (0.25 + 0.75 * fresnel);
}
// White, broken and drifting: 0..1.
float waterFoam(vec2 p, float t) {
  float a = waterNoise(p * 0.55 + vec2(t * 0.35, -t * 0.12));
  float b = waterNoise(p * 1.9 + vec2(-t * 0.5, t * 0.4) + 11.0);
  return smoothstep(0.42, 0.75, a * 0.6 + b * 0.4);
}
`;
