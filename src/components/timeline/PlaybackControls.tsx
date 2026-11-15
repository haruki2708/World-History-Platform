"use client";

import { useId } from "react";
import { useT } from "@/lib/i18n/useT";
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from "./usePlayback";

interface PlayButtonProps {
  playing: boolean;
  onToggle: () => void;
}

export function PlayButton({ playing, onToggle }: PlayButtonProps) {
  const { t } = useT();
  const label = playing ? t("timeline.pause") : t("timeline.play");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-keyshortcuts="Space"
      title={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
        {playing ? (
          <>
            <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
            <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
          </>
        ) : (
          <path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7Z" />
        )}
      </svg>
    </button>
  );
}

interface SpeedSelectProps {
  speed: PlaybackSpeed;
  onChange: (speed: PlaybackSpeed) => void;
}

export function SpeedSelect({ speed, onChange }: SpeedSelectProps) {
  const { t } = useT();
  const id = useId();

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <label htmlFor={id} className="hidden text-xs text-muted sm:block">
        {t("timeline.speed")}
      </label>
      <select
        id={id}
        value={speed}
        aria-label={t("timeline.speed")}
        onChange={(event) =>
          onChange(Number(event.target.value) as PlaybackSpeed)
        }
        className="scheme-light-dark rounded-md border border-line bg-background px-1.5 py-1 text-xs text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-accent"
      >
        {PLAYBACK_SPEEDS.map((value) => (
          <option key={value} value={value}>
            {value} {t("timeline.speedUnit")}
          </option>
        ))}
      </select>
    </div>
  );
}
