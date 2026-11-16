/**
 * The view the scene opens on: the main forces of both sides, as large as
 * the screen allows, seen like the map from above at an angle.
 *
 * 1. Which blocks: those standing at the end of the phase under way. Blocks
 *    within GAP metres of each other (edge to edge) form a group; a group is
 *    kept when it holds MIN_SHARE of the men on the field, or when it is the
 *    largest group of its side. A camp guard or a far pursuit is left out.
 * 2. Where from: the camera looks down at TILT, from the south (north at the
 *    top, like the map) unless looking from another cardinal direction
 *    brings it at least PREFER_SOUTH closer.
 * 3. How far: the corners of the kept blocks are fitted to the view, with a
 *    margin, by solving for the camera position directly (no bounding
 *    sphere), so the widest dimension fills the width of the screen.
 */

import { Vector3 } from "three";
import { formationPoint, type UnitKey } from "./timeline";

/** Blocks closer than this, edge to edge, belong together (metres). */
const GAP = 400;
/** A group with at least this share of the men on the field is kept. */
const MIN_SHARE = 0.15;
/** Angle of the view from straight down. */
const TILT = (52 * Math.PI) / 180;
/** Share of the half-width and half-height the kept blocks may fill. */
const FILL_X = 0.92;
const FILL_Y = 0.8;
/** Another direction must need less than this share of the distance from the south. */
const PREFER_SOUTH = 0.8;
/** Closest opening distance, metres, for very small battles. */
const MIN_DISTANCE = 120;

export interface FramedBlock {
  side: string;
  formation: UnitKey;
  /** Men standing in the block at that time. */
  men: number;
}

interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const scratch = { x: 0, y: 0 };

/** The corners of a formation (and the tip of its bulge) on the field. */
function corners(f: UnitKey): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const [u, v] of [
    [-0.5, 0],
    [0.5, 0],
    [-0.5, 1],
    [0.5, 1],
    [0, 0],
    [0, 1],
  ]) {
    formationPoint(f, u, v, scratch);
    points.push({ x: scratch.x, y: scratch.y });
  }
  return points;
}

function boxOf(points: { x: number; y: number }[]): Box {
  const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const p of points) {
    box.minX = Math.min(box.minX, p.x);
    box.maxX = Math.max(box.maxX, p.x);
    box.minY = Math.min(box.minY, p.y);
    box.maxY = Math.max(box.maxY, p.y);
  }
  return box;
}

function gap(a: Box, b: Box): number {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0);
  const dy = Math.max(a.minY - b.maxY, b.minY - a.maxY, 0);
  return Math.hypot(dx, dy);
}

/** The blocks that make the main forces (see the top of this file). */
export function mainForces(blocks: FramedBlock[]): FramedBlock[] {
  const standing = blocks.filter((block) => block.men > 0);
  if (standing.length <= 1) return standing;
  const boxes = standing.map((block) => boxOf(corners(block.formation)));

  // Single-linkage groups by union-find.
  const parent = standing.map((_, i) => i);
  const root = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let i = 0; i < standing.length; i++) {
    for (let j = i + 1; j < standing.length; j++) {
      if (gap(boxes[i], boxes[j]) <= GAP) parent[root(i)] = root(j);
    }
  }

  const total = standing.reduce((sum, block) => sum + block.men, 0);
  const groupMen = new Map<number, number>();
  const sideMen = new Map<string, Map<number, number>>();
  standing.forEach((block, i) => {
    const group = root(i);
    groupMen.set(group, (groupMen.get(group) ?? 0) + block.men);
    const bySide = sideMen.get(block.side) ?? new Map<number, number>();
    bySide.set(group, (bySide.get(group) ?? 0) + block.men);
    sideMen.set(block.side, bySide);
  });

  const kept = new Set<number>();
  for (const [group, men] of groupMen) if (men >= MIN_SHARE * total) kept.add(group);
  for (const bySide of sideMen.values()) {
    let best = -1;
    let bestMen = -1;
    for (const [group, men] of bySide) {
      if (men > bestMen) {
        best = group;
        bestMen = men;
      }
    }
    kept.add(best);
  }
  return standing.filter((_, i) => kept.has(root(i)));
}

export interface ViewFit {
  position: Vector3;
  target: Vector3;
  distance: number;
}

/**
 * The camera that shows every point, looking along `yaw` (radians clockwise
 * from north) and tilted TILT from straight down. With the view basis right
 * r, up u and forward f, a point P has a = P·r, b = P·u, c = P·f, and the
 * camera C must satisfy |a − C·r| ≤ tx (c − C·f) and the same for b with ty.
 * Each pair of planes fixes C·r (or C·u) and a furthest C·f; the camera
 * takes the further of the two, centred on both axes.
 */
function fitAlong(
  points: Vector3[],
  yaw: number,
  fovY: number,
  aspect: number,
  groundY: number,
): ViewFit {
  const pitch = Math.PI / 2 - TILT; // below the horizon
  const forward = new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    -Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );
  const right = new Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  const up = new Vector3().crossVectors(right, forward);
  const ty = Math.tan(fovY / 2) * FILL_Y;
  const tx = Math.tan(fovY / 2) * aspect * FILL_X;

  let k1 = -Infinity;
  let k2 = Infinity;
  let l1 = -Infinity;
  let l2 = Infinity;
  for (const p of points) {
    const a = p.dot(right);
    const b = p.dot(up);
    const c = p.dot(forward);
    k1 = Math.max(k1, a - tx * c);
    k2 = Math.min(k2, a + tx * c);
    l1 = Math.max(l1, b - ty * c);
    l2 = Math.min(l2, b + ty * c);
  }
  const along = Math.min((k2 - k1) / (2 * tx), (l2 - l1) / (2 * ty));
  const position = new Vector3()
    .addScaledVector(right, (k1 + k2) / 2)
    .addScaledVector(up, (l1 + l2) / 2)
    .addScaledVector(forward, along);
  // Look at the ground where the view axis meets it.
  let distance = (groundY - position.y) / forward.y;
  if (!(distance > MIN_DISTANCE)) {
    const target = position.clone().addScaledVector(forward, Math.max(distance, 0));
    distance = MIN_DISTANCE;
    position.copy(target).addScaledVector(forward, -distance);
  }
  const target = position.clone().addScaledVector(forward, distance);
  return { position, target, distance };
}

/**
 * Fits the main forces to the view. `heightAt` gives the ground at a field
 * point; `figureHeight` the height of a figure as drawn.
 */
export function frameBlocks(
  blocks: FramedBlock[],
  heightAt: (x: number, y: number) => number,
  figureHeight: number,
  fovY: number,
  aspect: number,
): ViewFit | null {
  const points: Vector3[] = [];
  let ground = 0;
  for (const block of blocks) {
    for (const p of corners(block.formation)) {
      const h = heightAt(p.x, p.y);
      ground += h;
      points.push(new Vector3(p.x, h, -p.y), new Vector3(p.x, h + figureHeight, -p.y));
    }
  }
  if (points.length === 0) return null;
  ground /= points.length / 2;

  const fromSouth = fitAlong(points, 0, fovY, aspect, ground);
  let best = fromSouth;
  for (const yaw of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const fit = fitAlong(points, yaw, fovY, aspect, ground);
    if (fit.distance < PREFER_SOUTH * fromSouth.distance && fit.distance < best.distance) best = fit;
  }
  return best;
}
