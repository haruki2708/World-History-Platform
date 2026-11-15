"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useAppStore } from "@/store/useAppStore";
import {
  getBorderSource,
  loadTerritories,
  type BorderSource,
  type Territories,
} from "./borders";
import { TerritoryFade, type FadeTarget } from "./territoryFade";

export interface TerritoryState {
  /** `none`: no snapshot covers the current year. */
  status: "none" | "loading" | "ready" | "error";
  /** The snapshot of the current year, once loaded. */
  source: BorderSource | null;
  territories: Territories | null;
  /**
   * The snapshot appearing or shown on the map. It trails the current year
   * by one fade while the borders change.
   */
  shown: FadeTarget | null;
}

interface LoadResult {
  source: BorderSource;
  /** Null when loading failed. */
  territories: Territories | null;
}

/** Fade target when no snapshot covers the year. */
const NOTHING: FadeTarget = { key: "none", territories: null };

/**
 * Keeps the territory layers in step with the current year, fading from one
 * snapshot to the next, and reports what is being shown, for the legend and
 * the labels.
 */
export function useTerritories(map: MapLibreMap | null): TerritoryState {
  const year = useAppStore((state) => state.year);
  const source = getBorderSource(year);
  const [result, setResult] = useState<LoadResult | null>(null);
  const fade = useRef<TerritoryFade | null>(null);
  const [shown, setShown] = useState<FadeTarget | null>(null);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    loadTerritories(source).then(
      (territories) => {
        if (!cancelled) setResult({ source, territories });
      },
      (error: unknown) => {
        console.error(error);
        if (!cancelled) setResult({ source, territories: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    if (!map) return;
    const created = new TerritoryFade(map, setShown);
    fade.current = created;
    return () => {
      created.stop();
      fade.current = null;
      setShown(null);
    };
  }, [map]);

  // While the next snapshot loads, the previous one stays on the map so the
  // territories do not blink when the timeline crosses a snapshot year.
  const current = source ? result : null;
  const territories = current?.territories ?? null;
  const loaded = !source || result?.source === source;

  // Runs after the effect above, so a new map gets its fade first.
  useEffect(() => {
    if (!loaded) return;
    fade.current?.show(
      source && territories ? { key: source.key, territories } : NOTHING,
    );
  }, [map, loaded, source, territories]);

  let status: TerritoryState["status"];
  if (!source) status = "none";
  else if (!loaded) status = "loading";
  else status = territories ? "ready" : "error";

  return {
    status,
    source: territories ? (current?.source ?? null) : null,
    territories,
    shown,
  };
}
