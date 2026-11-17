// Lists the blocks whose men walk well off the way they face: sideways or
// backwards. The scene plays the walk, jog and run clips along each figure's
// heading at the speed the figure covers ground, so a figure that moves
// sideways or backwards slides its planted feet.
//
//   node scripts/battles/check-facing.mjs [battle id] [--min 0.25] [--angle 45]
//
// Movement is sampled the way the scene moves figures
// (src/components/battle/engine/timeline.ts): centre, frontage, depth and
// bulge in a straight line, facing the shorter way round; a turn of 135° or
// more is an about-face, drawn in the frame of the start of the phase with
// each man turning early in the phase. Each figure is assumed to keep its slot
// (u across, v front to rear) through a phase, so an about-face turns men
// where they stand. (The scene also re-packs slots as men fall; that shuffle
// is left out.)
//
// For every unit and phase: the share of the phase the block moves faster
// than the scene's walking threshold, and among those moments the share of
// figure samples whose movement is more than --angle degrees off their
// heading. Lines at or above --min of that share are listed, with the kind
// of movement: "side" (45°–135° off) or "back" (more than 135° off).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const minShare = option("--min", 0.25);
const maxAngle = option("--angle", 45);
const id =
  args.find((arg, i) => !arg.startsWith("--") && !args[i - 1]?.startsWith("--")) ?? "battle-of-cannae";
const battle = JSON.parse(readFileSync(join(root, "src", "data", "battles", `${id}.json`), "utf8"));

const DEG = Math.PI / 180;
/** As in timeline.ts. */
const ABOUT_FACE = 135 * DEG;
const TURN_SPAN = 0.08;
/** Below this the scene idles the legs: MOVE_START (0.12) of the walk clip's 3.0 m/s, units.ts. */
const WALK_THRESHOLD = 0.36;
/** Phase samples (s) and slots per block. */
const TIMES = Array.from({ length: 19 }, (_, i) => 0.05 + i * 0.05);
const SLOTS = [];
for (const u of [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45]) for (const v of [0.1, 0.5, 0.9]) SLOTS.push([u, v]);
const DS = 0.005;

const lerp = (a, b, t) => a + (b - a) * t;
function angleDelta(a, b) {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}
const smoothstep = (t) => {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
};

/** Keyframes per unit, as UnitTrack builds them: a missing unit holds its last state. */
function keysOf(unitId) {
  const toKey = (s) => ({
    x: s.formation.center.x,
    y: s.formation.center.y,
    frontage: Math.max(s.formation.frontage, 1),
    depth: Math.max(s.formation.depth, 1),
    facing: s.formation.facing * DEG,
    bulge: s.formation.bulge ?? 0,
    men: Math.max(s.men, 0),
    action: s.action,
  });
  const first = battle.initial.find((s) => s.unit === unitId);
  if (!first) return null;
  const keys = [toKey(first)];
  for (const phase of battle.phases) {
    const previous = keys.at(-1);
    const state = phase.units.find((s) => s.unit === unitId);
    const key = state ? toKey(state) : { ...previous };
    key.men = Math.min(key.men, previous.men);
    keys.push(key);
  }
  return keys;
}

/** Position and heading of slot (u, v) at phase fraction s of keyframes a -> b. */
function figure(a, b, s, u, v) {
  const delta = angleDelta(a.facing, b.facing);
  const about = Math.abs(delta) >= ABOUT_FACE;
  // An about-face is drawn towards the end keyframe seen from behind.
  const to = about ? { ...b, facing: b.facing + Math.PI, bulge: -b.bulge } : b;
  const f = {
    x: lerp(a.x, to.x, s),
    y: lerp(a.y, to.y, s),
    frontage: lerp(a.frontage, to.frontage, s),
    depth: lerp(a.depth, to.depth, s),
    facing: a.facing + angleDelta(a.facing, to.facing) * s,
    bulge: lerp(a.bulge, to.bulge, s),
  };
  const across = u * f.frontage;
  const forward = f.depth * (0.5 - v) + f.bulge * (1 - 4 * u * u);
  const sin = Math.sin(f.facing);
  const cos = Math.cos(f.facing);
  const turned = about ? smoothstep((s - 0.5 * TURN_SPAN) / TURN_SPAN) : 0;
  const curve = (8 * f.bulge) / f.frontage;
  return {
    x: f.x + cos * across + sin * forward,
    y: f.y - sin * across + cos * forward,
    heading: f.facing + (delta >= 0 ? 1 : -1) * Math.PI * turned + Math.atan(curve * u),
    about,
  };
}

const unitIds = battle.units.map((u) => u.id);
const keysByUnit = new Map(unitIds.map((uid) => [uid, keysOf(uid)]));
const rows = [];
battle.phases.forEach((phase, k) => {
  for (const uid of unitIds) {
    const keys = keysByUnit.get(uid);
    if (!keys) continue;
    const a = keys[k];
    const b = keys[k + 1];
    if (b.men <= 0) continue;
    let movingTimes = 0;
    let off = 0;
    let side = 0;
    let back = 0;
    let samples = 0;
    let speedSum = 0;
    let about = false;
    for (const s of TIMES) {
      const moves = SLOTS.map(([u, v]) => {
        const p = figure(a, b, s, u, v);
        const q = figure(a, b, s + DS, u, v);
        about = p.about;
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const speed = Math.hypot(dx, dy) / (DS * phase.playSeconds);
        // Bearing clockwise from north, like facing.
        const bearing = Math.atan2(dx, dy);
        return { speed, off: Math.abs(angleDelta(p.heading, bearing)) / DEG };
      });
      const blockSpeed = moves.reduce((sum, m) => sum + m.speed, 0) / moves.length;
      if (blockSpeed < WALK_THRESHOLD) continue;
      movingTimes++;
      speedSum += blockSpeed;
      for (const m of moves) {
        if (m.speed < WALK_THRESHOLD * 0.5) continue;
        samples++;
        if (m.off > maxAngle) {
          off++;
          if (m.off > 135) back++;
          else side++;
        }
      }
    }
    if (movingTimes === 0 || samples === 0) continue;
    // The centre's way against the facing halfway through (after any about-face).
    const mid = figure(a, b, 0.5, 0, 0.5);
    const centreBearing = Math.atan2(b.x - a.x, b.y - a.y);
    const travel = Math.hypot(b.x - a.x, b.y - a.y);
    rows.push({
      phase: k + 1,
      unit: uid,
      action: b.action,
      moving: movingTimes / TIMES.length,
      speed: speedSum / movingTimes,
      share: off / samples,
      side: side / samples,
      back: back / samples,
      travel,
      centreOff: travel > 1 ? Math.abs(angleDelta(mid.heading, centreBearing)) / DEG : null,
      about,
    });
  }
});

const listed = rows.filter((r) => r.share >= minShare);
console.log(
  `Blocks moving more than ${maxAngle}° off their heading for ${Math.round(minShare * 100)}% or more of the time they move (${id}).`,
);
console.log("phase  unit                       action   moving  m/s   off   side  back  centre  travel");
for (const r of listed) {
  console.log(
    [
      String(r.phase).padStart(5),
      " ",
      r.unit.padEnd(26),
      r.action.padEnd(8),
      `${Math.round(r.moving * 100)}%`.padStart(6),
      r.speed.toFixed(1).padStart(5),
      `${Math.round(r.share * 100)}%`.padStart(5),
      `${Math.round(r.side * 100)}%`.padStart(5),
      `${Math.round(r.back * 100)}%`.padStart(5),
      (r.centreOff === null ? "-" : `${Math.round(r.centreOff)}°`).padStart(7),
      `${Math.round(r.travel)} m`.padStart(8),
      r.about ? "  about-face" : "",
    ].join(" "),
  );
}
if (listed.length === 0) console.log("None.");
