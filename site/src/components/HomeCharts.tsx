"use client";

/**
 * Gráficos del panel home: tortas con % en blanco y series diarias por país.
 */
import { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import type { PieSlice } from "@/lib/distributions";
import { integerPercents } from "@/lib/percentages";
import type { DailyClimateSeries } from "@/lib/climate";
import { formatDayLabel } from "@/lib/climate";
import { formatDecimal } from "@/lib/format";
import { downsampleDailySeries } from "@/lib/simulatedClimate";
import { plotAxisScaleOptions, stylePlotSvg } from "@/lib/plotTheme";
import { useTheme } from "./ThemeProvider";
import ExportToolbar from "./ExportToolbar";
import { downloadCsv, downloadSvgAsPng, shareLink } from "@/lib/export";
import {
  applyLineDrawProgress,
  useViewportChartAnimation,
} from "@/hooks/useViewportChartAnimation";

const PIE_COLORS = ["#0653a5", "#f86601", "#023155", "#05b5dc", "#fbb501", "#5b6770"];
const WINDOW_DAYS = 30;
/** Radio hasta el centro de la banda del donut (px). */
const PIE_LABEL_RADIUS = 49;
/** Gira la posición sobre el anillo (texto sigue horizontal). */
const PIE_LABEL_POSITION_OFFSET_DEG = -90;

export function PieChart({ data }: { data: PieSlice[] }) {
  const { containerRef, progress } = useViewportChartAnimation(950);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const pcts = integerPercents(data.map((d) => d.value));
  let acc = 0;
  const stops: string[] = [];
  const labels: { pct: number; midAngle: number; key: string }[] = [];

  data.forEach((d, i) => {
    const slicePct = pcts[i] ?? 0;
    const finalStart = acc;
    acc += slicePct;
    const finalEnd = acc;
    const start = finalStart * progress;
    const end = finalEnd * progress;
    stops.push(`${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`);
    const midAngle = ((finalStart + finalEnd) / 200) * 360 - 90;
    labels.push({
      pct: slicePct,
      midAngle,
      key: d.label,
    });
  });

  const labelOpacity = progress >= 0.92 ? 1 : Math.max(0, (progress - 0.75) / 0.17);

  return (
    <div ref={containerRef} className="pie-wrap">
      <div className="pie-ring">
        <div
          className="pie-donut"
          style={{
            background:
              progress > 0
                ? `conic-gradient(from -90deg, ${stops.join(", ")})`
                : "conic-gradient(transparent 0%, transparent 100%)",
          }}
          role="img"
          aria-label="Gráfico de distribución"
        />
        {labels.map((l) => {
          if (l.pct < 3) return null;
          const rad = ((l.midAngle + PIE_LABEL_POSITION_OFFSET_DEG) * Math.PI) / 180;
          const x = Math.cos(rad) * PIE_LABEL_RADIUS;
          const y = Math.sin(rad) * PIE_LABEL_RADIUS;
          return (
            <span
              key={l.key}
              className="pie-slice-pct"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                opacity: labelOpacity,
              }}
            >
              {l.pct}%
            </span>
          );
        })}
      </div>
      <div className="pie-labels" style={{ opacity: 0.35 + labelOpacity * 0.65 }}>
        {data.map((d, i) => (
          <span key={d.label}>
            <i style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.label} ({pcts[i] ?? 0}%)
          </span>
        ))}
      </div>
    </div>
  );
}

export function DailyTmaxChart({
  series,
  label,
  exportName,
  animated = true,
  showThresholdBands = false,
  showThresholdLines = false,
  showPointValues = false,
  height = 165,
  className,
  stackedLayout = false,
}: {
  series: DailyClimateSeries;
  label: string;
  exportName?: string;
  animated?: boolean;
  showThresholdBands?: boolean;
  showThresholdLines?: boolean;
  showPointValues?: boolean;
  height?: number;
  className?: string;
  stackedLayout?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { containerRef, progress } = useViewportChartAnimation(1100);
  const { theme } = useTheme();
  const maxWindow = stackedLayout ? series.date.length : WINDOW_DAYS;
  const [windowEnd, setWindowEnd] = useState(() => Math.min(maxWindow, series.date.length));

  useEffect(() => {
    setWindowEnd(Math.min(stackedLayout ? series.date.length : WINDOW_DAYS, series.date.length));
  }, [series.date.length, stackedLayout]);

  useEffect(() => {
    if (stackedLayout || !animated || series.date.length <= WINDOW_DAYS) return;
    const timer = window.setInterval(() => {
      setWindowEnd((prev) => (prev >= series.date.length ? WINDOW_DAYS : prev + 1));
    }, 400);
    return () => window.clearInterval(timer);
  }, [animated, series.date.length, stackedLayout]);

  useEffect(() => {
    if (!ref.current || !series.date.length) return;
    ref.current.innerHTML = "";

    const baseSeries =
      series.date.length > 500 ? downsampleDailySeries(series, 3) : series;

    const windowSize = stackedLayout ? baseSeries.date.length : WINDOW_DAYS;
    const end = Math.min(windowEnd, baseSeries.date.length);
    const start = Math.max(0, end - windowSize);
    const sliceDates = baseSeries.date.slice(start, end);
    const sliceTmax = baseSeries.tmax_c.slice(start, end);
    const sliceLo = baseSeries.tmax_lo?.slice(start, end);
    const sliceHi = baseSeries.tmax_hi?.slice(start, end);
    const sliceFc = baseSeries.isForecast?.slice(start, end);

    const rows = sliceDates.map((d, i) => ({
      x: i,
      date: stackedLayout
        ? d.endsWith("-01-01")
          ? d.slice(0, 4)
          : d.slice(0, 7)
        : formatDayLabel(d),
      tmax: sliceTmax[i],
      lo: sliceLo?.[i],
      hi: sliceHi?.[i],
      forecast: sliceFc?.[i] ?? false,
    }));

    const obsRows = rows.filter((r) => !r.forecast);
    const fcRows = rows.filter((r) => r.forecast);

    const stroke = theme === "dark" ? "#fbb501" : "#f86601";
    const tickColor = theme === "dark" ? "#94a3b8" : "#5c6370";
    const xAxis = plotAxisScaleOptions(theme);
    const yAxis = plotAxisScaleOptions(theme);
    const pointWidth = stackedLayout ? 56 : 22;
    const thresholds = series.thresholds;

    const yValues = [...sliceTmax];
    if (sliceLo) yValues.push(...sliceLo);
    if (sliceHi) yValues.push(...sliceHi);
    if (thresholds) {
      yValues.push(thresholds.p90, thresholds.p95, thresholds.p99);
    }
    const yPadding = 1;
    const yMin = Math.floor(Math.min(...yValues) - yPadding);
    const yMax = Math.ceil(Math.max(...yValues) + yPadding);

    const drawProgress = animated ? progress : 1;
    const visibleCount = Math.max(1, Math.ceil(rows.length * drawProgress));
    const labeledRows = showPointValues ? rows.slice(0, visibleCount) : [];

    const marks: unknown[] = [];

    if (showThresholdBands && thresholds) {
      const band = [{ x1: -0.5, x2: Math.max(0.5, rows.length - 0.5) }];
      marks.push(
        Plot.rect(band, {
          x1: () => -0.5,
          x2: () => Math.max(0.5, rows.length - 0.5),
          y1: thresholds.p90,
          y2: yMax,
          fill: "rgba(242,161,84,0.14)",
        }),
        Plot.rect(band, {
          x1: () => -0.5,
          x2: () => Math.max(0.5, rows.length - 0.5),
          y1: thresholds.p95,
          y2: yMax,
          fill: "rgba(234,88,12,0.18)",
        }),
        Plot.rect(band, {
          x1: () => -0.5,
          x2: () => Math.max(0.5, rows.length - 0.5),
          y1: thresholds.p99,
          y2: yMax,
          fill: "rgba(185,28,28,0.22)",
        }),
        Plot.ruleY([thresholds.p90], { stroke: "rgba(242,161,84,0.55)", strokeDasharray: "4,4" }),
        Plot.ruleY([thresholds.p95], { stroke: "rgba(234,88,12,0.65)", strokeDasharray: "4,4" }),
        Plot.ruleY([thresholds.p99], { stroke: "rgba(185,28,28,0.75)", strokeDasharray: "4,4" })
      );
    }

    if (showThresholdLines && thresholds) {
      marks.push(
        Plot.ruleY([thresholds.p90], { stroke: "#facc15", strokeDasharray: "6,4", strokeWidth: 1.5 }),
        Plot.ruleY([thresholds.p95], { stroke: "#f97316", strokeDasharray: "6,4", strokeWidth: 1.5 }),
        Plot.ruleY([thresholds.p99], { stroke: "#dc2626", strokeDasharray: "6,4", strokeWidth: 1.5 })
      );
    }

    if (fcRows.length > 0 && fcRows[0].lo != null && fcRows[0].hi != null) {
      marks.push(
        Plot.areaY(fcRows, {
          x: "x",
          y1: "lo",
          y2: "hi",
          fill: theme === "dark" ? "rgba(148,163,184,0.22)" : "rgba(100,116,139,0.2)",
        })
      );
    }

    if (obsRows.length > 0) {
      marks.push(
        Plot.lineY(obsRows, {
          x: "x",
          y: "tmax",
          stroke,
          strokeWidth: 1.75,
        }),
        Plot.dot(obsRows, {
          x: "x",
          y: "tmax",
          fill: stroke,
          r: stackedLayout ? 0 : 2.5,
        })
      );
    }

    if (fcRows.length > 0) {
      marks.push(
        Plot.lineY(fcRows, {
          x: "x",
          y: "tmax",
          stroke,
          strokeWidth: 1.75,
          strokeDasharray: "6,4",
        })
      );
    }

    if (labeledRows.length > 0) {
      marks.push(
        Plot.text(labeledRows, {
          x: (_d, i) => i,
          y: "tmax",
          text: (d) => `${formatDecimal(d.tmax, 1)}°`,
          dy: -10,
          fill: tickColor,
          fontSize: 10,
        })
      );
    }

    const plotWidth = stackedLayout
      ? Math.max(280, (ref.current?.parentElement?.clientWidth ?? 480) - 8)
      : Math.max(320, sliceDates.length * pointWidth);

    const chart = Plot.plot({
      width: plotWidth,
      height,
      marginBottom: stackedLayout ? 44 : 50,
      marginLeft: showThresholdLines ? 52 : 42,
      marginRight: 8,
      x: {
        ...xAxis,
        tickRotate: stackedLayout ? 0 : -55,
        tickFormat: (_: string, i: number) => rows[i]?.date ?? "",
      },
      y: {
        ...yAxis,
        ticks: showThresholdLines ? 8 : 7,
        tickFormat: (v: number) => `${formatDecimal(v, 0)}°`,
        domain: [yMin, yMax],
      },
      marks: marks as Plot.Markish[],
    });

    stylePlotSvg(chart.querySelector("svg"), theme);

    ref.current.append(chart);

    applyLineDrawProgress(chart.querySelector("svg"), progress);

    if (scrollRef.current && animated) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }

    return () => chart.remove();
  }, [
    series,
    windowEnd,
    theme,
    animated,
    progress,
    showThresholdBands,
    showThresholdLines,
    showPointValues,
    height,
  ]);

  useEffect(() => {
    const svg = ref.current?.querySelector("svg") as SVGSVGElement | null;
    applyLineDrawProgress(svg, progress);
  }, [progress]);

  const slug = exportName ?? label.toLowerCase().replace(/\s+/g, "-");

  const exportCsv = () => {
    downloadCsv(
      `tmax-diaria-${slug}.csv`,
      ["fecha", "tmax_c"],
      series.date.map((d, i) => [d, series.tmax_c[i]])
    );
  };

  const exportPng = async () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    await downloadSvgAsPng(svg, `tmax-diaria-${slug}.png`);
  };

  const exportShare = () => {
    void shareLink(`Temperatura CMIP6, ${label}`, `Serie de temperatura para ${label}.`);
  };

  return (
    <div
      ref={containerRef}
      className={`daily-chart-wrap${stackedLayout ? " daily-chart-wrap--stacked" : ""}${className ? ` ${className}` : ""}`}
    >
      <ExportToolbar
        variant="block"
        onShare={exportShare}
        onPng={() => void exportPng()}
        onCsv={exportCsv}
      />
      <div ref={scrollRef} className={stackedLayout ? "daily-chart-fit" : "daily-chart-scroll"}>
        <div ref={ref} className="plot-chart daily-chart" />
      </div>
      {series.forecastFrom && (
        <p className="chart-forecast-note">
          Desde 2026: predicción simulada al 95% (banda gris e intervalo de confianza; línea
          punteada).
        </p>
      )}
    </div>
  );
}
