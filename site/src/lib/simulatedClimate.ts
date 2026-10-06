import type { DailyClimateSeries } from "./climate";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Promedios mensuales simulados (2000–2050): tendencia ascendente + estacional; forecast desde 2026. */
export function simulateDailyTmaxSeries(
  country: string,
  tmax2020: number,
  tmax2050: number
): DailyClimateSeries {
  const date: string[] = [];
  const tmax_c: number[] = [];
  const tmax_lo: number[] = [];
  const tmax_hi: number[] = [];
  const isForecast: boolean[] = [];

  const delta = tmax2050 - tmax2020;
  const tmax2000 = tmax2020 - delta * 0.95;
  const tmaxEnd = tmax2050 + delta * 0.35;

  for (let y = 2000; y <= 2050; y += 1) {
    for (let m = 0; m < 12; m += 1) {
      const isFc = y >= 2026;
      const t = (y - 2000 + m / 12) / 50;
      const trend = tmax2000 + (tmaxEnd - tmax2000) * t;
      const season = 1.35 * Math.sin((m / 12) * Math.PI * 2 - Math.PI / 2);
      const noise =
        0.18 * Math.sin(y * 0.37 + m * 0.9) +
        0.1 * Math.cos(m * 0.55 + country.length * 0.3);
      const val = trend + season + noise;
      const icWidth = isFc ? 0.5 + ((y - 2026 + m / 12) / 24) * 1.4 : 0;

      const month = String(m + 1).padStart(2, "0");
      date.push(`${y}-${month}-01`);
      tmax_c.push(round1(val));
      tmax_lo.push(round1(val - icWidth));
      tmax_hi.push(round1(val + icWidth));
      isForecast.push(isFc);
    }
  }

  return {
    country,
    resolution: "monthly-simulated",
    date,
    tmax_c,
    tmax_lo,
    tmax_hi,
    isForecast,
    forecastFrom: "2026-01-01",
  };
}

/** Muestreo para dibujar series largas. */
export function downsampleDailySeries(series: DailyClimateSeries, step = 3): DailyClimateSeries {
  const date: string[] = [];
  const tmax_c: number[] = [];
  const tmax_lo: number[] = [];
  const tmax_hi: number[] = [];
  const isForecast: boolean[] = [];

  for (let i = 0; i < series.date.length; i += step) {
    date.push(series.date[i]);
    tmax_c.push(series.tmax_c[i]);
    if (series.tmax_lo) tmax_lo.push(series.tmax_lo[i]);
    if (series.tmax_hi) tmax_hi.push(series.tmax_hi[i]);
    if (series.isForecast) isForecast.push(series.isForecast[i]);
  }

  return {
    ...series,
    date,
    tmax_c,
    tmax_lo: series.tmax_lo ? tmax_lo : undefined,
    tmax_hi: series.tmax_hi ? tmax_hi : undefined,
    isForecast: series.isForecast ? isForecast : undefined,
  };
}
