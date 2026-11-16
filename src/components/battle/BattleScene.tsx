"use client";

import type { BattleSceneProps } from "@/lib/battle";

/**
 * Placeholder until T-015 (lane 3) builds the 3D scene. The lab page
 * (/battle-lab) loads this component on the client only.
 */
export function BattleScene({ battle }: BattleSceneProps) {
  return (
    <div className="grid h-full place-items-center bg-surface text-sm text-muted">
      3D scene for {battle.id}: not built yet (T-015).
    </div>
  );
}
