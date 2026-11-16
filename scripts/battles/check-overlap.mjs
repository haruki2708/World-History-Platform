// Reports where unit blocks of a battle run into each other, at every phase
// boundary and in between (every quarter phase), the way the scene moves them:
// straight-line interpolation of centre, size and bulge, facing the shorter
// way round. Bulge is included. Not part of `npm run validate`: some overlap
// while moving is intended (light troops falling back through their own lines,
// a pursuit), so this is a tool for editing the data, read by eye.
//
//   node scripts/battles/check-overlap.mjs [battle id] [--min 0.05]
//
// Each line: time in phases, SAME (one side) or x (both sides), the largest
// share of either block that lies inside the other, and the two units.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const minIndex = args.indexOf("--min");
const minShare = minIndex >= 0 ? Number(args[minIndex + 1]) : 0.05;
const id = args.find((arg, i) => !arg.startsWith("--") && i !== minIndex + 1) ?? "battle-of-cannae";
const battle = JSON.parse(readFileSync(join(root, "src", "data", "battles", `${id}.json`), "utf8"));

const DEG = Math.PI / 180;
const STEP = 0.25;
const SAMPLES = 14;

const side = new Map(battle.units.map((u) => [u.id, u.side]));
const keys = [battle.initial, ...battle.phases.map((p) => p.units)].map(
  (states) => new Map(states.map((s) => [s.unit, s])),
);

const lerp = (a, b, t) => a + (b - a) * t;
function lerpAngle(a, b, t) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

/** The unit's formation and men at battle time `time`, or null. */
function stateAt(unit, time) {
  const k = Math.min(Math.floor(time), keys.length - 2);
  const s = time - k;
  let a = keys[k].get(unit);
  for (let i = k; !a && i >= 0; i--) a = keys[i].get(unit);
  if (!a) return null;
  const b = keys[k + 1].get(unit) ?? a;
  const fa = a.formation;
  const fb = b.formation;
  return {
    men: lerp(a.men, b.men, s),
    x: lerp(fa.center.x, fb.center.x, s),
    y: lerp(fa.center.y, fb.center.y, s),
    frontage: lerp(fa.frontage, fb.frontage, s),
    depth: lerp(fa.depth, fb.depth, s),
    facing: lerpAngle(fa.facing, fb.facing, s),
    bulge: lerp(fa.bulge ?? 0, fb.bulge ?? 0, s),
  };
}

function axes(f) {
  const a = f.facing * DEG;
  return { ahead: [Math.sin(a), Math.cos(a)], along: [Math.cos(a), -Math.sin(a)] };
}

/** Sample points over the block, placed as the scene places figures. */
function points(f) {
  const { ahead, along } = axes(f);
  const out = [];
  for (let i = 0; i < SAMPLES; i++) {
    for (let j = 0; j < SAMPLES; j++) {
      const u = (i + 0.5) / SAMPLES - 0.5;
      const v = (j + 0.5) / SAMPLES;
      const forward = f.depth * (0.5 - v) + f.bulge * (1 - 4 * u * u);
      out.push([f.x + along[0] * u * f.frontage + ahead[0] * forward, f.y + along[1] * u * f.frontage + ahead[1] * forward]);
    }
  }
  return out;
}

function inside([px, py], f) {
  const { ahead, along } = axes(f);
  const dx = px - f.x;
  const dy = py - f.y;
  const u = (dx * along[0] + dy * along[1]) / f.frontage;
  if (Math.abs(u) > 0.5) return false;
  const forward = dx * ahead[0] + dy * ahead[1] - f.bulge * (1 - 4 * u * u);
  return Math.abs(forward) <= f.depth / 2;
}

const last = battle.phases.length;
let found = 0;
for (let time = 0; time <= last + 1e-9; time += STEP) {
  const blocks = battle.units
    .map((u) => ({ id: u.id, f: stateAt(u.id, Math.min(time, last)) }))
    .filter((b) => b.f && b.f.men > 0)
    .map((b) => ({ ...b, points: points(b.f) }));
  const lines = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      const share = Math.max(
        a.points.filter((p) => inside(p, b.f)).length / a.points.length,
        b.points.filter((p) => inside(p, a.f)).length / b.points.length,
      );
      if (share < minShare) continue;
      const kind = side.get(a.id) === side.get(b.id) ? "SAME" : "x   ";
      lines.push(`  ${kind} ${String(Math.round(share * 100)).padStart(3)}%  ${a.id} / ${b.id}`);
    }
  }
  if (lines.length > 0) {
    console.log(`t = ${time}`);
    console.log(lines.join("\n"));
    found += lines.length;
  }
}
if (found === 0) console.log(`No blocks overlap by ${Math.round(minShare * 100)}% or more.`);
