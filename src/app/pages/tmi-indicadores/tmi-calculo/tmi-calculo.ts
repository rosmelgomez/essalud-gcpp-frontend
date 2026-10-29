import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiDinamicoService, TmiIndicador, TmiPeriodoCalculo, TmiProblemaConfig, TmiResultadoFinal, mensajeError,
} from '../../../services/tmi-dinamico-service';

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
  FUERA_DE_AMBITO: 'Fuera de ámbito',
  NO_VIGENTE_MES: 'No vigente en el mes',
  NO_FUNCIONA: 'No funciona',
};

/** Validar, calcular el periodo abierto, revisar el resultado final guardado y descargar el Excel del TMI dinámico.
 *  Solo se calcula el mes anterior: los periodos cerrados se consultan y descargan con el resultado guardado. */
@Component({
  selector: 'app-tmi-calculo',
  imports: [FormsModule, MatCardModule, MatIconModule, DecimalPipe],
  templateUrl: './tmi-calculo.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiCalculo implements OnInit {
  private srv = inject(TmiDinamicoService);

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
    `60px 230px 70px 240px 60px 80px 80px 80px ${this.esBanda() ? '80px ' : ''}95px repeat(12, 92px) 75px 160px`);
  esBanda = computed(() => (this.indicadores().find((i) => i.id === this.idIndicador())?.sentido ?? '') === 'BANDA');
  /** Único periodo que se calcula: el mes anterior al actual (en octubre se calcula septiembre). */
  periodoCalculo = computed(() => this.estadoPeriodos()?.periodo_calculo ?? '');
  /** Resultado guardado del periodo elegido en los select (para el Excel) y del periodo que se calcula. */
  guardado = computed(() => this.guardadoDe(this.periodoSel()));
  guardadoCalculo = computed(() => this.guardadoDe(this.periodoCalculo()));
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
  scripts = signal<Record<string, string> | null>(null);

  ocupado = signal<'' | 'validar' | 'calcular' | 'excel' | 'resultado' | 'sql'>('');
  error = signal('');
  mensaje = signal('');

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

  /** Encabezado de la columna de un mes: 202601, 202602... (como en la hoja del Excel). */
  encabezadoMes(i: number): string {
    return `${this.periodoSel().slice(0, 4)}${String(i + 1).padStart(2, '0')}`;
  }

  ngOnInit(): void {
    this.srv.getIndicadores().subscribe({
      next: (lista) => {
        const activos = lista.filter((i) => i.activo);
        this.indicadores.set(activos);
        if (activos.length && this.idIndicador() == null) this.idIndicador.set(activos[0].id ?? null);
        this.verResultado();
      },
    });
    this.cargarPeriodos(true);
  }

  /** Periodo abierto para cálculo y periodos con resultado guardado. inicial = se posiciona en el periodo abierto. */
  cargarPeriodos(inicial = false): void {
    this.srv.getPeriodoCalculo().subscribe({
      next: (e) => {
        this.estadoPeriodos.set(e);
        if (inicial) {
          this.anio = e.periodo_calculo.slice(0, 4);
          this.mes = e.periodo_calculo.slice(4);
          this.cambioPeriodo();
        }
      },
    });
  }

  cambioPeriodo(): void {
    this.periodoSel.set(this.periodo);
    this.verResultado();
  }

  private inicio(accion: 'validar' | 'calcular' | 'excel' | 'resultado' | 'sql'): void {
    this.ocupado.set(accion);
    this.error.set('');
    this.mensaje.set('');
  }

  validar(): void {
    this.inicio('validar');
    this.srv.validarConfig().subscribe({
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

  /** Calcula el periodo abierto (no el de los select) y deja los select en ese periodo para ver el resultado. */
  calcular(): void {
    const periodo = this.periodoCalculo();
    if (!periodo) return;
    this.inicio('calcular');
    this.srv.calcular(periodo).subscribe({
      next: (r) => {
        this.resumen.set(r.puntajes);
        this.problemas.set([]);
        this.mensaje.set(`Cálculo de ${this.nombrePeriodo(periodo)} terminado y guardado.`);
        this.ocupado.set('');
        this.cargarPeriodos();
        this.anio = periodo.slice(0, 4);
        this.mes = periodo.slice(4);
        this.cambioPeriodo();
      },
      error: (e) => {
        if (Array.isArray(e?.error?.detail)) this.problemas.set(e.error.detail);
        this.error.set(mensajeError(e, 'No se pudo calcular el periodo.'));
        this.ocupado.set('');
      },
    });
  }

  verResultado(): void {
    const id = this.idIndicador();
    if (id == null) return;
    this.inicio('resultado');
    this.srv.getResultado(this.periodo, id).subscribe({
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
    this.srv.getExcel(this.periodo, false).subscribe({
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
          this.mensaje.set(`Excel de ${this.nombrePeriodo()} descargado.`);
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

  ejecutarScripts(): void {
    if (!confirm('¿Volver a ejecutar los scripts SQL del TMI (tablas, vistas, datos iniciales y procedimientos)?\n'
      + 'No borran datos: solo crean lo que falta.')) return;
    this.inicio('sql');
    this.srv.ejecutarSql().subscribe({
      next: (r) => {
        this.scripts.set(r);
        this.ocupado.set('');
      },
      error: (e) => {
        if (e?.error?.detail && typeof e.error.detail === 'object') this.scripts.set(e.error.detail);
        this.error.set(mensajeError(e, 'No se pudo ejecutar los scripts SQL.'));
        this.ocupado.set('');
      },
    });
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

  scriptsLista(): { nombre: string; estado: string }[] {
    const s = this.scripts();
    return s ? Object.entries(s).map(([nombre, estado]) => ({ nombre, estado })) : [];
  }
}
