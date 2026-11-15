"use client";

import { LOCALES } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { storeLocale } from "./shell/locale";

export function LocaleSwitch() {
  const { t, locale } = useT();
  const setLocale = useAppStore((state) => state.setLocale);

  return (
    <div
      role="group"
      aria-label={t("locale.switch")}
      className="flex shrink-0 overflow-hidden rounded-md border border-line text-sm"
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          onClick={() => {
            setLocale(code);
            // Only an explicit choice is remembered, not a language that
            // arrived through a shared link.
            storeLocale(code);
          }}
          className={
            locale === code
              ? "bg-accent px-3 py-1.5 font-medium text-on-accent"
              : "px-3 py-1.5 text-muted hover:bg-surface"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
