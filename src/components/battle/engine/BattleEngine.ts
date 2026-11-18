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
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Spherical,
  Vector3,
  WebGLRenderer,
} from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import { type Battle, type FieldPoint, hourAt, phaseAt, type UnitType } from "@/lib/battle";
import { ArrowLayer } from "./arrows";
import { loadModelIndex, loadModelSource } from "./figures/loader";
import { createFigureMaterials, type FigureMaterials, type FigureShared } from "./figures/material";
import { type FramedBlock, frameBlocks, mainForces } from "./framing";
import { buildUnitModel, type UnitModel } from "./figures/model";
import { createPlaceholderSource } from "./figures/placeholder";
import { hidden, type Occluder, pick } from "./occlusion";
import { Sky } from "./sky";
import { makeStressBattle } from "./stress";
import { Structures } from "./structures";
import { loadFarHeights, loadHeights, Terrain } from "./terrain";
import { BattleClock, formationPoint, opposition, UnitTrack } from "./timeline";
import { Crowd, FIGURE_SCALE, type LodSettings, SHADOW_LAYER, UnitBlock } from "./units";

export type Quality = "high" | "low";

/** A box on screen, CSS pixels from the top left of the scene. */
export interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A unit as the scene shows it this frame: for its label and its card. */
export interface UnitView {
  /** BattleUnit.id */
  id: string;
  /** Figures standing; 0 once the unit has no men left on the field. */
  standing: number;
  /**
   * Where its label may stand, best first: points on screen just above the
   * block, over the middle of its front, then towards its left and right
   * ends (UNIT_LABEL_SHARES). Null where that part is off screen, or hidden
   * by a hill or another block (the block itself hides nothing of it).
   */
  anchors: ({ x: number; y: number } | null)[];
  /** How large the block looks: its size over its distance from the camera. */
  prominence: number;
  /**
   * Around the block on screen, from the ground to the heads: only for the
   * unit asked for (see unitViews); null for the others, and when behind the
   * camera.
   */
  box: ScreenBox | null;
}

/** Across the front of a block, where its label may stand: middle, left, right. */
export const UNIT_LABEL_SHARES = [0, -0.3, 0.3] as const;
/** Labels and cards stand this far above the heads, as a share of the figure's height. */
const LABEL_LIFT = 1.1;
/** A click this many pixels off a block still picks it; at least PICK_METRES. */
const PICK_PIXELS = 6;
const PICK_METRES = 4;
/** The flight of the camera to a unit picked from the list, milliseconds. */
const FLIGHT_MS = 1200;
/** Nearest the camera comes to a unit it flies to, metres. */
const FLIGHT_NEAREST = 150;

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
  /**
   * Open with the camera high above the field, looking straight down with
   * north up, as the map left it, and bring it down to the opening view.
   * Skipped when the user asks for reduced motion.
   */
  introFromAbove?: boolean;
}

/** The opening move of the camera, milliseconds. */
const INTRO_MS = 1800;
/**
 * It starts looking straight down on the middle of the ground, high enough to
 * see all of it with this much to spare: where the map left off (T-025).
 */
const INTRO_MARGIN = 1.08;
const INTRO_POLAR = 0.02;

const QUALITY: Record<Quality, { pixelRatio: number } & LodSettings> = {
  high: {
    pixelRatio: 2,
    lod0Pixels: 110,
    lod1Pixels: 32,
    triangleBudget: 2_500_000,
    shadows: true,
    // Every level: figures keep their look (metal stays metal) as they
    // change level with distance. Measured no slower than LOD0 alone.
    detailedLods: 3,
  },
  low: {
    pixelRatio: 1,
    lod0Pixels: Infinity,
    lod1Pixels: 70,
    triangleBudget: 700_000,
    shadows: false,
    detailedLods: 0,
  },
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
  private readonly shared: FigureShared;
  private readonly models = new Set<UnitModel>();
  private modelNotes: string[] = [];
  private readonly materials: FigureMaterials[] = [];
  private readonly abort = new AbortController();
  private readonly resizeObserver: ResizeObserver;
  private readonly battle: Battle;
  private terrain: Terrain | null = null;
  private arrows: ArrowLayer | null = null;
  private structures: Structures | null = null;
  private clock: BattleClock | null = null;

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
  /** The blocks of troops as boxes, this frame: what may hide a place from view. */
  private readonly occluders: Occluder[] = [];
  /** The block of each box in `occluders`. */
  private readonly occluderOwners: UnitBlock[] = [];
  /** What unitViews() returns, reused from frame to frame. */
  private readonly views: UnitView[] = [];
  /** The label anchors of each view, reused from frame to frame. */
  private readonly anchorPoints: { x: number; y: number }[][] = [];
  /** Working values of unitViews(). */
  private readonly viewScratch = {
    eyeField: { x: 0, y: 0, h: 0 },
    at: { x: 0, y: 0 },
    front: { x: 0, y: 0 },
    back: { x: 0, y: 0 },
    point: { x: 0, y: 0, h: 0 },
  };
  /** The opening move of the camera while it lasts (see introFromAbove). */
  private intro: {
    from: Spherical;
    to: Spherical;
    fromTarget: Vector3;
    toTarget: Vector3;
    start: number;
  } | null = null;
  /** The camera on its way to a unit (focusUnit), while it lasts. */
  private flight: {
    block: UnitBlock;
    from: Spherical;
    fromTarget: Vector3;
    radius: number;
    phi: number;
    start: number;
  } | null = null;
  /** Any drag, turn or zoom by the user ends a move of the camera. */
  private readonly stopCameraMoves = (): void => {
    this.intro = null;
    this.flight = null;
  };

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

    this.sky = new Sky(this.battle.origin.lat, this.battle.dayOfYear);
    // The meshes that only cast shadows are drawn in the shadow map alone.
    this.sky.light.shadow.camera.layers.enable(SHADOW_LAYER);
    this.shared = {
      uTime: { value: 0 },
      uFigScale: { value: FIGURE_SCALE },
      uEnvZenith: { value: this.sky.envZenith },
      uEnvHorizon: { value: this.sky.envHorizon },
      uEnvGround: { value: this.sky.envGround },
    };
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
    // Any drag, turn or zoom by the user ends a move of the camera.
    this.controls.addEventListener("start", this.stopCameraMoves);

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

  /** Size of the drawing area in CSS pixels. */
  get viewSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
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
   * container. Returns false when the point cannot be seen: behind the
   * camera, or hidden by a hill or a body of troops in front of it.
   */
  project(point: FieldPoint, out: { x: number; y: number }): boolean {
    if (!this.terrain) return false;
    const ground = this.terrain.heightAt(point.x, point.y);
    const v = this.scratch.set(point.x, ground, -point.y);
    v.project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.width;
    out.y = (-v.y * 0.5 + 0.5) * this.height;
    if (!(v.z > -1 && v.z < 1)) return false;
    const eye = this.camera.position;
    return !hidden(
      { x: eye.x, y: -eye.z, h: eye.y },
      { x: point.x, y: point.y, h: ground + 1 },
      this.terrain.heightAt,
      this.occluders,
    );
  }

  /** The battle time drawn in the last frame, or the one asked for before the first. */
  private get shownTime(): number {
    const time = Number.isNaN(this.lastTime) ? this.options.getTime() : this.lastTime;
    return Math.min(Math.max(time, 0), this.battle.phases.length);
  }

  /** Field metres (x east, y north, h up) to screen pixels; false behind the camera. */
  private toScreen(x: number, y: number, h: number, out: { x: number; y: number }): boolean {
    const v = this.scratch.set(x, h, -y).project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.width;
    out.y = (-v.y * 0.5 + 0.5) * this.height;
    return v.z > -1 && v.z < 1;
  }

  /**
   * Every unit with figures, as the last frame showed it: for the labels and
   * the card of a unit. Only the unit `boxFor` gets its box on screen (the
   * card is placed beside it); the others have none. The array, its entries
   * and their anchors are reused by the next call; read them before then.
   * Runs on every frame while names show, so it allocates nothing.
   */
  unitViews(boxFor: string | null = null): readonly UnitView[] {
    const terrain = this.terrain;
    const views = this.views;
    if (!terrain) return views;
    const { heightAt } = terrain;
    const time = this.shownTime;
    const eye = this.camera.position;
    const { eyeField, at, front, back, point } = this.viewScratch;
    eyeField.x = eye.x;
    eyeField.y = -eye.z;
    eyeField.h = eye.y;
    // occluders() lists the standing blocks in order, each with its box.
    let owner = 0;

    const blocks = this.crowd.blocks;
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      let view = views[b];
      if (!view) {
        view = { id: block.track.unit.id, standing: 0, anchors: UNIT_LABEL_SHARES.map(() => null), prominence: 0, box: null };
        views[b] = view;
        this.anchorPoints[b] = UNIT_LABEL_SHARES.map(() => ({ x: 0, y: 0 }));
      }
      const own = this.occluderOwners[owner] === block ? this.occluders[owner++] : undefined;
      view.standing = block.standing;
      const f = block.track.formationAt(time);
      const lift = block.model.height * FIGURE_SCALE * LABEL_LIFT;
      const centerGround = heightAt(f.center.x, f.center.y);
      if (block.standing > 0) {
        const dx = f.center.x - eyeField.x;
        const dy = f.center.y - eyeField.y;
        const dh = centerGround - eyeField.h;
        view.prominence = Math.sqrt(f.frontage * f.depth) / Math.max(Math.sqrt(dx * dx + dy * dy + dh * dh), 1);
      } else {
        view.prominence = 0;
      }

      // The box on screen: the ends and the middle of the front and the rear,
      // on the ground and at the heads.
      view.box = null;
      if (view.id === boxFor) {
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        for (let i = 0; i < 6; i++) {
          formationPoint(f, (i % 3) / 2 - 0.5, i < 3 ? 0 : 1, at);
          const ground = heightAt(at.x, at.y);
          for (let lifted = 0; lifted < 2; lifted++) {
            if (!this.toScreen(at.x, at.y, ground + lifted * lift, front)) continue;
            left = Math.min(left, front.x);
            right = Math.max(right, front.x);
            top = Math.min(top, front.y);
            bottom = Math.max(bottom, front.y);
          }
        }
        if (left <= right) view.box = { left, top, right, bottom };
      }

      // Label anchors: above the heads, over the front or the rear, whichever
      // shows higher on screen, so the label stands clear of the whole block.
      const anchors = this.anchorPoints[b];
      for (let k = 0; k < UNIT_LABEL_SHARES.length; k++) {
        view.anchors[k] = null;
        if (block.standing === 0) continue;
        const u = UNIT_LABEL_SHARES[k];
        formationPoint(f, u, 0, at);
        const frontSeen = this.toScreen(at.x, at.y, heightAt(at.x, at.y) + lift, front);
        formationPoint(f, u, 1, at);
        const backSeen = this.toScreen(at.x, at.y, heightAt(at.x, at.y) + lift, back);
        if (!frontSeen || !backSeen) continue;
        formationPoint(f, u, 0.5, at);
        point.x = at.x;
        point.y = at.y;
        point.h = heightAt(at.x, at.y) + lift;
        if (hidden(eyeField, point, heightAt, this.occluders, own)) continue;
        anchors[k].x = (front.x + back.x) / 2;
        anchors[k].y = Math.min(front.y, back.y);
        view.anchors[k] = anchors[k];
      }
    }
    views.length = blocks.length;
    return views;
  }

  /**
   * The unit under a point of the scene (CSS pixels from its top left): the
   * nearest block a ray from the camera meets, or null.
   */
  pickUnit(x: number, y: number): string | null {
    const terrain = this.terrain;
    if (!terrain || this.occluders.length === 0) return null;
    const eye = this.camera.position;
    const through = this.scratch
      .set((x / this.width) * 2 - 1, 1 - (y / this.height) * 2, 0.5)
      .unproject(this.camera)
      .sub(eye)
      .normalize();
    const pixelsPerMetreAtOne = this.height / (2 * Math.tan((FOV * Math.PI) / 360));
    // Up to the top of the heads, not only the shoulders as for hiding labels.
    const boxes = this.occluders.map((box, i) => ({
      ...box,
      top: box.bottom + this.occluderOwners[i].model.height * FIGURE_SCALE,
    }));
    const margins = boxes.map((box) => {
      const distance = Math.hypot(box.x - eye.x, box.y + eye.z, box.bottom - eye.y);
      return Math.max(PICK_METRES, (PICK_PIXELS * distance) / pixelsPerMetreAtOne);
    });
    const hit = pick(
      { x: eye.x, y: -eye.z, h: eye.y },
      { x: through.x, y: -through.z, h: through.y },
      boxes,
      margins,
      terrain.heightAt,
    );
    return hit >= 0 ? this.occluderOwners[hit].track.unit.id : null;
  }

  /**
   * Flies the camera to a unit, keeping the direction it looks from, close
   * enough to see the whole block. Jumps there when the user asks for
   * reduced motion. A drag, turn or zoom by the user stops it.
   */
  focusUnit(id: string): void {
    const block = this.crowd.blocks.find((b) => b.track.unit.id === id);
    if (!block || !this.terrain) return;
    this.intro = null;
    const f = block.track.formationAt(this.shownTime);
    const from = new Spherical().setFromVector3(
      this.scratch.subVectors(this.camera.position, this.controls.target),
    );
    // The front, or the depth if larger, over about 60% of the view across.
    const across = Math.tan((FOV * Math.PI) / 360) * Math.min(this.camera.aspect, 1.6);
    const size = Math.max(f.frontage, f.depth);
    const radius = Math.min(Math.max(size / (1.2 * across), FLIGHT_NEAREST), this.controls.maxDistance);
    // Neither straight down nor skimming the ground.
    const phi = Math.min(Math.max(from.phi, 0.35), 1.2);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.flight = {
      block,
      from,
      fromTarget: this.controls.target.clone(),
      radius,
      phi,
      start: reduce ? -Infinity : performance.now(),
    };
  }

  /** The camera at its place in the flight to a unit; true once it has arrived. */
  private placeFlightCamera(now: number): boolean {
    const flight = this.flight;
    const terrain = this.terrain;
    if (!flight || !terrain) return true;
    const k = Math.min((now - flight.start) / FLIGHT_MS, 1);
    const e = k * k * (3 - 2 * k);
    // The unit may be on the move: aim at where it is now.
    const f = flight.block.track.formationAt(this.shownTime);
    const to = this.scratch.set(f.center.x, terrain.heightAt(f.center.x, f.center.y), -f.center.y);
    this.controls.target.lerpVectors(flight.fromTarget, to, e);
    const at = new Spherical(
      flight.from.radius * (flight.radius / flight.from.radius) ** e,
      flight.from.phi + (flight.phi - flight.from.phi) * e,
      flight.from.theta,
    );
    this.camera.position.setFromSpherical(at).add(this.controls.target);
    return k >= 1;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controls.removeEventListener("start", this.stopCameraMoves);
    this.controls.dispose();
    this.crowd.dispose();
    for (const materials of this.materials) materials.dispose();
    for (const model of this.models) model.dispose();
    this.models.clear();
    this.arrows?.dispose();
    this.structures?.dispose();
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

    // The model index first: only the models it lists are requested.
    const modelByKey = new Map<string, UnitModel>();
    const loadModels = async () => {
      const available = await loadModelIndex(signal);
      await Promise.all(
        [...wanted].map(async ([key, want]) => {
          const file = want.file && available.has(want.file) ? want.file : null;
          const source = file ? await loadModelSource(file, signal) : null;
          if (this.disposed) {
            source?.release?.();
            return;
          }
          const model = source ? buildUnitModel(source) : placeholderFor(want.mounted);
          this.models.add(model);
          modelByKey.set(key, model);
        }),
      );
    };
    const [heights, farHeights] = await Promise.all([
      loadHeights(battle.terrain, signal),
      loadFarHeights(battle.terrain, signal),
      loadModels(),
    ]);
    if (this.disposed) return;
    this.modelNotes = [...modelByKey]
      .map(([key, model]) => `${key}: ${model.placeholder ? "placeholder" : "file"}`)
      .sort();

    const terrain = new Terrain(battle.terrain, heights, farHeights);
    this.terrain = terrain;
    this.scene.add(terrain.group);

    const colors = new Map<string, Color>();
    for (const side of battle.sides) {
      colors.set(side.id, new Color(this.options.colorOfPolity(side.polityId) ?? FALLBACK_COLOR));
    }
    const colorOfSide = (sideId: string) => colors.get(sideId) ?? new Color(FALLBACK_COLOR);

    const clock = new BattleClock(battle);
    this.clock = clock;
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
      const track = new UnitTrack(battle, unit, clock, opposition(battle, unit));
      if (track.count === 0) continue;
      const side = battle.sides.findIndex((s) => s.id === unit.side);
      this.crowd.add(new UnitBlock(track, model, materials, color, this.crowd.group, side));
    }
    this.crowd.engage();

    this.arrows = new ArrowLayer(battle, colorOfSide, terrain.heightAt);
    this.scene.add(this.arrows.group);

    this.structures = new Structures(battle, terrain.heightAt);
    this.scene.add(this.structures.group);

    this.frameView();
    await this.compileShaders();
    if (this.disposed) return;
    this.startedAt = performance.now();
    this.startIntro(this.startedAt);
    this.lastFrame = this.startedAt;
    this.statSince = this.startedAt;
    this.settleUntil = this.startedAt + 3000;
    this.frameHandle = requestAnimationFrame(this.frame);
    this.options.onReady?.();
  }

  /**
   * Opens on the main forces where they stand at the end of the phase under
   * way (see framing.ts). Ends of phases, not the exact battle time: at the
   * start of a battle the armies are still marching out of their camps, and
   * the view should show where they meet, so they march into the frame.
   */
  private frameView(): void {
    const terrain = this.terrain;
    if (!terrain) return;
    const phases = this.battle.phases.length;
    const time = phases === 0 ? 0 : phaseAt(this.battle, this.options.getTime());
    const blocks: FramedBlock[] = this.crowd.blocks.map((block) => {
      const formation = block.track.formationAt(time);
      return {
        side: block.track.unit.side,
        formation: { ...formation, center: { ...formation.center } },
        men: formation.men,
      };
    });
    const tallest = Math.max(...this.crowd.blocks.map((block) => block.model.height), 1.8);
    const fit = frameBlocks(
      mainForces(blocks),
      terrain.heightAt,
      tallest * FIGURE_SCALE,
      (FOV * Math.PI) / 180,
      this.camera.aspect,
    );

    let distance: number;
    if (fit) {
      this.controls.target.copy(fit.target);
      this.camera.position.copy(fit.position);
      distance = fit.distance;
    } else {
      // No troops: the whole ground, from the south.
      const { minX, maxX, minY, maxY } = terrain.data;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      distance = Math.hypot(maxX - minX, maxY - minY);
      const tilt = (52 * Math.PI) / 180;
      const target = this.controls.target.set(centerX, terrain.heightAt(centerX, centerY), -centerY);
      this.camera.position.set(
        target.x,
        target.y + distance * Math.cos(tilt),
        target.z + distance * Math.sin(tilt),
      );
    }
    const span = Math.hypot(
      terrain.data.maxX - terrain.data.minX,
      terrain.data.maxY - terrain.data.minY,
    );
    this.controls.maxDistance = Math.max(span * 1.2, distance * 1.5);
    this.controls.update();
  }

  /**
   * Starts the opening move: from straight above the middle of the ground,
   * north up (the camera a hair south of it), high enough to see all of it,
   * as the map shows it at the end of its flight; down to the opening view.
   */
  private startIntro(now: number): void {
    const terrain = this.terrain;
    if (!this.options.introFromAbove || !terrain) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const toTarget = this.controls.target.clone();
    const to = new Spherical().setFromVector3(this.scratch.subVectors(this.camera.position, toTarget));
    const { minX, maxX, minY, maxY } = terrain.data;
    const x = (minX + maxX) / 2;
    const y = (minY + maxY) / 2;
    const fromTarget = new Vector3(x, terrain.heightAt(x, y), -y);
    const tan = Math.tan((FOV * Math.PI) / 360);
    const radius =
      Math.max((maxY - minY) / 2 / tan, (maxX - minX) / 2 / (tan * this.camera.aspect)) * INTRO_MARGIN;
    const from = new Spherical(Math.max(radius, to.radius), INTRO_POLAR, 0);
    this.controls.maxDistance = Math.max(this.controls.maxDistance, from.radius);
    this.intro = { from, to, fromTarget, toTarget, start: now };
    this.placeIntroCamera(0);
  }

  /** The camera at fraction k (0..1) of the opening move. */
  private placeIntroCamera(k: number): void {
    const intro = this.intro;
    if (!intro) return;
    const e = k * k * (3 - 2 * k);
    const { from, to } = intro;
    let turn = (to.theta - from.theta) % (2 * Math.PI);
    if (turn > Math.PI) turn -= 2 * Math.PI;
    if (turn < -Math.PI) turn += 2 * Math.PI;
    const at = new Spherical(
      // Height by ratio, so the zoom feels even from far to near.
      from.radius * (to.radius / from.radius) ** e,
      from.phi + (to.phi - from.phi) * e,
      from.theta + turn * e,
    );
    this.controls.target.lerpVectors(intro.fromTarget, intro.toTarget, e);
    this.camera.position.setFromSpherical(at).add(this.controls.target);
  }

  /**
   * Compiles every shader the troops may need while the scene still shows
   * that it is loading; the detailed material would otherwise compile, and
   * stall a frame, on the first zoom onto a block.
   */
  private async compileShaders(): Promise<void> {
    const meshes = this.crowd.warmUpMeshes();
    if (meshes.length === 0) return;
    this.crowd.group.add(...meshes);
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      // Only an optimisation: shaders also compile on first use.
    } finally {
      this.crowd.group.remove(...meshes);
    }
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

    if (this.intro) {
      const k = Math.min((now - this.intro.start) / INTRO_MS, 1);
      this.placeIntroCamera(k);
      if (k >= 1) this.intro = null;
    }
    if (this.flight && this.placeFlightCamera(now)) this.flight = null;
    this.updateCamera(terrain);
    this.sky.setHour(hourAt(this.battle, time));
    const distance = this.camera.position.distanceTo(this.controls.target);
    this.sky.follow(this.camera, this.controls.target, distance);
    this.fog.color.copy(this.sky.haze);
    this.fog.near = distance * 2 + 1500;
    this.fog.far = distance * 4 + 45000;

    this.shared.uTime.value = seconds;
    terrain.update(seconds, this.sky);
    this.crowd.update(time, this.clock?.seconds(time) ?? 0, playing, seconds, terrain.footingAt);
    this.crowd.occluders(time, terrain.heightAt, this.occluders, this.occluderOwners);
    const counts = this.crowd.selectLods(
      this.camera,
      this.height,
      (FOV * Math.PI) / 180,
      QUALITY[this.quality],
      this.sky.daylight,
    );
    this.arrows?.update(time, seconds, this.sky.daylight);

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
    // A hidden tab or a very long gap is a pause, not a slow scene. Frames
    // that are merely slow (a software renderer manages one or two a second)
    // must still count, or the weakest machines would never drop to low.
    if (document.hidden || elapsed > 3000) {
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
