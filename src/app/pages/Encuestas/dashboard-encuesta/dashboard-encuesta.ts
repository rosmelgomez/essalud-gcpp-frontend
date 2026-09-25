import { Subscription, forkJoin } from 'rxjs';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexStroke,
  ApexLegend,
  ApexPlotOptions,
  ApexNoData,
  ApexGrid,
  ApexTooltip,
} from 'ng-apexcharts';
import { EncuestaService } from '../../../services/encuesta/encuesta-service';
import { User } from '../../../model/user';
import { Categoria, Encuesta, Modulo, Subcategoria, Variable } from '../../../model/encuesta';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { UsersService } from '../../../services/usuario/users-service';

interface DashboardFilters {
  codcas: string;
  id_user: number | null;
  id_modulo: number | null;
  id_categoria: number | null;
  id_subcategoria: number | null;
  id_variable: number | null;
  estado: 'todos' | 'valido' | 'no_valido';
}

interface SerieResumen {
  nombre: string;
  total: number;
}

interface TablaEncuestaFilters {
  fecha: string;
  centro: string;
  usuario: string;
  modulo: string;
  categoria: string;
  subcategoria: string;
  variable: string;
  estado: string;
  comentario: string;
}

/** Registro de encuesta con sus textos resueltos una sola vez al cargar. */
interface FilaEncuesta {
  item: Encuesta;
  fecha: string;
  centro: string;
  usuario: string;
  modulo: string;
  categoria: string;
  subcategoria: string;
  variable: string;
  estado: string;
  estadoClase: string;
  comentario: string;
  orden: number;
  /** Textos normalizados (minúsculas, sin tildes) para los filtros de la tabla. */
  busqueda: Record<keyof TablaEncuestaFilters, string>;
}

type DropdownKey = 'centro' | 'usuario' | 'modulo' | 'categoria' | 'subcategoria' | 'variable' | 'estado';

interface DropdownOption {
  value: string | number | null;
  label: string;
}

type EstadoNormalizado = 'valido' | 'no_valido' | 'otro';

const CHART_FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CHART_INK = '#56697d';
const CHART_GRID = '#edf1f5';
const BRAND = '#0064af';
const ESTADO_COLOR: Record<EstadoNormalizado, string> = {
  valido: '#0f8a4f',
  no_valido: '#c8102e',
  otro: '#9aa9b8',
};

@Component({
  selector: 'app-dashboard-encuesta',
  imports: [CommonModule, FormsModule, ScrollingModule, NgApexchartsModule],
  templateUrl: './dashboard-encuesta.html',
  styleUrl: './dashboard-encuesta.css',
})
export class DashboardEncuesta implements OnInit, OnDestroy {

  readonly centroFijo = {
    cenasicod: 'B63',
    cenasides: 'DIALISIS METROPOLITANO',
  };

  // Datos completos
  users: User[] = [];
  centros: any[] = [];
  modulos: Modulo[] = [];
  categorias: Categoria[] = [];
  subcategorias: Subcategoria[] = [];
  variables: Variable[] = [];
  encuesta: Encuesta[] = [];

  // Datos derivados
  private filas: FilaEncuesta[] = [];
  private filasFiltradas: FilaEncuesta[] = [];
  /** Filas visibles en la tabla: filtros generales + filtros por columna. */
  filasTabla: FilaEncuesta[] = [];
  encuestaFiltrada: Encuesta[] = [];

  private centroNombre = new Map<string, string>();
  private usuarioNombre = new Map<number, string>();
  private moduloNombre = new Map<number, string>();
  private categoriaNombre = new Map<number, string>();
  private subcategoriaNombre = new Map<number, string>();
  private variableNombre = new Map<number, string>();

  // Gráficos
  private readonly baseChart = {
    fontFamily: CHART_FONT,
    foreColor: CHART_INK,
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 300 },
  };

  estadoSeries: ApexNonAxisChartSeries = [];
  estadoLabels: string[] = [];
  estadoColors: string[] = [];
  estadoChart: ApexChart = { ...this.baseChart, type: 'donut', height: 280 };
  estadoLegend: ApexLegend = {
    position: 'bottom',
    fontSize: '13px',
    markers: { size: 5 },
    itemMargin: { horizontal: 10, vertical: 2 },
  };
  estadoDataLabels: ApexDataLabels = { enabled: false };
  estadoStroke: ApexStroke = { width: 2, colors: ['#ffffff'] };
  estadoPlotOptions: ApexPlotOptions = {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          value: {
            fontSize: '22px',
            fontWeight: 700,
            color: '#17324d',
            formatter: (v: string) => this.formatInt(Number(v)),
          },
          total: {
            show: true,
            label: 'Registros',
            color: CHART_INK,
            formatter: (w: any) =>
              this.formatInt(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
          },
        },
      },
    },
  };
  estadoTooltip: ApexTooltip = { y: { formatter: (v: number) => `${this.formatInt(v)} registros` } };

  barPlotOptions: ApexPlotOptions = { bar: { horizontal: true, barHeight: '62%', borderRadius: 3 } };
  barDataLabels: ApexDataLabels = { enabled: false };
  barColors: string[] = [BRAND];
  barGrid: ApexGrid = {
    borderColor: CHART_GRID,
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } },
  };
  barYAxis: ApexYAxis = { labels: { maxWidth: 220, style: { fontSize: '12px' } } };
  barTooltip: ApexTooltip = { y: { formatter: (v: number) => `${this.formatInt(v)} registros` } };

  moduloSeries: ApexAxisChartSeries = [{ name: 'Registros', data: [] }];
  moduloChart: ApexChart = this.barChart(0);
  moduloXAxis: ApexXAxis = { categories: [] };

  categoriaSeries: ApexAxisChartSeries = [{ name: 'Registros', data: [] }];
  categoriaChart: ApexChart = this.barChart(0);
  categoriaXAxis: ApexXAxis = { categories: [] };

  subcategoriaSeries: ApexAxisChartSeries = [{ name: 'Registros', data: [] }];
  subcategoriaChart: ApexChart = this.barChart(0);
  subcategoriaXAxis: ApexXAxis = { categories: [] };

  chartNoData: ApexNoData = {
    text: 'Sin registros para los filtros aplicados',
    align: 'center',
    verticalAlign: 'middle',
    style: { color: CHART_INK, fontSize: '14px', fontFamily: CHART_FONT },
  };

  // Estado de UI
  loading = false;
  errorCarga = '';
  private loadSub?: Subscription;
  private tablaTimer?: ReturnType<typeof setTimeout>;

  // Indicadores
  totalRegistros = 0;
  totalValidos = 0;
  totalNoValidos = 0;
  totalConComentario = 0;

  filtros: DashboardFilters = this.filtrosIniciales();

  filtrosTabla: TablaEncuestaFilters = {
    fecha: '',
    centro: '',
    usuario: '',
    modulo: '',
    categoria: '',
    subcategoria: '',
    variable: '',
    estado: '',
    comentario: '',
  };

  dropdownSearch: Record<DropdownKey, string> = {
    centro: '',
    usuario: '',
    modulo: '',
    categoria: '',
    subcategoria: '',
    variable: '',
    estado: '',
  };

  dropdownOpen: Record<DropdownKey, boolean> = {
    centro: false,
    usuario: false,
    modulo: false,
    categoria: false,
    subcategoria: false,
    variable: false,
    estado: false,
  };

  dropdownActive: Record<DropdownKey, number> = {
    centro: -1,
    usuario: -1,
    modulo: -1,
    categoria: -1,
    subcategoria: -1,
    variable: -1,
    estado: -1,
  };

  readonly dropdowns: Array<{ key: DropdownKey; label: string; placeholder: string }> = [
    { key: 'centro', label: 'Centro', placeholder: 'Buscar centro...' },
    { key: 'usuario', label: 'Usuario', placeholder: 'Buscar usuario...' },
    { key: 'modulo', label: 'Módulo', placeholder: 'Buscar módulo...' },
    { key: 'categoria', label: 'Categoría', placeholder: 'Buscar categoría...' },
    { key: 'subcategoria', label: 'Subcategoría', placeholder: 'Buscar subcategoría...' },
    { key: 'variable', label: 'Variable', placeholder: 'Buscar variable...' },
    { key: 'estado', label: 'Estado', placeholder: 'Buscar estado...' },
  ];

  constructor(
    private encuestaService: EncuestaService,
    private userService: UsersService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.getInfo();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    clearTimeout(this.tablaTimer);
  }

  // ---------------------------------------------------------------------------
  // Carga
  // ---------------------------------------------------------------------------

  /** La app no usa zone.js: cada cambio de estado asíncrono pide detección de cambios. */
  getInfo(): void {
    this.loadSub?.unsubscribe();
    this.loading = true;
    this.errorCarga = '';
    this.cdr.markForCheck();

    this.loadSub = forkJoin({
      centro: this.establecimientoService.getCentros(),
      user: this.userService.getAllUsers(),
      modulos: this.encuestaService.getModulos(),
      categorias: this.encuestaService.getCategorias(),
      subcategorias: this.encuestaService.getSubcategorias(),
      variables: this.encuestaService.getVariables(),
      encuestas: this.encuestaService.getEncuesta(),
    }).subscribe({
      next: (res) => {
        this.centros = this.unificarCentros(res.centro || []);
        this.users = res.user || [];
        this.modulos = res.modulos || [];
        this.categorias = res.categorias || [];
        this.subcategorias = res.subcategorias || [];
        this.variables = res.variables || [];
        this.encuesta = res.encuestas || [];

        this.construirMapas();
        this.filas = this.construirFilas(this.encuesta);

        // En el dashboard de administrador se inicia con todos los centros.
        this.filtros.codcas = '';

        this.loading = false;
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.loading = false;
        this.errorCarga = this.describirError(err);
        this.cdr.markForCheck();
      },
    });
  }

  private describirError(err: unknown): string {
    const status = err instanceof HttpErrorResponse ? err.status : -1;
    if (status === 0) {
      return 'No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.';
    }
    if (status === 401 || status === 403) {
      return 'Su sesión no tiene permiso para ver el dashboard de encuestas. Inicie sesión nuevamente o solicite acceso.';
    }
    if (status > 0) {
      return `El servidor respondió con un error (código ${status}) al cargar las encuestas. Intente de nuevo en unos minutos.`;
    }
    return 'No se pudieron cargar los datos del dashboard. Intente de nuevo.';
  }

  private construirMapas(): void {
    this.centroNombre = new Map(this.centros.map((c) => [String(c.cenasicod), String(c.cenasides ?? c.cenasicod)]));
    this.usuarioNombre = new Map(this.users.map((u) => [u.id, this.getNombreUsuario(u)]));
    this.moduloNombre = new Map(this.modulos.map((m) => [m.id, m.name_modulo]));
    this.categoriaNombre = new Map(this.categorias.map((c) => [c.id, c.name_categoria]));
    this.subcategoriaNombre = new Map(this.subcategorias.map((s) => [s.id, s.name_categoria]));
    this.variableNombre = new Map(this.variables.map((v) => [v.id, v.name_variable]));
  }

  private construirFilas(origen: Encuesta[]): FilaEncuesta[] {
    return origen
      .map((item) => {
        const fila = {
          item,
          fecha: this.formatearFecha(item.date_creation),
          centro: this.getCentroNombre(item.codcas),
          usuario: this.getUsuarioNombreById(item.id_user),
          modulo: this.getModuloNombre(item.id_modulo),
          categoria: this.getCategoriaNombre(item.id_categoria),
          subcategoria: this.getSubcategoriaNombre(item.id_subcategoria),
          variable: this.getVariableNombre(item.id_variable),
          estado: this.getEstadoLabel(item.status),
          estadoClase: this.getEstadoClase(item.status),
          comentario: (item.comment || '').trim(),
          orden: this.convertirFecha(item.date_creation)?.getTime() ?? 0,
        };
        const busqueda = {} as Record<keyof TablaEncuestaFilters, string>;
        (Object.keys(this.filtrosTabla) as Array<keyof TablaEncuestaFilters>).forEach((key) => {
          busqueda[key] = this.normalizar(fila[key]);
        });
        return { ...fila, busqueda };
      })
      .sort((a, b) => b.orden - a.orden);
  }

  // ---------------------------------------------------------------------------
  // Filtros generales
  // ---------------------------------------------------------------------------

  private filtrosIniciales(): DashboardFilters {
    return {
      codcas: '',
      id_user: null,
      id_modulo: null,
      id_categoria: null,
      id_subcategoria: null,
      id_variable: null,
      estado: 'todos',
    };
  }

  get hayFiltrosActivos(): boolean {
    return this.hayFiltrosPrincipalesAplicados()
      || Object.values(this.filtrosTabla).some((valor) => !!valor.trim());
  }

  aplicarFiltros(): void {
    const f = this.filtros;
    this.filasFiltradas = this.filas.filter(({ item }) =>
      (!f.codcas || item.codcas === f.codcas)
      && (!f.id_user || item.id_user === f.id_user)
      && (!f.id_modulo || item.id_modulo === f.id_modulo)
      && (!f.id_categoria || item.id_categoria === f.id_categoria)
      && (!f.id_subcategoria || item.id_subcategoria === f.id_subcategoria)
      && (!f.id_variable || item.id_variable === f.id_variable)
      && (f.estado === 'todos' || this.estadoNormalizado(item.status) === f.estado),
    );
    this.encuestaFiltrada = this.filasFiltradas.map((fila) => fila.item);

    this.actualizarIndicadores();
    this.actualizarGraficos();
    this.aplicarFiltrosTabla();
    this.cdr.markForCheck();
  }

  limpiarFiltros(): void {
    this.filtros = this.filtrosIniciales();
    (Object.keys(this.filtrosTabla) as Array<keyof TablaEncuestaFilters>).forEach((key) => {
      this.filtrosTabla[key] = '';
    });
    this.aplicarFiltros();
  }

  private hayFiltrosPrincipalesAplicados(): boolean {
    return this.filtros.codcas !== ''
      || this.filtros.id_user !== null
      || this.filtros.id_modulo !== null
      || this.filtros.id_categoria !== null
      || this.filtros.id_subcategoria !== null
      || this.filtros.id_variable !== null
      || this.filtros.estado !== 'todos';
  }

  // ---------------------------------------------------------------------------
  // Tabla
  // ---------------------------------------------------------------------------

  /** Filtros por columna: se aplican 200 ms después de dejar de escribir. */
  onFiltroTablaChange(): void {
    clearTimeout(this.tablaTimer);
    this.tablaTimer = setTimeout(() => {
      this.aplicarFiltrosTabla();
      this.cdr.markForCheck();
    }, 200);
  }

  private aplicarFiltrosTabla(): void {
    const terminos = (Object.keys(this.filtrosTabla) as Array<keyof TablaEncuestaFilters>)
      .map((key) => [key, this.normalizar(this.filtrosTabla[key])] as const)
      .filter(([, termino]) => !!termino);

    this.filasTabla = terminos.length === 0
      ? this.filasFiltradas
      : this.filasFiltradas.filter((fila) => terminos.every(([key, termino]) => this.coincide(key, fila.busqueda[key], termino)));
  }

  /** Estado se compara por el inicio: "valido" no debe encontrar "No válido". */
  private coincide(key: keyof TablaEncuestaFilters, valor: string, termino: string): boolean {
    return key === 'estado' ? valor.startsWith(termino) : valor.includes(termino);
  }

  trackFila = (_: number, fila: FilaEncuesta) => fila.item.id;

  // ---------------------------------------------------------------------------
  // Desplegables
  // ---------------------------------------------------------------------------

  focusDropdown(key: DropdownKey): void {
    this.dropdownSearch[key] = '';
    this.dropdownOpen[key] = true;
    const index = this.getFilteredDropdownOptions(key).findIndex((o) => o.value === this.getCurrentDropdownValue(key));
    this.dropdownActive[key] = Math.max(index, 0);
  }

  closeDropdown(key: DropdownKey): void {
    this.dropdownOpen[key] = false;
    this.dropdownSearch[key] = '';
    this.dropdownActive[key] = -1;
  }

  filterDropdown(key: DropdownKey, event: Event): void {
    this.dropdownSearch[key] = (event.target as HTMLInputElement).value;
    this.dropdownOpen[key] = true;
    this.dropdownActive[key] = this.getFilteredDropdownOptions(key).length > 0 ? 0 : -1;
  }

  handleDropdownKeydown(key: DropdownKey, event: KeyboardEvent): void {
    const options = this.getFilteredDropdownOptions(key);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.dropdownOpen[key]) {
        this.focusDropdown(key);
        return;
      }
      if (options.length === 0) return;
      const actual = this.dropdownActive[key];
      this.dropdownActive[key] = event.key === 'ArrowDown'
        ? Math.min(actual + 1, options.length - 1)
        : Math.max(actual - 1, 0);
      this.scrollOpcionActiva(key);
      return;
    }

    if (event.key === 'Enter' && this.dropdownOpen[key]) {
      event.preventDefault();
      const option = options[Math.max(this.dropdownActive[key], 0)];
      if (option) {
        this.selectDropdownOption(key, option);
      }
      return;
    }

    if (event.key === 'Escape') {
      this.closeDropdown(key);
    }
  }

  private scrollOpcionActiva(key: DropdownKey): void {
    setTimeout(() => {
      document
        .querySelector(`[data-combo="${key}"] .combo__item.is-active`)
        ?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  selectDropdownOption(key: DropdownKey, option: DropdownOption): void {
    switch (key) {
      case 'centro':
        this.filtros.codcas = typeof option.value === 'string' ? option.value : '';
        break;
      case 'usuario':
        this.filtros.id_user = typeof option.value === 'number' ? option.value : null;
        break;
      case 'modulo':
        this.filtros.id_modulo = typeof option.value === 'number' ? option.value : null;
        this.filtros.id_categoria = null;
        this.filtros.id_subcategoria = null;
        this.filtros.id_variable = null;
        break;
      case 'categoria':
        this.filtros.id_categoria = typeof option.value === 'number' ? option.value : null;
        this.filtros.id_subcategoria = null;
        this.filtros.id_variable = null;
        break;
      case 'subcategoria':
        this.filtros.id_subcategoria = typeof option.value === 'number' ? option.value : null;
        this.filtros.id_variable = null;
        break;
      case 'variable':
        this.filtros.id_variable = typeof option.value === 'number' ? option.value : null;
        break;
      case 'estado':
        this.filtros.estado = (option.value as DashboardFilters['estado']) || 'todos';
        break;
    }

    this.closeDropdown(key);
    this.aplicarFiltros();
  }

  getSelectedDropdownLabel(key: DropdownKey): string {
    const option = this.getDropdownOptions(key).find((item) => item.value === this.getCurrentDropdownValue(key));
    return option?.label || '';
  }

  getFilteredDropdownOptions(key: DropdownKey): DropdownOption[] {
    const search = this.normalizar(this.dropdownSearch[key]);
    const options = this.getDropdownOptions(key);
    return search ? options.filter((option) => this.normalizar(option.label).includes(search)) : options;
  }

  private getDropdownOptions(key: DropdownKey): DropdownOption[] {
    switch (key) {
      case 'centro':
        return [
          { value: '', label: 'Todos los centros' },
          ...this.centros.map((centro) => ({
            value: centro.cenasicod as string,
            label: `${centro.cenasicod} - ${centro.cenasides}`,
          })),
        ];
      case 'usuario':
        return [
          { value: null, label: 'Todos los usuarios' },
          ...[...this.users]
            .sort((a, b) => this.getNombreUsuario(a).localeCompare(this.getNombreUsuario(b)))
            .map((user) => ({
              value: user.id,
              label: `${this.getNombreUsuario(user)}${user.username ? ` - ${user.username}` : ''}`,
            })),
        ];
      case 'modulo':
        return [
          { value: null, label: 'Todos los módulos' },
          ...this.modulos.map((modulo) => ({ value: modulo.id, label: modulo.name_modulo })),
        ];
      case 'categoria':
        return [
          { value: null, label: 'Todas las categorías' },
          ...this.categoriasFiltradasPorModulo.map((c) => ({ value: c.id, label: c.name_categoria })),
        ];
      case 'subcategoria':
        return [
          { value: null, label: 'Todas las subcategorías' },
          ...this.subcategoriasFiltradasPorCategoria.map((s) => ({ value: s.id, label: s.name_categoria })),
        ];
      case 'variable':
        return [
          { value: null, label: 'Todas las variables' },
          ...this.variablesFiltradasPorSubcategoria.map((v) => ({ value: v.id, label: v.name_variable })),
        ];
      case 'estado':
        return [
          { value: 'todos', label: 'Todos los estados' },
          { value: 'valido', label: 'Válido' },
          { value: 'no_valido', label: 'No válido' },
        ];
    }
  }

  private getCurrentDropdownValue(key: DropdownKey): string | number | null {
    switch (key) {
      case 'centro':
        return this.filtros.codcas;
      case 'usuario':
        return this.filtros.id_user;
      case 'modulo':
        return this.filtros.id_modulo;
      case 'categoria':
        return this.filtros.id_categoria;
      case 'subcategoria':
        return this.filtros.id_subcategoria;
      case 'variable':
        return this.filtros.id_variable;
      case 'estado':
        return this.filtros.estado;
    }
  }

  get categoriasFiltradasPorModulo(): Categoria[] {
    return this.filtros.id_modulo
      ? this.categorias.filter((c) => c.id_modulo === this.filtros.id_modulo)
      : this.categorias;
  }

  get subcategoriasFiltradasPorCategoria(): Subcategoria[] {
    return this.filtros.id_categoria
      ? this.subcategorias.filter((s) => s.id_categoria === this.filtros.id_categoria)
      : this.subcategorias;
  }

  get variablesFiltradasPorSubcategoria(): Variable[] {
    return this.filtros.id_subcategoria
      ? this.variables.filter((v) => v.id_subcategoria === this.filtros.id_subcategoria)
      : this.variables;
  }

  // ---------------------------------------------------------------------------
  // Nombres y formatos
  // ---------------------------------------------------------------------------

  getCentroNombre(codcas: string): string {
    return this.centroNombre.get(String(codcas)) || codcas || '-';
  }

  getModuloNombre(id: number): string {
    return this.moduloNombre.get(id) || `Módulo ${id}`;
  }

  getCategoriaNombre(id: number): string {
    return this.categoriaNombre.get(id) || `Categoría ${id}`;
  }

  getSubcategoriaNombre(id: number): string {
    return this.subcategoriaNombre.get(id) || `Subcategoría ${id}`;
  }

  getVariableNombre(id: number): string {
    return this.variableNombre.get(id) || `Variable ${id}`;
  }

  getNombreUsuario(user: User): string {
    const nombre = `${user.name || ''} ${user.lastname || ''}`.trim();
    return nombre || String(user.username || user.dni || user.id);
  }

  getUsuarioNombreById(idUser: number): string {
    return this.usuarioNombre.get(idUser) || '-';
  }

  private estadoNormalizado(status: string): EstadoNormalizado {
    const valor = (status || '').trim().toLowerCase();
    return valor === 'valido' || valor === 'no_valido' ? valor : 'otro';
  }

  getEstadoLabel(status: string): string {
    const estado = this.estadoNormalizado(status);
    if (estado === 'valido') return 'Válido';
    if (estado === 'no_valido') return 'No válido';
    return status || 'Sin estado';
  }

  getEstadoClase(status: string): string {
    const estado = this.estadoNormalizado(status);
    if (estado === 'valido') return 'pill--ok';
    if (estado === 'no_valido') return 'pill--bad';
    return 'pill--neutral';
  }

  formatearFecha(fecha: string): string {
    const date = this.convertirFecha(fecha);
    return date ? date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  }

  formatInt(value: number): string {
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  porcentaje(parte: number): string {
    if (!this.totalRegistros) return '0 %';
    return `${Math.round((parte / this.totalRegistros) * 100)} %`;
  }

  /** Minúsculas y sin tildes, para que "valido" encuentre "Válido". */
  private normalizar(valor: string): string {
    return (valor || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  }

  private convertirFecha(valor: string): Date | null {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private unificarCentros(centrosOrigen: any[]): any[] {
    const mapa = new Map<string, any>();
    for (const centro of centrosOrigen) {
      if (centro?.cenasicod) {
        mapa.set(centro.cenasicod, centro);
      }
    }
    if (!mapa.has(this.centroFijo.cenasicod)) {
      mapa.set(this.centroFijo.cenasicod, this.centroFijo);
    }
    return Array.from(mapa.values());
  }

  // ---------------------------------------------------------------------------
  // Indicadores y gráficos
  // ---------------------------------------------------------------------------

  private actualizarIndicadores(): void {
    const origen = this.encuestaFiltrada;
    this.totalRegistros = origen.length;
    this.totalValidos = origen.filter((e) => this.estadoNormalizado(e.status) === 'valido').length;
    this.totalNoValidos = origen.filter((e) => this.estadoNormalizado(e.status) === 'no_valido').length;
    this.totalConComentario = origen.filter((e) => (e.comment || '').trim().length > 0).length;
  }

  private barChart(filas: number): ApexChart {
    // Alto proporcional al número de barras para que no queden gruesas ni apretadas
    return { ...this.baseChart, type: 'bar', height: Math.max(240, filas * 34 + 70) };
  }

  private armarSerie(origen: Encuesta[], tipo: 'modulo' | 'categoria' | 'subcategoria'): SerieResumen[] {
    const mapa = new Map<number, number>();
    for (const item of origen) {
      const llave = tipo === 'modulo' ? item.id_modulo : tipo === 'categoria' ? item.id_categoria : item.id_subcategoria;
      mapa.set(llave, (mapa.get(llave) || 0) + 1);
    }

    return Array.from(mapa.entries())
      .map(([id, total]) => ({
        nombre: tipo === 'modulo'
          ? this.getModuloNombre(id)
          : tipo === 'categoria'
            ? this.getCategoriaNombre(id)
            : this.getSubcategoriaNombre(id),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }

  private actualizarGraficos(): void {
    const origen = this.encuestaFiltrada;

    const segmentos: Array<{ estado: EstadoNormalizado; label: string; total: number }> = [
      { estado: 'valido', label: 'Válido', total: this.totalValidos },
      { estado: 'no_valido', label: 'No válido', total: this.totalNoValidos },
      { estado: 'otro', label: 'Otros', total: this.totalRegistros - this.totalValidos - this.totalNoValidos },
    ].filter((s) => s.total > 0) as Array<{ estado: EstadoNormalizado; label: string; total: number }>;

    this.estadoSeries = segmentos.map((s) => s.total);
    this.estadoLabels = segmentos.map((s) => s.label);
    this.estadoColors = segmentos.map((s) => ESTADO_COLOR[s.estado]);

    const modulos = this.armarSerie(origen, 'modulo');
    this.moduloSeries = [{ name: 'Registros', data: modulos.map((m) => m.total) }];
    this.moduloXAxis = this.barXAxis(modulos);
    this.moduloChart = this.barChart(modulos.length);

    const categorias = this.armarSerie(origen, 'categoria');
    this.categoriaSeries = [{ name: 'Registros', data: categorias.map((c) => c.total) }];
    this.categoriaXAxis = this.barXAxis(categorias);
    this.categoriaChart = this.barChart(categorias.length);

    const subcategorias = this.armarSerie(origen, 'subcategoria');
    this.subcategoriaSeries = [{ name: 'Registros', data: subcategorias.map((s) => s.total) }];
    this.subcategoriaXAxis = this.barXAxis(subcategorias);
    this.subcategoriaChart = this.barChart(subcategorias.length);
  }

  private barXAxis(serie: SerieResumen[]): ApexXAxis {
    return {
      categories: serie.map((s) => s.nombre),
      labels: { formatter: (v: string) => this.formatInt(Number(v)) },
      axisBorder: { color: CHART_GRID },
      axisTicks: { show: false },
    };
  }
}
