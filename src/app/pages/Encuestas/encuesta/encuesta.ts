import { LocalStorageService } from '../../../services/local-storage-service';
import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
import { Categoria, Modulo, Subcategoria, Variable } from '../../../model/encuesta';
import { ChangeDetectorRef } from '@angular/core';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { EncuestaService } from '../../../services/encuesta/encuesta-service';

type Calificacion = 'valido' | 'no_valido' | '';

type VariableEvaluada = Variable & {
  index: number;
  calificacion: Calificacion;
  observacion: string;
  /** La observación se muestra al marcar "No válido" o cuando el usuario la abre. */
  mostrarObservacion: boolean;
};

@Component({
  selector: 'app-encuesta',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './encuesta.html',
  styleUrl: './encuesta.css',
})
export class Encuesta implements OnInit, OnDestroy {
  readonly dialog = inject(MatDialog);

  nameCentro: string = '';

  // Estado de carga del catálogo
  cargando = true;
  errorCarga = '';
  private cargaSub?: Subscription;

  // Estado del guardado
  guardando = false;
  errorGuardado = '';
  ultimaGuardada = '';

  // Subcategorías ya guardadas en esta sesión
  subcategoriasGuardadas = new Set<number>();

  // Datos completos
  modulosCompleto: Modulo[] = [];
  categoriasCompleto: Categoria[] = [];
  subcategoriasCompleto: Subcategoria[] = [];
  variablesCompleto: Variable[] = [];

  // Estado de selección
  selectedModuloId: number | null = null;
  selectedModuloName: string = '';
  selectedCategoriaId: number | null = null;
  selectedCategoriaName: string = '';
  selectedSubcategoriaId: number | null = null;
  selectedSubcategoriaName: string = '';

  // Datos filtrados por cascada
  categoriasFiltradas: Categoria[] = [];
  subcategoriasFiltradas: Subcategoria[] = [];

  // Variables de la subcategoría seleccionada
  variablesConCalificacion: VariableEvaluada[] = [];

  readonly pasosGuia = [
    'Selecciona un módulo de consulta.',
    'Selecciona una categoría y luego una subcategoría.',
    'En cada variable marca Válido o No válido.',
    'Si marcas No válido, describe la observación en el campo correspondiente.',
    'Revisa el avance y finalmente presiona Guardar encuesta.',
  ];

  constructor(
    private encuestaService: EncuestaService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.nameCentro = this.dataImport.getDataCentro()?.nameCentro || '';
    this.getInfo();
  }

  ngOnDestroy(): void {
    this.cargaSub?.unsubscribe();
  }

  /** La app no usa zone.js: cada cambio de estado asíncrono pide detección de cambios. */
  getInfo(): void {
    this.cargaSub?.unsubscribe();
    this.cargando = true;
    this.errorCarga = '';
    this.cdr.markForCheck();

    this.cargaSub = forkJoin({
      modulos: this.encuestaService.getModulos(),
      categorias: this.encuestaService.getCategorias(),
      subcategorias: this.encuestaService.getSubcategorias(),
      variables: this.encuestaService.getVariables(),
    }).subscribe({
      next: (res) => {
        this.modulosCompleto = res.modulos || [];
        this.categoriasCompleto = res.categorias || [];
        this.subcategoriasCompleto = res.subcategorias || [];
        this.variablesCompleto = res.variables || [];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.cargando = false;
        this.errorCarga = this.describirError(err, 'cargar los módulos de la encuesta');
        this.cdr.markForCheck();
      },
    });
  }

  private describirError(err: unknown, accion: string): string {
    const status = err instanceof HttpErrorResponse ? err.status : -1;
    if (status === 0) {
      return `No se pudo conectar con el servidor para ${accion}. Verifique su conexión e intente de nuevo.`;
    }
    if (status === 401 || status === 403) {
      return `Su sesión no tiene permiso para ${accion}. Inicie sesión nuevamente.`;
    }
    if (status > 0) {
      return `El servidor respondió con un error (código ${status}) al ${accion}. Intente de nuevo.`;
    }
    return `Ocurrió un error inesperado al ${accion}. Intente de nuevo.`;
  }

  // ===== CONTEOS PARA LA NAVEGACIÓN =====

  contarCategorias(moduloId: number): number {
    return this.categoriasCompleto.filter((c) => c.id_modulo === moduloId).length;
  }

  contarSubcategorias(categoriaId: number): number {
    return this.subcategoriasCompleto.filter((s) => s.id_categoria === categoriaId).length;
  }

  contarVariables(subcategoriaId: number): number {
    return this.variablesCompleto.filter((v) => v.id_subcategoria === subcategoriaId).length;
  }

  get subcategoriasGuardadasEnCategoria(): number {
    return this.subcategoriasFiltradas.filter((s) => this.subcategoriasGuardadas.has(s.id)).length;
  }

  // ===== SELECCIÓN EN CASCADA =====

  selectModulo(modulo: Modulo): void {
    this.selectedModuloId = modulo.id;
    this.selectedModuloName = modulo.name_modulo;
    this.selectedCategoriaId = null;
    this.selectedCategoriaName = '';
    this.subcategoriasFiltradas = [];
    this.resetAlSubcategoria();
    this.subcategoriasGuardadas.clear();
    this.ultimaGuardada = '';

    this.categoriasFiltradas = this.categoriasCompleto.filter((cat) => cat.id_modulo === modulo.id);

    // Con una sola categoría no hay nada que elegir
    if (this.categoriasFiltradas.length === 1) {
      this.selectCategoria(this.categoriasFiltradas[0]);
    }
  }

  selectCategoria(categoria: Categoria): void {
    this.selectedCategoriaId = categoria.id;
    this.selectedCategoriaName = categoria.name_categoria;
    this.resetAlSubcategoria();
    this.ultimaGuardada = '';

    this.subcategoriasFiltradas = this.subcategoriasCompleto.filter(
      (subcat) => subcat.id_categoria === categoria.id,
    );
  }

  selectSubcategoria(subcategoria: Subcategoria): void {
    if (this.subcategoriasGuardadas.has(subcategoria.id)) {
      return;
    }

    this.selectedSubcategoriaId = subcategoria.id;
    this.selectedSubcategoriaName = subcategoria.name_categoria;
    this.errorGuardado = '';
    this.ultimaGuardada = '';

    this.variablesConCalificacion = this.variablesCompleto
      .filter((v) => v.id_subcategoria === subcategoria.id)
      .map((v, index) => ({
        ...v,
        index: index + 1,
        calificacion: '' as Calificacion,
        observacion: '',
        mostrarObservacion: false,
      }));
  }

  // ===== CALIFICACIÓN =====

  calificar(variable: VariableEvaluada, calificacion: Calificacion): void {
    variable.calificacion = calificacion;
    if (calificacion === 'no_valido') {
      variable.mostrarObservacion = true;
    }
    this.errorGuardado = '';
  }

  get totalCalificadas(): number {
    return this.variablesConCalificacion.filter((v) => !!v.calificacion).length;
  }

  get totalNoValidas(): number {
    return this.variablesConCalificacion.filter((v) => v.calificacion === 'no_valido').length;
  }

  get faltantes(): number {
    return this.variablesConCalificacion.length - this.totalCalificadas;
  }

  get progreso(): number {
    const total = this.variablesConCalificacion.length;
    return total ? Math.round((this.totalCalificadas / total) * 100) : 0;
  }

  trackVariable = (_: number, variable: VariableEvaluada) => variable.id;

  // ===== GUARDADO =====

  guardarEncuesta(): void {
    if (!this.selectedModuloId || !this.selectedCategoriaId || !this.selectedSubcategoriaId
      || this.variablesConCalificacion.length === 0) {
      this.errorGuardado = 'Selecciona módulo, categoría y subcategoría antes de guardar.';
      return;
    }

    if (this.faltantes > 0) {
      this.errorGuardado = `Faltan ${this.faltantes} variable${this.faltantes === 1 ? '' : 's'} por calificar.`;
      return;
    }

    const dataCentro = this.dataImport.getDataCentro();
    const user = this.dataImport.getUser();
    const id_user = user?.id ?? 0;
    const codcas = dataCentro?.codcas;

    if (!id_user || !codcas) {
      this.errorGuardado = 'No se encontró el usuario o el centro de la sesión. Vuelve a iniciar sesión e intenta de nuevo.';
      return;
    }

    const dialogRef = this.dialog.open(EncuestaConfirmDialogComponent, {
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'dialog',
      data: {
        subcategoria: this.selectedSubcategoriaName,
        categoria: this.selectedCategoriaName,
        totalVariables: this.variablesConCalificacion.length,
        totalNoValidas: this.totalNoValidas,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const subcategoriaId = this.selectedSubcategoriaId!;
      const subcategoriaNombre = this.selectedSubcategoriaName;
      this.guardando = true;
      this.errorGuardado = '';
      this.cdr.markForCheck();

      const requests = this.variablesConCalificacion.map((variable) =>
        this.encuestaService.createEncuesta({
          id: 0,
          codcas: codcas,
          status: variable.calificacion,
          comment: variable.observacion?.trim() || '',
          date_creation: '',
          id_user: id_user,
          id_modulo: this.selectedModuloId,
          id_categoria: this.selectedCategoriaId,
          id_subcategoria: subcategoriaId,
          id_variable: variable.id,
        }),
      );

      forkJoin(requests).subscribe({
        next: () => {
          this.guardando = false;
          this.subcategoriasGuardadas.add(subcategoriaId);
          this.resetAlSubcategoria();
          this.ultimaGuardada = subcategoriaNombre;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al guardar encuesta:', err);
          this.guardando = false;
          this.errorGuardado = this.describirError(err, 'guardar la encuesta');
          this.cdr.markForCheck();
        },
      });
    });
  }

  // Vuelve al nivel de subcategorías sin salir de la categoría seleccionada
  resetAlSubcategoria(): void {
    this.selectedSubcategoriaId = null;
    this.selectedSubcategoriaName = '';
    this.variablesConCalificacion = [];
    this.errorGuardado = '';
  }

  // Vuelve completamente al inicio (selección de módulo)
  resetForm(): void {
    this.selectedModuloId = null;
    this.selectedModuloName = '';
    this.selectedCategoriaId = null;
    this.selectedCategoriaName = '';
    this.categoriasFiltradas = [];
    this.subcategoriasFiltradas = [];
    this.resetAlSubcategoria();
    this.subcategoriasGuardadas.clear();
    this.ultimaGuardada = '';
  }
}

// ===== DIÁLOGO DE CONFIRMACIÓN =====
@Component({
  selector: 'encuesta-confirm-dialog',
  template: `
    <div class="enc-dialog">
      <h2 mat-dialog-title class="enc-dialog__title">Guardar evaluación</h2>
      <mat-dialog-content class="enc-dialog__body">
        <p>
          Se guardará la evaluación de <strong>{{ data.subcategoria }}</strong>
          ({{ data.categoria }}). Una vez guardada no se puede modificar.
        </p>
        <dl class="enc-dialog__summary">
          <div>
            <dt>Variables</dt>
            <dd>{{ data.totalVariables }}</dd>
          </div>
          <div>
            <dt>Válidas</dt>
            <dd>{{ data.totalVariables - data.totalNoValidas }}</dd>
          </div>
          <div>
            <dt>No válidas</dt>
            <dd [class.is-bad]="data.totalNoValidas > 0">{{ data.totalNoValidas }}</dd>
          </div>
        </dl>
      </mat-dialog-content>
      <mat-dialog-actions class="enc-dialog__actions">
        <button type="button" class="enc-btn enc-btn--ghost" (click)="onCancel()">Seguir revisando</button>
        <button type="button" class="enc-btn enc-btn--primary" (click)="onConfirm()">Guardar evaluación</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .enc-dialog {
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #17324d;
    }

    .enc-dialog__title {
      margin: 0;
      padding: 22px 24px 4px;
      font-family: inherit;
      font-size: 19px;
      font-weight: 700;
      color: #17324d;
    }

    .enc-dialog__body {
      padding: 8px 24px 4px;
      font-size: 14px;
      line-height: 1.55;
      color: #34495e;
    }

    .enc-dialog__body p {
      margin: 0 0 16px;
    }

    .enc-dialog__summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 0;
      border: 1px solid #dfe6ee;
      border-radius: 10px;
    }

    .enc-dialog__summary div {
      padding: 10px 14px;
    }

    .enc-dialog__summary div + div {
      border-left: 1px solid #edf1f5;
    }

    .enc-dialog__summary dt {
      font-size: 12px;
      color: #56697d;
    }

    .enc-dialog__summary dd {
      margin: 2px 0 0;
      font-size: 20px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #17324d;
    }

    .enc-dialog__summary dd.is-bad {
      color: #b3122b;
    }

    .enc-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px 20px;
    }

    .enc-btn {
      height: 38px;
      padding: 0 16px;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .enc-btn:focus-visible {
      outline: 2px solid #0064af;
      outline-offset: 2px;
    }

    .enc-btn--ghost {
      color: #17324d;
      background: #ffffff;
      border: 1px solid #c6d2de;
    }

    .enc-btn--ghost:hover {
      background: #f8fafc;
    }

    .enc-btn--primary {
      color: #ffffff;
      background: #0064af;
      border: 1px solid #0064af;
    }

    .enc-btn--primary:hover {
      background: #004f8c;
      border-color: #004f8c;
    }
  `],
  imports: [
    CommonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuestaConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EncuestaConfirmDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  onConfirm(): void { this.dialogRef.close(true); }
  onCancel(): void { this.dialogRef.close(false); }
}
