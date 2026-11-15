"use client";

import { useCallback, useEffect, useState } from "react";
import { YEAR_MAX, YEAR_MIN } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

export const PLAYBACK_SPEEDS = [5, 10, 20, 50] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Longest frame we count, so returning to a background tab does not jump. */
const MAX_FRAME_MS = 100;

/**
 * Advances the store's `year` at `yearsPerSecond` while playing. Stops by
 * itself at the end of the range, and pauses as soon as anything else moves
 * the year or selects an event (a drag, a click in the panel, on the map or on
 * a tutor link), so the user stays where they went. This watches the store
 * only, so other parts of the app need no access to playback.
 */
export function usePlayback(yearsPerSecond: PlaybackSpeed) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    let last: number | null = null;
    // The year playback itself last wrote; any other year came from outside.
    let expected = useAppStore.getState().year;
    // Fractional year, so slow speeds still advance smoothly between frames.
    let position = expected;

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      const selected =
        state.selectedEventId !== null &&
        state.selectedEventId !== previous.selectedEventId;
      if (state.year !== expected || selected) setPlaying(false);
    });

    const advanceTo = (year: number) => {
      // Set before writing: the store notifies subscribers synchronously.
      expected = year;
      useAppStore.getState().setYear(year);
    };

    const tick = (now: number) => {
      if (last !== null) {
        position += (yearsPerSecond * Math.min(now - last, MAX_FRAME_MS)) / 1000;
      }
      last = now;

      if (position >= YEAR_MAX) {
        advanceTo(YEAR_MAX);
        setPlaying(false);
        return;
      }
      const next = Math.floor(position);
      if (next !== expected) advanceTo(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [playing, yearsPerSecond]);

  const pause = useCallback(() => setPlaying(false), []);

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    const { year, setYear } = useAppStore.getState();
    // Pressing play at the end starts over.
    if (year >= YEAR_MAX) setYear(YEAR_MIN);
    setPlaying(true);
  }, [playing]);

  return { playing, toggle, pause };
}
