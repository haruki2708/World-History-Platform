"use client";

import { getPolity, hasBattle } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent } from "@/lib/types";
import { formatYearRange } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

interface EventListItemProps {
  event: HistoricalEvent;
  /** Chosen by the user (here, on the timeline or on the map). */
  selected: boolean;
  /** Under way in the current year. */
  active: boolean;
  /** Within the window shown around the current year. */
  nearby: boolean;
  /** Compact single-line row (details are shown in EventDetailCard above). */
  compact?: boolean;
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
  compact = false,
  onToggle,
}: EventListItemProps) {
  const { t, locale } = useT();
  const requestBattle = useAppStore((state) => state.requestBattle);
  const dimmed = !selected && !active && !nearby;
  const battle = hasBattle(event.id);
  const expanded = selected && !compact;

  const polities = expanded
    ? event.polityIds
        .map((id) => getPolity(id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
    : [];

  return (
    <li data-event-id={event.id} className="py-0.5">
      <div
        className={`relative rounded-xl transition-[background-color,opacity,box-shadow] duration-200 motion-reduce:transition-none ${
          expanded
            ? "bg-surface/85 shadow-xs ring-1 ring-accent/35"
            : selected
              ? "bg-surface/90 ring-1 ring-accent/35"
              : "hover:bg-surface/70"
        } ${dimmed ? "opacity-55 hover:opacity-100" : ""}`}
      >
        {/* Accent bar marks events under way in the current year. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-2 left-1 w-1 rounded-full bg-accent transition-opacity duration-200 motion-reduce:transition-none ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />

        <button
          type="button"
          aria-pressed={selected}
          onClick={onToggle}
          className={`w-full rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
            compact ? "py-1.5 pr-2.5 pl-4" : expanded ? "px-3.5 pt-3 pb-2.5 pl-4" : "py-2 pr-2.5 pl-4"
          }`}
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
              className={`min-w-0 flex-1 leading-snug ${
                expanded
                  ? "text-[15px] font-semibold tracking-tight text-foreground"
                  : event.importance === 3
                    ? "text-sm font-semibold text-foreground"
                    : "text-sm font-medium text-foreground/90"
              } ${compact ? "truncate" : ""}`}
            >
              {event.title[locale]}
            </span>
            {battle && !expanded && (
              <span
                aria-hidden
                className="shrink-0 self-center rounded-md border border-accent/30 bg-accent/10 px-1.5 py-px text-[10px] font-semibold tracking-wide text-accent"
              >
                3D
              </span>
            )}
            {active && (
              <span
                className={`shrink-0 self-center rounded-full px-1.5 py-px text-[10px] leading-tight font-semibold tracking-wide uppercase ${
                  expanded
                    ? "bg-accent/14 text-accent"
                    : "bg-accent text-on-accent"
                }`}
              >
                {t("events.now")}
              </span>
            )}
          </span>

          {expanded && (
            <span className="mt-2.5 block space-y-2.5">
              <span className="block text-sm leading-relaxed text-foreground/90">
                {event.summary[locale]}
              </span>

              <span className="block space-y-2 border-t border-line/70 pt-2.5">
                {polities.length > 0 && (
                  <span className="flex flex-wrap gap-1.5">
                    {polities.map((polity) => (
                      <span
                        key={polity.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-background/85 px-2.5 py-0.5 text-xs font-medium text-foreground"
                      >
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: polity.color }}
                        />
                        {polity.name[locale]}
                      </span>
                    ))}
                  </span>
                )}

                {event.location && (
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-current opacity-80">
                      <path d="M8 1.5a4.75 4.75 0 0 0-4.75 4.75c0 3.3 3.86 7.45 4.2 7.8a.75.75 0 0 0 1.1 0c.34-.35 4.2-4.5 4.2-7.8A4.75 4.75 0 0 0 8 1.5Zm0 6.6a1.85 1.85 0 1 1 0-3.7 1.85 1.85 0 0 1 0 3.7Z" />
                    </svg>
                    <span>
                      <span className="font-medium text-foreground/85">
                        {event.location.name[locale]}
                      </span>
                      {event.location.approximate && ` · ${t("events.approximate")}`}
                    </span>
                  </span>
                )}

                {event.sources.length > 0 && (
                  <span className="block text-[11px] leading-relaxed text-muted">
                    <span className="font-semibold">{t("events.sources")}:</span>{" "}
                    {event.sources.map((source) => source.title).join("; ")}
                  </span>
                )}
              </span>
            </span>
          )}
        </button>

        {/* Outside the item's own button: a button may not contain another.
            Placed cleanly in the card's footer so it never covers the summary.
            The battle viewer returns focus here when it closes. */}
        {expanded && battle && (
          <div className="px-3.5 pt-0.5 pb-3 pl-4">
            <button
              type="button"
              data-battle-open={event.id}
              onClick={() => requestBattle(event.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent shadow-sm hover:opacity-92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
                <path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7Z" />
              </svg>
              {t("battle.open")}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
