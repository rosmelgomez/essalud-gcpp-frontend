import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../model/api';

const base_url = Backend.apiTmi + '/dinamico';

export interface TmiVariable {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  total_anual: 'SUMA_MESES' | 'MEDIANA_PERIODO';
  activo: boolean;
  filas_logica?: number;
  indicadores?: string | null;
}

export interface TmiVariableLogica {
  id?: number;
  id_variable: number;
  tipgrupo: number;
  actividad: number;
  servicio: number | null;
  condicion_hoja: string | null;
  agregacion: 'SUMA' | 'MEDIANA';
  periodo_desde: number;
  periodo_hasta: number;
  activo: boolean;
  desctipgrupo?: string;
  descactividad?: string;
  descactividad_corta?: string;
  desclarga?: string;
  Recurso?: number | boolean;
  Proceso?: string;
}

export interface TmiIndicador {
  id?: number;
  grupo: number | null;
  indicador: string;
  codigo: string;
  nombre_hoja: string;
  titulo_hoja: string | null;
  orden: number;
  expr_numerador: string;
  expr_denominador: string;
  tipo_calculo: string;
  factor: number;
  den_cero: 'CERO' | 'NA';
  num_cero_na: boolean;
  cero_si_letra_mes_0: boolean;
  sin_datos_anio: 'MOSTRAR' | 'NA' | 'OCULTAR';
  base_estandar:
  | 'TIPO'
  | 'NIVEL'
  | 'CATEGORIA'
  | 'TIPO_NIVEL'
  | 'TIPO_CATEGORIA'
  | 'NIVEL_CATEGORIA'
  | 'TIPO_NIVEL_CATEGORIA';
  sentido: 'MENOR' | 'MAYOR' | 'BANDA';
  tipo_tolerancia: 'REL' | 'ABS';
  tolerancia: number;
  decimales: number | null;
  cero_es_logro: boolean;
  mostrar_no_aplica: boolean;
  activo: boolean;
  formato: 'NUMERO' | 'PORCENTAJE';   // formato de los valores en el Excel
  grupo_descripcion?: string;
  letras?: string | null;
}

export interface TmiLetra {
  id?: number;
  id_indicador: number;
  letra: string;
  id_variable: number;
  variable?: string;
  total_anual?: string;
  filas_logica?: number;
  detalle_logica?: string | null;
}

export interface TmiAmbito {
  id?: number;
  id_indicador: number;
  red: string | null;
  nivel?: string | null;
  categoria?: string | null;
  tipo: string | null;
  codcentro: number | null;
  incluir: boolean;
  periodo_desde: number;
  periodo_hasta: number;
}

export interface TmiIndicadorEstandar {
  id?: number;
  id_indicador: number;
  nivel: string | null;
  categoria: string | null;
  tipo: string | null;
  periodo_desde: number;
  periodo_hasta: number;
  estandar: number;
  acept?: number | null;
  acept_mas?: number | null;
  activo: boolean;
}

export interface TmiCentroEstandar {
  id?: number;
  codcentro: string;
  id_indicador: number;
  anio: number;
  aplica: boolean;
  est_01: number | null; est_02: number | null; est_03: number | null; est_04: number | null;
  est_05: number | null; est_06: number | null; est_07: number | null; est_08: number | null;
  est_09: number | null; est_10: number | null; est_11: number | null; est_12: number | null;
  acept: number | null;
  sustento: string | null;
  indicador?: string;
  centro?: string;
  red?: string;
}

export interface TmiCatalogo {
  id: number;
  descripcion: string;
  tipgrupo?: number;
  desctipgrupo?: string;
  Visible?: number | boolean;
  actividad?: number;
  descactividad?: string;
  Recurso?: number | boolean;
  recurso?: number | boolean;
  desclarga?: string;
  Proceso?: string;
  [k: string]: any;
}
export interface TmiCentroCatalogo {
  codcentro: number;
  centro: string;
  red: string;
  tipo: string;
  nivel: string;
  categoria?: string;
}
export interface TmiProblemaConfig { id_indicador: number | null; elemento: string; problema: string; }

/** Fila de tmi_resultado_indicador: resultado final del indicador guardado en el periodo de cálculo. */
export interface TmiResultadoFinal {
  periodo: number;
  anio: number;
  id_indicador: number;
  orden: number | null;
  orden_red: number | null;
  red: string | null;
  codcentro: number;
  centro: string | null;
  nivel: string | null;
  tipo: string | null;
  categoria: string | null;
  estandar: number | null;
  acept: number | null;
  acept_mas: number | null;
  total: number | null;
  periodo_01: number | null; periodo_02: number | null; periodo_03: number | null; periodo_04: number | null;
  periodo_05: number | null; periodo_06: number | null; periodo_07: number | null; periodo_08: number | null;
  periodo_09: number | null; periodo_10: number | null; periodo_11: number | null; periodo_12: number | null;
  puntaje: string;
  motivo_na: string | null;
  visible: boolean;
  fecha_calculo: string;
}

export interface TmiPeriodoCalculo {
  periodo_calculo: string;          // único periodo que se puede calcular (mes anterior)
  solo_periodo_anterior: boolean;
  periodos: { periodo: number; indicadores: number; centros: number; fecha_calculo: string }[];
}

@Injectable({ providedIn: 'root' })
export class TmiDinamicoService {
  constructor(private http: HttpClient) { }

  // catálogos
  getGrupos() { 
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/grupos`); 
  }
  getGruposReporte() { 
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/grupos-reporte`); 
  }
  getActividades() { 
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/actividades`); 
  }
  getServicios(tipgrupo: number, actividad: number) {
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/servicios/${tipgrupo}/${actividad}`);
  }
  getTiposCalculo() { 
    return this.http.get<{ codigo: string; descripcion: string }[]>(`${base_url}/catalogo/tipos-calculo`); 
  }
  getCentros() { 
    return this.http.get<TmiCentroCatalogo[]>(`${base_url}/catalogo/centros`); }

  // variables y su lógica
  getVariables() { return this.http.get<TmiVariable[]>(`${base_url}/variables`); }
  postVariable(dto: TmiVariable) { return this.http.post<{ id: number }>(`${base_url}/variables`, dto); }
  putVariable(id: number, dto: TmiVariable) { return this.http.put(`${base_url}/variables/${id}`, dto); }
  deleteVariable(id: number) { return this.http.delete(`${base_url}/variables/${id}`); }
  getLogica(idVariable: number) { return this.http.get<TmiVariableLogica[]>(`${base_url}/variables/${idVariable}/logica`); }
  postLogica(dto: TmiVariableLogica) { return this.http.post(`${base_url}/logica`, dto); }
  putLogica(id: number, dto: TmiVariableLogica) { return this.http.put(`${base_url}/logica/${id}`, dto); }
  deleteLogica(id: number) { return this.http.delete(`${base_url}/logica/${id}`); }

  // indicadores, letras y ámbito
  getIndicadores() { return this.http.get<TmiIndicador[]>(`${base_url}/indicadores`); }
  postIndicador(dto: TmiIndicador) { return this.http.post<{ id: number }>(`${base_url}/indicadores`, dto); }
  putIndicador(id: number, dto: TmiIndicador) { return this.http.put(`${base_url}/indicadores/${id}`, dto); }
  deleteIndicador(id: number) { return this.http.delete(`${base_url}/indicadores/${id}`); }
  getLetras(idIndicador: number) { return this.http.get<TmiLetra[]>(`${base_url}/indicadores/${idIndicador}/letras`); }
  postLetra(dto: TmiLetra) { return this.http.post(`${base_url}/letras`, dto); }
  deleteLetra(id: number) { return this.http.delete(`${base_url}/letras/${id}`); }
  getAmbito(idIndicador: number) { return this.http.get<TmiAmbito[]>(`${base_url}/indicadores/${idIndicador}/ambito`); }
  postAmbito(dto: TmiAmbito) { return this.http.post(`${base_url}/ambito`, dto); }
  deleteAmbito(id: number) { return this.http.delete(`${base_url}/ambito/${id}`); }
  getIndicadorEstandares(idIndicador: number) {
    return this.http.get<TmiIndicadorEstandar[]>(`${base_url}/indicadores/${idIndicador}/estandares`);
  }
  postIndicadorEstandar(dto: TmiIndicadorEstandar) {
    return this.http.post(`${base_url}/indicador-estandar`, dto);
  }
  putIndicadorEstandar(id: number, dto: TmiIndicadorEstandar) {
    return this.http.put(`${base_url}/indicador-estandar/${id}`, dto);
  }
  deleteIndicadorEstandar(id: number) {
    return this.http.delete(`${base_url}/indicador-estandar/${id}`);
  }

  // estándares específicos de centro
  getCentroEstandar(anio: number) { return this.http.get<TmiCentroEstandar[]>(`${base_url}/centro-estandar/${anio}`); }
  postCentroEstandar(dto: TmiCentroEstandar) { return this.http.post(`${base_url}/centro-estandar`, dto); }
  putCentroEstandar(id: number, dto: TmiCentroEstandar) { return this.http.put(`${base_url}/centro-estandar/${id}`, dto); }
  deleteCentroEstandar(id: number) { return this.http.delete(`${base_url}/centro-estandar/${id}`); }

  // ejecución, validación, cálculo y Excel
  ejecutarSql() { return this.http.post<Record<string, string>>(`${base_url}/ejecutar-sql`, {}); }
  validarConfig() { return this.http.get<TmiProblemaConfig[]>(`${base_url}/validar-config`); }
  calcular(periodo: string) {
    return this.http.post<{ periodo: string; puntajes: Record<string, number> }>(`${base_url}/calcular/${periodo}`, {});
  }
  getPeriodoCalculo() { return this.http.get<TmiPeriodoCalculo>(`${base_url}/periodo-calculo`); }
  getResultado(periodo: string, idIndicador: number) {
    return this.http.get<TmiResultadoFinal[]>(`${base_url}/resultado/${periodo}/${idIndicador}`);
  }
  getExcel(periodo: string, calcular: boolean) {
    return this.http.get(`${base_url}/generar-excel/${periodo}?calcular=${calcular}`, {
      responseType: 'blob',
      observe: 'response' as 'response',
    });
  }
}

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
