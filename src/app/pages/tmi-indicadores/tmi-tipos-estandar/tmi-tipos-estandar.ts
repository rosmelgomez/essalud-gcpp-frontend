import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiCentroCatalogo,
  TmiDinamicoService,
  TmiEstandarClave,
  TmiIndicador,
  TmiTipoEstandar,
  TmiValorEstandar,
  mensajeError,
} from '../../../services/tmi-dinamico-service';

type Fuente = TmiEstandarClave['fuente'];
type FilaValor = TmiValorEstandar & { meses: (number | null)[]; anual: number | null; cambiado: boolean };

/** Estándares: tablas maestras (tipos de estándar y sus claves) y los valores de cada indicador por clave y mes. */
@Component({
  selector: 'app-tmi-tipos-estandar',
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './tmi-tipos-estandar.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiTiposEstandar implements OnInit {
  private srv = inject(TmiDinamicoService);

  readonly fuentes: { valor: Fuente; texto: string }[] = [
    { valor: 'NIVEL', texto: 'Nivel (tmi_estandar_nivel)' },
    { valor: 'TIPO', texto: 'Tipo (tmi_estandar_tipo)' },
    { valor: 'CATEGORIA', texto: 'Categoría (tmi_estandar_categoria)' },
  ];

  tipos = signal<TmiTipoEstandar[]>([]);
  claves = signal<TmiEstandarClave[]>([]);
  centros = signal<TmiCentroCatalogo[]>([]);
  seleccionado = signal<string | null>(null);
  clavesTipo = computed(() => this.claves().filter((c) => c.tipo_estandar === this.seleccionado()));

  loading = signal(false);
  error = signal('');
  guardando = signal(false);
  errorForm = signal('');
  mostrarTipo = signal(false);
  mostrarClave = signal(false);

  // estándares por indicador: claves del tipo con que se evalúa y su valor por mes (tabla de nivel, tipo o categoría)
  readonly mesesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  readonly anios = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() + 1 - i);
  indicadores = signal<TmiIndicador[]>([]);
  idIndicador = signal<number | null>(null);
  indicadorSel = computed(() => this.indicadores().find((i) => i.id === this.idIndicador()) ?? null);
  anio = signal(new Date().getFullYear());
  valores = signal<FilaValor[]>([]);
  cargandoValores = signal(false);
  guardandoValor = signal<number | null>(null);
  errorValores = signal('');

  tipo: TmiTipoEstandar = this.tipoVacio();
  clave: TmiEstandarClave = this.claveVacia();

  ngOnInit(): void {
    this.cargar();
    this.srv.getCentros().subscribe({ next: (c) => this.centros.set(c) });
    this.srv.getIndicadores().subscribe({
      next: (lista) => {
        this.indicadores.set(lista);
        if (lista.length && this.idIndicador() == null) this.elegirIndicador(lista[0].id ?? null);
      },
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.srv.getTiposEstandar().subscribe({
      next: (t) => {
        this.tipos.set(t);
        if (!this.seleccionado() && t.length) this.seleccionado.set(t[0].codigo);
        this.loading.set(false);
        this.cargarValores();
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar los tipos de estándar.'));
        this.loading.set(false);
      },
    });
    this.srv.getEstandarClaves().subscribe({
      next: (c) => this.claves.set(c),
      error: (e) => this.error.set(mensajeError(e, 'No se pudo cargar las claves.')),
    });
  }

  /** Valores que tienen hoy los centros para la fuente elegida (para elegir la clave). */
  valoresCentro(fuente: Fuente): string[] {
    const campo = fuente === 'NIVEL' ? 'nivel' : fuente === 'TIPO' ? 'tipo' : 'categoria';
    return [...new Set(this.centros().map((c) => (c as any)[campo] as string).filter(Boolean))].sort();
  }

  // tipos
  private tipoVacio(): TmiTipoEstandar {
    return { codigo: '', descripcion: '', orden: null, activo: true };
  }

  nuevoTipo(): void {
    this.tipo = { ...this.tipoVacio(), orden: Math.max(0, ...this.tipos().map((t) => t.orden ?? 0)) + 1 };
    this.errorForm.set('');
    this.mostrarTipo.set(true);
  }

  editarTipo(t: TmiTipoEstandar, ev?: Event): void {
    ev?.stopPropagation();
    this.tipo = { ...t };
    this.errorForm.set('');
    this.mostrarTipo.set(true);
  }

  guardarTipo(): void {
    const t = this.tipo;
    t.codigo = (t.codigo || '').trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(t.codigo) || !t.descripcion?.trim()) {
      this.errorForm.set('Ingrese el código (solo A-Z, 0-9 y _) y la descripción.');
      return;
    }
    const dto: TmiTipoEstandar = { codigo: t.codigo, descripcion: t.descripcion.trim(), orden: t.orden == null ? null : Number(t.orden), activo: !!t.activo };
    this.guardando.set(true);
    (t.id ? this.srv.putTipoEstandar(t.id, dto) : this.srv.postTipoEstandar(dto)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarTipo.set(false);
        this.seleccionado.set(dto.codigo);
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el tipo (si lo usa un indicador, no se puede cambiar su código).'));
        this.guardando.set(false);
      },
    });
  }

  eliminarTipo(t: TmiTipoEstandar, ev?: Event): void {
    ev?.stopPropagation();
    if (!t.id || !confirm(`¿Eliminar el tipo de estándar "${t.descripcion}"?`)) return;
    this.srv.deleteTipoEstandar(t.id).subscribe({
      next: () => {
        if (this.seleccionado() === t.codigo) this.seleccionado.set(null);
        this.cargar();
      },
      error: (e) => this.error.set(mensajeError(e, 'No se pudo eliminar: el tipo tiene claves o lo usa un indicador.')),
    });
  }

  // claves
  private claveVacia(): TmiEstandarClave {
    return { tipo_estandar: '', orden: null, fuente: 'NIVEL', clave: '', descripcion: '', prioridad: 1, activo: true };
  }

  nuevaClave(): void {
    const tipo = this.seleccionado();
    if (!tipo) return;
    this.clave = { ...this.claveVacia(), tipo_estandar: tipo, orden: Math.max(0, ...this.clavesTipo().map((c) => c.orden ?? 0)) + 1 };
    this.errorForm.set('');
    this.mostrarClave.set(true);
  }

  editarClave(c: TmiEstandarClave): void {
    this.clave = { ...c };
    this.errorForm.set('');
    this.mostrarClave.set(true);
  }

  guardarClave(): void {
    const c = this.clave;
    if (!c.clave?.trim()) {
      this.errorForm.set('Elija el valor del centro (clave).');
      return;
    }
    const dto: TmiEstandarClave = {
      tipo_estandar: c.tipo_estandar, orden: c.orden == null ? null : Number(c.orden), fuente: c.fuente,
      clave: c.clave.trim(), descripcion: c.descripcion?.trim() || null, prioridad: Number(c.prioridad || 1), activo: !!c.activo,
    };
    this.guardando.set(true);
    (c.id ? this.srv.putEstandarClave(c.id, dto) : this.srv.postEstandarClave(dto)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarClave.set(false);
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar la clave (¿ya existe esa clave en el tipo?).'));
        this.guardando.set(false);
      },
    });
  }

  eliminarClave(c: TmiEstandarClave): void {
    if (!c.id || !confirm(`¿Quitar la clave ${c.descripcion || c.clave} del tipo ${c.tipo_estandar}?`)) return;
    this.srv.deleteEstandarClave(c.id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(mensajeError(e, 'No se pudo quitar la clave.')),
    });
  }

  // estándares por indicador
  textoTipo(codigo: string | null | undefined): string {
    return this.tipos().find((t) => t.codigo === codigo)?.descripcion ?? codigo ?? '—';
  }

  elegirIndicador(id: number | null): void {
    this.idIndicador.set(id == null ? null : Number(id));
    this.cargarValores();
  }

  cambiarAnio(anio: number): void {
    this.anio.set(Number(anio));
    this.cargarValores();
  }

  cargarValores(): void {
    const id = this.idIndicador();
    if (id == null) return;
    this.cargandoValores.set(true);
    this.errorValores.set('');
    this.srv.getValoresEstandar(id, this.anio()).subscribe({
      next: (filas) => {
        this.valores.set(filas.map((f) => ({
          ...f,
          meses: this.mesesCorto.map((_, k) => f[`est_${String(k + 1).padStart(2, '0')}`] ?? null),
          anual: null,
          cambiado: false,
        })));
        this.cargandoValores.set(false);
      },
      error: (e) => {
        this.errorValores.set(mensajeError(e, 'No se pudo cargar los estándares del indicador.'));
        this.cargandoValores.set(false);
      },
    });
  }

  cambiarMes(fila: FilaValor, k: number, valor: any): void {
    fila.meses[k] = valor === '' || valor == null ? null : Number(valor);
    fila.cambiado = true;
    this.valores.update((v) => [...v]);
  }

  /** Copia el valor "todo el año" a los 12 meses de la fila. */
  aplicarAnual(fila: FilaValor): void {
    if (fila.anual == null || (fila.anual as any) === '') return;
    fila.meses = fila.meses.map(() => Number(fila.anual));
    fila.cambiado = true;
    this.valores.update((v) => [...v]);
  }

  guardarValor(fila: FilaValor): void {
    const id = this.idIndicador();
    if (id == null) return;
    const dto: { anio: number; fuente: string; clave: string; [mes: string]: any } = { anio: this.anio(), fuente: fila.fuente, clave: fila.clave };
    fila.meses.forEach((v, k) => (dto[`est_${String(k + 1).padStart(2, '0')}`] = v));
    this.guardandoValor.set(fila.id_clave);
    this.errorValores.set('');
    this.srv.putValorEstandar(id, dto).subscribe({
      next: () => {
        this.guardandoValor.set(null);
        this.cargarValores();
      },
      error: (e) => {
        this.errorValores.set(mensajeError(e, 'No se pudo guardar el estándar.'));
        this.guardandoValor.set(null);
      },
    });
  }

  textoFuente(f: Fuente): string {
    return f === 'NIVEL' ? 'Nivel' : f === 'TIPO' ? 'Tipo' : 'Categoría';
  }
}
