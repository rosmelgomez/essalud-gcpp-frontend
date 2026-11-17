/** Años para los select: desde `desde` hasta el año actual (más `siguientes` años futuros), en orden ascendente.
 *  Se calcula con la fecha del día, así el año nuevo aparece solo. */
export function aniosHasta(desde: number, siguientes = 0): string[] {
  const hasta = new Date().getFullYear() + siguientes;
  return Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => String(desde + i));
}
