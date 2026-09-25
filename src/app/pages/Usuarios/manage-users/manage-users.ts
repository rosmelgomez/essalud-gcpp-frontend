import { Component, inject, ChangeDetectionStrategy, HostListener, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { User } from '../../../model/user';
import { UsersService } from '../../../services/usuario/users-service';


@Component({
  selector: 'app-manage-users',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers implements OnInit {
  readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly roleOptions: string[] = ['ADMIN', 'ADMIN_RED', 'USER', 'CONSULTA'];
  readonly flagOptions: Array<{ label: string; value: string }> = [
    { label: 'Todos', value: '' },
    { label: 'Activo', value: '1' },
    { label: 'Inactivo', value: '0' },
  ];
  readonly pageSizeOptions: number[] = [10, 25, 50, 100];
  readonly skeletonRows = Array.from({ length: 6 });

  isLoadingUsers: boolean = true;
  isLoadingCatalogos: boolean = true;
  isSavingEdit: boolean = false;

  allUserOriginal: User[] = [];
  filteredUsers: User[] = [];
  editingRowKey: string | number | null = null;
  editableRow: any | null = null;
  isEditModalOpen: boolean = false;
  showAdvancedFilters: boolean = false;
  showEditPassword: boolean = false;

  dataRed: any[] = [];
  dataCentroCompleto: any[] = [];
  editingAllCentroForSelectedRed: any[] = [];  // Lista completa de centros de la red seleccionada
  editingRedEnabled: boolean = false;
  editingCentroEnabled: boolean = false;

  private redNameByCode: Record<string, string> = {};
  private centroNameByCode: Record<string, string> = {};

  // Helper para obtener el rol principal del usuario
  private getPrimaryRole(roles?: String[]): string {
    return roles && roles.length > 0 ? String(roles[0]) : '';
  }
  // ---- Registro de usuario (modal) ----
  readonly createRoleOptions: Array<{ value: string; label: string; hint: string }> = [
    { value: 'ADMIN', label: 'Administrador', hint: 'Acceso total. No requiere red ni centro.' },
    { value: 'ADMIN_RED', label: 'Administrador de Red', hint: 'Gestiona una red asistencial. Asígnale una red.' },
    { value: 'USER', label: 'Usuario', hint: 'Trabaja en un centro. Al elegir el centro, la red se completa sola.' },
  ];
  private readonly comboLimit = 60;

  isCreateModalOpen: boolean = false;
  isSavingCreate: boolean = false;
  createSubmitted: boolean = false;
  createError: string = '';
  showCreatePassword: boolean = false;
  private isUsernameManuallyEdited: boolean = false;
  newUser = this.emptyNewUser();
  combo: Record<string, { open: boolean; query: string; active: number }> = {
    red: { open: false, query: '', active: -1 },
    centro: { open: false, query: '', active: -1 },
  };

  pageSize: number = 25;
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

  get pageUsers(): any[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get activeCount(): number {
    return this.allUserOriginal.filter((u) => this.isActive(u.flag)).length;
  }

  get inactiveCount(): number {
    return this.allUserOriginal.length - this.activeCount;
  }

  get activeFilterCount(): number {
    return Object.values(this.filters).filter((v) => String(v ?? '').trim() !== '').length;
  }

  get advancedFilterCount(): number {
    const { codcas, code_red, date_creation, date_update } = this.filters;
    return [codcas, code_red, date_creation, date_update].filter((v) => String(v ?? '').trim() !== '').length;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isCreateModalOpen) {
      this.closeCreate();
      return;
    }
    if (this.isEditModalOpen && !this.isSavingEdit) {
      this.cancelEdit();
    }
  }

  isActive(flag: string | number | boolean | null | undefined): boolean {
    return flag === 1 || flag === '1' || flag === true;
  }

  getPrimaryRoleLabel(user: User): string {
    return this.getPrimaryRole(user.roles) || '—';
  }

  getRoleClass(user: User): string {
    const role = this.getPrimaryRole(user.roles).toLowerCase().replace(/_/g, '-');
    return role ? `role-${role}` : 'role-none';
  }

  getUserInitials(user: User): string {
    const first = (user.name ?? '').trim().charAt(0);
    const last = (user.lastname ?? '').trim().charAt(0);
    return `${first}${last}`.toUpperCase() || (user.username ?? '?').charAt(0).toUpperCase();
  }

  setFlagFilter(value: string): void {
    this.filters.flag = value;
    this.onFilterValueChange();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSavingEdit) {
      this.cancelEdit();
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
    // Hacer copia profunda del array de roles para evitar mutaciones
    if (this.editableRow.roles && Array.isArray(this.editableRow.roles)) {
      this.editableRow.roles = [...this.editableRow.roles];
    }
    this.isEditModalOpen = true;
    this.showEditPassword = false;
    this.initializeEditingDropdowns();
  }

  initializeEditingDropdowns(): void {
    if (!this.editableRow) return;

    const primaryRole = this.getPrimaryRole(this.editableRow.roles);
    // USER: codcas (cenasicod) es la fuente para inferir red (redasiscod).
    if (primaryRole === 'USER' && this.editableRow.codcas) {
      this.syncUserRedFromCodcas();
    }

    this.applyEditingRoleRules(primaryRole);
  }

  onEditingRoleChange(): void {
    if (!this.editableRow) {
      return;
    }

    const primaryRole = this.getPrimaryRole(this.editableRow.roles);
    this.applyEditingRoleRules(primaryRole);
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
    const primaryRole = this.getPrimaryRole(this.editableRow?.roles);
    if (!this.editableRow || primaryRole !== 'USER') {
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

    const primaryRole = this.getPrimaryRole(this.editableRow.roles);
    if (primaryRole === 'ADMIN_RED') {
      return 'No aplica para esta red';
    }

    if (primaryRole === 'ADMIN') {
      return 'No aplica para este rol';
    }

    return 'Selecciona un centro';
  }

  getEditingRedPlaceholder(): string {
    if (!this.editableRow) {
      return 'Seleccionar red...';
    }

    const primaryRole = this.getPrimaryRole(this.editableRow.roles);
    if (primaryRole === 'ADMIN') {
      return 'No aplica para este rol';
    }

    return 'Seleccionar red...';
  }

  onEditingRedChange(): void {
    if (!this.editableRow) {
      return;
    }

    const primaryRole = this.getPrimaryRole(this.editableRow.roles);
    if (primaryRole !== 'USER') {
      if (primaryRole === 'ADMIN_RED') {
        this.editableRow.codcas = '';
      }
      return;
    }

    this.updateEditingCentrosByRed(this.editableRow.code_red, true);
  }

  onEditingCentroChange(): void {
    const primaryRole = this.getPrimaryRole(this.editableRow?.roles);
    if (!this.editableRow || primaryRole !== 'USER') {
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
    const primaryRole = this.getPrimaryRole(this.editableRow?.roles);
    if (!this.editableRow || primaryRole !== 'USER' || !this.editableRow.codcas) {
      return;
    }

    const centroSeleccionado = this.findCentroByCode(this.editableRow.codcas);
    if (!centroSeleccionado) {
      return;
    }

    this.editableRow.code_red = String(centroSeleccionado.redasiscod ?? '');
  }

  private isUserRedCentroSelectionValid(): boolean {
    const primaryRole = this.getPrimaryRole(this.editableRow?.roles);
    if (!this.editableRow || primaryRole !== 'USER') {
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
    this.isEditModalOpen = false;
    this.showEditPassword = false;
    this.editingRedEnabled = false;
    this.editingCentroEnabled = false;
    this.editingAllCentroForSelectedRed = [];
    this.cdr.markForCheck();
  }
  // ================= Registro de usuario =================

  private emptyNewUser() {
    return { name: '', lastname: '', dni: '', email: '', username: '', password: '', rol: '', code_red: '', codcas: '' };
  }

  openCreate(): void {
    this.newUser = this.emptyNewUser();
    this.isUsernameManuallyEdited = false;
    this.createSubmitted = false;
    this.createError = '';
    this.showCreatePassword = false;
    this.isSavingCreate = false;
    this.resetCombo('red');
    this.resetCombo('centro');
    this.isCreateModalOpen = true;
    setTimeout(() => document.getElementById('new-name')?.focus());
  }

  closeCreate(): void {
    if (this.isSavingCreate) {
      return;
    }
    this.isCreateModalOpen = false;
    this.cdr.markForCheck();
  }

  onCreateOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCreate();
    }
  }

  get createRoleHint(): string {
    return this.createRoleOptions.find((r) => r.value === this.newUser.rol)?.hint
      ?? 'Define qué puede ver y hacer la cuenta.';
  }

  get isCreateRedEnabled(): boolean {
    return this.newUser.rol === 'ADMIN_RED' || this.newUser.rol === 'USER';
  }

  get isCreateCentroEnabled(): boolean {
    return this.newUser.rol === 'USER';
  }

  onCreateNameChange(): void {
    if (this.isUsernameManuallyEdited) {
      return;
    }
    this.newUser.username = this.generateUsername(this.newUser.name, this.newUser.lastname);
  }

  onCreateUsernameInput(): void {
    this.isUsernameManuallyEdited = this.newUser.username.trim() !== '';
  }

  private generateUsername(name: string, lastname: string): string {
    const first = (name ?? '').trim().split(/\s+/)[0];
    const last = (lastname ?? '').trim().split(/\s+/)[0];
    if (!first || !last) {
      return '';
    }
    return `${first}.${last}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '');
  }

  onCreateRoleChange(): void {
    if (!this.isCreateRedEnabled) {
      this.newUser.code_red = '';
    }
    if (!this.isCreateCentroEnabled) {
      this.newUser.codcas = '';
    }
    this.resetCombo('red');
    this.resetCombo('centro');
  }

  get createErrors(): Record<string, string> {
    const u = this.newUser;
    const errors: Record<string, string> = {};
    if (!u.name.trim()) errors['name'] = 'Ingresa el nombre.';
    if (!u.lastname.trim()) errors['lastname'] = 'Ingresa el apellido.';
    if (!u.dni.trim()) errors['dni'] = 'Ingresa el DNI.';
    if (u.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email.trim())) {
      errors['email'] = 'El correo no tiene un formato válido.';
    }
    if (!u.rol) errors['rol'] = 'Selecciona un rol.';
    if (this.isCreateRedEnabled && !u.code_red) errors['code_red'] = 'Selecciona una red.';
    if (this.isCreateCentroEnabled && !u.codcas) errors['codcas'] = 'Selecciona un centro.';
    if (!u.username.trim()) errors['username'] = 'Ingresa un username.';
    if (!u.password) {
      errors['password'] = 'Ingresa una contraseña.';
    } else if (u.password.length < 8) {
      errors['password'] = 'Usa al menos 8 caracteres.';
    }
    return errors;
  }

  createFieldError(field: string): string {
    return this.createSubmitted ? this.createErrors[field] ?? '' : '';
  }

  get createErrorCount(): number {
    return Object.keys(this.createErrors).length;
  }

  submitCreate(): void {
    this.createSubmitted = true;
    this.createError = '';
    if (this.createErrorCount > 0) {
      return;
    }

    const u = this.newUser;
    const payload: any = {
      id: 0,
      name: u.name.trim(),
      lastname: u.lastname.trim(),
      dni: u.dni.trim(),
      codcas: u.rol === 'USER' ? u.codcas : '',
      email: u.email.trim(),
      username: u.username.trim(),
      password: u.password,
      roles: u.rol,
      codred: u.rol === 'ADMIN_RED' ? u.code_red : '',
      date_creation: '',
      date_update: '',
      flag: true,
    };

    this.isSavingCreate = true;
    this.userservice.registerUser(payload).subscribe({
      next: () => {
        this.isSavingCreate = false;
        this.isCreateModalOpen = false;
        this.snackBar.open(`Usuario ${payload.username} registrado`, 'Cerrar', { duration: 3500 });
        this.loadData();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error en el registro', err);
        this.isSavingCreate = false;
        const detail = typeof err?.error === 'string' && err.error.length < 200 ? ` ${err.error}` : '';
        this.createError = `No se pudo registrar el usuario.${detail || ' Revisa los datos e inténtalo de nuevo.'}`;
        this.cdr.markForCheck();
      },
    });
  }

  // ---- Combobox con búsqueda (Red / Centro) ----

  private resetCombo(kind: 'red' | 'centro'): void {
    this.combo[kind] = { open: false, query: '', active: -1 };
  }

  private comboSource(kind: 'red' | 'centro'): any[] {
    if (kind === 'red') {
      return this.dataRed;
    }
    const red = this.normalizeCode(this.newUser.code_red);
    return red
      ? this.dataCentroCompleto.filter((c: any) => this.normalizeCode(c.redasiscod) === red)
      : this.dataCentroCompleto;
  }

  comboLabelOf(kind: 'red' | 'centro', option: any): string {
    return kind === 'red' ? option?.redasisdes ?? '' : option?.cenasides ?? '';
  }

  private comboCodeOf(kind: 'red' | 'centro', option: any): string {
    return String(kind === 'red' ? option?.redasiscod ?? '' : option?.cenasicod ?? '');
  }

  private comboMatches(kind: 'red' | 'centro'): any[] {
    const q = this.combo[kind].query.trim().toLowerCase();
    const source = this.comboSource(kind);
    return q ? source.filter((o) => this.comboLabelOf(kind, o).toLowerCase().includes(q)) : source;
  }

  comboOptions(kind: 'red' | 'centro'): any[] {
    return this.comboMatches(kind).slice(0, this.comboLimit);
  }

  comboHiddenCount(kind: 'red' | 'centro'): number {
    return Math.max(0, this.comboMatches(kind).length - this.comboLimit);
  }

  comboSelectedLabel(kind: 'red' | 'centro'): string {
    const code = kind === 'red' ? this.newUser.code_red : this.newUser.codcas;
    if (!code) {
      return '';
    }
    return kind === 'red' ? this.getRedName(code) : this.getCentroName(code);
  }

  comboInputValue(kind: 'red' | 'centro'): string {
    return this.combo[kind].open ? this.combo[kind].query : this.comboSelectedLabel(kind);
  }

  openCombo(kind: 'red' | 'centro'): void {
    this.combo[kind] = { open: true, query: '', active: 0 };
  }

  closeCombo(kind: 'red' | 'centro'): void {
    this.combo[kind] = { open: false, query: '', active: -1 };
  }

  onComboInput(kind: 'red' | 'centro', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.combo[kind] = { open: true, query: value, active: 0 };
  }

  onComboKeydown(kind: 'red' | 'centro', event: KeyboardEvent): void {
    const state = this.combo[kind];
    const options = this.comboOptions(kind);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!state.open) {
        this.openCombo(kind);
        return;
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      state.active = Math.min(Math.max(state.active + delta, 0), options.length - 1);
      setTimeout(() => document.getElementById(`combo-${kind}-opt-${state.active}`)?.scrollIntoView({ block: 'nearest' }));
    } else if (event.key === 'Enter') {
      if (state.open && options[state.active]) {
        event.preventDefault();
        this.selectCombo(kind, options[state.active]);
      }
    } else if (event.key === 'Escape' && state.open) {
      event.stopPropagation();
      this.closeCombo(kind);
    }
  }

  selectCombo(kind: 'red' | 'centro', option: any): void {
    const code = this.comboCodeOf(kind, option);
    if (kind === 'red') {
      if (this.normalizeCode(this.newUser.code_red) !== this.normalizeCode(code)) {
        this.newUser.codcas = '';
      }
      this.newUser.code_red = code;
    } else {
      this.newUser.codcas = code;
      // Al elegir el centro, la red se sincroniza automáticamente.
      this.newUser.code_red = String(option?.redasiscod ?? this.newUser.code_red);
    }
    this.closeCombo(kind);
  }

  clearCombo(kind: 'red' | 'centro'): void {
    if (kind === 'red') {
      this.newUser.code_red = '';
    }
    this.newUser.codcas = '';
    this.resetCombo(kind);
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
    this.cdr.markForCheck();
  }

  goToPreviousPage(): void {
    if (this.pageIndex <= 0) {
      return;
    }

    this.pageIndex -= 1;
    this.cdr.markForCheck();
  }

  goToNextPage(): void {
    if (this.pageIndex >= this.totalPages - 1) {
      return;
    }

    this.pageIndex += 1;
    this.cdr.markForCheck();
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
          const primaryRole = this.getPrimaryRole(this.editableRow.roles);
          if (primaryRole === 'ADMIN') {
            this.editableRow.code_red = '';
            this.editableRow.codcas = '';
          }

          if (primaryRole === 'ADMIN_RED') {
            this.editableRow.codcas = '';
          }

          if (primaryRole === 'USER') {
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

  deleteUser(username: string, id: number): void {
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
        this.userservice.deleteUser(id).subscribe({
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

    // Filtro role - busca en el array de roles
    if (this.filters.role) {
      const rolesList = (row.roles ?? []).map((r: String) => String(r).toLowerCase());
      const hasMatchingRole = rolesList.some((role: string) => role === this.filters.role.toLowerCase());
      if (!hasMatchingRole) {
        return false;
      }
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

  }




}

@Component({
  selector: 'confirm-dialog',
  template: `
    <div class="dialog-container" [ngClass]="getHeaderClass()">
      <div class="dialog-header">
        <span class="dialog-icon-wrap"><mat-icon class="dialog-icon">{{ getIcon() }}</mat-icon></span>
        <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      </div>
      <mat-dialog-content class="dialog-message">
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions class="dialog-actions">
        <button type="button" class="dlg-btn dlg-cancel" (click)="onCancel()">Cancelar</button>
        <button type="button" class="dlg-btn dlg-confirm" (click)="onConfirm()" cdkFocusInitial>
          <mat-icon>{{ getConfirmIcon() }}</mat-icon>
          {{ getConfirmLabel() }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      --dlg-accent: #0064AF;
      --dlg-accent-hover: #00528f;
      --dlg-tint: #e8f1fa;
      width: 100%;
      padding: 24px 24px 20px;
      font-family: var(--font-family-global);
      color: #16283b;
    }

    .dialog-container.warning {
      --dlg-accent: #c8102e;
      --dlg-accent-hover: #a50d26;
      --dlg-tint: #fdecef;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .dialog-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      color: var(--dlg-accent);
      background: var(--dlg-tint);
      border-radius: 50%;
    }

    .dialog-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .dialog-title {
      margin: 0;
      padding: 0 !important;
      font-family: var(--font-family-headings);
      font-size: 18px !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      color: #16283b !important;
    }

    .dialog-title::before {
      display: none !important;
    }

    .dialog-message {
      padding: 12px 0 0 58px !important;
      font-size: 14.5px;
      line-height: 1.55;
      color: #56697d !important;
    }

    .dialog-message p {
      margin: 0;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      min-height: 0 !important;
      padding: 24px 0 0 !important;
    }

    .dlg-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      padding: 0 16px;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      border: 1px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: background-color 0.18s ease, border-color 0.18s ease;
    }

    .dlg-btn:focus-visible {
      outline: 2px solid var(--dlg-accent);
      outline-offset: 2px;
    }

    .dlg-cancel {
      color: #16283b;
      background: #ffffff;
      border-color: #dfe6ee;
    }

    .dlg-cancel:hover {
      background: #f5f8fb;
      border-color: #c9d6e3;
    }

    .dlg-confirm {
      color: #ffffff;
      background: var(--dlg-accent);
    }

    .dlg-confirm:hover {
      background: var(--dlg-accent-hover);
    }

    .dlg-confirm mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .mat-mdc-dialog-container .mat-mdc-dialog-surface {
      border-radius: 16px;
      box-shadow: 0 24px 60px -12px rgba(10, 30, 55, 0.35), 0 6px 16px -6px rgba(10, 30, 55, 0.18);
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

  getConfirmLabel(): string {
    if (this.data.title.toLowerCase().includes('eliminación')) {
      return 'Eliminar';
    }
    return 'Confirmar';
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
