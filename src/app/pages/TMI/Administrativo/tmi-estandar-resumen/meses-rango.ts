export const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** 0.98 -> "0.98", 4 -> "4" (sin ceros de más). */
export function fmtNum(v: number): string {
  return String(+v.toFixed(4));
}

/** null / '' -> null; si no, el número. */
export function aNumero(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * "Ene–Sep 4 · Oct–Dic pendiente": junta los meses seguidos con el mismo valor.
 * Si todo el año tiene el mismo valor: "Todo el año 4".
 */
export function rangoMeses(valores: (number | null)[], vacio = 'pendiente'): string {
  const texto = (v: number | null) => (v === null ? vacio : v === 0 ? 'sin estándar' : fmtNum(v));
  if (valores.every(v => v === valores[0])) return `Todo el año ${texto(valores[0])}`;
  const partes: string[] = [];
  let i = 0;
  while (i < valores.length) {
    let j = i;
    while (j + 1 < valores.length && valores[j + 1] === valores[i]) j++;
    partes.push(`${i === j ? MESES_CORTO[i] : MESES_CORTO[i] + '–' + MESES_CORTO[j]} ${texto(valores[i])}`);
    i = j + 1;
  }
  return partes.join(' · ');
}
