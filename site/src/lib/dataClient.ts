/**
 * Carga de datos en el navegador desde /public/data (fetch).
 */
import type { CountryCode, CountrySlug, SchoolsGeoJSON, SchoolProperties } from "./types";
import { COUNTRIES } from "./types";
import type { Cmip6ClimateSeries } from "./climate";
import { simulateDailyTmaxSeries } from "./simulatedClimate";
import type { DailyClimateSeries } from "./climate";
import { computeCountryKpis, computeGlobalKpis } from "./aggregates";
import {
  enrollmentSizeBuckets,
  schoolsByCountry,
  schoolTypeBuckets,
  urbanRuralBuckets,
} from "./distributions";
import type { CountryPanelData } from "@/components/HomeStatsPanel";
import type { CountryMapInfo } from "@/components/SouthAmericaMap";
import type { SchoolFeature } from "./types";
import { COUNTRY_CODE_TO_ISO } from "./mapStyles";
import { publicUrl } from "./paths";

const COUNTRY_BLURBS: Record<CountryCode, string> = {
  CL: "Directorio MINEDUC georeferenciado; Tmax CMIP6 SSP2-4.5 en escuela.",
  CO: "Geoestadísticos DANE georeferenciados; Tmax CMIP6 SSP2-4.5 en escuela.",
  PE: "SIGMED / MINEDU georeferenciado; Tmax CMIP6 SSP2-4.5 en escuela.",
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
  return res.json() as Promise<T>;
}

async function fetchGzipJson<T>(gzUrl: string, legacyUrl: string): Promise<T> {
  const res = await fetch(gzUrl);
  if (res.ok && typeof DecompressionStream !== "undefined" && res.body) {
    const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    return JSON.parse(text) as T;
  }

  return fetchJson<T>(legacyUrl);
}

export async function fetchSchoolsGeoJSON(slug: CountrySlug): Promise<SchoolsGeoJSON> {
  return fetchGzipJson(
    publicUrl(`/data/schools/${slug}.geojson.gz`),
    publicUrl(`/data/schools/${slug}.geojson`)
  );
}

export async function fetchSchoolMapGeoJSON(slug: CountrySlug): Promise<SchoolsGeoJSON> {
  return fetchGzipJson(
    publicUrl(`/data/schools-map/${slug}.geojson.gz`),
    publicUrl(`/data/schools-map/${slug}.geojson`)
  );
}

export async function fetchCountryClimate(slug: CountrySlug): Promise<Cmip6ClimateSeries> {
  return fetchGzipJson(
    publicUrl(`/data/summary/${slug}_climate.json.gz`),
    publicUrl(`/data/summary/${slug}_climate.json`)
  );
}

export interface CountryDashboardData {
  schools: SchoolProperties[];
  mapFeatures: SchoolFeature[];
  climateSeries: Cmip6ClimateSeries;
  dailySeries: DailyClimateSeries;
}

export async function fetchCountryDashboardData(slug: CountrySlug): Promise<CountryDashboardData> {
  const meta = COUNTRIES.find((c) => c.slug === slug)!;
  const [schoolsGeo, mapGeo, climateSeries] = await Promise.all([
    fetchSchoolsGeoJSON(slug),
    fetchSchoolMapGeoJSON(slug),
    fetchCountryClimate(slug),
  ]);
  const schools = schoolsGeo.features.map((f) => f.properties);
  const kpis = computeCountryKpis(schools);

  return {
    schools,
    mapFeatures: mapGeo.features,
    climateSeries,
    dailySeries: simulateDailyTmaxSeries(meta.label, kpis.avgTmax2020, kpis.avgTmax2050),
  };
}

export interface HomePageData {
  globalKpis: ReturnType<typeof computeGlobalKpis>;
  dailyByCountry: Record<CountryCode, DailyClimateSeries>;
  globalDistribution: {
    byCountry: ReturnType<typeof schoolsByCountry>;
    byEnrollmentSize: ReturnType<typeof enrollmentSizeBuckets>;
    bySchoolType: ReturnType<typeof schoolTypeBuckets>;
    byZone: ReturnType<typeof urbanRuralBuckets>;
  };
  mapCountries: CountryMapInfo[];
  schoolFeatures: SchoolFeature[];
  countries: CountryPanelData[];
}

export async function fetchHomePageData(): Promise<HomePageData> {
  const byCountry = await Promise.all(
    COUNTRIES.map(async (c) => {
      const [schoolsGeo, mapGeo, climate] = await Promise.all([
        fetchSchoolsGeoJSON(c.slug),
        fetchSchoolMapGeoJSON(c.slug),
        fetchCountryClimate(c.slug),
      ]);
      const schools = schoolsGeo.features.map((f) => f.properties);
      const kpis = computeCountryKpis(schools);
      const daily = simulateDailyTmaxSeries(c.label, kpis.avgTmax2020, kpis.avgTmax2050);
      return {
        meta: c,
        schools,
        mapFeatures: mapGeo.features,
        daily,
        kpis,
        climate,
      };
    })
  );

  const allSchools = byCountry.flatMap((c) => c.schools);
  const dailyByCountry = Object.fromEntries(
    byCountry.map((c) => [c.meta.code, c.daily])
  ) as Record<CountryCode, DailyClimateSeries>;

  const countries: CountryPanelData[] = byCountry.map((c) => ({
    code: c.meta.code,
    route: c.meta.route,
    label: c.meta.label,
    count: c.schools.length,
    kpis: c.kpis,
    distribution: {
      byEnrollmentSize: enrollmentSizeBuckets(c.schools),
      bySchoolType: schoolTypeBuckets(c.schools),
      byZone: urbanRuralBuckets(c.schools),
    },
    dailyClimate: c.daily,
  }));

  const mapCountries: CountryMapInfo[] = countries.map((c) => ({
    code: c.code,
    iso: COUNTRY_CODE_TO_ISO[c.code],
    label: c.label,
    count: c.count,
    avgTmax2020: c.kpis.avgTmax2020,
    avgTmax2050: c.kpis.avgTmax2050,
    totalEnrollment: c.kpis.totalEnrollment,
    blurb: COUNTRY_BLURBS[c.code],
  }));

  return {
    globalKpis: computeGlobalKpis(allSchools),
    dailyByCountry,
    globalDistribution: {
      byCountry: schoolsByCountry(allSchools),
      byEnrollmentSize: enrollmentSizeBuckets(allSchools),
      bySchoolType: schoolTypeBuckets(allSchools),
      byZone: urbanRuralBuckets(allSchools),
    },
    mapCountries,
    schoolFeatures: byCountry.flatMap((c) => c.mapFeatures),
    countries,
  };
}
