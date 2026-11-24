"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { events, getEvent, getEventsAround, isEventActive } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent, Year } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { EventDetailCard } from "./EventDetailCard";
import { EventListItem } from "./EventListItem";

/** Padding at the top of the scrolling list (matches Tailwind `pt-2`). */
const LIST_TOP_PADDING = 8;

/**
 * Selected-event detail card pinned above the compact chronological list.
 * The list itself never expands inline (so rows never jump); events under way
 * are highlighted, nearby events stay crisp and distant ones are dimmed, and
 * auto-scroll snaps to a clean row boundary so no line is half-cut at the top.
 */
export function EventPanel() {
  const { t } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectEvent = useAppStore((state) => state.selectEvent);
  const detailId = useId();

  const nearbyIds = useMemo(
    () => new Set(getEventsAround(year).map((event) => event.id)),
    [year],
  );
  const anchorId = pickAnchor(year, selectedEventId);
  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : undefined;

  const listRef = useRef<HTMLUListElement>(null);
  const hasScrolled = useRef(false);
  /** Row id to focus after closing the detail card with its close button. */
  const returnFocusIdRef = useRef<string | null>(null);

  // Scroll only when the anchor or the selection changes, not on every year,
  // so dragging the timeline does not make the list jitter. Snap to the top
  // edge of a whole row so the first visible line below the detail card is
  // never sliced horizontally.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !anchorId) return;
    const rows = Array.from(list.children) as HTMLElement[];
    const anchorIndex = rows.findIndex((row) => row.dataset.eventId === anchorId);
    if (anchorIndex < 0) return;

    const rowHeight = Math.max(rows[anchorIndex].offsetHeight, 1);
    const visibleRows = Math.floor((list.clientHeight - LIST_TOP_PADDING) / rowHeight);
    // Keep 1-2 rows above the anchor when there is room (upper third).
    const rowsAbove = visibleRows >= 6 ? 2 : visibleRows >= 3 ? 1 : 0;
    const topIndex = Math.max(0, anchorIndex - rowsAbove);
    const targetTop = Math.max(0, rows[topIndex].offsetTop - LIST_TOP_PADDING);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollTo({
      top: targetTop,
      behavior: hasScrolled.current && !reduceMotion ? "smooth" : "auto",
    });
    hasScrolled.current = true;
  }, [anchorId, selectedEventId]);

  // After closing the detail card, return keyboard focus to that event's row
  // button (on narrow screens the list has just become visible again).
  useEffect(() => {
    if (selectedEventId !== null || returnFocusIdRef.current === null) return;
    const id = returnFocusIdRef.current;
    returnFocusIdRef.current = null;
    const button = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-event-id="${CSS.escape(id)}"] button`,
    );
    button?.focus({ preventScroll: true });
  }, [selectedEventId]);

  const handleCloseDetail = () => {
    if (selectedEvent) returnFocusIdRef.current = selectedEvent.id;
    selectEvent(null);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {selectedEvent && (
        <EventDetailCard
          id={detailId}
          event={selectedEvent}
          active={isEventActive(selectedEvent, year)}
          onClose={handleCloseDetail}
        />
      )}

      <div
        className={`relative flex min-h-0 flex-1 flex-col ${
          selectedEvent ? "max-lg:hidden" : ""
        }`}
      >
        {/* Subtle top edge fade softens manually scrolled rows under the card. */}
        {selectedEvent && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-2.5 bg-gradient-to-b from-background to-transparent"
          />
        )}
        <ul
          ref={listRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-2.5 pt-2 pb-2.5"
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
                controlsId={selected ? detailId : undefined}
                onToggle={() =>
                  selected ? selectEvent(null) : selectEvent(event.id, event.year)
                }
              />
            );
          })}
        </ul>
      </div>
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
