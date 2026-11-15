"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { LocaleSwitch } from "../LocaleSwitch";
import { AboutDialog } from "./AboutDialog";
import { markAboutSeen, useAboutSeen } from "./aboutSeen";
import { FirstVisitHint } from "./FirstVisitHint";
import { ShareButton } from "./ShareButton";
import { ShortcutsHelp } from "./ShortcutsHelp";

/**
 * The right-hand side of the header: first-visit hint, About, shortcuts,
 * share, language. Owns which dialog is open, so About can open the
 * shortcuts list on top of itself.
 */
export function HeaderActions() {
  const { t } = useT();
  const seen = useAboutSeen();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const aboutButton = useRef<HTMLButtonElement>(null);

  const openAbout = () => {
    markAboutSeen();
    setAboutOpen(true);
  };

  const dismissHint = () => {
    markAboutSeen();
    // The dismiss button disappears; keep keyboard focus nearby.
    aboutButton.current?.focus();
  };

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      {!seen && <FirstVisitHint onOpen={openAbout} onDismiss={dismissHint} />}
      <button
        ref={aboutButton}
        type="button"
        onClick={openAbout}
        aria-label={t("about.button")}
        title={t("about.button")}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 7.25v4" />
          <circle cx="8" cy="4.9" r="0.4" fill="currentColor" />
        </svg>
        <span aria-hidden className="hidden md:inline">
          {t("about.button")}
        </span>
      </button>
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <ShareButton />
      <LocaleSwitch />

      <AboutDialog
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
    </div>
  );
}
