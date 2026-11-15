"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/useT";
import { LocaleSwitch } from "./LocaleSwitch";
import { MapView } from "./map/MapView";
import { EventPanel } from "./panel/EventPanel";
import { TimelineBar } from "./timeline/TimelineBar";
import { TutorPanel } from "./tutor/TutorPanel";

/**
 * Page layout: header, map + side panel, timeline along the bottom.
 * Each region is owned by one lane; this file only arranges them.
 */
export function AppShell() {
  const { t, locale } = useT();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight">
            {t("app.title")}
          </h1>
          <p className="text-sm text-muted">{t("app.subtitle")}</p>
        </div>
        <LocaleSwitch />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-h-64 flex-1 lg:min-h-0">
          <MapView />
        </main>
        <aside className="flex min-h-0 flex-1 flex-col border-t border-line lg:w-96 lg:flex-none lg:border-l lg:border-t-0">
          <EventPanel />
          <TutorPanel />
        </aside>
      </div>

      <footer className="shrink-0 border-t border-line">
        <TimelineBar />
      </footer>
    </div>
  );
}
