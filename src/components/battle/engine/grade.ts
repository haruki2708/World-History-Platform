/**
 * The look of the whole scene: how the light that the scene computes becomes
 * the colours on screen. Strong, saturated colours and firm contrast, as in a
 * strategy game, in place of the pale film look of the stock curves.
 *
 * three.js lets a page define one tone mapping of its own
 * (CustomToneMapping); every material of the scene passes through it.
 */

import { ShaderChunk } from "three";

let installed = false;

/** Call once before the first frame; then set renderer.toneMapping = CustomToneMapping. */
export function installGrade(): void {
  if (installed) return;
  installed = true;
  ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
    /vec3 CustomToneMapping\( vec3 color \) \{[^}]*\}/,
    /* glsl */ `vec3 CustomToneMapping( vec3 color ) {
      color *= toneMappingExposure;
      // A filmic shoulder, so that sunlit ground does not burn out.
      color = clamp( ( color * ( 2.51 * color + 0.03 ) ) / ( color * ( 2.43 * color + 0.59 ) + 0.14 ), 0.0, 1.0 );
      // Richer colour, then a little more contrast about the middle.
      float luma = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
      color = mix( vec3( luma ), color, 1.16 );
      color = ( color - 0.4 ) * 1.04 + 0.4;
      return clamp( color, 0.0, 1.0 );
    }`,
  );
}
