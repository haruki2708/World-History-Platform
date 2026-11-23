"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useT } from "@/lib/i18n/useT";
import { TutorPanel, type TutorStatus } from "../tutor/TutorPanel";
import { EventPanel } from "./EventPanel";
import { usePanelVariant } from "./panelVariant";

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
 * Right-hand column combining Events and AI Tutor.
 * Prototype switch for T-064 round 1 (select with ?panel=A|B|C):
 * - A: Adaptive vertical split — Events takes ~70% while Tutor stays a compact
 *      dock at the bottom, and Tutor expands when the user asks a question.
 * - B: Full-height segmented tabs (Events | AI tutor) on desktop and mobile,
 *      with an indicator dot when the tutor answers while on the Events tab.
 * - C: Dedicated selected-event spotlight card pinned above a compact
 *      chronological index, paired with the full-height desktop tab bar.
 */
export function SidePanel({ tab, onTabChange }: SidePanelProps) {
  const { t } = useT();
  const variant = usePanelVariant();
  const [tutorExpanded, setTutorExpanded] = useState(false);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [tutorUnread, setTutorUnread] = useState(false);
  const prevHasMessagesRef = useRef(false);
  const lastSeenAnnouncementRef = useRef<number | null>(null);
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const isDesktopTabs = variant === "B" || variant === "C";

  const handleTabSelect = useCallback(
    (next: SidePanelTab) => {
      onTabChange(next);
      if (next === "tutor") setTutorUnread(false);
    },
    [onTabChange],
  );

  const handleStatusChange = useCallback((status: TutorStatus) => {
    setTutorBusy(status.busy);

    // Variants A & C: automatically expand when the first message is sent, and
    // collapse back to the dock when the conversation is cleared.
    if (status.hasMessages && !prevHasMessagesRef.current) {
      setTutorExpanded(true);
    } else if (!status.hasMessages && prevHasMessagesRef.current) {
      setTutorExpanded(false);
    }
    prevHasMessagesRef.current = status.hasMessages;

    // Variant B / mobile: mark Tutor tab unread when an answer finishes while
    // the user is viewing the Events tab.
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

  // Compact dock applies on desktop in Variants A & C while collapsed.
  const compactTutor = !isDesktopTabs && !tutorExpanded;

  return (
    <>
      <div
        className={`shrink-0 border-b border-line/80 px-3 py-2 ${
          isDesktopTabs ? "block" : "block lg:hidden"
        }`}
      >
        <div
          role="tablist"
          aria-label={t("panel.tabs")}
          onKeyDown={handleTabKeys}
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface/85 p-1"
        >
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            const showDot = id === "tutor" && !active && (tutorBusy || tutorUnread);
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
                {showDot && (
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
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="panel-events"
        role="tabpanel"
        aria-labelledby="panel-tab-events"
        className={`min-h-0 flex-1 flex-col ${
          isDesktopTabs
            ? tab === "events"
              ? "flex"
              : "hidden"
            : `${tab === "events" ? "flex" : "hidden"} lg:flex ${
                tutorExpanded ? "lg:flex-[2]" : "lg:flex-1"
              }`
        }`}
      >
        <EventPanel variant={variant} hideHeading={isDesktopTabs} />
      </div>

      <div
        id="panel-tutor"
        role="tabpanel"
        aria-labelledby="panel-tab-tutor"
        className={`min-h-0 flex-col ${
          isDesktopTabs
            ? tab === "tutor"
              ? "flex flex-1"
              : "hidden"
            : `${tab === "tutor" ? "flex flex-1" : "hidden"} lg:flex ${
                tutorExpanded ? "lg:flex-[3]" : "lg:flex-none"
              }`
        }`}
      >
        <TutorPanel
          compact={compactTutor}
          hideHeading={isDesktopTabs}
          expanded={isDesktopTabs ? undefined : tutorExpanded}
          onToggleExpand={
            isDesktopTabs ? undefined : () => setTutorExpanded((open) => !open)
          }
          onRequestOpen={isDesktopTabs ? () => handleTabSelect("tutor") : undefined}
          onStatusChange={handleStatusChange}
        />
      </div>
    </>
  );
}
