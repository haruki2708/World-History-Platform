"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Battle, phaseAt } from "@/lib/battle";
import { useAppStore } from "@/store/useAppStore";

export const PLAYBACK_SPEEDS = [1, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/**
 * How far past a phase boundary a jump lands. Battle time k is the END of
 * phase k (see phaseAt), so a jump to "the start of phase k + 1" lands a
 * hair after it: the scene looks the same, and the narration is already that
 * of the phase about to play.
 */
const INTO_PHASE = 0.001;
/** Further into a phase than this, "previous" goes back to its start first. */
const RESTART_AFTER = 0.08;
/** A frame longer than this (a hidden tab) does not count in full. */
const MAX_FRAME_SECONDS = 0.25;

/** Battle time at which phase `index` (0-based) starts. */
export function phaseStartTime(index: number): number {
  return index <= 0 ? 0 : index + INTO_PHASE;
}

export interface Playback {
  playing: boolean;
  speed: PlaybackSpeed;
  /** Plays or pauses; at the end of the battle, plays again from the start. */
  toggle: () => void;
  /** Moves to a battle time by hand; playback pauses. */
  seek: (time: number) => void;
  /** To the start of the next (1) or the previous (-1) phase. */
  step: (direction: 1 | -1) => void;
  /** To the start of phase `index` (0-based). */
  goToPhase: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

/**
 * The battle clock of the viewer: the only writer of `battleTime` in the main
 * app. Each phase takes its own `playSeconds` at normal speed.
 */
export function usePlayback(battle: Battle | null): Playback {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const setTime = useAppStore((state) => state.setBattleTime);
  const end = battle?.phases.length ?? 0;

  useEffect(() => {
    if (!playing || !battle) return;
    const phases = battle.phases;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const seconds = Math.min((now - last) / 1000, MAX_FRAME_SECONDS) * speed;
      last = now;
      const current = useAppStore.getState().battleTime;
      const phase = phases[Math.min(Math.floor(current), phases.length - 1)];
      const next = current + seconds / Math.max(phase.playSeconds, 0.001);
      if (next >= phases.length) {
        setTime(phases.length);
        setPlaying(false);
        return;
      }
      setTime(next);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, battle, setTime]);

  const toggle = useCallback(() => {
    if (!battle) return;
    if (!playing && useAppStore.getState().battleTime >= end) setTime(0);
    setPlaying(!playing);
  }, [battle, playing, end, setTime]);

  const seek = useCallback(
    (time: number) => {
      setPlaying(false);
      setTime(Math.min(Math.max(time, 0), end));
    },
    [end, setTime],
  );

  const goToPhase = useCallback(
    (index: number) => {
      if (!battle) return;
      setTime(phaseStartTime(Math.min(Math.max(index, 0), end - 1)));
    },
    [battle, end, setTime],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      if (!battle) return;
      const time = Math.min(useAppStore.getState().battleTime, end);
      const current = phaseAt(battle, time) - 1;
      if (direction === 1) {
        // From the last phase, "next" is the end of the battle.
        setTime(current + 1 < end ? phaseStartTime(current + 1) : end);
      } else {
        const start = phaseStartTime(current);
        setTime(time - start > RESTART_AFTER ? start : phaseStartTime(current - 1));
      }
    },
    [battle, end, setTime],
  );

  return useMemo(
    () => ({ playing, speed, toggle, seek, step, goToPhase, setSpeed }),
    [playing, speed, toggle, seek, step, goToPhase],
  );
}
