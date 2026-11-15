"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { getEventsAround, isEventActive } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { EventLocation, HistoricalEvent } from "@/lib/types";
import { formatYearRange } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";
import { eventDotClass } from "./eventDot";

type LocatedEvent = HistoricalEvent & { location: EventLocation };
type PixelOffset = [number, number];

interface PlacedEvent {
  event: LocatedEvent;
  /** Screen offset from the true position, to separate co-located events. */
  offset: PixelOffset;
}

/**
 * Events that share a site (many happen in Rome) would hide one another, so
 * each group is fanned out on a small circle around the real position.
 */
function placeEvents(events: HistoricalEvent[]): PlacedEvent[] {
  const groups = new Map<string, LocatedEvent[]>();
  for (const event of events) {
    if (!event.location) continue;
    const { lng, lat } = event.location;
    const key = `${lng.toFixed(2)},${lat.toFixed(2)}`;
    const group = groups.get(key);
    if (group) group.push(event as LocatedEvent);
    else groups.set(key, [event as LocatedEvent]);
  }

  const placed: PlacedEvent[] = [];
  for (const group of groups.values()) {
    const radius = group.length === 1 ? 0 : Math.max(11, group.length * 4);
    group.forEach((event, index) => {
      const angle = Math.PI + (2 * Math.PI * index) / group.length;
      placed.push({
        event,
        offset: [
          Math.round(radius * Math.cos(angle)),
          Math.round(radius * Math.sin(angle)),
        ],
      });
    });
  }
  return placed;
}

interface EventMarkersProps {
  map: MapLibreMap;
  MarkerClass: typeof Marker;
}

/** One clickable marker for each located event near the current year. */
export function EventMarkers({ map, MarkerClass }: EventMarkersProps) {
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const placed = useMemo(() => placeEvents(getEventsAround(year)), [year]);

  return placed.map(({ event, offset }) => (
    <EventMarker
      key={event.id}
      map={map}
      MarkerClass={MarkerClass}
      event={event}
      offset={offset}
      active={isEventActive(event, year)}
      selected={event.id === selectedEventId}
    />
  ));
}

interface EventMarkerProps extends EventMarkersProps {
  event: LocatedEvent;
  offset: PixelOffset;
  active: boolean;
  selected: boolean;
}

function EventMarker({
  map,
  MarkerClass,
  event,
  offset,
  active,
  selected,
}: EventMarkerProps) {
  const { t, locale } = useT();
  const selectEvent = useAppStore((state) => state.selectEvent);
  // MapLibre positions this element; React renders the button into it.
  const [element] = useState(() => document.createElement("div"));

  const { lng, lat, approximate = false } = event.location;
  const [offsetX, offsetY] = offset;

  const markerRef = useRef<Marker | null>(null);
  // Markers overlap when zoomed out: keep the selected one on top.
  const zIndex = selected ? "3" : active ? "2" : "1";

  useEffect(() => {
    const marker = new MarkerClass({ element, offset: [offsetX, offsetY] })
      .setLngLat([lng, lat])
      .addTo(map);
    markerRef.current = marker;
    return () => {
      markerRef.current = null;
      marker.remove();
    };
  }, [MarkerClass, map, element, lng, lat, offsetX, offsetY]);

  useEffect(() => {
    const wrapper = markerRef.current?.getElement();
    if (wrapper) wrapper.style.zIndex = zIndex;
  }, [zIndex, lng, lat, offsetX, offsetY]);

  const title = event.title[locale];
  const years = formatYearRange(event.year, event.endYear, locale);
  const place = approximate
    ? `${event.location.name[locale]} (${t("map.legend.approximate")})`
    : event.location.name[locale];

  return createPortal(
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${title}, ${years}, ${place}`}
      onClick={() =>
        selected ? selectEvent(null) : selectEvent(event.id, event.year)
      }
      className="group relative flex size-8 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span
        aria-hidden
        className={`${eventDotClass({
          importance: event.importance,
          active,
          approximate,
          selected,
        })} group-hover:scale-125`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-full left-1/2 w-max max-w-44 -translate-x-1/2 rounded-md border border-line bg-background px-2 py-1 text-center text-xs leading-tight shadow-sm group-hover:block group-focus-visible:block ${
          selected ? "block" : "hidden"
        }`}
      >
        <span className="block font-medium">{title}</span>
        <span className="block text-muted tabular-nums">{years}</span>
      </span>
    </button>,
    element,
  );
}
