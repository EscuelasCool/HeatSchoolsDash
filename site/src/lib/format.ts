/** Formato numérico es-CL: miles con punto y decimales con coma. */
export const LOCALE_ES = "es-CL";

export function formatInteger(value: number): string {
  return value.toLocaleString(LOCALE_ES);
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString(LOCALE_ES, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
