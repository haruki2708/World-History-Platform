"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

interface ScrubberProps {
  /** Battle time, 0 to `phases`. */
  time: number;
  phases: number;
  onSeek: (time: number) => void;
  label: string;
  /** What a screen reader says for the current position. */
  valueText: string;
}

/** Arrow keys move by this much of a phase; with Shift, by the larger step. */
const FINE_STEP = 0.02;
const COARSE_STEP = 0.1;

/**
 * The seek bar of a battle: one segment per phase, with a mark at every
 * boundary between two phases. Pointer input is taken on the whole bar, so
 * the drag target is tall; keyboard input goes to the `role="slider"` thumb.
 */
export function Scrubber({ time, phases, onSeek, label, valueText }: ScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const value = Math.min(Math.max(time, 0), phases);
  const percent = `${phases > 0 ? (value / phases) * 100 : 0}%`;

  const seekTo = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    onSeek(Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) * phases);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // No text selection while dragging; the keyboard picks up from the thumb.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbRef.current?.focus({ preventScroll: true });
    seekTo(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) seekTo(event.clientX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const step = event.shiftKey ? COARSE_STEP : FINE_STEP;
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = value - step;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = value + step;
        break;
      case "PageDown":
        next = Math.ceil(value) - 1;
        break;
      case "PageUp":
        next = Math.floor(value) + 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = phases;
        break;
      default:
        return;
    }
    // Handled here: the viewer's own arrow keys (previous, next phase) stand aside.
    event.preventDefault();
    onSeek(next);
  };

  return (
    <div className="min-w-0 flex-1 px-2">
      <div
        ref={trackRef}
        className="group relative h-8 cursor-pointer touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line/85" />
        <div
          aria-hidden
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ width: percent }}
        />
        {Array.from({ length: Math.max(phases - 1, 0) }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/75"
            style={{ left: `${((i + 1) / phases) * 100}%` }}
          />
        ))}
        <div
          ref={thumbRef}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={phases}
          aria-valuenow={Math.round(value * 100) / 100}
          aria-valuetext={valueText}
          onKeyDown={handleKeyDown}
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-accent shadow-sm transition-transform duration-150 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ left: percent }}
        />
      </div>
    </div>
  );
}
