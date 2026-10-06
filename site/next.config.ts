import type { NextConfig } from "next";

/** Subdirectorio en escuelascool.org (Cloudflare route: escuelascool.org/escuelascooldash*). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/escuelascooldash";

/**
 * Export estático para Cloudflare Workers / CDN.
 * Con basePath, la salida queda en out/escuelascooldash/.
 */
const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@duckdb/duckdb-wasm"],
};

export default nextConfig;
