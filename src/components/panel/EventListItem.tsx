"use client";

import { hasBattle } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent } from "@/lib/types";
import { formatYearRange } from "@/lib/years";

interface EventListItemProps {
  event: HistoricalEvent;
  /** Chosen by the user (here, on the timeline or on the map). */
  selected: boolean;
  /** Under way in the current year. */
  active: boolean;
  /** Within the window shown around the current year. */
  nearby: boolean;
  /** Id of the EventDetailCard when this row is selected. */
  controlsId?: string;
  onToggle: () => void;
}

/** Dot size by importance, echoing the timeline markers. */
const IMPORTANCE_DOT: Record<HistoricalEvent["importance"], string> = {
  3: "size-2.5",
  2: "size-2",
  1: "size-1.5",
};

export function EventListItem({
  event,
  selected,
  active,
  nearby,
  controlsId,
  onToggle,
}: EventListItemProps) {
  const { t, locale } = useT();
  const dimmed = !selected && !active && !nearby;
  const battle = hasBattle(event.id);

  return (
    <li data-event-id={event.id} className="py-0.5">
      <div
        className={`relative rounded-xl transition-[background-color,opacity] duration-200 motion-reduce:transition-none ${
          selected ? "bg-surface/90 ring-1 ring-accent/35" : "hover:bg-surface/70"
        } ${dimmed ? "opacity-55 hover:opacity-100" : ""}`}
      >
        {/* Accent bar marks events under way in the current year. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-1.5 left-1 w-1 rounded-full bg-accent transition-opacity duration-200 motion-reduce:transition-none ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />

        <button
          type="button"
          aria-pressed={selected}
          aria-controls={controlsId}
          onClick={onToggle}
          className="w-full rounded-xl py-1.5 pr-2.5 pl-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
        >
          <span className="flex items-baseline gap-2">
            <span
              aria-hidden
              className={`inline-block shrink-0 self-center rounded-full ${IMPORTANCE_DOT[event.importance]} ${
                event.importance === 1 && !active ? "bg-muted" : "bg-accent"
              }`}
            />
            <span
              className={`shrink-0 text-xs tabular-nums ${
                active ? "font-semibold text-accent" : "text-muted"
              }`}
            >
              {formatYearRange(event.year, event.endYear, locale)}
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-sm leading-snug ${
                event.importance === 3
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground/90"
              }`}
            >
              {event.title[locale]}
            </span>
            {battle && (
              <span
                aria-hidden
                className="shrink-0 self-center rounded-md border border-accent/30 bg-accent/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-accent"
              >
                3D
              </span>
            )}
            {active && (
              <span className="shrink-0 self-center rounded-full bg-accent px-1.5 py-px text-[10px] leading-tight font-semibold tracking-wide text-on-accent uppercase">
                {t("events.now")}
              </span>
            )}
          </span>
        </button>
      </div>
    </li>
  );
}
