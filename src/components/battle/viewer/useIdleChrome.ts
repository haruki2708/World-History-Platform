"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Milliseconds of pointer inactivity during playback before overlays fade out. */
const DEFAULT_IDLE_MS = 3000;
/** Minimum gap between timer resets on continuous pointer movement. */
const MOVE_THROTTLE_MS = 180;

/**
 * Tracks whether the battle viewer chrome should fade out during playback.
 *
 * - Never hides while paused.
 * - Fades after `delayMs` of pointer and keyboard inactivity while playing.
 * - Wakes immediately on pointer movement, pointer press, wheel or key press.
 * - Stays visible while keyboard focus (`:focus-visible`) rests inside an
 *   overlay control (e.g. tabbing through buttons or scrubbing by keyboard),
 *   without blocking auto-fade after pressing Space or clicking Play.
 * - Uses a single timeout (never requestAnimationFrame) and avoids React
 *   re-renders while chrome is already visible.
 */
export function useIdleChrome(
  playing: boolean,
  dialogRef: RefObject<HTMLDialogElement | null>,
  delayMs = DEFAULT_IDLE_MS,
): boolean {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<number | null>(null);
  const focusPinnedRef = useRef(false);
  const lastMoveResetRef = useRef(0);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!playing) {
      clearTimer();
      focusPinnedRef.current = false;
      queueMicrotask(() => setIdle(false));
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) return;

    const isKeyboardFocusInOverlay = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (!target.closest("[data-battle-overlay]")) return false;
      try {
        return target.matches(":focus-visible");
      } catch {
        return false;
      }
    };

    const armTimer = () => {
      clearTimer();
      if (focusPinnedRef.current) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (!focusPinnedRef.current) setIdle(true);
      }, delayMs);
    };

    const wake = () => {
      setIdle(false);
      armTimer();
    };

    const onPointerMove = () => {
      const now = performance.now();
      if (timerRef.current !== null && now - lastMoveResetRef.current < MOVE_THROTTLE_MS) {
        // Still wake immediately if currently hidden.
        setIdle((prev) => (prev ? false : prev));
        return;
      }
      lastMoveResetRef.current = now;
      wake();
    };

    const onPointerDown = () => {
      // Returning to mouse/touch unpins keyboard focus lock.
      focusPinnedRef.current = false;
      lastMoveResetRef.current = performance.now();
      wake();
    };

    const onWheel = () => {
      lastMoveResetRef.current = performance.now();
      wake();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      lastMoveResetRef.current = performance.now();
      if (event.key === " ") {
        // Pressing Space to play/pause should not pin the controls open.
        focusPinnedRef.current = false;
      }
      wake();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isKeyboardFocusInOverlay(event.target)) {
        focusPinnedRef.current = true;
        clearTimer();
        setIdle(false);
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (!isKeyboardFocusInOverlay(event.relatedTarget)) {
        focusPinnedRef.current = false;
        armTimer();
      }
    };

    // Start the countdown when playback begins (unless keyboard focus is already pinned).
    if (document.activeElement && isKeyboardFocusInOverlay(document.activeElement)) {
      // Initial focus on Play should not block auto-fade after clicking Play or pressing Space.
      const onPlay = document.activeElement.closest("[data-battle-play]") !== null;
      focusPinnedRef.current = !onPlay;
    } else {
      focusPinnedRef.current = false;
    }
    armTimer();

    dialog.addEventListener("pointermove", onPointerMove, { passive: true });
    dialog.addEventListener("pointerdown", onPointerDown, { passive: true });
    dialog.addEventListener("wheel", onWheel, { passive: true });
    dialog.addEventListener("focusin", onFocusIn);
    dialog.addEventListener("focusout", onFocusOut);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimer();
      dialog.removeEventListener("pointermove", onPointerMove);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("wheel", onWheel);
      dialog.removeEventListener("focusin", onFocusIn);
      dialog.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [playing, dialogRef, delayMs]);

  return playing && idle;
}
