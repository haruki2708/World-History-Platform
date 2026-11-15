"use client";

import { getPolity } from "@/data";
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
  onToggle,
}: EventListItemProps) {
  const { t, locale } = useT();
  const dimmed = !selected && !active && !nearby;

  return (
    <li data-event-id={event.id} className="py-0.5">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={`relative w-full rounded-md py-2 pr-2 pl-4 text-left transition-[background-color,opacity] duration-200 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
          selected ? "bg-surface ring-1 ring-accent/40" : ""
        } ${dimmed ? "opacity-50 hover:opacity-100" : ""}`}
      >
        {/* Accent bar marks events under way in the current year. */}
        <span
          aria-hidden
          className={`absolute inset-y-2 left-1 w-1 rounded-full bg-accent transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />

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
            className={`min-w-0 flex-1 text-sm ${
              event.importance === 3 ? "font-semibold" : "font-medium"
            }`}
          >
            {event.title[locale]}
          </span>
          {active && (
            <span className="shrink-0 self-center rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold uppercase leading-tight tracking-wide text-on-accent">
              {t("events.now")}
            </span>
          )}
        </span>

        {selected && (
          <span className="mt-2 block space-y-2 text-sm">
            <span className="block text-foreground/90">
              {event.summary[locale]}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {event.polityIds.map((id) => {
                const polity = getPolity(id);
                if (!polity) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs"
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: polity.color }}
                    />
                    {polity.name[locale]}
                  </span>
                );
              })}
            </span>
            {event.location && (
              <span className="block text-xs text-muted">
                {event.location.name[locale]}
                {event.location.approximate &&
                  ` · ${t("events.approximate")}`}
              </span>
            )}
            <span className="block text-xs text-muted">
              {t("events.sources")}:{" "}
              {event.sources.map((source) => source.title).join("; ")}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}
