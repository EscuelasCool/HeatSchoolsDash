import type maplibregl from "maplibre-gl";
import {
  TEMP_GRID_LAYER,
  TEMP_GRID_SOURCE,
  TEMP_GRID_CIRCLE_LAYER,
  findMapLabelAnchor,
  raiseLayersAboveHeatmap,
  SCHOOL_POINT_LAYERS,
} from "./tempGrid";
import {
  circlePaintForVariable,
  colorStopsForVariable,
  heatmapPaintForVariable,
  legendGradientForVariable,
  CMIP6_TIMELINE_YEARS,
} from "./cmip6Colors";

export type Cmip6Variable = "tasmax" | "tasmin";
export type Cmip6Scenario = "ssp245" | "ssp585";

export interface Cmip6Manifest {
  step_years: number;
  years: number[];
  variables: { id: Cmip6Variable; label: string }[];
  scenarios: { id: Cmip6Scenario; label: string }[];
  default: { variable: Cmip6Variable; scenario: Cmip6Scenario; year: number };
  frames: Record<
    string,
    {
      variable: Cmip6Variable;
      scenario: Cmip6Scenario;
      year: number;
      file: string;
      cells: number;
    }
  >;
}

export interface Cmip6Selection {
  variable: Cmip6Variable;
  scenario: Cmip6Scenario;
  year: number;
}

export const CMIP6_VARIABLE_LABELS: Record<Cmip6Variable, string> = {
  tasmax: "Temperatura Máxima (°C)",
  tasmin: "Temperatura Mínima (°C)",
};

export const CMIP6_VARIABLE_SHORT: Record<Cmip6Variable, string> = {
  tasmax: "Máxima",
  tasmin: "Mínima",
};

export { CMIP6_TIMELINE_YEARS, colorStopsForVariable, legendGradientForVariable };

/** Año de archivo GeoJSON: hasta 2035 usa banda 2020; desde 2040 usa banda 2050. */
export function cmip6DataYearForTimeline(timelineYear: number): number {
  return timelineYear <= 2035 ? 2020 : 2050;
}

export function frameId(sel: Cmip6Selection): string {
  const dataYear = cmip6DataYearForTimeline(sel.year);
  return `${sel.variable}_${sel.scenario}_${dataYear}`;
}

export function cmip6FrameCacheKey(sel: Cmip6Selection): string {
  return frameId(sel);
}

let manifestCache: Cmip6Manifest | null = null;

const DEFAULT_CMIP6_LAYER: Cmip6Selection = {
  variable: "tasmax",
  scenario: "ssp245",
  year: 2020,
};

let defaultLayerPreload: Promise<void> | null = null;
const frameDataCache = new Map<string, GeoJSON.FeatureCollection>();

export function getCachedCmip6Frame(sel: Cmip6Selection): GeoJSON.FeatureCollection | undefined {
  return frameDataCache.get(frameId(sel));
}

/** Precarga Tmax SSP2-4.5 (2020) para que el mapa muestre capa al iniciar. */
export function preloadDefaultCmip6Layer(): Promise<void> {
  if (!defaultLayerPreload) {
    defaultLayerPreload = fetchCmip6Manifest()
      .then(() => fetchCmip6Frame(DEFAULT_CMIP6_LAYER))
      .then(() => undefined);
  }
  return defaultLayerPreload;
}

export async function fetchCmip6Manifest(): Promise<Cmip6Manifest> {
  if (manifestCache) return manifestCache;
  const res = await fetch("/data/cmip6/manifest.json");
  if (!res.ok) throw new Error("No se pudo cargar manifest CMIP6");
  manifestCache = (await res.json()) as Cmip6Manifest;
  return manifestCache;
}

export async function fetchCmip6Frame(sel: Cmip6Selection): Promise<GeoJSON.FeatureCollection> {
  const id = frameId(sel);
  const hit = frameDataCache.get(id);
  if (hit) return hit;

  const gzUrl = `/data/cmip6/${id}.geojson.gz`;
  const res = await fetch(gzUrl);
  if (!res.ok) throw new Error(`No se pudo cargar capa ${id}`);

  let data: GeoJSON.FeatureCollection;
  if (typeof DecompressionStream !== "undefined" && res.body) {
    const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    data = JSON.parse(text) as GeoJSON.FeatureCollection;
  } else {
    const legacy = await fetch(`/data/cmip6/${id}.geojson`);
    if (!legacy.ok) throw new Error(`No se pudo cargar capa ${id}`);
    data = (await legacy.json()) as GeoJSON.FeatureCollection;
  }

  frameDataCache.set(id, data);
  return data;
}

function resolveBeforeId(map: maplibregl.Map, beforeLayerId?: string): string | undefined {
  if (beforeLayerId && map.getLayer(beforeLayerId)) return beforeLayerId;
  return findMapLabelAnchor(map);
}

function applyHeatmapPaint(map: maplibregl.Map, variable: Cmip6Variable) {
  const paint = heatmapPaintForVariable(variable);
  if (!paint || !map.getLayer(TEMP_GRID_LAYER)) return;
  map.setPaintProperty(TEMP_GRID_LAYER, "heatmap-weight", paint["heatmap-weight"]!);
  map.setPaintProperty(TEMP_GRID_LAYER, "heatmap-intensity", paint["heatmap-intensity"]!);
  map.setPaintProperty(TEMP_GRID_LAYER, "heatmap-radius", paint["heatmap-radius"]!);
  map.setPaintProperty(TEMP_GRID_LAYER, "heatmap-opacity", paint["heatmap-opacity"]!);
  map.setPaintProperty(TEMP_GRID_LAYER, "heatmap-color", paint["heatmap-color"]!);
}

function applyCirclePaint(map: maplibregl.Map, variable: Cmip6Variable) {
  const paint = circlePaintForVariable(variable);
  if (!paint || !map.getLayer(TEMP_GRID_CIRCLE_LAYER)) return;
  map.setPaintProperty(TEMP_GRID_CIRCLE_LAYER, "circle-radius", paint["circle-radius"]!);
  map.setPaintProperty(TEMP_GRID_CIRCLE_LAYER, "circle-opacity", paint["circle-opacity"]!);
  map.setPaintProperty(TEMP_GRID_CIRCLE_LAYER, "circle-color", paint["circle-color"]!);
  map.setPaintProperty(TEMP_GRID_CIRCLE_LAYER, "circle-stroke-width", paint["circle-stroke-width"]!);
}

function ensureCmip6Layers(
  map: maplibregl.Map,
  variable: Cmip6Variable,
  beforeLayerId?: string
) {
  const anchor = resolveBeforeId(map, beforeLayerId);
  const heatPaint = heatmapPaintForVariable(variable);
  const circlePaint = circlePaintForVariable(variable);

  if (!map.getLayer(TEMP_GRID_CIRCLE_LAYER)) {
    map.addLayer(
      {
        id: TEMP_GRID_CIRCLE_LAYER,
        type: "circle",
        source: TEMP_GRID_SOURCE,
        paint: circlePaint,
      },
      anchor
    );
  } else {
    applyCirclePaint(map, variable);
  }

  if (!map.getLayer(TEMP_GRID_LAYER)) {
    map.addLayer(
      {
        id: TEMP_GRID_LAYER,
        type: "heatmap",
        source: TEMP_GRID_SOURCE,
        paint: heatPaint,
      },
      anchor
    );
  } else {
    applyHeatmapPaint(map, variable);
  }
}

export function syncCmip6HeatmapLayer(
  map: maplibregl.Map,
  data: GeoJSON.FeatureCollection,
  selection: Cmip6Selection,
  beforeLayerId?: string
) {
  const existingLayer = map.getLayer(TEMP_GRID_LAYER);
  if (existingLayer && existingLayer.type !== "heatmap") {
    if (map.getLayer(TEMP_GRID_LAYER)) map.removeLayer(TEMP_GRID_LAYER);
    if (map.getSource(TEMP_GRID_SOURCE)) map.removeSource(TEMP_GRID_SOURCE);
  }

  const source = map.getSource(TEMP_GRID_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
    ensureCmip6Layers(map, selection.variable, beforeLayerId);
    raiseLayersAboveHeatmap(map, SCHOOL_POINT_LAYERS);
    return;
  }

  map.addSource(TEMP_GRID_SOURCE, { type: "geojson", data });
  ensureCmip6Layers(map, selection.variable, beforeLayerId);
  raiseLayersAboveHeatmap(map, SCHOOL_POINT_LAYERS);
}

export function removeCmip6HeatmapLayer(map: maplibregl.Map) {
  if (map.getLayer(TEMP_GRID_LAYER)) map.removeLayer(TEMP_GRID_LAYER);
  if (map.getLayer(TEMP_GRID_CIRCLE_LAYER)) map.removeLayer(TEMP_GRID_CIRCLE_LAYER);
  if (map.getSource(TEMP_GRID_SOURCE)) map.removeSource(TEMP_GRID_SOURCE);
}
