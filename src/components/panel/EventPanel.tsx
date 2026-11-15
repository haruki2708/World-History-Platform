"use client";

import { getEventsAround, getPolity, isEventActive } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { formatYearRange } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

/** Lists the events near the current year; click one to select it. */
export function EventPanel() {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectEvent = useAppStore((state) => state.selectEvent);

  const nearby = getEventsAround(year);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h2 className="shrink-0 px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {t("events.heading")}
      </h2>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {nearby.length === 0 && (
          <li className="px-2 py-3 text-sm text-muted">{t("events.empty")}</li>
        )}
        {nearby.map((event) => {
          const selected = event.id === selectedEventId;
          const active = isEventActive(event, year);
          return (
            <li key={event.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  selected ? selectEvent(null) : selectEvent(event.id, event.year)
                }
                className={`w-full rounded-md px-2 py-2 text-left hover:bg-surface ${
                  selected ? "bg-surface" : ""
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span
                    className={`shrink-0 text-xs tabular-nums ${
                      active ? "font-semibold text-accent" : "text-muted"
                    }`}
                  >
                    {formatYearRange(event.year, event.endYear, locale)}
                  </span>
                  <span className="text-sm font-medium">
                    {event.title[locale]}
                  </span>
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
        })}
      </ul>
    </section>
  );
}
