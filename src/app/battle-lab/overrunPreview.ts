/**
 * A battle as it would look with its horsemen riding through foot, for the
 * lab (?overrun=1), before the data itself says so: wherever a mounted unit
 * fights hand to hand with enemy foot before its front, at both ends of a
 * phase, it rides through instead (UnitAction "overrun"), and foot left with
 * no enemy to fight hand to hand stands. Not data: a way to look at the
 * scene on a real battle.
 */

import type { Battle, UnitType } from "@/lib/battle";
import { frontOnFoot } from "@/components/battle/engine/overrun";
import { formationPoint, opposition, unitKeys } from "@/components/battle/engine/timeline";

/** As `npm run validate` asks of a fight and of a ride: this share of the front, at least. */
const MIN_CONTACT = 0.15;
const FRONT_SAMPLES = 21;

export function withOverrun(battle: Battle, unitTypes: UnitType[]): Battle {
  const mounted = new Set(unitTypes.filter((type) => type.mounted).map((type) => type.id));
  const copy: Battle = JSON.parse(JSON.stringify(battle));
  const keys = new Map(copy.units.map((unit) => [unit.id, unitKeys(copy, unit)]));

  // The horse that has enemy foot before its front rides through it.
  copy.phases.forEach((phase, p) => {
    for (const state of phase.units) {
      const unit = copy.units.find((u) => u.id === state.unit);
      if (!unit || !mounted.has(unit.type) || state.action !== "fight") continue;
      const own = keys.get(unit.id);
      if (!own) continue;
      const meets = [p, p + 1].every((moment) => {
        const foot = copy.units
          .filter((other) => other.side !== unit.side && !mounted.has(other.type))
          .map((other) => keys.get(other.id)?.[moment])
          .filter((key) => key !== undefined && key.men > 0);
        return frontOnFoot(own[moment], foot as NonNullable<(typeof foot)[number]>[], FRONT_SAMPLES) >= MIN_CONTACT;
      });
      if (meets) state.action = "overrun";
    }
  });

  // The foot whose only enemy hand to hand was that horse stands: foot that
  // had an enemy before its front in the battle as it was, and has none now.
  const point = { x: 0, y: 0 };
  for (const unit of copy.units) {
    if (mounted.has(unit.type)) continue;
    const own = unitKeys(copy, unit);
    const before = opposition(battle, unit);
    const after = opposition(copy, unit);
    copy.phases.forEach((phase, p) => {
      const state = phase.units.find((s) => s.unit === unit.id);
      if (!state || state.action !== "fight") return;
      const fights = (opposed: typeof before) =>
        [0, 1].every((s) => {
          const key = own[p + s];
          let touching = 0;
          for (let k = 0; k < FRONT_SAMPLES; k++) {
            formationPoint(key, (k + 0.5) / FRONT_SAMPLES - 0.5, 0, point);
            if (opposed(p, s, point.x, point.y, key.facing)) touching++;
          }
          return touching >= MIN_CONTACT * FRONT_SAMPLES;
        });
      if (fights(before) && !fights(after)) state.action = "stand";
    });
  }
  return copy;
}
