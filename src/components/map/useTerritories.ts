"use client";

import { useEffect, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { useAppStore } from "@/store/useAppStore";
import {
  getBorderSource,
  loadTerritories,
  type BorderSource,
  type Territories,
} from "./borders";
import { EMPTY_COLLECTION, TERRITORY_SOURCE } from "./mapStyle";

export interface TerritoryState {
  /** `none`: no snapshot covers the current year. */
  status: "none" | "loading" | "ready" | "error";
  /** The snapshot currently drawn on the map, if any. */
  source: BorderSource | null;
  territories: Territories | null;
}

interface LoadResult {
  source: BorderSource;
  /** Null when loading failed. */
  territories: Territories | null;
}

/**
 * Keeps the territory layer in step with the current year and reports what is
 * being shown, for the legend.
 */
export function useTerritories(map: MapLibreMap | null): TerritoryState {
  const year = useAppStore((state) => state.year);
  const source = getBorderSource(year);
  const [result, setResult] = useState<LoadResult | null>(null);

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

  // While the next snapshot loads, the previous one stays on the map so the
  // territories do not blink when the timeline crosses a snapshot year.
  const shown = source ? result : null;
  const territories = shown?.territories ?? null;

  useEffect(() => {
    if (!map) return;
    const mapSource = map.getSource<GeoJSONSource>(TERRITORY_SOURCE);
    void mapSource?.setData(territories?.collection ?? EMPTY_COLLECTION);
  }, [map, territories]);

  let status: TerritoryState["status"];
  if (!source) status = "none";
  else if (result?.source !== source) status = "loading";
  else status = result.territories ? "ready" : "error";

  return {
    status,
    source: territories ? (shown?.source ?? null) : null,
    territories,
  };
}
