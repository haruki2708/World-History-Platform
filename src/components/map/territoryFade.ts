import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { Territories } from "./borders";
import {
  EMPTY_COLLECTION,
  TERRITORY_OPACITY,
  territoryFillLayer,
  territoryLineLayer,
  territorySource,
  type TerritorySlot,
} from "./mapStyle";

/** Length of the cross-fade between two border snapshots. */
export const FADE_MS = 400;

/** Longest wait for MapLibre to take in new data before fading anyway. */
const DATA_TIMEOUT_MS = 1500;

/** What the map should show: a snapshot, or nothing (no snapshot covers the year). */
export interface FadeTarget {
  key: string;
  territories: Territories | null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cross-fades the territory layers when the snapshot changes. The new
 * snapshot is loaded into the hidden layer set, then that set fades in while
 * the visible one fades out.
 *
 * Only the latest target counts. While a fade runs, newer targets replace
 * one another; when it ends, the map fades once to whichever came last. So
 * fast scrubbing or playback never queues fades, and the map always ends on
 * the snapshot of the year in view. With reduced motion, sets swap at once.
 */
export class TerritoryFade {
  private front: TerritorySlot = 0;
  private frontKey: string | null = null;
  private target: FadeTarget | null = null;
  private running = false;
  private stopped = false;

  constructor(
    private readonly map: MapLibreMap,
    /** Called when a snapshot starts to appear, so the labels can follow. */
    private readonly onShow: (target: FadeTarget) => void,
  ) {}

  show(target: FadeTarget): void {
    this.target = target;
    if (!this.running) void this.run();
  }

  stop(): void {
    this.stopped = true;
  }

  private async run(): Promise<void> {
    this.running = true;
    try {
      while (!this.stopped && this.target && this.target.key !== this.frontKey) {
        const next = this.target;
        const back: TerritorySlot = this.front === 0 ? 1 : 0;
        await this.load(back, next.territories?.collection ?? EMPTY_COLLECTION);
        if (this.stopped) return;
        // A newer target came while loading: nothing has changed on screen
        // yet, so go straight to that one.
        if (this.target !== next) continue;

        const duration = prefersReducedMotion() ? 0 : FADE_MS;
        this.onShow(next);
        this.setOpacity(back, 1, duration);
        this.setOpacity(this.front, 0, duration);
        if (duration > 0) await wait(duration);
        if (this.stopped) return;

        const old = this.front;
        this.front = back;
        this.frontKey = next.key;
        // The hidden set holds nothing, so it costs nothing to draw.
        void this.source(old)?.setData(EMPTY_COLLECTION);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.running = false;
    }
  }

  private source(slot: TerritorySlot): GeoJSONSource | undefined {
    return this.map.getSource<GeoJSONSource>(territorySource(slot));
  }

  /** Puts `data` into a slot and waits until MapLibre can draw it. */
  private async load(slot: TerritorySlot, data: GeoJSON.FeatureCollection): Promise<void> {
    const source = this.source(slot);
    if (!source) return;
    await source.setData(data);
    const id = territorySource(slot);
    if (this.stopped || this.map.isSourceLoaded(id)) return;
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.map.off("sourcedata", onData);
        resolve();
      };
      const onData = (event: { sourceId?: string }) => {
        if (event.sourceId === id && this.map.isSourceLoaded(id)) done();
      };
      const timer = setTimeout(done, DATA_TIMEOUT_MS);
      this.map.on("sourcedata", onData);
    });
  }

  private setOpacity(slot: TerritorySlot, share: 0 | 1, duration: number): void {
    const transition = { duration, delay: 0 };
    const fill = territoryFillLayer(slot);
    const line = territoryLineLayer(slot);
    this.map.setPaintProperty(fill, "fill-opacity-transition", transition);
    this.map.setPaintProperty(line, "line-opacity-transition", transition);
    this.map.setPaintProperty(fill, "fill-opacity", TERRITORY_OPACITY.fill * share);
    this.map.setPaintProperty(line, "line-opacity", TERRITORY_OPACITY.line * share);
  }
}
