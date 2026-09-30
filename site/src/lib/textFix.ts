/** Corrige mojibake típico (UTF-8 leído como Latin-1) en textos de fuentes administrativas. */
export function fixSpanishText(value: string): string {
  if (!value) return value;
  let s = value;
  try {
    if (/Ã|Â|�/.test(s)) {
      s = decodeURIComponent(escape(s));
    }
  } catch {
    /* mantener original */
  }
  return s
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
