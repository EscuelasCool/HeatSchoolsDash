"use client";

import { useEffect, useMemo, useState } from "react";
import type { CountryMeta, SchoolFeature, SchoolProperties } from "@/lib/types";
import {
  computeCountryKpis,
  filterSchools,
  schoolsByRegion,
} from "@/lib/aggregates";
import { fetchCountryDashboardData } from "@/lib/dataClient";
import { formatDecimal, formatInteger } from "@/lib/format";
import SchoolMap from "./SchoolMap";
import KpiCards from "./KpiCards";
import { CountryTmaxChart, RegionBarChart } from "./Charts";
import SchoolTable from "./SchoolTable";
import SchoolDetailModal from "./SchoolDetailModal";
import { COUNTRY_MAP_SPOTLIGHT } from "@/lib/countryMapSpotlight";
import { fixSpanishText } from "@/lib/textFix";
import SearchableCheckboxFilter from "./SearchableCheckboxFilter";

interface Props {
  country: CountryMeta;
}

function normalizeAdmin2(value: string): string {
  return value.trim() || "Sin comuna";
}

export default function CountryDashboard({ country }: Props) {
  const [mapFeatures, setMapFeatures] = useState<SchoolFeature[]>([]);
  const [allSchools, setAllSchools] = useState<SchoolProperties[]>([]);
  const [dailySeries, setDailySeries] = useState<Awaited<
    ReturnType<typeof fetchCountryDashboardData>
  >["dailySeries"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdmin2, setSelectedAdmin2] = useState<string[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCountryDashboardData(country.slug)
      .then((data) => {
        if (cancelled) return;
        setMapFeatures(data.mapFeatures);
        setAllSchools(
          data.schools.map((s) => ({
            ...s,
            school_name: fixSpanishText(s.school_name),
            admin1: fixSpanishText(s.admin1),
            admin2: fixSpanishText(s.admin2),
          }))
        );
        setDailySeries(data.dailySeries);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [country.slug]);

  const municipalityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allSchools) {
      const key = normalizeAdmin2(s.admin2);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([label]) => ({ id: label, label }));
  }, [allSchools]);

  const schoolOptions = useMemo(
    () =>
      allSchools
        .map((s) => ({
          id: s.school_id,
          label: s.school_name.trim() || s.school_id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    [allSchools]
  );

  const filtered = useMemo(
    () =>
      filterSchools(allSchools, {
        admin2: selectedAdmin2.length ? selectedAdmin2 : undefined,
        schoolIds: selectedSchoolIds.length ? selectedSchoolIds : undefined,
      }),
    [allSchools, selectedAdmin2, selectedSchoolIds]
  );

  const filteredIds = useMemo(() => new Set(filtered.map((s) => s.school_id)), [filtered]);

  const filteredMapFeatures = useMemo(
    () => mapFeatures.filter((f) => filteredIds.has(f.properties.school_id)),
    [mapFeatures, filteredIds]
  );

  const kpis = computeCountryKpis(filtered);
  const regionData = schoolsByRegion(filtered);

  const selectedSchool = selectedId
    ? allSchools.find((s) => s.school_id === selectedId) ?? null
    : null;

  const mapSpotlight = COUNTRY_MAP_SPOTLIGHT[country.code];

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Cargando datos de {country.label}…</div>
      </div>
    );
  }

  if (error || !dailySeries) {
    return (
      <div className="container">
        <div className="loading" style={{ color: "var(--color-accent)" }}>
          {error ?? "No se pudieron cargar los datos"}
        </div>
      </div>
    );
  }

  const mapBlock = (
    <div className="panel country-map-panel country-map-panel--tall">
      <h3>Mapa de escuelas</h3>
      <SchoolMap
        features={filteredMapFeatures}
        center={mapSpotlight.center}
        zoom={mapSpotlight.zoom}
        onSchoolClick={setSelectedId}
        exportName={country.route}
        variant="tall"
      />
    </div>
  );

  const chartsBlock = (
    <>
      <div className="panel">
        <h3>Escuelas por región (admin1)</h3>
        <RegionBarChart data={regionData} exportName={country.route} />
      </div>
      <div className="panel country-tmax-panel">
        <h3>Temperatura CMIP6 SSP2-4.5, media en escuelas (2020, 2050)</h3>
        <CountryTmaxChart
          series={dailySeries}
          label={country.label}
          exportName={country.route}
        />
      </div>
    </>
  );

  return (
    <div className={`container dashboard-grid country-dashboard country-dashboard--${country.slug}`}>
      <h1 style={{ fontFamily: "var(--font-heading)", marginTop: "1.5rem" }}>
        {country.label}
      </h1>

      <div className="filters filters--checkbox-panels">
        <SearchableCheckboxFilter
          title="Municipalidad"
          options={municipalityOptions}
          selected={selectedAdmin2}
          onChange={setSelectedAdmin2}
          searchPlaceholder="Escribe comuna o municipio…"
        />
        <SearchableCheckboxFilter
          title="Escuela"
          options={schoolOptions}
          selected={selectedSchoolIds}
          onChange={setSelectedSchoolIds}
          searchPlaceholder="Escribe nombre de escuela…"
          maxVisible={50}
        />
      </div>

      <KpiCards
        items={[
          { label: "Escuelas", value: formatInteger(kpis.count) },
          { label: "Estudiantes prom.", value: formatDecimal(kpis.avgEnrollment, 1) },
          { label: "Tmax 2020 (CMIP6)", value: `${formatDecimal(kpis.avgTmax2020, 1)}°C` },
          { label: "Tmax 2050 (CMIP6)", value: `${formatDecimal(kpis.avgTmax2050, 1)}°C` },
          { label: "Urbano", value: `${formatDecimal(kpis.urbanSharePct, 1)}%` },
        ]}
      />

      <div className="country-explorer-grid">
        <div className="country-charts-stack">{chartsBlock}</div>
        {mapBlock}
      </div>

      <div className="panel">
        <h3>Tabla de escuelas ({formatInteger(filtered.length)})</h3>
        <SchoolTable schools={filtered} onSelect={setSelectedId} exportName={country.route} />
      </div>

      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          countrySlug={country.slug}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
