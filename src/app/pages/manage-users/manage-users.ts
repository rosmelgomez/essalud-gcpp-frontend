import { Component, inject, ChangeDetectionStrategy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { UsersService } from '../../services/users-service';
import { OnInit, ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import { CentroService } from '../../services/centro-service';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';


@Component({
  selector: 'app-manage-users',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    ScrollingModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers implements OnInit {
  readonly dialog = inject(MatDialog);

  isLoading: boolean = true;
  private pendingLoads = 0;

  allUser: any[] = [];
  allUserOriginal: any[] = [];
  editingRowKey: string | number | null = null;
  editableRow: any | null = null;

  dataRed: any[] = [];
  dataCentroCompleto: any[] = [];
  editingAllCentroForSelectedRed: any[] = [];  // Lista completa de centros de la red seleccionada
  editingRedEnabled: boolean = false;
  editingCentroEnabled: boolean = false;

  private redNameByCode: Record<string, string> = {};
  private centroNameByCode: Record<string, string> = {};

  dateCreationFilter: Date | null = null;
  dateUpdateFilter: Date | null = null;

  filters = {
    id: '',
    name: '',
    lastname: '',
    dni: '',
    codcas: '',
    code_red: '',
    role: '',
    username: '',
    password: '',
    date_creation: '',
    date_update: '',
    flag: '',
  };

  constructor(
    private userservice: UsersService,
    private centroService: CentroService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.getDataRedCentro();
  }


  formatDate(date: any): string {
    if (!date) return '';
    try {
      const dateStr = String(date).trim();
      // Formato ISO: YYYY-MM-DDTHH:mm:ss.mmmmmZ
      const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        return `${day}/${month}/${year} ${hour}:${minute}`;
      }
      return dateStr;
    } catch (e) {
      return '';
    }
  }

  getDataRedCentro(): void {

    forkJoin({
      red: this.centroService.getRed(),
      centro: this.centroService.getCentrosWithRed(),
    }).subscribe({
      next: ({ red, centro }) => {
        this.dataRed = red;
        this.dataCentroCompleto = centro;
        // Cache names for quick lookup in the table and filters.
        this.redNameByCode = red.reduce((acc: Record<string, string>, item: any) => {
          acc[String(item.redasiscod)] = item.redasisdes;
          return acc;
        }, {});
        this.centroNameByCode = centro.reduce((acc: Record<string, string>, item: any) => {
          acc[String(item.cenasicod)] = item.cenasides;
          return acc;
        }, {});
        this.isLoading = false;
      }
      ,
      error: (err) => {
        console.error('Error fetching data:', err);
        this.isLoading = false;
      }
    });
  }


  loadData(): void {
    this.userservice.getAllUsers().subscribe({
      next: (data) => {
        this.allUser = data;
        this.allUserOriginal = data;
        this.cdr.detectChanges();
        this.isLoading = false;
      }
      ,
      error: (err) => {
        console.error('Error fetching data:', err);
        this.isLoading = false;
      }
    });
  }

  private getRowKey(row: any): string | number {
    return row?.id ?? row?.username;
  }

  isEditing(row: any): boolean {
    return this.editingRowKey === this.getRowKey(row);
  }

  startEdit(row: any): void {
    this.editingRowKey = this.getRowKey(row);
    this.editableRow = { ...row };
    this.initializeEditingDropdowns();
  }

  initializeEditingDropdowns(): void {
    if (!this.editableRow) return;

    // USER: codcas (cenasicod) es la fuente para inferir red (redasiscod).
    if (this.editableRow.role === 'USER' && this.editableRow.codcas) {
      this.syncUserRedFromCodcas();
    }

    this.applyEditingRoleRules(this.editableRow.role);
  }

  onEditingRoleChange(): void {
    if (!this.editableRow) {
      return;
    }

    this.applyEditingRoleRules(this.editableRow.role);
  }

  private applyEditingRoleRules(role: string): void {
    if (!this.editableRow) {
      return;
    }

    if (role === 'ADMIN') {
      this.editingRedEnabled = false;
      this.editingCentroEnabled = false;
      this.editingAllCentroForSelectedRed = [];
      this.editableRow.code_red = '';
      this.editableRow.codcas = '';
      return;
    }

    if (role === 'ADMIN_RED') {
      this.editingRedEnabled = true;
      this.editingCentroEnabled = false;
      this.editingAllCentroForSelectedRed = [];
      this.editableRow.codcas = '';
      return;
    }

    if (role === 'USER') {
      this.editingRedEnabled = true;
      this.editingCentroEnabled = true;
      this.updateEditingCentrosByRed(this.editableRow.code_red, false);
      return;
    }

    this.editingRedEnabled = false;
    this.editingCentroEnabled = false;
    this.editingAllCentroForSelectedRed = [];
  }

  private updateEditingCentrosByRed(redCode?: string, clearSelectedCentro = true): void {
    if (!this.editableRow || this.editableRow.role !== 'USER') {
      this.editingAllCentroForSelectedRed = [];
      return;
    }

    const normalizedRed = this.normalizeCode(redCode);
    this.editingAllCentroForSelectedRed = normalizedRed
      ? this.dataCentroCompleto.filter(
        (centro: any) => this.normalizeCode(centro.redasiscod) === normalizedRed,
      )
      : [...this.dataCentroCompleto];

    if (clearSelectedCentro) {
      this.editableRow.codcas = '';
      return;
    }

    // Si el centro actual no pertenece a la red activa, se limpia.
    const currentCentro = this.findCentroByCode(this.editableRow.codcas);
    if (
      this.editableRow.codcas &&
      (!currentCentro ||
        this.normalizeCode(currentCentro.redasiscod) !== this.normalizeCode(this.editableRow.code_red))
    ) {
      this.editableRow.codcas = '';
    }
  }

  getEditingCentroPlaceholder(): string {
    if (!this.editableRow) {
      return 'Selecciona un centro';
    }

    if (this.editableRow.role === 'ADMIN_RED') {
      return 'No aplica para esta red';
    }

    if (this.editableRow.role === 'ADMIN') {
      return 'No aplica para este rol';
    }

    return 'Selecciona un centro';
  }

  getEditingRedPlaceholder(): string {
    if (!this.editableRow) {
      return 'Seleccionar red...';
    }

    if (this.editableRow.role === 'ADMIN') {
      return 'No aplica para este rol';
    }

    return 'Seleccionar red...';
  }

  onEditingRedChange(): void {
    if (!this.editableRow) {
      return;
    }

    if (this.editableRow.role !== 'USER') {
      if (this.editableRow.role === 'ADMIN_RED') {
        this.editableRow.codcas = '';
      }
      return;
    }

    this.updateEditingCentrosByRed(this.editableRow.code_red, true);
  }

  onEditingCentroChange(): void {
    if (!this.editableRow || this.editableRow.role !== 'USER') {
      return;
    }

    const centroSeleccionado = this.findCentroByCode(this.editableRow.codcas);
    if (!centroSeleccionado) {
      return;
    }

    // USER: al seleccionar centro, sincronizar automáticamente su red.
    this.editableRow.code_red = String(centroSeleccionado.redasiscod ?? '');
    this.editingAllCentroForSelectedRed = this.dataCentroCompleto.filter(
      (centro: any) => this.normalizeCode(centro.redasiscod) === this.normalizeCode(this.editableRow.code_red),
    );
  }

  private syncUserRedFromCodcas(): void {
    if (!this.editableRow || this.editableRow.role !== 'USER' || !this.editableRow.codcas) {
      return;
    }

    const centroSeleccionado = this.findCentroByCode(this.editableRow.codcas);
    if (!centroSeleccionado) {
      return;
    }

    this.editableRow.code_red = String(centroSeleccionado.redasiscod ?? '');
  }

  private isUserRedCentroSelectionValid(): boolean {
    if (!this.editableRow || this.editableRow.role !== 'USER') {
      return true;
    }

    if (!this.editableRow.code_red || !this.editableRow.codcas) {
      return false;
    }

    const centroSeleccionado = this.findCentroByCode(this.editableRow.codcas);
    if (!centroSeleccionado) {
      return false;
    }

    return String(centroSeleccionado.redasiscod ?? '') === String(this.editableRow.code_red ?? '');
  }

  isUpdateDisabled(): boolean {
    if (!this.editableRow) {
      return true;
    }

    return !this.isUserRedCentroSelectionValid();
  }

  private findCentroByCode(codcas: unknown): any | undefined {
    return this.dataCentroCompleto.find(
      (centro: any) => this.normalizeCode(centro.cenasicod) === this.normalizeCode(codcas),
    );
  }

  private normalizeCode(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  cancelEdit(): void {
    this.editingRowKey = null;
    this.editableRow = null;
    this.editingRedEnabled = false;
    this.editingCentroEnabled = false;
    this.editingAllCentroForSelectedRed = [];
    this.cdr.detectChanges();
  }
  // Lookup helpers to display labels instead of codes.
  getRedName(code: string | number | null | undefined): string {
    const key = String(code ?? '');
    return this.redNameByCode[key] || key;
  }

  getCentroName(code: string | number | null | undefined): string {
    const key = String(code ?? '');
    return this.centroNameByCode[key] || key;
  }

  getFlagLabel(flag: string | number | boolean | null | undefined): string {
    if (flag === 1 || flag === '1' || flag === true) {
      return 'Activo';
    }
    if (flag === 0 || flag === '0' || flag === false) {
      return 'Inactivo';
    }
    return 'Inactivo';
  }

  updateUser(): void {
    // USER debe tener red y centro seleccionados para permitir actualizar.
    if (!this.isUserRedCentroSelectionValid()) {
      alert('Para rol USER debes seleccionar Red y Centro válidos (codcas equivale a cenasicod).');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar actualización',
        message: '¿Estás seguro de que deseas actualizar este usuario?',
      },
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.editableRow) {
          if (this.editableRow.role === 'ADMIN') {
            this.editableRow.code_red = '';
            this.editableRow.codcas = '';
          }

          if (this.editableRow.role === 'ADMIN_RED') {
            this.editableRow.codcas = '';
          }

          if (this.editableRow.role === 'USER') {
            this.editableRow.code_red = '';
          }

          this.editableRow.flag = this.editableRow.flag === '' || this.editableRow.flag == null
            ? null
            : Number(this.editableRow.flag);
        }
        this.userservice.updateUser(this.editableRow).subscribe({
          next: () => {
            this.cancelEdit();
            this.loadData();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error updating user:', err);
          }
        });
      }
    });
  }

  deleteUser(username: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de que deseas eliminar al usuario ${username}?`,
      },
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userservice.deleteUser(username).subscribe({
          next: () => {
            this.loadData();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting user:', err);
          }
        });
      }
    });
  }




  // Filtrar datos de la tabla por columna
  filterData(column: keyof typeof this.filters, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filters[column] = filterValue;

    this.applyActiveFilters();
  }

  onDateFilterChange(column: 'date_creation' | 'date_update', selectedDate: Date | null): void {
    if (!selectedDate) {
      this.filters[column] = '';
      return;
    }

    if (column === 'date_creation') {
      this.dateCreationFilter = selectedDate;
    }

    if (column === 'date_update') {
      this.dateUpdateFilter = selectedDate;
    }

    this.filters[column] = this.normalizeDateFilterValue(selectedDate);
    this.applyActiveFilters();
  }

  private normalizeDateFilterValue(value: unknown): string {
    if (!value) {
      return '';
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const text = String(value).trim();

    // Soporta formato ISO: 2026-03-02T00:00:00
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month}-${day}`;
    }

    // Soporta ingreso manual: dd/MM/yyyy
    const localMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (localMatch) {
      const [, day, month, year] = localMatch;
      return `${year}-${month}-${day}`;
    }

    return text.toLowerCase();
  }

  private applyActiveFilters(): void {
    // Filtrar los datos originales
    const filtered = this.allUserOriginal.filter((row) => {
      return this.applyAllFilters(row);
    });

    // Actualizar los datos mostrados
    this.allUser = filtered;
  }

  //Aplicar todos los filtros activos a una fila

  private applyAllFilters(row: any): boolean {

    // filtro name
    if (this.filters.name && !String(row.name).toLowerCase().includes(this.filters.name)) {
      return false;
    }

    // filtro lastname
    if (this.filters.lastname && !String(row.lastname).toLowerCase().includes(this.filters.lastname)) {
      return false;
    }

    // filtro dni
    if (this.filters.dni && !String(row.dni).toLowerCase().includes(this.filters.dni)) {
      return false;
    }

    // Filtro codcas
    const centroLabel = this.getCentroName(row.codcas).toLowerCase();
    if (this.filters.codcas && !centroLabel.includes(this.filters.codcas)) {
      return false;
    }

    // Filtro code_red
    const redLabel = this.getRedName(row.code_red).toLowerCase();
    if (this.filters.code_red && !redLabel.includes(this.filters.code_red)) {
      return false;
    }
    // Filtro role
    if (this.filters.role && !row.role.toLowerCase().includes(this.filters.role)) {
      return false;
    }

    // Filtro username
    if (this.filters.username && !row.username.toLowerCase().includes(this.filters.username)) {
      return false;
    }

    // Filtro password
    if (this.filters.password && !row.password.toLowerCase().includes(this.filters.password)) {
      return false;
    }

    // Filtro date_creation
    const dateCreationLabel = this.normalizeDateFilterValue(row.date_creation);
    if (this.filters.date_creation && !dateCreationLabel.includes(this.filters.date_creation)) {
      return false;
    }

    // Filtro date_updated
    const dateUpdateLabel = this.normalizeDateFilterValue(row.date_update);
    if (this.filters.date_update && !dateUpdateLabel.includes(this.filters.date_update)) {
      return false;
    }
    // Filtro flag
    if (this.filters.flag && !String(row.flag).toLowerCase().includes(this.filters.flag)) {
      return false;
    }

    return true;
  }

}

@Component({
  selector: 'confirm-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header" [ngClass]="getHeaderClass()">
        <mat-icon class="dialog-icon">{{ getIcon() }}</mat-icon>
        <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      </div>
      <mat-dialog-content class="dialog-message">
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button class="btn-cancel" (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button [color]="getButtonColor()" class="btn-confirm" (click)="onConfirm()">
          <mat-icon>{{ getConfirmIcon() }}</mat-icon>
          Confirmar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-radius: 8px 8px 0 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .dialog-header.warning {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .dialog-header.success {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .dialog-message {
      padding: 24px 24px;
      font-size: 15px;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.87);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .dialog-message p {
      margin: 0;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background-color: #fafafa;
      border-radius: 0 0 8px 8px;
    }

    .btn-cancel {
      min-width: 100px;
      height: 40px;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      transition: all 0.3s ease;
    }

    .btn-cancel:hover {
      background-color: #e0e0e0;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .btn-confirm {
      min-width: 100px;
      height: 40px;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .btn-confirm:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    button mat-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .mat-mdc-dialog-container {
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  getHeaderClass(): string {
    if (this.data.title.toLowerCase().includes('eliminación')) {
      return 'warning';
    }
    return 'success';
  }

  getIcon(): string {
    if (this.data.title.toLowerCase().includes('eliminación')) {
      return 'delete_outline';
    }
    return 'edit_note';
  }

  getConfirmIcon(): string {
    if (this.data.title.toLowerCase().includes('eliminación')) {
      return 'delete';
    }
    return 'check';
  }

  getButtonColor(): string {
    if (this.data.title.toLowerCase().includes('eliminación')) {
      return 'warn';
    }
    return 'primary';
  }

  onConfirm(): void {
    this.dialogRef.close(true);

  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
