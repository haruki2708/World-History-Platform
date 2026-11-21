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
 *
 * block and hit (added last, for the same reason) are what a man does when
 * an enemy's blow lands on him hand to hand: he takes it on his shield, or
 * it gets through and he flinches. Both start and end standing as in idle,
 * do not loop, and have the blow land REACTION_IMPACT seconds in. A model
 * without them takes blows without moving. See "Giáp lá cà".
 *
 * knockdown and ridedown (added last again) belong to horsemen riding
 * through foot (the action `overrun`; "Kỵ binh xông qua").
 * - knockdown, for models on foot: a horse bowls the man over, he lies a
 *   moment, then gets up. It starts and ends standing as in idle, does not
 *   loop, lasts KNOCKDOWN_SECONDS at most, and the horse strikes him
 *   REACTION_IMPACT seconds in. He goes over backwards: the scene turns him
 *   to face the horse first. A model without it flinches (hit) instead.
 * - ridedown, for mounted models: the rider strikes down at a man on foot
 *   beside his horse, to his weapon side. It is played once, like attack,
 *   on the rider alone: the scene keeps the horse at its gallop under him
 *   (the vertices skinned to the bones named horse_*), so the horse of the
 *   clip may stand as it does in attack. It starts and ends seated as in
 *   `run`, lasts RIDEDOWN_SECONDS at most, and the blow lands
 *   RIDEDOWN_IMPACT seconds in. A model without it strikes with attack.
 */
export const UNIT_CLIPS = [
  "idle",
  "walk",
  "run",
  "attack",
  "die",
  "jog",
  "block",
  "hit",
  "knockdown",
  "ridedown",
] as const;
export type UnitClip = (typeof UNIT_CLIPS)[number];

/**
 * In the clips block and hit, the enemy's blow lands this many seconds into
 * the clip: the scene starts them that long before the blow. The model
 * scripts build the clips to it (REACT in art/blender/whp_clips.py).
 */
export const REACTION_IMPACT = 0.3;

/**
 * The clip knockdown lasts no longer than this, seconds: a man bowled over
 * is on his feet again before the next horse may bowl him over.
 */
export const KNOCKDOWN_SECONDS = 4;

/**
 * The clip ridedown: the blow lands this many seconds in, and the clip
 * lasts no longer than RIDEDOWN_SECONDS. The scene starts it so that the
 * blow lands as the rider passes the man.
 */
export const RIDEDOWN_IMPACT = 0.4;
export const RIDEDOWN_SECONDS = 1.2;

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

/**
 * Each man his own look (T-061, đợt L, B1). A unit model may carry, all of
 * it optional (a model without it looks as before):
 *
 * - the vertex attribute `_LOOK` on every level of detail, one number:
 *   primary slot + LOOK_SECONDARY_STEP x secondary slot + LOOK_VARIANT_STEP
 *   x variant shape. Slots count from 1 into ModelLooks.slots (0: none). A
 *   variant shape (a beard, a way of wearing the hair) is drawn only for
 *   the men who drew it in its group; shape 0 is always drawn.
 * - the dye mask, in the red channel of the metallicRoughness image: 1 dyes
 *   a texel as its vertex's primary slot, 0.5 as its secondary, 0 keeps the
 *   colour of the atlas (iron, bronze, leather, a woven border); values in
 *   between blend.
 * - shield designs: grey masks (green channel) in a room of the colour
 *   image, laid across the shield's face by its frame (LookDesigns).
 * - `scenes[0].extras[LOOKS_EXTRAS]`: a JSON string, a ModelLooks.
 *
 * The scene draws, for each man and once for all (from his own random
 * number), one option of every slot, every variant group and the designs,
 * with chances in proportion to the weights: the same at every level of
 * detail and wherever the timeline is scrubbed. Colours are linear RGB.
 */
export const LOOKS_EXTRAS = "whp_looks";
export const LOOK_SECONDARY_STEP = 8;
export const LOOK_VARIANT_STEP = 64;
export const LOOK_LIMITS = { slots: 6, options: 8, groups: 4, shapes: 15, designs: 8 } as const;

export interface LookSlot {
  name: string;
  /**
   * "tint": the colour of the atlas times the option. "dye": the luminance
   * of the atlas, over `ref`, times the option (to change the hue: a red
   * tunic into an undyed one).
   */
  mode: "tint" | "dye";
  /** Mean luminance (linear) of the slot's dyed texels. */
  ref: number;
  /** [r, g, b, weight]; at most LOOK_LIMITS.options. */
  options: [number, number, number, number][];
}

export interface LookVariants {
  name: string;
  /** [variant shape, or 0 for none of them, weight]; at most LOOK_LIMITS.options. */
  options: [number, number][];
}

export interface LookDesigns {
  /** The slot the designs are painted over (counted from 1): its dyed texels take them. */
  slot: number;
  /** Each design's mask in the colour image: [u, v, width, height], glTF UVs (origin top left). */
  tiles: [number, number, number, number][];
  /** [index into tiles, or -1 for a plain shield, weight]; at most LOOK_LIMITS.designs + 1. */
  options: [number, number][];
  /** [r, g, b, weight]: laid on as a dye, with the slot's ref; at most LOOK_LIMITS.options. */
  colors: [number, number, number, number][];
  /**
   * The shield at rest, in the model's space: its centre, its long axis
   * (the tile's height, upwards) and its short axis (the tile's width).
   */
  frame: [number, number, number, number, number, number, number, number, number];
  /** Metres along the short axis (from, to) then the long axis (from, to): the tile's edges. */
  extent: [number, number, number, number];
}

export interface ModelLooks {
  version: 1;
  slots: LookSlot[];
  variants?: LookVariants[];
  designs?: LookDesigns;
}

/**
 * What a unit is doing during a phase; the engine picks clips from it.
 *
 * Two of them are fighting. `skirmish` is at a distance (javelins, sling
 * stones): the front ranks throw from where they stand. `fight` is hand to
 * hand: the scene pairs the men at the head of the files off with the
 * enemy's, and only a man with an enemy in reach strikes. So for a phase of
 * `fight` the data brings the front of the unit onto the front of an enemy
 * unit, at the start of the phase as well as at its end (the scene moves
 * units in a straight line between the two). `npm run validate` checks it.
 * See docs/ARCHITECTURE.md, "Giáp lá cà".
 *
 * `overrun` is for horsemen alone (UnitType.mounted): they ride through the
 * enemy foot before them instead of halting to fight it. Each rider leaves
 * his place, gallops through the enemy, wheels and comes back, again and
 * again through the phase; a man on foot in the way of a horse is bowled
 * over, and gets up again unless he is one of those the data has fall in the
 * phase. So for a phase of `overrun` the data brings the front of the unit
 * up to enemy foot (onto a block of it, or within a few metres of one in
 * front), at the start of the phase as well as at its end, as for `fight`;
 * `npm run validate` checks it. The foot ridden through takes any action
 * but a `fight` against these horsemen, who are not standing to be fought:
 * its men fall where the horses pass unless it fights another enemy hand to
 * hand (then the heads of its files fall, as in any fight). Horse against
 * horse stays `fight`. See docs/ARCHITECTURE.md, "Kỵ binh xông qua".
 */
export type UnitAction =
  | "stand"
  | "advance"
  | "charge"
  | "fight"
  | "skirmish"
  | "retreat"
  | "rout"
  | "pursue"
  | "overrun";

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
  /**
   * Lying in ambush, out of the enemy's sight. A unit is hidden through a
   * phase only when it is concealed at both of the phase's keys (the end of
   * the phase before, or `initial`, and the end of this one): it shows
   * itself as soon as the phase in which it breaks cover begins. While
   * hidden, the scene still draws its men, but not its name or its side's
   * colour on the ground, and its card says it lies in wait; the phase's
   * arrows should not point it out. A concealed unit does not fight or
   * skirmish. Leave it out otherwise.
   */
  concealed?: boolean;
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

/**
 * How far a piece of scenery rests on evidence. The scene draws all three
 * alike; the difference is told to the user in words (the About dialog, the
 * notes of the battle).
 *
 * - `attested`: an ancient source says it was there. Needs `sources`.
 * - `inferred`: no source says so, but it follows from what the sources do
 *   say or from the ground itself (a harvested field in August; a camp sized
 *   by the men in it).
 * - `illustrative`: nothing supports it beyond being usual for the region
 *   and the time. Drawn so that the scene is not bare.
 */
export type SceneryBasis = "attested" | "inferred" | "illustrative";

/** Why a piece of scenery is in the scene. */
export interface SceneryEvidence {
  basis: SceneryBasis;
  /** One or two sentences, self-written: what the source says, or why it is assumed. */
  note: LocalizedText;
  /** Where to read it. Required for `attested`. */
  sources?: SourceRef[];
}

/**
 * What covers a piece of ground:
 *
 * - `stubble`: grain fields after the harvest
 * - `grass`: pasture and fallow
 * - `scrub`: low bushes
 * - `reeds`: reeds, with willows and other low trees, by water
 * - `woodland`: trees standing close
 * - `bare`: earth or rock
 */
export type GroundCover = "stubble" | "grass" | "scrub" | "reeds" | "woodland" | "bare";

export interface BattleRiver {
  name: LocalizedText;
  /** Centre line, upstream to downstream. */
  points: FieldPoint[];
  /** Typical width, metres. */
  width: number;
  /** True when the course in the battle's time is uncertain. */
  approximate?: boolean;
  /**
   * How much water it carried on the day. `low`: shoals and bars of gravel
   * show, and men wade it at the fords (the landmarks of kind `ford`).
   * Absent: full from bank to bank.
   */
  level?: { stage: "low" | "full"; evidence: SceneryEvidence };
  /** What grows along both banks, in a belt `width` metres deep from the water's edge. */
  banks?: { cover: GroundCover; width: number; evidence: SceneryEvidence };
}

export interface BattleLandmark {
  name: LocalizedText;
  kind: "camp" | "town" | "hill" | "ford" | "other";
  point: FieldPoint;
  approximate?: boolean;
}

/** A patch of ground with its own cover, e.g. a wood or the scrub on a hillside. */
export interface SceneryArea {
  /** Kebab-case, unique within the battle. */
  id: string;
  cover: GroundCover;
  /** Three or more points; the outline closes from the last back to the first. */
  outline: FieldPoint[];
  evidence: SceneryEvidence;
}

/**
 * Something built: a camp, a citadel, a village, a farm. The ground it covers is a
 * rectangle given like a Formation, at true size (the scene draws what stands
 * in it, tents or houses, larger than life and fewer, as it does the men).
 */
export interface SceneryStructure {
  /** Kebab-case, unique within the battle. */
  id: string;
  /**
   * - `camp`: an army's camp: ditch, rampart, palisade, gates, tents
   * - `citadel`: a small walled stronghold
   * - `village`: houses without a wall
   * - `farm`: a farmhouse with its barns, in a walled yard
   */
  kind: "camp" | "citadel" | "village" | "farm";
  /** BattleSide.id of the army whose camp it is. Required for a camp. */
  side?: string;
  center: FieldPoint;
  /** Across the front, metres. */
  width: number;
  /** Front to back, metres. */
  depth: number;
  /** Direction the front (the main gate) faces, degrees clockwise from north. */
  facing: number;
  /** Walls broken and roofs gone. */
  ruined?: boolean;
  evidence: SceneryEvidence;
}

/**
 * Standing water above sea level: a lake. The scene draws water at `level`
 * inside `outline` and outside every one of `islands`, over the elevation
 * grid and over the far grid alike (the far grid has no sea there to mark
 * it: a lake lies above sea level). The islands are land: the scene draws the
 * elevation grid on them. Unlike the sea, units may stand in a lake (men
 * driven into the water): the scene has them wade, deeper the farther from
 * the shore.
 */
export interface BattleLake {
  id: string;
  name: LocalizedText;
  /** Height of the water surface, metres above sea level. */
  level: number;
  /**
   * The shore: three or more points, field metres; the outline closes from
   * the last back to the first. It may run beyond the elevation grid.
   */
  outline: FieldPoint[];
  /**
   * Islands in the lake, each the outline of its shore like `outline`
   * (three or more points, closing back to the first). Each lies inside
   * `outline`, and no two overlap. Leave it out when there are none.
   */
  islands?: FieldPoint[][];
  /** Whose shore this is (today's, as a rule) and how the ancient one differed. */
  evidence: SceneryEvidence;
}

export interface BattleWind {
  /** Direction the wind blows FROM, degrees clockwise from north. */
  from: number;
  /** Metres per second. */
  speed: number;
  evidence: SceneryEvidence;
}

/**
 * What stands on the ground and hangs in the air besides the armies. The
 * scene draws a battle without it as bare ground. Every part says how far it
 * rests on evidence; see docs/ARCHITECTURE.md, "Phong cảnh".
 */
export interface BattleScenery {
  /** What covers the ground wherever no area says otherwise. */
  ground: { cover: GroundCover; evidence: SceneryEvidence };
  areas: SceneryArea[];
  structures: SceneryStructure[];
  /** Lone trees on the open ground, so many to the square kilometre. */
  trees?: { perSquareKm: number; evidence: SceneryEvidence };
  wind?: BattleWind;
  /**
   * Dust thrown up by feet and hooves and carried by the wind. `level` runs
   * from 0 (damp ground, none) to 1 (parched ground: thick clouds).
   */
  dust?: { level: number; evidence: SceneryEvidence };
  /**
   * Mist over the ground when the battle begins. `level` runs from 0 (none)
   * to 1 (a man is lost to sight at a javelin's throw). The scene draws it
   * thicker on low ground than on the heights, thins it as the battle goes
   * on, and has it gone by `clearsAt`, an hour of the day counted as
   * Battle.startHour is; without `clearsAt` it stays to the end.
   */
  mist?: { level: number; clearsAt?: number; evidence: SceneryEvidence };
}

/**
 * The country around the battlefield as a coarse elevation grid, in the
 * format of BattleTerrain.file: the hills and the sea on the horizon. It must
 * reach beyond the ground of the battle on every side by two of its own cells
 * or more. Values at or below 0 are sea. The scene lowers it with distance as
 * the curve of the earth does.
 */
export interface BattleFarTerrain {
  file: string;
  width: number;
  height: number;
  /** Ground the grid covers, metres from Battle.origin. */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Ground elevation as a grid in public/data/terrain/<file>: Int16 values,
 * little-endian, in decimetres above sea level; rows run north to south,
 * columns west to east; the first value is the north-west corner. Ground at
 * or below 0 is drawn as sea, and no unit may stand on it.
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
  /** Without it the ground runs level from the edges of the grid to the horizon. */
  far?: BattleFarTerrain;
  rivers: BattleRiver[];
  /** Lakes; a battle without any leaves it out. */
  lakes?: BattleLake[];
  landmarks: BattleLandmark[];
  scenery?: BattleScenery;
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
