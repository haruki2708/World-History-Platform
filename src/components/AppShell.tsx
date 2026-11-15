"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { MapView } from "./map/MapView";
import { EventPanel } from "./panel/EventPanel";
import { HeaderActions } from "./shell/HeaderActions";
import { UrlSync } from "./shell/UrlSync";
import { TimelineBar } from "./timeline/TimelineBar";
import { TutorPanel } from "./tutor/TutorPanel";

type PanelTab = "events" | "tutor";

const TABS: { id: PanelTab; label: "events.heading" | "tutor.heading" }[] = [
  { id: "events", label: "events.heading" },
  { id: "tutor", label: "tutor.heading" },
];

/**
 * Page layout: header, map + side panel, timeline along the bottom.
 * Each region is owned by one lane; this file only arranges them.
 *
 * On wide screens the side panel stacks the event list above the tutor and
 * gives the chat the larger share (2:3). On narrow screens there is not
 * enough height for both, so they become tabs.
 */
export function AppShell() {
  const { t, locale } = useT();
  const [tab, setTab] = useState<PanelTab>("events");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="flex h-dvh flex-col">
      <UrlSync />
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight">
            {t("app.title")}
          </h1>
          <p className="text-sm text-muted">{t("app.subtitle")}</p>
        </div>
        <HeaderActions />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* On phones the open tab gets the room it needs: the chat takes two
            thirds of the height and the map shrinks, the event list shares
            it evenly with the map. */}
        <main
          className={`flex-1 lg:min-h-0 ${tab === "tutor" ? "min-h-32" : "min-h-64"}`}
        >
          <MapView />
        </main>
        <aside
          className={`flex min-h-0 flex-col border-t border-line lg:w-96 lg:flex-none lg:border-l lg:border-t-0 ${
            tab === "tutor" ? "flex-[2]" : "flex-1"
          }`}
        >
          <div
            role="tablist"
            aria-label={t("panel.tabs")}
            className="flex shrink-0 border-b border-line lg:hidden"
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`panel-tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`flex-1 border-b-2 px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  tab === id
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <div
            id="panel-events"
            role="tabpanel"
            aria-labelledby="panel-tab-events"
            className={`min-h-0 flex-1 flex-col lg:flex lg:flex-[2] ${
              tab === "events" ? "flex" : "hidden"
            }`}
          >
            <EventPanel />
          </div>
          <div
            id="panel-tutor"
            role="tabpanel"
            aria-labelledby="panel-tab-tutor"
            className={`min-h-0 flex-1 flex-col lg:flex lg:flex-[3] ${
              tab === "tutor" ? "flex" : "hidden"
            }`}
          >
            <TutorPanel />
          </div>
        </aside>
      </div>

      <footer className="shrink-0 border-t border-line">
        <TimelineBar />
      </footer>
    </div>
  );
}
