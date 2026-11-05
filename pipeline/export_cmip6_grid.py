"""
Exporta capas CMIP6 (GeoTIFF multibanda o por año) a puntos GeoJSON comprimidos
para heatmaps MapLibre en el sitio estático.

Entrada: CMIP6_SouthAmerica/CMIP6_<var>_<ssp>_SouthAmerica_<year>.tif
  - *_2020.tif multibanda (7 bandas: 2020–2050) o archivos de un solo año (2025, …, 2050).
Salida:  site/public/data/cmip6/<var>_<ssp>_<year>.geojson.gz + manifest.json
"""
from __future__ import annotations

import gzip
import json
import re
from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import xy

REPO_ROOT = Path(__file__).resolve().parents[1]
CMIP6_DIR = REPO_ROOT / "CMIP6_SouthAmerica"
OUT_DIR = REPO_ROOT / "site" / "public" / "data" / "cmip6"

FILE_RE = re.compile(
    r"CMIP6_(?P<var>tasmax|tasmin)_(?P<ssp>ssp245|ssp585)_SouthAmerica_(?P<year>\d{4})\.tif$",
    re.I,
)

T_MIN_VALID = 0.0
T_MAX_VALID = 55.0


def parse_year_from_band(description: str | None, band_index: int) -> int:
    if description:
        m = re.search(r"(\d{4})", description)
        if m:
            return int(m.group(1))
    return 2020 + (band_index - 1) * 5


def band_to_features(dataset: rasterio.DatasetReader, band_index: int) -> list[dict]:
    data = dataset.read(band_index, masked=True)
    arr = np.ma.asarray(data)
    valid = np.isfinite(arr) & (arr >= T_MIN_VALID) & (arr <= T_MAX_VALID)
    rows, cols = np.where(valid)
    features: list[dict] = []
    for row, col in zip(rows, cols, strict=False):
        lon, lat = xy(dataset.transform, int(row), int(col), offset="center")
        t = float(arr[row, col])
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 4), round(lat, 4)]},
                "properties": {"t": round(t, 2)},
            }
        )
    return features


def write_gz_geojson(path: Path, features: list[dict]) -> float:
    collection = {"type": "FeatureCollection", "features": features}
    payload = json.dumps(collection, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(path, "wb", compresslevel=9) as handle:
        handle.write(payload)
    return path.stat().st_size / (1024 * 1024)


def export_frame(
    frames: dict[str, dict],
    years_set: set[int],
    var: str,
    ssp: str,
    year: int,
    features: list[dict],
) -> None:
    frame_id = f"{var}_{ssp}_{year}"
    if frame_id in frames:
        return
    out_path = OUT_DIR / f"{frame_id}.geojson.gz"
    size_mb = write_gz_geojson(out_path, features)
    years_set.add(year)
    t_vals = [f["properties"]["t"] for f in features]
    frames[frame_id] = {
        "variable": var,
        "scenario": ssp,
        "year": year,
        "file": out_path.name,
        "cells": len(features),
        "file_mb": round(size_mb, 3),
        "t_range": [round(min(t_vals), 1), round(max(t_vals), 1)] if t_vals else None,
    }
    print(f"  {frame_id}: {len(features)} celdas → {size_mb:.2f} MB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frames: dict[str, dict] = {}
    years_set: set[int] = set()

    for tif_path in sorted(CMIP6_DIR.glob("*.tif")):
        m = FILE_RE.match(tif_path.name)
        if not m:
            print(f"Omitido: {tif_path.name}")
            continue

        var = m.group("var").lower()
        ssp = m.group("ssp").lower()
        file_year = int(m.group("year"))
        print(f"Procesando {tif_path.name} …")

        with rasterio.open(tif_path) as ds:
            if ds.count > 1:
                for band in range(1, ds.count + 1):
                    desc = ds.descriptions[band - 1] if ds.descriptions else None
                    year = parse_year_from_band(desc, band)
                    features = band_to_features(ds, band)
                    export_frame(frames, years_set, var, ssp, year, features)
            else:
                features = band_to_features(ds, 1)
                export_frame(frames, years_set, var, ssp, file_year, features)

    years = sorted(years_set)
    manifest = {
        "source": "CMIP6 South America (NEX-GDDP-CMIP6, ~0.25°)",
        "step_years": 5,
        "years": years,
        "variables": [
            {"id": "tasmax", "label": "Tmax"},
            {"id": "tasmin", "label": "Tmin"},
        ],
        "scenarios": [
            {"id": "ssp245", "label": "SSP2-4.5"},
            {"id": "ssp585", "label": "SSP5-8.5"},
        ],
        "default": {
            "variable": "tasmax",
            "scenario": "ssp245",
            "year": years[0] if years else 2020,
        },
        "frames": frames,
    }

    manifest_path = OUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifest → {manifest_path} ({len(frames)} frames)")


if __name__ == "__main__":
    main()
