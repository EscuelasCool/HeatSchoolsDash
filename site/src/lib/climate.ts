/** Formatea mes ISO (2024-08) a etiqueta corta — utilizable en cliente */
export function formatMonthLabel(isoMonth: string): string {
  const [y, m] = isoMonth.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" });
}

export interface MonthlyClimateSeries {
  country: string;
  resolution: string;
  month: string[];
  tmax_c: number[];
  tmin_c: number[];
  pet_c: number[];
  wbgt_c: number[];
  heat_days_30: number[];
}

/** Serie diaria de temperatura media nacional (últimos ~90 días) */
export interface DailyClimateSeries {
  country: string;
  resolution: string;
  date: string[];
  tmax_c: number[];
  tmax_lo?: number[];
  tmax_hi?: number[];
  isForecast?: boolean[];
  forecastFrom?: string;
  thresholds?: {
    p90: number;
    p95: number;
    p99: number;
  };
}

export function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

/** Serie quinquenal CMIP6 (media en escuelas del país). */
export interface Cmip6ClimateSeries {
  country: string;
  resolution: string;
  source?: string;
  years: number[];
  tmax_c: (number | null)[];
}

/** Adaptador para reutilizar gráficos de línea con eje temporal categórico. */
export function cmip6ToDailySeries(series: Cmip6ClimateSeries): DailyClimateSeries {
  return {
    country: series.country,
    resolution: series.resolution,
    date: series.years.map((y) => `${y}-01-01`),
    tmax_c: series.tmax_c.map((v) => v ?? 0),
  };
}
