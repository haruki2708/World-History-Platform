// Tests the lake and mist checks of validate-battles.mjs (T-051), and those of
// the lake's islands and of units lying in ambush (T-052): builds a small
// battle on the ground of Lake Trasimene, breaks it in one way per case, and
// runs the validator on it from a temporary folder, so src/data/battles/ is
// never touched. Not part of `npm run validate`.
//
//   node scripts/battles/test-lake-checks.mjs
//
// The ground is the terrain of src/data/battles/battle-of-lake-trasimene.json:
// the lake with its three islands (Polvese, Maggiore, Minore).

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const terrain = JSON.parse(readFileSync(join(root, "src", "data", "battles", "battle-of-lake-trasimene.json"), "utf8")).terrain;
if (!terrain.lakes?.length) throw new Error("the terrain has no lake to test against");
// Isola Maggiore, the second island: 22.8 ha, 2.7–3.2 km east of the origin, 1.2 km out from the Tuoro shore.
if (terrain.lakes[0].islands?.length !== 3) throw new Error("the lake should have three islands: Polvese, Maggiore, Minore");
const rectangle = (x0, x1, y0, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];

const evidence = { basis: "illustrative", note: { en: "Test.", vi: "Thử." } };
const unit = (id, side, type, men) => ({ id, side, type, name: { en: id, vi: id }, men });
const state = (id, x, y, men, action = "stand", facing = 90) => ({
  unit: id,
  formation: { center: { x, y }, frontage: 200, depth: 60, facing },
  action,
  men,
});

/** A battle that passes: Romans pushed to the north shore at x = 300, where the shore runs east–west at y ≈ −1065. */
function base() {
  return {
    id: "battle-of-lake-trasimene",
    origin: { lng: 12.055, lat: 43.2 },
    date: { en: "Test", vi: "Thử" },
    sides: [
      { id: "rome", polityId: "rome", name: { en: "Rome", vi: "La Mã" }, commanders: [{ en: "F", vi: "F" }], strength: { min: 2000, max: 2000 } },
      { id: "carthage", polityId: "carthage", name: { en: "Carthage", vi: "Carthage" }, commanders: [{ en: "H", vi: "H" }], strength: { min: 1000, max: 1000 } },
    ],
    units: [unit("romans", "rome", "roman-hastati", 2000), unit("gauls", "carthage", "gallic-infantry", 1000)],
    startHour: 4.5,
    initial: [state("romans", -2000, -1300, 2000), state("gauls", 0, 1500, 1000, "stand", 180)],
    phases: [
      {
        id: "one",
        title: { en: "1", vi: "1" },
        narration: { en: "One.", vi: "Một." },
        endHour: 6,
        playSeconds: 10,
        units: [state("romans", 300, -900, 2000, "advance"), state("gauls", 300, 0, 1000, "advance", 180)],
      },
      {
        id: "two",
        title: { en: "2", vi: "2" },
        narration: { en: "Two.", vi: "Hai." },
        endHour: 9,
        playSeconds: 10,
        units: [state("romans", 300, -1100, 1500, "rout", 180), state("gauls", 300, -700, 1000, "pursue", 180)],
      },
    ],
    terrain: {
      ...structuredClone(terrain),
      scenery: { ground: { cover: "grass", evidence }, areas: [], structures: [], mist: { level: 0.8, clearsAt: 9, evidence } },
    },
    uncertainty: { en: "Test.", vi: "Thử." },
    sources: [{ title: "Test" }],
  };
}

/** [name, change to the battle, text the validator must print (null: it passes without warnings)]. */
const cases = [
  ["passes: a lake, mist, a unit wading at the shore", () => {}, null],
  ["passes: a unit 100 m out in the lake", (b) => (b.phases[1].units[0].formation.center = { x: 300, y: -1180 }), null],
  ["passes: mist without clearsAt", (b) => delete b.terrain.scenery.mist.clearsAt, null],
  ["passes: no lake, no mist", (b) => {
    delete b.terrain.lakes;
    delete b.terrain.scenery.mist;
    b.phases[1].units[0].formation.center = { x: 300, y: -800 };
  }, null],
  ["lakes is not a list", (b) => (b.terrain.lakes = { id: "x" }), "must be a list"],
  ["lake id is not kebab-case", (b) => (b.terrain.lakes[0].id = "Lake Trasimene"), "id must be kebab-case"],
  ["lake id used twice", (b) => b.terrain.lakes.push(structuredClone(b.terrain.lakes[0])), "is used twice"],
  ["lake name without vi", (b) => (b.terrain.lakes[0].name = { en: "Lake" }), "lakes[0].name: needs non-empty"],
  ["level is a string", (b) => (b.terrain.lakes[0].level = "254.5"), "level must be a number"],
  ["outline of two points", (b) => (b.terrain.lakes[0].outline = b.terrain.lakes[0].outline.slice(0, 2)), "at least three points"],
  ["outline point without y", (b) => delete b.terrain.lakes[0].outline[5].y, "at least three points"],
  ["outline on a straight line", (b) => (b.terrain.lakes[0].outline = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 20 }]), "encloses no water"],
  ["attested without sources", (b) => delete b.terrain.lakes[0].evidence.sources, "lakes[0].evidence.sources: needs at least one source"],
  ["evidence with an unknown basis", (b) => (b.terrain.lakes[0].evidence.basis = "certain"), "basis certain is not one of"],
  ["landmark in the lake", (b) => b.terrain.landmarks.push({ name: { en: "Wet", vi: "Ướt" }, kind: "other", point: { x: 0, y: -2500 } }), "Wet lies in the lake"],
  ["structure in the lake", (b) => b.terrain.scenery.structures.push({ id: "wet-farm", kind: "farm", center: { x: 300, y: -1080 }, width: 70, depth: 50, facing: 0, evidence }), "lies in the lake"],
  ["unit 400 m out in the lake", (b) => (b.phases[1].units[0].formation.center = { x: 300, y: -1500 }), "men wade no farther out than 150 m"],
  ["level 5 m above the grid's water (warning)", (b) => (b.terrain.lakes[0].level += 5), "warning: battle-of-lake-trasimene.json.terrain.lakes:"],
  ["mist level 1.5", (b) => (b.terrain.scenery.mist.level = 1.5), "mist: level must be from 0 to 1"],
  ["mist without level", (b) => delete b.terrain.scenery.mist.level, "mist: level must be from 0 to 1"],
  ["mist clearsAt is a string", (b) => (b.terrain.scenery.mist.clearsAt = "9"), "clearsAt must be an hour of the day"],
  ["mist clears before the start", (b) => (b.terrain.scenery.mist.clearsAt = 4), "clearsAt 4 must fall within the battle: after 4.5, by 9"],
  ["mist clears as the battle starts", (b) => (b.terrain.scenery.mist.clearsAt = 4.5), "clearsAt 4.5 must fall within the battle"],
  ["mist clears after the end", (b) => (b.terrain.scenery.mist.clearsAt = 10), "clearsAt 10 must fall within the battle"],
  ["mist without evidence", (b) => delete b.terrain.scenery.mist.evidence, "mist.evidence: needs evidence"],

  // Islands (BattleLake.islands): ground on one is not in the lake.
  ["passes: a landmark on Isola Maggiore", (b) => b.terrain.landmarks.push({ name: { en: "Isle", vi: "Đảo" }, kind: "other", point: { x: 2961, y: -2739 } }), null],
  ["passes: a farm on Isola Maggiore", (b) => b.terrain.scenery.structures.push({ id: "isle-farm", kind: "farm", center: { x: 2961, y: -2739 }, width: 60, depth: 40, facing: 0, evidence }), null],
  ["passes: a unit wading 55–100 m off Maggiore, 1.2 km from the lake's shore", (b) => (b.phases[1].units[0] = state("romans", 2930, -2290, 1500, "rout", 0)), null],
  ["the same unit with no islands is too far out", (b) => {
    delete b.terrain.lakes[0].islands;
    b.phases[1].units[0] = state("romans", 2930, -2290, 1500, "rout", 0);
  }, "men wade no farther out than 150 m"],
  ["passes: the grid's median leaves out an island of high ground", (b) => {
    b.terrain.lakes[0].outline = rectangle(200, 1300, -1500, 1600);
    b.terrain.lakes[0].islands = [rectangle(220, 1280, -1040, 1580)];
  }, null],
  ["the same shore without the island: median on dry ground (warning)", (b) => {
    b.terrain.lakes[0].outline = rectangle(200, 1300, -1500, 1600);
    delete b.terrain.lakes[0].islands;
  }, "the grid over the water (inside the shore, off the islands) lies at"],
  ["islands is not a list", (b) => (b.terrain.lakes[0].islands = { x: 0, y: 0 }), "islands: must be a list of outlines"],
  ["island of two points", (b) => (b.terrain.lakes[0].islands[1] = b.terrain.lakes[0].islands[1].slice(0, 2)), "islands[1]: needs at least three points"],
  ["island point without x", (b) => delete b.terrain.lakes[0].islands[1][3].x, "islands[1]: needs at least three points"],
  ["island on a straight line", (b) => (b.terrain.lakes[0].islands[2] = [{ x: 3800, y: -2300 }, { x: 3810, y: -2310 }, { x: 3820, y: -2320 }]), "islands[2]: encloses no ground"],
  ["island on dry land", (b) => b.terrain.lakes[0].islands.push(rectangle(-100, 100, 900, 1100)), "islands[3]: must lie inside the shore"],
  ["island across the shore", (b) => b.terrain.lakes[0].islands.push(rectangle(400, 600, -1200, -900)), "islands[3]: must lie inside the shore"],
  ["island with its corners in the water, its sides across a headland", (b) => b.terrain.lakes[0].islands.push(rectangle(1100, 1900, -1800, -1300)), "islands[3]: must lie inside the shore"],
  ["two islands overlap", (b) => b.terrain.lakes[0].islands.push(structuredClone(b.terrain.lakes[0].islands[2])), "islands[3]: overlaps the island islands[2]"],
  ["an island inside another", (b) => b.terrain.lakes[0].islands.push([{ x: 2900, y: -2700 }, { x: 3000, y: -2700 }, { x: 2950, y: -2650 }]), "islands[3]: overlaps the island islands[1]"],

  // Units lying in ambush (UnitState.concealed).
  ["passes: Gauls concealed at the start and through phase 1, out in phase 2", (b) => {
    b.initial[1].concealed = true;
    b.phases[0].units[1].concealed = true;
    b.phases[1].arrows = [{ side: "carthage", points: [{ x: 300, y: 0 }, { x: 300, y: -650 }] }];
  }, null],
  ["concealed is a string", (b) => (b.phases[0].units[1].concealed = "yes"), "concealed must be true or false"],
  ["concealed while fighting", (b) => {
    b.phases[0].units[1].concealed = true;
    b.phases[0].units[1].action = "fight";
  }, "gauls is concealed, lying in wait, so it cannot fight"],
  ["concealed while skirmishing", (b) => {
    b.initial[1].concealed = true;
    b.initial[1].action = "skirmish";
  }, "gauls is concealed, lying in wait, so it cannot skirmish"],
  ["an arrow points out a hidden unit (warning)", (b) => {
    b.initial[1].concealed = true;
    b.phases[0].units[1].concealed = true;
    b.phases[0].arrows = [{ side: "carthage", points: [{ x: 0, y: 1500 }, { x: 300, y: 0 }] }];
  }, "warning: battle-of-lake-trasimene.json.phases[0].arrows[0]: starts or ends on gauls"],
];

const dir = mkdtempSync(join(tmpdir(), "whp-lake-checks-"));
const file = join(dir, "battle-of-lake-trasimene.json");
let passed = 0;
try {
  for (const [name, change, expected] of cases) {
    const battle = base();
    change(battle);
    writeFileSync(file, JSON.stringify(battle));
    const run = spawnSync(process.execPath, [join(root, "scripts", "battles", "validate-battles.mjs"), file], { encoding: "utf8" });
    const out = `${run.stdout}${run.stderr}`;
    const good =
      expected === null
        ? run.status === 0 && !out.includes("warning")
        : out.includes(expected) && (expected.startsWith("warning") ? run.status === 0 : run.status !== 0);
    if (good) passed++;
    console.log(`${good ? "ok  " : "FAIL"} ${name}${good ? "" : `\n${out}`}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`${passed} of ${cases.length} cases as expected`);
if (passed !== cases.length) process.exit(1);
