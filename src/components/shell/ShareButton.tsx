"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { Modal } from "./Modal";
import { buildShareUrl } from "./urlState";

/** How long the "Link copied" note stays up. */
const COPIED_NOTE_MS = 2000;

/**
 * Copies a link to the current view (year, selected event, language) to the
 * clipboard. If the browser refuses, shows the link in a dialog so it can be
 * copied by hand.
 */
export function ShareButton() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async () => {
    // Built from the store, not the address bar, so it is right even while
    // the address bar is still waiting for the year to settle.
    const { year, selectedEventId, locale } = useAppStore.getState();
    const url = buildShareUrl({ year, eventId: selectedEventId, locale });
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
    } catch {
      clearTimeout(timer.current);
      setCopied(false);
      setManualUrl(url);
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_NOTE_MS);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={share}
        className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-sm text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.6 9.4a3 3 0 0 0 4.3 0l2.2-2.2a3 3 0 0 0-4.3-4.3l-.8.8" />
          <path d="M9.4 6.6a3 3 0 0 0-4.3 0L2.9 8.8a3 3 0 0 0 4.3 4.3l.8-.8" />
        </svg>
        {t("share.button")}
      </button>

      {/* Always in the DOM so screen readers pick up the change. */}
      <p
        role="status"
        className={`pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md transition-opacity ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        {copied ? t("share.copied") : ""}
      </p>

      <Modal
        open={manualUrl !== null}
        onClose={() => setManualUrl(null)}
        title={t("share.manual.title")}
        closeLabel={t("share.close")}
      >
        <ManualCopy url={manualUrl ?? ""} />
      </Modal>
    </div>
  );
}

function ManualCopy({ url }: { url: string }) {
  const { t } = useT();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{t("share.manual.hint")}</p>
      <input
        // The dialog focuses this when it opens; focusing selects the link,
        // ready for Ctrl+C / Cmd+C.
        data-autofocus
        type="text"
        readOnly
        value={url}
        aria-label={t("share.manual.label")}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-foreground focus-visible:border-accent focus-visible:outline-none"
      />
    </div>
  );
}
