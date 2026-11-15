import type {
  LngLatBoundsLike,
  Map as MapLibreMap,
  StyleSpecification,
} from "maplibre-gl";
import type { MapTheme } from "./theme";

/** Base map data, built by tools/build-basemap.mjs from Natural Earth. */
export const BASEMAP_URL = "/map/basemap.json";

/**
 * [west, south, east, north] covered by the base map file. Keep in sync with
 * REGION in tools/build-basemap.mjs.
 */
const DATA_BOUNDS = [-40, 5, 80, 70] as const;

/** The camera stays just inside the data so its cut edge is never visible. */
export const MAX_BOUNDS: LngLatBoundsLike = [
  [DATA_BOUNDS[0] + 1, DATA_BOUNDS[1] + 1],
  [DATA_BOUNDS[2] - 1, DATA_BOUNDS[3] - 1],
];

export const MIN_ZOOM = 2;
/** The base map is simplified for this zoom; beyond it coasts look angular. */
export const MAX_ZOOM = 8;

export const BASEMAP_SOURCE = "basemap";
export const TERRITORY_SOURCE = "territories";

export const EMPTY_COLLECTION: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/**
 * No tiles, glyphs or sprites: everything is drawn from two GeoJSON sources.
 *
 * Layer order matters. Land is the background; territories sit on it; open
 * water is painted on top, so territory polygons only need to be roughly
 * right along a coast: whatever spills into the sea is covered.
 */
export function buildMapStyle(theme: MapTheme): StyleSpecification {
  return {
    version: 8,
    sources: {
      [BASEMAP_SOURCE]: {
        type: "geojson",
        data: BASEMAP_URL,
        maxzoom: MAX_ZOOM,
      },
      [TERRITORY_SOURCE]: {
        type: "geojson",
        data: EMPTY_COLLECTION,
        maxzoom: MAX_ZOOM,
      },
    },
    layers: [
      {
        id: "land",
        type: "background",
        paint: { "background-color": theme.land },
      },
      {
        id: "territory-fill",
        type: "fill",
        source: TERRITORY_SOURCE,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.45,
        },
      },
      {
        id: "territory-line",
        type: "line",
        source: TERRITORY_SOURCE,
        layout: { "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
        },
      },
      {
        id: "rivers",
        type: "line",
        source: BASEMAP_SOURCE,
        // Minor rivers appear as the user zooms in.
        filter: [
          "all",
          ["==", ["get", "kind"], "river"],
          ["<=", ["get", "rank"], ["step", ["zoom"], 4, 4, 6, 5, 7, 6, 9]],
        ],
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": theme.water,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            ["step", ["get", "rank"], 1, 4, 0.6],
            8,
            ["step", ["get", "rank"], 3, 4, 2, 7, 1.2],
          ],
        },
      },
      {
        id: "water",
        type: "fill",
        source: BASEMAP_SOURCE,
        filter: ["!=", ["get", "kind"], "river"],
        paint: { "fill-color": theme.water },
      },
      {
        id: "coast",
        type: "line",
        source: BASEMAP_SOURCE,
        filter: ["!=", ["get", "kind"], "river"],
        layout: { "line-join": "round" },
        paint: {
          "line-color": theme.coast,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 8, 1.25],
        },
      },
    ],
  };
}

/** Re-colours the base layers in place, e.g. after a light/dark switch. */
export function applyMapTheme(map: MapLibreMap, theme: MapTheme): void {
  map.setPaintProperty("land", "background-color", theme.land);
  map.setPaintProperty("rivers", "line-color", theme.water);
  map.setPaintProperty("water", "fill-color", theme.water);
  map.setPaintProperty("coast", "line-color", theme.coast);
}
