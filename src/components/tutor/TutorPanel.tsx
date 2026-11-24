"use client";

import { useEffect, useRef, useState } from "react";
import { getEvent } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";
import { useShortcuts } from "../shell/keyboard";
import { ChatEntryView } from "./ChatEntryView";
import { Composer } from "./Composer";
import { useTutorChat } from "./useTutorChat";

/** Within this many px of the bottom counts as "following" the answer. */
const STICK_THRESHOLD_PX = 48;

export interface TutorStatus {
  hasMessages: boolean;
  busy: boolean;
  lastAnnouncementId: number | null;
}

interface TutorPanelProps {
  /** Called on "/" when the tutor tab is inactive on desktop. */
  onRequestOpen?: () => void;
  /** Reports conversation state up to SidePanel (unread / answering dot). */
  onStatusChange?: (status: TutorStatus) => void;
  /** Called right before a map link button selects an event in the store. */
  onMapLinkEventSelect?: () => void;
}

/**
 * The AI tutor chat. Each question carries a snapshot of what the user is
 * looking at (year, map view, selected event, language), taken from
 * `useAppStore` when it is sent. The conversation lives in this component
 * only and talks to the server through the contract in src/lib/tutor.ts.
 */
export function TutorPanel({
  onRequestOpen,
  onStatusChange,
  onMapLinkEventSelect,
}: TutorPanelProps) {
  const { t } = useT();
  const chat = useTutorChat();
  const [deep, setDeep] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const pendingFocusRef = useRef(false);

  const hasMessages = chat.entries.length > 0;
  const lastAnnouncementId = chat.announcement?.id ?? null;

  useEffect(() => {
    onStatusChange?.({ hasMessages, busy: chat.busy, lastAnnouncementId });
  }, [hasMessages, chat.busy, lastAnnouncementId, onStatusChange]);

  // "/" jumps to the question box. On desktop, pressing "/" while viewing
  // Events switches to the Tutor tab and focuses the input. On narrow screens
  // the shortcut only applies when the Tutor tab is already open.
  useShortcuts((event) => {
    if (event.key !== "/") return false;
    const input = inputRef.current;
    input?.focus();
    if (input !== null && document.activeElement === input) return true;
    if (onRequestOpen && window.innerWidth >= 1024) {
      pendingFocusRef.current = true;
      onRequestOpen();
      requestAnimationFrame(() => {
        if (pendingFocusRef.current) {
          pendingFocusRef.current = false;
          inputRef.current?.focus();
        }
      });
      return true;
    }
    return false;
  });

  // Follow new text unless the user has scrolled up to read. The empty state
  // (intro and suggestions) stays scrolled to the top.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (chat.entries.length === 0) list.scrollTop = 0;
    else if (stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [chat.entries]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    stickToBottom.current =
      list.scrollHeight - list.scrollTop - list.clientHeight < STICK_THRESHOLD_PX;
  };

  const send = (question: string) => {
    stickToBottom.current = true;
    chat.send(question, deep ? "deep" : "standard");
  };

  const reset = () => {
    chat.reset();
    inputRef.current?.focus();
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {hasMessages && (
        <div className="flex shrink-0 items-center justify-end px-4 pt-2.5 pb-1.5">
          <button
            type="button"
            onClick={reset}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
              <path d="M8 2.5a.9.9 0 0 1 .9.9v3.7h3.7a.9.9 0 1 1 0 1.8H8.9v3.7a.9.9 0 1 1-1.8 0V8.9H3.4a.9.9 0 1 1 0-1.8h3.7V3.4a.9.9 0 0 1 .9-.9Z" />
            </svg>
            {t("tutor.new")}
          </button>
        </div>
      )}

      <div
        ref={listRef}
        onScroll={handleScroll}
        className={`min-h-0 flex-1 overflow-y-auto px-4 pb-3 ${hasMessages ? "" : "pt-3"}`}
      >
        {!hasMessages ? (
          <Suggestions onPick={send} />
        ) : (
          <ol aria-label={t("tutor.messages")} className="space-y-4">
            {chat.entries.map((entry, index) => (
              <ChatEntryView
                key={entry.id}
                entry={entry}
                isLast={index === chat.entries.length - 1}
                onRetry={chat.retry}
                onMapLinkEventSelect={onMapLinkEventSelect}
              />
            ))}
          </ol>
        )}
      </div>

      {/* Announce finished answers and errors once, never the stream. */}
      <div aria-live="polite" className="sr-only">
        {chat.announcement && (
          <p key={chat.announcement.id}>
            {chat.announcement.kind === "answer"
              ? `${t("tutor.answered")} ${chat.announcement.text}`
              : t(`tutor.error.${chat.announcement.code}`)}
          </p>
        )}
      </div>

      <Composer
        inputRef={inputRef}
        busy={chat.busy}
        atLimit={chat.atLimit}
        deep={deep}
        onDeepChange={setDeep}
        onSend={send}
        onStop={chat.stop}
        onReset={reset}
      />
    </section>
  );
}

/** Starter questions built from what the user is looking at right now. */
function Suggestions({ onPick }: { onPick: (question: string) => void }) {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const event = selectedEventId ? getEvent(selectedEventId) : undefined;

  const questions = [
    t("tutor.suggest.here"),
    event
      ? t("tutor.suggest.event").replace("{event}", event.title[locale])
      : t("tutor.suggest.before").replace("{year}", formatYear(year, locale)),
    t("tutor.suggest.people"),
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">{t("tutor.intro")}</p>
      <div>
        <h3 className="sr-only">{t("tutor.suggestions")}</h3>
        <ul className="space-y-2">
          {questions.map((question) => (
            <li key={question} className="min-w-0">
              <button
                type="button"
                onClick={() => onPick(question)}
                className="group flex w-full items-center justify-between gap-2 rounded-xl border border-line/85 bg-surface/55 px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:border-accent/70 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">{question}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-3.5 shrink-0 fill-current text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                >
                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
