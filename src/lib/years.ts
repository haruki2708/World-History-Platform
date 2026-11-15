import type { Locale, Year } from "./types";

/** MVP range: founding of the Roman Republic to Augustus. */
export const YEAR_MIN: Year = -509;
export const YEAR_MAX: Year = -27;

export function clampYear(year: Year): Year {
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.round(year)));
}

const ERA_LABELS: Record<Locale, { bce: string; ce: string }> = {
  en: { bce: "BCE", ce: "CE" },
  vi: { bce: "TCN", ce: "SCN" },
};

/** -509 -> "509 BCE" (en) / "509 TCN" (vi). */
export function formatYear(year: Year, locale: Locale): string {
  const era = ERA_LABELS[locale];
  return year < 0 ? `${-year} ${era.bce}` : `${year} ${era.ce}`;
}

/** "264–241 BCE" for a span inside one era, otherwise both years in full. */
export function formatYearRange(
  start: Year,
  end: Year | undefined,
  locale: Locale,
): string {
  if (end === undefined || end === start) return formatYear(start, locale);
  if (start < 0 && end < 0) {
    return `${-start}–${formatYear(end, locale)}`;
  }
  return `${formatYear(start, locale)} – ${formatYear(end, locale)}`;
}
