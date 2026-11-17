import type {
  LayerSpecification,
  LngLatBoundsLike,
  Map as MapLibreMap,
  SourceSpecification,
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

/**
 * Territories are drawn twice, on two layer sets that take turns: when the
 * timeline crosses a snapshot year, the new borders fade in on one set while
 * the old ones fade out on the other (see territoryFade.ts).
 */
export const TERRITORY_SLOTS = [0, 1] as const;
export type TerritorySlot = (typeof TERRITORY_SLOTS)[number];

export const territorySource = (slot: TerritorySlot) => `territories-${slot}`;
export const territoryFillLayer = (slot: TerritorySlot) => `territory-fill-${slot}`;
export const territoryLineLayer = (slot: TerritorySlot) => `territory-line-${slot}`;

/** Opacity of each territory layer when fully shown. */
export const TERRITORY_OPACITY = { fill: 0.45, line: 1 } as const;

export const EMPTY_COLLECTION: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/**
 * The ground of a 3D battle, outlined while the map flies there before the
 * battle opens (battleFlight.ts). Empty and hidden the rest of the time.
 */
export const BATTLE_FRAME_SOURCE = "battle-frame";
export const BATTLE_FRAME_FILL = "battle-frame-fill";
export const BATTLE_FRAME_LINE = "battle-frame-line";

/** Opacity of the battlefield outline when fully shown. */
export const BATTLE_FRAME_OPACITY = { fill: 0.12, line: 1 } as const;

/**
 * No tiles, glyphs or sprites: everything is drawn from two GeoJSON sources.
 *
 * Layer order matters. Land is the background; territories sit on it; open
 * water is painted on top, so territory polygons only need to be roughly
 * right along a coast: whatever spills into the sea is covered.
 */
export function buildMapStyle(theme: MapTheme): StyleSpecification {
  const territorySources: Record<string, SourceSpecification> = {};
  const territoryLayers: LayerSpecification[] = [];
  for (const slot of TERRITORY_SLOTS) {
    territorySources[territorySource(slot)] = {
      type: "geojson",
      data: EMPTY_COLLECTION,
      maxzoom: MAX_ZOOM,
    };
    // Both sets start hidden; territoryFade.ts sets the opacity, and the
    // length of the fade, before it shows one.
    territoryLayers.push(
      {
        id: territoryFillLayer(slot),
        type: "fill",
        source: territorySource(slot),
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0,
          "fill-opacity-transition": { duration: 0, delay: 0 },
        },
      },
      {
        id: territoryLineLayer(slot),
        type: "line",
        source: territorySource(slot),
        layout: { "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
          "line-opacity": 0,
          "line-opacity-transition": { duration: 0, delay: 0 },
        },
      },
    );
  }

  return {
    version: 8,
    sources: {
      [BASEMAP_SOURCE]: {
        type: "geojson",
        data: BASEMAP_URL,
        maxzoom: MAX_ZOOM,
      },
      ...territorySources,
      [BATTLE_FRAME_SOURCE]: { type: "geojson", data: EMPTY_COLLECTION },
    },
    layers: [
      {
        id: "land",
        type: "background",
        paint: { "background-color": theme.land },
      },
      ...territoryLayers,
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
      // On top of everything, water included: a battlefield can reach the sea.
      {
        id: BATTLE_FRAME_FILL,
        type: "fill",
        source: BATTLE_FRAME_SOURCE,
        paint: {
          "fill-color": theme.accent,
          "fill-opacity": 0,
          "fill-opacity-transition": { duration: 0, delay: 0 },
        },
      },
      {
        id: BATTLE_FRAME_LINE,
        type: "line",
        source: BATTLE_FRAME_SOURCE,
        layout: { "line-join": "miter" },
        paint: {
          "line-color": theme.accent,
          "line-width": 2,
          "line-dasharray": [3, 2],
          "line-opacity": 0,
          "line-opacity-transition": { duration: 0, delay: 0 },
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
  map.setPaintProperty(BATTLE_FRAME_FILL, "fill-color", theme.accent);
  map.setPaintProperty(BATTLE_FRAME_LINE, "line-color", theme.accent);
}
