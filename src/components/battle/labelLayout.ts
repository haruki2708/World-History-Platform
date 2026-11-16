/**
 * Places the place-name labels of the battle scene on screen so that none
 * covers another. Pure 2D, no three.js and no DOM: the scene projects the
 * anchors and measures the labels, this decides where each one goes.
 *
 * Labels are taken in priority order. Each tries the spot it had in the
 * previous frame first, so labels do not jump about while the camera moves,
 * then every anchor in turn (a river has several along its course) and every
 * side of it. A label with no free spot is hidden.
 */

/** Where the text stands relative to its anchor. "center" sits on it (rivers). */
export type LabelSide = "above" | "below" | "right" | "left" | "center";

export interface LabelSpot {
  anchor: number;
  side: LabelSide;
}

export interface LabelRequest {
  /** Screen positions of the anchors, CSS pixels; null when off screen or behind the camera. */
  anchors: ({ x: number; y: number } | null)[];
  /** Sides to try, in order of preference. */
  sides: readonly LabelSide[];
  /** Size of the text box. */
  width: number;
  height: number;
  /** A dot marks the anchor (landmarks); it must stay visible too. */
  dot: boolean;
  previous: LabelSpot | null;
}

export interface LabelPlacement extends LabelSpot {
  /** Anchor on screen. */
  x: number;
  y: number;
  /** Top left of the text box, relative to the anchor. */
  dx: number;
  dy: number;
}

/** Between the dot and the text box. */
export const LABEL_GAP = 5;
/** Half the size of the dot. */
export const DOT_RADIUS = 3;
/** Space kept between two boxes, and from the edge of the view. */
const PADDING = 2;

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function offset(side: LabelSide, width: number, height: number): { dx: number; dy: number } {
  switch (side) {
    case "above":
      return { dx: -width / 2, dy: -LABEL_GAP - height };
    case "below":
      return { dx: -width / 2, dy: LABEL_GAP };
    case "right":
      return { dx: LABEL_GAP, dy: -height / 2 };
    case "left":
      return { dx: -LABEL_GAP - width, dy: -height / 2 };
    case "center":
      return { dx: -width / 2, dy: -height / 2 };
  }
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right + PADDING &&
    b.left < a.right + PADDING &&
    a.top < b.bottom + PADDING &&
    b.top < a.bottom + PADDING
  );
}

export function layoutLabels(
  requests: LabelRequest[],
  view: { width: number; height: number },
): (LabelPlacement | null)[] {
  const taken: Rect[] = [];
  const inside = (r: Rect) =>
    r.left >= PADDING && r.top >= PADDING && r.right <= view.width - PADDING && r.bottom <= view.height - PADDING;
  const free = (r: Rect) => inside(r) && !taken.some((t) => overlaps(r, t));

  return requests.map((request) => {
    const candidates: LabelSpot[] = [];
    if (request.previous) candidates.push(request.previous);
    request.anchors.forEach((_, anchor) => {
      for (const side of request.sides) candidates.push({ anchor, side });
    });

    for (const spot of candidates) {
      const point = request.anchors[spot.anchor];
      if (!point || !request.sides.includes(spot.side)) continue;
      const dot: Rect | null = request.dot
        ? {
            left: point.x - DOT_RADIUS,
            top: point.y - DOT_RADIUS,
            right: point.x + DOT_RADIUS,
            bottom: point.y + DOT_RADIUS,
          }
        : null;
      if (dot && !free(dot)) continue;
      const { dx, dy } = offset(spot.side, request.width, request.height);
      const box: Rect = {
        left: point.x + dx,
        top: point.y + dy,
        right: point.x + dx + request.width,
        bottom: point.y + dy + request.height,
      };
      if (!free(box)) continue;
      taken.push(box);
      if (dot) taken.push(dot);
      return { ...spot, x: point.x, y: point.y, dx, dy };
    }
    return null;
  });
}
