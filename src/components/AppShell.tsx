"use client";

import dynamic from "next/dynamic";
import { type ComponentType, useEffect, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { BattleViewerLoading } from "./battle/BattleViewerLoading";
import { MapView } from "./map/MapView";
import { EventPanel } from "./panel/EventPanel";
import { HeaderActions } from "./shell/HeaderActions";
import { UrlSync } from "./shell/UrlSync";
import { TimelineBar } from "./timeline/TimelineBar";
import { TutorPanel } from "./tutor/TutorPanel";

// The battle viewer brings three.js with it, so its code is fetched only when
// a battle is first asked for, and never on the server.
const loadBattleViewer = () =>
  import("./battle/BattleViewer").then((m) => {
    loadedBattleViewer = m.BattleViewer;
    return m.BattleViewer;
  });
const BattleViewer = dynamic(loadBattleViewer, {
  ssr: false,
  loading: () => <BattleViewerLoading />,
});
/** The viewer's component once its code has arrived (fetched while the map flies). */
let loadedBattleViewer: ComponentType | null = null;

/**
 * One open battle. When the code arrived during the flight, the viewer is
 * drawn at once; through next/dynamic it would show the loading state for a
 * moment (about 0.3 s) even then. The choice is made once per opening, so the
 * viewer is never swapped for another component while it is open.
 */
function OpenBattle() {
  const [Viewer] = useState<ComponentType>(() => loadedBattleViewer ?? BattleViewer);
  return <Viewer />;
}

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
  const battleOpen = useAppStore((state) => state.battleId !== null);
  const battleRequested = useAppStore((state) => state.battleRequest !== null);

  // While the map flies to a battlefield, fetch the viewer's code so the
  // battle opens without waiting for it.
  useEffect(() => {
    if (battleRequested) void loadBattleViewer();
  }, [battleRequested]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    // The inline script in layout.tsx hides the page until it is in the
    // language it predicted; show it once that language is applied.
    if (root.dataset.localePending === locale) {
      delete root.dataset.localePending;
    }
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

      {battleOpen && <OpenBattle />}
    </div>
  );
}
