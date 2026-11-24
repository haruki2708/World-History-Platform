"use client";

import { getPolity, hasBattle } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent } from "@/lib/types";
import { formatYearRange } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

interface EventDetailCardProps {
  id: string;
  event: HistoricalEvent;
  active: boolean;
  onClose: () => void;
}

/**
 * Dedicated spotlight card for the selected event, pinned above the compact
 * chronological list. The header (year, title, close button) and the 3D battle
 * action stay pinned while only the middle body (summary, polities, location,
 * sources) scrolls when height is tight (e.g. 1280x800 or long summaries),
 * always leaving room for at least six rows of the list below on desktop.
 */
export function EventDetailCard({ id, event, active, onClose }: EventDetailCardProps) {
  const { t, locale } = useT();
  const requestBattle = useAppStore((state) => state.requestBattle);
  const polities = event.polityIds
    .map((polityId) => getPolity(polityId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const battle = hasBattle(event.id);

  return (
    <article
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative flex min-h-0 flex-1 flex-col border-b border-line bg-surface/55 lg:max-h-[calc(100%-13.75rem)] lg:flex-initial lg:shrink-0"
    >
      {/* Pinned header: always visible even when the summary body scrolls. */}
      <div className="flex shrink-0 items-start gap-2.5 px-4 pt-3 pb-2">
        <span aria-hidden className="mt-0.5 h-9 w-1 shrink-0 rounded-full bg-accent" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-accent tabular-nums">
              {formatYearRange(event.year, event.endYear, locale)}
            </span>
            {active && (
              <span className="rounded-full bg-accent/14 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                {t("events.now")}
              </span>
            )}
          </div>
          <h3
            id={`${id}-title`}
            className="mt-0.5 text-base leading-snug font-semibold tracking-tight text-foreground"
          >
            {event.title[locale]}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("events.deselect")}
          title={t("events.deselect")}
          className="-mt-0.5 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
            <path d="M4.2 3a.85.85 0 0 0-1.2 1.2L6.8 8 3 11.8A.85.85 0 1 0 4.2 13L8 9.2l3.8 3.8a.85.85 0 0 0 1.2-1.2L9.2 8 13 4.2A.85.85 0 0 0 11.8 3L8 6.8 4.2 3Z" />
          </svg>
        </button>
      </div>

      {/* Scrollable middle section: summary, polities, location, sources. */}
      <div className={`min-h-0 flex-1 overflow-y-auto px-4 ${battle ? "pb-2.5" : "pb-3"}`}>
        <p className="text-sm leading-relaxed text-foreground/90">
          {event.summary[locale]}
        </p>

        <div className="mt-2.5 space-y-1.5 border-t border-line/70 pt-2">
          {polities.length > 0 && (
            <div aria-label={t("events.polities")} className="flex flex-wrap gap-1.5">
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
            </div>
          )}

          {event.location && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-current opacity-80">
                <path d="M8 1.5a4.75 4.75 0 0 0-4.75 4.75c0 3.3 3.86 7.45 4.2 7.8a.75.75 0 0 0 1.1 0c.34-.35 4.2-4.5 4.2-7.8A4.75 4.75 0 0 0 8 1.5Zm0 6.6a1.85 1.85 0 1 1 0-3.7 1.85 1.85 0 0 1 0 3.7Z" />
              </svg>
              <span className="sr-only">{t("events.location")}: </span>
              <span>
                <span className="font-medium text-foreground/85">{event.location.name[locale]}</span>
                {event.location.approximate && ` · ${t("events.approximate")}`}
              </span>
            </p>
          )}

          {event.sources.length > 0 && (
            <p className="text-[11px] leading-relaxed text-muted">
              <span className="font-semibold text-muted">{t("events.sources")}:</span>{" "}
              {event.sources.map((source) => source.title).join("; ")}
            </p>
          )}
        </div>
      </div>

      {/* Pinned 3D battle CTA: always visible, and the sole [data-battle-open]
          button on the page so the battle viewer returns focus here on close. */}
      {battle && (
        <div className="shrink-0 border-t border-line/60 px-4 py-2.5">
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
    </article>
  );
}
