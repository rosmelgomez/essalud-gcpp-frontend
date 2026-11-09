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
  /** Regla de nulos de la fórmula. Letra sin dato en el mes: CERO = vale 0 | NA = el mes queda NA. */
  si_variable_nula: TmiReglaNulo;
  /** División entre 0 (divisor 0 o sin dato): NA = el mes queda NA | CERO = resultado 0. */
  si_division_cero: TmiReglaNulo;
  grupo_descripcion?: string;
}

/** Regla de nulos de un indicador: CERO + CERO = ISNULL(ISNULL(A,0) / NULLIF(ISNULL(B,0),0), 0). */
export type TmiReglaNulo = 'CERO' | 'NA';

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

/** Estándar de un indicador en una clave de su base_estandar (lo único que usa el cálculo). */
export interface TmiEstandarPeriodoClave {
  orden: number | null;
  fuente: 'NIVEL' | 'TIPO' | 'CATEGORIA';
  clave: string;
  descripcion: string | null;
  prioridad: number;
  /** Estándar fijo del año: los meses lo toman al llegar su fecha de cierre. */
  fijo: number | null;
  /** Valor propio del mes (solo existe si el mes ya cerró). */
  mes: number | null;
  centros: number;
}

/** Indicador con sus estándares para un periodo, solo en las claves de su base_estandar. */
export interface TmiEstandarPeriodo {
  id: number;
  orden: number;
  codigo: string;
  indicador: string;
  grupo: string | null;
  base_estandar: string;
  base_descripcion: string | null;
  formato: 'NUMERO' | 'PORCENTAJE';
  mes_cerrado: boolean;
  claves: TmiEstandarPeriodoClave[];
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
  nivel_estandar?: string | null;
  categoria?: string;
}
export interface TmiProblemaConfig { id_indicador: number | null; elemento: string; problema: string; }
/** Aviso que no bloquea el cálculo: centros que quedarían NA por falta de estándar o de % Acept en el periodo. */
export interface TmiAvisoConfig { id_indicador: number; elemento: string; indicador: string; centros: number; aviso: string; }

/** Cambio de la configuración (tmi_config_historial): quién, cuándo y cada campo antes y después. */
export interface TmiCambioConfig {
  id: number;
  fecha: string;
  usuario: string | null;
  tabla: string;
  que: string;
  id_registro: number | null;
  id_indicador: number | null;
  codigo: string | null;
  indicador: string | null;
  accion: 'ALTA' | 'CAMBIO' | 'BAJA';
  accion_texto: string;
  cambios: { campo: string; antes: string | number | null; despues: string | number | null }[];
}

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
  nivel: string | null;            // nivel del centro (I, II, III)
  nivel_estandar?: string | null;  // clave con la que se unió al estándar (solo informativo)
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
  /** Último periodo con datos en TOTALIZADO3 hasta periodo_calculo (null = ninguno en el último año). */
  periodo_datos?: string | null;
  solo_periodo_anterior: boolean;
  periodos: { periodo: number; indicadores: number; centros: number; fecha_calculo: string }[];
}

/** Fila de la tabla cierre: ejecución del cierre de un periodo. */
export interface TmiCierre {
  id: number;
  periodo: string;
  fecha_cierre: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'EJECUTADO' | 'ERROR';
  fecha_ejecucion: string | null;
  filas_insertadas: number | null;
  mensaje: string | null;
  usuario_modifica: string | null;
  fecha_calculo: string | null;
  indicadores_calculados: number | null;
  centros_calculados: number | null;
}

/** Periodo del calendario de cierre: su día propio (null = el general), su fecha de cierre y el estado de su cierre. */
export interface TmiCalendarioMes {
  mes: number;
  periodo: string;
  dia: number | null;
  fecha_cierre: string;
  estado: TmiCierre['estado'] | null;
  bloqueado: boolean;
}

/** Calendario de cierre de un año: día general y día de cada periodo (el periodo se cierra el mes siguiente). */
export interface TmiCalendarioCierre {
  anio: number;
  dia_fijo: number;
  fecha_modificacion: string | null;
  usuario_modifica: string | null;
  meses: TmiCalendarioMes[];
}

/** Dashboard del TMI (GET /dinamico/dashboard/{periodo}): resultado final del periodo con los puntajes del Excel. */
export interface TmiDashIndicador {
  id: number;
  codigo: string;
  nombre: string;
  servicio: string;
  sentido: 'MENOR' | 'MAYOR' | 'BANDA' | null;
  formato: 'NUMERO' | 'PORCENTAJE' | null;
  /** ACUMULADO: valor de enero al mes; MENSUAL: valor del mes solo. */
  tipo_calculo?: 'ACUMULADO' | 'MENSUAL';
  nacional: number | null;   // promedio de las redes sin las redes APP (1 a 5)
}
/** Valor del centro en un indicador (null en el arreglo si el indicador no aplica). */
export interface TmiDashDetalle {
  p: number | null;          // puntaje 5, 3, 1 o 0
  v: number;                 // valor real acumulado
  e: number | null;          // estándar
  acept: number | null;
  aceptmenos: number | null;
  m: (number | null)[];      // valor acumulado de Ene..mes
}
export interface TmiDashRed {
  nombre: string;
  instituto: boolean;
  app: boolean;
  pts: (number | null)[];    // puntaje por indicador (en el orden de indicadores); null = NA
  nota: number;              // sobre 20
  mensual: number[];         // nota de Ene..mes
}
export interface TmiDashCentro {
  cod: number;
  nombre: string;
  red: string;
  nivel: string | null;
  /** tmi_centro.tipo (catálogo tipo_centro) */
  tipo: string | null;
  /** tmi_centro.categoria (catálogo categoria_centro) */
  categoria?: string | null;
  pts: (number | null)[];
  nota: number;
  mensual: number[];
  det: (TmiDashDetalle | null)[];
}
/** Elemento de un catálogo de centro (nivel_centro, tipo_centro, categoria_centro): codigo = valor en tmi_centro. */
export interface TmiCatalogoCentroItem {
  codigo: string;
  descripcion: string | null;
  orden: number | null;
}
/** Catálogos del centro: niveles = nivel de atención (I, II, III, tmi_nivel_centro); niveles_estandar y tipos unen el
 *  centro con los estándares (tmi_nivel_estandar_centro, tmi_tipo_centro). La categoría no tiene catálogo. */
export interface TmiCatalogosCentro {
  niveles: TmiCatalogoCentroItem[];
  niveles_estandar?: TmiCatalogoCentroItem[];
  tipos: TmiCatalogoCentroItem[];
}
export interface TmiDashboardDatos {
  periodo: string;
  anio: number;
  mes: number;
  fecha_calculo: string | null;
  indicadores: TmiDashIndicador[];
  redes: TmiDashRed[];
  centros: TmiDashCentro[];
  /** Nombres y orden de nivel y tipo (catálogos de centro). */
  catalogos?: TmiCatalogosCentro;
}
