"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { INITIAL_VIEWPORT, useAppStore } from "@/store/useAppStore";
import {
  BASEMAP_SOURCE,
  MAX_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  applyMapTheme,
  buildMapStyle,
} from "./mapStyle";
import { readMapTheme, watchColorScheme } from "./theme";

type MapLibre = typeof import("maplibre-gl");

export interface MapHandle {
  map: MapLibreMap;
  lib: MapLibre;
}

interface MapInstance {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Null until the map has loaded its style. */
  handle: MapHandle | null;
  /** True when the map or its base data could not be loaded. */
  failed: boolean;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Creates the MapLibre map inside `containerRef` and writes the viewport to
 * the store whenever the map comes to rest. MapLibre is browser-only, so it
 * is imported and set up in an effect and removed on unmount.
 */
export function useMapInstance(): MapInstance {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handle, setHandle] = useState<MapHandle | null>(null);
  const [failed, setFailed] = useState(false);
  const setViewport = useAppStore((state) => state.setViewport);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: MapLibreMap | undefined;
    let stopWatchingScheme: (() => void) | undefined;

    const setUp = async () => {
      const lib = await import("maplibre-gl");
      if (cancelled) return;

      // MapLibre looks for its worker next to its own module file, which does
      // not survive bundling; point it at the copy the bundler emits.
      lib.setWorkerUrl(
        new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
      );

      const created = new lib.Map({
        container,
        style: buildMapStyle(readMapTheme()),
        center: [INITIAL_VIEWPORT.center.lng, INITIAL_VIEWPORT.center.lat],
        zoom: INITIAL_VIEWPORT.zoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: MAX_BOUNDS,
        // North stays up: no rotation or tilt.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        rollEnabled: false,
        attributionControl: false,
        maplibreLogo: false,
      });
      map = created;
      created.touchZoomRotate.disableRotation();
      created.keyboard.disableRotation();

      const reportViewport = () => {
        const center = created.getCenter();
        const bounds = created.getBounds();
        setViewport({
          center: { lng: round(center.lng, 4), lat: round(center.lat, 4) },
          zoom: round(created.getZoom(), 2),
          bounds: [
            round(bounds.getWest(), 4),
            round(bounds.getSouth(), 4),
            round(bounds.getEast(), 4),
            round(bounds.getNorth(), 4),
          ],
        });
      };

      created.on("moveend", reportViewport);
      created.on("error", (event) => {
        console.error(event.error);
        if ("sourceId" in event && event.sourceId === BASEMAP_SOURCE) {
          setFailed(true);
        }
      });
      created.on("load", () => {
        if (cancelled) return;
        reportViewport();
        setHandle({ map: created, lib });
      });

      stopWatchingScheme = watchColorScheme(() =>
        applyMapTheme(created, readMapTheme()),
      );
    };

    setUp().catch((error: unknown) => {
      console.error(error);
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      stopWatchingScheme?.();
      map?.remove();
      setHandle(null);
    };
  }, [setViewport]);

  return { containerRef, handle, failed };
}
