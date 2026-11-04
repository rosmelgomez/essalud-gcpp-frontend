import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { Backend } from '../../model/api';
import { TmiDashboardDatos, TmiPeriodoCalculo, TmiProblemaConfig, TmiResultadoFinal } from './tmi-models';
import { mensajeError } from './tmi-error';

const base_url = Backend.apiTmi + '/dinamico';
const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Guarda en el equipo el Excel de una respuesta blob; devuelve el nombre del archivo. */
export function guardarExcel(resp: HttpResponse<Blob>, porDefecto: string): string {
  const nombre = /filename="?([^";]+)"?/.exec(resp.headers.get('content-disposition') ?? '')?.[1] ?? porDefecto;
  if (resp.body) {
    const url = window.URL.createObjectURL(new Blob([resp.body], { type: TIPO_XLSX }));
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  return nombre;
}

/** La respuesta de error de un Excel llega como Blob: se lee para mostrar el detalle del backend. */
export async function leerErrorExcel(e: any, porDefecto = 'No se pudo generar el Excel del TMI.'): Promise<string> {
  try {
    if (e?.error instanceof Blob) return mensajeError({ error: JSON.parse(await e.error.text()) }, porDefecto);
  } catch { /* se deja el mensaje por defecto */ }
  return mensajeError(e, porDefecto);
}

/** Validación de la configuración, cálculo del periodo, resultados y Excel. */
@Injectable({ providedIn: 'root' })
export class TmiCalculoService {
  constructor(private http: HttpClient) { }

  validarConfig() { return this.http.get<TmiProblemaConfig[]>(`${base_url}/validar-config`); }
  calcular(periodo: string) {
    return this.http.post<{ periodo: string; puntajes: Record<string, number> }>(`${base_url}/calcular/${periodo}`, {});
  }
  getPeriodoCalculo() { return this.http.get<TmiPeriodoCalculo>(`${base_url}/periodo-calculo`); }
  getResultado(periodo: string, idIndicador: number) {
    return this.http.get<TmiResultadoFinal[]>(`${base_url}/resultado/${periodo}/${idIndicador}`);
  }
  /** Periodos con resultado guardado para el dashboard (ruta pública, sin sesión). */
  getPeriodosDashboard() { return this.http.get<TmiPeriodoCalculo['periodos']>(`${base_url}/dashboard/periodos`); }
  /** Datos del dashboard: resultado final guardado del periodo (AAAAMM). */
  getDashboard(periodo: string) { return this.http.get<TmiDashboardDatos>(`${base_url}/dashboard/${periodo}`); }
  /** ids: indicadores que lleva el Excel; sin ids, todos. */
  getExcel(periodo: string, calcular: boolean, ids?: number[]) {
    const filtro = ids?.length ? `&indicadores=${ids.join(',')}` : '';
    return this.http.get(`${base_url}/generar-excel/${periodo}?calcular=${calcular}${filtro}`, {
      responseType: 'blob',
      observe: 'response' as 'response',
    });
  }
  /** Excel del periodo desde los dashboards (ruta pública): el de Administración con todos los indicadores, armado con
   *  el resultado guardado (no recalcula). Lo descarga y emite el nombre del archivo; el error trae el detalle. */
  descargarExcelDashboard(periodo: string): Observable<string> {
    return this.http.get(`${base_url}/dashboard/${periodo}/excel`, { responseType: 'blob', observe: 'response' }).pipe(
      map((resp) => guardarExcel(resp, `TMI_${periodo}.xlsx`)),
      catchError((e) => from(leerErrorExcel(e)).pipe(switchMap((m) => throwError(() => new Error(m))))),
    );
  }
}
