"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { TutorPanel, type TutorStatus } from "../tutor/TutorPanel";
import { EventPanel } from "./EventPanel";

export type SidePanelTab = "events" | "tutor";

const TABS: { id: SidePanelTab; label: "events.heading" | "tutor.heading" }[] = [
  { id: "events", label: "events.heading" },
  { id: "tutor", label: "tutor.heading" },
];

interface SidePanelProps {
  tab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
}

/**
 * Right-hand column with full-height segmented tabs (Events | AI tutor) on
 * both desktop and mobile. Events renders a pinned detail card above a compact
 * chronological list; AI tutor gets full height with an indicator dot when an
 * answer arrives while reading Events. Selecting an event from the map or
 * timeline switches back to Events; selecting an event from a Tutor map link
 * keeps the Tutor tab open and marks Events with an indicator dot.
 */
export function SidePanel({ tab, onTabChange }: SidePanelProps) {
  const { t } = useT();
  const focusRequest = useAppStore((state) => state.focusRequest);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorUnread, setTutorUnread] = useState(false);
  const [eventsNotice, setEventsNotice] = useState(false);
  const lastSeenAnnouncementRef = useRef<number | null>(null);
  const prevFocusRequestRef = useRef(focusRequest);
  /** True while a selectEvent call originated from a Tutor map link button. */
  const fromTutorLinkRef = useRef(false);
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const handleTabSelect = useCallback(
    (next: SidePanelTab) => {
      onTabChange(next);
      if (next === "tutor") setTutorUnread(false);
      else setEventsNotice(false);
    },
    [onTabChange],
  );

  // React to event selections made while the user is on the Tutor tab:
  // - from map or timeline -> switch to Events so the user sees what they clicked;
  // - from a map link inside a Tutor answer -> stay on Tutor and mark Events.
  useEffect(() => {
    if (focusRequest === prevFocusRequestRef.current) return;
    prevFocusRequestRef.current = focusRequest;
    const fromTutor = fromTutorLinkRef.current;
    fromTutorLinkRef.current = false;
    if (selectedEventId === null || tabRef.current !== "tutor") return;

    queueMicrotask(() => {
      if (fromTutor) setEventsNotice(true);
      else handleTabSelect("events");
    });
  }, [focusRequest, selectedEventId, handleTabSelect]);

  const handleMapLinkEventSelect = useCallback(() => {
    fromTutorLinkRef.current = true;
  }, []);

  const handleStatusChange = useCallback((status: TutorStatus) => {
    setTutorBusy(status.busy);

    if (
      status.lastAnnouncementId !== null &&
      status.lastAnnouncementId !== lastSeenAnnouncementRef.current
    ) {
      lastSeenAnnouncementRef.current = status.lastAnnouncementId;
      if (tabRef.current !== "tutor") setTutorUnread(true);
    }
  }, []);

  const handleTabKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((item) => item.id === tab);
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index + TABS.length - 1) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    const target = TABS[next].id;
    handleTabSelect(target);
    document.getElementById(`panel-tab-${target}`)?.focus();
  };

  return (
    <>
      <div className="shrink-0 border-b border-line/80 px-3 py-2">
        <div
          role="tablist"
          aria-label={t("panel.tabs")}
          onKeyDown={handleTabKeys}
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface/85 p-1"
        >
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            const showTutorDot = id === "tutor" && !active && (tutorBusy || tutorUnread);
            const showEventsDot = id === "events" && !active && eventsNotice;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`panel-tab-${id}`}
                aria-selected={active}
                aria-controls={`panel-${id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => handleTabSelect(id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  active
                    ? "bg-background text-foreground shadow-xs ring-1 ring-line/70"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>{t(label)}</span>
                {showTutorDot && (
                  <>
                    <span
                      aria-hidden
                      className={`size-2 rounded-full bg-accent ${
                        tutorBusy ? "motion-safe:animate-pulse" : ""
                      }`}
                    />
                    <span className="sr-only">
                      ({t(tutorBusy ? "tutor.answering" : "tutor.unread")})
                    </span>
                  </>
                )}
                {showEventsDot && (
                  <>
                    <span aria-hidden className="size-2 rounded-full bg-accent" />
                    <span className="sr-only">({t("events.selectedNotice")})</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="panel-events"
        role="tabpanel"
        aria-labelledby="panel-tab-events"
        className={`min-h-0 flex-1 flex-col ${tab === "events" ? "flex" : "hidden"}`}
      >
        <EventPanel />
      </div>

      <div
        id="panel-tutor"
        role="tabpanel"
        aria-labelledby="panel-tab-tutor"
        className={`min-h-0 flex-1 flex-col ${tab === "tutor" ? "flex" : "hidden"}`}
      >
        <TutorPanel
          onRequestOpen={() => handleTabSelect("tutor")}
          onStatusChange={handleStatusChange}
          onMapLinkEventSelect={handleMapLinkEventSelect}
        />
      </div>
    </>
  );
}
