"use client";

import type { CountrySlug, SchoolProperties } from "@/lib/types";

interface Props {
  school: SchoolProperties;
  countrySlug: CountrySlug;
  onClose: () => void;
}

export default function SchoolDetailModal({ school, countrySlug: _countrySlug, onClose }: Props) {
  const t2020 = school.tmax_cmip6_2020_c ?? school.tmax_avg_c;
  const t2050 = school.tmax_cmip6_2050_c;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="school-title"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <h2 id="school-title">{school.school_name}</h2>
        <p className="modal-meta">
          {school.admin1}, {school.admin2}, {school.sector || "Sector sin dato"},{" "}
          {school.enrollment > 0 ? `${school.enrollment.toLocaleString("es-CL")} estudiantes` : "Matrícula sin dato"},{" "}
          {school.urban_rural}
          {school.altitude_m != null ? `, ${school.altitude_m} m s.n.m.` : ""}
        </p>

        <div className="modal-kpis">
          <div className="modal-kpi">
            <div className="val">{t2020}°C</div>
            <div className="lbl">Tmax CMIP6 2020</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{t2050 != null ? `${t2050}°C` : "N/D"}</div>
            <div className="lbl">Tmax CMIP6 2050</div>
          </div>
          <div className="modal-kpi">
            <div className="val">
              {t2050 != null ? `${Math.round((t2050 - t2020) * 10) / 10}°C` : "N/D"}
            </div>
            <div className="lbl">Δ 2020→2050</div>
          </div>
          <div className="modal-kpi">
            <div className="val">{school.school_id}</div>
            <div className="lbl">ID escuela</div>
          </div>
        </div>

        <p className="acerca-note" style={{ marginTop: "1rem" }}>
          Series diarias e históricas en aula se publicarán en una próxima versión. Por ahora se
          muestran datos administrativos y proyección CMIP6 en el punto de la escuela.
        </p>
      </div>
    </div>
  );
}
