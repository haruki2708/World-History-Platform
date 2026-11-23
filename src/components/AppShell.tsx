"use client";

import dynamic from "next/dynamic";
import { type ComponentType, useEffect, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { BattleViewerLoading } from "./battle/BattleViewerLoading";
import { MapView } from "./map/MapView";
import { SidePanel, type SidePanelTab } from "./panel/SidePanel";
import { HeaderActions } from "./shell/HeaderActions";
import { UrlSync } from "./shell/UrlSync";
import { TimelineBar } from "./timeline/TimelineBar";

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

/**
 * Page layout: header, map + side panel, timeline along the bottom.
 * Each region is owned by one lane; this file only arranges them.
 */
export function AppShell() {
  const { t, locale } = useT();
  const [tab, setTab] = useState<SidePanelTab>("events");
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
          className={`flex min-h-0 flex-col border-t border-line bg-background lg:w-[26rem] lg:flex-none lg:border-l lg:border-t-0 ${
            tab === "tutor" ? "flex-[2]" : "flex-1"
          }`}
        >
          <SidePanel tab={tab} onTabChange={setTab} />
        </aside>
      </div>

      <footer className="shrink-0 border-t border-line">
        <TimelineBar />
      </footer>

      {battleOpen && <OpenBattle />}
    </div>
  );
}
