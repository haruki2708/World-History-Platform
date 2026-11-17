/**
 * Places the labels of the battle scene on screen, the names of places and
 * of units together, so that none covers another; and the card of a unit
 * beside its block. Pure 2D, no three.js and no DOM: the scene projects the
 * anchors and measures the labels, this decides where each one goes.
 *
 * Labels are taken in priority order. Each tries the spot it had in the
 * previous frame first, so labels do not jump about while the camera moves,
 * then every anchor in turn (a river has several along its course) and every
 * side of it. A label with no free spot is hidden.
 *
 * Whatever lies over the scene (buttons, hints, panels of the viewer) is
 * passed in as obstacles: no label or dot is placed under one.
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
  /** Room kept free around the text box, beyond the usual padding (unit labels). */
  margin?: number;
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

/** A box in the view, CSS pixels from its top left corner. */
export interface LabelObstacle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type Rect = LabelObstacle;

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
  obstacles: readonly LabelObstacle[] = [],
): (LabelPlacement | null)[] {
  const taken: Rect[] = [...obstacles];
  const inside = (r: Rect) =>
    r.left >= PADDING && r.top >= PADDING && r.right <= view.width - PADDING && r.bottom <= view.height - PADDING;
  const free = (r: Rect) => inside(r) && !taken.some((t) => overlaps(r, t));

  return requests.map((request) => {
    const grow = request.margin ?? 0;
    const grown = (r: Rect): Rect =>
      grow === 0 ? r : { left: r.left - grow, top: r.top - grow, right: r.right + grow, bottom: r.bottom + grow };
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
      if (!inside(box) || taken.some((t) => overlaps(grown(box), t))) continue;
      taken.push(grown(box));
      if (dot) taken.push(dot);
      return { ...spot, x: point.x, y: point.y, dx, dy };
    }
    return null;
  });
}

/** Between a block and the card beside it, and the least room kept from the edges of the view. */
const CARD_GAP = 10;
const CARD_EDGE = 8;

/**
 * Where the card of a unit goes, top left corner: beside the block on screen
 * (right, left, above, below, in that order), inside the view and clear of
 * the overlays. When no side has room, beside the middle of the block,
 * pushed inside the view. Null when the block is not on screen at all.
 */
export function placeCard(
  block: LabelObstacle | null,
  size: { width: number; height: number },
  view: { width: number; height: number },
  obstacles: readonly LabelObstacle[],
): { x: number; y: number } | null {
  if (!block) return null;
  const { width, height } = size;
  const clampX = (x: number) => Math.min(Math.max(x, CARD_EDGE), Math.max(view.width - width - CARD_EDGE, CARD_EDGE));
  const clampY = (y: number) => Math.min(Math.max(y, CARD_EDGE), Math.max(view.height - height - CARD_EDGE, CARD_EDGE));
  const middleX = (block.left + block.right) / 2;
  const middleY = (block.top + block.bottom) / 2;
  const candidates = [
    { x: block.right + CARD_GAP, y: clampY(middleY - height / 2) },
    { x: block.left - CARD_GAP - width, y: clampY(middleY - height / 2) },
    { x: clampX(middleX - width / 2), y: block.top - CARD_GAP - height },
    { x: clampX(middleX - width / 2), y: block.bottom + CARD_GAP },
  ];
  const fits = (c: { x: number; y: number }) =>
    c.x >= CARD_EDGE &&
    c.y >= CARD_EDGE &&
    c.x + width <= view.width - CARD_EDGE &&
    c.y + height <= view.height - CARD_EDGE;
  const clear = (c: { x: number; y: number }) =>
    !obstacles.some((o) => overlaps({ left: c.x, top: c.y, right: c.x + width, bottom: c.y + height }, o));
  const best = candidates.find((c) => fits(c) && clear(c)) ?? candidates.find(fits);
  if (best) return best;
  return { x: clampX(middleX + CARD_GAP), y: clampY(middleY - height / 2) };
}
