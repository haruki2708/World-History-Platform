/**
 * A small battle for looking at hand-to-hand fighting in the lab (?duel=1):
 * a few pairs of blocks that advance on each other, meet, fight where they
 * stand, and fight on while one side is pushed back. It keeps the sides and
 * the ground of the battle it is made from, so it takes the same path as
 * real data. Not history: the units are picked to show every kind of model.
 */

import type { Battle, BattlePhase, BattleUnit, UnitAction, UnitState, UnitType } from "@/lib/battle";

interface Block {
  /** Unit type of each side, by preference; the first one the data has is used. */
  north: string[];
  south: string[];
  /** Width of the two fronts, metres. */
  northFront: number;
  southFront: number;
  depth: number;
  men: number;
  /** One side stays back and throws: the fronts never meet. */
  apart?: number;
}

const BLOCKS: Block[] = [
  // The first pair is the one the clips block and hit were tried on first (a thrust against a slash).
  { north: ["roman-principes", "socii-infantry"], south: ["gallic-infantry"], northFront: 130, southFront: 130, depth: 36, men: 3200 },
  { north: ["roman-hastati"], south: ["iberian-infantry"], northFront: 150, southFront: 105, depth: 36, men: 3000 },
  { north: ["roman-triarii"], south: ["libyan-infantry"], northFront: 100, southFront: 130, depth: 30, men: 2400 },
  { north: ["roman-cavalry", "allied-cavalry"], south: ["iberian-cavalry"], northFront: 150, southFront: 150, depth: 40, men: 1400 },
  { north: ["roman-velites"], south: ["balearic-slingers"], northFront: 140, southFront: 140, depth: 16, men: 1600, apart: 45 },
  // The Numidians hand to hand, as no battle has them yet: to see their block and hit.
  { north: ["allied-cavalry", "roman-cavalry"], south: ["numidian-cavalry"], northFront: 150, southFront: 150, depth: 40, men: 1400 },
  // The Gallic horse (T-050): a long sword that cuts, where the other riders thrust.
  { north: ["roman-cavalry", "allied-cavalry"], south: ["gallic-cavalry"], northFront: 150, southFront: 150, depth: 40, men: 1400 },
];

const GAP = 40;
/** Where the lines meet, metres from the origin of the battle. */
const LINE_Y = 0;
const START_APART = 260;

const PHASES: { id: string; en: string; vi: string; seconds: number; hours: number }[] = [
  { id: "duel-advance", en: "The lines close", vi: "Hai hàng tiến lại", seconds: 12, hours: 0.25 },
  { id: "duel-fight", en: "Hand to hand", vi: "Giáp lá cà", seconds: 25, hours: 0.5 },
  { id: "duel-push", en: "The southern line gives ground", vi: "Hàng phía nam bị đẩy lùi", seconds: 25, hours: 0.5 },
  { id: "duel-break", en: "The last ranks", vi: "Những hàng cuối", seconds: 20, hours: 0.5 },
];

export function makeDuelBattle(battle: Battle, unitTypes: UnitType[]): Battle {
  const [north, south] = battle.sides;
  if (!north || !south) return battle;
  const known = new Set(unitTypes.map((type) => type.id));
  const pick = (ids: string[]) => ids.find((id) => known.has(id)) ?? unitTypes[0]?.id ?? ids[0];

  const width = BLOCKS.reduce((sum, b) => sum + Math.max(b.northFront, b.southFront) + GAP, -GAP);
  const units: BattleUnit[] = [];
  const places: { x: number; block: Block }[] = [];
  let left = -width / 2;
  BLOCKS.forEach((block, b) => {
    const span = Math.max(block.northFront, block.southFront);
    places.push({ x: left + span / 2, block });
    left += span + GAP;
    const typeNorth = pick(block.north);
    const typeSouth = pick(block.south);
    units.push(
      { id: `duel-n${b}`, side: north.id, type: typeNorth, name: { en: `North ${b + 1} (${typeNorth})`, vi: `Bắc ${b + 1} (${typeNorth})` }, men: block.men },
      { id: `duel-s${b}`, side: south.id, type: typeSouth, name: { en: `South ${b + 1} (${typeSouth})`, vi: `Nam ${b + 1} (${typeSouth})` }, men: block.men },
    );
  });

  /**
   * The two blocks of a pair: `apart` between their fronts, the line they
   * meet on pushed `pushed` metres south and bent by `bulge`, with a share of
   * their men left.
   */
  const pair = (
    b: number,
    apart: number,
    pushed: number,
    bulge: number,
    action: UnitAction,
    northLeft: number,
    southLeft: number,
  ): UnitState[] => {
    const { x, block } = places[b];
    const distance = block.apart === undefined ? apart : Math.max(apart, block.apart);
    // A pair that keeps its distance throws; the others fight hand to hand.
    const doing: UnitAction = block.apart !== undefined && action === "fight" ? "skirmish" : action;
    const y = LINE_Y - pushed;
    return [
      {
        unit: `duel-n${b}`,
        formation: { center: { x, y: y + distance / 2 + block.depth / 2 }, frontage: block.northFront, depth: block.depth, facing: 180, bulge },
        action: doing,
        men: Math.round(block.men * northLeft),
      },
      {
        unit: `duel-s${b}`,
        formation: { center: { x, y: y - distance / 2 - block.depth / 2 }, frontage: block.southFront, depth: block.depth, facing: 0, bulge: -bulge },
        action: doing,
        men: Math.round(block.men * southLeft),
      },
    ];
  };
  const all = (
    apart: number,
    pushed: number,
    bulge: number,
    action: UnitAction,
    northLeft: number,
    southLeft: number,
  ): UnitState[] => BLOCKS.flatMap((_, b) => pair(b, apart, pushed, b === 0 ? bulge : 0, action, northLeft, southLeft));

  const states: UnitState[][] = [
    all(0, 0, 0, "advance", 1, 1),
    all(0, 0, 0, "fight", 0.85, 0.8),
    all(0, 70, 9, "fight", 0.7, 0.5),
    all(0, 95, 9, "fight", 0.6, 0.15),
  ];
  let hour = battle.startHour;
  const phases: BattlePhase[] = PHASES.map((phase, p) => {
    hour += phase.hours;
    return {
      id: phase.id,
      title: { en: phase.en, vi: phase.vi },
      narration: { en: phase.en, vi: phase.vi },
      endHour: hour,
      playSeconds: phase.seconds,
      units: states[p],
    };
  });

  return {
    ...battle,
    units,
    initial: all(START_APART, 0, 0, "stand", 1, 1),
    phases,
  };
}
