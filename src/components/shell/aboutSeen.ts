"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether this browser has seen the About dialog, or dismissed the first-visit
 * hint that points to it. Kept in localStorage; when storage is unavailable
 * the flag lives in memory for this page only, so the hint simply shows again
 * on the next visit.
 */
const STORAGE_KEY = "whp.aboutSeen";

const listeners = new Set<() => void>();
/** Cached value; null until first read (or after another tab changed it). */
let seen: boolean | null = null;

function read(): boolean {
  if (seen === null) {
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }
  }
  return seen;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Dismissing the hint in one tab hides it in the others.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    seen = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function markAboutSeen(): void {
  if (seen === true) return;
  seen = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Private mode, blocked site data, quota: remembered for this page only.
  }
  for (const listener of listeners) listener();
}

/**
 * True once the user has opened About or dismissed the hint. The server
 * render (and hydration) assume "seen", so the hint never flashes in and out
 * for returning visitors; it appears right after hydration for new ones.
 */
export function useAboutSeen(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}
