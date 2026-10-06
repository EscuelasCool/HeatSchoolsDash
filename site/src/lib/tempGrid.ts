import type maplibregl from "maplibre-gl";

export const TEMP_SCENARIOS = [
  { id: "2000-2025", label: "2000–2025", hint: "Histórico", default: true },
  { id: "2025-2050", label: "2025–2050", hint: "+~1 °C" },
  { id: "2050-2075", label: "2050–2075", hint: "+~2 °C" },
  { id: "2075-2100", label: "2075–2100", hint: "+~3.5 °C" },
] as const;

export type TempScenarioId = (typeof TEMP_SCENARIOS)[number]["id"];

export const DEFAULT_TEMP_SCENARIO: TempScenarioId = "2000-2025";

export const TEMP_GRID_SOURCE = "temp-grid";
export const TEMP_GRID_LAYER = "temp-grid-heat";
export const TEMP_GRID_CIRCLE_LAYER = "temp-grid-cells";

/** Escala de color Tmax (°C) — compartida entre mapa y leyenda. */
/** Escala térmica EscuelasCool (guía de marca, anclada en lápices del logo). */
export const TEMP_COLOR_STOPS = [
  { value: 12, color: "#023155" },
  { value: 18, color: "#0653a5" },
  { value: 22, color: "#05b5dc" },
  { value: 26, color: "#9adaeb" },
  { value: 30, color: "#fbb501" },
  { value: 34, color: "#f86601" },
  { value: 38, color: "#b40b0e" },
] as const;

export const TEMP_LEGEND_MIN = TEMP_COLOR_STOPS[0].value;
export const TEMP_LEGEND_MAX = TEMP_COLOR_STOPS[TEMP_COLOR_STOPS.length - 1].value;

export function tempLegendGradient(): string {
  const stops = TEMP_COLOR_STOPS.map(
    (s) => `${s.color} ${((s.value - TEMP_LEGEND_MIN) / (TEMP_LEGEND_MAX - TEMP_LEGEND_MIN)) * 100}%`
  );
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export function tempGridDataUrl(scenario: TempScenarioId): string {
  return `/data/temp-grid/${scenario}.geojson.gz`;
}

export async function fetchTempGrid(scenario: TempScenarioId): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(tempGridDataUrl(scenario));
  if (!res.ok) throw new Error(`No se pudo cargar la grilla ${scenario}`);

  if (typeof DecompressionStream !== "undefined" && res.body) {
    const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    return JSON.parse(text) as GeoJSON.FeatureCollection;
  }

  const legacy = await fetch(`/data/temp-grid/${scenario}.geojson`);
  if (!legacy.ok) throw new Error(`No se pudo cargar la grilla ${scenario}`);
  return legacy.json();
}

/** Primera capa de etiquetas del estilo base — ancla para quedar debajo de nombres. */
export function findMapLabelAnchor(map: maplibregl.Map): string | undefined {
  const layers = map.getStyle()?.layers;
  if (!layers) return undefined;

  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    const layout = layer.layout as Record<string, unknown> | undefined;
    if (layout?.["text-field"]) return layer.id;
  }

  return layers.find((layer) => layer.type === "symbol")?.id;
}

function resolveBeforeId(map: maplibregl.Map, beforeLayerId?: string): string | undefined {
  if (beforeLayerId && map.getLayer(beforeLayerId)) return beforeLayerId;
  return findMapLabelAnchor(map);
}

/** Heatmap suave — baja opacidad para ver fronteras y etiquetas del mapa base. */
export function tempGridHeatmapPaint(): maplibregl.HeatmapLayerSpecification["paint"] {
  return {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "t"], 8, 0, 42, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 2, 0.3, 5, 0.45, 8, 0.68, 11, 0.88],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 7, 4, 11, 7, 18, 10, 26],
    "heatmap-opacity": 0.88,
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(61,106,140,0)",
      0.08,
      "rgba(74,143,212,0.12)",
      0.2,
      "rgba(110,205,232,0.18)",
      0.35,
      "rgba(184,232,244,0.22)",
      0.5,
      "rgba(253,214,99,0.24)",
      0.65,
      "rgba(249,160,77,0.28)",
      0.8,
      "rgba(248,120,74,0.3)",
      1,
      "rgba(232,93,93,0.34)",
    ],
  };
}

/** Inserta o actualiza la capa heatmap (debajo de etiquetas y escuelas visibles). */
export function syncTempGridLayer(
  map: maplibregl.Map,
  data: GeoJSON.FeatureCollection,
  beforeLayerId?: string
) {
  const existingLayer = map.getLayer(TEMP_GRID_LAYER);
  if (existingLayer && existingLayer.type !== "heatmap") {
    removeTempGridLayer(map);
  }

  const source = map.getSource(TEMP_GRID_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
    if (!map.getLayer(TEMP_GRID_LAYER)) {
      map.addLayer(
        {
          id: TEMP_GRID_LAYER,
          type: "heatmap",
          source: TEMP_GRID_SOURCE,
          paint: tempGridHeatmapPaint(),
        },
        resolveBeforeId(map, beforeLayerId)
      );
    }
    return;
  }

  map.addSource(TEMP_GRID_SOURCE, { type: "geojson", data });
  map.addLayer(
    {
      id: TEMP_GRID_LAYER,
      type: "heatmap",
      source: TEMP_GRID_SOURCE,
      paint: tempGridHeatmapPaint(),
    },
    resolveBeforeId(map, beforeLayerId)
  );
}

export function removeTempGridLayer(map: maplibregl.Map) {
  if (map.getLayer(TEMP_GRID_LAYER)) map.removeLayer(TEMP_GRID_LAYER);
  if (map.getSource(TEMP_GRID_SOURCE)) map.removeSource(TEMP_GRID_SOURCE);
}

/** Capas de escuelas (mapa continental y mapas de país). */
export const SCHOOL_POINT_LAYERS = [
  "school-clusters",
  "school-cluster-count",
  "school-points",
] as const;

/** @deprecated Usar SCHOOL_POINT_LAYERS */
export const COUNTRY_SCHOOL_LAYERS = SCHOOL_POINT_LAYERS;

/** @deprecated Usar SCHOOL_POINT_LAYERS */
export const HOME_SCHOOL_LAYERS = SCHOOL_POINT_LAYERS;

/** Mantiene puntos/clusters por encima del heatmap (p. ej. tras carga async de la grilla). */
export function raiseLayersAboveHeatmap(
  map: maplibregl.Map,
  layerIds: readonly string[]
) {
  if (!map.getLayer(TEMP_GRID_LAYER) && !map.getLayer(TEMP_GRID_CIRCLE_LAYER)) return;
  const beforeLabels = findMapLabelAnchor(map);
  for (const layerId of layerIds) {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId, beforeLabels);
    }
  }
}
