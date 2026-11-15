"use client";

import { Fragment } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/useT";
import { YEAR_MAX, YEAR_MIN, formatYear } from "@/lib/years";
import { useEscapeLeavesField, useShortcuts } from "./keyboard";
import { Modal } from "./Modal";

/** A key cap, or a joiner between keys ("+" for a combination, "/" for either). */
type Token = { key: string } | { label: MessageKey } | { join: "+" | "/" };

const ROWS: { keys: Token[]; description: MessageKey }[] = [
  { keys: [{ label: "shortcuts.key.space" }], description: "shortcuts.playPause" },
  { keys: [{ key: "←" }, { join: "/" }, { key: "→" }], description: "shortcuts.step" },
  {
    keys: [{ key: "Shift" }, { join: "+" }, { key: "←" }, { join: "/" }, { key: "→" }],
    description: "shortcuts.stepBig",
  },
  { keys: [{ key: "Home" }, { join: "/" }, { key: "End" }], description: "shortcuts.ends" },
  { keys: [{ key: "/" }], description: "shortcuts.ask" },
  { keys: [{ key: "Esc" }], description: "shortcuts.leave" },
  { keys: [{ key: "?" }], description: "shortcuts.help" },
];

const KBD_CLASS =
  "inline-flex min-w-6 items-center justify-center rounded border border-line border-b-2 bg-surface px-1.5 py-px font-sans text-xs font-medium text-foreground";

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The small "?" button in the header that hints at the shortcuts, and the
 * dialog listing them. Also owns the `?` and Esc-leaves-a-field shortcuts.
 * The open state lives with the caller, so other dialogs (About) can open it.
 */
export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  const { t, locale } = useT();
  const setOpen = onOpenChange;

  useEscapeLeavesField();
  useShortcuts((event) => {
    if (event.key !== "?" || event.repeat) return false;
    setOpen(true);
    return true;
  });

  const describe = (key: MessageKey) =>
    t(key)
      .replace("{start}", formatYear(YEAR_MIN, locale))
      .replace("{end}", formatYear(YEAR_MAX, locale));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("shortcuts.title")}
        aria-keyshortcuts="?"
        title={t("shortcuts.hint")}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <kbd aria-hidden className={KBD_CLASS}>
          ?
        </kbd>
        <span aria-hidden className="hidden md:inline">
          {t("shortcuts.button")}
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("shortcuts.title")}
        closeLabel={t("shortcuts.close")}
      >
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2.5 text-sm">
          {ROWS.map((row) => (
            <Fragment key={row.description}>
              <dt className="flex flex-wrap items-center gap-1 text-xs text-muted">
                {row.keys.map((token, index) =>
                  "join" in token ? (
                    <span key={index} aria-hidden>
                      {token.join}
                    </span>
                  ) : (
                    <kbd key={index} className={KBD_CLASS}>
                      {"key" in token ? token.key : t(token.label)}
                    </kbd>
                  ),
                )}
              </dt>
              <dd>{describe(row.description)}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
          {t("shortcuts.note")}
        </p>
      </Modal>
    </>
  );
}
