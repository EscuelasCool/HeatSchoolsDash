import type { NextConfig } from "next";

/** BUILD_PUBLIC=1 → raíz del worker; si no, subdirectorio escuelascool.org */
function resolveBasePath(): string {
  if (process.env.BUILD_PUBLIC === "1") return "";
  const raw = process.env.NEXT_PUBLIC_BASE_PATH;
  if (raw === "") return "";
  if (raw !== undefined) return raw;
  return "/escuelascooldash";
}

const basePath = resolveBasePath();

/**
 * Export estático para Cloudflare Workers / CDN.
 * Con basePath, stage-base-path mueve el export a out/<basePath>/.
 */
const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@duckdb/duckdb-wasm"],
};

export default nextConfig;
