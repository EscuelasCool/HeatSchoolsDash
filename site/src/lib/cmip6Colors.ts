import type { CircleLayerSpecification, HeatmapLayerSpecification } from "maplibre-gl";
import type { Cmip6Variable } from "./cmip6";

/** Parte inferior de la banda (lápices): azules para Tmin. */
export const TMIN_COLOR_STOPS = [
  { value: 0, color: "#023155" },
  { value: 8, color: "#0653a5" },
  { value: 14, color: "#05b5dc" },
  { value: 20, color: "#9adaeb" },
  { value: 26, color: "#c5e8f5" },
] as const;

/** Parte superior de la banda: naranjos/rojos para Tmax. */
export const TMAX_COLOR_STOPS = [
  { value: 18, color: "#fbb501" },
  { value: 24, color: "#f86601" },
  { value: 30, color: "#f94102" },
  { value: 36, color: "#b40b0e" },
  { value: 42, color: "#7a080a" },
] as const;

export const CMIP6_TIMELINE_YEARS = [2020, 2025, 2030, 2035, 2040, 2045, 2050] as const;

export function colorStopsForVariable(variable: Cmip6Variable) {
  return variable === "tasmin" ? TMIN_COLOR_STOPS : TMAX_COLOR_STOPS;
}

export function legendGradientForVariable(variable: Cmip6Variable): string {
  const stops = colorStopsForVariable(variable);
  const min = stops[0].value;
  const max = stops[stops.length - 1].value;
  const parts = stops.map(
    (s) => `${s.color} ${((s.value - min) / (max - min)) * 100}%`
  );
  return `linear-gradient(to right, ${parts.join(", ")})`;
}

function tmaxCircleColor(): CircleLayerSpecification["paint"] {
  return {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 4, 7, 6, 10, 9, 14],
    "circle-opacity": 0.82,
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "t"],
      18,
      "#fbb501",
      24,
      "#f86601",
      30,
      "#f94102",
      36,
      "#b40b0e",
      42,
      "#7a080a",
    ],
    "circle-stroke-width": 0,
  };
}

function tminCircleColor(): CircleLayerSpecification["paint"] {
  return {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 4, 7, 6, 10, 9, 14],
    "circle-opacity": 0.82,
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "t"],
      0,
      "#023155",
      8,
      "#0653a5",
      14,
      "#05b5dc",
      20,
      "#9adaeb",
      26,
      "#c5e8f5",
    ],
    "circle-stroke-width": 0,
  };
}

export function circlePaintForVariable(variable: Cmip6Variable): CircleLayerSpecification["paint"] {
  return variable === "tasmin" ? tminCircleColor() : tmaxCircleColor();
}

export function heatmapPaintForVariable(
  variable: Cmip6Variable
): HeatmapLayerSpecification["paint"] {
  if (variable === "tasmin") {
    return {
      "heatmap-weight": ["interpolate", ["linear"], ["get", "t"], 0, 0, 30, 1],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 2, 0.52, 5, 0.58, 8, 0.85, 11, 1.05],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 7, 4, 11, 7, 18, 10, 26],
      "heatmap-opacity": 1,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(2,49,85,0)",
        0.1,
        "rgba(2,49,85,0.2)",
        0.35,
        "rgba(6,83,165,0.35)",
        0.55,
        "rgba(5,181,220,0.42)",
        0.75,
        "rgba(154,218,235,0.48)",
        1,
        "rgba(197,232,245,0.55)",
      ],
    };
  }

  return {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "t"], 12, 0, 42, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 2, 0.52, 5, 0.58, 8, 0.85, 11, 1.05],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 7, 4, 11, 7, 18, 10, 26],
    "heatmap-opacity": 1,
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(251,181,1,0)",
      0.12,
      "rgba(251,181,1,0.22)",
      0.35,
      "rgba(248,102,1,0.38)",
      0.55,
      "rgba(249,65,2,0.44)",
      0.78,
      "rgba(180,11,14,0.5)",
      1,
      "rgba(122,8,10,0.55)",
    ],
  };
}
