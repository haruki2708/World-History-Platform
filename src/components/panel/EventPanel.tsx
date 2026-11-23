"use client";

import { useEffect, useMemo, useRef } from "react";
import { events, getEvent, getEventsAround, isEventActive } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent, Year } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { EventDetailCard } from "./EventDetailCard";
import { EventListItem } from "./EventListItem";
import type { PanelVariant } from "./panelVariant";

interface EventPanelProps {
  variant?: PanelVariant;
  /** Hide the top "Events" label when a desktop/mobile tab bar already names it. */
  hideHeading?: boolean;
}

/**
 * The full chronological list of events. The list itself never changes as the
 * year moves (so nothing jumps); instead events under way are highlighted,
 * events near the year are shown in full and the rest are dimmed, and the list
 * scrolls smoothly to keep the year's events in view.
 */
export function EventPanel({ variant = "A", hideHeading = false }: EventPanelProps) {
  const { t } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectEvent = useAppStore((state) => state.selectEvent);

  const nearbyIds = useMemo(
    () => new Set(getEventsAround(year).map((event) => event.id)),
    [year],
  );
  const anchorId = pickAnchor(year, selectedEventId);
  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : undefined;
  const spotlightMode = variant === "C";

  const listRef = useRef<HTMLUListElement>(null);
  const hasScrolled = useRef(false);

  // Scroll only when the anchor or the selection changes, not on every year,
  // so dragging the timeline does not make the list jitter.
  useEffect(() => {
    const list = listRef.current;
    const item = anchorId
      ? list?.querySelector<HTMLElement>(
          `[data-event-id="${CSS.escape(anchorId)}"]`,
        )
      : null;
    if (!list || !item) return;

    // Put the item near the top/third, keeping a tall expanded card fully visible.
    const margin = 8;
    const offset = Math.max(
      margin,
      Math.min(
        spotlightMode ? list.clientHeight / 3 : list.clientHeight / 5,
        list.clientHeight - item.offsetHeight - margin,
      ),
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollTo({
      top: Math.max(0, item.offsetTop - offset),
      behavior: hasScrolled.current && !reduceMotion ? "smooth" : "auto",
    });
    hasScrolled.current = true;
  }, [anchorId, selectedEventId, spotlightMode]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {!hideHeading && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-1.5">
          <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t("events.heading")}
          </h2>
          <span className="text-[11px] text-muted tabular-nums">
            {t("panel.eventsCount").replace("{count}", String(events.length))}
          </span>
        </div>
      )}

      {spotlightMode && selectedEvent && (
        <EventDetailCard
          event={selectedEvent}
          active={isEventActive(selectedEvent, year)}
          onClose={() => selectEvent(null)}
        />
      )}

      <ul
        ref={listRef}
        className={`relative min-h-0 flex-1 overflow-y-auto px-2.5 ${
          hideHeading ? "pt-2 pb-2.5" : "pt-1 pb-2.5"
        } ${spotlightMode && selectedEvent ? "max-lg:hidden" : ""}`}
      >
        {events.length === 0 && (
          <li className="px-2 py-3 text-sm text-muted">{t("events.empty")}</li>
        )}
        {events.map((event) => {
          const selected = event.id === selectedEventId;
          return (
            <EventListItem
              key={event.id}
              event={event}
              selected={selected}
              active={isEventActive(event, year)}
              nearby={nearbyIds.has(event.id)}
              compact={spotlightMode}
              onToggle={() =>
                selected ? selectEvent(null) : selectEvent(event.id, event.year)
              }
            />
          );
        })}
      </ul>
    </section>
  );
}

/** Years between `year` and the nearest part of the event (0 if under way). */
function distance(event: HistoricalEvent, year: Year): number {
  if (year < event.year) return event.year - year;
  return Math.max(0, year - (event.endYear ?? event.year));
}

/**
 * The event the list should keep in view: the selected one while it is under
 * way, otherwise the event closest to the year (the earliest on a tie).
 */
function pickAnchor(year: Year, selectedEventId: string | null): string | null {
  const selected = selectedEventId ? getEvent(selectedEventId) : undefined;
  if (selected && isEventActive(selected, year)) return selected.id;

  let best: HistoricalEvent | undefined;
  for (const event of events) {
    if (!best || distance(event, year) < distance(best, year)) best = event;
  }
  return best?.id ?? null;
}
