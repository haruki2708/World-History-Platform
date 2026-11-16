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

/** True when the ground or a block of troops lies between `eye` and `point`. */
export function hidden(
  eye: FieldPoint3,
  point: FieldPoint3,
  heightAt: HeightAt,
  occluders: readonly Occluder[],
): boolean {
  const dx = point.x - eye.x;
  const dy = point.y - eye.y;
  const dh = point.h - eye.h;

  for (let i = 1; i < TERRAIN_STEPS; i++) {
    const t = i / TERRAIN_STEPS;
    const x = eye.x + dx * t;
    const y = eye.y + dy * t;
    if (heightAt(x, y) > eye.h + dh * t + TERRAIN_CLEARANCE) return true;
  }

  const across = Math.hypot(dx, dy);
  if (across < OWN_GROUND) return false;
  const end = 1 - OWN_GROUND / across;
  for (const box of occluders) {
    if (crosses(eye, dx, dy, dh, end, box)) return true;
  }
  return false;
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
