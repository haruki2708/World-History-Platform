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
const SCENERY_BASES = new Set(["attested", "inferred", "illustrative"]);
const GROUND_COVERS = new Set(["stubble", "grass", "scrub", "reeds", "woodland", "bare"]);
const STRUCTURE_KINDS = new Set(["camp", "citadel", "village", "farm"]);
const RIVER_STAGES = new Set(["low", "full"]);

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

/** SceneryEvidence: how far a piece of scenery rests on a source. */
function checkEvidence(where, evidence) {
  if (!evidence || typeof evidence !== "object") return fail(where, "needs evidence: basis and note");
  if (!SCENERY_BASES.has(evidence.basis)) fail(where, `basis ${evidence.basis} is not one of ${[...SCENERY_BASES].join(", ")}`);
  checkText(`${where}.note`, evidence.note);
  if (evidence.basis === "attested" || evidence.sources !== undefined) checkSources(`${where}.sources`, evidence.sources);
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

/** True when the point lies in the rectangle, or within `margin` metres of it. */
function inRectangle(p, r, margin = 0) {
  const dx = p.x - r.c.x;
  const dy = p.y - r.c.y;
  return Math.abs(dx * r.along.x + dy * r.along.y) <= r.hw + margin && Math.abs(dx * r.ahead.x + dy * r.ahead.y) <= r.hd + margin;
}

/** The four corners of a rectangle from corners(). */
function cornerPoints(r) {
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([u, v]) => ({
    x: r.c.x + r.along.x * u * r.hw + r.ahead.x * v * r.hd,
    y: r.c.y + r.along.y * u * r.hw + r.ahead.y * v * r.hd,
  }));
}

/** Points along a line of points, no more than `step` metres apart. */
function alongLine(points, step) {
  const out = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    const n = Math.max(Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step), 1);
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  if (points.length > 0) out.push(points[points.length - 1]);
  return out;
}

/** Twice the signed area of an outline. */
function outlineArea2(outline) {
  let sum = 0;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum;
}

/**
 * BattleTerrain.scenery and the scenery fields of the rivers: what stands on
 * the ground besides the armies. See docs/ARCHITECTURE.md, "Phong cảnh".
 */
function checkScenery(where, t, sides, inside) {
  for (const [i, river] of (t.rivers ?? []).entries()) {
    const at = `${where}.rivers[${i}]`;
    if (river.level !== undefined) {
      if (!RIVER_STAGES.has(river.level?.stage)) fail(`${at}.level`, `stage must be one of ${[...RIVER_STAGES].join(", ")}`);
      checkEvidence(`${at}.level.evidence`, river.level?.evidence);
    }
    if (river.banks !== undefined) {
      if (!GROUND_COVERS.has(river.banks?.cover)) fail(`${at}.banks`, `cover must be one of ${[...GROUND_COVERS].join(", ")}`);
      if (!isNumber(river.banks?.width) || river.banks.width <= 0) fail(`${at}.banks`, "width must be positive");
      checkEvidence(`${at}.banks.evidence`, river.banks?.evidence);
    }
  }

  const scenery = t.scenery;
  if (scenery === undefined) return;
  const at = `${where}.scenery`;
  if (!GROUND_COVERS.has(scenery.ground?.cover)) fail(`${at}.ground`, `cover must be one of ${[...GROUND_COVERS].join(", ")}`);
  checkEvidence(`${at}.ground.evidence`, scenery.ground?.evidence);

  const ids = new Set();
  const checkId = (itemAt, id) => {
    if (typeof id !== "string" || !KEBAB.test(id)) fail(itemAt, "id must be kebab-case");
    else if (ids.has(id)) fail(itemAt, `id ${id} is used twice in the scenery`);
    ids.add(id);
  };

  if (!Array.isArray(scenery.areas)) fail(at, "areas must be a list (it may be empty)");
  for (const [i, area] of (Array.isArray(scenery.areas) ? scenery.areas : []).entries()) {
    const areaAt = `${at}.areas[${i}]`;
    checkId(areaAt, area.id);
    if (!GROUND_COVERS.has(area.cover)) fail(areaAt, `cover must be one of ${[...GROUND_COVERS].join(", ")}`);
    if (!Array.isArray(area.outline) || area.outline.length < 3) fail(areaAt, "outline needs at least three points");
    else if (!area.outline.every(inside)) fail(areaAt, "every point of the outline must lie inside the terrain");
    else if (Math.abs(outlineArea2(area.outline)) < 2) fail(areaAt, "outline encloses no ground");
    checkEvidence(`${areaAt}.evidence`, area.evidence);
  }

  if (!Array.isArray(scenery.structures)) fail(at, "structures must be a list (it may be empty)");
  const rectangles = [];
  for (const [i, structure] of (Array.isArray(scenery.structures) ? scenery.structures : []).entries()) {
    const structureAt = `${at}.structures[${i}]`;
    checkId(structureAt, structure.id);
    if (!STRUCTURE_KINDS.has(structure.kind)) fail(structureAt, `kind must be one of ${[...STRUCTURE_KINDS].join(", ")}`);
    if (structure.kind === "camp" && !sides.has(structure.side)) fail(structureAt, `a camp needs the side it belongs to; ${structure.side} is not a side`);
    if (structure.side !== undefined && !sides.has(structure.side)) fail(structureAt, `side ${structure.side} is not a side`);
    if (structure.ruined !== undefined && typeof structure.ruined !== "boolean") fail(structureAt, "ruined must be true or false");
    checkEvidence(`${structureAt}.evidence`, structure.evidence);
    const sized =
      isNumber(structure.width) && structure.width > 0 && isNumber(structure.depth) && structure.depth > 0 && isNumber(structure.facing);
    if (!sized) fail(structureAt, "needs positive width and depth, and a facing");
    else if (structure.facing < 0 || structure.facing >= 360) fail(structureAt, "facing must be from 0 up to 360");
    if (!inside(structure.center)) fail(structureAt, "center must lie inside the terrain");
    if (!sized || !inside(structure.center)) continue;

    const rectangle = corners({ center: structure.center, frontage: structure.width, depth: structure.depth, facing: structure.facing });
    if (!cornerPoints(rectangle).every(inside)) fail(structureAt, "reaches beyond the edge of the terrain");
    // Nothing is built in a river: its water and the belt along its banks stay clear.
    for (const river of t.rivers ?? []) {
      if (!Array.isArray(river.points) || !isNumber(river.width)) continue;
      const margin = river.width / 2 + (isNumber(river.banks?.width) ? river.banks.width : 0);
      if (alongLine(river.points, 5).some((p) => inRectangle(p, rectangle, margin))) {
        fail(structureAt, `stands in the river ${river.name?.en} or on its banks (within ${margin} m of the centre line)`);
      }
    }
    for (const other of rectangles) {
      if (shareInside(rectangle, other.rectangle) > 0 || shareInside(other.rectangle, rectangle) > 0) {
        fail(structureAt, `overlaps the structure ${other.id}`);
      }
    }
    rectangles.push({ id: structure.id, kind: structure.kind, rectangle });
  }

  // A named place that the scenery draws carries its label on what is drawn.
  const drawn = { camp: ["camp"], town: ["citadel", "village"] };
  for (const [i, mark] of (t.landmarks ?? []).entries()) {
    const kinds = drawn[mark.kind];
    if (!kinds || !inside(mark.point) || !rectangles.some((r) => kinds.includes(r.kind))) continue;
    if (!rectangles.some((r) => kinds.includes(r.kind) && inRectangle(mark.point, r.rectangle))) {
      warn(`${where}.landmarks[${i}]`, `${mark.name?.en} lies in no ${kinds.join(" or ")} of the scenery`);
    }
  }

  if (scenery.trees !== undefined) {
    if (!isNumber(scenery.trees?.perSquareKm) || scenery.trees.perSquareKm < 0 || scenery.trees.perSquareKm > 400) {
      fail(`${at}.trees`, "perSquareKm must be from 0 to 400");
    }
    checkEvidence(`${at}.trees.evidence`, scenery.trees?.evidence);
  }
  if (scenery.wind !== undefined) {
    const wind = scenery.wind;
    if (!isNumber(wind?.from) || wind.from < 0 || wind.from >= 360) fail(`${at}.wind`, "from must be from 0 up to 360");
    if (!isNumber(wind?.speed) || wind.speed < 0 || wind.speed > 40) fail(`${at}.wind`, "speed must be from 0 to 40 metres per second");
    checkEvidence(`${at}.wind.evidence`, wind?.evidence);
  }
  if (scenery.dust !== undefined) {
    if (!isNumber(scenery.dust?.level) || scenery.dust.level < 0 || scenery.dust.level > 1) fail(`${at}.dust`, "level must be from 0 to 1");
    checkEvidence(`${at}.dust.evidence`, scenery.dust?.evidence);
  }
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
  if (t.far !== undefined) {
    const far = t.far ?? {};
    const farWhere = `${terrainWhere}.far`;
    const numbers = ["width", "height", "minX", "maxX", "minY", "maxY"].every((key) => isNumber(far[key]));
    if (!numbers) fail(farWhere, "width, height, minX, maxX, minY and maxY must be numbers");
    else if (!(far.minX < far.maxX && far.minY < far.maxY)) fail(farWhere, "needs minX < maxX and minY < maxY");
    else if (!(Number.isInteger(far.width) && far.width >= 2 && Number.isInteger(far.height) && far.height >= 2)) {
      fail(farWhere, "width and height must be whole numbers >= 2");
    } else {
      const farPath = join(terrainDir, far.file ?? "");
      if (!far.file || !existsSync(farPath)) fail(farWhere, `file ${far.file} not found in public/data/terrain/`);
      else if (statSync(farPath).size !== far.width * far.height * 2) {
        fail(farWhere, `file is ${statSync(farPath).size} bytes, expected width × height × 2 = ${far.width * far.height * 2}`);
      }
      // It must reach two of its own cells beyond the ground of the battle.
      const cellX = (far.maxX - far.minX) / (far.width - 1);
      const cellY = (far.maxY - far.minY) / (far.height - 1);
      if (far.minX > t.minX - 2 * cellX || far.maxX < t.maxX + 2 * cellX || far.minY > t.minY - 2 * cellY || far.maxY < t.maxY + 2 * cellY) {
        fail(farWhere, "must reach at least two of its cells beyond the terrain on every side");
      }
    }
  }
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
  checkScenery(terrainWhere, t, sides, inside);

  // Ground at or below sea level is drawn as sea: nothing stands or is built on it.
  const gridOk = t.file && existsSync(gridPath) && statSync(gridPath).size === t.width * t.height * 2;
  const grid = gridOk ? readFileSync(gridPath) : null;
  const cellX = (t.maxX - t.minX) / (t.width - 1);
  const cellY = (t.maxY - t.minY) / (t.height - 1);
  /** True when the grid point nearest to p is sea; false outside the grid or without one. */
  const atSea = (p) => {
    if (!grid || !inside(p)) return false;
    const col = Math.round((p.x - t.minX) / cellX);
    const row = Math.round((t.maxY - p.y) / cellY);
    return grid.readInt16LE((row * t.width + col) * 2) <= 0;
  };
  /** Share of a rectangle (from corners()) that is sea, sampled 9 × 5. */
  const seaShare = (r) => {
    let wet = 0;
    let all = 0;
    for (let u = -1; u <= 1; u += 0.25) {
      for (let v = -1; v <= 1; v += 0.5) {
        all++;
        if (atSea({ x: r.c.x + r.along.x * u * r.hw + r.ahead.x * v * r.hd, y: r.c.y + r.along.y * u * r.hw + r.ahead.y * v * r.hd })) wet++;
      }
    }
    return wet / all;
  };
  /** Share of a rectangle (from corners()) that lies in the water of a river, sampled 21 × 5. */
  const riverShare = (r) => {
    let wet = 0;
    let all = 0;
    for (let u = -1; u <= 1.001; u += 0.1) {
      for (let v = -1; v <= 1.001; v += 0.5) {
        all++;
        const x = r.c.x + r.along.x * u * r.hw + r.ahead.x * v * r.hd;
        const y = r.c.y + r.along.y * u * r.hw + r.ahead.y * v * r.hd;
        for (const river of t.rivers ?? []) {
          if (!Array.isArray(river.points) || !isNumber(river.width)) continue;
          let inWater = false;
          for (let k = 0; k + 1 < river.points.length && !inWater; k++) {
            const a = river.points[k];
            const b = river.points[k + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const s = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
            inWater = Math.hypot(x - a.x - dx * s, y - a.y - dy * s) <= river.width / 2;
          }
          if (inWater) {
            wet++;
            break;
          }
        }
      }
    }
    return wet / all;
  };
  for (const [i, mark] of (t.landmarks ?? []).entries()) {
    if (atSea(mark.point)) fail(`${terrainWhere}.landmarks[${i}]`, `${mark.name?.en} lies in the sea`);
  }
  for (const [i, structure] of (t.scenery?.structures ?? []).entries()) {
    if (!isNumber(structure.width) || !isNumber(structure.depth) || !isNumber(structure.facing) || !inside(structure.center)) continue;
    const share = seaShare(corners({ center: structure.center, frontage: structure.width, depth: structure.depth, facing: structure.facing }));
    if (share > 0) fail(`${terrainWhere}.scenery.structures[${i}]`, `${Math.round(share * 100)}% of it lies in the sea`);
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
      else if (isNumber(f.frontage) && isNumber(f.depth) && isNumber(f.facing)) {
        const share = seaShare(corners(f));
        if (share > 0.1) fail(sw, `${Math.round(share * 100)}% of the formation stands in the sea`);
        // A unit may wade a river between two keys, but it does not halt in the water.
        const wet = riverShare(corners(f));
        if (wet > 0.05) fail(sw, `${Math.round(wet * 100)}% of the formation stands in a river`);
      }
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
