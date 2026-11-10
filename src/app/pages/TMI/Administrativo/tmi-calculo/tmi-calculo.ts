import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiIndicadorService, TmiCalculoService, TmiIndicador, TmiResultadoFinal, TmiPeriodoCalculo, TmiProblemaConfig, mensajeError,
  TmiFilaCambiada, TmiJustificacion, TmiJustificacionCentro, TmiOrigenDatos, TmiTerminoResultado,
} from '../../../../services/tmi';

/** Fila de la tabla de términos: el mismo término (grupo, actividad, servicio) como fue y con los datos actuales. */
interface TerminoComparado {
  clave: string;
  codigo: string;
  tipgrupo: number;
  actividad: number;
  servicio: number | null;
  mediana: boolean;
  backup: TmiTerminoResultado | null;
  actual: TmiTerminoResultado | null;
  cambio: boolean;
}


const MESES = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
];

const MOTIVOS: Record<string, string> = {
  SIN_ESTANDAR: 'Sin estándar',
  SIN_DATOS_ANIO: 'Sin datos en el año',
  SIN_DATO: 'Sin dato',
  EXCLUIDO: 'Excluido',
  EXCLUIDO_CERO: 'Excluido (puntaje 0)',
  FUERA_DE_AMBITO: 'Fuera de ámbito',
  NO_VIGENTE_MES: 'No vigente en el mes',
  NO_FUNCIONA: 'No funciona',
};

/** Validar, calcular un periodo (año y mes, hasta el mes anterior), revisar el resultado final guardado y descargar
 *  el Excel del TMI dinámico con los indicadores que elija el usuario. */
@Component({
  selector: 'app-tmi-calculo',
  imports: [FormsModule, MatCardModule, MatIconModule, DecimalPipe],
  templateUrl: './tmi-calculo.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiCalculo implements OnInit {
  private indicadorSrv = inject(TmiIndicadorService);
  private calculoSrv = inject(TmiCalculoService);

  readonly meses = MESES;
  readonly anios = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));
  anio = String(new Date().getFullYear());
  mes = String(new Date().getMonth() === 0 ? 12 : new Date().getMonth()).padStart(2, '0');

  readonly columnasMes = Array.from({ length: 12 }, (_, i) => i);

  indicadores = signal<TmiIndicador[]>([]);
  idIndicador = signal<number | null>(null);
  resultado = signal<TmiResultadoFinal[]>([]);
  estadoPeriodos = signal<TmiPeriodoCalculo | null>(null);
  /** Periodo seleccionado (signal para que los computed reaccionen al cambiar año o mes). */
  periodoSel = signal(this.periodo);
  /** Columnas de la grilla: ORDEN, RED, CÓDIGO, CENTRO, NIVEL, TIPO, ESTÁNDAR, [% ACEPTMENOS en banda], % ACEPT, TOTAL, 12 meses, PUNTAJE, MOTIVO. */
  columnasGrid = computed(() =>
    `60px 230px 70px 240px 60px 90px 90px 80px 80px ${this.esBanda() ? '80px ' : ''}95px repeat(12, 92px) 75px 160px`);
  esBanda = computed(() => (this.indicadores().find((i) => i.id === this.idIndicador())?.sentido ?? '') === 'BANDA');
  /** Último periodo que se puede calcular: el mes anterior al actual (en octubre, septiembre), o el último con datos en
   *  TOTALIZADO3 si ese mes todavía no se cargó (sin datos de octubre, septiembre). La tabla y el Excel abren en él. */
  periodoCalculo = computed(() => {
    const e = this.estadoPeriodos();
    if (!e) return '';
    return e.periodo_datos && e.periodo_datos < e.periodo_calculo ? e.periodo_datos : e.periodo_calculo;
  });
  /** Periodo que eligió el usuario para calcular (año y mes). */
  anioCalc = signal(String(new Date().getFullYear()));
  mesCalc = signal('01');
  periodoCalcSel = computed(() => `${this.anioCalc()}${this.mesCalc()}`);
  /** Solo hasta el mes anterior: un periodo futuro todavía no tiene datos. */
  puedeCalcular = computed(() => !!this.periodoCalculo() && this.periodoCalcSel() <= this.periodoCalculo());
  /** Periodo del último cálculo hecho en esta pantalla (para el resumen de puntajes). */
  periodoCalculado = signal('');
  /** Indicadores que lleva el Excel (por defecto, todos los activos). */
  excelIds = signal<Set<number>>(new Set());
  todosEnExcel = computed(() => this.indicadores().every((i) => this.excelIds().has(i.id!)));
  /** Resultado guardado del periodo elegido en los select (para el Excel) y del periodo que se calcula. */
  guardado = computed(() => this.guardadoDe(this.periodoSel()));
  guardadoCalculo = computed(() => this.guardadoDe(this.periodoCalcSel()));
  filtroRed = signal('');
  filtroPuntaje = signal('');
  resultadoFiltrado = computed(() => {
    const red = this.filtroRed().trim().toLowerCase();
    const p = this.filtroPuntaje();
    return this.resultado().filter(
      (r) => (!red || `${r.red} ${r.centro} ${r.codcentro}`.toLowerCase().includes(red)) && (!p || r.puntaje === p),
    );
  });
  resumen = signal<Record<string, number> | null>(null);
  problemas = signal<TmiProblemaConfig[] | null>(null);

  backupSel = computed(() => this.backupDe(this.periodoSel()));
  /** Resultado que se ve en el punto 2: el calculado con TOTALIZADO3 (ACTUAL) o con TOTALIZADO3_BACKUP (BACKUP).
   *  null = el oficial del periodo; si el periodo no tiene el elegido, también el oficial. */
  origenElegido = signal<TmiOrigenDatos | null>(null);
  origenVer = computed<TmiOrigenDatos>(() => {
    const g = this.guardado();
    const o = this.origenElegido();
    if (o && g?.origenes?.[o]) return o;
    return (g?.origen_datos as TmiOrigenDatos) ?? 'ACTUAL';
  });
  guardadoVer = computed(() => this.guardado()?.origenes?.[this.origenVer()] ?? null);

  // ---------- 3. justificación: como fue (copia del cierre) y con los datos actuales ----------
  justificacion = signal<TmiJustificacion | null>(null);
  soloCambios = signal(false);
  filtroJust = signal('');
  centrosJust = computed(() => {
    const j = this.justificacion();
    if (!j) return [];
    const t = this.filtroJust().trim().toLowerCase();
    return j.centros.filter((c) => (!this.soloCambios() || c.cambio)
      && (!t || `${c.codcentro} ${c.centro ?? ''} ${c.red ?? ''}`.toLowerCase().includes(t)));
  });
  cambiosJust = computed(() => this.justificacion()?.centros.filter((c) => c.cambio).length ?? 0);
  centroJust = signal<TmiJustificacionCentro | null>(null);
  terminos = signal<TmiTerminoResultado[]>([]);
  terminosComparados = computed<TerminoComparado[]>(() => {
    const filas = new Map<string, TerminoComparado>();
    for (const t of this.terminos()) {
      const clave = `${t.codigo}|${t.tipgrupo}|${t.actividad}|${t.servicio ?? ''}`;
      const f = filas.get(clave) ?? {
        clave, codigo: t.codigo, tipgrupo: t.tipgrupo, actividad: t.actividad, servicio: t.servicio,
        mediana: t.mediana, backup: null, actual: null, cambio: false,
      };
      if (t.origen_datos === 'BACKUP') f.backup = t; else f.actual = t;
      filas.set(clave, f);
    }
    const lista = [...filas.values()];
    for (const f of lista) f.cambio = !!f.backup && !!f.actual && (f.backup.valor ?? 0) !== (f.actual.valor ?? 0);
    return lista;
  });
  filasCambiadas = signal<TmiFilaCambiada[] | null>(null);
  codigoFilas = signal('');

  ocupado = signal<'' | 'validar' | 'calcular' | 'excel' | 'resultado' | 'justificacion' | 'detalle'>('');
  error = signal('');
  mensaje = signal('');

  private backupDe(periodo: string) {
    return this.estadoPeriodos()?.backups?.find((b) => String(b.periodo_backup) === periodo) ?? null;
  }

  private guardadoDe(periodo: string) {
    return this.estadoPeriodos()?.periodos.find((p) => String(p.periodo) === periodo) ?? null;
  }

  get periodo(): string {
    return `${this.anio}${this.mes}`;
  }

  nombrePeriodo(periodo: string = this.periodo): string {
    const mes = periodo.slice(4);
    return `${MESES.find((m) => m.value === mes)?.label ?? mes} ${periodo.slice(0, 4)}`;
  }

  /** Valor del mes i (0 = enero): periodo_01..periodo_12 de tmi_resultado_indicador. */
  valorMes(r: TmiResultadoFinal, i: number): number | null {
    return r[`periodo_${String(i + 1).padStart(2, '0')}` as keyof TmiResultadoFinal] as number | null;
  }

  /** Encabezado de la columna de un mes: Enero, Febrero... Diciembre. */
  encabezadoMes(i: number): string {
    return MESES[i].label;
  }

  ngOnInit(): void {
    this.indicadorSrv.getIndicadores().subscribe({
      next: (lista) => {
        const activos = lista.filter((i) => i.activo);
        this.indicadores.set(activos);
        this.excelIds.set(new Set(activos.map((i) => i.id!)));
        if (activos.length && this.idIndicador() == null) this.idIndicador.set(activos[0].id ?? null);
        this.verResultado();
      },
    });
    this.cargarPeriodos(true);
  }

  /** Periodo abierto para cálculo y periodos con resultado guardado. inicial = se posiciona en el periodo abierto. */
  cargarPeriodos(inicial = false): void {
    this.calculoSrv.getPeriodoCalculo().subscribe({
      next: (e) => {
        this.estadoPeriodos.set(e);
        if (inicial) {
          const p = this.periodoCalculo();
          this.anioCalc.set(p.slice(0, 4));
          this.mesCalc.set(p.slice(4));
          this.anio = p.slice(0, 4);
          this.mes = p.slice(4);
          this.cambioPeriodo();
        } else {
          this.verResultado();   // con los resultados guardados al día (el elegido puede ser uno nuevo)
        }
      },
    });
  }

  cambioPeriodo(): void {
    this.periodoSel.set(this.periodo);
    this.limpiarJustificacion();
    this.verResultado();
  }

  private inicio(accion: 'validar' | 'calcular' | 'excel' | 'resultado' | 'justificacion' | 'detalle'): void {
    this.ocupado.set(accion);
    this.error.set('');
    this.mensaje.set('');
  }

  validar(): void {
    this.inicio('validar');
    this.calculoSrv.validarConfig().subscribe({
      next: (p) => {
        this.problemas.set(p);
        this.ocupado.set('');
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo validar la configuración.'));
        this.ocupado.set('');
      },
    });
  }

  /** Calcula el periodo elegido (año y mes) y deja los select del Excel en ese periodo para ver el resultado. */
  calcular(): void {
    const periodo = this.periodoCalcSel();
    // en pantalla se calcula con TOTALIZADO3; el de TOTALIZADO3_BACKUP lo hace el cierre
    const origen: TmiOrigenDatos = 'ACTUAL';
    if (!this.puedeCalcular()) return;
    if (periodo < this.periodoCalculo() && this.guardadoCalculo()?.origenes?.ACTUAL
      && !confirm(`${this.nombrePeriodo(periodo)} ya pasó su fecha de cierre y tiene un resultado guardado.\n`
        + '¿Volver a calcularlo? Se reemplaza el resultado guardado.')) return;
    this.inicio('calcular');
    this.calculoSrv.calcular(periodo, origen).subscribe({
      next: (r) => {
        this.resumen.set(r.puntajes);
        this.periodoCalculado.set(periodo);
        this.problemas.set([]);
        this.mensaje.set(`${this.nombrePeriodo(periodo)} calculado y guardado con los datos de hoy.`);
        this.origenElegido.set('ACTUAL');
        this.ocupado.set('');
        this.anio = periodo.slice(0, 4);
        this.mes = periodo.slice(4);
        this.periodoSel.set(this.periodo);
        this.limpiarJustificacion();
        this.cargarPeriodos();
      },
      error: (e) => {
        if (Array.isArray(e?.error?.detail)) this.problemas.set(e.error.detail);
        this.error.set(mensajeError(e, 'No se pudo calcular el periodo.'));
        this.ocupado.set('');
      },
    });
  }

  /** Nombre del origen de los datos para la pantalla. */
  nombreOrigen(o: TmiOrigenDatos): string {
    return o === 'BACKUP' ? 'con los datos del cierre' : 'con los datos de hoy';
  }

  cambioOrigenVer(o: TmiOrigenDatos): void {
    this.origenElegido.set(o);
    this.verResultado();
  }

  cambioIndicador(id: number): void {
    this.idIndicador.set(id);
    this.limpiarJustificacion();
    this.verResultado();
  }

  limpiarJustificacion(): void {
    this.justificacion.set(null);
    this.centroJust.set(null);
    this.terminos.set([]);
    this.filasCambiadas.set(null);
  }

  /** Resultado de cada centro del indicador como fue y con los datos actuales. */
  verJustificacion(): void {
    const id = this.idIndicador();
    if (id == null) return;
    const centro = this.centroJust()?.codcentro;
    this.inicio('justificacion');
    this.calculoSrv.getJustificacion(this.periodoSel(), id).subscribe({
      next: (j) => {
        this.justificacion.set(j);
        this.ocupado.set('');
        const c = centro == null ? null : j.centros.find((x) => x.codcentro === centro) ?? null;
        if (c) this.abrirCentro(c); else this.centroJust.set(null);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar la justificación.'));
        this.ocupado.set('');
      },
    });
  }

  /** El cálculo que falta para comparar (null = no falta ninguno). */
  faltaOrigen(j: TmiJustificacion): TmiOrigenDatos | null {
    if (j.con_backup && !j.origenes.includes('BACKUP')) return 'BACKUP';
    return j.origenes.includes('ACTUAL') ? null : 'ACTUAL';
  }

  /** Se puede calcular el periodo de la justificación (hasta el último periodo calculable). */
  puedeCalcularSel = computed(() => !!this.periodoCalculo() && this.periodoSel() <= this.periodoCalculo());

  /** Calcula el periodo de la justificación con ese origen y la vuelve a cargar. */
  calcularParaComparar(origen: TmiOrigenDatos): void {
    const periodo = this.periodoSel();
    if (!this.puedeCalcularSel()) return;
    this.inicio('justificacion');
    this.calculoSrv.calcular(periodo, origen).subscribe({
      next: () => {
        this.mensaje.set(`${this.nombrePeriodo(periodo)} calculado ${this.nombreOrigen(origen)}.`);
        this.cargarPeriodos();   // y vuelve a cargar el resultado
        this.verJustificacion();
      },
      error: (e) => {
        if (Array.isArray(e?.error?.detail)) this.problemas.set(e.error.detail);
        this.error.set(mensajeError(e, 'No se pudo calcular el periodo.'));
        this.ocupado.set('');
      },
    });
  }

  /** Detalle de un centro: el valor de cada término de la fórmula en cada cálculo. */
  abrirCentro(c: TmiJustificacionCentro): void {
    const id = this.idIndicador();
    if (id == null) return;
    this.centroJust.set(c);
    this.filasCambiadas.set(null);
    this.terminos.set([]);
    this.inicio('detalle');
    this.calculoSrv.getTerminosJustificacion(this.periodoSel(), id, c.codcentro).subscribe({
      next: (t) => {
        this.terminos.set(t);
        this.ocupado.set('');
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar los términos.'));
        this.ocupado.set('');
      },
    });
  }

  /** Filas de TOTALIZADO3 del centro que cambiaron desde la copia del cierre (codigo: solo ese término). */
  verFilas(codigo = ''): void {
    const id = this.idIndicador();
    const c = this.centroJust();
    if (id == null || !c) return;
    this.codigoFilas.set(codigo);
    this.inicio('detalle');
    this.calculoSrv.getFilasCambiadas(this.periodoSel(), id, c.codcentro, codigo || undefined).subscribe({
      next: (f) => {
        this.filasCambiadas.set(f);
        this.ocupado.set('');
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar las filas que cambiaron.'));
        this.ocupado.set('');
      },
    });
  }

  /** [grupo;actividad#servicio] de un término. */
  textoTermino(t: { tipgrupo: number; actividad: number; servicio: number | null; mediana: boolean }): string {
    const base = `[${t.tipgrupo};${t.actividad}${t.servicio != null ? '#' + t.servicio : ''}]`;
    return t.mediana ? `MEDIANA(${base})` : base;
  }

  diferencia(a: number | null | undefined, b: number | null | undefined): number | null {
    return a == null || b == null ? null : a - b;
  }

  verResultado(): void {
    const id = this.idIndicador();
    if (id == null) return;
    this.inicio('resultado');
    this.calculoSrv.getResultado(this.periodo, id, this.guardado() ? this.origenVer() : undefined).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.ocupado.set('');
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar el resultado.'));
        this.ocupado.set('');
      },
    });
  }

  /** Excel del periodo de los select, armado con su resultado guardado (no recalcula). */
  descargar(): void {
    this.inicio('excel');
    if (!this.excelIds().size) {
      this.error.set('Elija al menos un indicador para el Excel.');
      return;
    }
    const ids = this.todosEnExcel() ? undefined : this.indicadores().filter((i) => this.excelIds().has(i.id!)).map((i) => i.id!);
    this.calculoSrv.getExcel(this.periodo, false, ids, this.origenVer()).subscribe({
      next: (resp) => {
        const blob = resp.body;
        if (blob) {
          const disposicion = resp.headers.get('content-disposition') ?? '';
          const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1] ?? `TMI_${this.periodo}.xlsx`;
          const url = window.URL.createObjectURL(
            new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = nombre;
          link.click();
          window.URL.revokeObjectURL(url);
          this.mensaje.set(`Excel de ${this.nombrePeriodo()} descargado, ${this.origenVer() === 'BACKUP' ? 'con los datos del cierre' : 'con los datos de hoy'}.`);
        }
        this.ocupado.set('');
      },
      error: async (e) => {
        // La respuesta de error llega como Blob: se lee para mostrar el detalle
        let detalle = 'No se pudo generar el Excel del TMI.';
        try {
          if (e?.error instanceof Blob) detalle = mensajeError({ error: JSON.parse(await e.error.text()) }, detalle);
        } catch { /* se deja el mensaje por defecto */ }
        this.error.set(detalle);
        this.ocupado.set('');
      },
    });
  }

  enExcel(id: number, incluir: boolean): void {
    this.excelIds.update((s) => {
      const n = new Set(s);
      if (incluir) n.add(id); else n.delete(id);
      return n;
    });
  }

  marcarExcel(todos: boolean): void {
    this.excelIds.set(new Set(todos ? this.indicadores().map((i) => i.id!) : []));
  }

  fecha(f: string | undefined): string {
    return f ? new Date(f).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '';
  }

  claseP(p: string): string {
    return 'dyn-badge dyn-p' + (p ?? 'NA');
  }

  motivo(m: string | null): string {
    return m ? (MOTIVOS[m] ?? m) : '';
  }

  puntajes(): { clave: string; valor: number }[] {
    const r = this.resumen();
    if (!r) return [];
    return ['5', '3', '1', '0', 'NA'].filter((k) => r[k] != null).map((k) => ({ clave: k, valor: r[k] }));
  }
}
