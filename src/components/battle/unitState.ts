/**
 * Men and action of a unit at a battle time, from the data alone: for the
 * card of a unit and the list of units, without the 3D scene. Follows what
 * the scene draws (engine/timeline.ts): one keyframe per phase end, a unit
 * missing from a phase holds its last state, men never go up, and men are
 * interpolated between keyframes.
 */

import type { Battle, UnitAction } from "@/lib/battle";

interface Key {
  men: number;
  action: UnitAction;
}

const keysByBattle = new WeakMap<Battle, Map<string, Key[]>>();

function keysOf(battle: Battle, unitId: string): Key[] {
  let byUnit = keysByBattle.get(battle);
  if (!byUnit) {
    byUnit = new Map();
    keysByBattle.set(battle, byUnit);
  }
  let keys = byUnit.get(unitId);
  if (keys) return keys;
  const unit = battle.units.find((u) => u.id === unitId);
  const first = battle.initial.find((s) => s.unit === unitId);
  keys = [
    first
      ? { men: Math.max(first.men, 0), action: first.action }
      : { men: unit?.men ?? 0, action: "stand" },
  ];
  for (const phase of battle.phases) {
    const previous = keys[keys.length - 1];
    const state = phase.units.find((s) => s.unit === unitId);
    keys.push(
      state
        ? { men: Math.min(Math.max(state.men, 0), previous.men), action: state.action }
        : { ...previous },
    );
  }
  byUnit.set(unitId, keys);
  return keys;
}

export interface UnitMoment {
  /** Men still in the fight, interpolated between phase ends. */
  men: number;
  /** What the unit does in the phase under way. */
  action: UnitAction;
}

export function unitStateAt(battle: Battle, unitId: string, time: number): UnitMoment {
  const keys = keysOf(battle, unitId);
  const last = keys.length - 1;
  const t = Math.min(Math.max(time, 0), last);
  const k = Math.min(Math.floor(t), Math.max(last - 1, 0));
  const s = t - k;
  const to = keys[Math.min(k + 1, last)];
  const men = keys[k].men + (to.men - keys[k].men) * s;
  const action = t <= 0 || last === 0 ? keys[0].action : keys[Math.min(Math.ceil(t), last)].action;
  return { men, action };
}

/**
 * Men as shown: to the nearest ten. The numbers between phase ends are an
 * even share of the losses, not a count.
 */
export function roundMen(men: number): number {
  return Math.round(men / 10) * 10;
}
