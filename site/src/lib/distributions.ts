/**
 * Distribuciones de escuelas para gráficos de torta en la home.
 */
import type { SchoolProperties } from "./types";
import { COUNTRIES } from "./types";

export interface PieSlice {
  label: string;
  value: number;
}

export function countByField(schools: SchoolProperties[], field: keyof SchoolProperties): PieSlice[] {
  const map = new Map<string, number>();
  for (const s of schools) {
    const raw = s[field];
    const key = raw === null || raw === undefined || raw === "" ? "Sin dato" : String(raw);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function schoolsByCountry(allSchools: SchoolProperties[]): PieSlice[] {
  return COUNTRIES.map((c) => ({
    label: c.label,
    value: allSchools.filter((s) => s.country === c.code).length,
  }));
}

/** Matrícula por tramos de 10 estudiantes (0-10, 11-20, …). */
export function enrollmentSizeBuckets(schools: SchoolProperties[]): PieSlice[] {
  const map = new Map<string, number>();

  for (const s of schools) {
    const e = s.enrollment;
    let label: string;
    if (e == null || e <= 0) {
      label = "Sin dato";
    } else if (e <= 10) {
      label = "0-10";
    } else if (e <= 20) {
      label = "11-20";
    } else if (e <= 30) {
      label = "21-30";
    } else if (e <= 40) {
      label = "31-40";
    } else if (e <= 50) {
      label = "41-50";
    } else if (e <= 100) {
      label = "51-100";
    } else if (e <= 200) {
      label = "101-200";
    } else if (e <= 500) {
      label = "201-500";
    } else if (e <= 1000) {
      label = "501-1000";
    } else {
      label = "1001+";
    }
    map.set(label, (map.get(label) ?? 0) + 1);
  }

  const order = [
    "0-10",
    "11-20",
    "21-30",
    "31-40",
    "41-50",
    "51-100",
    "101-200",
    "201-500",
    "501-1000",
    "1001+",
    "Sin dato",
  ];

  return order
    .filter((label) => (map.get(label) ?? 0) > 0)
    .map((label) => ({ label, value: map.get(label) ?? 0 }));
}

/** Tipo de escuela homologado: Público / Privado / Sin dato. */
export function schoolTypeBuckets(schools: SchoolProperties[]): PieSlice[] {
  const map = new Map<string, number>([
    ["Público", 0],
    ["Privado", 0],
    ["Sin dato", 0],
  ]);

  for (const s of schools) {
    const raw = (s.sector || "").toLowerCase();
    if (!raw.trim()) {
      map.set("Sin dato", (map.get("Sin dato") ?? 0) + 1);
      continue;
    }
    if (
      raw.includes("priv") ||
      raw.includes("particular") ||
      raw.includes("private")
    ) {
      map.set("Privado", (map.get("Privado") ?? 0) + 1);
    } else if (
      raw.includes("públic") ||
      raw.includes("public") ||
      raw.includes("municipal") ||
      raw.includes("subvenc") ||
      raw.includes("estatal") ||
      raw.includes("oficial")
    ) {
      map.set("Público", (map.get("Público") ?? 0) + 1);
    } else {
      map.set("Sin dato", (map.get("Sin dato") ?? 0) + 1);
    }
  }

  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((x) => x.value > 0);
}

export function urbanRuralBuckets(schools: SchoolProperties[]): PieSlice[] {
  const map = new Map<string, number>();
  for (const s of schools) {
    const raw = (s.urban_rural || "").trim();
    let label = "Sin dato";
    if (/urbano/i.test(raw)) label = "Urbano";
    else if (/rural/i.test(raw)) label = "Rural";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

/** @deprecated Usar enrollmentSizeBuckets */
export const enrollmentBuckets = enrollmentSizeBuckets;

/** @deprecated Usar topAdmin1 solo si se necesita región */
export function topAdmin1(schools: SchoolProperties[], topN = 5): PieSlice[] {
  const byField = countByField(schools, "admin1");
  if (byField.length <= topN) return byField;
  const head = byField.slice(0, topN);
  const tail = byField.slice(topN).reduce((s, x) => s + x.value, 0);
  if (tail > 0) head.push({ label: "Otros", value: tail });
  return head;
}
