"use client";

import { useT } from "@/lib/i18n/useT";

/**
 * Covers the page while the code of the battle viewer is on its way. Kept
 * apart from the viewer so that the main page can show it without loading
 * three.js.
 */
export function BattleViewerLoading() {
  const { t } = useT();
  return (
    <div
      role="status"
      className="fixed inset-0 z-50 grid place-items-center bg-background/90 px-6 text-center text-sm text-foreground"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line/80 bg-background/95 px-6 py-4 shadow-xl">
        <span aria-hidden className="size-2.5 rounded-full bg-accent" />
        <span className="font-medium text-muted">{t("battle.viewer.loading")}</span>
      </div>
    </div>
  );
}
