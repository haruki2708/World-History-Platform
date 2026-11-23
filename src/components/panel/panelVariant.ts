"use client";

import { useSyncExternalStore } from "react";

export type PanelVariant = "A" | "B" | "C";

/**
 * Temporary prototype switch for T-064 round 1.
 * Override in the browser with `?panel=A`, `?panel=B`, or `?panel=C`.
 * Unused variants will be removed once the user picks a direction.
 */
export const DEFAULT_PANEL_VARIANT: PanelVariant = "A";

const noSubscribe = () => () => {};

function readClientVariant(): PanelVariant {
  if (typeof window === "undefined") return DEFAULT_PANEL_VARIANT;
  const param = new URLSearchParams(window.location.search).get("panel")?.toUpperCase();
  if (param === "A" || param === "B" || param === "C") return param;
  return DEFAULT_PANEL_VARIANT;
}

export function usePanelVariant(): PanelVariant {
  return useSyncExternalStore(noSubscribe, readClientVariant, () => DEFAULT_PANEL_VARIANT);
}
