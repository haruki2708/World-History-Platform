"use client";

import { useT } from "@/lib/i18n/useT";
import { formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

/**
 * Placeholder. Lane 2 replaces this with the MapLibre map (task T-002).
 * Contract: read `year` and `selectedEventId` from the store, write the
 * viewport back with `setViewport` whenever the map moves.
 */
export function MapView() {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const viewport = useAppStore((state) => state.viewport);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
      <p className="text-5xl font-semibold tabular-nums">
        {formatYear(year, locale)}
      </p>
      <p className="max-w-sm text-sm text-muted">{t("map.placeholder")}</p>
      <p className="text-xs text-muted tabular-nums">
        {t("map.center")}: {viewport.center.lat.toFixed(2)}°,{" "}
        {viewport.center.lng.toFixed(2)}° · {t("map.zoom")}:{" "}
        {viewport.zoom.toFixed(1)}
      </p>
    </div>
  );
}
