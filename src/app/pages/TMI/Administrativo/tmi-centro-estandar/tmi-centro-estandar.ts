import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AyudaFlotante } from '../ayuda-flotante';
import { TmiIndicadorService, TmiCentroService, TmiCentroEstandar, TmiCentroCatalogo, TmiIndicador, mensajeError } from '../../../../services/tmi';

export const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
export const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Estándar específico de un centro: gana sobre el estándar por tipo, nivel o categoría. */
@Component({
  selector: 'app-tmi-centro-estandar',
  imports: [AyudaFlotante, ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule, DecimalPipe],
  templateUrl: './tmi-centro-estandar.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css'],
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
  centrosFiltrados = computed(() => {
    const f = this.filtroCentro().trim().toLowerCase();
    const lista = this.centros();
    return f ? lista.filter((c) => `${c.codcentro} ${c.centro} ${c.red}`.toLowerCase().includes(f)) : lista;
  });

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

  ngOnInit(): void {
    this.cargar();
    this.centroSrv.getCentros().subscribe({ next: (c) => this.centros.set(c) });
    this.indicadorSrv.getIndicadores().subscribe({ next: (i) => this.indicadores.set(i) });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.centroSrv.getCentroEstandar(this.anio()).subscribe({
      next: (f) => {
        this.filas.set(f);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar los estándares por centro.'));
        this.loading.set(false);
      },
    });
  }

  cambiarAnio(valor: string): void {
    this.anio.set(Number(valor));
    this.cargar();
  }

  /** "16.2" si todos los meses tienen el mismo valor; si no, el rango. */
  resumenMeses(f: TmiCentroEstandar): string {
    if (!f.aplica) return 'No aplica (NA)';
    const vals = MESES.map((m) => (f as any)['est_' + m] as number | null);
    const distintos = [...new Set(vals.map((v) => (v == null ? '—' : String(v))))];
    return distintos.length === 1 ? distintos[0] : `${distintos.length} valores distintos`;
  }

  nuevo(): void {
    this.form.reset({ id: 0, codcentro: '', id_indicador: null, anio: this.anio(), aplica: true, acept: null, sustento: '' });
    this.valorTodos = null;
    this.filtroCentro.set('');
    this.errorForm.set('');
    this.mostrarForm.set(true);
  }

  editar(f: TmiCentroEstandar): void {
    this.form.reset({ ...f, id: f.id ?? 0, sustento: f.sustento ?? '' } as any);
    this.valorTodos = null;
    this.filtroCentro.set('');
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
    const num = (v: any) => (v == null || v === '' ? null : Number(v));
    const meses: Record<string, number | null> = {};
    MESES.forEach((m) => (meses['est_' + m] = f.aplica ? num((f as any)['est_' + m]) : null));
    if (f.aplica && Object.values(meses).every((v) => v == null)) {
      this.errorForm.set('Ingrese el estándar de al menos un mes.');
      return;
    }
    const dto = {
      codcentro: String(f.codcentro),
      id_indicador: Number(f.id_indicador),
      anio: Number(f.anio),
      aplica: !!f.aplica,
      ...meses,
      acept: f.aplica ? num(f.acept) : null,
      sustento: f.sustento || null,
    } as TmiCentroEstandar;
    this.guardando.set(true);
    const req = f.id ? this.centroSrv.putCentroEstandar(f.id, dto) : this.centroSrv.postCentroEstandar(dto);
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
