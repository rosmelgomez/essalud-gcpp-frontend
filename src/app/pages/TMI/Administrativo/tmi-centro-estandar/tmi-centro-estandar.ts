import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { filaEstrecha } from '../lista-virtual';
import { aNumero, fmtNum, MESES_NOMBRE } from '../../tmi-comun';
import { TmiIndicadorService, TmiCentroService, TmiCentroEstandar, TmiCentroCatalogo, TmiIndicador, mensajeError } from '../../../../services/tmi';

export const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

/** Estándar propio de un centro en un indicador, en el periodo elegido. */
interface FilaCentroEstandar {
  f: TmiCentroEstandar;
  fijo: string;      // fijo del año
  mesValor: string;  // valor del mes (o "usa el fijo" si aún no cierra)
  distinto: boolean; // el mes cerrado se cambió solo para ese mes
}

/** Excepciones de un centro: el centro se muestra una vez y debajo sus indicadores (como Exclusiones). */
interface GrupoCentroEstandar {
  clave: string;
  codcentro: string;
  centro: string;
  red: string;
  filas: FilaCentroEstandar[];
}

/** Fila de la lista virtual: la cabecera del centro o uno de sus indicadores (si está abierto). */
interface FilaLista {
  g: GrupoCentroEstandar;
  x?: FilaCentroEstandar;
}

/** Periodo por defecto: el mes anterior al actual (el último que se calcula), como en % Acept. */
function periodoAnterior(): { anio: number; mes: number } {
  const hoy = new Date();
  return hoy.getMonth() === 0 ? { anio: hoy.getFullYear() - 1, mes: 12 } : { anio: hoy.getFullYear(), mes: hoy.getMonth() };
}

/** Estándar específico de un centro: gana sobre el estándar por tipo, nivel o categoría.
 *  Funciona como el estándar por nivel (Por indicador): un fijo del año que cada mes toma en su fecha de cierre, y el
 *  valor del mes, que se puede cambiar solo cuando el mes ya cerró. */
@Component({
  selector: 'app-tmi-centro-estandar',
  imports: [ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule, DecimalPipe, ScrollingModule],
  templateUrl: './tmi-centro-estandar.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css', '../lista-virtual.css', '../tmi-estandar-resumen.css', './tmi-centro-estandar.css'],
})
export class TmiCentroEstandarTab implements OnInit {
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

  private indicadorSrv = inject(TmiIndicadorService);
  private centroSrv = inject(TmiCentroService);
  private fb = inject(FormBuilder);

  readonly anios = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i);
  readonly mesesNombre = MESES_NOMBRE;

  /** Periodo elegido (año y mes 1..12). */
  anio = signal(periodoAnterior().anio);
  mes = signal(periodoAnterior().mes);
  nombreMes = computed(() => MESES_NOMBRE[this.mes() - 1]);
  /** Columna del mes elegido (est_01..est_12). */
  colMes = computed(() => 'est_' + MESES[this.mes() - 1]);

  filas = signal<TmiCentroEstandar[]>([]);
  /** El mes elegido ya llegó a su fecha de cierre: su estándar se puede cambiar solo para ese mes. */
  mesCerrado = signal(false);
  centros = signal<TmiCentroCatalogo[]>([]);
  indicadores = signal<TmiIndicador[]>([]);
  filtroRed = signal('');
  redes = computed(() => [...new Set(this.centros().map((c) => c.red).filter((r) => !!r))].sort((a, b) => a.localeCompare(b)));
  centrosFiltrados = computed(() => {
    const red = this.filtroRed();
    return this.centros().filter((c) => !red || c.red === red);
  });

  /** Búsqueda (código, centro, red o indicador) y centros desplegados. */
  busqueda = signal('');
  abiertos = signal<Set<string>>(new Set());
  /** Centros con estándar propio en el año (fijo o del mes elegido) o que no aplican (quedan NA todo el año). */
  grupos = computed<GrupoCentroEstandar[]>(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const contiene = (...vals: any[]) => vals.some((v) => String(v ?? '').toLowerCase().includes(texto));
    const mapa = new Map<string, GrupoCentroEstandar>();
    const col = this.colMes();
    const cerrado = this.mesCerrado();
    for (const f of this.filas()) {
      const fijo = aNumero(f.est_fijo);
      const delMes = aNumero((f as any)[col]);
      if (f.aplica && fijo === null && delMes === null) continue;
      const clave = String(f.codcentro);
      let g = mapa.get(clave);
      if (!g) {
        g = { clave, codcentro: clave, centro: f.centro || 'Centro sin nombre', red: f.red || '', filas: [] };
        mapa.set(clave, g);
      }
      g.filas.push({
        f,
        fijo: f.aplica ? (fijo ? fmtNum(fijo) : 'sin estándar') : 'NA',
        mesValor: !f.aplica ? 'NA' : delMes ? fmtNum(delMes) : cerrado ? 'sin estándar' : 'usa el fijo',
        distinto: !!f.aplica && delMes !== null && fijo !== null && delMes !== fijo,
      });
    }
    const resultado: GrupoCentroEstandar[] = [];
    for (const g of mapa.values()) {
      if (texto && !contiene(g.codcentro, g.centro, g.red)) {
        g.filas = g.filas.filter((x) => contiene(x.f.indicador));
        if (!g.filas.length) continue;
      }
      g.filas.sort((a, b) => String(a.f.indicador ?? '').localeCompare(String(b.f.indicador ?? '')));
      resultado.push(g);
    }
    return resultado.sort((a, b) => a.codcentro.localeCompare(b.codcentro, undefined, { numeric: true }));
  });
  totalFilas = computed(() => this.grupos().reduce((n, g) => n + g.filas.length, 0));

  /** Lista virtual: todas las filas miden lo mismo, así solo se dibujan las que se ven. */
  private readonly estrecha = filaEstrecha();
  /** En pantalla angosta la fila pasa a dos líneas (indicador arriba; fijo y mes abajo). */
  altoFila = computed(() => (this.estrecha() ? 84 : 56));
  readonly esqueleto = [1, 2, 3, 4, 5, 6];
  lista = computed<FilaLista[]>(() => {
    const abiertos = this.abiertos();
    const out: FilaLista[] = [];
    for (const g of this.grupos()) {
      out.push({ g });
      if (abiertos.has(g.clave)) for (const x of g.filas) out.push({ g, x });
    }
    return out;
  });
  altoLista = computed(() => Math.max(this.altoFila(), Math.min(this.lista().length * this.altoFila(), 640)));
  trackFila = (_: number, r: FilaLista) => `${r.g.clave}-${r.x?.f.id ?? ''}`;
  /** Si el usuario cambia de periodo antes de que llegue la respuesta, la vieja se descarta. */
  private pedido = 0;

  loading = signal(false);
  error = signal('');
  eliminandoId = signal<number | null>(null);
  mostrarForm = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  /** El formulario guarda el registro del año: el fijo y, si el mes ya cerró, el valor de ese mes. Los otros meses se
   *  conservan. */
  form = this.fb.group({
    id: [0],
    codcentro: ['', Validators.required],
    id_indicador: [null as number | null, Validators.required],
    anio: [this.anio(), Validators.required],
    aplica: [true],
    est_fijo: [null as number | null],
    est_01: [null as number | null], est_02: [null as number | null], est_03: [null as number | null],
    est_04: [null as number | null], est_05: [null as number | null], est_06: [null as number | null],
    est_07: [null as number | null], est_08: [null as number | null], est_09: [null as number | null],
    est_10: [null as number | null], est_11: [null as number | null], est_12: [null as number | null],
    sustento: [''],
  });

  /** Valores del formulario como señal (para saber si el centro ya está registrado). */
  private valorForm = signal(this.form.getRawValue());

  /** Registro ya guardado del mismo centro, indicador y año: en un alta, guardar lo actualiza en vez de duplicarlo. */
  existente = computed(() => {
    const v = this.valorForm();
    if (v.id || !v.codcentro || v.id_indicador == null) return null;
    return this.buscarRegistro(String(v.codcentro), Number(v.id_indicador));
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.valorForm.set(this.form.getRawValue()));
  }

  private buscarRegistro(codcentro: string, idIndicador: number, sinId?: number) {
    return this.filas().find((x) => String(x.codcentro) === codcentro && Number(x.id_indicador) === idIndicador
      && x.id !== sinId) ?? null;
  }

  ngOnInit(): void {
    this.cargar();
    this.centroSrv.getCentros().subscribe({ next: (c) => this.centros.set(c) });
    this.indicadorSrv.getIndicadores().subscribe({ next: (i) => this.indicadores.set(i) });
  }

  /** Estándares del año, con el estándar y el % Acept que usa el mes elegido. */
  cargar(): void {
    const n = ++this.pedido;
    this.loading.set(true);
    this.error.set('');
    this.centroSrv.getCentroEstandar(this.anio(), this.mes()).subscribe({
      next: (r) => {
        if (n !== this.pedido) return;
        this.mesCerrado.set(!!r.mes_cerrado);
        this.filas.set(r.filas ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        if (n !== this.pedido) return;
        this.filas.set([]);
        this.error.set(mensajeError(e, 'No se pudieron cargar los estándares por centro.'));
        this.loading.set(false);
      },
    });
  }

  cambiarPeriodo(anio: number, mes: number): void {
    this.anio.set(Number(anio));
    this.mes.set(Number(mes));
    this.cargar();
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
    if (valor.trim()) this.abiertos.set(new Set(this.grupos().map((g) => g.clave)));
  }

  toggle(clave: string): void {
    const s = new Set(this.abiertos());
    if (s.has(clave)) s.delete(clave);
    else s.add(clave);
    this.abiertos.set(s);
  }

  abrirTodos(abrir: boolean): void {
    this.abiertos.set(abrir ? new Set(this.grupos().map((g) => g.clave)) : new Set());
  }

  private abrirForm(valores: Record<string, any>): void {
    this.form.reset({ id: 0, codcentro: '', id_indicador: null, aplica: true, est_fijo: null, sustento: '', ...valores,
      anio: this.anio() } as any);
    this.filtroRed.set('');
    this.errorForm.set('');
    this.mostrarForm.set(true);
  }

  nuevo(codcentro = ''): void {
    this.abrirForm({ codcentro });
  }

  editar(f: TmiCentroEstandar): void {
    this.abrirForm({ ...f, id: f.id ?? 0, sustento: f.sustento ?? '' });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Seleccione el centro y el indicador.');
      return;
    }
    const f = this.form.getRawValue();
    const otro = this.buscarRegistro(String(f.codcentro), Number(f.id_indicador), f.id || undefined);
    if (otro && f.id) {
      this.errorForm.set('Este centro ya tiene estándar en ese indicador y año. Edite ese registro.');
      return;
    }
    const num = (v: any) => (v == null || v === '' ? null : Number(v));
    const col = this.colMes();
    const fijo = num(f.est_fijo);
    if (f.aplica && fijo == null) {
      this.errorForm.set(`Escriba el estándar fijo de ${this.anio()}.`);
      return;
    }
    // los meses quedan como estaban (los del registro que se edita); el mes elegido toma el valor ingresado. Vacío:
    // si ya cerró, el fijo (como en el cierre); si aún no cierra, queda vacío y usa el fijo. En un alta el backend busca
    // el registro del mismo año, centro e indicador: si existe, solo cambia el periodo (no se duplica).
    const base: any = f.id ? f : {};
    const meses: Record<string, number | null> = {};
    MESES.forEach((m) => (meses['est_' + m] = f.aplica ? num(base['est_' + m]) : null));
    if (f.aplica) meses[col] = num((f as any)[col]) ?? (this.mesCerrado() ? fijo : null);
    const dto = {
      codcentro: String(f.codcentro),
      id_indicador: Number(f.id_indicador),
      anio: this.anio(),
      aplica: !!f.aplica,
      est_fijo: f.aplica ? fijo : null,
      ...meses,
      sustento: f.sustento || null,
      ...(f.id ? {} : { mes: this.mes() }),
    } as TmiCentroEstandar;
    const id = f.id;
    this.guardando.set(true);
    this.errorForm.set('');
    const req = id ? this.centroSrv.putCentroEstandar(id, dto) : this.centroSrv.postCentroEstandar(dto);
    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el estándar del centro.'));
        this.guardando.set(false);
      },
    });
  }

  /** Elimina el estándar propio del centro en el año (fijo y meses): el centro vuelve al estándar de su tipo o nivel. */
  eliminar(f: TmiCentroEstandar): void {
    if (!f.id) return;
    const pregunta = `¿Eliminar el estándar propio de ${f.centro ?? f.codcentro} en "${f.indicador}" (${this.anio()})? `
      + 'Se borran el fijo y todos los meses, y el centro vuelve al estándar normal de su tipo o nivel.';
    if (!confirm(pregunta)) return;
    this.eliminandoId.set(f.id);
    this.centroSrv.deleteCentroEstandar(f.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.cargar();
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo eliminar.'));
        this.eliminandoId.set(null);
      },
    });
  }
}
