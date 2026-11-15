import type { Locale } from "@/lib/types";

/**
 * localStorage key for the language the user picked with the switch. Also
 * read by the inline script in src/app/layout.tsx, which repeats the order of
 * `resolveInitialLocale` below; keep the two in step.
 */
export const LOCALE_STORAGE_KEY = "whp.locale";
const STORAGE_KEY = LOCALE_STORAGE_KEY;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "vi";
}

/** The saved choice, or null when there is none or storage is unavailable. */
export function readStoredLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Remembers an explicit choice. Silently does nothing without storage. */
export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private mode, blocked site data, quota: the choice just isn't kept.
  }
}

function browserLocale(): Locale | null {
  try {
    const languages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    return languages[0]?.toLowerCase().startsWith("vi") ? "vi" : null;
  } catch {
    return null;
  }
}

/**
 * Language to open the page in: the link's `lang`, then the saved choice,
 * then the browser's language (Vietnamese if it starts with "vi"), then English.
 */
export function resolveInitialLocale(fromLink: Locale | undefined): Locale {
  return fromLink ?? readStoredLocale() ?? browserLocale() ?? "en";
}
