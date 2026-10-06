"use client";

import { useEffect, useRef, useState } from "react";
import type { Cmip6Manifest, Cmip6Scenario, Cmip6Selection, Cmip6Variable } from "@/lib/cmip6";
import {
  CMIP6_TIMELINE_YEARS,
  CMIP6_VARIABLE_LABELS,
  CMIP6_VARIABLE_SHORT,
  colorStopsForVariable,
  fetchCmip6Manifest,
  legendGradientForVariable,
} from "@/lib/cmip6";

const PLAY_INTERVAL_MS = 1200;

interface Props {
  value: Cmip6Selection;
  onChange: (next: Cmip6Selection) => void;
}

function playableYears(manifest: Cmip6Manifest, sel: Cmip6Selection): number[] {
  return CMIP6_TIMELINE_YEARS.filter(
    (y) => manifest.frames[`${sel.variable}_${sel.scenario}_${y}`]
  );
}

export default function Cmip6TimeControl({ value, onChange }: Props) {
  const [manifest, setManifest] = useState<Cmip6Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(playing);
  playRef.current = playing;

  useEffect(() => {
    fetchCmip6Manifest()
      .then((m) => {
        setManifest(m);
        setPlaying(true);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error CMIP6"));
  }, []);

  useEffect(() => {
    if (!playing || !manifest) return;
    const playable = playableYears(manifest, value);
    const timer = window.setInterval(() => {
      if (!playRef.current || playable.length < 2) return;
      const idx = playable.indexOf(value.year);
      const nextYear = playable[(idx + 1) % playable.length];
      onChange({ ...value, year: nextYear });
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing, manifest, value, onChange]);

  useEffect(() => {
    if (!manifest) return;
    const years = playableYears(manifest, value);
    const fallback = years[0] ?? CMIP6_TIMELINE_YEARS[0];
    if (!years.includes(value.year)) {
      onChange({ ...value, year: fallback });
    }
  }, [manifest, value, onChange]);

  if (error) {
    return <p className="panel-hint">{error}</p>;
  }

  if (!manifest) {
    return <p className="panel-hint">Cargando capas CMIP6…</p>;
  }

  const years = playableYears(manifest, value);
  const safeYear = years.includes(value.year) ? value.year : years[0] ?? 2020;
  const yearIndex = Math.max(0, years.indexOf(safeYear));
  const colorStops = colorStopsForVariable(value.variable);

  return (
    <div className="temp-map-header cmip6-map-header">
      <div className="cmip6-vars-row" role="group" aria-label="Temperatura y escenario CMIP6">
        <span className="temp-scenario-label temp-scenario-label--lg cmip6-temp-title">
          Temperatura (°C)
        </span>
        <div className="cmip6-var-scenario-options">
          {manifest.variables.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`temp-scenario-btn temp-scenario-btn--lg ${value.variable === v.id ? "active" : ""}`}
              onClick={() => onChange({ ...value, variable: v.id as Cmip6Variable })}
            >
              {CMIP6_VARIABLE_SHORT[v.id as Cmip6Variable]}
            </button>
          ))}
        </div>
        <span className="temp-scenario-label temp-scenario-label--lg cmip6-scenario-label">Escenario</span>
        <div className="temp-scenario-options cmip6-scenario-options">
          {manifest.scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`temp-scenario-btn temp-scenario-btn--lg ${value.scenario === s.id ? "active" : ""}`}
              onClick={() => onChange({ ...value, scenario: s.id as Cmip6Scenario })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cmip6-time-row cmip6-time-row--compact">
        <input
          type="range"
          className="cmip6-time-slider"
          min={0}
          max={Math.max(0, years.length - 1)}
          step={1}
          value={yearIndex}
          disabled={years.length < 2}
          onChange={(e) => {
            const y = years[Number(e.target.value)] ?? safeYear;
            onChange({ ...value, year: y });
          }}
          aria-valuemin={years[0]}
          aria-valuemax={years[years.length - 1]}
          aria-valuenow={safeYear}
          aria-label="Línea de tiempo CMIP6"
        />
        <div className="cmip6-time-ticks cmip6-time-ticks--lg">
          {years.map((y) => (
            <span key={y} className={y === safeYear ? "is-active" : undefined}>
              {y}
            </span>
          ))}
        </div>
        <button
          type="button"
          className={`cmip6-play-btn ${playing ? "active" : ""}`}
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
          disabled={years.length < 2}
        >
          <span className="cmip6-play-icon" aria-hidden="true">
            {playing ? "❚❚" : "▶"}
          </span>
          {playing ? "Pausa" : "Play"}
        </button>
      </div>

      <div className="temp-grid-legend temp-grid-legend--wide" aria-label="Leyenda de temperatura">
        <span className="temp-legend-label temp-legend-label--lg">
          {CMIP6_VARIABLE_LABELS[value.variable]}
        </span>
        <div className="temp-legend-bar-wrap temp-legend-bar-wrap--wide">
          <div
            className="temp-legend-bar temp-legend-bar--wide"
            style={{ background: legendGradientForVariable(value.variable) }}
            role="img"
            aria-hidden="true"
          />
          <div className="temp-legend-ticks temp-legend-ticks--lg">
            {colorStops.map((stop) => (
              <span key={stop.value} className="temp-legend-tick">
                {stop.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
