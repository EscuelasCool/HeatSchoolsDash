/** Debe coincidir con `basePath` en next.config.ts */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefija rutas a archivos en /public (datos, imágenes) para deploy en subdirectorio. */
export function publicUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!basePath) return normalized;
  if (normalized.startsWith(`${basePath}/`)) return normalized;
  return `${basePath}${normalized}`;
}
