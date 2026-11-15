import type { HistoricalEvent } from "@/lib/types";

export interface EventDotState {
  importance: HistoricalEvent["importance"];
  /** The event is happening in the year being viewed. */
  active: boolean;
  /** The location is uncertain: drawn as a larger dashed, hollow circle. */
  approximate: boolean;
  selected: boolean;
}

const EXACT_SIZE: Record<HistoricalEvent["importance"], string> = {
  1: "size-2.5",
  2: "size-3",
  3: "size-3.5",
};

const APPROXIMATE_SIZE: Record<HistoricalEvent["importance"], string> = {
  1: "size-4",
  2: "size-4.5",
  3: "size-5",
};

/**
 * Classes for an event dot. Shared by the map markers and the legend so the
 * two always match.
 */
export function eventDotClass({
  importance,
  active,
  approximate,
  selected,
}: EventDotState): string {
  const highlighted = active || selected;
  const classes = ["block rounded-full border-2 transition-transform"];

  if (approximate) {
    classes.push(
      APPROXIMATE_SIZE[importance],
      "border-dashed",
      highlighted ? "border-accent bg-accent/25" : "border-muted bg-muted/25",
    );
  } else {
    classes.push(
      EXACT_SIZE[importance],
      "border-background shadow-sm",
      highlighted ? "bg-accent" : "bg-muted",
    );
  }

  if (selected) {
    classes.push(
      "scale-125 ring-2 ring-accent ring-offset-2 ring-offset-background",
    );
  }
  return classes.join(" ");
}
