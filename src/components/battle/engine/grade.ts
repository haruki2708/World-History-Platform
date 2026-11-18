/**
 * The look of the whole scene: how the light that the scene computes becomes
 * the colours on screen. A filmic curve, then two corrections set by
 * measuring the user's reference pictures against screenshots of the scene
 * (docs/tasks/T-044-scenery-look.md, "Khớp số đo"): colour a little less rich
 * than the curve leaves it, and black raised so that shadows can be seen into.
 *
 * three.js lets a page define one tone mapping of its own
 * (CustomToneMapping); every material of the scene passes through it.
 */

import { ShaderChunk } from "three";

/** Colour kept after the curve (1: all of it), and how far black is raised, in linear light. */
const SATURATION = 0.96;
const LIFT = 0.0028;

let installed = false;

/** Call once before the first frame; then set renderer.toneMapping = CustomToneMapping. */
export function installGrade(): void {
  if (installed) return;
  installed = true;
  ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
    /vec3 CustomToneMapping\( vec3 color \) \{[^}]*\}/,
    /* glsl */ `
    #define GRADE_SATURATION ${SATURATION.toFixed(3)}
    #define GRADE_LIFT ${LIFT.toFixed(3)}
    vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      // A filmic shoulder, so that sunlit ground does not burn out.
      color = clamp( ( color * ( 2.51 * color + 0.03 ) ) / ( color * ( 2.43 * color + 0.59 ) + 0.14 ), 0.0, 1.0 );
      // The measured look of the reference pictures (see the top of this file): colours
      // no richer than the light makes them, and shadows one can see into.
      float luma = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
      color = mix( vec3( luma ), color, GRADE_SATURATION );
      color = color + GRADE_LIFT * ( 1.0 - color ) * ( 1.0 - color );
      return clamp( color, 0.0, 1.0 );
    }`,
  );
}
