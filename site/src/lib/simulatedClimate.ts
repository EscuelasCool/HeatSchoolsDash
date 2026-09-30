import type { DailyClimateSeries } from "./climate";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Serie diaria simulada: estacional + tendencia CMIP6; predicción punteada desde 2026 con IC 95%. */
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

  const start = new Date(2020, 0, 1);
  const end = new Date(2050, 11, 31);
  const cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= end) {
    const y = cursor.getFullYear();
    const forecast = y >= 2026;
    const trend = tmax2020 + ((tmax2050 - tmax2020) * (y - 2020)) / 30;
    const season = 2.8 * Math.sin((dayIndex / 365.25) * Math.PI * 2 - Math.PI / 2);
    const noise =
      0.6 * Math.sin(dayIndex * 0.11) + 0.4 * Math.cos(dayIndex * 0.037 + country.length);
    const val = trend + season + noise;
    const icWidth = forecast ? 0.9 + ((y - 2026) / 24) * 1.8 : 0;

    date.push(cursor.toISOString().slice(0, 10));
    tmax_c.push(round1(val));
    tmax_lo.push(round1(val - icWidth));
    tmax_hi.push(round1(val + icWidth));
    isForecast.push(forecast);

    cursor.setDate(cursor.getDate() + 1);
    dayIndex += 1;
  }

  return {
    country,
    resolution: "daily-simulated",
    date,
    tmax_c,
    tmax_lo,
    tmax_hi,
    isForecast,
    forecastFrom: "2026-01-01",
  };
}

/** Muestreo para dibujar (~1 punto cada 3 días). */
export function downsampleDailySeries(series: DailyClimateSeries, step = 3): DailyClimateSeries {
  const pick = (arr: number[] | boolean[] | undefined, i: number) => arr?.[i];
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
