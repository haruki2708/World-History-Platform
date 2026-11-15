"use client";

import { useCallback, useEffect, useState } from "react";
import { YEAR_MAX, YEAR_MIN } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";

export const PLAYBACK_SPEEDS = [5, 10, 20, 50] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Longest frame we count, so returning to a background tab does not jump. */
const MAX_FRAME_MS = 100;

/**
 * Advances the store's `year` at `yearsPerSecond` while playing. If something
 * else moves the year mid-play (a drag, a selected event), playback carries on
 * from the new position. Stops by itself at the end of the range.
 */
export function usePlayback(yearsPerSecond: PlaybackSpeed) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    let last: number | null = null;
    // Fractional year, so slow speeds still advance smoothly between frames.
    let position = useAppStore.getState().year;

    const tick = (now: number) => {
      const { year, setYear } = useAppStore.getState();
      if (Math.floor(position) !== year) position = year;
      if (last !== null) {
        position += (yearsPerSecond * Math.min(now - last, MAX_FRAME_MS)) / 1000;
      }
      last = now;

      if (position >= YEAR_MAX) {
        setYear(YEAR_MAX);
        setPlaying(false);
        return;
      }
      const next = Math.floor(position);
      if (next !== year) setYear(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
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
