import { UsersService } from './../../services/users-service';
import { Component, ElementRef, OnInit, QueryList, ViewChildren, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChangeDetectorRef } from '@angular/core';
import { LogsUsersService } from '../../services/logs-users-service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EstablecimientoService } from '../../services/establecimiento-service';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { User } from '../../model/user';

@Component({
  selector: 'app-logs-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    ScrollingModule,
  ],
  templateUrl: './logs-reports.html',
  styleUrl: './logs-reports.css',
})
export class LogsReports implements OnInit, OnDestroy {
  @ViewChildren('userOption') userOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('redOption') redOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('centroOption') centroOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('chartRolContainer') chartRolContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chartFechaContainer') chartFechaContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chartBrowserContainer') chartBrowserContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('chartUrlContainer') chartUrlContainer!: ElementRef<HTMLDivElement>;

  //Datos para los usuarios
  dataUser: User[] = [];
  filteredUser: User[] = [];

  searchUser: string = '';
  isDropdownUserOpen: boolean = false;
  filteredAvailableUsers: Array<{ id: string; label: string }> = [];
  selectedUserLabel: string = 'Todos los usuarios';
  activeUserIndex: number = -1;

  /// Datos para el dropdown de Red Asistencial
  dataRed: any[] = [];
  filteredRed: any[] = [];

  searchRed: string = '';
  isDropdownRedOpen: boolean = false;
  selectedRedName: string = '';
  selectedRedCode: string = '';
  activeRedIndex: number = -1;

  ///Datos para el dropdown de Centro Asistencial
  dataCentro: any[] = [];
  dataCentroCompleto: any[] = [];
  filteredCentro: any[] = [];

  searchCentro: string = '';
  isDropdownCentroOpen: boolean = false;
  selectedCentroName: string = '';
  selectedCentroCode: string = '';
  isCentroEnabled: boolean = true;
  activeCentroIndex: number = -1;

  dataSource = new MatTableDataSource<any>();
  allLogsData: any[] = [];
  tableLogsData: any[] = [];
  allLogs: any[] = [];
  allLogsOriginal: any[] = [];
  loginLogs: any[] = [];

  totalIngresos = 0;
  filteredCount = 0;
  isLoading = true;
  private pendingLoads = 0;

  // ApexCharts instances
  private chartRolInstance?: ApexCharts;
  private chartFechaInstance?: ApexCharts;
  private chartBrowserInstance?: ApexCharts;
  private chartUrlInstance?: ApexCharts;

  // Filtros

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

  openDropdownRed() {
    this.isDropdownRedOpen = true;
    if (!this.searchRed) {
      this.filteredRed = this.dataRed;
    }
    this.activeRedIndex = this.filteredRed.length > 0 ? 0 : -1;
    this.scrollActiveRedIntoView();
  }

  closeDropdownRed() {
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;

    // Si no hay red seleccionada, mostrar todos los centros
    if (!this.selectedRedName) {
      this.selectedRedCode = '';
      this.refreshCentrosBySelectedRed();
      this.applyFilters();
    }
  }

  filterRed(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchRed = searchValue;
    this.isDropdownRedOpen = true;

    // Cuando el usuario edita el input, limpiar la selección actual
    if (this.selectedRedName) {
      this.selectedRedName = '';
      this.selectedRedCode = '';
      this.refreshCentrosBySelectedRed();
      this.applyFilters();
    }

    if (searchValue.trim() === '') {
      this.filteredRed = this.dataRed;
    } else {
      this.filteredRed = this.dataRed.filter((red: any) =>
        red.redasisdes.toLowerCase().includes(searchValue),
      );
    }
    this.activeRedIndex = this.filteredRed.length > 0 ? 0 : -1;
    this.scrollActiveRedIntoView();
  }

  selectOptionRed(red: any) {
    this.selectedRedName = red.redasisdes;
    this.selectedRedCode = String(red.redasiscod ?? '').trim();
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;

    // Filtrar centros por la red seleccionada
    this.refreshCentrosBySelectedRed();

    this.applyFilters();
  }

  /// Centro Asistencial Metodos

  openDropdownCentro() {
    this.isDropdownCentroOpen = true;
    this.filteredCentro = this.dataCentro;
    const options = this.getCentroOptions();
    this.activeCentroIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }

  closeDropdownCentro() {
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;

    // Si no hay centro seleccionado, limpiar el código
    if (!this.selectedCentroName) {
      this.selectedCentroCode = '';
      this.applyFilters();
    }
  }

  filterCentro(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchCentro = searchValue;
    this.isDropdownCentroOpen = true;

    // Cuando el usuario edita el input, limpiar la selección actual
    if (this.selectedCentroName) {
      this.selectedCentroName = '';
      this.selectedCentroCode = '';
      this.applyFilters();
    }

    if (searchValue.trim() === '') {
      this.filteredCentro = this.dataCentro;
    } else {
      this.filteredCentro = this.dataCentro.filter((centro: any) =>
        centro.cenasides.toLowerCase().includes(searchValue),
      );
    }
    const options = this.getCentroOptions();
    this.activeCentroIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }
  selectOptionCentro(centro: any) {
    this.selectedCentroName = centro.cenasides;
    this.selectedCentroCode = String(centro.cenasicod ?? '').trim();
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;

    this.applyFilters();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.getUser();
    this.GetLogsUsers();
    this.getRed();
    this.getCentroWithRed();
  }


  ngOnDestroy(): void {
    // Clean up chart instances to prevent memory leaks
    this.chartRolInstance?.destroy();
    this.chartFechaInstance?.destroy();
    this.chartBrowserInstance?.destroy();
    this.chartUrlInstance?.destroy();
  }

  private getCentroOptions(): any[] {
    return this.searchCentro ? this.filteredCentro : this.dataCentro;
  }

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

  openDropdownUser() {
    this.isDropdownUserOpen = true;
    if (!this.searchUser) {
      this.filteredAvailableUsers = this.getAllUserOptions();
    }
    const options = this.getUserOptions();
    this.activeUserIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveUserIntoView();
  }

  focusDropdownUser() {
    this.searchUser = '';
    this.isDropdownUserOpen = true;
    this.filteredAvailableUsers = this.getAllUserOptions();
    const options = this.getUserOptions();
    this.activeUserIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveUserIntoView();
  }

  closeDropdownUser() {
    this.isDropdownUserOpen = false;
    this.searchUser = '';
    this.activeUserIndex = -1;
    this.syncSelectedUserLabel();
  }

  filterUser(event: any) {
    const rawValue = String(event.target.value ?? '');
    const searchValue = rawValue.toLowerCase();
    this.searchUser = rawValue;
    this.isDropdownUserOpen = true;

    const allOptions = this.getAllUserOptions();
    if (searchValue.trim() === '') {
      this.filteredAvailableUsers = allOptions;
    } else {
      this.filteredAvailableUsers = allOptions.filter((user) =>
        user.label.toLowerCase().includes(searchValue) || user.id.toLowerCase().includes(searchValue),
      );
    }

    const options = this.getUserOptions();
    this.activeUserIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveUserIntoView();
  }

  selectOptionUser(user: { id: string; label: string }) {
    this.selectedUserId = user.id;
    this.selectedUserLabel = user.label;
    this.isDropdownUserOpen = false;
    this.searchUser = '';
    this.activeUserIndex = -1;

    this.onUserChange();
  }

  handleRedKeydown(event: KeyboardEvent) {
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownRedOpen) {
        this.openDropdownRed();
      }
      const options = this.filteredRed;
      if (options.length === 0) {
        this.activeRedIndex = -1;
        return;
      }
      this.activeRedIndex = Math.min(this.activeRedIndex + 1, options.length - 1);
      this.scrollActiveRedIntoView();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isDropdownRedOpen) {
        this.openDropdownRed();
      }
      const options = this.filteredRed;
      if (options.length === 0) {
        this.activeRedIndex = -1;
        return;
      }
      this.activeRedIndex = Math.max(this.activeRedIndex - 1, 0);
      this.scrollActiveRedIntoView();
      return;
    }

    if (key === 'Enter') {
      if (!this.isDropdownRedOpen) {
        return;
      }
      event.preventDefault();
      const options = this.filteredRed;
      const index = this.activeRedIndex >= 0 ? this.activeRedIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectOptionRed(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdownRed();
    }
  }

  handleUserKeydown(event: KeyboardEvent) {
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownUserOpen) {
        this.openDropdownUser();
      }
      const options = this.getUserOptions();
      if (options.length === 0) {
        this.activeUserIndex = -1;
        return;
      }
      this.activeUserIndex = Math.min(this.activeUserIndex + 1, options.length - 1);
      this.scrollActiveUserIntoView();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isDropdownUserOpen) {
        this.openDropdownUser();
      }
      const options = this.getUserOptions();
      if (options.length === 0) {
        this.activeUserIndex = -1;
        return;
      }
      this.activeUserIndex = Math.max(this.activeUserIndex - 1, 0);
      this.scrollActiveUserIntoView();
      return;
    }

    if (key === 'Enter') {
      if (!this.isDropdownUserOpen) {
        return;
      }
      event.preventDefault();
      const options = this.getUserOptions();
      const index = this.activeUserIndex >= 0 ? this.activeUserIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectOptionUser(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdownUser();
    }
  }

  handleCentroKeydown(event: KeyboardEvent) {
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownCentroOpen) {
        this.openDropdownCentro();
      }
      const options = this.getCentroOptions();
      if (options.length === 0) {
        this.activeCentroIndex = -1;
        return;
      }
      this.activeCentroIndex = Math.min(this.activeCentroIndex + 1, options.length - 1);
      this.scrollActiveCentroIntoView();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isDropdownCentroOpen) {
        this.openDropdownCentro();
      }
      const options = this.getCentroOptions();
      if (options.length === 0) {
        this.activeCentroIndex = -1;
        return;
      }
      this.activeCentroIndex = Math.max(this.activeCentroIndex - 1, 0);
      this.scrollActiveCentroIntoView();
      return;
    }

    if (key === 'Enter') {
      if (!this.isDropdownCentroOpen) {
        return;
      }
      event.preventDefault();
      const options = this.getCentroOptions();
      const index = this.activeCentroIndex >= 0 ? this.activeCentroIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectOptionCentro(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdownCentro();
    }
  }

  private scrollActiveRedIntoView() {
    if (!this.isDropdownRedOpen || this.activeRedIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.redOptions?.toArray();
      const target = items?.[this.activeRedIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  private scrollActiveUserIntoView() {
    if (!this.isDropdownUserOpen || this.activeUserIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.userOptions?.toArray();
      const target = items?.[this.activeUserIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  private scrollActiveCentroIntoView() {
    if (!this.isDropdownCentroOpen || this.activeCentroIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.centroOptions?.toArray();
      const target = items?.[this.activeCentroIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  private beginLoading(): void {
    this.pendingLoads += 1;
    this.isLoading = true;
  }

  private endLoading(): void {
    this.pendingLoads = Math.max(0, this.pendingLoads - 1);
    this.isLoading = this.pendingLoads > 0;
  }

  getUser() {
    this.userService.getAllUsers().subscribe({
      next: (resp) => {
        this.dataUser = resp;
        this.filteredUser = resp;
        this.setupUserFilter();
      },
      error: (err) => {
        console.log('Error al obtener los usuarios', err);
      },
    });
  }

  getRed() {
    this.beginLoading();
    this.establecimientoService.getRed().subscribe({
      next: (resp) => {
        this.dataRed = resp;
        this.endLoading();
      },
      error: (err) => {
        console.log('Error al obtener las redes', err);
        this.endLoading();
      },
    });
  }

  getCentroWithRed() {
    this.beginLoading();
    this.establecimientoService.getCentrosWithRed().subscribe({
      next: (resp) => {
        this.dataCentroCompleto = resp;
        this.refreshCentrosBySelectedRed();
        this.endLoading();
      },
      error: (err) => {
        console.log('Error al obtener los centros', err);
        this.endLoading();
      },
    });
  }

   GetLogsUsers(): void {
    this.beginLoading();
    this.logsusersService.getLogs().subscribe({
      next: (data) => {
        this.allLogsData = data;
        this.tableLogsData = [...data];
        this.allLogs = [...this.tableLogsData];
        this.allLogsOriginal = [...this.tableLogsData];
        this.loginLogs = data.filter((log) => this.isLoginUrl(log.url));
        this.dataSource.data = this.allLogs;
        this.setupYearFilter();
        this.setupDayFilter();
        this.setDefaultFilters();
        this.applyFilters();
        this.cdr.detectChanges();
        this.endLoading();
      },
      error: (err) => {
        console.error('Error al obtener los logs de usuarios');
        this.endLoading();
      },
    });
  }

  private refreshCentrosBySelectedRed(): void {
    const selectedRedCode = this.normalizeCode(this.selectedRedCode);

    if (selectedRedCode) {
      this.dataCentro = this.dataCentroCompleto.filter(
        (centro: any) => this.normalizeCode(centro.redasiscod) === selectedRedCode,
      );
    } else {
      this.dataCentro = [...this.dataCentroCompleto];
    }

    this.filteredCentro = this.searchCentro
      ? this.dataCentro.filter((centro: any) =>
          String(centro.cenasides ?? '').toLowerCase().includes(this.searchCentro),
        )
      : this.dataCentro;

    if (this.selectedCentroCode) {
      const selectedCentroCode = this.normalizeCode(this.selectedCentroCode);
      const selectedCentro = this.dataCentro.find(
        (centro: any) => this.normalizeCode(centro.cenasicod) === selectedCentroCode,
      );

      if (!selectedCentro) {
        this.selectedCentroName = '';
        this.selectedCentroCode = '';
      }
    }
  }

  private normalizeCode(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }



  private setupYearFilter(): void {
    if (this.loginLogs.length === 0) return;

    const years = new Set<number>();
    this.loginLogs.forEach((log) => {
      if (log.date) {
        const year = new Date(log.date).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });

    this.availableYears = Array.from(years)
      .sort((a, b) => a - b)
      .map(String);
  }

  private setupDayFilter(): void {
    if (this.loginLogs.length === 0) return;

    const days = new Set<string>();
    this.loginLogs.forEach((log) => {
      if (log.date) {
        const day = String(new Date(log.date).getDate()).padStart(2, '0');
        days.add(day);
      }
    });

    this.availableDays = Array.from(days)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(String);
  }

  private updateDaysForSelectedMonth(): void {
    if (this.loginLogs.length === 0) {
      this.availableDays = [];
      return;
    }

    // Extract unique days from filtered data
    const days = new Set<string>();
    this.loginLogs.forEach((log: any) => {
      if (!log.date) return;

      // Apply year filter
      if (this.selectedYear !== 'todos' && String(new Date(log.date).getFullYear()) !== this.selectedYear) {
        return;
      }

      // Apply month filter
      if (this.selectedMonth !== 'todos' && String(new Date(log.date).getMonth() + 1).padStart(2, '0') !== this.selectedMonth) {
        return;
      }

      const day = String(new Date(log.date).getDate()).padStart(2, '0');
      days.add(day);
    });

    this.availableDays = Array.from(days)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(String);

    // Reset selected day if not available
    if (this.selectedDay && !this.availableDays.includes(this.selectedDay)) {
      this.selectedDay = '';
    }
  }

  private setDefaultFilters(): void {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());

    this.selectedMonth = currentMonth;
    this.selectedYear = this.availableYears.includes(currentYear)
      ? currentYear
      : this.availableYears[this.availableYears.length - 1] || 'todos';

    this.updateDaysForSelectedMonth();
    this.setupUserFilter();
  }

  private setupUserFilter(): void {
    const usersMap = new Map<string, string>();

    this.dataUser.forEach((user) => {
      const id = String(user.id ?? '').trim();
      if (!id) return;

      const name = String(user.name ?? '').trim();
      const lastname = String(user.lastname ?? '').trim();
      const dni = String(user.dni ?? '').trim();
      const username = String(user.username ?? '').trim();
      const fullName = `${name} ${lastname}`.trim();

      const labelBase = fullName || username || `Usuario ${id}`;
      const label = dni ? `${labelBase} (${dni})` : labelBase;

      if (!usersMap.has(id)) {
        usersMap.set(id, label);
      }
    });

    if (usersMap.size === 0) {
      this.loginLogs.forEach((log) => {
        const id = String(log.id_user ?? '').trim();
        if (!id) return;

        const fullName = String(log.full_name ?? '').trim();
        const dni = String(log.dni ?? '').trim();
        const label = fullName
          ? `${fullName}${dni ? ` (${dni})` : ''}`
          : dni
            ? dni
            : `Usuario ${id}`;

        if (!usersMap.has(id)) {
          usersMap.set(id, label);
        }
      });
    }

    this.availableUsers = Array.from(usersMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, label]) => ({ id, label }));

    if (this.selectedUserId !== 'todos' && !this.availableUsers.some((user) => user.id === this.selectedUserId)) {
      this.selectedUserId = 'todos';
    }

    this.syncSelectedUserLabel();

    if (!this.searchUser) {
      this.filteredAvailableUsers = this.getAllUserOptions();
    }
  }

  applyFilters(): void {

    const dataLogin = this.applyAllFiltersOptimized([...this.loginLogs]);
    const dataTotalLogs = this.applyAllFiltersOptimized([...this.allLogsData]);
    const tableData = this.applyColumnFilters(this.tableLogsData);

    this.totalIngresos = dataLogin.length;
    this.filteredCount = dataTotalLogs.length;
    this.allLogsOriginal = [...this.tableLogsData];
    this.allLogs = [...tableData];
    this.dataSource.data = this.allLogs;


    this.renderCharts(dataLogin, dataTotalLogs);
    this.isLoading = false;
  }

  private applyColumnFilters(data: any[]): any[] {
    return data.filter((row) => this.applyAllFilters(row));
  }

  private applyAllFiltersOptimized(data: any[]): any[] {
    return data.filter((log) => {
      // Filter by year
      if (this.selectedYear !== 'todos') {
        if (!log.date || String(new Date(log.date).getFullYear()) !== this.selectedYear) {
          return false;
        }
      }

      // Filter by month
      if (this.selectedMonth !== 'todos') {
        if (!log.date || String(new Date(log.date).getMonth() + 1).padStart(2, '0') !== this.selectedMonth) {
          return false;
        }
      }

      // Filter by day
      if (this.selectedDay) {
        if (!log.date || String(new Date(log.date).getDate()).padStart(2, '0') !== this.selectedDay) {
          return false;
        }
      }

      // Filter by red code
      if (this.selectedRedCode) {
        const logRedCode = String(log.code_red ?? '').trim().toLowerCase();
        const selectedRedCode = String(this.selectedRedCode).trim().toLowerCase();
        if (logRedCode !== selectedRedCode) {
          return false;
        }
      }

      // Filter by centro code
      if (this.selectedCentroCode) {
        const logCentroCode = String(log.codcas ?? '').trim().toLowerCase();
        const selectedCentroCode = String(this.selectedCentroCode).trim().toLowerCase();
        if (logCentroCode !== selectedCentroCode) {
          return false;
        }
      }

      // Filter by user id
      if (this.selectedUserId !== 'todos') {
        const logUserId = String(log.id_user ?? '').trim();
        if (logUserId !== this.selectedUserId) {
          return false;
        }
      }

      return true;
    });
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

  private isLoginUrl(url: unknown): boolean {
    if (!url) return false;
    const value = String(url).toLowerCase().trim();
    return value === '/login' || value.startsWith('/login?') || value.includes('/login');
  }

  private renderCharts(dataLogin: any[], dataTotalLogs: any[], retryCount = 0): void {
    setTimeout(() => {
      if (!this.chartRolContainer || !this.chartFechaContainer || !this.chartBrowserContainer || !this.chartUrlContainer) {
        if (retryCount < 5) {
          this.renderCharts(dataLogin, dataTotalLogs, retryCount + 1);
        }
        return;
      }

      const conteoRol = this.contarPorRol(dataLogin);
      const { labels: fechaLabels, values: fechaValues } = this.procesarDatosPorFecha(dataLogin);
      const conteoBrowser = this.contarPorNavegador(dataTotalLogs);
      const { labels: urlLabels, values: urlValues } = this.contarTopUrls(dataTotalLogs);

      this.renderChartRol(conteoRol);
      this.renderChartFecha(fechaLabels, fechaValues);
      this.renderChartBrowser(conteoBrowser);
      this.renderChartUrl(urlLabels, urlValues);

      this.cdr.detectChanges();
    }, 100);
  }

  private renderChartRol(conteo: Record<string, number>): void {
    const container = this.chartRolContainer?.nativeElement;
    if (!container) {
      return;
    }

    if (Object.keys(conteo).length === 0) {
      if (this.chartRolInstance) {
        this.chartRolInstance.destroy();
        this.chartRolInstance = undefined;
      }
      return;
    }

    const labels = Object.keys(conteo);
    const values = Object.values(conteo);

    // Si el gráfico ya existe, actualizarlo en lugar de recrearlo
    if (this.chartRolInstance) {
      this.chartRolInstance.updateOptions({
        xaxis: {
          categories: labels
        },
        series: [{
          name: 'Logs por Rol',
          data: values
        }]
      });
      return;
    }

    const options: ApexOptions = {
      series: [{
        name: 'Logs por Rol',
        data: values
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: true }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          distributed: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['transparent'],
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            fontSize: '11px',
          },
          rotate: -45,
        },
      },
      yaxis: {
        title: {
          text: 'Cantidad de Logs',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
          },
        },
      },
      colors: ['#0064AF', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B'],
      tooltip: {
        y: {
          formatter: (val: number) => `${val} logs`,
        },
      },
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 1100,
          options: {
            chart: { height: 300 },
          },
        },
        {
          breakpoint: 768,
          options: {
            chart: { height: 260 },
            plotOptions: {
              bar: {
                columnWidth: '70%',
              },
            },
            xaxis: {
              labels: {
                rotate: -25,
                trim: true,
                maxHeight: 60,
                style: { fontSize: '10px' },
              },
            },
          },
        },
      ],
    };

    this.chartRolInstance = new ApexCharts(container, options);
    this.chartRolInstance.render();
  }

  private renderChartFecha(labels: string[], values: number[]): void {
    const container = this.chartFechaContainer?.nativeElement;
    if (!container) {
      return;
    }

    if (labels.length === 0) {
      if (this.chartFechaInstance) {
        this.chartFechaInstance.destroy();
        this.chartFechaInstance = undefined;
      }
      return;
    }

    // Si el gráfico ya existe, actualizarlo en lugar de recrearlo
    if (this.chartFechaInstance) {
      this.chartFechaInstance.updateOptions({
        xaxis: {
          categories: labels
        },
        series: [{
          name: 'Logs por Fecha',
          data: values
        }]
      });
      return;
    }

    const options: ApexOptions = {
      series: [{
        name: 'Logs por Fecha',
        data: values
      }],
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: true },
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: 5,
        hover: {
          size: 7,
        },
      },
      xaxis: {
        categories: labels,
        title: {
          text: 'FECHA',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
          },
        },
        labels: {
          style: {
            fontSize: '11px',
          },
          rotate: -45,
        },
      },
      yaxis: {
        title: {
          text: 'Cantidad de Logs',
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
          },
        },
      },
      colors: ['#00AEEF'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100, 100, 100],
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} logs`,
        },
      },
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 1100,
          options: {
            chart: { height: 300 },
          },
        },
        {
          breakpoint: 768,
          options: {
            chart: { height: 260 },
            markers: { size: 4 },
            xaxis: {
              labels: {
                rotate: -25,
                trim: true,
                maxHeight: 60,
                style: { fontSize: '10px' },
              },
            },
          },
        },
      ],
    };

    this.chartFechaInstance = new ApexCharts(container, options);
    this.chartFechaInstance.render();
  }

  private renderChartBrowser(conteo: Record<string, number>): void {
    const container = this.chartBrowserContainer?.nativeElement;
    if (!container) {
      return;
    }

    const labels = Object.keys(conteo);
    const values = Object.values(conteo);

    if (labels.length === 0) {
      this.chartBrowserInstance?.destroy();
      this.chartBrowserInstance = undefined;
      return;
    }

    if (this.chartBrowserInstance) {
      this.chartBrowserInstance.updateOptions({
        labels,
        series: values,
      });
      return;
    }

    const options: ApexOptions = {
      chart: {
        type: 'donut',
        height: 350,
      },
      labels,
      series: values,
      legend: {
        position: 'bottom',
      },
      dataLabels: {
        enabled: true,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} logs`,
        },
      },
      colors: ['#0B63A7', '#00AEEF', '#45B7D1', '#5BC0DE', '#88D498', '#F9C74F'],
      responsive: [
        {
          breakpoint: 1100,
          options: {
            chart: { height: 300 },
          },
        },
        {
          breakpoint: 768,
          options: {
            chart: { height: 250 },
            legend: {
              position: 'bottom',
              fontSize: '11px',
            },
          },
        },
      ],
    };

    this.chartBrowserInstance = new ApexCharts(container, options);
    this.chartBrowserInstance.render();
  }

  private renderChartUrl(labels: string[], values: number[]): void {
    const container = this.chartUrlContainer?.nativeElement;
    if (!container) {
      return;
    }

    if (labels.length === 0) {
      this.chartUrlInstance?.destroy();
      this.chartUrlInstance = undefined;
      return;
    }

    if (this.chartUrlInstance) {
      this.chartUrlInstance.updateOptions({
        xaxis: {
          categories: labels,
        },
        series: [
          {
            name: 'Logs por URL',
            data: values,
          },
        ],
      });
      return;
    }

    const options: ApexOptions = {
      series: [
        {
          name: 'Logs por URL',
          data: values,
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: true },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: labels,
        title: {
          text: 'Cantidad de Logs',
        },
      },
      colors: ['#0B63A7'],
      tooltip: {
        y: {
          formatter: (val: number) => `${val} logs`,
        },
      },
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 1100,
          options: {
            chart: { height: 300 },
          },
        },
        {
          breakpoint: 768,
          options: {
            chart: { height: 260 },
            yaxis: {
              labels: {
                style: {
                  fontSize: '10px',
                },
              },
            },
          },
        },
      ],
    };

    this.chartUrlInstance = new ApexCharts(container, options);
    this.chartUrlInstance.render();
  }

  private contarPorRol(data: any[]): Record<string, number> {
    return data.reduce(
      (acc, log) => {
        const role = String(log.user_role ?? '');
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private procesarDatosPorFecha(data: any[]): { labels: string[]; values: number[] } {
    const conteo: Record<string, number> = {};

    data.forEach((log) => {
      if (!log.date) return;
      const fecha = String(log.date).substring(0, 10);
      conteo[fecha] = (conteo[fecha] || 0) + 1;
    });

    const sortedEntries = Object.entries(conteo).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      labels: sortedEntries.map(([fecha]) => {
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
      }),
      values: sortedEntries.map(([, count]) => count),
    };
  }

  private contarPorNavegador(data: any[]): Record<string, number> {
    return data.reduce((acc, log) => {
      const browser = String(log.browser ?? 'Desconocido').trim() || 'Desconocido';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private contarTopUrls(data: any[]): { labels: string[]; values: number[] } {
    const conteo = data.reduce((acc, log) => {
      const url = String(log.url ?? 'Sin URL').trim() || 'Sin URL';
      acc[url] = (acc[url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEntries = (Object.entries(conteo) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: topEntries.map(([url]) => url),
      values: topEntries.map(([, count]) => count),
    };
  }

  //  FORMATEAR FECHA (dd/mm/yyyy hh:mm)
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

  // Filtrar datos de la tabla por columna - Se usa cuando se termina de escribir en los inputs
  private updateTableFilters(): void {
    const filtered = this.applyColumnFilters([...this.tableLogsData]);
    this.allLogs = filtered;
    this.dataSource.data = this.allLogs;
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

    Object.keys(this.filters).forEach((key) => {
      const filterKey = key as keyof typeof this.filters;
      this.filters[filterKey] = '';
    });

    this.refreshCentrosBySelectedRed();
    this.updateDaysForSelectedMonth();
    this.applyFilters();
  }

  // Obtener nombre de Red por código
  getRedNombre(codeRed: string): string {
    if (!codeRed) return '';
    const red = this.dataRed.find((r: any) => this.normalizeCode(r.redasiscod) === this.normalizeCode(codeRed));
    return red ? String(red.redasisdes ?? '') : codeRed;
  }

  // Obtener nombre de Centro por código
  getCentroNombre(codCas: string): string {
    if (!codCas) return '';
    const centro = this.dataCentroCompleto.find((c: any) => this.normalizeCode(c.cenasicod) === this.normalizeCode(codCas));
    return centro ? String(centro.cenasides ?? '') : codCas;
  }

  //Aplicar todos los filtros activos a una fila

  private applyAllFilters(row: any): boolean {
    // Filtro Red
    if (this.filters.code_red && !String(row.code_red ?? '').toLowerCase().includes(this.filters.code_red)) {
      return false;
    }

    // Filtro Centro
    if (this.filters.codcas && !String(row.codcas ?? '').toLowerCase().includes(this.filters.codcas)) {
      return false;
    }

    // Filtro Usuario
    if (this.filters.full_name && !String(row.full_name ?? '').toLowerCase().includes(this.filters.full_name)) {
      return false;
    }

    // Filtro IP
    if (this.filters.ip_user && !String(row.ip_user ?? '').toLowerCase().includes(this.filters.ip_user)) {
      return false;
    }

    // Filtro DNI
    if (this.filters.dni && !String(row.dni ?? '').toLowerCase().includes(this.filters.dni)) {
      return false;
    }



    // Filtro URL
    if (this.filters.url && !String(row.url ?? '').toLowerCase().includes(this.filters.url)) {
      return false;
    }

    // Filtro Browser
    if (this.filters.browser && !String(row.browser ?? '').toLowerCase().includes(this.filters.browser)) {
      return false;
    }

    // Filtro Rol
    if (this.filters.user_role && !String(row.user_role ?? '').toLowerCase().includes(this.filters.user_role)) {
      return false;
    }

    // Filtro Fecha
    if (this.filters.date && !String(row.date ?? '').toLowerCase().includes(this.filters.date)) {
      return false;
    }

    return true;
  }

  //  EXPORTAR CSV - Optimized
  exportCSV(): void {
    const headers = ['ID', 'IP', 'Usuario', 'Evento', 'Método', 'URL', 'Navegador', 'Estado', 'Rol', 'Fecha'];
    const csvRows = [headers.join(',')];

    this.dataSource.data.forEach((log) => {
      const usuario = String(log.full_name ?? '').trim() || `Usuario ${String(log.id_user ?? '').trim() || 'N/A'}`;
      const row = [
        log.id,
        log.ip_user,
        usuario,
        log.log,
        log.request,
        log.url,
        log.browser,
        log.status,
        log.user_role,
        log.date,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
