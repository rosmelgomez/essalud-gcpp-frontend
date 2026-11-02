/** Mensaje legible de un error HTTP del backend (detail de FastAPI). */
export function mensajeError(err: any, porDefecto: string): string {
  const d = err?.error?.detail;
  if (!d) return porDefecto;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x: any) => x?.problema ?? (x?.loc ? `${x.loc.slice(-1)[0]}: ${x.msg}` : JSON.stringify(x))).join(' · ');
  }
  if (typeof d === 'object') return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' · ');
  return porDefecto;
}
