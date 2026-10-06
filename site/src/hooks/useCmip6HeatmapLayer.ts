"use client";

import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import {
  cmip6FrameCacheKey,
  fetchCmip6Frame,
  fetchCmip6Manifest,
  getCachedCmip6Frame,
  preloadDefaultCmip6Layer,
  syncCmip6HeatmapLayer,
  type Cmip6Selection,
} from "@/lib/cmip6";

export function useCmip6HeatmapLayer(
  map: maplibregl.Map | null,
  mapReady: boolean,
  selection: Cmip6Selection,
  styleEpoch = 0,
  beforeLayerId?: string,
  prefetchTimeline = false
) {
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, GeoJSON.FeatureCollection>>(new Map());
  const requestRef = useRef(0);

  useEffect(() => {
    void preloadDefaultCmip6Layer();
    if (!prefetchTimeline) return;
    void fetchCmip6Manifest().then(async (manifest) => {
      const years = manifest.years.slice().sort((a, b) => a - b);
      const { variable, scenario } = manifest.default;
      await Promise.all(
        years.map((year) =>
          fetchCmip6Frame({ variable, scenario, year }).catch(() => undefined)
        )
      );
    });
  }, [prefetchTimeline]);

  useEffect(() => {
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    let cancelled = false;
    const requestId = ++requestRef.current;

    async function load() {
      const mapInstance = map;
      if (!mapInstance) return;

      const key = cmip6FrameCacheKey(selection);
      const warm = getCachedCmip6Frame(selection) ?? cacheRef.current.get(key);
      if (warm && mapInstance.isStyleLoaded()) {
        syncCmip6HeatmapLayer(mapInstance, warm, selection, beforeLayerId);
      }

      setLoading(true);
      try {
        await preloadDefaultCmip6Layer();
        await fetchCmip6Manifest();
        let data = getCachedCmip6Frame(selection) ?? cacheRef.current.get(key);
        if (!data) {
          data = await fetchCmip6Frame(selection);
          cacheRef.current.set(key, data);
        }
        if (cancelled || requestId !== requestRef.current) return;
        syncCmip6HeatmapLayer(mapInstance, data, selection, beforeLayerId);
      } catch {
        /* capa opcional: mapa de escuelas sigue usable */
      } finally {
        if (!cancelled && requestId === requestRef.current) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [map, mapReady, selection, styleEpoch, beforeLayerId]);

  return { loading };
}
