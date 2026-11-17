/** Textos y formatos que comparten las pantallas del TMI. */

export const MESES_NOMBRE = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre',
  'Octubre', 'Noviembre', 'Diciembre'];
export const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
/** En minúscula, como en los textos de los dashboards ("setiembre 2026"). */
export const MESES_MIN = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre',
  'noviembre', 'diciembre'];

/** "RED ASISTENCIAL DE LA LIBERTAD" -> "Red Asistencial de la Libertad". */
export const titleCase = (s: string) => s.toLowerCase()
  .replace(/(^|[\s(.-])([a-záéíóúñ])/g, (_m, a, b) => a + b.toUpperCase())
  .replace(/(?<=\s)(De|Del|La|Y)\b/g, (w) => w.toLowerCase());

/** "CONSULTA EXTERNA" -> "Consulta externa"; vacío -> "Otros". */
export const nombreServicio = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Otros');

/** "TASA DE CESÁREAS NIVEL II" -> "Tasa de cesáreas nivel II" (los números romanos quedan en mayúscula). */
export function nombreIndicador(s: string) {
  const t = s.trim().toLowerCase();
  return (t.charAt(0).toUpperCase() + t.slice(1)).replace(/(?<![a-zñáéíóú])(i|ii|iii|iv|v)(?![a-zñáéíóú])/g, (m) => m.toUpperCase());
}

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
