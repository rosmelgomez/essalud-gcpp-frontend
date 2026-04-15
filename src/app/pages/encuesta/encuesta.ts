import { DataImport } from '../../services/localstorage-service';
import { Component, OnInit, inject, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EncuestaService } from '../../services/encuesta-service';
import { Categoria } from '../../model/categoria';
import { Modulo } from '../../model/modulo';
import { Subcategoria } from '../../model/subcategoria';
import { Variable } from '../../model/variable';
import { ChangeDetectorRef } from '@angular/core';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-encuesta',
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './encuesta.html',
  styleUrl: './encuesta.css',
})
export class Encuesta implements OnInit {
  readonly dialog = inject(MatDialog);

  nameCentro: string = '';

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

  // Variables para el módulo/subcategoría seleccionada
  currentVariableIndex: number = -1;
  variablesConCalificacion: Array<Variable & { index: number; calificacion: 'valido' | 'no_valido' | ''; observacion: string }> = [];

  constructor(
    private encuestaService: EncuestaService,
    private dataImport: DataImport,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getInfo();
    this.nameCentro = this.dataImport.getDataCentro()?.nameCentro || '';
  }

  getInfo(): void {
    forkJoin({
      modulos: this.encuestaService.getModulos(),
      categorias: this.encuestaService.getCategorias(),
      subcategorias: this.encuestaService.getSubcategorias(),
      variables: this.encuestaService.getVariables()
    }).subscribe({
      next: (res) => {
        this.modulosCompleto = res.modulos;
        this.categoriasCompleto = res.categorias;
        this.subcategoriasCompleto = res.subcategorias;
        this.variablesCompleto = res.variables;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
      }
    });
  }

  // ===== MÉTODOS PARA SELECCIONAR MÓDULO =====
  selectModulo(modulo: Modulo): void {
    this.selectedModuloId = modulo.id;
    this.selectedModuloName = modulo.name_modulo;
    this.currentVariableIndex = -1;
    this.selectedCategoriaId = null;
    this.selectedCategoriaName = '';
    this.selectedSubcategoriaId = null;
    this.selectedSubcategoriaName = '';
    this.variablesConCalificacion = [];
    this.subcategoriasGuardadas.clear();

    // Filtrar categorías por módulo
    this.categoriasFiltradas = this.categoriasCompleto.filter(
      (cat) => cat.id_modulo === modulo.id
    );
  }

  // ===== MÉTODOS PARA SELECCIONAR CATEGORÍA =====
  selectCategoria(categoria: Categoria): void {
    this.selectedCategoriaId = categoria.id;
    this.selectedCategoriaName = categoria.name_categoria;
    this.selectedSubcategoriaId = null;
    this.selectedSubcategoriaName = '';
    this.currentVariableIndex = -1;
    this.variablesConCalificacion = [];

    // Filtrar subcategorías por categoría
    this.subcategoriasFiltradas = this.subcategoriasCompleto.filter(
      (subcat) => subcat.id_categoria === categoria.id
    );
  }

  // ===== MÉTODOS PARA SELECCIONAR SUBCATEGORÍA =====
  selectSubcategoria(subcategoria: Subcategoria): void {
    this.selectedSubcategoriaId = subcategoria.id;
    this.selectedSubcategoriaName = subcategoria.name_categoria;
    this.currentVariableIndex = -1;

    const variables = this.variablesCompleto.filter(
      (v) => v.id_subcategoria === subcategoria.id
    );

    this.variablesConCalificacion = variables.map((v, index) => ({
      ...v,
      index: index + 1,
      calificacion: '',
      observacion: ''
    }));

    if (this.variablesConCalificacion.length > 0) {
      this.currentVariableIndex = 0;
    }
  }

  getCurrentVariable(): (Variable & { index: number; calificacion: 'valido' | 'no_valido' | ''; observacion: string }) | null {
    if (this.currentVariableIndex >= 0 && this.currentVariableIndex < this.variablesConCalificacion.length) {
      return this.variablesConCalificacion[this.currentVariableIndex];
    }
    return null;
  }

  irAnterior(): void {
    if (this.currentVariableIndex > 0) {
      this.currentVariableIndex--;
    }
  }

  irSiguiente(): void {
    if (this.currentVariableIndex < this.variablesConCalificacion.length - 1) {
      this.currentVariableIndex++;
    }
  }

  // ===== MÉTODOS DE GUARDADO Y RESET =====
  guardarEncuesta(): void {
    if (!this.selectedModuloId || !this.selectedCategoriaId || !this.selectedSubcategoriaId || this.variablesConCalificacion.length === 0) {
      alert('Por favor selecciona módulo, categoría, subcategoría y variables');
      return;
    }

    const variablesSinCalificar = this.variablesConCalificacion.filter(
      v => !v.calificacion || v.calificacion.trim() === ''
    );
    if (variablesSinCalificar.length > 0) {
      alert('Por favor califica todas las variables');
      return;
    }

    const dataCentro = this.dataImport.getDataCentro();
    const user = this.dataImport.getUser();
    const id_user = user?.id ?? 0;
    const codcas = dataCentro?.codcas;

    if (!id_user || !codcas) {
      alert('No se encontraron id_user o codcas en DataImport');
      return;
    }

    const dialogRef = this.dialog.open(EncuestaConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Guardar Encuesta',
        message: `¿Estás seguro de que deseas guardar la evaluación para la categoría "${this.selectedCategoriaName}"? Esta acción no se puede deshacer.`,
        totalVariables: this.variablesConCalificacion.length,
      },
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const subcategoriaGuardadaId = this.selectedSubcategoriaId!;

      const requests = this.variablesConCalificacion.map(variable =>
        this.encuestaService.createEncuesta({
          id: 0,
          codcas: codcas,
          status: variable.calificacion,
          comment: variable.observacion || '',
          date_creation: '',
          id_user: id_user,
          id_modulo: this.selectedModuloId,
          id_categoria: this.selectedCategoriaId,
          id_subcategoria: this.selectedSubcategoriaId,
          id_variable: variable.id
        })
      );

      forkJoin(requests).subscribe({
        next: () => {
          this.subcategoriasGuardadas.add(subcategoriaGuardadaId);
          this.resetAlSubcategoria();
        },
        error: (err) => {
          console.error('Error al guardar encuesta:', err);
          alert('Ocurrió un error al guardar la encuesta. Intenta nuevamente.');
        }
      });
    });
  }

  // Vuelve al nivel de subcategorías sin salir de la categoría seleccionada
  resetAlSubcategoria(): void {
    this.selectedSubcategoriaId = null;
    this.selectedSubcategoriaName = '';
    this.currentVariableIndex = -1;
    this.variablesConCalificacion = [];
  }

  // Vuelve completamente al inicio (selección de módulo)
  resetForm(): void {
    this.selectedModuloId = null;
    this.selectedModuloName = '';
    this.selectedCategoriaId = null;
    this.selectedCategoriaName = '';
    this.selectedSubcategoriaId = null;
    this.selectedSubcategoriaName = '';
    this.categoriasFiltradas = [];
    this.subcategoriasFiltradas = [];
    this.currentVariableIndex = -1;
    this.variablesConCalificacion = [];
    this.subcategoriasGuardadas.clear();
  }
}

// ===== COMPONENTE DE DIÁLOGO DE CONFIRMACIÓN PARA ENCUESTA =====
@Component({
  selector: 'encuesta-confirm-dialog',
  template: `
    <div class="enc-dialog-container">
      <div class="enc-dialog-header">
        <mat-icon class="enc-dialog-icon">save_alt</mat-icon>
        <h2 mat-dialog-title class="enc-dialog-title">{{ data.title }}</h2>
      </div>
      <mat-dialog-content class="enc-dialog-message">
        <p>{{ data.message }}</p>
        <div class="enc-dialog-summary">
          <mat-icon class="enc-summary-icon">checklist</mat-icon>
          <span>{{ data.totalVariables }} variable{{ data.totalVariables !== 1 ? 's' : '' }} a guardar</span>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions class="enc-dialog-actions">
        <button mat-stroked-button class="enc-btn-cancel" (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="primary" class="enc-btn-confirm" (click)="onConfirm()">
          <mat-icon>save</mat-icon>
          Guardar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .enc-dialog-container { width: 100%; }

    .enc-dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      border-radius: 8px 8px 0 0;
      background: linear-gradient(135deg, #0f766e 0%, #25a391 100%);
      color: white;
    }

    .enc-dialog-icon { font-size: 28px; width: 28px; height: 28px; }

    .enc-dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .enc-dialog-message {
      padding: 20px 24px 12px;
      font-size: 15px;
      line-height: 1.6;
      color: rgba(0,0,0,0.85);
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .enc-dialog-message p { margin: 0 0 14px; }

    .enc-dialog-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e6f6f4;
      border: 1px solid #b2dfdb;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 600;
      color: #0f766e;
    }

    .enc-summary-icon { font-size: 20px; width: 20px; height: 20px; color: #0f766e; }

    .enc-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background-color: #fafafa;
      border-radius: 0 0 8px 8px;
    }

    .enc-btn-cancel {
      min-width: 110px;
      height: 40px;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      transition: all 0.25s ease;
    }

    .enc-btn-cancel:hover {
      background-color: #e0e0e0;
      transform: translateY(-1px);
    }

    .enc-btn-confirm {
      min-width: 110px;
      height: 40px;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      transition: all 0.25s ease;
    }

    .enc-btn-confirm:hover { transform: translateY(-1px); }

    button mat-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; }

    ::ng-deep .mat-mdc-dialog-container {
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
  `],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuestaConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EncuestaConfirmDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  onConfirm(): void { this.dialogRef.close(true); }
  onCancel(): void { this.dialogRef.close(false); }
}
