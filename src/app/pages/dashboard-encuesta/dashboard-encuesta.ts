import { EstablecimientoService } from '../../services/establecimiento-service';
import { User } from './../../model/user';
import { EncuestaService } from './../../services/encuesta-service';
import { Component, OnInit } from '@angular/core';
import { Categoria } from '../../model/categoria';
import { Modulo } from '../../model/modulo';
import { Subcategoria } from '../../model/subcategoria';
import { Variable } from '../../model/variable';
import { Encuesta } from '../../model/encuesta';
import { forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { UsersService } from '../../services/users-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexLegend,
  ApexPlotOptions,
  ApexTooltip,
  ApexNoData,
  ApexResponsive,
  ApexFill,
} from 'ng-apexcharts';

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
  porcentaje: number;
}

interface EstadoSegmento {
  estado: string;
  total: number;
  porcentaje: number;
  color: string;
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

type DropdownKey = 'centro' | 'usuario' | 'modulo' | 'categoria' | 'subcategoria' | 'variable' | 'estado';

interface DropdownOption {
  value: string | number | null;
  label: string;
}

@Component({
  selector: 'app-dashboard-encuesta',
  imports: [CommonModule, FormsModule, ScrollingModule, NgApexchartsModule],
  templateUrl: './dashboard-encuesta.html',
  styleUrl: './dashboard-encuesta.css',
})
export class DashboardEncuesta implements OnInit {

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

  // Datos filtrados
  encuestaFiltrada: Encuesta[] = [];
  encuestaTablaData: Encuesta[] = [];
  serieModulos: SerieResumen[] = [];
  serieCategorias: SerieResumen[] = [];
  serieSubcategorias: SerieResumen[] = [];
  estadoSegmentos: EstadoSegmento[] = [];

  estadoSeries: ApexNonAxisChartSeries = [];
  estadoLabels: string[] = [];
  estadoChart: ApexChart = {
    type: 'donut',
    height: 260,
    toolbar: { show: false },
  };
  estadoColors: string[] = ['#00AEEF', '#1A5490', '#3F6EA1'];
  estadoLegend: ApexLegend = { position: 'bottom' };
  estadoDataLabels: ApexDataLabels = { enabled: true };
  estadoStroke: ApexStroke = { width: 2, colors: ['#ffffff'] };
  estadoResponsive: ApexResponsive[] = [{
    breakpoint: 860,
    options: {
      chart: { height: 240 },
      legend: { position: 'bottom' },
    },
  }];

  subcategoriaSeries: ApexAxisChartSeries = [{ name: 'Registros', data: [] }];
  subcategoriaChart: ApexChart = {
    type: 'bar',
    height: 260,
    toolbar: { show: false },
  };
  subcategoriaPlotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 6 } };
  subcategoriaXAxis: ApexXAxis = { categories: [] };
  subcategoriaDataLabels: ApexDataLabels = { enabled: false };
  subcategoriaColors: string[] = ['#24446F'];

  moduloSeries: ApexAxisChartSeries = [{ name: 'Registros', data: [] }];
  moduloChart: ApexChart = {
    type: 'bar',
    height: 260,
    toolbar: { show: false },
  };
  moduloPlotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 6 } };
  moduloDataLabels: ApexDataLabels = { enabled: false };
  moduloXAxis: ApexXAxis = { categories: [] };
  moduloColors: string[] = ['#0064AF'];

  categoriaSeries: ApexAxisChartSeries = [{ name: 'Registros', data: [] }];
  categoriaChart: ApexChart = {
    type: 'bar',
    height: 260,
    toolbar: { show: false },
  };
  categoriaPlotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 6 } };
  categoriaDataLabels: ApexDataLabels = { enabled: false };
  categoriaXAxis: ApexXAxis = { categories: [] };
  categoriaColors: string[] = ['#3F6EA1'];

  chartNoData: ApexNoData = {
    text: 'Sin datos para los filtros aplicados',
    align: 'center',
    verticalAlign: 'middle',
    style: {
      color: '#64748b',
      fontSize: '13px',
    },
  };

  // Estado de UI
  loading = false;
  errorCarga = '';

  // KPI
  totalRegistros = 0;
  totalValidos = 0;
  totalNoValidos = 0;
  totalConComentario = 0;

  filtros: DashboardFilters = {
    codcas: '',
    id_user: null,
    id_modulo: null,
    id_categoria: null,
    id_subcategoria: null,
    id_variable: null,
    estado: 'todos',
  };

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

  constructor(
    private encuestaService: EncuestaService,
    private userService: UsersService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.getInfo();
  }


  getInfo(): void {
    this.loading = true;
    this.errorCarga = '';

    forkJoin({
      centro: this.establecimientoService.getCentros(),
      user: this.userService.getAllUsers(),
      modulos: this.encuestaService.getModulos(),
      categorias: this.encuestaService.getCategorias(),
      subcategorias: this.encuestaService.getSubcategorias(),
      variables: this.encuestaService.getVariables(),
      encuestas: this.encuestaService.getEncuesta()
    }).subscribe({
      next: (res) => {
        const centrosUnicos = this.unificarCentros(res.centro || []);
        this.centros = centrosUnicos;
        this.users = res.user;
        this.modulos = res.modulos;
        this.categorias = res.categorias;
        this.subcategorias = res.subcategorias;
        this.variables = res.variables;
        this.encuesta = res.encuestas;
        this.encuestaTablaData = [...this.encuesta];

        // En dashboard de administrador se inicia sin centro seleccionado (todos).
        this.filtros.codcas = '';

        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorCarga = 'No se pudieron cargar los datos del dashboard.';
        console.error('Error al cargar datos:', err);
      }
    });
  }

  onChangeModulo(): void {
    this.filtros.id_categoria = null;
    this.filtros.id_subcategoria = null;
    this.filtros.id_variable = null;
    this.aplicarFiltros();
  }

  onChangeCategoria(): void {
    this.filtros.id_subcategoria = null;
    this.filtros.id_variable = null;
    this.aplicarFiltros();
  }

  onChangeSubcategoria(): void {
    this.filtros.id_variable = null;
    this.aplicarFiltros();
  }

  openDropdown(key: DropdownKey): void {
    this.dropdownOpen[key] = true;
  }

  focusDropdown(key: DropdownKey): void {
    this.dropdownSearch[key] = '';
    this.dropdownOpen[key] = true;
  }

  closeDropdown(key: DropdownKey): void {
    this.dropdownOpen[key] = false;
    this.dropdownSearch[key] = '';
  }

  filterDropdown(key: DropdownKey, event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.dropdownSearch[key] = value;
    this.dropdownOpen[key] = true;
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
        this.filtros.estado = (option.value as 'todos' | 'valido' | 'no_valido') || 'todos';
        break;
    }

    this.dropdownSearch[key] = '';
    this.dropdownOpen[key] = false;
    this.aplicarFiltros();
  }

  getSelectedDropdownLabel(key: DropdownKey): string {
    const option = this.getDropdownOptions(key).find((item) => item.value === this.getCurrentDropdownValue(key));
    return option?.label || 'Seleccionar';
  }

  getFilteredDropdownOptions(key: DropdownKey): DropdownOption[] {
    const search = this.dropdownSearch[key].trim().toLowerCase();
    const options = this.getDropdownOptions(key);
    if (!search) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(search));
  }

  aplicarFiltros(): void {
    this.encuestaFiltrada = this.encuesta.filter((item) => {
      const coincideCentro = !this.filtros.codcas || item.codcas === this.filtros.codcas;
      const coincideUsuario = !this.filtros.id_user || item.id_user === this.filtros.id_user;
      const coincideModulo = !this.filtros.id_modulo || item.id_modulo === this.filtros.id_modulo;
      const coincideCategoria = !this.filtros.id_categoria || item.id_categoria === this.filtros.id_categoria;
      const coincideSubcategoria = !this.filtros.id_subcategoria || item.id_subcategoria === this.filtros.id_subcategoria;
      const coincideVariable = !this.filtros.id_variable || item.id_variable === this.filtros.id_variable;

      const estado = (item.status || '').trim().toLowerCase();
      const coincideEstado = this.filtros.estado === 'todos' || estado === this.filtros.estado;

      return coincideCentro && coincideUsuario && coincideModulo && coincideCategoria && coincideSubcategoria && coincideVariable && coincideEstado;
    });

    this.actualizarIndicadores();
    this.serieModulos = this.armarSerie(this.encuestaFiltrada, 'modulo');
    this.serieCategorias = this.armarSerie(this.encuestaFiltrada, 'categoria');
    this.serieSubcategorias = this.armarSerie(this.encuestaFiltrada, 'subcategoria');
    this.estadoSegmentos = this.armarSegmentosEstado(this.encuestaFiltrada);
    this.actualizarGraficosApex();

  }

  limpiarFiltros(): void {
    this.filtros = {
      codcas: '',
      id_user: null,
      id_modulo: null,
      id_categoria: null,
      id_subcategoria: null,
      id_variable: null,
      estado: 'todos',
    };

    this.aplicarFiltros();
  }

  get usuariosOrdenados(): User[] {
    return [...this.users].sort((a, b) => this.getNombreUsuario(a).localeCompare(this.getNombreUsuario(b)));
  }

  get categoriasFiltradasPorModulo(): Categoria[] {
    if (!this.filtros.id_modulo) {
      return this.categorias;
    }
    return this.categorias.filter((c) => c.id_modulo === this.filtros.id_modulo);
  }

  get subcategoriasFiltradasPorCategoria(): Subcategoria[] {
    if (!this.filtros.id_categoria) {
      return this.subcategorias;
    }
    return this.subcategorias.filter((s) => s.id_categoria === this.filtros.id_categoria);
  }

  get variablesFiltradasPorSubcategoria(): Variable[] {
    if (!this.filtros.id_subcategoria) {
      return this.variables;
    }
    return this.variables.filter((v) => v.id_subcategoria === this.filtros.id_subcategoria);
  }

  getCentroNombre(codcas: string): string {
    return this.centros.find((c) => c.cenasicod === codcas)?.cenasides || codcas;
  }

  getModuloNombre(id: number): string {
    return this.modulos.find((m) => m.id === id)?.name_modulo || `Modulo ${id}`;
  }

  getCategoriaNombre(id: number): string {
    return this.categorias.find((c) => c.id === id)?.name_categoria || `Categoria ${id}`;
  }

  getSubcategoriaNombre(id: number): string {
    return this.subcategorias.find((s) => s.id === id)?.name_categoria || `Subcategoria ${id}`;
  }

  getVariableNombre(id: number): string {
    return this.variables.find((v) => v.id === id)?.name_variable || `Variable ${id}`;
  }

  getNombreUsuario(user: User): string {
    const nombre = `${user.name || ''} ${user.lastname || ''}`.trim();
    return nombre || String(user.username || user.dni || user.id);
  }

  getUsuarioNombreById(idUser: number): string {
    const user = this.users.find(u => u.id === idUser);
    return user ? this.getNombreUsuario(user) : '-';
  }

  getEstadoLabel(status: string): string {
    const normalizado = (status || '').trim().toLowerCase();
    if (normalizado === 'valido') {
      return 'Valido';
    }
    if (normalizado === 'no_valido') {
      return 'No valido';
    }
    return status || 'Sin estado';
  }

  getEstadoClase(status: string): string {
    const normalizado = (status || '').trim().toLowerCase();
    if (normalizado === 'valido') {
      return 'estado-ok';
    }
    if (normalizado === 'no_valido') {
      return 'estado-bad';
    }
    return 'estado-neutral';
  }

  formatearFecha(fecha: string): string {
    const date = this.convertirFecha(fecha);
    if (!date) {
      return '-';
    }
    return date.toLocaleDateString('es-PE');
  }

  get registrosTablaFiltrados(): Encuesta[] {

    return this.registrosTablaBase.filter((item) => {
      const fecha = this.formatearFecha(item.date_creation);
      const centro = this.getCentroNombre(item.codcas);
      const usuario = this.getUsuarioNombreById(item.id_user);
      const modulo = this.getModuloNombre(item.id_modulo);
      const categoria = this.getCategoriaNombre(item.id_categoria);
      const subcategoria = this.getSubcategoriaNombre(item.id_subcategoria);
      const variable = this.getVariableNombre(item.id_variable);
      const estado = this.getEstadoLabel(item.status);
      const comentario = item.comment || '-';

      return this.contieneFiltro(fecha, this.filtrosTabla.fecha)
        && this.contieneFiltro(centro, this.filtrosTabla.centro)
        && this.contieneFiltro(usuario, this.filtrosTabla.usuario)
        && this.contieneFiltro(modulo, this.filtrosTabla.modulo)
        && this.contieneFiltro(categoria, this.filtrosTabla.categoria)
        && this.contieneFiltro(subcategoria, this.filtrosTabla.subcategoria)
        && this.contieneFiltro(variable, this.filtrosTabla.variable)
        && this.contieneFiltro(estado, this.filtrosTabla.estado)
        && this.contieneFiltro(comentario, this.filtrosTabla.comentario);
    });
  }


  get registrosTablaBase(): Encuesta[] {
    return [...this.encuestaTablaData].sort((a, b) => this.obtenerSortFecha(b) - this.obtenerSortFecha(a));
  }

  private actualizarIndicadores(): void {
    this.totalRegistros = this.encuestaFiltrada.length;
    this.totalValidos = this.encuestaFiltrada.filter((e) => (e.status || '').trim().toLowerCase() === 'valido').length;
    this.totalNoValidos = this.encuestaFiltrada.filter((e) => (e.status || '').trim().toLowerCase() === 'no_valido').length;
    this.totalConComentario = this.encuestaFiltrada.filter((e) => (e.comment || '').trim().length > 0).length;
  }

  private armarSerie(origen: Encuesta[], tipo: 'modulo' | 'categoria' | 'subcategoria'): SerieResumen[] {
    if (origen.length === 0) {
      return [];
    }

    const mapa = new Map<number, number>();
    for (const item of origen) {
      const llave = tipo === 'modulo'
        ? item.id_modulo
        : tipo === 'categoria'
          ? item.id_categoria
          : item.id_subcategoria;
      mapa.set(llave, (mapa.get(llave) || 0) + 1);
    }

    return Array.from(mapa.entries())
      .map(([id, total]) => {
        const nombre = tipo === 'modulo'
          ? this.getModuloNombre(id)
          : tipo === 'categoria'
            ? this.getCategoriaNombre(id)
            : this.getSubcategoriaNombre(id);
        return {
          nombre,
          total,
          porcentaje: Math.round((total / origen.length) * 100),
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }

  private armarSegmentosEstado(origen: Encuesta[]): EstadoSegmento[] {
    if (origen.length === 0) {
      return [];
    }

    const total = origen.length;
    const totalValidos = origen.filter((e) => (e.status || '').trim().toLowerCase() === 'valido').length;
    const totalNoValidos = origen.filter((e) => (e.status || '').trim().toLowerCase() === 'no_valido').length;
    const totalOtros = total - totalValidos - totalNoValidos;

    const segmentos: EstadoSegmento[] = [];
    if (totalValidos > 0) {
      segmentos.push({
        estado: 'Valido',
        total: totalValidos,
        porcentaje: Math.round((totalValidos / total) * 100),
        color: '#00AEEF',
      });
    }
    if (totalNoValidos > 0) {
      segmentos.push({
        estado: 'No valido',
        total: totalNoValidos,
        porcentaje: Math.round((totalNoValidos / total) * 100),
        color: '#1A5490',
      });
    }
    if (totalOtros > 0) {
      segmentos.push({
        estado: 'Otros',
        total: totalOtros,
        porcentaje: Math.round((totalOtros / total) * 100),
        color: '#3F6EA1',
      });
    }

    return segmentos;
  }

  private unificarCentros(centrosOrigen: any[]): any[] {
    const mapa = new Map<string, any>();

    for (const centro of centrosOrigen) {
      if (!centro?.cenasicod) {
        continue;
      }
      mapa.set(centro.cenasicod, centro);
    }

    if (!mapa.has(this.centroFijo.cenasicod)) {
      mapa.set(this.centroFijo.cenasicod, this.centroFijo);
    }

    return Array.from(mapa.values());
  }

  private convertirFecha(valor: string): Date | null {
    if (!valor) {
      return null;
    }

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return null;
    }
    return fecha;
  }

  private inicioDia(fecha: string): Date {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private finDia(fecha: string): Date {
    const d = new Date(fecha);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private obtenerSortFecha(item: Encuesta): number {
    const date = this.convertirFecha(item.date_creation);
    return date ? date.getTime() : 0;
  }

  private contieneFiltro(valor: string, filtro: string): boolean {
    return valor.toLowerCase().includes((filtro || '').trim().toLowerCase());
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
          ...this.usuariosOrdenados.map((user) => ({
            value: user.id,
            label: `${this.getNombreUsuario(user)}${user.username ? ` - ${user.username}` : ''}`,
          })),
        ];
      case 'modulo':
        return [
          { value: null, label: 'Todos los modulos' },
          ...this.modulos.map((modulo) => ({ value: modulo.id, label: modulo.name_modulo })),
        ];
      case 'categoria':
        return [
          { value: null, label: 'Todas las categorias' },
          ...this.categoriasFiltradasPorModulo.map((categoria) => ({ value: categoria.id, label: categoria.name_categoria })),
        ];
      case 'subcategoria':
        return [
          { value: null, label: 'Todas las subcategorias' },
          ...this.subcategoriasFiltradasPorCategoria.map((subcategoria) => ({ value: subcategoria.id, label: subcategoria.name_categoria })),
        ];
      case 'variable':
        return [
          { value: null, label: 'Todas las variables' },
          ...this.variablesFiltradasPorSubcategoria.map((variable) => ({ value: variable.id, label: variable.name_variable })),
        ];
      case 'estado':
        return [
          { value: 'todos', label: 'Todos los estados' },
          { value: 'valido', label: 'Valido' },
          { value: 'no_valido', label: 'No valido' },
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

  private hayFiltrosPrincipalesAplicados(): boolean {
    return this.filtros.codcas !== ''
      || this.filtros.id_user !== null
      || this.filtros.id_modulo !== null
      || this.filtros.id_categoria !== null
      || this.filtros.id_subcategoria !== null
      || this.filtros.id_variable !== null
      || this.filtros.estado !== 'todos';
  }

  private actualizarGraficosApex(): void {
    this.estadoSeries = this.estadoSegmentos.map((s) => s.total);
    this.estadoLabels = this.estadoSegmentos.map((s) => s.estado);
    this.estadoColors = this.estadoSegmentos.map((s) => s.color);

    this.subcategoriaSeries = [{
      name: 'Registros',
      data: this.serieSubcategorias.map((p) => p.total),
    }];
    this.subcategoriaXAxis = {
      categories: this.serieSubcategorias.map((p) => p.nombre),
    };

    this.moduloSeries = [{
      name: 'Registros',
      data: this.serieModulos.map((m) => m.total),
    }];
    this.moduloXAxis = {
      categories: this.serieModulos.map((m) => m.nombre),
    };

    this.categoriaSeries = [{
      name: 'Registros',
      data: this.serieCategorias.map((c) => c.total),
    }];
    this.categoriaXAxis = {
      categories: this.serieCategorias.map((c) => c.nombre),
    };
  }

}
