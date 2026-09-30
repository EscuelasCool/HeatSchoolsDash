"use client";

import Link from "next/link";
import type { CountryCode } from "@/lib/types";
import type { GlobalKpis } from "@/lib/aggregates";
import type { DailyClimateSeries } from "@/lib/climate";
import type { PieSlice } from "@/lib/distributions";
import { COUNTRIES } from "@/lib/types";
import { formatDecimal, formatInteger } from "@/lib/format";
import { CompactKpiRow } from "./KpiCards";
import { PieChart, DailyTmaxChart } from "./HomeCharts";

export interface CountryPanelData {
  code: CountryCode;
  route: string;
  label: string;
  count: number;
  kpis: {
    count: number;
    totalEnrollment: number;
    avgEnrollment: number;
    avgAltitude: number;
    avgTmax2020: number;
    avgTmax2050: number;
    urbanSharePct: number;
  };
  distribution: {
    byEnrollmentSize: PieSlice[];
    bySchoolType: PieSlice[];
    byZone: PieSlice[];
  };
  dailyClimate: DailyClimateSeries;
}

interface Props {
  globalKpis: GlobalKpis;
  dailyByCountry: Record<CountryCode, DailyClimateSeries>;
  globalDistribution: {
    byCountry: PieSlice[];
    byEnrollmentSize: PieSlice[];
    bySchoolType: PieSlice[];
    byZone: PieSlice[];
  };
  countries: CountryPanelData[];
  selected: CountryCode | null;
}

export default function HomeStatsPanel({
  globalKpis,
  dailyByCountry,
  globalDistribution,
  countries,
  selected,
}: Props) {
  const active = selected ? countries.find((c) => c.code === selected) : null;
  const panelKey = active?.code ?? "global";

  return (
    <div className="home-stats-panel">
      <div className="stats-panel-header">
        <span className="stats-eyebrow">{active ? "PAÍS" : "PANORAMA"}</span>
        <h2 className="stats-title">{active ? active.label : "Cifras generales"}</h2>
        {!active && <p className="stats-subtitle">Chile, Colombia y Perú</p>}
      </div>

      <div key={panelKey} className="stats-panel-body">
        <CompactKpiRow
          items={
            active
              ? [
                  { label: "Escuelas", value: formatInteger(active.kpis.count) },
                  {
                    label: "Estudiantes prom.",
                    value: formatDecimal(active.kpis.avgEnrollment, 1),
                  },
                  { label: "Tmax 2020", value: `${formatDecimal(active.kpis.avgTmax2020, 1)}°C` },
                  { label: "Tmax 2050", value: `${formatDecimal(active.kpis.avgTmax2050, 1)}°C` },
                  { label: "Urbano", value: `${active.kpis.urbanSharePct}%` },
                ]
              : [
                  { label: "Escuelas", value: formatInteger(globalKpis.totalSchools) },
                  {
                    label: "Estudiantes prom.",
                    value: formatDecimal(globalKpis.avgEnrollment, 1),
                  },
                  { label: "Tmax 2020", value: `${formatDecimal(globalKpis.avgTmax2020, 1)}°C` },
                  { label: "Tmax 2050", value: `${formatDecimal(globalKpis.avgTmax2050, 1)}°C` },
                  { label: "Urbano", value: `${globalKpis.urbanSharePct}%` },
                ]
          }
        />

        <div className="home-chart-grid">
          {active ? (
            <>
              <div className="mini-panel">
                <h4>Tipo de escuela</h4>
                <PieChart data={active.distribution.bySchoolType} />
              </div>
              <div className="mini-panel">
                <h4>Urbano / Rural</h4>
                <PieChart data={active.distribution.byZone} />
              </div>
            </>
          ) : (
            <>
              <div className="mini-panel">
                <h4>Por país</h4>
                <PieChart data={globalDistribution.byCountry} />
              </div>
              <div className="mini-panel">
                <h4>Tipo de escuela</h4>
                <PieChart data={globalDistribution.bySchoolType} />
              </div>
              <div className="mini-panel">
                <h4>Urbano / Rural</h4>
                <PieChart data={globalDistribution.byZone} />
              </div>
            </>
          )}
        </div>

        <div className={active ? "climate-row-single" : "climate-row-stack"}>
          {active ? (
            <div className="mini-panel mini-panel-chart mini-panel-chart--stacked">
              <h4>Temperatura CMIP6, {active.label}</h4>
              <DailyTmaxChart
                series={active.dailyClimate}
                label={active.label}
                stackedLayout
                height={200}
              />
            </div>
          ) : (
            COUNTRIES.map((c) => (
              <div key={c.code} className="mini-panel mini-panel-chart mini-panel-chart--stacked">
                <h4>Temperatura CMIP6, {c.label}</h4>
                <DailyTmaxChart
                  series={dailyByCountry[c.code]}
                  label={c.label}
                  stackedLayout
                  height={180}
                />
              </div>
            ))
          )}
        </div>

        {active && (
          <Link href={`/${active.route}`} className="btn explore-btn">
            Explorar →
          </Link>
        )}

        {!active && (
          <p className="stats-hint">Selecciona un país en el mapa para ver su detalle.</p>
        )}
      </div>
    </div>
  );
}
