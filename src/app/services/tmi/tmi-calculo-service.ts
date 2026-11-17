import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { Backend } from '../../model/api';
import {
  TmiCambioConfig, TmiDashboardDatos, TmiFilaCambiada, TmiJustificacion, TmiOrigenDatos, TmiPeriodoCalculo,
  TmiProblemaConfig, TmiResultadoFinal, TmiResumenCambios, TmiTerminoResultado,
} from './tmi-models';
import { mensajeError } from './tmi-error';

// cada recurso tiene su prefijo en el backend TMI (/tmi/calculo, /tmi/justificacion...)
const configuracion_url = Backend.apiTmi + '/configuracion';
const historial_url = Backend.apiTmi + '/historial';
const calculo_url = Backend.apiTmi + '/calculo';
const justificacion_url = Backend.apiTmi + '/justificacion';
const resultado_url = Backend.apiTmi + '/resultado';
const dashboard_url = Backend.apiTmi + '/dashboard';
const excel_url = Backend.apiTmi + '/excel';
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

  validarConfig() { return this.http.get<TmiProblemaConfig[]>(`${configuracion_url}/validar-config`); }
  /** Historial de cambios de la configuración; idIndicador: solo los de ese indicador. */
  getHistorial(idIndicador?: number, limite = 200) {
    const params: Record<string, number> = { limite };
    if (idIndicador != null) params['id_indicador'] = idIndicador;
    return this.http.get<TmiCambioConfig[]>(historial_url, { params });
  }
  /** origen: ACTUAL = TOTALIZADO3 de hoy; BACKUP = la copia del cierre del periodo (como fue). */
  calcular(periodo: string, origen: TmiOrigenDatos = 'ACTUAL') {
    return this.http.post<{ periodo: string; origen: TmiOrigenDatos; puntajes: Record<string, number> }>(
      `${calculo_url}/calcular/${periodo}`, {}, { params: { origen } });
  }
  /** Resultado de cada centro como fue (copia del cierre) y con los datos actuales, con la fórmula desarrollada. */
  getJustificacion(periodo: string, idIndicador: number) {
    return this.http.get<TmiJustificacion>(`${justificacion_url}/${periodo}/${idIndicador}`);
  }
  /** Por indicador: cuántos centros cambiaron entre como fue (cierre) y con los datos de hoy. */
  getResumenCambios(periodo: string) {
    return this.http.get<TmiResumenCambios>(`${justificacion_url}/${periodo}/resumen`);
  }
  /** Valor de cada término (grupo, actividad, servicio) del centro en cada cálculo guardado. */
  getTerminosJustificacion(periodo: string, idIndicador: number, codcentro: number) {
    return this.http.get<TmiTerminoResultado[]>(`${justificacion_url}/${periodo}/${idIndicador}/${codcentro}/terminos`);
  }
  /** Filas de TOTALIZADO3 que cambiaron desde la copia del cierre (codigo: solo ese término). */
  getFilasCambiadas(periodo: string, idIndicador: number, codcentro: number, codigo?: string) {
    const params: Record<string, string> = codigo ? { codigo } : {};
    return this.http.get<TmiFilaCambiada[]>(`${justificacion_url}/${periodo}/${idIndicador}/${codcentro}/filas`, { params });
  }
  getPeriodoCalculo() { return this.http.get<TmiPeriodoCalculo>(`${calculo_url}/periodo-calculo`); }
  /** origen: ACTUAL = calculado con TOTALIZADO3; BACKUP = con TOTALIZADO3_BACKUP (copia del cierre); sin él, el oficial. */
  getResultado(periodo: string, idIndicador: number, origen?: TmiOrigenDatos) {
    const params: Record<string, string> = origen ? { origen } : {};
    return this.http.get<TmiResultadoFinal[]>(`${resultado_url}/${periodo}/${idIndicador}`, { params });
  }
  /** Periodos para el dashboard (ruta pública, sin sesión). origen ACTUAL: solo los que tienen datos actuales. */
  getPeriodosDashboard(origen?: 'ACTUAL') {
    const params = origen ? { origen } : undefined;
    return this.http.get<TmiPeriodoCalculo['periodos']>(`${dashboard_url}/periodos`, { params });
  }
  /** Datos del dashboard del periodo (AAAAMM): con origen ACTUAL, calculado al momento con los datos de hoy; sin él,
   *  el resultado oficial (el guardado del cierre). */
  getDashboard(periodo: string, origen?: 'ACTUAL') {
    const params = origen ? { origen } : undefined;
    return this.http.get<TmiDashboardDatos>(`${dashboard_url}/${periodo}`, { params });
  }
  /** ids: indicadores que lleva el Excel; sin ids, todos. */
  getExcel(periodo: string, calcular: boolean, ids?: number[], origen?: TmiOrigenDatos) {
    const filtro = (ids?.length ? `&indicadores=${ids.join(',')}` : '') + (origen ? `&origen=${origen}` : '');
    return this.http.get(`${excel_url}/${periodo}?calcular=${calcular}${filtro}`, {
      responseType: 'blob',
      observe: 'response' as 'response',
    });
  }
  /** Excel del periodo desde los dashboards (ruta pública): el de Administración con todos los indicadores, con el
   *  resultado oficial o, con origen ACTUAL, calculado con los datos de hoy. Lo descarga y emite el nombre del
   *  archivo; el error trae el detalle. */
  descargarExcelDashboard(periodo: string, origen?: 'ACTUAL'): Observable<string> {
    const params = origen ? { origen } : undefined;
    return this.http.get(`${dashboard_url}/${periodo}/excel`, { responseType: 'blob', observe: 'response', params }).pipe(
      map((resp) => guardarExcel(resp, `TMI_${periodo}.xlsx`)),
      catchError((e) => from(leerErrorExcel(e)).pipe(switchMap((m) => throwError(() => new Error(m))))),
    );
  }
}
