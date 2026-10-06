import type maplibregl from "maplibre-gl";
import type { CountryCode } from "./types";

/** Vista inicial por país: zoom lejano; pan/zoom libre hasta maxZoom para ver escuelas. */
export interface CountryMapSpotlight {
  schoolId: string;
  label: string;
  center: [number, number];
  zoom: number;
  maxBounds: maplibregl.LngLatBoundsLike;
  minZoom: number;
  maxZoom: number;
}

/** Tope de zoom al encuadrar el país (más bajo = vista más amplia, mejor capa CMIP6). */
export const COUNTRY_MAP_FIT_MAX_ZOOM = 1.92;

export const COUNTRY_MAP_SPOTLIGHT: Record<CountryCode, CountryMapSpotlight> = {
  CL: {
    schoolId: "",
    label: "Chile",
    center: [-71.5, -39],
    zoom: 1.85,
    minZoom: 1.35,
    maxZoom: 18,
    maxBounds: [
      [-77, -56.5],
      [-65, -17],
    ],
  },
  PE: {
    schoolId: "",
    label: "Perú",
    center: [-76, -10.5],
    zoom: 1.9,
    minZoom: 1.4,
    maxZoom: 18,
    maxBounds: [
      [-82.5, -19.5],
      [-68, -0.2],
    ],
  },
  CO: {
    schoolId: "",
    label: "Colombia",
    center: [-74.5, 5],
    zoom: 1.9,
    minZoom: 1.4,
    maxZoom: 18,
    maxBounds: [
      [-80.5, -4.5],
      [-66, 13.5],
    ],
  },
};
