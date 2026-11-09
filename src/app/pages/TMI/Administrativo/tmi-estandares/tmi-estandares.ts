import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { AyudaFlotante } from '../ayuda-flotante';
import {
  TmiCalculoService, TmiEstandarService, TmiEstandarPeriodo, TmiEstandarPeriodoClave, mensajeError,
} from '../../../../services/tmi';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Lo que el usuario escribe en el formulario: fijo del año y, si el mes ya cerró, el valor del mes. */
/** Fila de la lista virtual: la cabecera del indicador, una clave (si está abierto) o el aviso de que no tiene claves. */
interface FilaLista {
  t: 'ind' | 'clave' | 'vacio';
  i: TmiEstandarPeriodo;
  k?: TmiEstandarPeriodoClave;
}

interface EdicionClave {
  fuente: TmiEstandarPeriodoClave['fuente'];
  clave: string;
  etiqueta: string;
  fijo: number | null;
  mes: number | null;
}

/**
 * Estándares en un solo lugar: cada indicador muestra solo las claves de su base_estandar (Nivel: I, II, III o nivel estándar),
 * que son las que usa el cálculo. Se edita por periodo, igual que el % Acept: el fijo del año (lo toman los meses al
 * llegar su fecha de cierre) y, si el mes elegido ya cerró, el valor de ese mes.
 */
@Component({
  selector: 'app-tmi-estandares',
  imports: [AyudaFlotante, FormsModule, MatCardModule, MatIconModule, ScrollingModule],
  templateUrl: './tmi-estandares.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css', '../lista-virtual.css', '../tmi-estandar-resumen/tmi-estandar-resumen.css', './tmi-estandares.css'],
})
export class TmiEstandares implements OnInit {
  private estandarSrv = inject(TmiEstandarService);
  private calculoSrv = inject(TmiCalculoService);

  readonly meses = MESES.map((label, i) => ({ value: i + 1, label }));
  readonly anios = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() + 1 - i);
  anio = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() === 0 ? 12 : new Date().getMonth());
  nombreMes = computed(() => MESES[this.mes() - 1] ?? '');

  indicadores = signal<TmiEstandarPeriodo[]>([]);
  filtro = signal('');
  visibles = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    if (!f) return this.indicadores();
    return this.indicadores().filter((i) =>
      `${i.indicador} ${i.grupo ?? ''} ${i.base_descripcion ?? i.base_estandar} ${i.claves.map((k) => k.clave).join(' ')}`
        .toLowerCase().includes(f));
  });
  abiertos = signal<Set<number>>(new Set());

  /** Lista virtual: todas las filas miden lo mismo, así solo se dibujan las que se ven. */
  readonly altoFila = 52;
  readonly esqueleto = [1, 2, 3, 4, 5, 6];
  filas = computed<FilaLista[]>(() => {
    const abiertos = this.abiertos();
    const out: FilaLista[] = [];
    for (const i of this.visibles()) {
      out.push({ t: 'ind', i });
      if (!abiertos.has(i.id)) continue;
      if (!i.claves.length) out.push({ t: 'vacio', i });
      for (const k of i.claves) out.push({ t: 'clave', i, k });
    }
    return out;
  });
  /** Alto de la lista: crece con las filas hasta un tope; después se desplaza dentro. */
  altoLista = computed(() => Math.max(this.altoFila, Math.min(this.filas().length * this.altoFila, 640)));
  trackFila = (_: number, f: FilaLista) => `${f.t}-${f.i.id}-${f.k ? f.k.fuente + f.k.clave : ''}`;
  /** Cada carga lleva un número: si el usuario cambia de mes antes de que llegue, la respuesta vieja se descarta. */
  private pedido = 0;

  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // formulario flotante
  editando = signal<TmiEstandarPeriodo | null>(null);
  edicion = signal<EdicionClave[]>([]);
  guardando = signal(false);
  errorForm = signal('');

  /** Abre en el último periodo con datos (como Calcular y Excel): el mes anterior si TOTALIZADO3 ya lo tiene; si no, el
   *  último cargado (sin datos de octubre, septiembre). Así se ve el estándar de ese mes y no el fijo de un mes abierto. */
  ngOnInit(): void {
    this.cargando.set(true);
    this.calculoSrv.getPeriodoCalculo().subscribe({
      next: (e) => {
        const p = e.periodo_datos && e.periodo_datos < e.periodo_calculo ? e.periodo_datos : e.periodo_calculo;
        if (p) { this.anio.set(+p.slice(0, 4)); this.mes.set(+p.slice(4)); }
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  cargar(): void {
    const n = ++this.pedido;
    this.cargando.set(true);
    this.error.set('');
    this.estandarSrv.getEstandaresPeriodo(this.anio(), this.mes()).subscribe({
      next: (lista) => {
        if (n !== this.pedido) return;
        this.indicadores.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        if (n !== this.pedido) return;
        // sin datos del mes pedido: no dejar a la vista los del mes anterior
        this.indicadores.set([]);
        this.error.set(mensajeError(e, 'No se pudieron cargar los estándares.'));
        this.cargando.set(false);
      },
    });
  }

  cambiarPeriodo(anio: number, mes: number): void {
    this.anio.set(Number(anio));
    this.mes.set(Number(mes));
    this.mensaje.set('');
    this.cargar();
  }

  buscar(valor: string): void {
    this.filtro.set(valor ?? '');
    if (this.filtro().trim()) this.abiertos.set(new Set(this.visibles().map((i) => i.id)));
  }

  toggle(id: number): void {
    const s = new Set(this.abiertos());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.abiertos.set(s);
  }

  abrirTodos(abrir: boolean): void {
    this.abiertos.set(abrir ? new Set(this.visibles().map((i) => i.id)) : new Set());
  }

  /** Estándar que usa el cálculo en el mes elegido: el del mes si ya cerró y tiene valor; si no, el fijo. */
  efectivo(i: TmiEstandarPeriodo, k: TmiEstandarPeriodoClave): number | null {
    const v = i.mes_cerrado && k.mes ? k.mes : k.fijo;
    return v ? v : null;
  }

  /** El mes cerrado tiene un valor distinto del fijo (se cambió solo para ese mes). */
  mesDistinto(i: TmiEstandarPeriodo, k: TmiEstandarPeriodoClave): boolean {
    return i.mes_cerrado && !!k.mes && k.mes !== k.fijo;
  }

  etiquetaClave(i: TmiEstandarPeriodo, k: TmiEstandarPeriodoClave): string {
    // solo el código de la clave (I, II, III, H.N., CNSR ...)
    return k.descripcion || k.clave;
  }

  fmt(i: TmiEstandarPeriodo, v: number): string {
    return i.formato === 'PORCENTAJE' ? `${+(v * 100).toFixed(2)} %` : String(+v.toFixed(4));
  }

  // ---------- formulario flotante ----------
  abrirEdicion(i: TmiEstandarPeriodo): void {
    this.edicion.set(i.claves.map((k) => ({
      fuente: k.fuente,
      clave: k.clave,
      etiqueta: this.etiquetaClave(i, k),
      fijo: k.fijo,
      mes: i.mes_cerrado ? (k.mes || k.fijo) : null,
    })));
    this.errorForm.set('');
    this.editando.set(i);
  }

  cerrarEdicion(): void {
    if (this.guardando()) return;
    this.editando.set(null);
  }

  cambiarValor(idx: number, campo: 'fijo' | 'mes', valor: any): void {
    const n = valor === '' || valor == null ? null : Number(valor);
    this.edicion.update((lista) => lista.map((e, i) => (i === idx ? { ...e, [campo]: n } : e)));
  }

  guardar(): void {
    const i = this.editando();
    if (!i) return;
    const lista = this.edicion();
    if (lista.some((e) => e.fijo == null || e.fijo < 0 || (i.mes_cerrado && (e.mes == null || e.mes < 0)))) {
      this.errorForm.set('Complete todos los valores (0 = sin estándar).');
      return;
    }
    this.guardando.set(true);
    this.errorForm.set('');
    this.estandarSrv.putEstandarPeriodo(i.id, {
      anio: this.anio(),
      mes: this.mes(),
      valores: lista.map((e) => ({ fuente: e.fuente, clave: e.clave, fijo: e.fijo, mes: i.mes_cerrado ? e.mes : null })),
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.editando.set(null);
        this.mensaje.set(`Estándar de ${i.indicador} guardado para ${i.mes_cerrado ? this.nombreMes() + ' y el fijo de ' : ''}${this.anio()}. Se aplica desde el próximo cálculo.`);
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el estándar.'));
        this.guardando.set(false);
      },
    });
  }
}
