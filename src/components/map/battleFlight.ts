import type {
  GeoJSONSource,
  LngLatBoundsLike,
  LngLatLike,
  MapMovementEvent,
  Map as MapLibreMap,
} from "maplibre-gl";
import { loadBattle } from "@/data";
import type { Battle } from "@/lib/battle";
import {
  BATTLE_FRAME_FILL,
  BATTLE_FRAME_LINE,
  BATTLE_FRAME_OPACITY,
  BATTLE_FRAME_SOURCE,
  EMPTY_COLLECTION,
  MAX_ZOOM,
} from "./mapStyle";
import { prefersReducedMotion } from "./motion";

/** Length of the flight to a battlefield. */
export const FLY_IN_MS = 2000;
/** Length of the flight back once the battle closes. */
export const FLY_BACK_MS = 1200;
/**
 * From the request on, the longest the battle waits for the map: a battle
 * file that is slow to load, a flight that stalls, whatever the reason.
 */
export const OPEN_TIMEOUT_MS = 4000;
/** The flight back is cut short (a jump) if it has not ended by then. */
const BACK_TIMEOUT_MS = FLY_BACK_MS + 1500;
/**
 * The base map stops at MAX_ZOOM, far too wide for a field a few kilometres
 * across (Cannae needs about 12). The limit is lifted for the flight and put
 * back once the map has returned.
 */
const BATTLE_MAX_ZOOM = 14;
/** Room around the battlefield, as a share of the map's shorter side. */
const FRAME_PADDING = 0.08;
const FRAME_FADE_MS = 300;

/** Where the map looks. North stays up in this app, but all four are kept. */
interface Camera {
  center: LngLatLike;
  zoom: number;
  bearing: number;
  pitch: number;
}

type State =
  | { kind: "idle" }
  /**
   * On the way to a battlefield; `saved` is where the map was. `departed`
   * once the map has left `saved`: the flight is under way, or the request
   * came during a flight back.
   */
  | { kind: "flying"; id: string; saved: Camera; token: number; departed: boolean }
  /** A battle is open; null when the map did not move for it. */
  | { kind: "open"; saved: Camera | null }
  | { kind: "back"; saved: Camera; token: number };

/** Flights carry this in their events, so their `moveend` can be told apart. */
interface FlightEventData {
  battleFlight?: number;
}

/**
 * Shared by every BattleFlight, so a flight left over from one that was
 * disposed (a remount in development) can never pass for a newer one.
 */
let lastToken = 0;

function cameraOf(map: MapLibreMap): Camera {
  const { lng, lat } = map.getCenter();
  return {
    center: [lng, lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

/**
 * Field metres from `origin` to longitude and latitude, with the same local
 * WGS84 projection the terrain grid was built with
 * (scripts/battles/build-terrain.mjs).
 */
function fieldToLngLat(
  origin: Battle["origin"],
  x: number,
  y: number,
): [number, number] {
  const a = 6378137;
  const e2 = 6.69437999014e-3;
  const rad = Math.PI / 180;
  const phi = origin.lat * rad;
  const w = Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const metresPerDegLat = ((a * (1 - e2)) / w ** 3) * rad;
  const metresPerDegLng = (a / w) * Math.cos(phi) * rad;
  return [origin.lng + x / metresPerDegLng, origin.lat + y / metresPerDegLat];
}

/** The ground the battle's terrain covers, as a closed ring. */
function terrainRing(battle: Battle): [number, number][] {
  const { origin, terrain } = battle;
  return [
    fieldToLngLat(origin, terrain.minX, terrain.minY),
    fieldToLngLat(origin, terrain.maxX, terrain.minY),
    fieldToLngLat(origin, terrain.maxX, terrain.maxY),
    fieldToLngLat(origin, terrain.minX, terrain.maxY),
    fieldToLngLat(origin, terrain.minX, terrain.minY),
  ];
}

/**
 * Flies the map to a battlefield before the battle opens, and back to where
 * it was once the battle closes.
 *
 * A request flies to the battle's terrain, framed north up and flat, then
 * opens the battle. Whatever goes wrong, the battle still opens: at once when
 * the user prefers reduced motion or the battle file fails to load, as soon
 * as the user takes hold of the map mid-flight (MapLibre then ends the flight,
 * which counts as arriving), and after OPEN_TIMEOUT_MS in any case. A second
 * request while flying is ignored.
 *
 * Every flight carries a token in its events; only the `moveend` of the
 * flight in progress moves the state on, so a flight cut short by another
 * never acts twice.
 */
export class BattleFlight {
  private state: State = { kind: "idle" };
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly map: MapLibreMap,
    private readonly openBattle: (id: string) => void,
    /** Told when a flight to a battlefield starts and ends. */
    private readonly onFlying: (flying: boolean) => void,
  ) {
    map.on("moveend", this.onMoveEnd);
  }

  /** Answers store.battleRequest. */
  request(id: string): void {
    const state = this.state;
    if (state.kind === "flying") return;
    if (state.kind === "open") {
      this.openBattle(id);
      return;
    }
    if (prefersReducedMotion()) {
      if (state.kind === "back") this.endBack(state.token, true);
      this.openBattle(id);
      return;
    }

    // Asked again while flying back: keep the view from before the first
    // battle, and leave from wherever the map is now.
    const back = state.kind === "back";
    const saved = back ? state.saved : cameraOf(this.map);
    const token = ++lastToken;
    this.state = { kind: "flying", id, saved, token, departed: back };
    // Hold the map still while the battle file loads (this also ends a
    // flight back, whose moveend no longer matches the current token).
    this.map.stop();
    this.onFlying(true);
    this.setTimer(() => this.arrive(token), OPEN_TIMEOUT_MS);

    loadBattle(id)
      .then((battle) => {
        if (!this.isCurrent(token)) return;
        if (battle) this.flyTo(battle, token);
        else this.arrive(token);
      })
      // The battle viewer loads the same file and reports the failure itself.
      .catch(() => this.arrive(token));
  }

  /** Answers store.battleId turning back to null. */
  closed(): void {
    const state = this.state;
    if (state.kind !== "open") return;
    if (!state.saved) {
      this.state = { kind: "idle" };
      return;
    }
    const token = ++lastToken;
    this.state = { kind: "back", saved: state.saved, token };
    if (prefersReducedMotion()) {
      this.endBack(token, true);
      return;
    }
    this.setFrameOpacity(0, FLY_BACK_MS);
    this.map.flyTo(
      { ...state.saved, duration: FLY_BACK_MS, essential: true },
      { battleFlight: token } satisfies FlightEventData,
    );
    this.setTimer(() => this.endBack(token, true), BACK_TIMEOUT_MS);
  }

  dispose(): void {
    clearTimeout(this.timer);
    this.map.off("moveend", this.onMoveEnd);
    if (this.state.kind === "flying") this.onFlying(false);
  }

  private readonly onMoveEnd = (event: MapMovementEvent & FlightEventData) => {
    const token = event.battleFlight;
    if (token === undefined || token !== this.currentToken()) return;
    if (this.state.kind === "flying") this.arrive(token);
    else this.endBack(token, false);
  };

  private flyTo(battle: Battle, token: number): void {
    if (this.state.kind === "flying") this.state.departed = true;
    const ring = terrainRing(battle);
    const source = this.map.getSource<GeoJSONSource>(BATTLE_FRAME_SOURCE);
    void source?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [ring] },
    });
    this.setFrameOpacity(1, FRAME_FADE_MS);

    this.map.setMaxZoom(BATTLE_MAX_ZOOM);
    const container = this.map.getContainer();
    const padding = Math.round(
      Math.min(container.clientWidth, container.clientHeight) * FRAME_PADDING,
    );
    const bounds: LngLatBoundsLike = [ring[0], ring[2]];
    // Undefined when the map is too small to fit the frame with its padding.
    const target = this.map.cameraForBounds(bounds, { padding, bearing: 0 }) ?? {
      center: [battle.origin.lng, battle.origin.lat] as LngLatLike,
      zoom: BATTLE_MAX_ZOOM - 2,
    };
    this.map.flyTo(
      {
        center: target.center,
        zoom: target.zoom,
        bearing: 0,
        pitch: 0,
        duration: FLY_IN_MS,
        essential: true,
      },
      { battleFlight: token } satisfies FlightEventData,
    );
  }

  /** Ends the flight to the battlefield, wherever the map is, and opens the battle. */
  private arrive(token: number): void {
    const state = this.state;
    if (state.kind !== "flying" || state.token !== token) return;
    clearTimeout(this.timer);
    // If the battle file failed to load, or took longer than OPEN_TIMEOUT_MS,
    // the map never left: there is nothing to fly back from. A flight still
    // under way when time runs out carries on behind the battle.
    this.state = { kind: "open", saved: state.departed ? state.saved : null };
    this.onFlying(false);
    this.openBattle(state.id);
  }

  /**
   * Ends the flight back: puts the zoom limit back and clears the frame.
   * `jump` lands on the saved view at once (reduced motion, a stalled flight).
   */
  private endBack(token: number, jump: boolean): void {
    const state = this.state;
    if (state.kind !== "back" || state.token !== token) return;
    clearTimeout(this.timer);
    this.state = { kind: "idle" };
    if (jump) this.map.jumpTo(state.saved);
    // Lowering the limit below the current zoom zooms the map out to it, so
    // a flight back the user cut short ends at MAX_ZOOM at most.
    this.map.setMaxZoom(MAX_ZOOM);
    this.clearFrame();
  }

  private isCurrent(token: number): boolean {
    return this.currentToken() === token;
  }

  private currentToken(): number | undefined {
    const state = this.state;
    return state.kind === "flying" || state.kind === "back" ? state.token : undefined;
  }

  private setTimer(callback: () => void, ms: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(callback, ms);
  }

  private setFrameOpacity(share: 0 | 1, duration: number): void {
    const transition = { duration, delay: 0 };
    this.map.setPaintProperty(BATTLE_FRAME_FILL, "fill-opacity-transition", transition);
    this.map.setPaintProperty(BATTLE_FRAME_LINE, "line-opacity-transition", transition);
    this.map.setPaintProperty(BATTLE_FRAME_FILL, "fill-opacity", BATTLE_FRAME_OPACITY.fill * share);
    this.map.setPaintProperty(BATTLE_FRAME_LINE, "line-opacity", BATTLE_FRAME_OPACITY.line * share);
  }

  private clearFrame(): void {
    this.setFrameOpacity(0, 0);
    void this.map.getSource<GeoJSONSource>(BATTLE_FRAME_SOURCE)?.setData(EMPTY_COLLECTION);
  }
}
