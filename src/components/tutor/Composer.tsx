"use client";

import { useId, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { getEvent } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { TUTOR_LIMITS } from "@/lib/tutor";
import { formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

interface ComposerProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  busy: boolean;
  atLimit: boolean;
  deep: boolean;
  onDeepChange: (deep: boolean) => void;
  onSend: (question: string) => void;
  onStop: () => void;
  onReset: () => void;
}

/** Shows the counter once the question passes this share of the limit. */
const COUNTER_FROM = 0.8;

export function Composer({
  inputRef,
  busy,
  atLimit,
  deep,
  onDeepChange,
  onSend,
  onStop,
  onReset,
}: ComposerProps) {
  const { t } = useT();
  const [draft, setDraft] = useState("");
  const hintId = useId();
  const deepNoteId = useId();

  const canSend = draft.trim() !== "" && !busy && !atLimit;

  const submit = () => {
    if (!canSend) return;
    onSend(draft);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) onStop();
    else submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter (and Enter that confirms an IME composition,
    // as Vietnamese input methods use) inserts a new line as usual.
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.nativeEvent.keyCode !== 229
    ) {
      event.preventDefault();
      submit();
    }
  };

  const showCounter = draft.length >= TUTOR_LIMITS.maxQuestionChars * COUNTER_FROM;

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 space-y-1.5 border-t border-line/75 bg-background px-3 py-2.5"
    >
      {atLimit && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-surface px-3 py-2 text-sm">
          <p className="min-w-0 flex-1">{t("tutor.limit")}</p>
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-on-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("tutor.new")}
          </button>
        </div>
      )}

      <ContextLine />

      <div className="flex items-end gap-1.5 rounded-xl border border-line bg-surface/45 p-1 pl-3 transition-colors focus-within:border-accent focus-within:bg-background">
        <label className="sr-only" htmlFor={`${hintId}-input`}>
          {t("tutor.input.label")}
        </label>
        <textarea
          ref={inputRef}
          id={`${hintId}-input`}
          rows={1}
          value={draft}
          maxLength={TUTOR_LIMITS.maxQuestionChars}
          placeholder={t("tutor.input.placeholder")}
          aria-describedby={hintId}
          aria-keyshortcuts="/"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          className="field-sizing-content max-h-28 min-h-8 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm placeholder:text-muted focus-visible:outline-none"
        />
        {busy ? (
          <button
            type="submit"
            aria-label={t("tutor.stop")}
            title={t("tutor.stop")}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent text-accent hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
              <rect x="3" y="3" width="10" height="10" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            aria-label={t("tutor.send")}
            title={t("tutor.send")}
            // aria-disabled rather than disabled, so focus is never dropped.
            aria-disabled={!canSend}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-on-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-35"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
              <path d="M8 2.2a.9.9 0 0 1 .64.26l4.5 4.5a.9.9 0 1 1-1.28 1.28L8.9 5.28V13a.9.9 0 1 1-1.8 0V5.28L4.14 8.24a.9.9 0 0 1-1.28-1.28l4.5-4.5A.9.9 0 0 1 8 2.2Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={deep}
            aria-describedby={deepNoteId}
            title={t("tutor.deep.note")}
            onClick={() => onDeepChange(!deep)}
            className="group flex shrink-0 items-center gap-1.5 rounded-md py-0.5 font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span
              aria-hidden
              className={`relative h-3.5 w-6.5 rounded-full transition-colors ${
                deep ? "bg-accent" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-2.5 rounded-full bg-background shadow-xs transition-transform motion-reduce:transition-none ${
                  deep ? "translate-x-3" : ""
                }`}
              />
            </span>
            {t("tutor.deep")}
          </button>
          <span id={deepNoteId} className="truncate">
            {t("tutor.deep.note")}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span id={hintId} className="hidden sm:inline">
            {t("tutor.input.hint")}
          </span>
          {showCounter && (
            <span
              className={`tabular-nums ${
                draft.length >= TUTOR_LIMITS.maxQuestionChars ? "font-semibold text-accent" : ""
              }`}
            >
              {t("tutor.chars")
                .replace("{count}", String(draft.length))
                .replace("{max}", String(TUTOR_LIMITS.maxQuestionChars))}
            </span>
          )}
        </span>
      </div>
    </form>
  );
}

/** What will be sent along with the next question. */
function ContextLine() {
  const { t, locale } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const event = selectedEventId ? getEvent(selectedEventId) : undefined;

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
      <span className="shrink-0">{t("tutor.context.label")}:</span>
      <span className="shrink-0 rounded-full border border-line/80 bg-surface/75 px-2 py-px font-medium text-foreground tabular-nums">
        {formatYear(year, locale)}
      </span>
      {event && (
        <span className="min-w-0 truncate rounded-full border border-line/80 bg-surface/75 px-2 py-px font-medium text-foreground">
          {event.title[locale]}
        </span>
      )}
      <span className="shrink-0">+ {t("tutor.context.mapView")}</span>
    </p>
  );
}
