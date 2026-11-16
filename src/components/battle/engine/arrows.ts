/**
 * The movement arrows of the phase under way: flat strips on the ground in
 * the colour of their side, with slow bands running towards the head.
 */

import {
  type Color,
  CustomBlending,
  Group,
  type IUniform,
  Mesh,
  OneMinusSrcAlphaFactor,
  ShaderMaterial,
  SrcAlphaFactor,
} from "three";
import { type Battle, type BattleArrow, phaseAt } from "@/lib/battle";
import { buildRibbon, type HeightAt } from "./terrain";
import { ARROW_ORDER } from "./units";

function pathLength(arrow: BattleArrow): number {
  let length = 0;
  for (let i = 1; i < arrow.points.length; i++) {
    length += Math.hypot(
      arrow.points[i].x - arrow.points[i - 1].x,
      arrow.points[i].y - arrow.points[i - 1].y,
    );
  }
  return length;
}

export class ArrowLayer {
  readonly group = new Group();
  private phase = -1;
  private readonly opacity: IUniform<number> = { value: 1 };
  private readonly clock: IUniform<number> = { value: 0 };
  private readonly light: IUniform<number> = { value: 1 };

  constructor(
    private readonly battle: Battle,
    private readonly colorOfSide: (sideId: string) => Color,
    private readonly heightAt: HeightAt,
  ) {}

  /** `daylight` dims the arrows with the scene, from 1 at noon down at night. */
  update(time: number, seconds: number, daylight: number): void {
    if (this.battle.phases.length === 0) return;
    const phase = phaseAt(this.battle, time);
    if (phase !== this.phase) {
      this.phase = phase;
      this.rebuild(this.battle.phases[phase - 1].arrows ?? []);
    }
    // Clear through the phase, fading as it ends.
    const progress = Math.min(Math.max(time - (phase - 1), 0), 1);
    const fade = Math.min(Math.max((progress - 0.75) / 0.25, 0), 1);
    this.opacity.value = 0.85 * (1 - 0.7 * fade);
    this.clock.value = seconds;
    this.light.value = daylight;
  }

  private rebuild(arrows: BattleArrow[]): void {
    this.clear();
    for (const arrow of arrows) {
      if (arrow.points.length < 2) continue;
      const length = pathLength(arrow);
      if (length < 1) continue;
      const width = Math.min(Math.max(length * 0.06, 10), 44);
      const head = Math.min(width * 3, length * 0.45);
      const geometry = buildRibbon(
        arrow.points,
        (s, total) => (s < total - head ? width / 2 : (width * 1.35 * (total - s)) / head),
        this.heightAt,
        0.6,
        2,
        8,
      );
      // Blended, but kept among the opaque objects so that it is painted on
      // the ground before the figures, which then stand on it (ARROW_ORDER).
      const material = new ShaderMaterial({
        blending: CustomBlending,
        blendSrc: SrcAlphaFactor,
        blendDst: OneMinusSrcAlphaFactor,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -6,
        uniforms: {
          uColor: { value: this.colorOfSide(arrow.side) },
          uOpacity: this.opacity,
          uTime: this.clock,
          uLight: this.light,
          uLength: { value: length },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorld;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uTime;
          uniform float uLength;
          uniform float uLight;
          varying vec2 vUv;
          varying vec3 vWorld;
          void main() {
            float edge = 1.0 - smoothstep(0.7, 1.0, abs(vUv.y * 2.0 - 1.0));
            float tail = smoothstep(0.0, 0.3, vUv.x);
            float bands = 0.8 + 0.2 * sin(vUv.x * uLength * 0.12 - uTime * 2.5);
            // Faint under the camera, where the figures stand on it and it
            // would only colour the ground around their feet.
            float near = mix(0.3, 1.0, smoothstep(40.0, 320.0, distance(cameraPosition, vWorld)));
            gl_FragColor = vec4(uColor * bands * uLight, uOpacity * near * tail * (0.35 + 0.65 * edge));
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      const mesh = new Mesh(geometry, material);
      mesh.renderOrder = ARROW_ORDER;
      this.group.add(mesh);
    }
  }

  private clear(): void {
    for (const child of [...this.group.children]) {
      const mesh = child as Mesh;
      mesh.geometry.dispose();
      (mesh.material as ShaderMaterial).dispose();
      this.group.remove(mesh);
    }
  }

  dispose(): void {
    this.clear();
  }
}
