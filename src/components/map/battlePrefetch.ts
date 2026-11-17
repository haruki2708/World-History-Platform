import { loadBattle, unitTypes } from "@/data";
import { type Battle, MODEL_INDEX_URL, modelUrl, terrainUrl } from "@/lib/battle";

/*
 * Puts the files the battle scene loads first (BattleEngine.load in
 * src/components/battle/engine/) into the browser's HTTP cache while the map
 * flies to the battlefield: the terrain grid, the model index and the unit
 * models the battle uses. Plain requests only: nothing here pulls in three.js.
 *
 * The scene requests these files with fetch() and its default cache mode, so
 * the URLs must be the very ones it asks for: both sides build them with
 * modelUrl and terrainUrl from src/lib/battle.ts (and MODEL_INDEX_URL).
 *
 * Static files are served with `Cache-Control: public, max-age=0`, so the
 * scene's own request for a file already in the cache is still checked with
 * the server: a 304 with no body, one short round trip. A request made while
 * the prefetch is still downloading waits for it rather than starting a second
 * download. (A longer max-age for these folders would spare the 304s too; see
 * docs/tasks/T-027-prefetch-cannae-data.md.)
 *
 * `<link rel="prefetch">` loads at the lowest priority, behind the battle
 * viewer's own code, and keeps nothing in memory here. Browsers without it
 * (Safari) get low-priority fetches instead.
 */

const modelOfType = new Map(unitTypes.map((type) => [type.id, type.model]));

/**
 * Battles whose files are loading or have loaded on this page. Opening one
 * again finds them in the cache already; asking again would only add 304s.
 */
const requested = new Set<string>();

let linkPrefetch: boolean | undefined;

function supportsLinkPrefetch(): boolean {
  linkPrefetch ??= document.createElement("link").relList.supports("prefetch");
  return linkPrefetch;
}

/**
 * Puts one file in the HTTP cache, so that the scene's fetch() of the same
 * URL finds it there. Resolves once the file is in (or has failed).
 */
function prefetch(url: string): Promise<void> {
  if (!supportsLinkPrefetch()) {
    return fetch(url, { priority: "low" })
      .then((response) => response.arrayBuffer())
      .then(
        () => undefined,
        () => undefined,
      );
  }
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    // CORS mode with same-origin credentials, as fetch() asks by default.
    link.crossOrigin = "anonymous";
    link.href = url;
    // The response stays in the HTTP cache once the element is gone.
    const done = () => {
      link.remove();
      resolve();
    };
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
    document.head.append(link);
  });
}

/** The unit models that exist, as the scene reads them; empty if unreadable. */
async function readModelIndex(): Promise<Set<string>> {
  try {
    // A plain fetch caches the index for the scene, as a prefetch would.
    const response = await fetch(MODEL_INDEX_URL);
    if (!response.ok) return new Set();
    const data: unknown = await response.json();
    const models = (data as { models?: unknown } | null)?.models;
    return new Set(Array.isArray(models) ? models.filter((m): m is string => typeof m === "string") : []);
  } catch {
    return new Set();
  }
}

/** The model files the scene will request: the models of the battle's units that exist. */
function modelsOf(battle: Battle, available: Set<string>): string[] {
  const models = new Set<string>();
  for (const unit of battle.units) {
    const model = modelOfType.get(unit.type);
    if (model && available.has(model)) models.add(model);
  }
  return [...models];
}

/** False when the battle file could not be loaded (the viewer reports that). */
async function prefetchBattle(id: string): Promise<boolean> {
  // Already loading for the flight: the same import, no second request.
  const battle = await loadBattle(id).catch(() => undefined);
  if (!battle) return false;
  const terrain = prefetch(terrainUrl(battle.terrain.file));
  const available = await readModelIndex();
  await Promise.all([terrain, ...modelsOf(battle, available).map((model) => prefetch(modelUrl(model)))]);
  return true;
}

/**
 * Starts loading what the scene of battle `id` needs into the HTTP cache.
 * Call it when the user asks for the battle (store.battleRequest), never
 * before: these are megabytes. Once per battle on a page.
 */
export function prefetchBattleAssets(id: string): void {
  if (requested.has(id)) return;
  requested.add(id);
  void prefetchBattle(id).then((loaded) => {
    if (!loaded) requested.delete(id);
  });
}
