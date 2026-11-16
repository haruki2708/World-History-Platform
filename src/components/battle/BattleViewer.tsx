"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { getEvent, loadBattle, unitTypes } from "@/data";
import type { Battle } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { BattleScene } from "./BattleScene";
import { ControlBar } from "./viewer/ControlBar";
import { InfoPanel, sideColor } from "./viewer/InfoPanel";
import { StoryPanel } from "./viewer/StoryPanel";
import { type Playback, usePlayback } from "./viewer/usePlayback";

/**
 * The battle open in the store, full screen over the app: the 3D scene, the
 * playback controls and a side panel with the narration and the facts.
 * Loaded by AppShell only when a battle opens, so three.js stays out of the
 * main page.
 */
export function BattleViewer() {
  const battleId = useAppStore((state) => state.battleId);
  if (battleId === null) return null;
  // Another battle starts from a clean viewer.
  return <ViewerDialog key={battleId} battleId={battleId} />;
}

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; battle: Battle };

type PanelTab = "story" | "info";

const TABS: { id: PanelTab; label: "battle.viewer.tab.story" | "battle.viewer.tab.info" }[] = [
  { id: "story", label: "battle.viewer.tab.story" },
  { id: "info", label: "battle.viewer.tab.info" },
];

const HEADER_BUTTON =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent";

/** Somewhere the user types, or picks from a list with the arrow keys. */
function isTypingTarget(target: Element): boolean {
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.matches("input, textarea, select");
}

/** Controls for which Space already means "press this". */
const ACTIVATABLE = 'button, a[href], summary, input, select, textarea, [role="button"]';
/** Controls that use the left and right arrows themselves. */
const USES_ARROWS = '[role="slider"], [role="tab"], input, select, textarea';

function ViewerDialog({ battleId }: { battleId: string }) {
  const { t, locale } = useT();
  const closeBattle = useAppStore((state) => state.closeBattle);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const panelId = useId();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [panelOpen, setPanelOpen] = useState(true);
  const [tab, setTab] = useState<PanelTab>("story");
  const battle = load.status === "ready" ? load.battle : null;
  const playback = usePlayback(battle);
  const event = getEvent(battleId);
  const title = event?.title[locale] ?? battleId;

  useEffect(() => {
    const dialog = dialogRef.current;
    // Not closed again on cleanup: closing fires `close`, which would shut
    // the battle when React re-runs effects in development.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let alive = true;
    loadBattle(battleId)
      .then((loaded) => {
        if (alive) setLoad(loaded ? { status: "ready", battle: loaded } : { status: "error" });
      })
      .catch((error) => {
        console.error("The battle data could not be loaded.", error);
        if (alive) setLoad({ status: "error" });
      });
    return () => {
      alive = false;
    };
  }, [battleId]);

  // The browser puts the focus on the first control, the close button, where
  // Space would shut the battle. Once the controls are there, start on Play
  // instead, unless the user has already moved the focus.
  const ready = battle !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!ready || !dialog) return;
    const active = document.activeElement;
    if (active === document.body || active === dialog || active?.closest("[data-battle-close]")) {
      dialog.querySelector<HTMLElement>("[data-battle-play]")?.focus();
    }
  }, [ready]);

  // Keys of the viewer. On window: after a click on the scene the focus is
  // on no control, and the key press never passes through the dialog. The
  // page's own shortcuts stand aside while a dialog is open.
  const playbackRef = useRef<Playback>(playback);
  useEffect(() => {
    playbackRef.current = playback;
  });
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const dialog = dialogRef.current;
      if (!dialog?.open) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && target !== document.body && !dialog.contains(target)) return;
      if (target && isTypingTarget(target)) return;
      if (event.key === " ") {
        if (target?.closest(ACTIVATABLE)) return;
        playbackRef.current.toggle();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (target?.closest(USES_ARROWS)) return;
        playbackRef.current.step(event.key === "ArrowRight" ? 1 : -1);
      } else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Esc and the close button both end here.
  const handleClose = () => {
    closeBattle();
    // The browser returns focus to the button that opened the battle when it
    // was focused; not every browser focuses a button on click, so make sure.
    const opener = document.querySelector<HTMLElement>(
      `[data-battle-open="${CSS.escape(battleId)}"]`,
    );
    opener?.focus({ preventScroll: true });
  };

  const selectTab = (next: PanelTab) => {
    setTab(next);
    document.getElementById(`${panelId}-tab-${next}`)?.focus();
  };

  const handleTabKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((item) => item.id === tab);
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index + TABS.length - 1) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    selectTab(TABS[next].id);
  };

  const panelLabel = panelOpen ? t("battle.viewer.panel.hide") : t("battle.viewer.panel.show");

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
      data-battle-viewer
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-background p-0 text-foreground backdrop:bg-background"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-base font-semibold leading-tight">
              {title}
            </h2>
            {battle && <p className="truncate text-xs text-muted">{battle.date[locale]}</p>}
          </div>

          {battle && (
            <ul className="hidden shrink-0 items-center gap-2 text-xs md:flex">
              {battle.sides.map((side) => (
                <li
                  key={side.id}
                  className="flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5"
                >
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full border border-line"
                    style={{ backgroundColor: sideColor(side.polityId) }}
                  />
                  {side.name[locale]}
                </li>
              ))}
            </ul>
          )}

          {battle && (
            <button
              type="button"
              onClick={() => setPanelOpen(!panelOpen)}
              aria-expanded={panelOpen}
              aria-controls={panelId}
              aria-label={panelLabel}
              title={panelLabel}
              className={`${HEADER_BUTTON} hidden lg:flex`}
            >
              <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
                <path
                  fillRule="evenodd"
                  d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 2h-9Zm-.2 1.5c0-.11.09-.2.2-.2h5.7v9.4H3.5a.2.2 0 0 1-.2-.2v-9Z"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("battle.viewer.close")}
            aria-keyshortcuts="Escape"
            title={t("battle.viewer.close")}
            data-battle-close
            className={HEADER_BUTTON}
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
              <path d="M4.2 3a.85.85 0 0 0-1.2 1.2L6.8 8 3 11.8A.85.85 0 1 0 4.2 13L8 9.2l3.8 3.8a.85.85 0 0 0 1.2-1.2L9.2 8 13 4.2A.85.85 0 0 0 11.8 3L8 6.8 4.2 3Z" />
            </svg>
          </button>
        </header>

        {battle ? (
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="flex min-w-0 shrink-0 flex-col lg:min-h-0 lg:flex-1">
              {/* On a phone the scene takes the upper part of the screen and
                  the panel scrolls below it. */}
              <div className="relative h-[42dvh] min-h-52 lg:h-auto lg:min-h-0 lg:flex-1">
                <BattleScene battle={battle} unitTypes={unitTypes} introFromAbove />
              </div>
              <ControlBar battle={battle} playback={playback} />
            </div>

            <aside
              id={panelId}
              aria-label={t("battle.viewer.panel")}
              className={`min-h-0 flex-1 flex-col border-t border-line lg:w-[22.5rem] lg:flex-none lg:border-t-0 lg:border-l ${
                panelOpen ? "flex" : "flex lg:hidden"
              }`}
            >
              <div
                role="tablist"
                aria-label={t("battle.viewer.tabs")}
                onKeyDown={handleTabKeys}
                className="flex shrink-0 border-b border-line"
              >
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`${panelId}-tab-${id}`}
                    aria-selected={tab === id}
                    aria-controls={`${panelId}-${id}`}
                    tabIndex={tab === id ? 0 : -1}
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
              {/* `relative`: keeps screen-reader-only text inside this scroller.
                  Keyed by tab: the story scrolls itself to the phase under
                  way, and the info must not open at that scroll position. */}
              <div
                key={tab}
                role="tabpanel"
                id={`${panelId}-${tab}`}
                aria-labelledby={`${panelId}-tab-${tab}`}
                className="relative min-h-0 flex-1 overflow-y-auto p-3"
              >
                {tab === "story" ? (
                  <StoryPanel battle={battle} onPhase={playback.goToPhase} />
                ) : (
                  <InfoPanel battle={battle} />
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 place-items-center px-6 text-center text-sm">
            {load.status === "loading" ? (
              <p role="status" className="text-muted">
                {t("battle.viewer.loading")}
              </p>
            ) : (
              <div role="alert" className="space-y-3">
                <p>{t("battle.viewer.error")}</p>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="rounded-md border border-line px-3 py-1.5 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {t("battle.viewer.close")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
