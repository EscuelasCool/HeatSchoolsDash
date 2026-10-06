import type { CircleLayerSpecification, HeatmapLayerSpecification } from "maplibre-gl";
import type { Cmip6Variable } from "./cmip6";

/** Parte inferior de la banda (lápices): azules más claros para Tmin. */
export const TMIN_COLOR_STOPS = [
  { value: 0, color: "#3d6a8c" },
  { value: 8, color: "#4a8fd4" },
  { value: 14, color: "#6ecde8" },
  { value: 20, color: "#b8e8f4" },
  { value: 26, color: "#dff4fb" },
] as const;

/** Parte superior de la banda: naranjos/rojos más suaves para Tmax. */
export const TMAX_COLOR_STOPS = [
  { value: 18, color: "#fdd663" },
  { value: 24, color: "#f9a04d" },
  { value: 30, color: "#f8784a" },
  { value: 36, color: "#e85d5d" },
  { value: 42, color: "#c96a6c" },
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
    "circle-opacity": 0.68,
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "t"],
      18,
      "#fdd663",
      24,
      "#f9a04d",
      30,
      "#f8784a",
      36,
      "#e85d5d",
      42,
      "#c96a6c",
    ],
    "circle-stroke-width": 0,
  };
}

function tminCircleColor(): CircleLayerSpecification["paint"] {
  return {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 4, 7, 6, 10, 9, 14],
    "circle-opacity": 0.68,
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "t"],
      0,
      "#3d6a8c",
      8,
      "#4a8fd4",
      14,
      "#6ecde8",
      20,
      "#b8e8f4",
      26,
      "#dff4fb",
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
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 1.5, 0.62, 3, 0.52, 6, 0.58, 9, 0.78, 12, 0.92],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 1.5, 16, 3, 13, 6, 17, 10, 26],
      "heatmap-opacity": 0.88,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(61,106,140,0)",
        0.1,
        "rgba(74,143,212,0.14)",
        0.35,
        "rgba(110,205,232,0.22)",
        0.55,
        "rgba(184,232,244,0.28)",
        0.75,
        "rgba(223,244,251,0.32)",
        1,
        "rgba(223,244,251,0.36)",
      ],
    };
  }

  return {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "t"], 12, 0, 42, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 2, 0.42, 5, 0.48, 8, 0.72, 11, 0.9],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 7, 4, 11, 7, 18, 10, 26],
    "heatmap-opacity": 0.88,
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(253,214,99,0)",
      0.12,
      "rgba(253,214,99,0.16)",
      0.35,
      "rgba(249,160,77,0.24)",
      0.55,
      "rgba(248,120,74,0.28)",
      0.78,
      "rgba(232,93,93,0.32)",
      1,
      "rgba(201,106,108,0.36)",
    ],
  };
}
