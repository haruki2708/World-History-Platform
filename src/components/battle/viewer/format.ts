import type { Battle, NumberRange } from "@/lib/battle";
import type { Locale } from "@/lib/types";

/** A clock time in hours (7.5) as "07:30". */
export function formatHour(hour: number): string {
  const minutes = Math.round(hour * 60);
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Clock times at the start and the end of phase `index` (0-based). */
export function phaseHours(battle: Battle, index: number): { start: number; end: number } {
  return {
    start: index === 0 ? battle.startHour : battle.phases[index - 1].endHour,
    end: battle.phases[index].endHour,
  };
}

const NUMBER_LOCALE: Record<Locale, string> = { en: "en-US", vi: "vi-VN" };

/** "86,000–87,200", or one figure when the sources agree. */
export function formatNumberRange(range: NumberRange, locale: Locale): string {
  const format = new Intl.NumberFormat(NUMBER_LOCALE[locale]);
  if (range.min === range.max) return format.format(range.min);
  return `${format.format(range.min)}–${format.format(range.max)}`;
}
