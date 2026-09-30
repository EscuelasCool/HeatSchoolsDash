/**
 * Agregaciones sobre escuelas georeferenciadas (geoschool-2026 + CMIP6 en escuela).
 */
import type { SchoolProperties } from "./types";

export interface GlobalKpis {
  totalSchools: number;
  totalEnrollment: number;
  avgEnrollment: number;
  urbanSharePct: number;
  avgTmax2020: number;
  avgTmax2050: number;
}

function schoolTmax2020(s: SchoolProperties): number | null {
  return s.tmax_cmip6_2020_c ?? (s.tmax_avg_c > 0 ? s.tmax_avg_c : null);
}

function schoolTmax2050(s: SchoolProperties): number | null {
  return s.tmax_cmip6_2050_c ?? null;
}

function meanDefined(values: (number | null | undefined)[]): number {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length === 0) return 0;
  return round1(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function computeGlobalKpis(schools: SchoolProperties[]): GlobalKpis {
  const enrollment = schools.reduce((s, x) => s + (x.enrollment ?? 0), 0);
  const urban = schools.filter((s) => /urbano/i.test(s.urban_rural)).length;
  return {
    totalSchools: schools.length,
    totalEnrollment: enrollment,
    avgEnrollment: schools.length ? round1(enrollment / schools.length) : 0,
    urbanSharePct: schools.length ? round1((urban / schools.length) * 100) : 0,
    avgTmax2020: meanDefined(schools.map(schoolTmax2020)),
    avgTmax2050: meanDefined(schools.map(schoolTmax2050)),
  };
}

export function computeCountryKpis(schools: SchoolProperties[]) {
  const enrollment = schools.reduce((s, x) => s + (x.enrollment ?? 0), 0);
  const withAlt = schools.filter((s) => s.altitude_m != null && s.altitude_m > 0);
  const avgAltitude = withAlt.length
    ? round1(withAlt.reduce((s, x) => s + (x.altitude_m ?? 0), 0) / withAlt.length)
    : 0;

  return {
    count: schools.length,
    totalEnrollment: enrollment,
    avgEnrollment: schools.length ? round1(enrollment / schools.length) : 0,
    avgAltitude,
    avgTmax2020: meanDefined(schools.map(schoolTmax2020)),
    avgTmax2050: meanDefined(schools.map(schoolTmax2050)),
    urbanSharePct: schools.length
      ? round1((schools.filter((s) => /urbano/i.test(s.urban_rural)).length / schools.length) * 100)
      : 0,
  };
}

export function schoolsByRegion(schools: SchoolProperties[]): { region: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of schools) {
    const key = s.admin1 || "Sin región";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export function filterSchools(
  schools: SchoolProperties[],
  filters: {
    level?: string;
    sector?: string;
    urban_rural?: string;
    admin2?: string[];
    schoolIds?: string[];
  }
): SchoolProperties[] {
  return schools.filter((s) => {
    if (filters.level && filters.level !== "todos" && s.level && s.level !== filters.level) return false;
    if (filters.sector && filters.sector !== "todos") {
      const type =
        /priv|particular/i.test(s.sector || "") ? "Privado" : /públic|public|municipal|subvenc|estatal/i.test(s.sector || "") ? "Público" : "";
      if (type !== filters.sector) return false;
    }
    if (filters.urban_rural && filters.urban_rural !== "todos" && s.urban_rural !== filters.urban_rural)
      return false;
    if (filters.admin2?.length && !filters.admin2.includes(s.admin2)) return false;
    if (filters.schoolIds?.length && !filters.schoolIds.includes(s.school_id)) return false;
    return true;
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
