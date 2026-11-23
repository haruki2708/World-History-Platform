"use client";

import { useEffect, useRef, useState } from "react";
import { type Battle, phaseAt } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { formatHour, phaseHours } from "./format";

/** How long a phase chapter card stays visible before fading out. */
const HOLD_MS = 3000;

interface ChapterCardProps {
  battle: Battle;
  /** True while the user is dragging the seek bar; suppresses intermediate cards. */
  scrubbing: boolean;
}

interface CardState {
  index: number;
  visible: boolean;
}

/**
 * Large decorative title card shown over the scene when the battle enters a
 * new phase (during playback, on a phase jump, or after finishing a scrub
 * onto a different phase). Subscribes only to the phase index so playback
 * ticks never trigger re-renders. Screen readers already receive phase
 * announcements from StoryPanel's live region, so this card is aria-hidden.
 */
export function ChapterCard({ battle, scrubbing }: ChapterCardProps) {
  const { t, locale } = useT();
  const phaseIndex = useAppStore((state) => phaseAt(battle, state.battleTime) - 1);
  const [card, setCard] = useState<CardState | null>(null);
  const prevPhaseRef = useRef(phaseIndex);
  const phaseBeforeScrubRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const showPhase = (index: number) => {
      clearTimer();
      queueMicrotask(() => {
        if (!cancelled) setCard({ index, visible: true });
      });
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setCard((prev) => (prev ? { ...prev, visible: false } : null));
      }, HOLD_MS);
    };

    if (scrubbing) {
      if (phaseBeforeScrubRef.current === null) {
        phaseBeforeScrubRef.current = prevPhaseRef.current;
      }
      clearTimer();
      queueMicrotask(() => {
        if (!cancelled) setCard((prev) => (prev?.visible ? { ...prev, visible: false } : prev));
      });
      prevPhaseRef.current = phaseIndex;
    } else if (phaseBeforeScrubRef.current !== null) {
      const before = phaseBeforeScrubRef.current;
      phaseBeforeScrubRef.current = null;
      prevPhaseRef.current = phaseIndex;
      if (phaseIndex !== before) showPhase(phaseIndex);
    } else if (phaseIndex !== prevPhaseRef.current) {
      prevPhaseRef.current = phaseIndex;
      showPhase(phaseIndex);
    }

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [phaseIndex, scrubbing]);

  if (!card) return null;

  const phase = battle.phases[card.index];
  if (!phase) return null;

  const hours = phaseHours(battle, card.index);
  const phaseLabel = t("battle.phase")
    .replace("{n}", String(card.index + 1))
    .replace("{total}", String(battle.phases.length));

  return (
    <div
      aria-hidden="true"
      data-battle-chapter-card
      data-visible={card.visible ? "true" : "false"}
      className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center select-none lg:inset-x-4 lg:top-[14%]"
    >
      <div
        className={`max-w-[min(32rem,100%)] rounded-2xl border border-line/85 bg-background/96 px-5 py-3.5 text-center shadow-2xl transition-[opacity,transform] ease-out motion-reduce:transform-none motion-reduce:transition-none lg:px-9 lg:py-5 ${
          card.visible
            ? "translate-y-0 scale-100 opacity-100 duration-300"
            : "-translate-y-1.5 scale-[0.98] opacity-0 duration-500"
        }`}
      >
        <div className="mx-auto mb-2.5 h-0.5 w-10 rounded-full bg-accent lg:mb-3 lg:w-12" />
        <p className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase tabular-nums lg:text-xs">
          <span className="text-accent">{phaseLabel}</span>
          <span className="text-muted/60">·</span>
          <span className="text-muted">
            {formatHour(hours.start)}–{formatHour(hours.end)}
          </span>
        </p>
        <p className="mt-1.5 text-base leading-snug font-semibold tracking-tight text-balance text-foreground lg:mt-2 lg:text-2xl lg:leading-tight">
          {phase.title[locale]}
        </p>
      </div>
    </div>
  );
}
