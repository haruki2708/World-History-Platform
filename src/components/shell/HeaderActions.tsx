"use client";

import { LocaleSwitch } from "../LocaleSwitch";
import { ShareButton } from "./ShareButton";
import { ShortcutsHelp } from "./ShortcutsHelp";

/** The right-hand side of the header: shortcuts hint, share, language. */
export function HeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <ShortcutsHelp />
      <ShareButton />
      <LocaleSwitch />
    </div>
  );
}
