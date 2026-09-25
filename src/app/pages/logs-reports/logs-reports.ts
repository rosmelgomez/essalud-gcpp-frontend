import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { LogsUsersService } from '../../services/usuario/logs-users-service';
import { EstablecimientoService } from '../../services/establecimiento-service';
import { UsersService } from '../../services/usuario/users-service';
import { User } from '../../model/user';

type ChartKey = 'rol' | 'fecha' | 'browser' | 'url';

/** Log tal como llega del backend, más campos derivados calculados una sola vez al cargar. */
interface LogRow {
  [key: string]: any;
  id?: any;
  full_name?: string;
  ip_user?: string;
  dni?: string;
  url?: string;
  browser?: string;
  user_role?: string;
  _year: string;
  _month: string;
  _day: string;
  _ymd: string;
  _fecha: string;
  _redName: string;
  _centroName: string;
  _isLogin: boolean;
}

const CHART_FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CHART_INK = '#56697d';
const CHART_GRID = '#edf1f5';
const BRAND = '#0064af';
const DONUT_COLORS = ['#0064af', '#3d8fd1', '#00aeef', '#7fb6e6', '#17324d', '#9aa9b8', '#c6d2de'];

@Component({
  selector: 'app-logs-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './logs-reports.html',
  styleUrl: './logs-reports.css',
})
export class LogsReports implements OnInit, OnDestroy {
  @ViewChildren('userOption') userOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('redOption') redOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('centroOption') centroOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('chartRolContainer') chartRolContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chartFechaContainer') chartFechaContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chartBrowserContainer') chartBrowserContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chartUrlContainer') chartUrlContainer?: ElementRef<HTMLDivElement>;

  // Usuarios
  dataUser: User[] = [];
  searchUser: string = '';
  isDropdownUserOpen: boolean = false;
  filteredAvailableUsers: Array<{ id: string; label: string }> = [];
  selectedUserLabel: string = 'Todos los usuarios';
  activeUserIndex: number = -1;

  // Red asistencial
  dataRed: any[] = [];
  filteredRed: any[] = [];
  searchRed: string = '';
  isDropdownRedOpen: boolean = false;
  selectedRedName: string = '';
  selectedRedCode: string = '';
  activeRedIndex: number = -1;

  // Centro asistencial
  dataCentro: any[] = [];
  dataCentroCompleto: any[] = [];
  filteredCentro: any[] = [];
  searchCentro: string = '';
  isDropdownCentroOpen: boolean = false;
  selectedCentroName: string = '';
  selectedCentroCode: string = '';
  activeCentroIndex: number = -1;

  // Datos
  allLogsData: LogRow[] = [];
  loginLogs: LogRow[] = [];
  /** Logs que cumplen los filtros generales (año, mes, día, usuario, red, centro). */
  private globalFiltered: LogRow[] = [];
  /** Filas visibles en la tabla: filtros generales + filtros por columna. */
  allLogs: LogRow[] = [];

  totalIngresos = 0;
  filteredCount = 0;
  usuariosConIngreso = 0;

  isLoading = true;
  loadError: string | null = null;
  chartEmpty: Record<ChartKey, boolean> = { rol: false, fecha: false, browser: false, url: false };

  private charts: Partial<Record<ChartKey, ApexCharts>> = {};
  private loadSub?: Subscription;
  private columnFilterTimer?: ReturnType<typeof setTimeout>;
  private redNameByCode = new Map<string, string>();
  private centroNameByCode = new Map<string, string>();

  // Filtros por columna de la tabla
  filters = {
    dni: '',
    full_name: '',
    ip_user: '',
    url: '',
    browser: '',
    user_role: '',
    codcas: '',
    code_red: '',
    date: '',
  };

  selectedMonth = 'todos';
  selectedYear = 'todos';
  selectedDay = '';
  selectedUserId = 'todos';
  availableYears: string[] = [];
  availableDays: string[] = [];
  availableUsers: Array<{ id: string; label: string }> = [];
  months = [
    { value: 'todos', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  constructor(
    private logsusersService: LogsUsersService,
    private cdr: ChangeDetectorRef,
    private establecimientoService: EstablecimientoService,
    private userService: UsersService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    clearTimeout(this.columnFilterTimer);
    this.destroyCharts();
  }

  // ---------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------

  /**
   * Carga logs, redes, centros y usuarios en una sola operación.
   * Solo los logs son obligatorios: si fallan redes, centros o usuarios el
   * dashboard se muestra igual (con códigos en lugar de nombres).
   * La app no usa zone.js, por eso cada cambio de estado pide detección de cambios.
   */
  loadData(): void {
    this.loadSub?.unsubscribe();
    this.destroyCharts();
    this.isLoading = true;
    this.loadError = null;
    this.cdr.markForCheck();

    const optional = <T>(source: string) => (err: unknown) => {
      console.error(`Error al obtener ${source}`, err);
      return of([] as T[]);
    };

    this.loadSub = forkJoin({
      logs: this.logsusersService.getLogs(),
      redes: this.establecimientoService.getRed().pipe(catchError(optional<any>('las redes'))),
      centros: this.establecimientoService
        .getCentrosWithRed()
        .pipe(catchError(optional<any>('los centros'))),
      users: this.userService.getAllUsers().pipe(catchError(optional<User>('los usuarios'))),
    }).subscribe({
      next: ({ logs, redes, centros, users }) => {
        this.dataRed = Array.isArray(redes) ? redes : [];
        this.dataCentroCompleto = Array.isArray(centros) ? centros : [];
        this.dataUser = Array.isArray(users) ? users : [];
        this.buildNameMaps();
        this.refreshCentrosBySelectedRed();

        this.allLogsData = this.prepareLogs(Array.isArray(logs) ? logs : []);
        this.loginLogs = this.allLogsData.filter((log) => log._isLogin);

        this.setupYearFilter();
        this.setDefaultFilters();

        this.isLoading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error al obtener los logs de usuarios', err);
        this.loadError = this.describeLoadError(err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private describeLoadError(err: unknown): string {
    const status = err instanceof HttpErrorResponse ? err.status : -1;
    if (status === 0) {
      return 'No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.';
    }
    if (status === 401 || status === 403) {
      return 'Su sesión no tiene permiso para ver los logs de auditoría. Inicie sesión nuevamente o solicite acceso.';
    }
    if (status > 0) {
      return `El servidor respondió con un error (código ${status}) al obtener los logs. Intente de nuevo en unos minutos.`;
    }
    return 'Ocurrió un error inesperado al procesar los logs. Intente de nuevo.';
  }

  private buildNameMaps(): void {
    this.redNameByCode.clear();
    this.centroNameByCode.clear();
    for (const red of this.dataRed) {
      this.redNameByCode.set(this.normalizeCode(red.redasiscod), String(red.redasisdes ?? ''));
    }
    for (const centro of this.dataCentroCompleto) {
      this.centroNameByCode.set(this.normalizeCode(centro.cenasicod), String(centro.cenasides ?? ''));
    }
  }

  /** Calcula una vez los campos derivados (fecha, nombres) para no repetir el trabajo en cada filtro. */
  private prepareLogs(raw: any[]): LogRow[] {
    const rows = raw.map((log) => {
      const parts = this.dateParts(log?.date);
      const redCode = String(log?.code_red ?? '').trim();
      const centroCode = String(log?.codcas ?? '').trim();
      return {
        ...log,
        _year: parts.year,
        _month: parts.month,
        _day: parts.day,
        _ymd: parts.year ? `${parts.year}-${parts.month}-${parts.day}` : '',
        _fecha: this.formatDate(log?.date),
        _redName: this.redNameByCode.get(this.normalizeCode(redCode)) || redCode,
        _centroName: this.centroNameByCode.get(this.normalizeCode(centroCode)) || centroCode,
        _isLogin: this.isLoginUrl(log?.url),
      } as LogRow;
    });
    // Lo más reciente primero
    return rows.sort((a, b) => String(b['date'] ?? '').localeCompare(String(a['date'] ?? '')));
  }

  /**
   * Año/mes/día leídos del texto de la fecha (YYYY-MM-DD...), igual que se muestran
   * en la tabla, para que los filtros no se desfasen por la zona horaria.
   */
  private dateParts(value: unknown): { year: string; month: string; day: string } {
    const text = String(value ?? '').trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { year: match[1], month: match[2], day: match[3] };
    }
    const date = text ? new Date(text) : null;
    if (date && !isNaN(date.getTime())) {
      return {
        year: String(date.getFullYear()),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        day: String(date.getDate()).padStart(2, '0'),
      };
    }
    return { year: '', month: '', day: '' };
  }

  // ---------------------------------------------------------------------------
  // Filtros generales
  // ---------------------------------------------------------------------------

  private setupYearFilter(): void {
    const years = new Set<string>();
    for (const log of this.loginLogs) {
      if (log._year) years.add(log._year);
    }
    this.availableYears = Array.from(years).sort();
  }

  private updateDaysForSelectedMonth(): void {
    const days = new Set<string>();
    for (const log of this.loginLogs) {
      if (!log._day) continue;
      if (this.selectedYear !== 'todos' && log._year !== this.selectedYear) continue;
      if (this.selectedMonth !== 'todos' && log._month !== this.selectedMonth) continue;
      days.add(log._day);
    }
    this.availableDays = Array.from(days).sort();

    if (this.selectedDay && !this.availableDays.includes(this.selectedDay)) {
      this.selectedDay = '';
    }
  }

  private setDefaultFilters(): void {
    const now = new Date();
    const currentYear = String(now.getFullYear());

    this.selectedYear = this.availableYears.includes(currentYear)
      ? currentYear
      : this.availableYears[this.availableYears.length - 1] || 'todos';
    this.selectedMonth = String(now.getMonth() + 1).padStart(2, '0');

    this.updateDaysForSelectedMonth();
    this.setupUserFilter();
  }

  private setupUserFilter(): void {
    const usersMap = new Map<string, string>();

    this.dataUser.forEach((user) => {
      const id = String(user.id ?? '').trim();
      if (!id) return;

      const fullName = `${String(user.name ?? '').trim()} ${String(user.lastname ?? '').trim()}`.trim();
      const username = String(user.username ?? '').trim();
      const dni = String(user.dni ?? '').trim();
      const labelBase = fullName || username || `Usuario ${id}`;

      if (!usersMap.has(id)) {
        usersMap.set(id, dni ? `${labelBase} (${dni})` : labelBase);
      }
    });

    // Sin acceso a la lista de usuarios: se arma desde los propios logs
    if (usersMap.size === 0) {
      this.loginLogs.forEach((log) => {
        const id = String(log['id_user'] ?? '').trim();
        if (!id || usersMap.has(id)) return;

        const fullName = String(log['full_name'] ?? '').trim();
        const dni = String(log['dni'] ?? '').trim();
        usersMap.set(id, fullName ? `${fullName}${dni ? ` (${dni})` : ''}` : dni || `Usuario ${id}`);
      });
    }

    this.availableUsers = Array.from(usersMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, label]) => ({ id, label }));

    if (this.selectedUserId !== 'todos' && !this.availableUsers.some((u) => u.id === this.selectedUserId)) {
      this.selectedUserId = 'todos';
    }

    this.syncSelectedUserLabel();
    if (!this.searchUser) {
      this.filteredAvailableUsers = this.getAllUserOptions();
    }
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedYear !== 'todos' ||
      this.selectedMonth !== 'todos' ||
      !!this.selectedDay ||
      this.selectedUserId !== 'todos' ||
      !!this.selectedRedCode ||
      !!this.selectedCentroCode ||
      Object.values(this.filters).some((value) => !!value)
    );
  }

  applyFilters(): void {
    if (this.isLoading || this.loadError) {
      return;
    }

    const selectedRed = this.normalizeCode(this.selectedRedCode);
    const selectedCentro = this.normalizeCode(this.selectedCentroCode);

    this.globalFiltered = this.allLogsData.filter((log) => {
      if (this.selectedYear !== 'todos' && log._year !== this.selectedYear) return false;
      if (this.selectedMonth !== 'todos' && log._month !== this.selectedMonth) return false;
      if (this.selectedDay && log._day !== this.selectedDay) return false;
      if (selectedRed && this.normalizeCode(log['code_red']) !== selectedRed) return false;
      if (selectedCentro && this.normalizeCode(log['codcas']) !== selectedCentro) return false;
      if (this.selectedUserId !== 'todos' && String(log['id_user'] ?? '').trim() !== this.selectedUserId) {
        return false;
      }
      return true;
    });

    const logins = this.globalFiltered.filter((log) => log._isLogin);
    this.totalIngresos = logins.length;
    this.filteredCount = this.globalFiltered.length;
    this.usuariosConIngreso = new Set(
      logins.map((log) => String(log['id_user'] ?? log['dni'] ?? '').trim()).filter(Boolean),
    ).size;

    this.applyTableFilters();

    // Pintar primero la vista para que existan los contenedores de los gráficos
    this.cdr.detectChanges();
    this.renderCharts(logins, this.globalFiltered);
  }

  onMonthChange(): void {
    this.selectedDay = '';
    this.updateDaysForSelectedMonth();
    this.applyFilters();
  }

  onYearChange(): void {
    this.selectedDay = '';
    this.updateDaysForSelectedMonth();
    this.applyFilters();
  }

  onDayChange(): void {
    this.applyFilters();
  }

  onUserChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedYear = 'todos';
    this.selectedMonth = 'todos';
    this.selectedDay = '';
    this.selectedUserId = 'todos';
    this.selectedUserLabel = 'Todos los usuarios';
    this.searchUser = '';
    this.isDropdownUserOpen = false;
    this.activeUserIndex = -1;

    this.selectedRedName = '';
    this.selectedRedCode = '';
    this.searchRed = '';
    this.isDropdownRedOpen = false;
    this.activeRedIndex = -1;

    this.selectedCentroName = '';
    this.selectedCentroCode = '';
    this.searchCentro = '';
    this.isDropdownCentroOpen = false;
    this.activeCentroIndex = -1;

    (Object.keys(this.filters) as Array<keyof typeof this.filters>).forEach((key) => {
      this.filters[key] = '';
    });

    this.refreshCentrosBySelectedRed();
    this.updateDaysForSelectedMonth();
    this.applyFilters();
  }

  // ---------------------------------------------------------------------------
  // Tabla
  // ---------------------------------------------------------------------------

  /** Filtros por columna: se aplican 200 ms después de dejar de escribir. */
  onColumnFilterChange(): void {
    clearTimeout(this.columnFilterTimer);
    this.columnFilterTimer = setTimeout(() => {
      this.applyTableFilters();
      this.cdr.markForCheck();
    }, 200);
  }

  private applyTableFilters(): void {
    const f = {
      code_red: this.filters.code_red.trim().toLowerCase(),
      codcas: this.filters.codcas.trim().toLowerCase(),
      full_name: this.filters.full_name.trim().toLowerCase(),
      ip_user: this.filters.ip_user.trim().toLowerCase(),
      dni: this.filters.dni.trim().toLowerCase(),
      url: this.filters.url.trim().toLowerCase(),
      browser: this.filters.browser.trim().toLowerCase(),
      user_role: this.filters.user_role.trim().toLowerCase(),
      date: this.filters.date.trim().toLowerCase(),
    };
    const has = (value: unknown, term: string) => !term || String(value ?? '').toLowerCase().includes(term);
    const hasAny = (term: string, ...values: unknown[]) => !term || values.some((value) => has(value, term));

    this.allLogs = this.globalFiltered.filter(
      (row) =>
        hasAny(f.code_red, row._redName, row['code_red']) &&
        hasAny(f.codcas, row._centroName, row['codcas']) &&
        has(row['full_name'], f.full_name) &&
        has(row['ip_user'], f.ip_user) &&
        has(row['dni'], f.dni) &&
        has(row['url'], f.url) &&
        has(row['browser'], f.browser) &&
        has(row['user_role'], f.user_role) &&
        hasAny(f.date, row._fecha, row['date']),
    );
  }

  trackLog = (index: number, row: LogRow) => row['id'] ?? index;

  //  FORMATEAR FECHA (dd/mm/yyyy hh:mm)
  formatDate(date: any): string {
    if (!date) return '';
    const dateStr = String(date).trim();
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    return dateStr;
  }

  //  EXPORTAR CSV: exporta las filas visibles en la tabla
  exportCSV(): void {
    const headers = ['ID', 'Red', 'Centro', 'Usuario', 'DNI', 'IP', 'Evento', 'Método', 'URL', 'Navegador', 'Estado', 'Rol', 'Fecha'];
    const escape = (value: unknown) => {
      const text = String(value ?? '');
      return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const csvRows = [headers.join(',')];
    for (const log of this.allLogs) {
      const usuario =
        String(log['full_name'] ?? '').trim() || `Usuario ${String(log['id_user'] ?? '').trim() || 'N/A'}`;
      csvRows.push(
        [
          log['id'],
          log._redName,
          log._centroName,
          usuario,
          log['dni'],
          log['ip_user'],
          log['action'],
          log['http_method'],
          log['url'],
          log['browser'],
          log['status'],
          log['user_role'],
          log['date'],
        ]
          .map(escape)
          .join(','),
      );
    }

    // BOM para que Excel abra correctamente tildes y eñes
    const blob = new Blob(['﻿' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // Desplegables: usuario
  // ---------------------------------------------------------------------------

  getAllUserOptions(): Array<{ id: string; label: string }> {
    return [{ id: 'todos', label: 'Todos los usuarios' }, ...this.availableUsers];
  }

  private getUserOptions(): Array<{ id: string; label: string }> {
    return this.searchUser ? this.filteredAvailableUsers : this.getAllUserOptions();
  }

  private syncSelectedUserLabel(): void {
    if (this.selectedUserId === 'todos') {
      this.selectedUserLabel = 'Todos los usuarios';
      return;
    }
    const selectedUser = this.availableUsers.find((user) => user.id === this.selectedUserId);
    this.selectedUserLabel = selectedUser?.label ?? 'Todos los usuarios';
  }

  focusDropdownUser() {
    this.searchUser = '';
    this.isDropdownUserOpen = true;
    this.filteredAvailableUsers = this.getAllUserOptions();
    this.activeUserIndex = this.getUserOptions().length > 0 ? 0 : -1;
    this.scrollActiveIntoView(this.userOptions, this.activeUserIndex);
  }

  closeDropdownUser() {
    this.isDropdownUserOpen = false;
    this.searchUser = '';
    this.activeUserIndex = -1;
    this.syncSelectedUserLabel();
  }

  filterUser(event: Event) {
    const rawValue = String((event.target as HTMLInputElement).value ?? '');
    const searchValue = rawValue.toLowerCase().trim();
    this.searchUser = rawValue;
    this.isDropdownUserOpen = true;

    const allOptions = this.getAllUserOptions();
    this.filteredAvailableUsers = searchValue
      ? allOptions.filter(
          (user) => user.label.toLowerCase().includes(searchValue) || user.id.toLowerCase().includes(searchValue),
        )
      : allOptions;

    this.activeUserIndex = this.getUserOptions().length > 0 ? 0 : -1;
    this.scrollActiveIntoView(this.userOptions, this.activeUserIndex);
  }

  selectOptionUser(user: { id: string; label: string }) {
    this.selectedUserId = user.id;
    this.selectedUserLabel = user.label;
    this.isDropdownUserOpen = false;
    this.searchUser = '';
    this.activeUserIndex = -1;
    this.onUserChange();
  }

  handleUserKeydown(event: KeyboardEvent) {
    this.handleListKeydown(event, {
      isOpen: this.isDropdownUserOpen,
      open: () => this.focusDropdownUser(),
      close: () => this.closeDropdownUser(),
      options: () => this.getUserOptions(),
      getIndex: () => this.activeUserIndex,
      setIndex: (i) => {
        this.activeUserIndex = i;
        this.scrollActiveIntoView(this.userOptions, i);
      },
      select: (option) => this.selectOptionUser(option),
    });
  }

  // ---------------------------------------------------------------------------
  // Desplegables: red asistencial
  // ---------------------------------------------------------------------------

  openDropdownRed() {
    this.isDropdownRedOpen = true;
    if (!this.searchRed) {
      this.filteredRed = this.dataRed;
    }
    this.activeRedIndex = this.filteredRed.length > 0 ? 0 : -1;
    this.scrollActiveIntoView(this.redOptions, this.activeRedIndex);
  }

  closeDropdownRed() {
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;

    // Texto escrito sin elegir una red: se vuelve a "todas"
    if (!this.selectedRedName && this.selectedRedCode) {
      this.selectedRedCode = '';
      this.refreshCentrosBySelectedRed();
      this.applyFilters();
    }
  }

  filterRed(event: Event) {
    const searchValue = String((event.target as HTMLInputElement).value ?? '').toLowerCase();
    this.searchRed = searchValue;
    this.isDropdownRedOpen = true;

    // Al editar el texto se descarta la red elegida
    if (this.selectedRedName) {
      this.selectedRedName = '';
      this.selectedRedCode = '';
      this.refreshCentrosBySelectedRed();
      this.applyFilters();
    }

    this.filteredRed = searchValue.trim()
      ? this.dataRed.filter((red: any) => String(red.redasisdes ?? '').toLowerCase().includes(searchValue))
      : this.dataRed;
    this.activeRedIndex = this.filteredRed.length > 0 ? 0 : -1;
    this.scrollActiveIntoView(this.redOptions, this.activeRedIndex);
  }

  selectOptionRed(red: any) {
    this.selectedRedName = red.redasisdes;
    this.selectedRedCode = String(red.redasiscod ?? '').trim();
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;
    this.refreshCentrosBySelectedRed();
    this.applyFilters();
  }

  handleRedKeydown(event: KeyboardEvent) {
    this.handleListKeydown(event, {
      isOpen: this.isDropdownRedOpen,
      open: () => this.openDropdownRed(),
      close: () => this.closeDropdownRed(),
      options: () => this.filteredRed,
      getIndex: () => this.activeRedIndex,
      setIndex: (i) => {
        this.activeRedIndex = i;
        this.scrollActiveIntoView(this.redOptions, i);
      },
      select: (option) => this.selectOptionRed(option),
    });
  }

  // ---------------------------------------------------------------------------
  // Desplegables: centro asistencial
  // ---------------------------------------------------------------------------

  private getCentroOptions(): any[] {
    return this.searchCentro ? this.filteredCentro : this.dataCentro;
  }

  openDropdownCentro() {
    this.isDropdownCentroOpen = true;
    this.filteredCentro = this.dataCentro;
    this.activeCentroIndex = this.getCentroOptions().length > 0 ? 0 : -1;
    this.scrollActiveIntoView(this.centroOptions, this.activeCentroIndex);
  }

  closeDropdownCentro() {
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;

    if (!this.selectedCentroName && this.selectedCentroCode) {
      this.selectedCentroCode = '';
      this.applyFilters();
    }
  }

  filterCentro(event: Event) {
    const searchValue = String((event.target as HTMLInputElement).value ?? '').toLowerCase();
    this.searchCentro = searchValue;
    this.isDropdownCentroOpen = true;

    if (this.selectedCentroName) {
      this.selectedCentroName = '';
      this.selectedCentroCode = '';
      this.applyFilters();
    }

    this.filteredCentro = searchValue.trim()
      ? this.dataCentro.filter((centro: any) =>
          String(centro.cenasides ?? '').toLowerCase().includes(searchValue),
        )
      : this.dataCentro;
    this.activeCentroIndex = this.getCentroOptions().length > 0 ? 0 : -1;
    this.scrollActiveIntoView(this.centroOptions, this.activeCentroIndex);
  }

  selectOptionCentro(centro: any) {
    this.selectedCentroName = centro.cenasides;
    this.selectedCentroCode = String(centro.cenasicod ?? '').trim();
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
    this.applyFilters();
  }

  handleCentroKeydown(event: KeyboardEvent) {
    this.handleListKeydown(event, {
      isOpen: this.isDropdownCentroOpen,
      open: () => this.openDropdownCentro(),
      close: () => this.closeDropdownCentro(),
      options: () => this.getCentroOptions(),
      getIndex: () => this.activeCentroIndex,
      setIndex: (i) => {
        this.activeCentroIndex = i;
        this.scrollActiveIntoView(this.centroOptions, i);
      },
      select: (option) => this.selectOptionCentro(option),
    });
  }

  private refreshCentrosBySelectedRed(): void {
    const selectedRedCode = this.normalizeCode(this.selectedRedCode);

    this.dataCentro = selectedRedCode
      ? this.dataCentroCompleto.filter((centro: any) => this.normalizeCode(centro.redasiscod) === selectedRedCode)
      : [...this.dataCentroCompleto];

    this.filteredCentro = this.searchCentro
      ? this.dataCentro.filter((centro: any) =>
          String(centro.cenasides ?? '').toLowerCase().includes(this.searchCentro),
        )
      : this.dataCentro;

    if (this.selectedCentroCode) {
      const selectedCentroCode = this.normalizeCode(this.selectedCentroCode);
      const stillAvailable = this.dataCentro.some(
        (centro: any) => this.normalizeCode(centro.cenasicod) === selectedCentroCode,
      );
      if (!stillAvailable) {
        this.selectedCentroName = '';
        this.selectedCentroCode = '';
      }
    }
  }

  /** Navegación por teclado compartida por los tres desplegables. */
  private handleListKeydown(
    event: KeyboardEvent,
    list: {
      isOpen: boolean;
      open: () => void;
      close: () => void;
      options: () => any[];
      getIndex: () => number;
      setIndex: (index: number) => void;
      select: (option: any) => void;
    },
  ): void {
    const key = event.key;

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!list.isOpen) {
        list.open();
      }
      const options = list.options();
      if (options.length === 0) {
        list.setIndex(-1);
        return;
      }
      const current = list.getIndex();
      list.setIndex(
        key === 'ArrowDown' ? Math.min(current + 1, options.length - 1) : Math.max(current - 1, 0),
      );
      return;
    }

    if (key === 'Enter') {
      if (!list.isOpen) return;
      event.preventDefault();
      const options = list.options();
      const index = list.getIndex() >= 0 ? list.getIndex() : 0;
      if (options[index]) {
        list.select(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      list.close();
    }
  }

  private scrollActiveIntoView(items: QueryList<ElementRef<HTMLElement>> | undefined, index: number) {
    if (index < 0) return;
    setTimeout(() => items?.toArray()[index]?.nativeElement.scrollIntoView({ block: 'nearest' }), 0);
  }

  private normalizeCode(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  private isLoginUrl(url: unknown): boolean {
    if (!url) return false;
    return String(url).toLowerCase().includes('/login');
  }

  // ---------------------------------------------------------------------------
  // Gráficos
  // ---------------------------------------------------------------------------

  private renderCharts(dataLogin: LogRow[], dataTotalLogs: LogRow[]): void {
    const conteoRol = this.contarPorRol(dataLogin);
    const fecha = this.procesarDatosPorFecha(dataLogin);
    const conteoBrowser = this.contarPorNavegador(dataTotalLogs);
    const url = this.contarTopUrls(dataTotalLogs);

    this.renderChartRol(conteoRol);
    this.renderChartFecha(fecha.labels, fecha.values);
    this.renderChartBrowser(conteoBrowser);
    this.renderChartUrl(url.labels, url.values);
    this.cdr.markForCheck();
  }

  /**
   * Crea el gráfico o lo actualiza. Si el contenedor cambió (la vista se volvió a
   * crear) la instancia anterior se descarta: actualizarla pintaría en un nodo
   * que ya no está en la página, que era la causa de los gráficos en blanco.
   */
  private upsertChart(
    key: ChartKey,
    container: HTMLElement | undefined,
    hasData: boolean,
    build: () => ApexOptions,
    update: () => ApexOptions,
  ): void {
    this.chartEmpty[key] = !hasData;
    if (!container) return;

    const current = this.charts[key];
    if (!hasData) {
      current?.destroy();
      delete this.charts[key];
      return;
    }

    if (current && (current as any).el === container) {
      current.updateOptions(update());
      return;
    }

    current?.destroy();
    const chart = new ApexCharts(container, build());
    this.charts[key] = chart;
    chart.render();
  }

  private destroyCharts(): void {
    (Object.keys(this.charts) as ChartKey[]).forEach((key) => this.charts[key]?.destroy());
    this.charts = {};
  }

  private baseChart(type: 'bar' | 'area' | 'donut', height: number): ApexOptions['chart'] {
    return {
      type,
      height,
      fontFamily: CHART_FONT,
      foreColor: CHART_INK,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 300 },
    };
  }

  private renderChartRol(conteo: Record<string, number>): void {
    const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([role]) => role || 'Sin rol');
    const values = entries.map(([, count]) => count);

    this.upsertChart(
      'rol',
      this.chartRolContainer?.nativeElement,
      entries.length > 0,
      () => ({
        series: [{ name: 'Ingresos', data: values }],
        chart: this.baseChart('bar', 300),
        plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 3 } },
        dataLabels: { enabled: false },
        colors: [BRAND],
        grid: { borderColor: CHART_GRID, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
        xaxis: { categories: labels, labels: { formatter: (v: string) => this.formatInt(Number(v)) } },
        yaxis: { labels: { maxWidth: 180 } },
        tooltip: { y: { formatter: (val: number) => `${this.formatInt(val)} ingresos` } },
        legend: { show: false },
      }),
      () => ({ xaxis: { categories: labels }, series: [{ name: 'Ingresos', data: values }] }),
    );
  }

  private renderChartFecha(labels: string[], values: number[]): void {
    this.upsertChart(
      'fecha',
      this.chartFechaContainer?.nativeElement,
      labels.length > 0,
      () => ({
        series: [{ name: 'Ingresos', data: values }],
        chart: this.baseChart('area', 280),
        stroke: { curve: 'monotoneCubic', width: 2 },
        dataLabels: { enabled: false },
        markers: { size: labels.length > 31 ? 0 : 3, strokeWidth: 0, hover: { size: 5 } },
        colors: [BRAND],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.22, opacityTo: 0.02, stops: [0, 100] } },
        grid: { borderColor: CHART_GRID, strokeDashArray: 3 },
        xaxis: {
          categories: labels,
          tickAmount: Math.min(labels.length, 12),
          labels: { rotate: 0, hideOverlappingLabels: true, style: { fontSize: '11px' } },
          axisBorder: { color: CHART_GRID },
          axisTicks: { show: false },
        },
        yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => this.formatInt(v) } },
        tooltip: { y: { formatter: (val: number) => `${this.formatInt(val)} ingresos` } },
        legend: { show: false },
      }),
      () => ({
        xaxis: { categories: labels, tickAmount: Math.min(labels.length, 12) },
        markers: { size: labels.length > 31 ? 0 : 3 },
        series: [{ name: 'Ingresos', data: values }],
      }),
    );
  }

  private renderChartBrowser(conteo: Record<string, number>): void {
    const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([browser]) => browser);
    const values = entries.map(([, count]) => count);

    this.upsertChart(
      'browser',
      this.chartBrowserContainer?.nativeElement,
      entries.length > 0,
      () => ({
        series: values,
        labels,
        chart: this.baseChart('donut', 300),
        colors: DONUT_COLORS,
        stroke: { width: 2, colors: ['#ffffff'] },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                value: { fontSize: '22px', fontWeight: 700, color: '#17324d', formatter: (v: string) => this.formatInt(Number(v)) },
                total: {
                  show: true,
                  label: 'Registros',
                  color: CHART_INK,
                  formatter: (w: any) => this.formatInt(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
                },
              },
            },
          },
        },
        legend: { position: 'bottom', fontSize: '12px', markers: { size: 5 }, itemMargin: { horizontal: 8, vertical: 2 } },
        tooltip: { y: { formatter: (val: number) => `${this.formatInt(val)} registros` } },
      }),
      () => ({ labels, series: values }),
    );
  }

  private renderChartUrl(labels: string[], values: number[]): void {
    this.upsertChart(
      'url',
      this.chartUrlContainer?.nativeElement,
      labels.length > 0,
      () => ({
        series: [{ name: 'Visitas', data: values }],
        chart: this.baseChart('bar', 320),
        plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 3 } },
        dataLabels: { enabled: false },
        colors: [BRAND],
        grid: { borderColor: CHART_GRID, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
        xaxis: { categories: labels, labels: { formatter: (v: string) => this.formatInt(Number(v)) } },
        yaxis: { labels: { maxWidth: 260, style: { fontSize: '12px' } } },
        tooltip: { y: { formatter: (val: number) => `${this.formatInt(val)} visitas` } },
        legend: { show: false },
      }),
      () => ({ xaxis: { categories: labels }, series: [{ name: 'Visitas', data: values }] }),
    );
  }

  private contarPorRol(data: LogRow[]): Record<string, number> {
    const acc: Record<string, number> = {};
    for (const log of data) {
      const role = String(log['user_role'] ?? '').trim();
      acc[role] = (acc[role] || 0) + 1;
    }
    return acc;
  }

  private procesarDatosPorFecha(data: LogRow[]): { labels: string[]; values: number[] } {
    const conteo: Record<string, number> = {};
    for (const log of data) {
      if (log._ymd) conteo[log._ymd] = (conteo[log._ymd] || 0) + 1;
    }
    const sorted = Object.entries(conteo).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: sorted.map(([ymd]) => {
        const [year, month, day] = ymd.split('-');
        return `${day}/${month}/${year}`;
      }),
      values: sorted.map(([, count]) => count),
    };
  }

  private contarPorNavegador(data: LogRow[]): Record<string, number> {
    const acc: Record<string, number> = {};
    for (const log of data) {
      const browser = String(log['browser'] ?? '').trim() || 'Desconocido';
      acc[browser] = (acc[browser] || 0) + 1;
    }
    return acc;
  }

  private contarTopUrls(data: LogRow[]): { labels: string[]; values: number[] } {
    const acc: Record<string, number> = {};
    for (const log of data) {
      const url = String(log['url'] ?? '').trim() || 'Sin URL';
      acc[url] = (acc[url] || 0) + 1;
    }
    const top = Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    return { labels: top.map(([url]) => url), values: top.map(([, count]) => count) };
  }

  formatInt(value: number): string {
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
}
