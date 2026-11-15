"use client";

import { getEvent } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

/**
 * Placeholder. The chat is built in phase 4. For now it shows the context the
 * tutor will be given, which proves the store wiring end to end.
 */
export function TutorPanel() {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const viewport = useAppStore((state) => state.viewport);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : undefined;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto border-line px-4 py-3 lg:flex-none lg:border-t">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t("tutor.heading")}
      </h2>
      <p className="mt-2 text-sm text-muted">{t("tutor.placeholder")}</p>
      <h3 className="mt-3 text-xs text-muted">{t("tutor.context")}</h3>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">{t("tutor.context.year")}</dt>
        <dd className="tabular-nums">{formatYear(year, locale)}</dd>
        <dt className="text-muted">{t("tutor.context.event")}</dt>
        <dd>{selectedEvent?.title[locale] ?? t("tutor.context.none")}</dd>
        <dt className="text-muted">{t("tutor.context.view")}</dt>
        <dd className="tabular-nums" data-testid="tutor-viewport">
          {viewport.center.lat.toFixed(2)}°, {viewport.center.lng.toFixed(2)}° ·{" "}
          {t("tutor.context.zoom")} {viewport.zoom.toFixed(1)}
        </dd>
      </dl>
    </section>
  );
}
