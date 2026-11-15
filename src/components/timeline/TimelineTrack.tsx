"use client";

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { events, isEventActive } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent, Locale } from "@/lib/types";
import { YEAR_MAX, YEAR_MIN, formatYear, formatYearRange } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";
import {
  LANE_HEIGHT,
  MARKER_SIZE,
  computeTicks,
  fractionToYear,
  layoutMarkers,
  yearToFraction,
  yearToPercent,
  type ClusterLayout,
  type MarkerLayout,
} from "./layout";
import { useElementWidth } from "./useElementWidth";

/** Width assumed before the first measurement (a phone-sized track). */
const FALLBACK_WIDTH = 330;
/** Distance in px from the top of the slider area to the axis line. */
const AXIS_TOP = 10;

const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  PageDown: -10,
  PageUp: 10,
};

interface TimelineTrackProps {
  /** Called whenever the user moves the year by hand (used to pause playback). */
  onUserSeek: () => void;
}

/**
 * The axis, the draggable cursor and the event markers.
 *
 * Pointer input is handled on the whole track (markers area included), so the
 * drag target is large; keyboard input goes to the `role="slider"` element.
 * Markers sit outside the slider element because a slider's children are
 * presentational and must not contain buttons.
 */
export function TimelineTrack({ onUserSeek }: TimelineTrackProps) {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const setYear = useAppStore((state) => state.setYear);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectEvent = useAppStore((state) => state.selectEvent);

  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(trackRef, FALLBACK_WIDTH);

  const ticks = useMemo(() => computeTicks(width), [width]);
  const layout = useMemo(() => layoutMarkers(events, width), [width]);

  const markerRows = layout.laneCount + (layout.clusters.length > 0 ? 1 : 0);
  const markersHeight = markerRows * LANE_HEIGHT;
  const cursorPercent = yearToPercent(year);

  const seekTo = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    setYear(fractionToYear((clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // Stop the browser's own focus/selection handling; focus the slider so the
    // keyboard picks up where the pointer left off.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    sliderRef.current?.focus({ preventScroll: true });
    onUserSeek();
    seekTo(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      seekTo(event.clientX);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = useAppStore.getState().year;
    let next: number;
    if (event.key === "Home") next = YEAR_MIN;
    else if (event.key === "End") next = YEAR_MAX;
    else if (event.key in KEY_STEPS) next = current + KEY_STEPS[event.key];
    else return;
    event.preventDefault();
    onUserSeek();
    setYear(next);
  };

  return (
    <div
      ref={trackRef}
      className="relative mx-3 cursor-pointer touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Cursor line from the top of the markers down to the axis,
          drawn first so markers paint over it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 w-px -translate-x-1/2 bg-accent/60"
        style={{ left: cursorPercent, height: markersHeight + AXIS_TOP }}
      />

      <MarkerToolbar
        layout={layout}
        height={markersHeight}
        year={year}
        selectedEventId={selectedEventId}
        onSelect={(item) => {
          onUserSeek();
          selectEvent(item.id, item.year);
        }}
        onSeek={(target) => {
          onUserSeek();
          setYear(target);
        }}
      />

      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-label={t("timeline.label")}
        aria-valuemin={YEAR_MIN}
        aria-valuemax={YEAR_MAX}
        aria-valuenow={year}
        aria-valuetext={formatYear(year, locale)}
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="group relative h-9 outline-none"
      >
        {/* Axis and elapsed part. */}
        <div
          className="absolute inset-x-0 h-0.5 -translate-y-1/2 rounded-full bg-line"
          style={{ top: AXIS_TOP }}
        />
        <div
          className="absolute left-0 h-0.5 -translate-y-1/2 rounded-full bg-accent/50"
          style={{ top: AXIS_TOP, width: cursorPercent }}
        />

        {ticks.map((tick) => (
          <div
            key={tick.year}
            className="absolute -translate-x-1/2"
            style={{ left: yearToPercent(tick.year), top: AXIS_TOP }}
          >
            <div
              className={`mx-auto w-px ${
                tick.kind === "major"
                  ? "h-2 bg-muted"
                  : tick.kind === "mid"
                    ? "h-1.5 bg-muted/70"
                    : "h-1 bg-line"
              }`}
            />
            {tick.label && (
              <div className="mt-0.5 whitespace-nowrap text-[10px] leading-none text-muted tabular-nums">
                {formatYear(tick.year, locale)}
              </div>
            )}
          </div>
        ))}

        {/* Handle. */}
        <div
          className="absolute size-4 -translate-1/2 rounded-full border-2 border-background bg-accent shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
          style={{ left: cursorPercent, top: AXIS_TOP }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

type ToolbarItem =
  | { key: string; year: number; kind: "marker"; marker: MarkerLayout }
  | { key: string; year: number; kind: "cluster"; cluster: ClusterLayout };

interface MarkerToolbarProps {
  layout: ReturnType<typeof layoutMarkers>;
  height: number;
  year: number;
  selectedEventId: string | null;
  onSelect: (event: HistoricalEvent) => void;
  onSeek: (year: number) => void;
}

/**
 * Event markers as a toolbar with one tab stop: arrow keys move between
 * markers in chronological order, Enter/Space selects.
 */
function MarkerToolbar({
  layout,
  height,
  year,
  selectedEventId,
  onSelect,
  onSeek,
}: MarkerToolbarProps) {
  const { t, locale } = useT();
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const items = useMemo<ToolbarItem[]>(() => {
    const list: ToolbarItem[] = [
      ...layout.markers.map((marker) => ({
        key: marker.event.id,
        year: marker.event.year,
        kind: "marker" as const,
        marker,
      })),
      ...layout.clusters.map((cluster) => ({
        key: `cluster:${cluster.events.map((event) => event.id).join(",")}`,
        year: cluster.year,
        kind: "cluster" as const,
        cluster,
      })),
    ];
    return list.sort((a, b) => a.year - b.year || a.key.localeCompare(b.key));
  }, [layout]);

  const tabbableKey =
    items.find((item) => item.key === focusedKey)?.key ??
    items.find((item) => item.key === selectedEventId)?.key ??
    items[0]?.key;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.key === focusedKey);
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = Math.min(items.length - 1, index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = Math.max(0, index - 1);
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = items.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const target = event.currentTarget.querySelector<HTMLElement>(
      `[data-key="${CSS.escape(items[next].key)}"]`,
    );
    target?.focus();
  };

  return (
    <div
      role="toolbar"
      aria-label={t("timeline.markers")}
      aria-orientation="horizontal"
      className="relative"
      style={{ height }}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const common = {
          "data-key": item.key,
          tabIndex: item.key === tabbableKey ? 0 : -1,
          onFocus: () => setFocusedKey(item.key),
          // Keep the track's drag handler from treating this as a seek.
          onPointerDown: (event: PointerEvent) => event.stopPropagation(),
        };

        if (item.kind === "cluster") {
          const { cluster } = item;
          const label = t("timeline.cluster")
            .replace("{count}", String(cluster.events.length))
            .replace("{year}", formatYear(cluster.year, locale));
          return (
            <button
              key={item.key}
              type="button"
              {...common}
              aria-label={label}
              title={cluster.events
                .map(
                  (event) =>
                    `${formatYearRange(event.year, event.endYear, locale)} · ${event.title[locale]}`,
                )
                .join("\n")}
              onClick={() => onSeek(cluster.year)}
              className="absolute flex h-3.5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-background px-1 text-[10px] leading-none font-medium text-muted hover:border-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
              style={{
                left: yearToPercent(cluster.year),
                bottom: layout.laneCount * LANE_HEIGHT + 1,
              }}
            >
              +{cluster.events.length}
            </button>
          );
        }

        const { event, lane } = item.marker;
        return (
          <EventMarker
            key={item.key}
            {...common}
            event={event}
            lane={lane}
            active={isEventActive(event, year)}
            selected={event.id === selectedEventId}
            locale={locale}
            onClick={() => onSelect(event)}
          />
        );
      })}
    </div>
  );
}

interface EventMarkerProps {
  "data-key": string;
  tabIndex: number;
  onFocus: () => void;
  onPointerDown: (event: PointerEvent) => void;
  event: HistoricalEvent;
  lane: number;
  active: boolean;
  selected: boolean;
  locale: Locale;
  onClick: () => void;
}

const IMPORTANCE_FILL: Record<HistoricalEvent["importance"], string> = {
  3: "bg-accent",
  2: "bg-accent/60",
  1: "bg-muted/70",
};

function EventMarker({
  event,
  lane,
  active,
  selected,
  locale,
  ...buttonProps
}: EventMarkerProps) {
  const size = MARKER_SIZE[event.importance];
  const end = event.endYear ?? event.year;
  const isSpan = end !== event.year;
  const label = `${formatYearRange(event.year, event.endYear, locale)} · ${event.title[locale]}`;

  // The button is a full lane tall for an easier hit area; the visible dot or
  // bar is drawn inside it.
  const left = `calc(${yearToPercent(event.year)} - ${size / 2}px)`;
  const width = isSpan
    ? `calc(${(yearToFraction(end) - yearToFraction(event.year)) * 100}% + ${size}px)`
    : `${size}px`;

  const fill = active ? "bg-accent" : IMPORTANCE_FILL[event.importance];
  const ring = selected
    ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
    : active
      ? "ring-2 ring-accent/35"
      : "";

  return (
    <button
      type="button"
      {...buttonProps}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className="group/marker absolute flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      style={{
        left,
        width,
        bottom: lane * LANE_HEIGHT,
        height: LANE_HEIGHT,
        zIndex: selected ? 2 : active ? 1 : undefined,
      }}
    >
      <span
        className={`block w-full rounded-full transition-shadow group-hover/marker:brightness-110 ${fill} ${ring}`}
        // Span bars are a little thinner than point markers of the same rank.
        style={{ height: isSpan ? Math.round(size * 0.65) : size }}
      />
    </button>
  );
}
