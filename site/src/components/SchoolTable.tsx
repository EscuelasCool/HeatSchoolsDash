"use client";

import type { SchoolProperties } from "@/lib/types";
import { formatInteger } from "@/lib/format";
import ExportToolbar from "./ExportToolbar";
import { downloadCsv } from "@/lib/export";

export default function SchoolTable({
  schools,
  onSelect,
  exportName = "escuelas",
}: {
  schools: SchoolProperties[];
  onSelect: (id: string) => void;
  exportName?: string;
}) {
  const exportCsv = () => {
    downloadCsv(
      `${exportName}-tabla.csv`,
      [
        "school_id",
        "school_name",
        "admin1",
        "admin2",
        "sector",
        "urban_rural",
        "enrollment",
        "altitude_m",
        "tmax_cmip6_2020_c",
        "tmax_cmip6_2050_c",
      ],
      schools.map((s) => [
        s.school_id,
        s.school_name,
        s.admin1,
        s.admin2,
        s.sector,
        s.urban_rural,
        s.enrollment,
        s.altitude_m ?? "",
        s.tmax_cmip6_2020_c ?? s.tmax_avg_c,
        s.tmax_cmip6_2050_c ?? "",
      ])
    );
  };

  return (
    <div className="table-panel-wrap">
      <ExportToolbar variant="block" onCsv={exportCsv} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Escuela</th>
              <th>Región</th>
              <th>Zona</th>
              <th>Sector</th>
              <th>Matrícula</th>
              <th>Tmax 2020</th>
              <th>Tmax 2050</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.school_id} onClick={() => onSelect(s.school_id)}>
                <td>{s.school_name}</td>
                <td>{s.admin1}</td>
                <td>{s.urban_rural}</td>
                <td>{s.sector || "N/D"}</td>
                <td>{s.enrollment > 0 ? formatInteger(s.enrollment) : "N/D"}</td>
                <td>{s.tmax_cmip6_2020_c ?? s.tmax_avg_c}°C</td>
                <td>{s.tmax_cmip6_2050_c != null ? `${s.tmax_cmip6_2050_c}°C` : "N/D"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {schools.length === 0 && (
          <p style={{ padding: "1rem", color: "var(--color-text-muted)" }}>
            No hay escuelas con los filtros seleccionados.
          </p>
        )}
      </div>
    </div>
  );
}
