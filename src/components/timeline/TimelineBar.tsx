"use client";

import { useT } from "@/lib/i18n/useT";
import { YEAR_MAX, YEAR_MIN, formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

/**
 * Placeholder slider. Lane 1 replaces this with the full timeline (task T-001).
 * Contract: read `year` from the store and change it only with `setYear`.
 */
export function TimelineBar() {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const setYear = useAppStore((state) => state.setYear);

  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {formatYear(YEAR_MIN, locale)}
        </span>
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          aria-label={t("timeline.label")}
          aria-valuetext={formatYear(year, locale)}
          className="min-w-0 flex-1 accent-accent"
        />
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {formatYear(YEAR_MAX, locale)}
        </span>
      </div>
      <p className="text-center text-xs text-muted">
        {t("timeline.placeholder")}
      </p>
    </div>
  );
}
