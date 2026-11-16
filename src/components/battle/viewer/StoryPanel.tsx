"use client";

import { useEffect, useRef } from "react";
import { type Battle, phaseAt } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { formatHour, phaseHours } from "./format";

interface StoryPanelProps {
  battle: Battle;
  /** Jumps to the start of phase `index` (0-based). */
  onPhase: (index: number) => void;
}

/**
 * The phases of the battle as a list; the one under way is open and shows
 * its narration. Follows the battle clock, but re-renders only when the
 * phase changes.
 */
export function StoryPanel({ battle, onPhase }: StoryPanelProps) {
  const { t, locale } = useT();
  const current = useAppStore((state) => phaseAt(battle, state.battleTime) - 1);
  const currentRef = useRef<HTMLLIElement>(null);
  const firstRender = useRef(true);
  const total = battle.phases.length;
  const label = (index: number) =>
    t("battle.phase").replace("{n}", String(index + 1)).replace("{total}", String(total));

  // Keep the open phase in sight as playback moves down the list.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const phase = battle.phases[current];

  return (
    <>
      <ol aria-label={t("battle.phase.list")} className="space-y-1">
        {battle.phases.map((item, index) => {
          const open = index === current;
          const hours = phaseHours(battle, index);
          return (
            <li
              key={item.id}
              ref={open ? currentRef : undefined}
              className={`rounded-md ${open ? "bg-surface ring-1 ring-accent/40" : ""}`}
            >
              <button
                type="button"
                onClick={() => onPhase(index)}
                aria-current={open ? "step" : undefined}
                className={`flex w-full items-baseline gap-2.5 rounded-md px-3 py-2 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  open ? "" : "text-foreground/80"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-5 shrink-0 items-center justify-center self-center rounded-full text-[11px] font-semibold tabular-nums ${
                    open ? "bg-accent text-on-accent" : "border border-line text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="sr-only">{label(index)}: </span>
                <span className={`min-w-0 flex-1 text-sm ${open ? "font-semibold" : "font-medium"}`}>
                  {item.title[locale]}
                </span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {formatHour(hours.start)}–{formatHour(hours.end)}
                </span>
              </button>
              {open && (
                <p className="px-3 pb-3 pt-0.5 text-sm leading-relaxed text-foreground/90">
                  {item.narration[locale]}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {/* Read out when playback moves on to another phase. */}
      <p className="sr-only" aria-live="polite">
        {label(current)}: {phase.title[locale]}. {phase.narration[locale]}
      </p>
    </>
  );
}
