import { BASEMAP_URL } from "../mapStyle";
import { FULL_GRID, GRID_COLUMNS, GRID_ROWS, fillRings, ringToGrid } from "./grid";

/**
 * Which grid cells are land: 1 for land, 0 for sea and lakes. Territory
 * polygons may spill into the sea (the water layer covers it), so labels
 * must only count the land part of a territory.
 */
export type LandMask = Uint8Array;

let pending: Promise<LandMask> | undefined;

type WaterGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

/**
 * Builds the land mask from the base map's ocean and lake polygons, once.
 * The base map is already in the browser cache: MapLibre loaded it first.
 */
export function loadLandMask(): Promise<LandMask> {
  pending ??= (async () => {
    const response = await fetch(BASEMAP_URL);
    if (!response.ok) throw new Error(`Base map: HTTP ${response.status}`);
    const basemap = (await response.json()) as GeoJSON.FeatureCollection<
      WaterGeometry | GeoJSON.MultiLineString,
      { kind?: string }
    >;

    const water = new Uint8Array(GRID_COLUMNS * GRID_ROWS);
    for (const feature of basemap.features) {
      const { geometry } = feature;
      if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") continue;
      const polygons =
        geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
      // Each polygon on its own, so that a lake inside a hole of the ocean
      // (an island) is still water.
      for (const polygon of polygons) {
        fillRings(polygon.map(ringToGrid), FULL_GRID, water);
      }
    }

    const land = water;
    for (let i = 0; i < land.length; i++) land[i] = land[i] ? 0 : 1;
    return land;
  })();
  pending.catch(() => {
    pending = undefined;
  });
  return pending;
}
