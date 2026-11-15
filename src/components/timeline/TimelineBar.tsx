"use client";

import { useState } from "react";
import { getEvent } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";
import { PlayButton, SpeedSelect } from "./PlaybackControls";
import { TimelineTrack } from "./TimelineTrack";
import { usePlayback, type PlaybackSpeed } from "./usePlayback";

/**
 * The timeline along the bottom of the page: current year, playback controls
 * and the track with event markers. Talks to the rest of the app only through
 * `useAppStore` (`year`, `setYear`, `selectedEventId`, `selectEvent`).
 */
export function TimelineBar() {
  const { locale } = useT();
  const year = useAppStore((state) => state.year);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : undefined;

  const [speed, setSpeed] = useState<PlaybackSpeed>(10);
  const { playing, toggle, pause } = usePlayback(speed);

  return (
    <div className="flex flex-col gap-1 px-4 pt-2 pb-1">
      <div className="flex items-center gap-3">
        <PlayButton playing={playing} onToggle={toggle} />
        <p className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {formatYear(year, locale)}
          </span>
          {selectedEvent && (
            <span className="truncate text-sm text-muted">
              {selectedEvent.title[locale]}
            </span>
          )}
        </p>
        <SpeedSelect speed={speed} onChange={setSpeed} />
      </div>
      <TimelineTrack onUserSeek={pause} />
    </div>
  );
}
