/**
 * A synthetic crowd for measuring performance (debug.stressFigures): the
 * sides, phases and ground of the battle stay, its units are replaced by
 * blocks in a grid that add up to exactly the number of figures asked for.
 * The result is an ordinary Battle, so it takes the same path as real data.
 */

import {
  type Battle,
  type BattleUnit,
  MEN_PER_FIGURE,
  type UnitAction,
  type UnitState,
  type UnitType,
} from "@/lib/battle";

const BLOCK_FIGURES = 250;
const FRONTAGE = 150;
const DEPTH = 56;
const GAP = 30;
/**
 * Half the distance between the two front lines, at the start and in
 * contact: the fronts of the first row of blocks meet, so their men fight
 * hand to hand (melee.ts).
 */
const START_HALF_GAP = 250;
const CONTACT_HALF_GAP = 0;

const FIRST_PHASE_ACTIONS: UnitAction[] = ["advance", "charge", "fight"];

export function makeStressBattle(battle: Battle, unitTypes: UnitType[], figures: number): Battle {
  const sides = battle.sides.length > 0 ? battle.sides : [];
  if (sides.length === 0 || figures <= 0) return battle;
  const fallbackType = unitTypes[0]?.id ?? battle.units[0]?.type ?? "unknown";
  const typesOf = sides.map((side) => {
    const used = [...new Set(battle.units.filter((u) => u.side === side.id).map((u) => u.type))];
    return used.length > 0 ? used : [fallbackType];
  });

  const blockCount = Math.ceil(figures / BLOCK_FIGURES);
  const perSide = sides.map((_, s) => Math.ceil((blockCount - s) / sides.length));
  const units: BattleUnit[] = [];
  const placement: { x: number; row: number; direction: number; facing: number; action: UnitAction }[] = [];
  const indexInSide = sides.map(() => 0);
  let left = figures;

  for (let b = 0; b < blockCount; b++) {
    const s = b % sides.length;
    const size = Math.min(BLOCK_FIGURES, left);
    left -= size;
    const k = indexInSide[s]++;
    const columns = Math.max(Math.ceil(Math.sqrt(perSide[s] * 2.2)), 1);
    const row = Math.floor(k / columns);
    const inRow = Math.min(columns, perSide[s] - row * columns);
    const column = k % columns;
    // Even sides stand to the north and face south, odd sides the reverse.
    const north = s % 2 === 0;
    units.push({
      id: `stress-${b}`,
      side: sides[s].id,
      type: typesOf[s][k % typesOf[s].length],
      name: { en: `Stress block ${b + 1}`, vi: `Khối thử ${b + 1}` },
      men: size * MEN_PER_FIGURE,
    });
    placement.push({
      x: (column - (inRow - 1) / 2) * (FRONTAGE + GAP),
      row,
      direction: north ? 1 : -1,
      facing: north ? 180 : 0,
      action: FIRST_PHASE_ACTIONS[b % FIRST_PHASE_ACTIONS.length],
    });
  }

  const stateOf = (b: number, halfGap: number, action: UnitAction, men: number): UnitState => {
    const place = placement[b];
    return {
      unit: units[b].id,
      formation: {
        center: {
          x: place.x,
          y: place.direction * (halfGap + DEPTH / 2 + place.row * (DEPTH + GAP)),
        },
        frontage: FRONTAGE,
        depth: DEPTH,
        facing: place.facing,
      },
      action,
      men: Math.round(men),
    };
  };

  return {
    ...battle,
    units,
    initial: units.map((unit, b) => stateOf(b, START_HALF_GAP, "stand", unit.men)),
    phases: battle.phases.map((phase, p) => ({
      ...phase,
      arrows: [],
      units: units.map((unit, b) =>
        stateOf(
          b,
          CONTACT_HALF_GAP,
          p === 0 ? placement[b].action : "fight",
          unit.men * Math.pow(0.92, p + 1),
        ),
      ),
    })),
  };
}
