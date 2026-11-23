"use client";

import { getPolity, hasBattle } from "@/data";
import { useT } from "@/lib/i18n/useT";
import type { HistoricalEvent } from "@/lib/types";
import { formatYearRange } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

interface EventDetailCardProps {
  event: HistoricalEvent;
  active: boolean;
  onClose: () => void;
}

/**
 * Dedicated spotlight card for the selected event (Variant C): keeps the full
 * summary, polities, location, sources and 3D battle CTA pinned in full view
 * above the compact chronological list.
 */
export function EventDetailCard({ event, active, onClose }: EventDetailCardProps) {
  const { t, locale } = useT();
  const requestBattle = useAppStore((state) => state.requestBattle);
  const polities = event.polityIds
    .map((id) => getPolity(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <article className="relative flex min-h-0 flex-1 flex-col border-b border-line bg-surface/55 lg:max-h-[70%] lg:flex-initial lg:shrink-0">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3.5 pb-3.5">
        <div className="flex items-start gap-2.5">
          <span aria-hidden className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-accent" />
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
            <h3 className="mt-0.5 text-base leading-snug font-semibold tracking-tight text-foreground">
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

        <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
          {event.summary[locale]}
        </p>

        <div className="mt-3 space-y-2 border-t border-line/70 pt-2.5">
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

        {hasBattle(event.id) && (
          <div className="mt-3">
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
    </article>
  );
}
