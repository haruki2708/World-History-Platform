import { labelFits, type LabelPoint, type LabelSpot } from "./spots";

/** A label laid out on one line, or split over two. */
export type LabelLayout = "one" | "two";

/** Where and how a label shows. */
export interface LabelPlacement {
  layout: LabelLayout;
  /** The spot itself, or one of its alternatives. */
  point: LabelPoint;
}

export interface LabelSize {
  width: number;
  height: number;
}

/** Measured sizes of a label; `two` only for names of several words. */
export interface LabelSizes {
  one: LabelSize;
  two?: LabelSize;
}

/** Splits a name into two lines of about the same length, at a space. */
export function splitName(name: string): [string, string] | null {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  let best: [string, string] = [words[0], words.slice(1).join(" ")];
  let bestLength = Infinity;
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    const longest = Math.max(first.length, second.length);
    if (longest < bestLength) {
      best = [first, second];
      bestLength = longest;
    }
  }
  return best;
}

/** Gap kept between two labels, and between a label and an obstacle, in pixels. */
const GAP = 6;

/** A rectangle on screen, in pixels from the map's top left corner. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function within(inner: Box, outer: Box): boolean {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.top >= outer.top &&
    inner.bottom <= outer.bottom
  );
}

function boxAround(x: number, y: number, size: LabelSize): Box {
  return {
    left: x - size.width / 2 - GAP / 2,
    right: x + size.width / 2 + GAP / 2,
    top: y - size.height / 2 - GAP / 2,
    bottom: y + size.height / 2 + GAP / 2,
  };
}

/**
 * Decides which labels to show, where and how. Spots come largest first;
 * each label takes the first layout (one line, then two) that fits inside
 * its territory and clears every label already placed and every obstacle
 * (the legend and the buttons drawn over the map). A label whose own point
 * is under an obstacle moves to the best alternative point of its piece
 * that works and lies within `view` (moving it out of sight would not help),
 * keeping the one it had last time if that still works, so it does not jump
 * around while the map pans. The rest are hidden.
 *
 * Obstacles are fixed on screen, so this runs again whenever the map moves.
 */
export function placeLabels(
  spots: LabelSpot[],
  sizes: (polityId: string) => LabelSizes | undefined,
  project: (lng: number, lat: number) => { x: number; y: number },
  zoom: number,
  obstacles: Box[],
  view: Box,
  previous: Map<string, LabelPlacement>,
): Map<string, LabelPlacement> {
  const placed: Box[] = [];
  const result = new Map<string, LabelPlacement>();

  // The first layout that works at `point`, with its box.
  const tryPoint = (spot: LabelSpot, point: LabelPoint, measured: LabelSizes) => {
    const { x, y } = project(point.lng, point.lat);
    for (const layout of ["one", "two"] as const) {
      const size = measured[layout];
      if (!size || !labelFits(spot, point, size.width, size.height, zoom)) continue;
      const box = boxAround(x, y, size);
      if (point !== spot && !within(box, view)) continue;
      if (obstacles.some((other) => overlaps(box, other))) continue;
      if (placed.some((other) => overlaps(box, other))) continue;
      return { layout, box };
    }
    return null;
  };

  // True when an obstacle covers part of a label centred on the spot.
  const covered = (spot: LabelSpot, measured: LabelSizes) => {
    if (obstacles.length === 0) return false;
    const { x, y } = project(spot.lng, spot.lat);
    return [measured.one, measured.two].some(
      (size) => size && obstacles.some((other) => overlaps(boxAround(x, y, size), other)),
    );
  };

  for (const spot of spots) {
    const measured = sizes(spot.polityId);
    if (!measured) continue;
    const points: LabelPoint[] = [spot];
    if (covered(spot, measured)) {
      const last = previous.get(spot.key)?.point;
      if (last && last !== spot) points.push(last);
      points.push(...spot.alternatives);
    }
    for (const point of points) {
      const found = tryPoint(spot, point, measured);
      if (!found) continue;
      placed.push(found.box);
      result.set(spot.key, { layout: found.layout, point });
      break;
    }
  }
  return result;
}
