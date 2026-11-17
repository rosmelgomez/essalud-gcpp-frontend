import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TmiCierreService, TmiCalendarioCierre, TmiCierre, mensajeError } from '../../../../services/tmi';
import { MESES_NOMBRE as MESES } from '../../tmi-comun';


const ESTADOS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  EJECUTADO: 'Ejecutado',
  ERROR: 'Error',
};

/** Mientras un cierre se ejecuta, la lista se vuelve a consultar cada 5 s (hasta 10 minutos). */
const ESPERA_MS = 5000;
const MAX_CONSULTAS = 120;

/** Edición del calendario de un año: día general y día propio de cada periodo (null = el general). */
/** Edición por periodo (como Exclusiones): solo el día de cierre del mes elegido (null = el día general). */
interface EdicionMes {
  anio: number;
  mes: number;
  dia_fijo: number | null;
  dia: number | null;
  /** el periodo ya se cerró: su día no cambia (el día general sí) */
  bloqueado: boolean;
}

interface EdicionCalendario {
  anio: number;
  nuevo: boolean;
  dia_fijo: number | null;
  dias: (number | null)[];
  bloqueado: boolean[];
}

function hoyISO(): string {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

/** Calendario de cierre por año (día general y excepciones por periodo) y ejecución del cierre de cada periodo. */
@Component({
  selector: 'app-tmi-cierre',
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './tmi-cierre.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css', './tmi-cierre.css'],
})
export class TmiCierreComponent implements OnInit, OnDestroy {
  /** Ayuda de la pestaña (signo de pregunta junto al título). */
  ayudaPagina = signal(false);

  alternarAyudaPagina(ev: Event): void {
    ev.stopPropagation();
    this.ayudaPagina.update((v) => !v);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  cerrarAyudaPagina(): void {
    this.ayudaPagina.set(false);
  }

  private cierreSrv = inject(TmiCierreService);

  readonly mesesCortos = MESES.map((m) => m.substring(0, 3));
  readonly meses = MESES;
  readonly hoy = hoyISO();

  /** Periodo de la cabecera (como Exclusiones): por defecto el mes anterior al actual, el último que se cierra. */
  private readonly anterior = (() => {
    const f = new Date();
    return f.getMonth() === 0 ? { anio: f.getFullYear() - 1, mes: 12 } : { anio: f.getFullYear(), mes: f.getMonth() };
  })();
  anioSel = signal(this.anterior.anio);
  mesSel = signal(this.anterior.mes);
  periodoSel = computed(() => `${this.anioSel()}${String(this.mesSel()).padStart(2, '0')}`);
  nombrePeriodoSel = computed(() => this.nombrePeriodo(this.periodoSel()));
  /** Años del calendario y de los cierres (y el elegido), del más reciente al más antiguo. */
  anios = computed(() => [...new Set([this.anioSel(), ...this.calendarios().map((c) => c.anio),
    ...this.cierres().map((c) => Number(String(c.periodo).substring(0, 4)))])].sort((a, b) => b - a));
  /** Calendario del año elegido. */
  calendariosAnio = computed(() => this.calendarios().filter((c) => c.anio === this.anioSel()));
  calendarioSel = computed(() => this.calendariosAnio()[0] ?? null);
  /** Mes elegido en el calendario: fecha de cierre, día propio, estado y si ya se cerró. */
  mesCal = computed(() => this.calendarioSel()?.meses.find((m) => m.mes === this.mesSel()) ?? null);
  /** Ejecución del cierre del periodo elegido. */
  cierreSel = computed(() => this.cierres().find((c) => String(c.periodo).trim() === this.periodoSel()) ?? null);

  edicionMes = signal<EdicionMes | null>(null);

  calendarios = signal<TmiCalendarioCierre[]>([]);
  cierres = signal<TmiCierre[]>([]);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  edicion = signal<EdicionCalendario | null>(null);
  guardando = signal(false);
  errorForm = signal('');

  cierresConError = computed(() => this.cierres().filter((c) => c.estado === 'ERROR').length);
  cierresAtrasados = computed(() => this.cierres().filter((c) => this.esAtrasado(c)).length);
  ejecutando = computed(() => this.cierres().some((c) => c.estado === 'EN_PROCESO'));

  private espera?: ReturnType<typeof setTimeout>;
  private consultas = 0;
  /** Se guardó el calendario y el backend empezó a ejecutar un cierre: se sigue hasta que termine. */
  private esperandoEjecucion = false;

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.espera);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.cierreSrv.getCalendario().subscribe({
      next: (cal) => {
        this.calendarios.set(cal ?? []);
        this.cargarCierres();
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar el calendario de cierre.'));
        this.cargando.set(false);
      },
    });
  }

  private cargarCierres(): void {
    this.cierreSrv.getQueryCierres().subscribe({
      next: (res) => {
        this.cierres.set(res ?? []);
        this.cargando.set(false);
        this.seguirEjecucion();
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar los cierres.'));
        this.cargando.set(false);
      },
    });
  }

  /** Un cierre que se está ejecutando (o que se acaba de mandar a ejecutar) se sigue consultando hasta que termine. */
  private seguirEjecucion(): void {
    clearTimeout(this.espera);
    const porEjecutar = this.ejecutando() || (this.esperandoEjecucion && this.cierres().some(
      (c) => c.estado === 'PENDIENTE' && c.fecha_cierre.substring(0, 10) <= this.hoy));
    if (!porEjecutar || this.consultas >= MAX_CONSULTAS) {
      if (this.esperandoEjecucion) this.mensaje.set('El cierre terminó. Revise su estado en la tabla.');
      this.consultas = 0;
      this.esperandoEjecucion = false;
      return;
    }
    this.consultas++;
    this.espera = setTimeout(() => this.cierreSrv.getQueryCierres().subscribe({
      next: (res) => {
        this.cierres.set(res ?? []);
        this.seguirEjecucion();
      },
    }), ESPERA_MS);
  }

  // calendario

  editar(cal: TmiCalendarioCierre): void {
    this.errorForm.set('');
    this.edicion.set({
      anio: cal.anio,
      nuevo: false,
      dia_fijo: cal.dia_fijo,
      dias: cal.meses.map((m) => m.dia),
      bloqueado: cal.meses.map((m) => m.bloqueado),
    });
  }

  /** Periodos del año que usan el día general y aún no se cierran (los que cambian con él). */
  periodosConGeneral(): number {
    return (this.calendarioSel()?.meses ?? []).filter((m) => !m.dia && !m.bloqueado).length;
  }

  /** Edita el día de cierre del periodo elegido y el día general del año. */
  editarMes(): void {
    const cal = this.calendarioSel();
    const m = this.mesCal();
    if (!cal || !m) return;
    this.errorForm.set('');
    this.edicionMes.set({ anio: cal.anio, mes: m.mes, dia_fijo: cal.dia_fijo, dia: m.dia, bloqueado: m.bloqueado });
  }

  cerrarEdicionMes(): void {
    if (this.guardando()) return;
    this.edicionMes.set(null);
  }

  /** Guarda el día del mes elegido y el día general del año; los días propios de los otros meses quedan como están. */
  guardarMes(): void {
    const e = this.edicionMes();
    const cal = this.calendarioSel();
    if (!e || !cal) return;
    const valido = (d: number | null) => d != null && Number.isInteger(d) && d >= 1 && d <= 31;
    if (!valido(e.dia_fijo)) {
      this.errorForm.set('Escriba un día general entre 1 y 31.');
      return;
    }
    if (e.dia != null && !valido(e.dia)) {
      this.errorForm.set('Escriba un día entre 1 y 31, o déjelo vacío para usar el día general.');
      return;
    }
    const dias: Record<string, number | null> = {};
    cal.meses.forEach((m) => (dias[`dia_${String(m.mes).padStart(2, '0')}`] =
      m.mes === e.mes && !e.bloqueado ? e.dia || null : m.dia));
    this.enviarCalendario(e.anio, e.dia_fijo!, dias, () => this.edicionMes.set(null));
  }

  /** Año siguiente al último del calendario, con su mismo día general. */
  agregarAnio(): void {
    const ultimo = this.calendarios()[0];
    this.errorForm.set('');
    this.edicion.set({
      anio: (ultimo?.anio ?? new Date().getFullYear()) + 1,
      nuevo: true,
      dia_fijo: ultimo?.dia_fijo ?? 7,
      dias: Array(12).fill(null),
      bloqueado: Array(12).fill(false),
    });
  }

  cerrarEdicion(): void {
    if (this.guardando()) return;
    this.edicion.set(null);
  }

  /** Fecha en que se cierra el periodo (mes 1..12) del año con el día indicado: el mes siguiente, ese día o el último. */
  fechaCierre(anio: number, mes: number, dia: number | null): string {
    if (!dia) return '—';
    const a = mes === 12 ? anio + 1 : anio;
    const m = mes === 12 ? 1 : mes + 1;
    const ultimo = new Date(a, m, 0).getDate();
    return `${String(Math.min(dia, ultimo)).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
  }

  diaEfectivo(e: EdicionCalendario, i: number): number | null {
    return e.dias[i] || e.dia_fijo;
  }

  guardar(): void {
    const e = this.edicion();
    if (!e) return;
    const valido = (d: number | null) => d == null || (Number.isInteger(d) && d >= 1 && d <= 31);
    if (!e.dia_fijo || !valido(e.dia_fijo) || !e.dias.every(valido)) {
      this.errorForm.set('Los días deben estar entre 1 y 31.');
      return;
    }
    const dias: Record<string, number | null> = {};
    e.dias.forEach((d, i) => (dias[`dia_${String(i + 1).padStart(2, '0')}`] = d || null));
    this.enviarCalendario(e.anio, e.dia_fijo, dias, () => this.edicion.set(null));
  }

  private enviarCalendario(anio: number, diaFijo: number, dias: Record<string, number | null>, cerrar: () => void): void {
    this.guardando.set(true);
    this.errorForm.set('');
    this.cierreSrv.putCalendario(anio, diaFijo, dias).subscribe({
      next: (res) => {
        this.guardando.set(false);
        cerrar();
        this.anioSel.set(anio);   // se ve el año guardado
        this.esperandoEjecucion = !!res?.ejecutando;
        this.mensaje.set(res?.ejecutando
          ? 'Calendario guardado. Un cierre es de hoy y ya está corriendo; la tabla se actualiza sola.'
          : 'Calendario guardado.');
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(err, 'No se pudo guardar el calendario.'));
      },
    });
  }

  // cierres

  /** Periodos (no cerrados) con día propio en el formulario. */
  diasPropios(e: EdicionCalendario): number {
    return e.dias.filter((d, i) => d != null && !e.bloqueado[i]).length;
  }

  /** Quita el día propio de los periodos no cerrados: usan el día general. */
  limpiarDias(e: EdicionCalendario): void {
    e.dias = e.dias.map((d, i) => (e.bloqueado[i] ? d : null));
  }

  nombrePeriodo(periodo: string): string {
    const p = String(periodo ?? '').trim();
    const mes = MESES[Number(p.substring(4, 6)) - 1];
    return mes ? `${mes} ${p.substring(0, 4)}` : p;
  }

  /** 2026-09-10 -> 10/09/2026; con hora: 10/09/2026 14:30 (sin conversión de zona horaria). */
  formatoFecha(valor: string | null): string {
    if (!valor) return '—';
    const [fecha, hora] = String(valor).replace(' ', 'T').split('T');
    const [a, m, d] = fecha.split('-');
    return hora ? `${d}/${m}/${a} ${hora.substring(0, 5)}` : `${d}/${m}/${a}`;
  }

  etiquetaEstado(estado: string | null): string {
    return estado ? (ESTADOS[estado] ?? estado) : '';
  }

  /** Pendiente cuya fecha de cierre ya pasó. */
  esAtrasado(c: TmiCierre): boolean {
    const fecha = c.fecha_cierre?.substring(0, 10);
    return c.estado === 'PENDIENTE' && !!fecha && fecha < this.hoy;
  }

  /** Un cierre en ERROR se reintenta automáticamente el mismo día en que falló. */
  seReintentaHoy(c: TmiCierre): boolean {
    return c.estado === 'ERROR' && String(c.fecha_ejecucion ?? '').substring(0, 10) === this.hoy;
  }
}
