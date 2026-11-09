import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { AyudaFlotante } from '../ayuda-flotante';
import { aNumero, fmtNum, rangoMeses } from '../tmi-estandar-resumen/meses-rango';
import { TmiIndicadorService, TmiCentroService, TmiCentroEstandar, TmiCentroCatalogo, TmiIndicador, mensajeError } from '../../../../services/tmi';

export const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
export const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Estándar propio de un centro en un indicador, con sus meses listos para pintar. */
interface FilaCentroEstandar {
  f: TmiCentroEstandar;
  meses: { valor: number | null; titulo: string }[];
  rango: string;
  valor: string;     // recuadro: "4", "NA" o "varía"
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

/** Estándar específico de un centro: gana sobre el estándar por tipo, nivel o categoría. */
@Component({
  selector: 'app-tmi-centro-estandar',
  imports: [AyudaFlotante, ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule, DecimalPipe, ScrollingModule],
  templateUrl: './tmi-centro-estandar.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css', '../lista-virtual.css', '../tmi-estandar-resumen/tmi-estandar-resumen.css', './tmi-centro-estandar.css'],
})
export class TmiCentroEstandarTab implements OnInit {
  private indicadorSrv = inject(TmiIndicadorService);
  private centroSrv = inject(TmiCentroService);
  private fb = inject(FormBuilder);

  readonly meses = MESES;
  readonly mesesCorto = MESES_CORTO;
  readonly anios = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i);

  anio = signal(new Date().getFullYear());
  filas = signal<TmiCentroEstandar[]>([]);
  centros = signal<TmiCentroCatalogo[]>([]);
  indicadores = signal<TmiIndicador[]>([]);
  filtroCentro = signal('');
  filtroRed = signal('');
  redes = computed(() => [...new Set(this.centros().map((c) => c.red).filter((r) => !!r))].sort((a, b) => a.localeCompare(b)));
  centrosFiltrados = computed(() => {
    const f = this.filtroCentro().trim().toLowerCase();
    const red = this.filtroRed();
    return this.centros().filter((c) => (!red || c.red === red) && (!f || `${c.codcentro} ${c.centro}`.toLowerCase().includes(f)));
  });

  /** Búsqueda (código, centro, red o indicador) y centros desplegados. */
  busqueda = signal('');
  abiertos = signal<Set<string>>(new Set());
  grupos = computed<GrupoCentroEstandar[]>(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const contiene = (...vals: any[]) => vals.some((v) => String(v ?? '').toLowerCase().includes(texto));
    const mapa = new Map<string, GrupoCentroEstandar>();
    for (const f of this.filas()) {
      const clave = String(f.codcentro);
      let g = mapa.get(clave);
      if (!g) {
        g = { clave, codcentro: clave, centro: f.centro || 'Centro sin nombre', red: f.red || '', filas: [] };
        mapa.set(clave, g);
      }
      g.filas.push(this.fila(f));
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
  readonly altoFila = 56;
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
  altoLista = computed(() => Math.max(this.altoFila, Math.min(this.lista().length * this.altoFila, 640)));
  trackFila = (_: number, r: FilaLista) => `${r.g.clave}-${r.x?.f.id ?? ''}`;
  /** Si el usuario cambia de año antes de que llegue la respuesta, la vieja se descarta. */
  private pedido = 0;

  loading = signal(false);
  error = signal('');
  eliminandoId = signal<number | null>(null);
  mostrarForm = signal(false);
  guardando = signal(false);
  errorForm = signal('');
  valorTodos: number | null = null;

  form = this.fb.group({
    id: [0],
    codcentro: ['', Validators.required],
    id_indicador: [null as number | null, Validators.required],
    anio: [new Date().getFullYear(), Validators.required],
    aplica: [true],
    est_01: [null as number | null], est_02: [null as number | null], est_03: [null as number | null],
    est_04: [null as number | null], est_05: [null as number | null], est_06: [null as number | null],
    est_07: [null as number | null], est_08: [null as number | null], est_09: [null as number | null],
    est_10: [null as number | null], est_11: [null as number | null], est_12: [null as number | null],
    acept: [null as number | null],
    sustento: [''],
  });

  /** Valores del formulario como señal, y estándares de otros años (para saber si el centro ya está registrado). */
  private valorForm = signal(this.form.getRawValue());
  private otrosAnios = signal<Record<number, TmiCentroEstandar[]>>({});

  /** Registro ya guardado del mismo centro, indicador y año: en un alta, guardar lo actualiza en vez de duplicarlo. */
  existente = computed(() => {
    const v = this.valorForm();
    if (v.id || !v.codcentro || v.id_indicador == null || !v.anio) return null;
    const anio = Number(v.anio);
    const lista = anio === this.anio() ? this.filas() : this.otrosAnios()[anio];
    return lista ? this.buscarRegistro(lista, String(v.codcentro), Number(v.id_indicador), anio) : null;
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const v = this.form.getRawValue();
      this.valorForm.set(v);
      const anio = Number(v.anio);
      if (!v.id && anio && anio !== this.anio() && !(anio in this.otrosAnios())) {
        this.listaDelAnio(anio).subscribe((lista) => this.otrosAnios.update((o) => ({ ...o, [anio]: lista })));
      }
    });
  }

  private buscarRegistro(lista: TmiCentroEstandar[], codcentro: string, idIndicador: number, anio: number, sinId?: number) {
    return lista.find((x) => String(x.codcentro) === codcentro && Number(x.id_indicador) === idIndicador
      && Number(x.anio ?? anio) === anio && x.id !== sinId) ?? null;
  }

  /** Estándares de un año: los ya cargados si es el año en pantalla; si no, se consultan. */
  private listaDelAnio(anio: number): Observable<TmiCentroEstandar[]> {
    return anio === this.anio() ? of(this.filas()) : this.centroSrv.getCentroEstandar(anio);
  }

  ngOnInit(): void {
    this.cargar();
    this.centroSrv.getCentros().subscribe({ next: (c) => this.centros.set(c) });
    this.indicadorSrv.getIndicadores().subscribe({ next: (i) => this.indicadores.set(i) });
  }

  cargar(): void {
    const n = ++this.pedido;
    this.loading.set(true);
    this.error.set('');
    this.centroSrv.getCentroEstandar(this.anio()).subscribe({
      next: (f) => {
        if (n !== this.pedido) return;
        this.filas.set(f);
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

  cambiarAnio(valor: string): void {
    this.anio.set(Number(valor));
    this.cargar();
  }

  private fila(f: TmiCentroEstandar): FilaCentroEstandar {
    const valores = MESES.map((m) => aNumero((f as any)['est_' + m]));
    const meses = valores.map((v, i) => ({
      valor: f.aplica ? v : null,
      titulo: `${this.mesesCorto[i]}: ${!f.aplica ? 'no aplica (NA)' : v === null ? 'usa el estándar general' : fmtNum(v)}`,
    }));
    const distintos = [...new Set(valores.filter((v) => v !== null))];
    return {
      f,
      meses,
      rango: f.aplica ? rangoMeses(valores, 'estándar general') : 'No aplica: el indicador queda NA todo el año',
      valor: !f.aplica ? 'NA' : distintos.length === 1 ? fmtNum(distintos[0] as number) : distintos.length ? 'varía' : '—',
    };
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

  nuevo(codcentro = ''): void {
    this.form.reset({ id: 0, codcentro, id_indicador: null, anio: this.anio(), aplica: true, acept: null, sustento: '' });
    this.valorTodos = null;
    this.filtroCentro.set('');
    this.filtroRed.set('');
    this.errorForm.set('');
    this.mostrarForm.set(true);
  }

  editar(f: TmiCentroEstandar): void {
    this.form.reset({ ...f, id: f.id ?? 0, sustento: f.sustento ?? '' } as any);
    this.valorTodos = null;
    this.filtroCentro.set('');
    this.filtroRed.set('');
    this.errorForm.set('');
    this.mostrarForm.set(true);
  }

  aplicarATodos(): void {
    if (this.valorTodos == null || (this.valorTodos as any) === '') return;
    const patch: Record<string, number> = {};
    MESES.forEach((m) => (patch['est_' + m] = Number(this.valorTodos)));
    this.form.patchValue(patch);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Seleccione el centro, el indicador y el año.');
      return;
    }
    const f = this.form.getRawValue();
    const anio = Number(f.anio);
    this.guardando.set(true);
    this.errorForm.set('');
    // Antes de guardar se revisa si el centro ya tiene registro en ese indicador y año (consultando el año si hace falta)
    this.listaDelAnio(anio).subscribe({
      next: (lista) => this.guardarCon(f, this.buscarRegistro(lista, String(f.codcentro), Number(f.id_indicador), anio, f.id || undefined)),
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo revisar si el centro ya tiene estándar en ese año.'));
        this.guardando.set(false);
      },
    });
  }

  /** Alta de un centro ya registrado (mismo indicador y año): se actualiza ese registro; los meses ingresados reemplazan
   *  a los guardados y los vacíos conservan su valor. Al editar no se permite chocar con otro registro. */
  private guardarCon(f: ReturnType<typeof this.form.getRawValue>, otro: TmiCentroEstandar | null): void {
    if (otro && f.id) {
      this.errorForm.set('Ya existe otro estándar de este centro para ese indicador y año. Edite ese registro.');
      this.guardando.set(false);
      return;
    }
    const num = (v: any) => (v == null || v === '' ? null : Number(v));
    const meses: Record<string, number | null> = {};
    MESES.forEach((m) => {
      const nuevo = num((f as any)['est_' + m]);
      meses['est_' + m] = f.aplica ? (nuevo ?? (otro ? aNumero((otro as any)['est_' + m]) : null)) : null;
    });
    if (f.aplica && Object.values(meses).every((v) => v == null)) {
      this.errorForm.set('Ingrese el estándar de al menos un mes.');
      this.guardando.set(false);
      return;
    }
    const dto = {
      codcentro: String(f.codcentro),
      id_indicador: Number(f.id_indicador),
      anio: Number(f.anio),
      aplica: !!f.aplica,
      ...meses,
      acept: f.aplica ? (num(f.acept) ?? (otro ? num(otro.acept) : null)) : null,
      sustento: f.sustento || otro?.sustento || null,
    } as TmiCentroEstandar;
    const id = f.id || otro?.id;
    const req = id ? this.centroSrv.putCentroEstandar(id, dto) : this.centroSrv.postCentroEstandar(dto);
    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.otrosAnios.set({});
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el estándar del centro.'));
        this.guardando.set(false);
      },
    });
  }

  eliminar(f: TmiCentroEstandar): void {
    if (!f.id || !confirm(`¿Eliminar el estándar propio de ${f.centro ?? f.codcentro} en "${f.indicador}"?`)) return;
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
