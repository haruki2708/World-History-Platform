"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { getPolity } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { Locale } from "@/lib/types";
import type { Territories } from "../borders";
import { FADE_MS, type FadeTarget } from "../territoryFade";
import { loadLandMask, type LandMask } from "./landMask";
import {
  placeLabels,
  splitName,
  type LabelLayout,
  type LabelSizes,
} from "./placement";
import { computeLabelSpots, type LabelSpot } from "./spots";

/*
 * Polity names on the map, drawn as HTML so that they use Inter (with every
 * Vietnamese diacritic) and the colour tokens. They sit under the event
 * markers and let every pointer event through to the map.
 */

/** Text style of a label; the measuring copies use it too. */
const LABEL_TEXT =
  "block w-max whitespace-nowrap text-center text-[11px] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-foreground [text-shadow:0_0_2px_var(--background),0_0_2px_var(--background),0_0_4px_var(--background)]";

/** Spots of the last few snapshots, so scrubbing back and forth is free. */
const SPOT_CACHE_SIZE = 4;
const spotCache = new Map<string, LabelSpot[]>();

function spotsFor(key: string, territories: Territories, land: LandMask): LabelSpot[] {
  let spots = spotCache.get(key);
  if (spots) {
    spotCache.delete(key);
  } else {
    spots = computeLabelSpots(territories, land);
    if (spotCache.size >= SPOT_CACHE_SIZE) {
      spotCache.delete(spotCache.keys().next().value!);
    }
  }
  spotCache.set(key, spots);
  return spots;
}

function polityName(polityId: string, locale: Locale): string {
  return getPolity(polityId)?.name[locale] ?? polityId;
}

/** The labels of one snapshot. A set fades out once a newer one appears. */
interface LabelSet {
  id: number;
  spots: LabelSpot[];
  leaving: boolean;
}

interface TerritoryLabelsProps {
  map: MapLibreMap;
  MarkerClass: typeof Marker;
  /** The snapshot appearing or shown on the map. */
  shown: FadeTarget | null;
}

export function TerritoryLabels({ map, MarkerClass, shown }: TerritoryLabelsProps) {
  const { locale } = useT();
  const [land, setLand] = useState<LandMask | null>(null);
  const [sets, setSets] = useState<LabelSet[]>([]);
  const nextSetId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadLandMask().then(
      (mask) => {
        if (!cancelled) setLand(mask);
      },
      (error: unknown) => console.error(error),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // A new snapshot: its labels come in while the previous ones fade out.
  useEffect(() => {
    if (!land || !shown) return;
    const spots = shown.territories ? spotsFor(shown.key, shown.territories, land) : [];
    const id = nextSetId.current++;
    const frame = requestAnimationFrame(() => {
      setSets((previous) => [
        ...previous.map((set) => ({ ...set, leaving: true })),
        { id, spots, leaving: false },
      ]);
    });
    // Deliberately not cleared when the next snapshot comes: one fade later,
    // the sets older than this one have faded out and are dropped.
    setTimeout(() => {
      setSets((previous) => previous.filter((set) => set.id >= id));
    }, FADE_MS + 100);
    return () => cancelAnimationFrame(frame);
  }, [land, shown]);

  // Each polity's name, measured on one line and on two.
  const polityIds = useMemo(
    () => [...new Set(sets.flatMap((set) => set.spots.map((spot) => spot.polityId)))],
    [sets],
  );
  const measureRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<{ locale: Locale; byPolity: Map<string, LabelSizes> }>();
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const container = measureRef.current;
    if (!container) return;
    const byPolity = new Map<string, LabelSizes>();
    for (const element of container.querySelectorAll<HTMLElement>("[data-polity]")) {
      const polityId = element.dataset.polity!;
      const size = { width: element.offsetWidth, height: element.offsetHeight };
      const entry = byPolity.get(polityId) ?? { one: size };
      if (element.dataset.layout === "two") entry.two = size;
      else entry.one = size;
      byPolity.set(polityId, entry);
    }
    // Re-measured only when the names, the language or the font change.
    setSizes({ locale, byPolity });
  }, [polityIds, locale, fontsReady]);

  // Which labels show, and how, at the current zoom.
  const current = sets.findLast((set) => !set.leaving);
  const [layouts, setLayouts] = useState<{ setId: number; byPolity: Map<string, LabelLayout> }>();

  useEffect(() => {
    if (!current || sizes?.locale !== locale) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const byPolity = placeLabels(
        current.spots,
        (polityId) => sizes.byPolity.get(polityId),
        (lng, lat) => map.project([lng, lat]),
        map.getZoom(),
      );
      setLayouts((previous) =>
        previous?.setId === current.id && sameLayouts(previous.byPolity, byPolity)
          ? previous
          : { setId: current.id, byPolity },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    map.on("zoom", schedule);
    return () => {
      map.off("zoom", schedule);
      cancelAnimationFrame(frame);
    };
  }, [map, current, sizes, locale]);

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 -z-10"
      >
        {polityIds.map((polityId) => {
          const name = polityName(polityId, locale);
          const lines = splitName(name);
          return (
            <Fragment key={polityId}>
              <span data-polity={polityId} data-layout="one" className={LABEL_TEXT}>
                {name}
              </span>
              {lines && (
                <span data-polity={polityId} data-layout="two" className={LABEL_TEXT}>
                  {lines[0]}
                  <br />
                  {lines[1]}
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      {sets.map((set) =>
        set.spots.map((spot) => (
          <PolityLabel
            key={`${set.id}:${spot.polityId}`}
            map={map}
            MarkerClass={MarkerClass}
            spot={spot}
            name={polityName(spot.polityId, locale)}
            layout={
              !set.leaving && layouts?.setId === set.id
                ? layouts.byPolity.get(spot.polityId)
                : undefined
            }
          />
        )),
      )}
    </>
  );
}

function sameLayouts(a: Map<string, LabelLayout>, b: Map<string, LabelLayout>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) if (b.get(key) !== value) return false;
  return true;
}

interface PolityLabelProps {
  map: MapLibreMap;
  MarkerClass: typeof Marker;
  spot: LabelSpot;
  name: string;
  /** Undefined: hidden (it fades out, keeping its last layout). */
  layout: LabelLayout | undefined;
}

function PolityLabel({ map, MarkerClass, spot, name, layout }: PolityLabelProps) {
  // MapLibre positions this element; React renders the text into it.
  const [element] = useState(() => {
    const div = document.createElement("div");
    div.setAttribute("aria-hidden", "true");
    div.style.pointerEvents = "none";
    return div;
  });
  const [textLayout, setTextLayout] = useState<LabelLayout>(layout ?? "one");
  if (layout && layout !== textLayout) setTextLayout(layout);

  const { lng, lat } = spot;
  useEffect(() => {
    const marker = new MarkerClass({ element }).setLngLat([lng, lat]).addTo(map);
    // Under the event markers (z-index 1 to 3).
    marker.getElement().style.zIndex = "0";
    return () => {
      marker.remove();
    };
  }, [MarkerClass, map, element, lng, lat]);

  const lines = textLayout === "two" ? splitName(name) : null;
  return createPortal(
    <span
      className={`${LABEL_TEXT} transition-opacity duration-300 motion-reduce:transition-none ${
        layout ? "opacity-90" : "opacity-0"
      }`}
    >
      {lines ? (
        <>
          {lines[0]}
          <br />
          {lines[1]}
        </>
      ) : (
        name
      )}
    </span>,
    element,
  );
}
