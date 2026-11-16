/**
 * The 3D battle scene, without React: renderer, camera, light, ground, troops
 * and arrows, drawn in a loop for the battle time it is asked for.
 *
 *   const engine = new BattleEngine(container, options);  // may throw: no WebGL
 *   ...
 *   engine.dispose();                                     // frees everything
 */

import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  type IUniform,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { type Battle, type FieldPoint, hourAt, type UnitType } from "@/lib/battle";
import { ArrowLayer } from "./arrows";
import { loadModelSource } from "./figures/loader";
import { createFigureMaterials, type FigureMaterials } from "./figures/material";
import { buildUnitModel, type UnitModel } from "./figures/model";
import { createPlaceholderSource } from "./figures/placeholder";
import { Sky } from "./sky";
import { makeStressBattle } from "./stress";
import { loadHeights, Terrain } from "./terrain";
import { BattleClock, UnitTrack } from "./timeline";
import { Crowd, FIGURE_SCALE, type LodSettings, UnitBlock } from "./units";

export type Quality = "high" | "low";

export interface EngineStats {
  fps: number;
  /** Milliseconds per frame, averaged. */
  frameMs: number;
  /** Figures still standing in the battle. */
  figures: number;
  /** Figures drawn in view this frame. */
  drawn: number;
  drawCalls: number;
  triangles: number;
  /** Blocks in view at LOD0, LOD1, LOD2. */
  lods: number[];
  quality: Quality;
  /** The graphics card as the browser reports it, when it does. */
  gpu: string;
  /** Unit models in use, and whether each is a file or the placeholder. */
  models: string[];
}

export interface EngineOptions {
  battle: Battle;
  unitTypes: UnitType[];
  /** Hex colour of a polity, from polities.json. */
  colorOfPolity: (polityId: string) => string | undefined;
  /** The battle time to draw, read every frame (store.battleTime). */
  getTime: () => number;
  quality: Quality;
  stressFigures?: number;
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onStats?: (stats: EngineStats) => void;
  /** The frame rate stayed low and the engine dropped to low quality. */
  onQualityLowered?: () => void;
  /** After every frame, e.g. to move labels that follow points on the field. */
  onFrame?: () => void;
}

const QUALITY: Record<Quality, { pixelRatio: number } & LodSettings> = {
  high: { pixelRatio: 2, lod0Pixels: 110, lod1Pixels: 32, triangleBudget: 2_500_000, shadows: true },
  low: { pixelRatio: 1, lod0Pixels: Infinity, lod1Pixels: 70, triangleBudget: 700_000, shadows: false },
};

const FOV = 40;
const FALLBACK_COLOR = "#808080";
/** Below this many frames per second for this many seconds: drop to low quality. */
const SLOW_FPS = 30;
const SLOW_SECONDS = 4;

export class BattleEngine {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 1, 120000);
  private readonly controls: MapControls;
  private readonly sky: Sky;
  private readonly fog = new Fog(0xffffff, 1000, 60000);
  private readonly crowd = new Crowd();
  private readonly shared: { uTime: IUniform<number>; uFigScale: IUniform<number> } = {
    uTime: { value: 0 },
    uFigScale: { value: FIGURE_SCALE },
  };
  private readonly models = new Set<UnitModel>();
  private modelNotes: string[] = [];
  private readonly materials: FigureMaterials[] = [];
  private readonly abort = new AbortController();
  private readonly resizeObserver: ResizeObserver;
  private readonly battle: Battle;
  private terrain: Terrain | null = null;
  private arrows: ArrowLayer | null = null;

  private quality: Quality;
  private disposed = false;
  private frameHandle = 0;
  private width = 1;
  private height = 1;
  private startedAt = 0;
  private lastFrame = 0;
  private lastTime = NaN;
  private lastTimeChange = -Infinity;
  private gpu = "";

  // Frame-rate bookkeeping.
  private statFrames = 0;
  private statSince = 0;
  private slowSeconds = 0;
  private settleUntil = 0;
  private autoLowerAllowed = true;

  private readonly scratch = new Vector3();

  constructor(
    private readonly container: HTMLElement,
    private readonly options: EngineOptions,
  ) {
    this.quality = options.quality;
    this.battle = options.stressFigures
      ? makeStressBattle(options.battle, options.unitTypes, options.stressFigures)
      : options.battle;

    // Throws when the browser has no WebGL 2; the caller shows a message.
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);
    canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    const debugInfo = this.renderer.getContext().getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      this.gpu = String(this.renderer.getContext().getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }

    this.sky = new Sky(this.battle.origin.lat);
    this.scene.add(this.sky.dome, this.sky.light, this.sky.light.target, this.sky.ambient);
    this.scene.fog = this.fog;
    this.scene.add(this.crowd.group);

    this.controls = new MapControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.zoomToCursor = true;
    this.controls.zoomSpeed = 1.6;
    this.controls.minDistance = 10;
    this.controls.maxPolarAngle = (86 * Math.PI) / 180;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.applyQuality();

    this.load().catch((error) => {
      if (this.disposed) return;
      console.error("The battle scene could not be built.", error);
      this.options.onError?.(error);
    });
  }

  getQuality(): Quality {
    return this.quality;
  }

  /** A choice by the user; the engine then stops lowering quality on its own. */
  setQuality(quality: Quality): void {
    this.autoLowerAllowed = false;
    if (quality === this.quality) return;
    this.quality = quality;
    this.applyQuality();
  }

  /**
   * Where a field point is on screen, in CSS pixels from the top left of the
   * container. Returns false when the point is behind the camera.
   */
  project(point: FieldPoint, out: { x: number; y: number }): boolean {
    if (!this.terrain) return false;
    const v = this.scratch.set(point.x, this.terrain.heightAt(point.x, point.y), -point.y);
    v.project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.width;
    out.y = (-v.y * 0.5 + 0.5) * this.height;
    return v.z > -1 && v.z < 1;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.crowd.dispose();
    for (const materials of this.materials) materials.dispose();
    for (const model of this.models) model.dispose();
    this.models.clear();
    this.arrows?.dispose();
    this.terrain?.dispose();
    this.sky.dispose();
    this.scene.clear();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.renderer.renderLists.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  // --- Loading ---------------------------------------------------------------

  private async load(): Promise<void> {
    const { battle } = this;
    const signal = this.abort.signal;
    const typeById = new Map(this.options.unitTypes.map((type) => [type.id, type]));

    // Which model each unit wants: the file of its type, or a placeholder.
    const wanted = new Map<string, { file: string | null; mounted: boolean }>();
    const modelKeyOf = new Map<string, string>();
    for (const unit of battle.units) {
      const type = typeById.get(unit.type);
      const mounted = type?.mounted ?? false;
      const key = type ? type.model : mounted ? "placeholder-mounted" : "placeholder-foot";
      modelKeyOf.set(unit.id, key);
      if (!wanted.has(key)) wanted.set(key, { file: type ? type.model : null, mounted });
    }

    const placeholders = new Map<boolean, UnitModel>();
    const placeholderFor = (mounted: boolean) => {
      let model = placeholders.get(mounted);
      if (!model) {
        model = buildUnitModel(createPlaceholderSource(mounted));
        placeholders.set(mounted, model);
        this.models.add(model);
      }
      return model;
    };

    const modelByKey = new Map<string, UnitModel>();
    const [heights] = await Promise.all([
      loadHeights(battle.terrain, signal),
      ...[...wanted].map(async ([key, want]) => {
        const source = want.file ? await loadModelSource(want.file, signal) : null;
        if (this.disposed) {
          source?.release?.();
          return;
        }
        const model = source ? buildUnitModel(source) : placeholderFor(want.mounted);
        this.models.add(model);
        modelByKey.set(key, model);
      }),
    ]);
    if (this.disposed) return;
    this.modelNotes = [...modelByKey]
      .map(([key, model]) => `${key}: ${model.placeholder ? "placeholder" : "file"}`)
      .sort();

    const terrain = new Terrain(battle.terrain, heights);
    this.terrain = terrain;
    this.scene.add(terrain.group);

    const colors = new Map<string, Color>();
    for (const side of battle.sides) {
      colors.set(side.id, new Color(this.options.colorOfPolity(side.polityId) ?? FALLBACK_COLOR));
    }
    const colorOfSide = (sideId: string) => colors.get(sideId) ?? new Color(FALLBACK_COLOR);

    const clock = new BattleClock(battle);
    const materialCache = new Map<string, FigureMaterials>();
    for (const unit of battle.units) {
      const model = modelByKey.get(modelKeyOf.get(unit.id) ?? "") ?? placeholderFor(false);
      const color = colorOfSide(unit.side);
      const cacheKey = `${model.name}/${color.getHexString()}`;
      let materials = materialCache.get(cacheKey);
      if (!materials) {
        materials = createFigureMaterials(model, color, this.shared);
        materialCache.set(cacheKey, materials);
        this.materials.push(materials);
      }
      const track = new UnitTrack(battle, unit, clock);
      if (track.count === 0) continue;
      this.crowd.add(new UnitBlock(track, model, materials, color, this.crowd.group));
    }

    this.arrows = new ArrowLayer(battle, colorOfSide, terrain.heightAt);
    this.scene.add(this.arrows.group);

    this.frameView();
    this.startedAt = performance.now();
    this.lastFrame = this.startedAt;
    this.statSince = this.startedAt;
    this.settleUntil = this.startedAt + 3000;
    this.frameHandle = requestAnimationFrame(this.frame);
    this.options.onReady?.();
  }

  /** Opens on the whole battle, seen from the south with north at the top. */
  private frameView(): void {
    const terrain = this.terrain;
    if (!terrain) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const block of this.crowd.blocks) {
      for (const key of block.track.keys) {
        const reach = Math.hypot(key.frontage, key.depth) / 2 + Math.abs(key.bulge);
        minX = Math.min(minX, key.center.x - reach);
        maxX = Math.max(maxX, key.center.x + reach);
        minY = Math.min(minY, key.center.y - reach);
        maxY = Math.max(maxY, key.center.y + reach);
      }
    }
    if (!Number.isFinite(minX)) {
      ({ minX, maxX, minY, maxY } = terrain.data);
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radius = Math.max(Math.hypot(maxX - minX, maxY - minY) / 2, 100);

    const vertical = (FOV * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * this.camera.aspect);
    const distance = (radius * 1.05) / Math.sin(Math.min(vertical, horizontal) / 2);
    const tilt = (52 * Math.PI) / 180; // from straight down
    const target = this.controls.target.set(centerX, terrain.heightAt(centerX, centerY), -centerY);
    this.camera.position.set(
      target.x,
      target.y + distance * Math.cos(tilt),
      target.z + distance * Math.sin(tilt),
    );
    const span = Math.hypot(
      terrain.data.maxX - terrain.data.minX,
      terrain.data.maxY - terrain.data.minY,
    );
    this.controls.maxDistance = Math.max(span * 1.2, distance * 1.5);
    this.controls.update();
  }

  // --- Every frame -----------------------------------------------------------

  private readonly frame = (now: number): void => {
    if (this.disposed) return;
    this.frameHandle = requestAnimationFrame(this.frame);
    const terrain = this.terrain;
    if (!terrain) return;
    const elapsed = now - this.lastFrame;
    this.lastFrame = now;
    const seconds = (now - this.startedAt) / 1000;

    const time = Math.min(Math.max(this.options.getTime(), 0), this.battle.phases.length);
    if (time !== this.lastTime) {
      this.lastTime = time;
      this.lastTimeChange = now;
    }
    const playing = now - this.lastTimeChange < 250;

    this.updateCamera(terrain);
    this.sky.setHour(hourAt(this.battle, time));
    const distance = this.camera.position.distanceTo(this.controls.target);
    this.sky.follow(this.camera, this.controls.target, distance);
    this.fog.color.copy(this.sky.haze);
    this.fog.near = distance * 2 + 1500;
    this.fog.far = distance * 4 + 45000;

    this.shared.uTime.value = seconds;
    this.crowd.update(time, playing, seconds, terrain.heightAt);
    const counts = this.crowd.selectLods(
      this.camera,
      this.height,
      (FOV * Math.PI) / 180,
      QUALITY[this.quality],
    );
    this.arrows?.update(time, seconds);

    this.renderer.render(this.scene, this.camera);
    this.options.onFrame?.();
    this.measure(now, elapsed, counts);
  };

  private updateCamera(terrain: Terrain): void {
    const { controls, camera } = this;
    controls.update();

    // Keep the point looked at on the field and on the ground...
    const target = controls.target;
    const { minX, maxX, minY, maxY } = terrain.data;
    const clampedX = Math.min(Math.max(target.x, minX), maxX);
    const clampedZ = Math.min(Math.max(target.z, -maxY), -minY);
    const ground = terrain.heightAt(clampedX, -clampedZ);
    const shift = this.scratch.set(clampedX - target.x, ground - target.y, clampedZ - target.z);
    if (shift.lengthSq() > 1e-8) {
      target.add(shift);
      camera.position.add(shift);
    }
    // ...and the camera above it.
    const floor = terrain.heightAt(camera.position.x, -camera.position.z) + 3;
    if (camera.position.y < floor) camera.position.y = floor;

    const distance = camera.position.distanceTo(target);
    const near = Math.min(Math.max(distance * 0.02, 1), 60);
    if (Math.abs(near - camera.near) > camera.near * 0.05) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }

  private measure(now: number, elapsed: number, counts: { standing: number; drawn: number; lods: number[] }): void {
    // A long gap is a hidden tab or a stall while loading, not a slow scene.
    if (elapsed > 500) {
      this.statFrames = 0;
      this.statSince = now;
      return;
    }
    this.statFrames++;
    const span = now - this.statSince;
    if (span < 500) return;
    const fps = (this.statFrames * 1000) / span;
    this.statFrames = 0;
    this.statSince = now;

    if (this.quality === "high" && this.autoLowerAllowed && now > this.settleUntil) {
      this.slowSeconds = fps < SLOW_FPS ? this.slowSeconds + span / 1000 : 0;
      if (this.slowSeconds >= SLOW_SECONDS) {
        this.quality = "low";
        this.applyQuality();
        this.options.onQualityLowered?.();
      }
    }

    const info = this.renderer.info.render;
    this.options.onStats?.({
      fps,
      frameMs: 1000 / fps,
      figures: counts.standing,
      drawn: counts.drawn,
      drawCalls: info.calls,
      triangles: info.triangles,
      lods: counts.lods,
      quality: this.quality,
      gpu: this.gpu,
      models: this.modelNotes,
    });
  }

  private applyQuality(): void {
    const settings = QUALITY[this.quality];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatio));
    this.renderer.setSize(this.width, this.height, false);
    this.sky.setShadows(settings.shadows);
    this.slowSeconds = 0;
    this.settleUntil = performance.now() + 3000;
  }

  private resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private readonly onContextLost = (event: Event): void => {
    if (this.disposed) return;
    event.preventDefault();
    cancelAnimationFrame(this.frameHandle);
    this.options.onError?.(new Error("WebGL context lost"));
  };
}
