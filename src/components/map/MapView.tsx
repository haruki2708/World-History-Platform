"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect } from "react";
import { getEvent } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { EventMarkers } from "./EventMarkers";
import { TerritoryLabels } from "./labels/TerritoryLabels";
import { MapControls } from "./MapControls";
import { MapLegend } from "./MapLegend";
import { useMapInstance } from "./useMapInstance";
import { useTerritories } from "./useTerritories";

/** Zoom level the map moves in to when flying to a selected event. */
const EVENT_ZOOM = 5.5;

/**
 * The historical map: land and sea without modern features, the territories
 * of each polity for the year in the store, and a marker per located event.
 * It talks to the rest of the app only through `useAppStore`.
 */
export function MapView() {
  const { t } = useT();
  const { containerRef, handle, failed } = useMapInstance();
  const map = handle?.map ?? null;
  const territory = useTerritories(map);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  // Changes on every selection, also when the same event is selected again
  // (a tutor map link to the event already selected flies back to it).
  const focusRequest = useAppStore((state) => state.focusRequest);

  // Fly to the selected event, wherever the selection came from.
  useEffect(() => {
    if (!map || !selectedEventId) return;
    const location = getEvent(selectedEventId)?.location;
    if (!location) return;
    map.flyTo({
      center: [location.lng, location.lat],
      zoom: Math.max(map.getZoom(), EVENT_ZOOM),
    });
  }, [map, selectedEventId, focusRequest]);

  return (
    <section
      aria-label={t("map.label")}
      className="relative h-full w-full overflow-hidden bg-surface"
    >
      {/* Sized with h/w, not inset: MapLibre makes its container `relative`. */}
      <div ref={containerRef} className="h-full w-full" />

      {handle ? (
        <>
          <TerritoryLabels
            map={handle.map}
            MarkerClass={handle.lib.Marker}
            shown={territory.shown}
          />
          <EventMarkers map={handle.map} MarkerClass={handle.lib.Marker} />
          <MapControls map={handle.map} />
          <MapLegend territory={territory} />
        </>
      ) : (
        !failed && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            {t("map.loading")}
          </p>
        )
      )}

      {failed && (
        <p
          role="alert"
          className="absolute inset-x-0 top-1/2 z-10 mx-auto w-fit max-w-[80%] -translate-y-1/2 rounded-md border border-line bg-background px-3 py-2 text-center text-sm"
        >
          {t("map.error")}
        </p>
      )}
    </section>
  );
}
