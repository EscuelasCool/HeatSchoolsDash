import type { CountryCode } from "./types";

/** Vista inicial: barrios centrales de la capital (centroide de comunas en admin2). */
export interface CountryMapSpotlight {
  schoolId: string;
  label: string;
  center: [number, number];
  zoom: number;
}

export const COUNTRY_MAP_SPOTLIGHT: Record<CountryCode, CountryMapSpotlight> = {
  CL: {
    schoolId: "",
    label: "Santiago centro (RM)",
    center: [-70.658, -33.451],
    zoom: 12.4,
  },
  PE: {
    schoolId: "",
    label: "Lima centro",
    center: [-77.042, -12.058],
    zoom: 12.2,
  },
  CO: {
    schoolId: "",
    label: "Bogotá centro",
    center: [-74.114, 4.637],
    zoom: 12,
  },
};
