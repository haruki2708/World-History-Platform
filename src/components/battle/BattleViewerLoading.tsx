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
      className="fixed inset-0 z-50 grid place-items-center bg-background/90 px-6 text-center text-sm text-muted"
    >
      {t("battle.viewer.loading")}
    </div>
  );
}
