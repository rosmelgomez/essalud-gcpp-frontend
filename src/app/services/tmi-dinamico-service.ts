import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Backend } from '../model/api';

const base_url = Backend.apiTmi + '/dinamico';

/** Componente de una variable compuesta: la variable suma el valor de otra. */
export interface TmiVariableComponente {
  id?: number;
  id_variable: number;
  id_variable_componente: number;
  activo?: boolean;
  componente?: string;
  componente_activo?: boolean;
  agregacion?: 'SUMA' | 'MEDIANA';
  filas_logica?: number;
  componentes?: number;
}

export interface TmiVariable {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  agregacion: 'SUMA' | 'MEDIANA';   // cálculo de la variable: todos sus conjuntos se combinan con OR
  total_anual: 'SUMA_MESES' | 'MEDIANA_PERIODO';
  activo: boolean;
  filas_logica?: number;
  componentes?: number;   // variables que suma (variable compuesta)
  indicadores?: string | null;
}

export interface TmiVariableLogica {
  id?: number;
  id_variable: number;
  tipgrupo: number;
  actividad: number;
  servicio: number | null;
  condicion_hoja: string | null;
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
  /** Fórmula del usuario con letras: (A - B) / C; cada letra es una variable (getLetras). Se guarda con putFormula. */
  formula_alias?: string | null;
  /** Fórmula interna con términos de TOTALIZADO3 ([3;50#0] - [3;49#0]) / [3;47#0], generada desde formula_alias. */
  formula?: string | null;
  tipo_calculo: string;
  sin_datos_anio: 'MOSTRAR' | 'NA' | 'OCULTAR';
  base_estandar: string;   // tmi_tipo_estandar.codigo: NIVEL, NIVEL_TIPO, TIPO, CATEGORIA...
  sentido: 'MENOR' | 'MAYOR' | 'BANDA';
  tipo_tolerancia: 'REL' | 'ABS';   // % Acept: REL = % del estándar | ABS = puntos
  tolerancia: number;
  tolerancia_menos?: number | null; // banda: hacia abajo (null = el mismo que hacia arriba)
  decimales: number | null;
  cero_es_logro: boolean;
  mostrar_no_aplica: boolean;
  activo: boolean;
  formato: 'NUMERO' | 'PORCENTAJE';   // formato de los valores en el Excel
  grupo_descripcion?: string;
}

/** Tabla maestra: tipo de estándar con el que se evalúa un indicador. */
export interface TmiTipoEstandar {
  id?: number;
  codigo: string;
  descripcion: string;
  orden: number | null;
  activo: boolean;
  claves?: number;
  indicadores?: string | null;
}

/** Tabla maestra: clave de un tipo de estándar (valor del centro y tabla de donde sale el estándar). */
export interface TmiEstandarClave {
  id?: number;
  tipo_estandar: string;
  orden: number | null;
  fuente: 'NIVEL' | 'TIPO' | 'CATEGORIA';
  clave: string;
  descripcion: string | null;
  prioridad: number;
  activo: boolean;
  centros?: number;
}

/** Estándar por mes de un indicador en una clave de su tipo de estándar. */
export interface TmiValorEstandar {
  id_clave: number;
  orden: number | null;
  fuente: TmiEstandarClave['fuente'];
  clave: string;
  descripcion: string | null;
  prioridad: number;
  activo: boolean;
  centros: number;
  [mes: `est_${string}`]: number | null;
}

/** % Acept de un indicador: su porcentaje y el estándar del mes de cada clave (el % Acept se calcula). */
export interface TmiAceptacionIndicador {
  id: number;
  orden: number;
  codigo: string;
  indicador: string;
  grupo: string | null;
  base_estandar: string;
  sentido: 'MENOR' | 'MAYOR' | 'BANDA';
  formato: 'NUMERO' | 'PORCENTAJE';
  tipo_tolerancia: 'REL' | 'ABS';
  tolerancia: number;
  tolerancia_menos: number | null;
  /** % Acept fijo del año: cada mes lo toma en su fecha de cierre. */
  tolerancia_fijo: number | null;
  tolerancia_menos_fijo: number | null;
  /** El mes ya alcanzó su fecha de cierre: tiene su propio valor (tomado del fijo), que se puede modificar. */
  mes_cerrado: boolean;
  varia_en_anio?: boolean;
  claves: { orden: number | null; fuente: string; clave: string; descripcion: string | null; estandar: number | null }[];
}

/** Término de la fórmula de un indicador: [grupo;actividad#servicios] o MEDIANA([..]), con sus descripciones. */
export interface TmiTerminoFormula {
  codigo: string;   // T1, T2...
  texto: string;
  tipgrupo: number;
  grupo: string | null;
  actividad: number;
  descactividad: string | null;
  servicios: { servicio: number; descservicio: string | null }[];   // vacío = todos
  mediana: boolean;
  problema: string | null;
}

export interface TmiAnalisisFormula {
  formula_alias: string;
  formula: string;   // términos de TOTALIZADO3
  formula_sql: string;
  variables: { letra: string; id_variable: number; nombre: string; agregacion: string; expresion: string;
               aviso: string | null; usada: boolean }[];
  terminos: TmiTerminoFormula[];
}

/** Resultado del query automático: valor de la fórmula por centro y mes ('01'..'12'), directo de TOTALIZADO3. */
export interface TmiResultadoDirecto {
  sql: string;
  filas: ({ codcentro: number; centro: string | null; total: number | null } & Record<string, number | string | null>)[];
}

/** Letra (alias) de la fórmula de un indicador: una variable por letra. */
export interface TmiLetra {
  id?: number;
  id_indicador?: number;
  letra: string;
  id_variable: number;
  variable?: string;
  agregacion?: string;
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
  aceptmenos?: number | null;
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
  /** % Acept del indicador en el periodo de la consulta: se usa si el centro no tiene uno propio. */
  acept_defecto?: number | null;
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
/** Combinación válida grupo -> actividad -> servicio (DIM_GRUPOACTIVIDADSERVICIO, sin las desactivadas). */
export interface TmiGrupoActividadServicio {
  tipgrupo: number;
  desctipgrupo: string | null;
  actividad: number;
  descactividad: string | null;
  proceso: string | null;
  recurso: number | boolean | null;
  servicio: number;
  descservicio: string | null;
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
  aceptmenos: number | null;
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

  private relacionGas$?: Observable<TmiGrupoActividadServicio[]>;
  /** Relación grupo -> actividad -> servicio; se pide una sola vez y la comparten los formularios. */
  getGrupoActividadServicio() {
    this.relacionGas$ ??= this.http
      .get<TmiGrupoActividadServicio[]>(`${base_url}/catalogo/grupo-actividad-servicio`)
      .pipe(shareReplay(1));
    return this.relacionGas$;
  }

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
  getComponentes(idVariable: number) {
    return this.http.get<TmiVariableComponente[]>(`${base_url}/variables/${idVariable}/componentes`);
  }
  postComponente(dto: TmiVariableComponente) { return this.http.post(`${base_url}/componentes`, dto); }
  deleteComponente(id: number) { return this.http.delete(`${base_url}/componentes/${id}`); }
  getLogica(idVariable: number) { return this.http.get<TmiVariableLogica[]>(`${base_url}/variables/${idVariable}/logica`); }
  postLogica(dto: TmiVariableLogica) { return this.http.post(`${base_url}/logica`, dto); }
  putLogica(id: number, dto: TmiVariableLogica) { return this.http.put(`${base_url}/logica/${id}`, dto); }
  deleteLogica(id: number) { return this.http.delete(`${base_url}/logica/${id}`); }

  // indicadores, letras y ámbito
  getIndicadores() { return this.http.get<TmiIndicador[]>(`${base_url}/indicadores`); }
  postIndicador(dto: TmiIndicador) { return this.http.post<{ id: number }>(`${base_url}/indicadores`, dto); }
  putIndicador(id: number, dto: TmiIndicador) { return this.http.put(`${base_url}/indicadores/${id}`, dto); }
  deleteIndicador(id: number) { return this.http.delete(`${base_url}/indicadores/${id}`); }
  // tablas maestras de estándares
  getTiposEstandar() { return this.http.get<TmiTipoEstandar[]>(`${base_url}/tipos-estandar`); }
  postTipoEstandar(dto: TmiTipoEstandar) { return this.http.post<{ id: number }>(`${base_url}/tipos-estandar`, dto); }
  putTipoEstandar(id: number, dto: TmiTipoEstandar) { return this.http.put(`${base_url}/tipos-estandar/${id}`, dto); }
  deleteTipoEstandar(id: number) { return this.http.delete(`${base_url}/tipos-estandar/${id}`); }
  getEstandarClaves() { return this.http.get<TmiEstandarClave[]>(`${base_url}/estandar-claves`); }
  postEstandarClave(dto: TmiEstandarClave) { return this.http.post<{ id: number }>(`${base_url}/estandar-claves`, dto); }
  putEstandarClave(id: number, dto: TmiEstandarClave) { return this.http.put(`${base_url}/estandar-claves/${id}`, dto); }
  deleteEstandarClave(id: number) { return this.http.delete(`${base_url}/estandar-claves/${id}`); }
  getValoresEstandar(idIndicador: number, anio: number) {
    return this.http.get<TmiValorEstandar[]>(`${base_url}/indicadores/${idIndicador}/valores-estandar/${anio}`);
  }
  putValorEstandar(idIndicador: number, dto: { anio: number; fuente: string; clave: string; [mes: string]: any }) {
    return this.http.put(`${base_url}/indicadores/${idIndicador}/valores-estandar`, dto);
  }

  // % Acept: porcentaje de cada indicador (el % Acept se calcula con el estándar)
  getAceptacion(anio: number, mes: number) {
    return this.http.get<TmiAceptacionIndicador[]>(`${base_url}/aceptacion/${anio}/${mes}`);
  }
  putTolerancia(
    idIndicador: number,
    dto: {
      tipo_tolerancia: 'REL' | 'ABS';
      tolerancia: number;
      tolerancia_menos: number | null;
      tolerancia_fijo?: number | null;
      tolerancia_menos_fijo?: number | null;
      anio?: number;
      mes?: number;
    },
  ) {
    return this.http.put(`${base_url}/indicadores/${idIndicador}/tolerancia`, dto);
  }

  /** Guarda la fórmula con letras ((A - B) / C) y la variable de cada letra: el backend genera la fórmula interna. */
  putFormula(idIndicador: number, formula_alias: string, variables: Record<string, number>) {
    return this.http.put<TmiAnalisisFormula>(`${base_url}/indicadores/${idIndicador}/formula`, { formula_alias, variables });
  }
  analizarFormula(formula_alias: string, variables: Record<string, number>) {
    return this.http.post<TmiAnalisisFormula>(`${base_url}/formula/analizar`, { formula_alias, variables });
  }
  /** Calcula el indicador con el query automático sobre TOTALIZADO3 (sin estándares ni exclusiones). */
  getResultadoDirecto(idIndicador: number, periodo: number) {
    return this.http.get<TmiResultadoDirecto>(`${base_url}/indicadores/${idIndicador}/resultado-directo/${periodo}`);
  }
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

  // validación, cálculo y Excel
  validarConfig() { return this.http.get<TmiProblemaConfig[]>(`${base_url}/validar-config`); }
  calcular(periodo: string) {
    return this.http.post<{ periodo: string; puntajes: Record<string, number> }>(`${base_url}/calcular/${periodo}`, {});
  }
  getPeriodoCalculo() { return this.http.get<TmiPeriodoCalculo>(`${base_url}/periodo-calculo`); }
  getResultado(periodo: string, idIndicador: number) {
    return this.http.get<TmiResultadoFinal[]>(`${base_url}/resultado/${periodo}/${idIndicador}`);
  }
  /** ids: indicadores que lleva el Excel; sin ids, todos. */
  getExcel(periodo: string, calcular: boolean, ids?: number[]) {
    const filtro = ids?.length ? `&indicadores=${ids.join(',')}` : '';
    return this.http.get(`${base_url}/generar-excel/${periodo}?calcular=${calcular}${filtro}`, {
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
