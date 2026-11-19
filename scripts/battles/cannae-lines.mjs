// Lays out the units of Cannae that fight hand to hand, from the end of
// phase 2 to the end of the battle, so that two units that fight each other
// share one line: the front edges of both lie on it at the start of a phase
// of fighting as well as at its end. The scene moves units in a straight
// line between phase ends, so that is what keeps the front ranks within
// reach of each other for the whole phase (docs/ARCHITECTURE.md, "Giáp lá
// cà"; docs/data/battles/cannae.md, section 11).
//
//   node scripts/battles/cannae-lines.mjs           prints the formations
//   node scripts/battles/cannae-lines.mjs --write   writes them into
//                                                   src/data/battles/battle-of-cannae.json
//
// Only formation, action and men of the units listed below change; titles,
// narration, arrows and every other unit are edited by hand in the file.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const file = join(root, "src", "data", "battles", "battle-of-cannae.json");

/** Metres between the front edges of two units that fight each other. */
const GAP = 1.5;
const round1 = (value) => Math.round(value * 10) / 10;

// --- The line the crescent and the Roman front share -------------------------
//
// A circle arc through `apex`, of radius R. Convex: the middle stands out to
// the north, towards the Romans (the crescent as Hannibal set it). Concave:
// the middle is pushed in to the south. `s` is the distance along the arc
// from the apex, metres, negative to the west.

function arc({ x, y, R, convex }) {
  const k = (convex ? 1 : -1) / R;
  return {
    /** The point at s, `off` metres to the north side of the arc. */
    point(s, off = 0) {
      const t = s * k;
      return { x: x + Math.sin(t) / k + Math.sin(t) * off, y: y - (1 - Math.cos(t)) / k + Math.cos(t) * off };
    },
  };
}

/**
 * A unit whose front edge lies on the arc from s1 to s2. `side` is where the
 * unit stands: "south" (Hannibal's men, facing north) or "north" (Romans,
 * facing south). `back` moves it that many metres further from the arc (the
 * second and third lines). `about` turns it round where it stands.
 */
function onArc(line, s1, s2, depth, side, { back = 0, about = false } = {}) {
  const off = (side === "north" ? 1 : -1) * (GAP / 2 + back);
  const a = line.point(s1, off);
  const b = line.point(s2, off);
  const q = line.point((s1 + s2) / 2, off);
  const frontage = Math.hypot(b.x - a.x, b.y - a.y);
  // Ahead: square to the chord, away from the arc's other side.
  let ahead = { x: -(b.y - a.y) / frontage, y: (b.x - a.x) / frontage };
  if (side === "north") ahead = { x: -ahead.x, y: -ahead.y };
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const bulge = (q.x - mid.x) * ahead.x + (q.y - mid.y) * ahead.y;
  const center = { x: mid.x - ahead.x * (depth / 2), y: mid.y - ahead.y * (depth / 2) };
  let facing = (Math.atan2(ahead.x, ahead.y) * 180) / Math.PI;
  if (about) facing += 180;
  return formation(center.x, center.y, frontage, depth, facing, about ? -bulge : bulge);
}

function formation(x, y, frontage, depth, facing, bulge = 0) {
  const f = {
    center: { x: round1(x), y: round1(y) },
    frontage: round1(frontage),
    depth: round1(depth),
    facing: round1(((facing % 360) + 360) % 360),
  };
  if (Math.abs(bulge) >= 0.05) f.bulge = round1(bulge);
  return f;
}

/** A straight unit by where its front edge is: the middle of the edge, its length, and the way it faces. */
function fromFront(frontX, frontY, frontage, depth, facing) {
  const a = (facing * Math.PI) / 180;
  return formation(frontX - Math.sin(a) * (depth / 2), frontY - Math.cos(a) * (depth / 2), frontage, depth, facing);
}

// --- Hasdrubal's horse ----------------------------------------------------------
//
// Two units side by side, the Iberians by the river (to the west) and the
// Gauls beside them, both facing the Roman cavalry (Polybius 3.115, Livy
// 22.47.1: both peoples met it). Each takes a share of the front in
// proportion to its men, so both stand equally dense (cannae.md, section 18).

const IBERIAN_HORSE = 2000;
const GALLIC_HORSE = 4000;
const IBERIAN_SHARE = IBERIAN_HORSE / (IBERIAN_HORSE + GALLIC_HORSE);
/** Metres between the Iberian and the Gallic horse when they stand side by side. */
const HORSE_GAP = 4;

/**
 * The Iberian and Gallic horse side by side along a straight front from x1
 * (west) to x2 (east) at y, both facing `facing` (0 north, 180 south). The
 * Iberians take the west end.
 */
function horseSideBySide(x1, x2, y, depth, facing) {
  const split = x1 + (x2 - x1) * IBERIAN_SHARE;
  const iberian = [x1, split - HORSE_GAP / 2];
  const gallic = [split + HORSE_GAP / 2, x2];
  const unit = ([a, b]) => fromFront((a + b) / 2, y, b - a, depth, facing);
  return { "iberian-cavalry": unit(iberian), "gallic-cavalry": unit(gallic) };
}

// --- The lines at each phase end ----------------------------------------------

const LINE = {
  // End of phase 3: the legions have closed with the crescent, still convex.
  3: arc({ x: -60, y: -152, R: 1450, convex: true }),
  // End of phase 4: pushed in.
  4: arc({ x: -60, y: -462, R: 975, convex: false }),
  5: arc({ x: -60, y: -495, R: 800, convex: false }),
  6: arc({ x: -60, y: -510, R: 550, convex: false }),
};

/** [unit, west end, east end, depth] along the line, for the crescent and for the Roman front. */
const CRESCENT = {
  3: [["gauls-left", -637.5, -382.5, 30], ["iberians-left", -382.5, -127.5, 30], ["gauls-centre", -127.5, 127.5, 35], ["iberians-right", 127.5, 382.5, 30], ["gauls-right", 382.5, 637.5, 30]],
  4: [["gauls-left", -602.5, -382.5, 35], ["iberians-left", -382.5, -127.5, 30], ["gauls-centre", -127.5, 127.5, 35], ["iberians-right", 127.5, 382.5, 30], ["gauls-right", 382.5, 602.5, 35]],
  5: [["gauls-left", -582.5, -382.5, 35], ["iberians-left", -382.5, -127.5, 30], ["gauls-centre", -127.5, 127.5, 40], ["iberians-right", 127.5, 382.5, 30], ["gauls-right", 382.5, 582.5, 35]],
  6: [["gauls-left", -470, -300, 35], ["iberians-left", -300, -120, 30], ["gauls-centre", -120, 120, 40], ["iberians-right", 120, 300, 30], ["gauls-right", 300, 470, 35]],
};
const ROMAN_FRONT = {
  3: [["hastati", -630, 0, 36], ["allied-infantry-front", 0, 630, 44]],
  // As wide as at the end of phase 3: a front that narrows while the line
  // it stands on bends the other way would cut through the crescent halfway.
  4: [["hastati", -630, 0, 45], ["allied-infantry-front", 0, 630, 45]],
  5: [["hastati", -320, 0, 80], ["allied-infantry-front", 0, 320, 90]],
  6: [["hastati", -220, 0, 50], ["allied-infantry-front", 0, 220, 50]],
};

/** key -> unit -> { formation?, action?, men? } */
const out = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
const set = (key, unit, state) => {
  out[key][unit] = { ...out[key][unit], ...state };
};

// The crescent stands as it was set until the legions reach it: the same
// formations at the ends of phases 1, 2 and 3.
for (const key of [1, 2, 3]) {
  for (const [unit, s1, s2, depth] of CRESCENT[3]) set(key, unit, { formation: onArc(LINE[3], s1, s2, depth, "south") });
}
for (const key of [4, 5, 6]) {
  for (const [unit, s1, s2, depth] of CRESCENT[key]) set(key, unit, { formation: onArc(LINE[key], s1, s2, depth, "south") });
}
for (const key of [3, 4, 5, 6]) {
  for (const [unit, s1, s2, depth] of ROMAN_FRONT[key]) set(key, unit, { formation: onArc(LINE[key], s1, s2, depth, "north") });
}

// The second line follows 12 m behind the first. At the end of phase 3 it is
// as long as the first; in phase 4 it crowds in behind the middle, half as
// long and more than twice as deep.
set(3, "principes", { formation: onArc(LINE[3], -630, 0, 36, "north", { back: 36 + 12 }) });
set(3, "allied-infantry-rear", { formation: onArc(LINE[3], 0, 630, 44, "north", { back: 44 + 12 }) });
set(4, "principes", { formation: onArc(LINE[4], -310, -10, 90, "north", { back: 45 + 12 }) });
set(4, "allied-infantry-rear", { formation: onArc(LINE[4], 10, 310, 100, "north", { back: 45 + 12 }) });

// Behind them the light troops, back through the ranks in phase 3 (their
// backs to the enemy at the end of it), and last the triarii.
set(3, "roman-velites", { formation: onArc(LINE[3], -420, -10, 24, "north", { back: 116, about: true }) });
set(3, "allied-light-infantry", { formation: onArc(LINE[3], 10, 420, 24, "north", { back: 116, about: true }) });
set(3, "triarii", { formation: onArc(LINE[3], -330, 330, 24, "north", { back: 154 }) });
set(4, "roman-velites", { formation: fromFront(-165, -240, 200, 60, 180) });
set(4, "allied-light-infantry", { formation: fromFront(45, -240, 200, 60, 180) });
set(4, "triarii", { formation: fromFront(-60, -170, 560, 26, 180) });

// Phases 5 and 6: the Romans are a box. Its front is on the line; the second
// line has turned out to both flanks; the triarii have turned about to close
// the rear; the light troops are inside.
const BOX = {
  5: { flank: 220, west: 110, east: 120, rear: 40, libyan: 240, north: 45, cavalry: 60 },
  6: { flank: 170, west: 60, east: 70, rear: 40, libyan: 200, north: 15, cavalry: 60 },
};
for (const key of [5, 6]) {
  const box = BOX[key];
  const [[, s1, , depthWest], [, , s2, depthEast]] = ROMAN_FRONT[key];
  // The rear corners of the two front units.
  const corner = (unit) => {
    const f = out[key][unit].formation;
    const a = (f.facing * Math.PI) / 180;
    const sign = unit === "hastati" ? 1 : -1;
    // Its own right is the west for a unit that faces south.
    return {
      x: f.center.x + sign * Math.cos(a) * (f.frontage / 2) - Math.sin(a) * (f.depth / 2),
      y: f.center.y - sign * Math.sin(a) * (f.frontage / 2) - Math.cos(a) * (f.depth / 2),
    };
  };
  const west = corner("hastati");
  const east = corner("allied-infantry-front");
  void s1;
  void s2;
  void depthWest;
  void depthEast;
  const xWest = west.x - 3;
  const xEast = east.x + 3;
  const south = Math.max(west.y, east.y) + 8;
  const north = south + box.flank;
  const middle = (south + north) / 2;
  set(key, "principes", { formation: fromFront(xWest, middle, box.flank, box.west, 270) });
  set(key, "allied-infantry-rear", { formation: fromFront(xEast, middle, box.flank, box.east, 90) });
  // The Libyans come round the outside of the crescent's wings, so at the
  // end of phase 5 they stand a little further north than the flank they
  // strike. They must cover that flank all the same: men fall only in the
  // files that have an enemy before them, so a flank half covered loses
  // every man of its covered half and none of the other.
  set(key, "libyans-left", { formation: fromFront(xWest - GAP, middle + box.north, box.libyan, 60, 90) });
  set(key, "libyans-right", { formation: fromFront(xEast + GAP, middle + box.north, box.libyan, 60, 270) });
  // The rear: the triarii across the whole width, Hasdrubal's horse against
  // them, the Iberians to the west as they stood by the river.
  const rear = north + 10 + box.rear;
  const width = xEast - xWest;
  const centre = (xWest + xEast) / 2;
  set(key, "triarii", { formation: fromFront(centre, rear, width, box.rear, 0) });
  for (const [unit, f] of Object.entries(horseSideBySide(xWest + 2, xEast - 2, rear + GAP, box.cavalry, 180))) set(key, unit, { formation: f });
  // Inside: between the flanks, behind the front, before the rear.
  const inWest = xWest + box.west + 8;
  const inEast = xEast - box.east - 8;
  const inSouth = south + 2;
  const inNorth = north - 2;
  const half = (inEast - inWest) / 2 - 4;
  const inMiddle = (inWest + inEast) / 2;
  set(key, "roman-velites", { formation: fromFront(inMiddle - half / 2 - 4, inSouth, half, inNorth - inSouth, 180) });
  set(key, "allied-light-infantry", { formation: fromFront(inMiddle + half / 2 + 4, inSouth, half, inNorth - inSouth, 180) });
}

// The cavalry by the river: in contact at the end of phase 2, the Romans
// pushed back and cut down in phase 3, in flight in phase 4. Hasdrubal's
// Iberians and Gauls stand side by side and both fight in phase 3.
set(2, "roman-cavalry", { formation: fromFront(-1075, 40 + GAP / 2, 450, 70, 180), action: "advance", men: 2400 });
for (const [unit, f] of Object.entries(horseSideBySide(-1300, -900, 40 - GAP / 2, 100, 0))) set(2, unit, { formation: f });
set(3, "roman-cavalry", { formation: fromFront(-1090, 120 + GAP / 2, 300, 80, 180), action: "fight", men: 900 });
for (const [unit, f] of Object.entries(horseSideBySide(-1275, -925, 120 - GAP / 2, 100, 0))) set(3, unit, { formation: f });
// Phase 4: round behind the Roman army, towards the far wing. The Gauls,
// on the inner side, lead; the Iberians follow.
set(4, "gallic-cavalry", { formation: formation(300, 420, 350, 80, 95) });
set(4, "iberian-cavalry", { formation: formation(-50, 470, 240, 60, 95) });

// --- The fight at the gate of Hannibal's camp (Polybius 3.117) -----------------
//
// The camp faces east (terrain.scenery, "hannibal-camp"), so its front, with
// the main gate in the middle, is the line x = -3475 and the gate is at
// y = -500. The guard holds the gate from inside; the force from the large
// Roman camp, which reaches it at the end of phase 2, attacks from outside.
// Both fronts lie on one north-south line: it stays at the gate while the
// guard holds out (phases 3, 4), then the Romans push it into the camp
// (phase 5). In phase 6 Hannibal comes to the camp's relief: the Romans turn
// about and fall back into the large camp through its main gate, in the
// middle of its south side (that camp faces south), and the guard follows
// them a short way.

const HANNIBAL_GATE = { x: -3475, y: -500 };
const LARGE_CAMP_GATE = { x: -1600, y: 775 };
const GATE_FRONTAGE = 200;
/** Metres the line of the fight lies inside Hannibal's gate, at each phase end. */
const GATE_LINE = { 2: 0, 3: 0, 4: 10, 5: 40 };
for (const [key, inside] of Object.entries(GATE_LINE)) {
  const x = HANNIBAL_GATE.x - inside;
  set(Number(key), "camp-force", { formation: fromFront(x + GAP / 2, HANNIBAL_GATE.y, GATE_FRONTAGE, 110, 270) });
  set(Number(key), "camp-guard", { formation: fromFront(x - GAP / 2, HANNIBAL_GATE.y, GATE_FRONTAGE, 80, 90) });
}
{
  const from = out[5]["camp-force"].formation.center;
  const dx = LARGE_CAMP_GATE.x - from.x;
  const dy = LARGE_CAMP_GATE.y - from.y;
  const length = Math.hypot(dx, dy);
  const way = (Math.atan2(dx, dy) * 180) / Math.PI;
  // A column through the gate, its rear rank 10 m inside.
  const depth = 120;
  const along = depth / 2 + 10;
  set(6, "camp-force", {
    formation: formation(LARGE_CAMP_GATE.x + (dx / length) * along, LARGE_CAMP_GATE.y + (dy / length) * along, 120, depth, way),
  });
  const guard = out[5]["camp-guard"].formation.center;
  const chase = 450;
  set(6, "camp-guard", {
    formation: formation(guard.x + (dx / length) * chase, guard.y + (dy / length) * chase, GATE_FRONTAGE, 80, way),
  });
}

// Actions and men that go with the formations above.
const STATES = {
  2: {
    "roman-velites": ["skirmish"],
    "allied-light-infantry": ["skirmish"],
    "balearic-slingers": ["skirmish"],
    "light-spearmen": ["skirmish"],
    "camp-force": ["advance", 10000],
    "camp-guard": ["stand", 8000],
    "iberian-cavalry": ["advance", IBERIAN_HORSE],
    "gallic-cavalry": ["advance", GALLIC_HORSE],
  },
  3: {
    // The 80 horsemen lost by the river, by the length of front each has on
    // the Roman cavalry (about 80 m and 225 m).
    "iberian-cavalry": ["fight", 1980],
    "gallic-cavalry": ["fight", 3940],
    hastati: ["advance", 11400],
    principes: ["advance", 11400],
    triarii: ["advance", 4200],
    "allied-infantry-front": ["advance", 14000],
    "allied-infantry-rear": ["advance", 14000],
    "roman-velites": ["retreat", 7500],
    "allied-light-infantry": ["retreat", 6650],
    "allied-cavalry": ["stand", 3750],
    numidians: ["skirmish", 3990],
    "camp-force": ["fight", 9800],
    "camp-guard": ["fight", 7700],
  },
  4: {
    hastati: ["fight", 9800],
    "allied-infantry-front": ["fight", 12500],
    principes: ["advance", 11400],
    "allied-infantry-rear": ["advance", 14000],
    triarii: ["advance", 4200],
    "roman-velites": ["advance", 7400],
    "allied-light-infantry": ["advance", 6600],
    "gauls-left": ["fight", 4100],
    "iberians-left": ["fight", 3750],
    "gauls-centre": ["fight", 4900],
    "iberians-right": ["fight", 3750],
    "gauls-right": ["fight", 4100],
    "allied-cavalry": ["stand", 3500],
    numidians: ["skirmish", 3980],
    "iberian-cavalry": ["advance", 1980],
    "gallic-cavalry": ["advance", 3940],
    "camp-force": ["fight", 9600],
    "camp-guard": ["fight", 7300],
  },
  5: {
    hastati: ["fight", 6800],
    "allied-infantry-front": ["fight", 9800],
    principes: ["advance", 10000],
    "allied-infantry-rear": ["advance", 12400],
    triarii: ["advance", 4200],
    "roman-velites": ["advance", 7000],
    "allied-light-infantry": ["advance", 6300],
    "gauls-left": ["advance", 4000],
    "iberians-left": ["fight", 3500],
    "gauls-centre": ["fight", 4400],
    "iberians-right": ["fight", 3500],
    "gauls-right": ["advance", 4000],
    "libyans-left": ["charge", 4000],
    "libyans-right": ["charge", 4000],
    "iberian-cavalry": ["charge", 1980],
    "gallic-cavalry": ["charge", 3940],
    "camp-force": ["fight", 9400],
    "camp-guard": ["fight", 6700],
  },
  6: {
    hastati: ["fight", 400],
    "allied-infantry-front": ["fight", 500],
    principes: ["fight", 500],
    "allied-infantry-rear": ["fight", 600],
    triarii: ["fight", 300],
    "roman-velites": ["stand", 3300],
    "allied-light-infantry": ["stand", 3300],
    "gauls-left": ["advance", 4000],
    "iberians-left": ["fight", 3500],
    "gauls-centre": ["fight", 4000],
    "iberians-right": ["fight", 3500],
    "gauls-right": ["advance", 4000],
    "libyans-left": ["fight", 3750],
    "libyans-right": ["fight", 3750],
    // 80 more against the triarii, by length of front (a third and two thirds).
    "iberian-cavalry": ["fight", 1960],
    "gallic-cavalry": ["fight", 3880],
    // Polybius 3.117: Hannibal kills two thousand of them.
    "camp-force": ["retreat", 7400],
    "camp-guard": ["pursue", 6700],
  },
};
for (const [key, units] of Object.entries(STATES)) {
  for (const [unit, [action, men]] of Object.entries(units)) {
    set(Number(key), unit, men === undefined ? { action } : { action, men });
  }
}

// --- Into the file -------------------------------------------------------------

const formatFormation = (f) =>
  `{ "center": { "x": ${f.center.x}, "y": ${f.center.y} }, "frontage": ${f.frontage}, "depth": ${f.depth}, "facing": ${f.facing}${
    f.bulge === undefined ? "" : `, "bulge": ${f.bulge}`
  } }`;

let text = readFileSync(file, "utf8");
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const lines = text.split(eol);
const battle = JSON.parse(text);
const phaseIds = battle.phases.map((phase) => phase.id);

/** The line numbers of the states of phase `key` (1-based phase number). */
function section(key) {
  const start = lines.findIndex((line) => line.includes(`"id": "${phaseIds[key - 1]}"`));
  const next = key < phaseIds.length ? lines.findIndex((line) => line.includes(`"id": "${phaseIds[key]}"`)) : lines.length;
  if (start < 0 || next < 0) throw new Error(`No phase ${key} in the file`);
  return [start, next];
}

let changed = 0;
for (const key of Object.keys(out).map(Number)) {
  const [start, end] = section(key);
  for (const [unit, state] of Object.entries(out[key])) {
    const at = lines.findIndex((line, i) => i > start && i < end && line.includes(`"unit": "${unit}"`));
    if (at < 0) throw new Error(`Phase ${key} has no state for ${unit}`);
    const edit = (offset, name, value) => {
      const line = lines[at + offset];
      const pattern = new RegExp(`^(\\s*"${name}": )(.*?)(,?)$`);
      if (!pattern.test(line)) throw new Error(`Phase ${key}, ${unit}: expected "${name}" on line ${at + offset + 1}`);
      const edited = line.replace(pattern, (_, head, __, comma) => `${head}${value}${comma}`);
      if (edited !== line) changed++;
      lines[at + offset] = edited;
    };
    if (state.formation) edit(1, "formation", formatFormation(state.formation));
    if (state.action) edit(2, "action", `"${state.action}"`);
    if (state.men !== undefined) edit(3, "men", String(state.men));
  }
}

if (process.argv.includes("--write")) {
  text = lines.join(eol);
  JSON.parse(text);
  writeFileSync(file, text);
  console.log(`${file}: ${changed} lines changed.`);
} else {
  for (const key of Object.keys(out)) {
    console.log(`End of phase ${key} (${phaseIds[key - 1]})`);
    for (const [unit, state] of Object.entries(out[key])) {
      console.log(
        `  ${unit.padEnd(24)} ${(state.action ?? "").padEnd(9)} ${String(state.men ?? "").padStart(6)}  ${state.formation ? formatFormation(state.formation) : ""}`,
      );
    }
  }
  console.log(`${changed} lines would change. Run with --write to change the file.`);
}
