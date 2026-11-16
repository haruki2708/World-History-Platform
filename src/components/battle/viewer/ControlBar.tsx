"use client";

import type { ReactNode } from "react";
import { type Battle, hourAt, phaseAt } from "@/lib/battle";
import { useT } from "@/lib/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { formatHour } from "./format";
import { Scrubber } from "./Scrubber";
import { PLAYBACK_SPEEDS, type Playback } from "./usePlayback";

interface ControlBarProps {
  battle: Battle;
  playback: Playback;
}

const ICON_BUTTON =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent aria-disabled:opacity-40 aria-disabled:hover:bg-transparent";

/**
 * Play, previous and next phase, the seek bar, the time of day and the phase
 * under way. Re-renders on every tick of the battle clock, so it is kept
 * small and apart from the panels.
 */
export function ControlBar({ battle, playback }: ControlBarProps) {
  const { t, locale } = useT();
  const end = battle.phases.length;
  const time = useAppStore((state) => Math.min(state.battleTime, end));
  const number = phaseAt(battle, time);
  const phase = battle.phases[number - 1];
  const clock = formatHour(hourAt(battle, time));
  const phaseLabel = t("battle.phase").replace("{n}", String(number)).replace("{total}", String(end));
  const playLabel = playback.playing
    ? t("battle.controls.pause")
    : time >= end
      ? t("battle.controls.replay")
      : t("battle.controls.play");
  const nextSpeed =
    PLAYBACK_SPEEDS[(PLAYBACK_SPEEDS.indexOf(playback.speed) + 1) % PLAYBACK_SPEEDS.length];

  return (
    <div
      role="group"
      aria-label={t("battle.controls.label")}
      className="shrink-0 border-t border-line bg-background px-3 pt-1.5 pb-2"
    >
      <div className="flex items-center gap-1.5">
        <IconButton
          label={t("battle.controls.previous")}
          shortcut="ArrowLeft"
          disabled={time <= 0}
          onClick={() => playback.step(-1)}
        >
          <rect x="2.5" y="2.5" width="2" height="11" rx="0.75" />
          <path d="M13.5 3.1v9.8a.8.8 0 0 1-1.25.66L5.6 8.66a.8.8 0 0 1 0-1.32l6.65-4.9a.8.8 0 0 1 1.25.66Z" />
        </IconButton>
        <button
          type="button"
          onClick={playback.toggle}
          aria-label={playLabel}
          aria-keyshortcuts="Space"
          title={playLabel}
          data-battle-play
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
            {playback.playing ? (
              <>
                <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
                <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
              </>
            ) : (
              <path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7Z" />
            )}
          </svg>
        </button>
        <IconButton
          label={t("battle.controls.next")}
          shortcut="ArrowRight"
          disabled={time >= end}
          onClick={() => playback.step(1)}
        >
          <rect x="11.5" y="2.5" width="2" height="11" rx="0.75" />
          <path d="M2.5 3.1v9.8a.8.8 0 0 0 1.25.66l6.65-4.9a.8.8 0 0 0 0-1.32L3.75 2.44a.8.8 0 0 0-1.25.66Z" />
        </IconButton>

        <Scrubber
          time={time}
          phases={end}
          onSeek={playback.seek}
          label={t("battle.controls.time")}
          valueText={`${clock}. ${phaseLabel}: ${phase.title[locale]}`}
        />

        <span
          className="w-12 shrink-0 text-right text-sm tabular-nums"
          title={t("battle.controls.clock")}
        >
          <span className="sr-only">{t("battle.controls.clock")}: </span>
          {clock}
        </span>
        <button
          type="button"
          onClick={() => playback.setSpeed(nextSpeed)}
          aria-label={`${t("battle.controls.speed")}: ${playback.speed}×`}
          title={t("battle.controls.speed")}
          className="w-10 shrink-0 rounded-md border border-line py-1 text-xs tabular-nums text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
        >
          {playback.speed}×
        </button>
      </div>

      <div className="mt-0.5 flex items-baseline justify-between gap-4 text-xs">
        <p className="min-w-0 truncate" title={phase.title[locale]}>
          <span className="text-muted tabular-nums">{phaseLabel}</span>
          <span className="text-muted"> · </span>
          <span className="font-medium">{phase.title[locale]}</span>
        </p>
        <p className="hidden shrink-0 text-muted lg:block">{t("battle.viewer.keys")}</p>
      </div>
    </div>
  );
}

interface IconButtonProps {
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
  /** SVG shapes on a 16 × 16 grid. */
  children: ReactNode;
}

function IconButton({ label, shortcut, disabled, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      // Not the disabled attribute: a button that turns off under the
      // keyboard (the first phase, the end) must keep the focus.
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      aria-label={label}
      aria-keyshortcuts={shortcut}
      title={label}
      className={ICON_BUTTON}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
        {children}
      </svg>
    </button>
  );
}
