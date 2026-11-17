/**
 * Contract for the 3D battle scenes. See docs/ARCHITECTURE.md, "Trận đánh 3D".
 *
 *   battle data (lane 2)  ->  3D engine (lane 3)  <-  controls (lane 1)
 *   src/data/battles/        src/components/battle/   via useAppStore
 *
 * Unit models come from lane 1 (public/battles/models/), built with Blender.
 * Change this file only through the main (coordinating) session.
 */

import type { LocalizedText, SourceRef } from "./types";

/** One figure on screen stands for this many men. */
export const MEN_PER_FIGURE = 20;

/**
 * Animation clips a unit model carries, by name. idle, walk and attack are
 * required; the engine falls back to walk for run, to removing the figure
 * without a clip for die, and to walk and run alone without jog.
 *
 * jog (added after the others, so their indices stay as they were) is a
 * steady run between walk and the fast run: the legs of a block moving at a
 * middle speed. See docs/ARCHITECTURE.md, "Mô hình lính".
 */
export const UNIT_CLIPS = ["idle", "walk", "run", "attack", "die", "jog"] as const;
export type UnitClip = (typeof UNIT_CLIPS)[number];

/** Mesh names inside a unit model, from most to least detailed. */
export const UNIT_LODS = ["LOD0", "LOD1", "LOD2"] as const;

/**
 * public/battles/models/index.json lists the unit models that exist. The
 * scene requests only these and draws placeholders for the rest, so a model
 * not yet built costs no request. Lane 1's export scripts keep it current;
 * `npm run validate` checks it against the files in the folder.
 */
export const MODEL_INDEX_URL = "/battles/models/index.json";

/**
 * Where a unit model file is served (ModelIndex.models / UnitType.model). The
 * scene loads it from here and the map prefetches it from here, so both must
 * build the URL with this function: a URL that differs by one character is a
 * second download.
 */
export function modelUrl(model: string): string {
  return `/battles/models/${encodeURIComponent(model)}.glb`;
}

/** Where a terrain grid (BattleTerrain.file) is served; see modelUrl. */
export function terrainUrl(file: string): string {
  return `/data/terrain/${file}`;
}

export interface ModelIndex {
  /** File stems, e.g. "roman-legionary" for roman-legionary.glb. */
  models: string[];
}

/** What a unit is doing during a phase; the engine picks clips from it. */
export type UnitAction =
  | "stand"
  | "advance"
  | "charge"
  | "fight"
  | "retreat"
  | "rout"
  | "pursue";

/**
 * A point on the battlefield, in metres from Battle.origin:
 * x grows to the east, y to the north.
 */
export interface FieldPoint {
  x: number;
  y: number;
}

/** A block of troops at one moment. */
export interface Formation {
  center: FieldPoint;
  /** Width of the front, metres. */
  frontage: number;
  /** Front to back, metres. */
  depth: number;
  /** Direction the front faces, degrees clockwise from north. */
  facing: number;
  /**
   * How far the middle of the front stands out from a straight line, metres:
   * positive bulges towards the enemy (Hannibal's crescent), negative is
   * hollow. Absent or 0 means straight.
   */
  bulge?: number;
}

/** A low and a high figure when the sources disagree (min may equal max). */
export interface NumberRange {
  min: number;
  max: number;
  /** Which source gives which figure. */
  note?: LocalizedText;
}

/** A kind of soldier, shared by every battle. src/data/battles/unit-types.json */
export interface UnitType {
  /** Kebab-case, e.g. "roman-hastati". */
  id: string;
  name: LocalizedText;
  /** File stem in public/battles/models/: "roman-legionary" -> roman-legionary.glb */
  model: string;
  /** Horsemen: the model includes the horse. */
  mounted?: boolean;
}

export interface BattleSide {
  /** Kebab-case, unique within the battle, e.g. "rome". */
  id: string;
  /** Id from polities.json; gives the side its colour. */
  polityId: string;
  name: LocalizedText;
  commanders: LocalizedText[];
  /** Men at the start of the battle. */
  strength: NumberRange;
  casualties?: NumberRange;
}

export interface BattleUnit {
  /** Kebab-case, unique within the battle. */
  id: string;
  /** BattleSide.id */
  side: string;
  /** UnitType.id */
  type: string;
  name: LocalizedText;
  /** Men at the start; the scene shows men / MEN_PER_FIGURE figures. */
  men: number;
}

/** Where a unit is and what it does, at one moment. */
export interface UnitState {
  /** BattleUnit.id */
  unit: string;
  formation: Formation;
  action: UnitAction;
  /** Men still in the fight. */
  men: number;
}

/** A movement arrow drawn on the ground during a phase. */
export interface BattleArrow {
  /** BattleSide.id: the arrow takes that side's colour. */
  side: string;
  /** From the first point to the last, through any in between. */
  points: FieldPoint[];
}

export interface BattlePhase {
  /** Kebab-case, unique within the battle. */
  id: string;
  title: LocalizedText;
  /** Two to five sentences, self-written. */
  narration: LocalizedText;
  /** Clock time at the end of the phase, in hours (7.5 = 07:30). */
  endHour: number;
  /** Seconds this phase takes at normal playback speed. */
  playSeconds: number;
  /** Every unit's state at the END of the phase. */
  units: UnitState[];
  arrows?: BattleArrow[];
}

export interface BattleRiver {
  name: LocalizedText;
  /** Centre line, upstream to downstream. */
  points: FieldPoint[];
  /** Typical width, metres. */
  width: number;
  /** True when the course in the battle's time is uncertain. */
  approximate?: boolean;
}

export interface BattleLandmark {
  name: LocalizedText;
  kind: "camp" | "town" | "hill" | "ford" | "other";
  point: FieldPoint;
  approximate?: boolean;
}

/**
 * Ground elevation as a grid in public/data/terrain/<file>: Int16 values,
 * little-endian, in decimetres above sea level; rows run north to south,
 * columns west to east; the first value is the north-west corner.
 */
export interface BattleTerrain {
  file: string;
  /** Columns and rows of the grid. */
  width: number;
  height: number;
  /** Ground the grid covers, metres from Battle.origin. */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  rivers: BattleRiver[];
  landmarks: BattleLandmark[];
  /** Where the elevation data comes from, with its licence. */
  sources: SourceRef[];
}

export interface Battle {
  /** The event id in events.json, e.g. "battle-of-cannae". */
  id: string;
  /** WGS84 of the point x = 0, y = 0; the map flies here before the scene opens. */
  origin: { lng: number; lat: number };
  /** e.g. "2 August 216 BCE (Roman calendar)". */
  date: LocalizedText;
  /**
   * Day of the solar year, 1–366 (proleptic Gregorian), for the sun's path.
   * The Roman calendar date often differs, so the data notes how it was
   * converted. Optional: without it the scene assumes a summer day.
   */
  dayOfYear?: number;
  sides: BattleSide[];
  units: BattleUnit[];
  /** Clock time at the start, in hours. */
  startHour: number;
  /** Every unit's state at the start, before phase 1. */
  initial: UnitState[];
  phases: BattlePhase[];
  terrain: BattleTerrain;
  /** What is reconstructed or disputed: the site, numbers, positions. */
  uncertainty: LocalizedText;
  sources: SourceRef[];
}

/** Props of the scene component, src/components/battle/BattleScene.tsx. */
export interface BattleSceneProps {
  battle: Battle;
  unitTypes: UnitType[];
  /** Development aids: frame rate and figure count, a synthetic crowd. */
  debug?: {
    showStats?: boolean;
    /** Replace the battle's units with this many figures in a grid. */
    stressFigures?: number;
  };
}

/**
 * The phase under way at `time` (store.battleTime): 1-based, so time 0
 * belongs to phase 1 and time n to phase n.
 */
export function phaseAt(battle: Battle, time: number): number {
  const last = battle.phases.length;
  return Math.min(Math.max(Math.ceil(time), 1), last);
}

/** The clock time at `time`, in hours, interpolated between phase ends. */
export function hourAt(battle: Battle, time: number): number {
  const t = Math.min(Math.max(time, 0), battle.phases.length);
  const index = Math.floor(t);
  const start = index === 0 ? battle.startHour : battle.phases[index - 1].endHour;
  if (index === battle.phases.length) return start;
  const end = battle.phases[index].endHour;
  return start + (end - start) * (t - index);
}
