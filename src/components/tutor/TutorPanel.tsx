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
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : undefined;

  return (
    <section className="shrink-0 border-t border-line px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t("tutor.heading")}
      </h2>
      <p className="mt-2 text-sm text-muted">{t("tutor.placeholder")}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">{t("tutor.context.year")}</dt>
        <dd className="tabular-nums">{formatYear(year, locale)}</dd>
        <dt className="text-muted">{t("tutor.context.event")}</dt>
        <dd>{selectedEvent?.title[locale] ?? t("tutor.context.none")}</dd>
      </dl>
    </section>
  );
}
