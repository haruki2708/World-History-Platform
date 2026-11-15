import { labelFits, type LabelSpot } from "./spots";

/** A label laid out on one line, or split over two. */
export type LabelLayout = "one" | "two";

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

/** Gap kept between two labels, in pixels. */
const GAP = 6;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * Decides which labels to show at `zoom`, and how. Spots come largest first;
 * each label takes the first layout (one line, then two) that fits inside
 * its territory and clears every label already placed. The rest are hidden.
 * Relative screen positions depend only on the zoom, so panning needs no
 * new placement.
 */
export function placeLabels(
  spots: LabelSpot[],
  sizes: (polityId: string) => LabelSizes | undefined,
  project: (lng: number, lat: number) => { x: number; y: number },
  zoom: number,
): Map<string, LabelLayout> {
  const placed: Box[] = [];
  const result = new Map<string, LabelLayout>();
  for (const spot of spots) {
    const measured = sizes(spot.polityId);
    if (!measured) continue;
    const { x, y } = project(spot.lng, spot.lat);
    const candidates: [LabelLayout, LabelSize | undefined][] = [
      ["one", measured.one],
      ["two", measured.two],
    ];
    for (const [layout, size] of candidates) {
      if (!size || !labelFits(spot, size.width, size.height, zoom)) continue;
      const box: Box = {
        left: x - size.width / 2 - GAP / 2,
        right: x + size.width / 2 + GAP / 2,
        top: y - size.height / 2 - GAP / 2,
        bottom: y + size.height / 2 + GAP / 2,
      };
      if (placed.some((other) => overlaps(box, other))) continue;
      placed.push(box);
      result.set(spot.polityId, layout);
      break;
    }
  }
  return result;
}
