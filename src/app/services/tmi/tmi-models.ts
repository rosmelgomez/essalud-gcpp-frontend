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
