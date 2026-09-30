"""
Construye artefactos del sitio a partir de OUTPUT-GEO-School y muestreo CMIP6 en cada escuela.

Salidas:
  site/public/data/schools-map/{cl,co,pe}.geojson.gz  — capa mapa (props ligeras)
  site/public/data/schools/{cl,co,pe}.geojson.gz      — panel / tablas / KPIs
  site/public/data/summary/{slug}_climate.json          — serie CMIP6 2020–2050 (media escuelas)
  site/public/data/summary/home_climate.json            — idem por país (home)
"""
from __future__ import annotations

import csv
import gzip
import json
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import rasterio

REPO_ROOT = Path(__file__).resolve().parents[1]
GEO_DIR = REPO_ROOT / "OUTPUT-GEO-School"
if not GEO_DIR.exists():
    GEO_DIR = REPO_ROOT / "pipeline" / "source" / "geoschool-2026"

CMIP6_TIF = REPO_ROOT / "CMIP6_SouthAmerica" / "CMIP6_tasmax_ssp245_SouthAmerica_2020.tif"

MAP_OUT = REPO_ROOT / "site" / "public" / "data" / "schools-map"
SCHOOLS_OUT = REPO_ROOT / "site" / "public" / "data" / "schools"
SUMMARY_OUT = REPO_ROOT / "site" / "public" / "data" / "summary"

COUNTRIES = {"CL": "cl", "CO": "co", "PE": "pe"}


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    number = _parse_float(value)
    if number is None:
        return None
    return int(number)


def load_cmip6_bands() -> tuple[list[int], np.ndarray, rasterio.DatasetReader]:
    """Devuelve años, matriz (n_bands, height, width) y dataset abierto."""
    ds = rasterio.open(CMIP6_TIF)
    years: list[int] = []
    bands: list[np.ndarray] = []
    for band in range(1, ds.count + 1):
        desc = ds.descriptions[band - 1] if ds.descriptions else None
        m = re.search(r"(\d{4})", desc or "")
        years.append(int(m.group(1)) if m else 2020 + (band - 1) * 5)
        arr = ds.read(band, masked=True)
        bands.append(np.ma.asarray(arr))
    return years, np.stack(bands, axis=0), ds


def sample_tmax_series(
    lons: list[float],
    lats: list[float],
    years: list[int],
    stack: np.ndarray,
    dataset: rasterio.DatasetReader,
) -> list[list[float | None]]:
    """Por escuela: lista de Tmax por año (None si fuera de grilla / nodata)."""
    from rasterio.transform import rowcol

    height, width = stack.shape[1], stack.shape[2]
    out: list[list[float | None]] = []
    for lon, lat in zip(lons, lats, strict=False):
        try:
            row, col = rowcol(dataset.transform, lon, lat)
        except Exception:
            out.append([None] * len(years))
            continue
        if row < 0 or col < 0 or row >= height or col >= width:
            out.append([None] * len(years))
            continue
        series: list[float | None] = []
        for b in range(len(years)):
            val = float(stack[b, row, col])
            if not np.isfinite(val) or val < 0 or val > 55:
                series.append(None)
            else:
                series.append(round(val, 2))
        out.append(series)
    return out


def write_gz(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(path, "wb", compresslevel=9) as handle:
        handle.write(raw)


def main() -> None:
    if not CMIP6_TIF.exists():
        raise SystemExit(f"Falta CMIP6: {CMIP6_TIF}")

    years, stack, ds = load_cmip6_bands()
    try:
        _run_build(years, stack, ds)
    finally:
        ds.close()


def _run_build(years: list[int], stack: np.ndarray, ds: rasterio.DatasetReader) -> None:
    MAP_OUT.mkdir(parents=True, exist_ok=True)
    SCHOOLS_OUT.mkdir(parents=True, exist_ok=True)
    SUMMARY_OUT.mkdir(parents=True, exist_ok=True)

    home_climate: dict[str, dict] = {}

    for country_code, slug in COUNTRIES.items():
        csv_path = GEO_DIR / f"{country_code}-geoschool-2026.csv"
        if not csv_path.exists():
            raise SystemExit(f"Falta {csv_path}")

        rows: list[dict] = []
        with csv_path.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))

        lons: list[float] = []
        lats: list[float] = []
        valid_rows: list[dict] = []
        for row in rows:
            lat = _parse_float(row.get("lat"))
            lon = _parse_float(row.get("lon"))
            if lat is None or lon is None:
                continue
            valid_rows.append(row)
            lons.append(lon)
            lats.append(lat)

        print(f"{slug}: muestreo CMIP6 en {len(valid_rows)} escuelas …")
        series_list = sample_tmax_series(lons, lats, years, stack, ds)

        map_features: list[dict] = []
        school_features: list[dict] = []
        year_accum: dict[int, list[float]] = defaultdict(list)

        for row, coords, series in zip(valid_rows, zip(lons, lats, strict=False), series_list, strict=False):
            lon, lat = coords
            sid = row.get("school_id", "").strip()
            sector = (row.get("sector") or "").strip() or "Sin dato"
            urban = (row.get("urban_rural") or "").strip() or "Sin dato"
            enrollment = _parse_int(row.get("enrollment"))
            altitude_m = _parse_float(row.get("altitude_m"))

            t2020 = series[0] if series else None
            t2050 = series[-1] if series else None
            for y, t in zip(years, series, strict=False):
                if t is not None:
                    year_accum[y].append(t)

            map_props = {
                "school_id": sid,
                "school_name": row.get("school_name", "").strip(),
                "country": country_code,
                "admin1": (row.get("admin1") or "").strip(),
                "admin2": (row.get("admin2") or "").strip(),
                "sector": sector,
                "urban_rural": urban,
            }
            if enrollment is not None:
                map_props["enrollment"] = enrollment

            school_props = {
                **map_props,
                "level": "",
                "enrollment": enrollment if enrollment is not None else 0,
                "altitude_m": round(altitude_m, 1) if altitude_m is not None else None,
                "tmax_avg_c": t2020 if t2020 is not None else 0,
                "tmax_cmip6_2020_c": t2020,
                "tmax_cmip6_2050_c": t2050,
                "pet_avg_c": 0,
                "wbgt_avg_c": 0,
                "heat_days_30": 0,
                "heat_days_35": 0,
                "tx90p": 0,
                "wsdi": 0,
                "wellbeing_score": 0,
                "health_index": 0,
            }

            feat = {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": school_props,
            }
            school_features.append(feat)
            map_features.append(
                {
                    "type": "Feature",
                    "geometry": feat["geometry"],
                    "properties": map_props,
                }
            )

        write_gz(MAP_OUT / f"{slug}.geojson.gz", {"type": "FeatureCollection", "features": map_features})
        write_gz(SCHOOLS_OUT / f"{slug}.geojson.gz", {"type": "FeatureCollection", "features": school_features})

        country_means = [round(float(np.mean(year_accum[y])), 2) if year_accum[y] else None for y in years]
        climate = {
            "country": country_code,
            "resolution": "cmip6_ssp245_5y",
            "source": "Media Tmax CMIP6 SSP2-4.5 en escuelas georeferenciadas",
            "years": years,
            "tmax_c": country_means,
        }
        write_gz(SUMMARY_OUT / f"{slug}_climate.json.gz", climate)
        # compat: fetch sin .gz
        (SUMMARY_OUT / f"{slug}_climate.json").write_text(
            json.dumps(climate, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        home_climate[country_code] = climate
        print(f"  → {len(map_features)} escuelas")

    (SUMMARY_OUT / "home_climate.json").write_text(
        json.dumps(home_climate, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("Listo.")


if __name__ == "__main__":
    main()
