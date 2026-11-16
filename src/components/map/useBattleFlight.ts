"use client";

import { useEffect, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useAppStore } from "@/store/useAppStore";
import { BattleFlight } from "./battleFlight";

/**
 * Answers store.battleRequest: flies the map to the battlefield, then opens
 * the battle (see BattleFlight). Without a map (still loading, or it failed)
 * the battle opens at once. When the battle closes, the map flies back.
 *
 * Returns true while the map is on its way to a battlefield.
 */
export function useBattleFlight(map: MapLibreMap | null): boolean {
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const flight = map
      ? new BattleFlight(map, (id) => useAppStore.getState().openBattle(id), setFlying)
      : null;
    const request = (id: string) =>
      flight ? flight.request(id) : useAppStore.getState().openBattle(id);

    // A request this effect has not seen yet: one left by a flight that was
    // disposed, when the map was recreated or the component remounted.
    const pending = useAppStore.getState().battleRequest;
    if (pending) request(pending);

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      // The same id again (a second click while flying) changes nothing.
      if (state.battleRequest && state.battleRequest !== previous.battleRequest) {
        request(state.battleRequest);
      }
      if (previous.battleId !== null && state.battleId === null) flight?.closed();
    });

    return () => {
      unsubscribe();
      flight?.dispose();
    };
  }, [map]);

  return flying;
}
