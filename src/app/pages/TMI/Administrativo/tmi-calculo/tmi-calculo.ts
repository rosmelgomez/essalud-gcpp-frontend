import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  TmiIndicadorService, TmiCalculoService, TmiIndicador, TmiResultadoFinal, TmiPeriodoCalculo, TmiProblemaConfig, mensajeError,
  TmiFilaCambiada, TmiLetra, TmiJustificacion, TmiJustificacionCentro, TmiOrigenDatos, TmiResumenCambios, TmiTerminoResultado,
} from '../../../../services/tmi';

/** Una letra de la fórmula leída: su variable y los términos [grupo;actividad#servicio] que suma, con sus nombres. */
interface LetraLeida {
  letra: string;
  variable: string;
  partes: { termino: string; grupo: string; actividad: string; servicio: string }[];
}

/** detalle_logica de la letra ("1·Consulta Externa / 3·Consultas (Serv: Todos) | ...") en términos con sus nombres. */
function leerLetra(l: TmiLetra): LetraLeida {
  const partes = (l.detalle_logica ?? '').split(' | ').filter((x) => x.trim()).map((x) => {
    const m = /^(\d+)·(.*?) \/ (\d+)·(.*) \(Serv: (.+)\)$/.exec(x.trim());
    if (!m) return { termino: x.trim(), grupo: '', actividad: '', servicio: '' };
    const todos = m[5] === 'Todos';
    return {
      termino: `[${m[1]};${m[3]}${todos ? '' : '#' + m[5]}]`,
      grupo: `${m[1]} ${m[2]}`.trim(),
      actividad: `${m[3]} ${m[4]}`.trim(),
      servicio: todos ? 'todos los servicios' : 'servicio ' + m[5],
    };
  });
  return { letra: l.letra, variable: l.variable ?? '', partes };
}

/** Textos del paginador en español. */
function paginadorEs(): MatPaginatorIntl {
  const p = new MatPaginatorIntl();
  p.itemsPerPageLabel = 'Registros por página';
  p.firstPageLabel = 'Primera página';
  p.lastPageLabel = 'Última página';
  p.nextPageLabel = 'Página siguiente';
  p.previousPageLabel = 'Página anterior';
  p.getRangeLabel = (page, size, total) => {
    if (!total || !size) return `0 de ${total}`;
    const desde = page * size;
    return `${desde + 1} – ${Math.min(desde + size, total)} de ${total}`;
  };
  return p;
}

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

/** Calcular en tiempo real: el usuario elige el año, el mes y los datos (TOTALIZADO3 de hoy o la copia del cierre,
 *  TOTALIZADO3_BACKUP). Con esa misma elección se ve el resultado por indicador, se descarga el Excel y se revisa la
 *  justificación. Nada se guarda: el cierre de cada mes solo guarda la copia de los datos. */
@Component({
  selector: 'app-tmi-calculo',
  imports: [FormsModule, MatCardModule, MatIconModule, MatPaginatorModule, DecimalPipe],
  providers: [{ provide: MatPaginatorIntl, useFactory: paginadorEs }],
  templateUrl: './tmi-calculo.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiCalculo implements OnInit {
  private indicadorSrv = inject(TmiIndicadorService);
  private calculoSrv = inject(TmiCalculoService);

  readonly meses = MESES;
  readonly anios = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));
  readonly columnasMes = Array.from({ length: 12 }, (_, i) => i);

  // ---------- 1. elección del usuario: año, mes y datos ----------
  anioSel = signal(String(new Date().getFullYear()));
  mesSel = signal('01');
  origenSel = signal<TmiOrigenDatos>('ACTUAL');
  periodoSel = computed(() => `${this.anioSel()}${this.mesSel()}`);
  /** Clave de la elección: el resultado de la tabla y el Excel son de un cálculo hecho con esta misma elección. */
  private claveSel = computed(() => `${this.periodoSel()}|${this.origenSel()}`);
  /** Elección con la que se calculó lo que se ve (vacío = todavía no se calcula en esta pantalla). */
  calculado = signal('');
  hayCalculo = computed(() => this.calculado() === this.claveSel());

  indicadores = signal<TmiIndicador[]>([]);
  idIndicador = signal<number | null>(null);
  resultado = signal<TmiResultadoFinal[]>([]);
  estadoPeriodos = signal<TmiPeriodoCalculo | null>(null);
  /** Columnas de la grilla: ORDEN, RED, CÓDIGO, CENTRO, NIVEL, TIPO, ESTÁNDAR, [% ACEPTMENOS en banda], % ACEPT, TOTAL, 12 meses, PUNTAJE, MOTIVO. */
  columnasGrid = computed(() =>
    `60px 230px 70px 240px 60px 90px 90px 80px 80px ${this.esBanda() ? '80px ' : ''}95px repeat(12, 92px) 75px 160px`);
  esBanda = computed(() => (this.indicadores().find((i) => i.id === this.idIndicador())?.sentido ?? '') === 'BANDA');
  /** Último periodo con los datos de hoy: el mes anterior al actual, o el último con datos en TOTALIZADO3 si ese mes
   *  todavía no se cargó. */
  periodoCalculo = computed(() => {
    const e = this.estadoPeriodos();
    if (!e) return '';
    return e.periodo_datos && e.periodo_datos < e.periodo_calculo ? e.periodo_datos : e.periodo_calculo;
  });
  /** Copia del cierre del periodo elegido (TOTALIZADO3_BACKUP), si existe. */
  backupSel = computed(() => this.estadoPeriodos()?.backups?.find((b) => String(b.periodo_backup) === this.periodoSel()) ?? null);
  /** Se puede calcular la elección: con los datos de hoy hasta el último periodo con datos; con los del cierre, si
   *  el periodo tiene su copia. */
  puedeCalcular = computed(() => this.origenSel() === 'BACKUP'
    ? !!this.backupSel()
    : !!this.periodoCalculo() && this.periodoSel() <= this.periodoCalculo());
  /** Por qué no se puede calcular la elección ('' = sí se puede). */
  motivoNoCalcular = computed(() => {
    if (this.puedeCalcular()) return '';
    const p = this.nombrePeriodo(this.periodoSel());
    if (this.origenSel() === 'BACKUP') return `${p} todavía no tiene datos históricos. Se guardan al cerrar el mes.`;
    if (!this.periodoCalculo()) return 'Cargando los periodos...';
    const e = this.estadoPeriodos();
    return `Con datos actuales se puede calcular hasta ${this.nombrePeriodo(this.periodoCalculo())}`
      + (e && this.periodoCalculo() !== e.periodo_calculo ? `. Los datos de ${this.nombrePeriodo(e.periodo_calculo)} todavía no llegan.` : '.');
  });

  /** Indicadores que lleva el Excel (por defecto, todos los activos). */
  excelIds = signal<Set<number>>(new Set());
  todosEnExcel = computed(() => this.indicadores().every((i) => this.excelIds().has(i.id!)));
  filtroRed = signal('');
  filtroPuntaje = signal('');
  resultadoFiltrado = computed(() => {
    const red = this.filtroRed().trim().toLowerCase();
    const p = this.filtroPuntaje();
    return this.resultado().filter(
      (r) => (!red || `${r.red} ${r.centro} ${r.codcentro}`.toLowerCase().includes(red)) && (!p || r.puntaje === p),
    );
  });
  problemas = signal<TmiProblemaConfig[] | null>(null);

  // ---------- 3. justificación: con los datos del cierre y con los datos de hoy ----------
  justificacion = signal<TmiJustificacion | null>(null);
  /** Cómo se lee la fórmula del indicador elegido: cada letra con su variable y sus términos entre corchetes. */
  letrasLeidas = signal<LetraLeida[]>([]);
  private letrasCache = new Map<number, LetraLeida[]>();
  private cargaLetras = effect(() => {
    const id = this.idIndicador();
    untracked(() => {
      if (id == null) { this.letrasLeidas.set([]); return; }
      const guardadas = this.letrasCache.get(id);
      if (guardadas) { this.letrasLeidas.set(guardadas); return; }
      this.letrasLeidas.set([]);
      this.indicadorSrv.getLetras(id).subscribe({
        next: (ls) => {
          const leidas = ls.map(leerLetra);
          this.letrasCache.set(id, leidas);
          if (this.idIndicador() === id) this.letrasLeidas.set(leidas);
        },
        error: () => this.letrasLeidas.set([]),
      });
    });
  });
  /** Cuántos centros cambiaron en cada indicador del periodo (como fue frente a hoy). */
  resumenCambios = signal<TmiResumenCambios | null>(null);
  /** Indicadores del resumen: solo los que cambiaron, o todos. */
  verTodosResumen = signal(false);
  indicadoresResumen = computed(() => {
    const r = this.resumenCambios();
    if (!r) return [];
    return this.verTodosResumen() ? r.indicadores : r.indicadores.filter((i) => i.cambios > 0);
  });
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
  nombreIndicador = computed(() => {
    const i = this.indicadores().find((x) => x.id === this.idIndicador());
    return i ? `${i.orden}. ${i.indicador}` : '';
  });
  centroJust = signal<TmiJustificacionCentro | null>(null);
  terminos = signal<TmiTerminoResultado[]>([]);
  /** Cómo se lee la fórmula en el centro elegido: cada letra con sus términos y su valor histórico y actual. */
  lecturaCentro = computed(() => {
    const terms = this.terminosComparados();
    const suma = (ts: TerminoComparado[], lado: 'backup' | 'actual'): number | null => {
      const vals = ts.map((t) => t[lado]?.valor).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
    };
    return this.letrasLeidas().map((l) => {
      const partes = l.partes.map((p) => {
        const ts = terms.filter((t) => this.textoTermino(t).replace(/^MEDIANA\((.*)\)$/, '$1') === p.termino);
        return { ...p, historico: suma(ts, 'backup'), actual: suma(ts, 'actual'), hay: ts.length > 0 };
      });
      const conDatos = partes.filter((p) => p.hay);
      const total = (lado: 'historico' | 'actual') => {
        const vals = conDatos.map((p) => p[lado]).filter((v): v is number => v != null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
      };
      return { ...l, partes, historico: total('historico'), actual: total('actual'), hay: conDatos.length > 0 };
    });
  });

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
  /** Paginador de la tabla de registros que cambiaron: vuelve a la primera página con cada consulta. */
  paginaFilas = signal(0);
  tamanoFilas = signal(10);
  filasPagina = computed(() => {
    const f = this.filasCambiadas() ?? [];
    const desde = this.paginaFilas() * this.tamanoFilas();
    return f.slice(desde, desde + this.tamanoFilas());
  });
  private reinicioPagina = effect(() => {
    this.filasCambiadas();
    untracked(() => this.paginaFilas.set(0));
  });

  cambioPaginaFilas(e: PageEvent): void {
    this.paginaFilas.set(e.pageIndex);
    this.tamanoFilas.set(e.pageSize);
  }
  codigoFilas = signal('');
  /** Cómo se lee la tabla de registros que cambiaron: de qué término y letra son, y cuánto movieron el total. */
  lecturaFilas = computed(() => {
    const f = this.filasCambiadas();
    if (!f) return null;
    const cod = this.codigoFilas();
    const t = cod ? this.terminosComparados().find((x) => x.codigo === cod) : undefined;
    const termino = t ? this.textoTermino(t) : '';
    const base = termino.replace(/^MEDIANA\((.*)\)$/, '$1');
    const letra = base ? this.letrasLeidas().find((l) => l.partes.some((p) => p.termino === base)) : undefined;
    const diferencia = f.reduce((s, x) => s + (x.cantidad_actual ?? 0) - (x.cantidad_backup ?? 0), 0);
    return {
      codigo: cod, termino, letra: letra?.letra ?? '', variable: letra?.variable ?? '',
      nuevas: f.filter((x) => x.cambio === 'NUEVA').length,
      borradas: f.filter((x) => x.cambio === 'BORRADA').length,
      corregidas: f.filter((x) => x.cambio === 'CAMBIO').length,
      diferencia,
    };
  });

  ocupado = signal<'' | 'validar' | 'calcular' | 'excel' | 'resultado' | 'justificacion' | 'detalle'>('');
  error = signal('');
  mensaje = signal('');

  nombrePeriodo(periodo: string = this.periodoSel()): string {
    const mes = periodo.slice(4);
    return `${MESES.find((m) => m.value === mes)?.label ?? mes} ${periodo.slice(0, 4)}`;
  }

  /** Calendario de carga y cierre del periodo elegido: los datos del mes se ingresan la primera semana del mes
   *  siguiente y ahí se guarda el cierre; en la última semana de cada mes se pueden corregir meses anteriores. */
  calendario = computed(() => {
    const p = this.periodoSel();
    const anio = +p.slice(0, 4);
    const mes = +p.slice(4);
    const sig = mes === 12 ? `${anio + 1}01` : `${anio}${String(mes + 1).padStart(2, '0')}`;
    const ant = mes === 1 ? '' : `${anio}${String(mes - 1).padStart(2, '0')}`;
    const nombreMes = (x: string) => this.nombrePeriodo(x).split(' ')[0].toLowerCase();
    return {
      mes: this.nombrePeriodo(p),
      mesCorto: nombreMes(p),
      siguiente: this.nombrePeriodo(sig),
      siguienteCorto: nombreMes(sig),
      anteriorCorto: ant ? nombreMes(ant) : '',
      enero: mes === 1,
      rango: mes === 1 ? 'enero' : `enero a ${nombreMes(p)}`,
    };
  });

  /** Nombre del origen de los datos para la pantalla. */
  nombreOrigen(o: TmiOrigenDatos): string {
    return o === 'BACKUP' ? 'con datos históricos' : 'con datos actuales';
  }

  /** Valor del mes i (0 = enero): periodo_01..periodo_12 del resultado final. */
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
      },
    });
    this.calculoSrv.getPeriodoCalculo().subscribe({
      next: (e) => {
        this.estadoPeriodos.set(e);
        // se abre en el último periodo con los datos de hoy
        const p = this.periodoCalculo();
        if (p) {
          this.anioSel.set(p.slice(0, 4));
          this.mesSel.set(p.slice(4));
        }
      },
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron cargar los periodos.')),
    });
  }

  /** Cambió el año, el mes o los datos: lo que se ve era de otra elección. */
  cambioEleccion(): void {
    this.resultado.set([]);
    this.resumenCambios.set(null);
    this.limpiarJustificacion();
    this.error.set('');
    this.mensaje.set('');
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

  /** Calcula en tiempo real el año, el mes y los datos elegidos, y muestra el resultado del indicador. */
  calcular(): void {
    if (!this.puedeCalcular()) return;
    const periodo = this.periodoSel();
    const origen = this.origenSel();
    const clave = this.claveSel();
    this.inicio('calcular');
    this.calculoSrv.calcular(periodo, origen).subscribe({
      next: () => {
        this.problemas.set([]);
        this.calculado.set(clave);
        this.mensaje.set(`TMI de ${this.nombrePeriodo(periodo)} calculado ${this.nombreOrigen(origen)}. Este cálculo no se guarda.`);
        this.ocupado.set('');
        this.limpiarJustificacion();
        this.verResultado();
      },
      error: (e) => {
        if (Array.isArray(e?.error?.detail)) this.problemas.set(e.error.detail);
        this.error.set(mensajeError(e, 'No se pudo calcular el periodo.'));
        this.ocupado.set('');
      },
    });
  }

  cambioIndicador(id: number): void {
    this.idIndicador.set(id);
    this.limpiarJustificacion();
    this.verResultado();
  }

  /** Resultado final del indicador con la elección calculada (el backend lo tiene en memoria: no recalcula). */
  verResultado(): void {
    const id = this.idIndicador();
    if (id == null || !this.hayCalculo()) return;
    // no se borra el mensaje: después de Calcular debe quedar el aviso de que se calculó
    this.ocupado.set('resultado');
    this.error.set('');
    this.calculoSrv.getResultado(this.periodoSel(), id, this.origenSel()).subscribe({
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

  /** Excel del año, el mes y los datos elegidos, en tiempo real. */
  descargar(): void {
    this.inicio('excel');
    if (!this.excelIds().size) {
      this.error.set('Elija al menos un indicador para el Excel.');
      this.ocupado.set('');
      return;
    }
    const periodo = this.periodoSel();
    const origen = this.origenSel();
    const ids = this.todosEnExcel() ? undefined : this.indicadores().filter((i) => this.excelIds().has(i.id!)).map((i) => i.id!);
    this.calculoSrv.getExcel(periodo, false, ids, origen).subscribe({
      next: (resp) => {
        const blob = resp.body;
        if (blob) {
          const disposicion = resp.headers.get('content-disposition') ?? '';
          const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1] ?? `TMI_${periodo}.xlsx`;
          const url = window.URL.createObjectURL(
            new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = nombre;
          link.click();
          window.URL.revokeObjectURL(url);
          this.mensaje.set(`Excel de ${this.nombrePeriodo(periodo)} descargado, ${this.nombreOrigen(origen)}.`);
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

  /** Indicador elegido en la comparativa (el mismo del punto 2): si ya se está comparando, se compara el nuevo. */
  cambioIndicadorComparar(id: number): void {
    if (this.justificacion()) this.verIndicadorResumen(id);
    else this.cambioIndicador(id);
  }

  limpiarJustificacion(): void {
    this.justificacion.set(null);
    this.centroJust.set(null);
    this.terminos.set([]);
    this.filasCambiadas.set(null);
  }

  /** Resultado de cada centro del indicador con los datos del cierre y con los datos de hoy (los dos en tiempo real). */
  verJustificacion(): void {
    const id = this.idIndicador();
    if (id == null) return;
    const centro = this.centroJust()?.codcentro;
    const periodo = this.periodoSel();
    this.inicio('justificacion');
    this.calculoSrv.getJustificacion(periodo, id).subscribe({
      next: (j) => {
        this.justificacion.set(j);
        const c = centro == null ? null : j.centros.find((x) => x.codcentro === centro) ?? null;
        if (c) this.abrirCentro(c); else this.centroJust.set(null);
        // el resumen de todos los indicadores usa los mismos cálculos (ya en memoria en el backend)
        if (this.resumenCambios()?.periodo !== +periodo) this.cargarResumenCambios(periodo);
        else if (!c) this.ocupado.set('');
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar la comparativa.'));
        this.ocupado.set('');
      },
    });
  }

  private cargarResumenCambios(periodo: string): void {
    this.calculoSrv.getResumenCambios(periodo).subscribe({
      next: (r) => {
        this.resumenCambios.set(r);
        if (this.ocupado() === 'justificacion') this.ocupado.set('');
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar el resumen de cambios.'));
        if (this.ocupado() === 'justificacion') this.ocupado.set('');
      },
    });
  }

  /** Desde el resumen: ver la justificación de ese indicador (y su resultado en el punto 2). */
  verIndicadorResumen(id: number): void {
    this.idIndicador.set(id);
    this.centroJust.set(null);
    this.terminos.set([]);
    this.filasCambiadas.set(null);
    this.verResultado();
    this.verJustificacion();
  }

  /** Los datos que faltan para comparar (null = están los dos). */
  faltaOrigen(j: TmiJustificacion): TmiOrigenDatos | null {
    if (!j.origenes.includes('BACKUP')) return 'BACKUP';
    return j.origenes.includes('ACTUAL') ? null : 'ACTUAL';
  }

  /** Detalle de un centro: el valor de cada término de la fórmula con cada dato. */
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

  fecha(f: string | null | undefined): string {
    return f ? new Date(f).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '';
  }

  claseP(p: string): string {
    return 'dyn-badge dyn-p' + (p ?? 'NA');
  }

  motivo(m: string | null): string {
    return m ? (MOTIVOS[m] ?? m) : '';
  }
}
