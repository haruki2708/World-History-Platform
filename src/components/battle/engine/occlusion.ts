/**
 * Is a point on the field hidden from the camera? Used for the place-name
 * labels, which are HTML over the scene and would otherwise show through a
 * hill or a body of troops standing in front of the place they name.
 *
 * Field coordinates throughout: x east, y north, h height (metres).
 */

import type { HeightAt } from "./terrain";

/** A body of troops, as a box standing on the ground. */
export interface Occluder {
  /** Middle of the box on the field. */
  x: number;
  y: number;
  /** Facing of the block, radians clockwise from north. */
  sin: number;
  cos: number;
  /** Half the frontage and half the depth, metres. */
  halfAcross: number;
  halfDepth: number;
  /** Ground under the block and the top of the figures. */
  bottom: number;
  top: number;
}

/** Hills: steps along the line of sight, and how far the ground must rise above it. */
const TERRAIN_STEPS = 40;
const TERRAIN_CLEARANCE = 1.5;
/**
 * Troops standing on the place itself do not hide its name: the last metres
 * of the line of sight are not tested against the blocks.
 */
const OWN_GROUND = 15;

export interface FieldPoint3 {
  x: number;
  y: number;
  h: number;
}

/**
 * True when the ground or a block of troops lies between `eye` and `point`.
 * `own` is the block the point belongs to (a unit's label above it), which
 * does not hide it; without one, troops standing within OWN_GROUND of the
 * point do not (a place and the men on it).
 */
export function hidden(
  eye: FieldPoint3,
  point: FieldPoint3,
  heightAt: HeightAt,
  occluders: readonly Occluder[],
  own?: Occluder,
): boolean {
  const dx = point.x - eye.x;
  const dy = point.y - eye.y;
  const dh = point.h - eye.h;
  if (groundBetween(eye, dx, dy, dh, 1, heightAt)) return true;

  let end = 1;
  if (!own) {
    const across = Math.hypot(dx, dy);
    if (across < OWN_GROUND) return false;
    end = 1 - OWN_GROUND / across;
  }
  for (const box of occluders) {
    if (box !== own && crosses(eye, dx, dy, dh, end, box)) return true;
  }
  return false;
}

/** Whether the ground rises above the line eye + (dx, dy, dh)·t for t in (0, end). */
function groundBetween(
  eye: FieldPoint3,
  dx: number,
  dy: number,
  dh: number,
  end: number,
  heightAt: HeightAt,
): boolean {
  for (let i = 1; i < TERRAIN_STEPS; i++) {
    const t = (i / TERRAIN_STEPS) * end;
    const x = eye.x + dx * t;
    const y = eye.y + dy * t;
    if (heightAt(x, y) > eye.h + dh * t + TERRAIN_CLEARANCE) return true;
  }
  return false;
}

/**
 * The block of troops a ray from the eye meets first, for a click on the
 * scene: its index in `boxes`, or -1. Each box is grown by `margins[i]`
 * metres on every side, so a block a few pixels tall can still be hit. A
 * block behind a hill is not hit.
 */
export function pick(
  eye: FieldPoint3,
  direction: FieldPoint3,
  boxes: readonly Occluder[],
  margins: readonly number[],
  heightAt: HeightAt,
): number {
  let best = -1;
  let nearest = Infinity;
  boxes.forEach((box, i) => {
    const margin = margins[i] ?? 0;
    const t = enter(eye, direction.x, direction.y, direction.h, Infinity, {
      ...box,
      halfAcross: box.halfAcross + margin,
      halfDepth: box.halfDepth + margin,
      top: box.top + margin,
    });
    if (t >= 0 && t < nearest) {
      nearest = t;
      best = i;
    }
  });
  if (best < 0) return -1;
  return groundBetween(eye, direction.x, direction.y, direction.h, nearest, heightAt) ? -1 : best;
}

/**
 * Where the line eye + (dx, dy, dh)·t, t in [0, end], enters the box: the
 * slab method in the frame of the block, then the height of the line where
 * it is over the block. -1 when it misses.
 */
function enter(
  eye: FieldPoint3,
  dx: number,
  dy: number,
  dh: number,
  end: number,
  box: Occluder,
): number {
  // Into the frame of the block: a across the front, f forward.
  const ox = eye.x - box.x;
  const oy = eye.y - box.y;
  const a0 = box.cos * ox - box.sin * oy;
  const f0 = box.sin * ox + box.cos * oy;
  const da = box.cos * dx - box.sin * dy;
  const df = box.sin * dx + box.cos * dy;

  let from = 0;
  let to = end;
  for (const [start, step, half] of [
    [a0, da, box.halfAcross],
    [f0, df, box.halfDepth],
    [eye.h, dh, NaN],
  ]) {
    let t1: number;
    let t2: number;
    if (Number.isNaN(half)) {
      // Height: between the ground under the block and the top of the figures.
      if (Math.abs(step) < 1e-9) {
        if (start < box.bottom || start > box.top) return -1;
        continue;
      }
      t1 = (box.bottom - start) / step;
      t2 = (box.top - start) / step;
    } else {
      if (Math.abs(step) < 1e-9) {
        if (Math.abs(start) > half) return -1;
        continue;
      }
      t1 = (-half - start) / step;
      t2 = (half - start) / step;
    }
    if (t1 > t2) [t1, t2] = [t2, t1];
    from = Math.max(from, t1);
    to = Math.min(to, t2);
    if (from > to) return -1;
  }
  return from;
}

/**
 * Whether the line eye + (dx, dy, dh)·t, t in [0, end], passes through the
 * box: the slab method in the frame of the block, then the height of the
 * line where it is over the block.
 */
function crosses(
  eye: FieldPoint3,
  dx: number,
  dy: number,
  dh: number,
  end: number,
  box: Occluder,
): boolean {
  // Into the frame of the block: a across the front, f forward.
  const ox = eye.x - box.x;
  const oy = eye.y - box.y;
  const a0 = box.cos * ox - box.sin * oy;
  const f0 = box.sin * ox + box.cos * oy;
  const da = box.cos * dx - box.sin * dy;
  const df = box.sin * dx + box.cos * dy;

  let enter = 0;
  let leave = end;
  for (const [start, step, half] of [
    [a0, da, box.halfAcross],
    [f0, df, box.halfDepth],
  ]) {
    if (Math.abs(step) < 1e-9) {
      if (Math.abs(start) > half) return false;
      continue;
    }
    let t1 = (-half - start) / step;
    let t2 = (half - start) / step;
    if (t1 > t2) [t1, t2] = [t2, t1];
    enter = Math.max(enter, t1);
    leave = Math.min(leave, t2);
    if (enter > leave) return false;
  }
  // The line is straight: over the block it is lowest at one of the ends.
  const low = Math.min(eye.h + dh * enter, eye.h + dh * leave);
  return low < box.top && Math.max(eye.h + dh * enter, eye.h + dh * leave) > box.bottom;
}
