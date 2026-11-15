"use client";

import { useState } from "react";
import { getEvent, isEventActive } from "@/data";
import { useT } from "@/lib/i18n/useT";
import { YEAR_MAX, YEAR_MIN, formatYear } from "@/lib/years";
import { useAppStore } from "@/store/useAppStore";
import { useShortcuts } from "../shell/keyboard";
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
  // Name the selected event next to the year only while it is under way, so
  // the header never reads as if an event happened in the wrong year.
  const currentEvent =
    selectedEvent && isEventActive(selectedEvent, year) ? selectedEvent : undefined;

  const [speed, setSpeed] = useState<PlaybackSpeed>(10);
  const { playing, toggle, pause } = usePlayback(speed);
  useTimelineShortcuts(toggle, pause);

  return (
    <div className="flex flex-col gap-1 px-4 pt-2 pb-1">
      <div className="flex items-center gap-3">
        <PlayButton playing={playing} onToggle={toggle} />
        <p className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {formatYear(year, locale)}
          </span>
          {currentEvent && (
            <span className="truncate text-sm text-muted">
              {currentEvent.title[locale]}
            </span>
          )}
        </p>
        <SpeedSelect speed={speed} onChange={setSpeed} />
      </div>
      <TimelineTrack onUserSeek={pause} />
    </div>
  );
}

/** Space plays or pauses; ←/→ step 1 year (10 with Shift); Home/End jump. */
function useTimelineShortcuts(toggle: () => void, pause: () => void) {
  useShortcuts((event) => {
    const { year, setYear } = useAppStore.getState();
    const step = event.shiftKey ? 10 : 1;
    let target: number;
    switch (event.key) {
      case " ":
        if (!event.repeat) toggle();
        return true;
      case "ArrowLeft":
        target = year - step;
        break;
      case "ArrowRight":
        target = year + step;
        break;
      case "Home":
        target = YEAR_MIN;
        break;
      case "End":
        target = YEAR_MAX;
        break;
      default:
        return false;
    }
    // Moving the year by hand stops playback, as dragging does.
    pause();
    setYear(target);
    return true;
  });
}
