"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useT } from "@/lib/i18n/useT";
import { INITIAL_VIEWPORT } from "@/store/useAppStore";

const BUTTON_CLASS =
  "flex size-8 cursor-pointer items-center justify-center text-base leading-none text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent";

/** Zoom and reset buttons, drawn with the app's own tokens and strings. */
export function MapControls({ map }: { map: MapLibreMap }) {
  const { t } = useT();

  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line bg-background shadow-sm">
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-label={t("map.zoomIn")}
        title={t("map.zoomIn")}
        onClick={() => map.zoomIn()}
      >
        +
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-label={t("map.zoomOut")}
        title={t("map.zoomOut")}
        onClick={() => map.zoomOut()}
      >
        −
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-label={t("map.resetView")}
        title={t("map.resetView")}
        onClick={() =>
          map.flyTo({
            center: [INITIAL_VIEWPORT.center.lng, INITIAL_VIEWPORT.center.lat],
            zoom: INITIAL_VIEWPORT.zoom,
          })
        }
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8" cy="8" r="4.25" />
          <path d="M8 1v3M8 12v3M1 8h3M12 8h3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
