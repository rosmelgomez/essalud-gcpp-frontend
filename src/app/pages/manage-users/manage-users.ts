import { Component, inject, ChangeDetectionStrategy, HostListener, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/users-service';
import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { EstablecimientoService } from '../../services/establecimiento-service';
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
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly roleOptions: string[] = ['ADMIN', 'ADMIN_RED', 'USER'];
  readonly flagOptions: Array<{ label: string; value: string }> = [
    { label: 'Todos', value: '' },
    { label: 'Activo', value: '1' },
    { label: 'Inactivo', value: '0' },
  ];
  readonly pageSizeOptions: number[] = [8, 24, 96];

  isLoadingUsers: boolean = true;
  isLoadingCatalogos: boolean = true;
  isSavingEdit: boolean = false;

  allUserOriginal: any[] = [];
  filteredUsers: any[] = [];
  virtualRows: any[][] = [];
  editingRowKey: string | number | null = null;
  editableRow: any | null = null;

  dataRed: any[] = [];
  dataCentroCompleto: any[] = [];
  editingAllCentroForSelectedRed: any[] = [];  // Lista completa de centros de la red seleccionada
  editingRedEnabled: boolean = false;
  editingCentroEnabled: boolean = false;

  private redNameByCode: Record<string, string> = {};
  private centroNameByCode: Record<string, string> = {};

  private cardsPerRow: number = 3;
  pageSize: number = 8;
  pageIndex: number = 0;

  filters = {
    name: '',
    lastname: '',
    dni: '',
    codcas: '',
    code_red: '',
    role: '',
    username: '',
    date_creation: '',
    date_update: '',
    flag: '',
  };

  constructor(
    private userservice: UsersService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.cardsPerRow = this.calculateCardsPerRow();
    this.loadData();
    this.getDataRedCentro();
  }

  get isLoading(): boolean {
    return this.isLoadingUsers || this.isLoadingCatalogos;
  }

  get totalResultados(): number {
    return this.filteredUsers.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get paginationStart(): number {
    if (this.filteredUsers.length === 0) {
      return 0;
    }
    return this.pageIndex * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.filteredUsers.length);
  }

  get currentPageLabel(): string {
    return `${this.pageIndex + 1} / ${this.totalPages}`;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const nextCardsPerRow = this.calculateCardsPerRow();
    if (nextCardsPerRow !== this.cardsPerRow) {
      this.cardsPerRow = nextCardsPerRow;
      this.rebuildVirtualRows();
      this.cdr.markForCheck();
    }
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
      red: this.establecimientoService.getRed(),
      centro: this.establecimientoService.getCentrosWithRed(),
    }).subscribe({
      next: ({ red, centro }) => {
        this.dataRed = red;
        this.dataCentroCompleto = centro;
        this.redNameByCode = red.reduce((acc: Record<string, string>, item: any) => {
          acc[String(item.redasiscod)] = item.redasisdes;
          return acc;
        }, {});
        this.centroNameByCode = centro.reduce((acc: Record<string, string>, item: any) => {
          acc[String(item.cenasicod)] = item.cenasides;
          return acc;
        }, {});
        this.isLoadingCatalogos = false;
        this.applyActiveFilters();
        this.cdr.markForCheck();
      }
      ,
      error: (err) => {
        console.error('Error fetching data:', err);
        this.isLoadingCatalogos = false;
        this.cdr.markForCheck();
      }
    });
  }


  loadData(): void {
    this.userservice.getAllUsers().subscribe({
      next: (data) => {
        this.allUserOriginal = data;
        this.isLoadingUsers = false;
        this.applyActiveFilters(true);
        this.cdr.markForCheck();
      }
      ,
      error: (err) => {
        console.error('Error fetching data:', err);
        this.isLoadingUsers = false;
        this.cdr.markForCheck();
      }
    });
  }

  private getRowKey(row: any): string | number {
    return row?.id ?? row?.username;
  }

  trackByUser = (_index: number, row: any): string | number => this.getRowKey(row);

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
    this.isSavingEdit = false;
    this.editingRedEnabled = false;
    this.editingCentroEnabled = false;
    this.editingAllCentroForSelectedRed = [];
    this.cdr.markForCheck();
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

  onFilterValueChange(): void {
    this.applyActiveFilters(true);
  }

  limpiarFiltros(): void {
    this.filters = {
      name: '',
      lastname: '',
      dni: '',
      codcas: '',
      code_red: '',
      role: '',
      username: '',
      date_creation: '',
      date_update: '',
      flag: '',
    };
    this.applyActiveFilters(true);
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.rebuildVirtualRows();
    this.cdr.markForCheck();
  }

  goToPreviousPage(): void {
    if (this.pageIndex <= 0) {
      return;
    }

    this.pageIndex -= 1;
    this.rebuildVirtualRows();
    this.cdr.markForCheck();
  }

  goToNextPage(): void {
    if (this.pageIndex >= this.totalPages - 1) {
      return;
    }

    this.pageIndex += 1;
    this.rebuildVirtualRows();
    this.cdr.markForCheck();
  }

  getCardsRowTemplateColumns(): string {
    return `repeat(${this.cardsPerRow}, minmax(0, 1fr))`;
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

        this.isSavingEdit = true;
        this.userservice.updateUser(this.editableRow).subscribe({
          next: () => {
            this.cancelEdit();
            this.loadData();
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error updating user:', err);
            this.isSavingEdit = false;
            this.cdr.markForCheck();
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
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Error deleting user:', err);
          }
        });
      }
    });
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

  //Aplicar todos los filtros activos a una fila

  private applyAllFilters(row: any): boolean {
    // filtro name
    if (this.filters.name && !String(row.name ?? '').toLowerCase().includes(this.filters.name.toLowerCase())) {
      return false;
    }

    // filtro lastname
    if (
      this.filters.lastname
      && !String(row.lastname ?? '').toLowerCase().includes(this.filters.lastname.toLowerCase())
    ) {
      return false;
    }

    // filtro dni
    if (this.filters.dni && !String(row.dni ?? '').toLowerCase().includes(this.filters.dni.toLowerCase())) {
      return false;
    }

    // Filtro codcas
    const centroLabel = this.getCentroName(row.codcas).toLowerCase();
    if (this.filters.codcas && !centroLabel.includes(this.filters.codcas.toLowerCase())) {
      return false;
    }

    // Filtro code_red
    const redLabel = this.getRedName(row.code_red).toLowerCase();
    if (this.filters.code_red && !redLabel.includes(this.filters.code_red.toLowerCase())) {
      return false;
    }

    // Filtro role
    if (this.filters.role && !String(row.role ?? '').toLowerCase().includes(this.filters.role.toLowerCase())) {
      return false;
    }

    // Filtro username
    if (
      this.filters.username
      && !String(row.username ?? '').toLowerCase().includes(this.filters.username.toLowerCase())
    ) {
      return false;
    }

    // Filtro date_creation
    const dateCreationLabel = this.normalizeDateFilterValue(row.date_creation);
    if (this.filters.date_creation && !dateCreationLabel.includes(this.filters.date_creation.toLowerCase())) {
      return false;
    }

    // Filtro date_updated
    const dateUpdateLabel = this.normalizeDateFilterValue(row.date_update);
    if (this.filters.date_update && !dateUpdateLabel.includes(this.filters.date_update.toLowerCase())) {
      return false;
    }

    // Filtro flag
    const normalizedFlag = String(row.flag == null ? '' : Number(row.flag)).toLowerCase();
    if (this.filters.flag && !normalizedFlag.includes(this.filters.flag.toLowerCase())) {
      return false;
    }

    return true;
  }

  private applyActiveFilters(resetPage: boolean = false): void {
    const normalizeFilterValue = (value: string) => value.toLowerCase().trim();

    this.filters = {
      name: normalizeFilterValue(this.filters.name),
      lastname: normalizeFilterValue(this.filters.lastname),
      dni: normalizeFilterValue(this.filters.dni),
      codcas: normalizeFilterValue(this.filters.codcas),
      code_red: normalizeFilterValue(this.filters.code_red),
      role: normalizeFilterValue(this.filters.role),
      username: normalizeFilterValue(this.filters.username),
      date_creation: normalizeFilterValue(this.filters.date_creation),
      date_update: normalizeFilterValue(this.filters.date_update),
      flag: normalizeFilterValue(this.filters.flag),
    };

    const filtered = this.allUserOriginal.filter((row) => this.applyAllFilters(row));
    this.filteredUsers = filtered;

    if (resetPage) {
      this.pageIndex = 0;
    }

    if (this.pageIndex >= this.totalPages) {
      this.pageIndex = Math.max(0, this.totalPages - 1);
    }

    this.rebuildVirtualRows();
  }

  private rebuildVirtualRows(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    const pageItems = this.filteredUsers.slice(start, end);
    this.virtualRows = this.chunkArray(pageItems, this.cardsPerRow);
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    if (size <= 0) {
      return [items];
    }

    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private calculateCardsPerRow(): number {
    if (typeof window === 'undefined') {
      return 3;
    }

    const width = window.innerWidth;
    if (width >= 1400) {
      return 4;
    }
    if (width >= 1024) {
      return 3;
    }
    if (width >= 640) {
      return 2;
    }
    return 1;
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
