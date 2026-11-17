// Checks the 3D battle data against the contract in src/lib/battle.ts:
// src/data/battles/unit-types.json, every src/data/battles/<event-id>.json
// and its terrain grid in public/data/terrain/. Exits with code 1 on errors.
// Run as part of `npm run validate`. Owned by lane 2 from T-016 on.
//
//   node scripts/battles/validate-battles.mjs

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const battlesDir = join(root, "src", "data", "battles");
const terrainDir = join(root, "public", "data", "terrain");

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACTIONS = new Set(["stand", "advance", "charge", "fight", "skirmish", "retreat", "rout", "pursue"]);
const LANDMARK_KINDS = new Set(["camp", "town", "hill", "ford", "other"]);

const errors = [];
const warnings = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

function checkText(where, value) {
  if (!value || typeof value.en !== "string" || typeof value.vi !== "string" || !value.en.trim() || !value.vi.trim()) {
    fail(where, "needs non-empty `en` and `vi`");
  }
}

function checkSources(where, sources) {
  if (!Array.isArray(sources) || sources.length === 0) return fail(where, "needs at least one source");
  for (const [i, source] of sources.entries()) {
    if (!source || typeof source.title !== "string" || !source.title.trim()) fail(`${where}[${i}]`, "needs a title");
    if (source.url !== undefined && !/^https:\/\//.test(source.url)) fail(`${where}[${i}]`, "url must start with https://");
  }
}

function checkRange(where, range) {
  if (!range || !isNumber(range.min) || !isNumber(range.max) || range.min < 0 || range.min > range.max) {
    return fail(where, "needs numbers min <= max, not negative");
  }
  if (range.note !== undefined) checkText(`${where}.note`, range.note);
}

// --- Geometry of a formation ------------------------------------------------

/** A formation as a rectangle: its centre, unit vectors along the front and ahead, half sizes. */
function corners(f) {
  const a = (f.facing * Math.PI) / 180;
  return {
    c: f.center,
    ahead: { x: Math.sin(a), y: Math.cos(a) },
    along: { x: Math.cos(a), y: -Math.sin(a) },
    hw: f.frontage / 2,
    hd: f.depth / 2,
    area: f.frontage * f.depth,
  };
}

/** Share of rectangle `a` that lies inside rectangle `b`, sampled on a 12 × 12 grid. */
function shareInside(a, b) {
  const n = 12;
  let hits = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const u = ((i + 0.5) / n) * 2 - 1;
      const v = ((j + 0.5) / n) * 2 - 1;
      const x = a.c.x + a.along.x * u * a.hw + a.ahead.x * v * a.hd;
      const y = a.c.y + a.along.y * u * a.hw + a.ahead.y * v * a.hd;
      const dx = x - b.c.x;
      const dy = y - b.c.y;
      if (Math.abs(dx * b.along.x + dy * b.along.y) <= b.hw && Math.abs(dx * b.ahead.x + dy * b.ahead.y) <= b.hd) hits++;
    }
  }
  return hits / (n * n);
}

// --- Shared data ------------------------------------------------------------

const polities = new Set(readJson(join(root, "src", "data", "polities.json")).map((p) => p.id));
const events = new Map(readJson(join(root, "src", "data", "events.json")).map((e) => [e.id, e]));

const unitTypes = new Map();
for (const [i, type] of readJson(join(battlesDir, "unit-types.json")).entries()) {
  const where = `unit-types.json[${i}]`;
  if (!KEBAB.test(type.id ?? "")) fail(where, "id must be kebab-case");
  else if (unitTypes.has(type.id)) fail(where, `duplicate id ${type.id}`);
  checkText(`${where}.name`, type.name);
  if (!KEBAB.test(type.model ?? "")) fail(where, "model must be a kebab-case file stem");
  if (type.mounted !== undefined && typeof type.mounted !== "boolean") fail(where, "mounted must be true or false");
  unitTypes.set(type.id, type);
}

// --- Each battle ------------------------------------------------------------

const battleFiles = readdirSync(battlesDir).filter((f) => f.endsWith(".json") && f !== "unit-types.json");

for (const file of battleFiles) {
  const b = readJson(join(battlesDir, file));
  const where = file;

  if (`${b.id}.json` !== file) fail(where, `id ${b.id} must match the file name`);
  if (!events.has(b.id)) fail(where, `id ${b.id} is not an event in events.json`);
  if (!b.origin || !isNumber(b.origin.lng) || !isNumber(b.origin.lat)) fail(where, "origin needs lng and lat");
  checkText(`${where}.date`, b.date);
  checkText(`${where}.uncertainty`, b.uncertainty);
  checkSources(`${where}.sources`, b.sources);

  // Sides and units.
  const sides = new Map();
  for (const [i, side] of (b.sides ?? []).entries()) {
    const at = `${where}.sides[${i}]`;
    if (!KEBAB.test(side.id ?? "") || sides.has(side.id)) fail(at, "id must be kebab-case and unique");
    if (!polities.has(side.polityId)) fail(at, `polityId ${side.polityId} is not in polities.json`);
    checkText(`${at}.name`, side.name);
    if (!Array.isArray(side.commanders) || side.commanders.length === 0) fail(at, "needs at least one commander");
    else side.commanders.forEach((c, j) => checkText(`${at}.commanders[${j}]`, c));
    checkRange(`${at}.strength`, side.strength);
    if (side.casualties !== undefined) checkRange(`${at}.casualties`, side.casualties);
    sides.set(side.id, side);
  }
  if (sides.size < 2) fail(where, "needs at least two sides");

  const units = new Map();
  const menBySide = new Map();
  for (const [i, unit] of (b.units ?? []).entries()) {
    const at = `${where}.units[${i}]`;
    if (!KEBAB.test(unit.id ?? "") || units.has(unit.id)) fail(at, "id must be kebab-case and unique");
    if (!sides.has(unit.side)) fail(at, `side ${unit.side} is not a side of this battle`);
    if (!unitTypes.has(unit.type)) fail(at, `type ${unit.type} is not in unit-types.json`);
    checkText(`${at}.name`, unit.name);
    if (!Number.isInteger(unit.men) || unit.men <= 0) fail(at, "men must be a positive whole number");
    units.set(unit.id, unit);
    menBySide.set(unit.side, (menBySide.get(unit.side) ?? 0) + (unit.men || 0));
  }
  for (const [id, side] of sides) {
    const men = menBySide.get(id) ?? 0;
    if (side.strength && (men < side.strength.min * 0.9 || men > side.strength.max * 1.1)) {
      warn(where, `units of ${id} add up to ${men}, outside strength ${side.strength.min}–${side.strength.max} (±10%)`);
    }
  }

  // Terrain.
  const t = b.terrain ?? {};
  const terrainWhere = `${where}.terrain`;
  for (const key of ["width", "height", "minX", "maxX", "minY", "maxY"]) {
    if (!isNumber(t[key])) fail(terrainWhere, `${key} must be a number`);
  }
  if (!(t.minX < t.maxX && t.minY < t.maxY)) fail(terrainWhere, "needs minX < maxX and minY < maxY");
  if (!(Number.isInteger(t.width) && t.width >= 2 && Number.isInteger(t.height) && t.height >= 2)) {
    fail(terrainWhere, "width and height must be whole numbers >= 2");
  }
  const gridPath = join(terrainDir, t.file ?? "");
  if (!t.file || !existsSync(gridPath)) fail(terrainWhere, `file ${t.file} not found in public/data/terrain/`);
  else if (statSync(gridPath).size !== t.width * t.height * 2) {
    fail(terrainWhere, `file is ${statSync(gridPath).size} bytes, expected width × height × 2 = ${t.width * t.height * 2}`);
  }
  checkSources(`${terrainWhere}.sources`, t.sources);
  const inside = (p) => isNumber(p?.x) && isNumber(p?.y) && p.x >= t.minX && p.x <= t.maxX && p.y >= t.minY && p.y <= t.maxY;
  for (const [i, river] of (t.rivers ?? []).entries()) {
    const at = `${terrainWhere}.rivers[${i}]`;
    checkText(`${at}.name`, river.name);
    if (!Array.isArray(river.points) || river.points.length < 2) fail(at, "needs at least two points");
    else if (!river.points.every(inside)) fail(at, "every point must lie inside the terrain");
    if (!isNumber(river.width) || river.width <= 0) fail(at, "width must be positive");
  }
  for (const [i, mark] of (t.landmarks ?? []).entries()) {
    const at = `${terrainWhere}.landmarks[${i}]`;
    checkText(`${at}.name`, mark.name);
    if (!LANDMARK_KINDS.has(mark.kind)) fail(at, `kind ${mark.kind} is not one of ${[...LANDMARK_KINDS].join(", ")}`);
    if (!inside(mark.point)) fail(at, "point must lie inside the terrain");
  }

  // States: the start and the end of every phase list every unit once.
  const lastMen = new Map([...units].map(([id, u]) => [id, u.men]));
  const checkStates = (at, states) => {
    if (!Array.isArray(states)) return fail(at, "must be a list of unit states");
    const seen = new Set();
    for (const [i, s] of states.entries()) {
      const sw = `${at}[${i}]`;
      if (!units.has(s.unit)) fail(sw, `unit ${s.unit} is not a unit of this battle`);
      else if (seen.has(s.unit)) fail(sw, `unit ${s.unit} listed twice`);
      seen.add(s.unit);
      const f = s.formation ?? {};
      if (!inside(f.center)) fail(sw, "formation.center must lie inside the terrain");
      if (!(isNumber(f.frontage) && f.frontage > 0 && isNumber(f.depth) && f.depth > 0)) fail(sw, "frontage and depth must be positive");
      if (!(isNumber(f.facing) && f.facing >= 0 && f.facing < 360)) fail(sw, "facing must be in [0, 360)");
      if (f.bulge !== undefined && !isNumber(f.bulge)) fail(sw, "bulge must be a number");
      if (!ACTIONS.has(s.action)) fail(sw, `action ${s.action} is not one of ${[...ACTIONS].join(", ")}`);
      if (!Number.isInteger(s.men) || s.men < 0) fail(sw, "men must be a whole number >= 0");
      else if (units.has(s.unit)) {
        if (s.men > lastMen.get(s.unit)) fail(sw, `men ${s.men} is more than before (${lastMen.get(s.unit)}); units only lose men`);
        lastMen.set(s.unit, s.men);
      }
    }
    for (const id of units.keys()) if (!seen.has(id)) fail(at, `unit ${id} is missing`);
    checkOverlap(at, states);
  };

  // Blocks of the same side must not sit on top of each other: at most
  // MAX_OVERLAP of the smaller block may lie inside another. Bulge is ignored.
  const MAX_OVERLAP = 0.25;
  function checkOverlap(at, states) {
    const blocks = states
      .filter((s) => units.has(s.unit) && s.men > 0 && isNumber(s.formation?.facing))
      .map((s) => ({ ...s, side: units.get(s.unit).side, ...corners(s.formation) }));
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];
        if (a.side !== b.side) continue;
        const [small, large] = a.area <= b.area ? [a, b] : [b, a];
        const share = shareInside(small, large);
        if (share > MAX_OVERLAP) {
          fail(at, `${a.unit} and ${b.unit} overlap (${Math.round(share * 100)}% of the smaller block)`);
        }
      }
    }
  }

  // Every phase must move or change at least one unit.
  const sameState = (a, b) => JSON.stringify([a.formation, a.action, a.men]) === JSON.stringify([b.formation, b.action, b.men]);
  let before = new Map((Array.isArray(b.initial) ? b.initial : []).map((s) => [s.unit, s]));
  for (const [i, phase] of (b.phases ?? []).entries()) {
    const after = new Map((Array.isArray(phase.units) ? phase.units : []).map((s) => [s.unit, s]));
    const changed = [...after].some(([id, s]) => !before.has(id) || !sameState(before.get(id), s));
    if (!changed) fail(`${where}.phases[${i}]`, "no unit changes position, action or men");
    before = after;
  }

  // Hand to hand (`fight`, src/lib/battle.ts): the scene pairs the front men
  // of a unit off with the enemy's, so the front of the unit must lie on the
  // front of an enemy unit that fights too, at the start of the phase as well
  // as at its end (in between, units move in a straight line). Checked at
  // FRONT_SAMPLES points across the front: at least MIN_CONTACT of them must
  // be within CONTACT metres of an enemy front. Bulge is included. A unit that
  // turns about in the phase fights with what was its rear rank.
  const CONTACT = 8;
  const MIN_CONTACT = 0.15;
  /** Below this share the data passes, with a warning: much of the front has nobody to fight. */
  const WARN_CONTACT = 0.5;
  const FRONT_SAMPLES = 21;
  const ABOUT_FACE = 135;
  const turnsAbout = (from, to) => {
    const turn = Math.abs((((to.facing - from.facing) % 360) + 540) % 360 - 180);
    return turn >= ABOUT_FACE;
  };
  /** The fighting edge of a formation: its front, or its rear when `rear`. */
  const edgeOf = (f, rear) => {
    const a = (f.facing * Math.PI) / 180;
    return { f, sin: Math.sin(a), cos: Math.cos(a), sign: rear ? -1 : 1 };
  };
  const edgePoint = (edge, u) => {
    const { f, sin, cos, sign } = edge;
    const across = u * f.frontage;
    const forward = sign * (f.depth / 2) + (f.bulge ?? 0) * (1 - 4 * u * u);
    return { x: f.center.x + cos * across + sin * forward, y: f.center.y - sin * across + cos * forward };
  };
  const distanceToEdge = (edge, point) => {
    const { f, sin, cos, sign } = edge;
    const dx = point.x - f.center.x;
    const dy = point.y - f.center.y;
    const across = dx * cos - dy * sin;
    const forward = dx * sin + dy * cos;
    const u = Math.min(Math.max(across / f.frontage, -0.5), 0.5);
    const at = sign * (f.depth / 2) + (f.bulge ?? 0) * (1 - 4 * u * u);
    return Math.hypot(forward - at, Math.max(Math.abs(across) - f.frontage / 2, 0));
  };
  {
    let start = new Map((Array.isArray(b.initial) ? b.initial : []).map((state) => [state.unit, state]));
    for (const [i, phase] of (b.phases ?? []).entries()) {
      const end = new Map((Array.isArray(phase.units) ? phase.units : []).map((state) => [state.unit, state]));
      const fighters = [...end.values()].filter(
        (state) => state.action === "fight" && units.has(state.unit) && start.has(state.unit) && isNumber(state.formation?.facing),
      );
      for (const state of fighters) {
        for (const [moment, states] of [["start", start], ["end", end]]) {
          const edges = (who) => {
            const rear = moment === "start" && turnsAbout(start.get(who.unit).formation, who.formation);
            return edgeOf(states.get(who.unit).formation, rear);
          };
          const own = edges(state);
          const enemies = fighters.filter((other) => units.get(other.unit).side !== units.get(state.unit).side).map(edges);
          let touching = 0;
          for (let k = 0; k < FRONT_SAMPLES; k++) {
            const point = edgePoint(own, (k + 0.5) / FRONT_SAMPLES - 0.5);
            if (enemies.some((enemy) => distanceToEdge(enemy, point) <= CONTACT)) touching++;
          }
          if (touching >= MIN_CONTACT * FRONT_SAMPLES && touching < WARN_CONTACT * FRONT_SAMPLES) {
            warn(
              `${where}.phases[${i}]`,
              `${state.unit} fights hand to hand, but at the ${moment} of the phase only ${touching} of ${FRONT_SAMPLES} points of its front are on the front of an enemy unit that fights; the rest of its men have nobody to fight.`,
            );
          }
          if (touching < MIN_CONTACT * FRONT_SAMPLES) {
            fail(
              `${where}.phases[${i}]`,
              `${state.unit} fights hand to hand, but at the ${moment} of the phase its front is not on the front of an enemy unit that fights (${touching} of ${FRONT_SAMPLES} points within ${CONTACT} m). Use "skirmish" for a fight at a distance, or bring the fronts together.`,
            );
          }
        }
      }
      start = end;
    }
  }

  if (!isNumber(b.startHour) || b.startHour < 0 || b.startHour >= 24) fail(where, "startHour must be in [0, 24)");
  if (b.dayOfYear !== undefined && !(Number.isInteger(b.dayOfYear) && b.dayOfYear >= 1 && b.dayOfYear <= 366)) {
    fail(where, "dayOfYear must be a whole number in [1, 366]");
  }
  checkStates(`${where}.initial`, b.initial);
  if (!Array.isArray(b.phases) || b.phases.length === 0) fail(where, "needs at least one phase");
  let hour = b.startHour;
  const phaseIds = new Set();
  for (const [i, phase] of (b.phases ?? []).entries()) {
    const at = `${where}.phases[${i}]`;
    if (!KEBAB.test(phase.id ?? "") || phaseIds.has(phase.id)) fail(at, "id must be kebab-case and unique");
    phaseIds.add(phase.id);
    checkText(`${at}.title`, phase.title);
    checkText(`${at}.narration`, phase.narration);
    if (!isNumber(phase.endHour) || phase.endHour < hour || phase.endHour > 48) fail(at, `endHour must not go back in time (previous ${hour})`);
    hour = phase.endHour;
    if (!isNumber(phase.playSeconds) || phase.playSeconds <= 0) fail(at, "playSeconds must be positive");
    checkStates(`${at}.units`, phase.units);
    for (const [j, arrow] of (phase.arrows ?? []).entries()) {
      if (!sides.has(arrow.side)) fail(`${at}.arrows[${j}]`, `side ${arrow.side} is not a side of this battle`);
      if (!Array.isArray(arrow.points) || arrow.points.length < 2 || !arrow.points.every(inside)) {
        fail(`${at}.arrows[${j}]`, "needs at least two points inside the terrain");
      }
    }
  }
}

// --- Model index (public/battles/models/index.json) -------------------------
// Lists the .glb files that exist, so the scene never requests a missing one.

const modelsDir = join(root, "public", "battles", "models");
const indexPath = join(modelsDir, "index.json");
if (existsSync(indexPath)) {
  const where = "public/battles/models/index.json";
  const index = readJson(indexPath);
  const listed = Array.isArray(index.models) ? index.models : [];
  if (!Array.isArray(index.models)) fail(where, "needs a `models` array");
  const files = new Set(readdirSync(modelsDir).filter((f) => f.endsWith(".glb")).map((f) => f.slice(0, -4)));
  const known = new Set([...unitTypes.values()].map((type) => type.model));
  for (const model of listed) {
    if (!files.has(model)) fail(where, `lists ${model} but ${model}.glb is missing`);
    if (!known.has(model)) warn(where, `${model} is not the model of any unit type`);
  }
  for (const model of files) if (!listed.includes(model)) fail(where, `${model}.glb is not listed`);
} else if (existsSync(modelsDir) && readdirSync(modelsDir).some((f) => f.endsWith(".glb"))) {
  fail("public/battles/models/", "has .glb files but no index.json");
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length > 0) {
  console.error("Battle data is invalid:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Battle data is valid: ${battleFiles.length} battle(s), ${unitTypes.size} unit types.`);
