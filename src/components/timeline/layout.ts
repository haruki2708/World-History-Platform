import type { HistoricalEvent, Year } from "@/lib/types";
import { YEAR_MAX, YEAR_MIN, clampYear } from "@/lib/years";

/**
 * Pure layout maths for the timeline: where ticks go, and how event markers
 * are stacked into lanes so they never overlap.
 *
 * The MVP range is entirely BCE, so there is no year-0 gap to skip here.
 */

const RANGE = YEAR_MAX - YEAR_MIN;

export function yearToFraction(year: Year): number {
  return (year - YEAR_MIN) / RANGE;
}

export function fractionToYear(fraction: number): Year {
  return clampYear(YEAR_MIN + fraction * RANGE);
}

/** CSS `left` value for a year on the track. */
export function yearToPercent(year: Year): string {
  return `${yearToFraction(year) * 100}%`;
}

// ---------------------------------------------------------------------------
// Ticks

export type TickKind = "major" | "mid" | "minor";

export interface Tick {
  year: Year;
  kind: TickKind;
  /** Only major ticks carry a year label. */
  label: boolean;
}

/** Candidate spacings for labelled ticks, smallest first. */
const LABEL_STEPS = [50, 100, 250];
/** A label like "500 BCE" is ~45px wide at 10px; leave breathing room. */
const MIN_LABEL_SPACING_PX = 58;
const MINOR_STEP = 10;
const MID_STEP = 50;

export function computeTicks(widthPx: number): Tick[] {
  const pxPerYear = widthPx / RANGE;
  const labelStep =
    LABEL_STEPS.find((step) => step * pxPerYear >= MIN_LABEL_SPACING_PX) ??
    LABEL_STEPS[LABEL_STEPS.length - 1];

  const ticks: Tick[] = [];
  const first = Math.ceil(YEAR_MIN / MINOR_STEP) * MINOR_STEP;
  for (let year = first; year <= YEAR_MAX; year += MINOR_STEP) {
    if (year % labelStep === 0) {
      ticks.push({ year, kind: "major", label: true });
    } else if (year % MID_STEP === 0) {
      ticks.push({ year, kind: "mid", label: false });
    } else {
      ticks.push({ year, kind: "minor", label: false });
    }
  }
  return ticks;
}

// ---------------------------------------------------------------------------
// Event markers

/** Diameter in px of a point marker (and thickness of a span bar) by importance. */
export const MARKER_SIZE: Record<HistoricalEvent["importance"], number> = {
  1: 6,
  2: 9,
  3: 12,
};

/** Height of one marker lane in px. */
export const LANE_HEIGHT = 16;
/** Maximum stacked lanes before markers spill into "+n" clusters. */
export const MAX_LANES = 4;

/** Minimum horizontal gap between two markers in the same lane. */
const MARKER_GAP_PX = 4;
/** Width reserved for one "+n" cluster chip. */
const CLUSTER_WIDTH_PX = 26;

export interface MarkerLayout {
  event: HistoricalEvent;
  /** Lane index, 0 = closest to the axis. */
  lane: number;
}

export interface ClusterLayout {
  /** Rounded mean start year of the members; clicking the chip goes here. */
  year: Year;
  events: HistoricalEvent[];
}

export interface TimelineLayout {
  markers: MarkerLayout[];
  /** Events that did not fit in any lane, grouped by proximity. */
  clusters: ClusterLayout[];
  /** Lanes actually used (at least 1). */
  laneCount: number;
}

interface Interval {
  from: number;
  to: number;
}

/**
 * Greedy lane packing. More important events (then longer spans, then earlier
 * ones) are placed first, so they always get the lanes nearest the axis and
 * are never the ones pushed into a cluster.
 */
export function layoutMarkers(
  events: readonly HistoricalEvent[],
  widthPx: number,
): TimelineLayout {
  const pxPerYear = widthPx / RANGE;
  const footprint = (event: HistoricalEvent): Interval => {
    const half = MARKER_SIZE[event.importance] / 2 + MARKER_GAP_PX / 2;
    return {
      from: yearToFraction(event.year) * widthPx - half,
      to: yearToFraction(event.endYear ?? event.year) * widthPx + half,
    };
  };

  const ordered = events.slice().sort(
    (a, b) =>
      b.importance - a.importance ||
      span(b) - span(a) ||
      a.year - b.year ||
      a.id.localeCompare(b.id),
  );

  const lanes: Interval[][] = [];
  const markers: MarkerLayout[] = [];
  const overflow: HistoricalEvent[] = [];

  for (const event of ordered) {
    const box = footprint(event);
    let lane = lanes.findIndex((taken) =>
      taken.every((other) => box.to <= other.from || box.from >= other.to),
    );
    if (lane === -1 && lanes.length < MAX_LANES) {
      lanes.push([]);
      lane = lanes.length - 1;
    }
    if (lane === -1) {
      overflow.push(event);
      continue;
    }
    lanes[lane].push(box);
    markers.push({ event, lane });
  }

  return {
    markers,
    clusters: clusterOverflow(overflow, pxPerYear),
    laneCount: Math.max(1, lanes.length),
  };
}

function span(event: HistoricalEvent): number {
  return (event.endYear ?? event.year) - event.year;
}

/** Merge overflow events whose chips would sit closer than one chip width. */
function clusterOverflow(
  overflow: HistoricalEvent[],
  pxPerYear: number,
): ClusterLayout[] {
  if (overflow.length === 0) return [];

  const groups = overflow
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((event) => [event]);
  const center = (group: HistoricalEvent[]) =>
    group.reduce((sum, event) => sum + event.year, 0) / group.length;

  // Repeatedly merge the first pair that is too close until none are.
  let merged = true;
  while (merged && groups.length > 1) {
    merged = false;
    for (let i = 0; i < groups.length - 1; i++) {
      const gapPx = (center(groups[i + 1]) - center(groups[i])) * pxPerYear;
      if (gapPx < CLUSTER_WIDTH_PX) {
        groups.splice(i, 2, [...groups[i], ...groups[i + 1]]);
        merged = true;
        break;
      }
    }
  }

  return groups.map((group) => ({
    year: clampYear(center(group)),
    events: group,
  }));
}
