import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { TmiEstandarService, TmiCentroService } from '../../services/tmi';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FechaActualizacionService } from '../../services/fecha-actualizacion-service';
import { Observable } from 'rxjs';
import { TmiVariables } from './tmi-variables/tmi-variables';
import { TmiConfigIndicadores } from './tmi-config-indicadores/tmi-config-indicadores';
import { TmiCentroEstandarTab } from './tmi-centro-estandar/tmi-centro-estandar';
import { TmiCalculo } from './tmi-calculo/tmi-calculo';
import { TmiCierreComponent } from './tmi-cierre/tmi-cierre';

import { TmiAceptacion } from './tmi-aceptacion/tmi-aceptacion';

export type TabType = 'Estandares Tipo' | 'Estandares Nivel' | 'Estandares Categoria' | 'Centros TMI' | 'Exclusion Centro Estandar' | 'Fecha Cierre'
  | 'Aceptacion' | 'Variables' | 'Indicadores' | 'Estandar Centro' | 'Calcular';

@Component({
  selector: 'app-tmi-indicadores',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    TmiVariables,
    TmiConfigIndicadores,
    TmiCentroEstandarTab,
    TmiCalculo,
    TmiCierreComponent,

    TmiAceptacion
  ],
  templateUrl: './tmi-indicadores.html',
  styleUrl: './tmi-indicadores.css',
})
export class TmiIndicadores implements OnInit {
  @ViewChild('viewportTipo') viewportTipo?: CdkVirtualScrollViewport;
  @ViewChild('viewportNivel') viewportNivel?: CdkVirtualScrollViewport;
  @ViewChild('viewportCategoria') viewportCategoria?: CdkVirtualScrollViewport;
  @ViewChild('viewportCentros') viewportCentros?: CdkVirtualScrollViewport;
  @ViewChild('viewportExclusion') viewportExclusion?: CdkVirtualScrollViewport;

  currentDate: string = '';

  periodoMinimoEditable: string = '';
  eliminandoId: number | null = null;
  errorEliminarFila: string = '';

  // Tabs, agrupadas en el orden del trabajo: fórmulas, estándares, centros y cierre
  activeTab: TabType = 'Estandares Tipo';
  readonly gruposTabs: { titulo: string; tabs: { id: TabType; texto: string }[] }[] = [
    { titulo: 'Fórmulas', tabs: [
      { id: 'Variables', texto: 'Variables' },
      { id: 'Indicadores', texto: 'Indicadores' },
    ] },
    { titulo: 'Estándares', tabs: [
      { id: 'Estandares Tipo', texto: 'Por tipo' },
      { id: 'Estandares Nivel', texto: 'Por nivel' },
      { id: 'Estandares Categoria', texto: 'Por categoría' },
      { id: 'Estandar Centro', texto: 'Por centro' },
      { id: 'Aceptacion', texto: '% Acept' },
    ] },
    { titulo: 'Centros', tabs: [
      { id: 'Centros TMI', texto: 'Centros TMI' },
      { id: 'Exclusion Centro Estandar', texto: 'Exclusiones' },
    ] },
    { titulo: 'Cierre', tabs: [
      { id: 'Fecha Cierre', texto: 'Fecha de cierre' },
      { id: 'Calcular', texto: 'Calcular y Excel' },
    ] },
  ];

  // Filtros de Años y Meses (replicando dashboard-medicas)
  aniosDisponibles: string[] = [];
  mesesDisponibles = [
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
    { value: '12', label: 'Diciembre' }
  ];

  generarAniosDinamicos(cantidad: number = 6): string[] {
    const anios: string[] = [];
    const anioActual = new Date().getFullYear();
    for (let i = 0; i < cantidad; i++) {
      anios.push(String(anioActual - i));
    }
    return anios;
  }

  onBuscarEstandarTipo(): void {
    if (!this.anioEstandarTipo) {
      this.errorEstandarTipo = 'Por favor seleccione un año válido.';
      return;
    }
    this.selectPeriodoEstandarTipo = false;
    this.periodoEstandarTipo = `${this.anioEstandarTipo}${this.mesEstandarTipo}`;
    this.getQueryEstandarTipo();
  }

  onBuscarEstandarNivel(): void {
    if (!this.anioEstandarNivel) {
      this.errorEstandarNivel = 'Por favor seleccione un año válido.';
      return;
    }
    this.selectPeriodoEstandarNivel = false;
    this.periodoEstandarNivel = `${this.anioEstandarNivel}${this.mesEstandarNivel}`;
    this.getQueryEstandarNivel();
  }

  onBuscarEstandarCategoria(): void {
    if (!this.anioEstandarCategoria) {
      this.errorEstandarCategoria = 'Por favor seleccione un año válido.';
      return;
    }
    this.selectPeriodoEstandarCategoria = false;
    this.periodoEstandarCategoria = `${this.anioEstandarCategoria}${this.mesEstandarCategoria}`;
    this.getQueryEstandarCategoria();
  }

  onBuscarCentrosTMI(): void {
    this.selectPeriodoCentrosTMI = false;
    this.getQueryCentrosTMI();
  }

  onBuscarExclusion(): void {
    if (!this.anioExclusion) {
      this.errorExclusion = 'Por favor seleccione un año válido.';
      return;
    }
    this.selectPeriodoExclusion = false;
    this.periodoExclusion = `${this.anioExclusion}${this.mesExclusion}`;
    this.getQueryExclusion();
  }


  // catalogo de indicadores/estándares para select en formularios
  public listaEstandares: any[] = [];

  // tmi_estandar_tipo
  public dataEstandarTipo: any[] = [];
  public dataEstandarTipoFilter: any[] = [];
  anioEstandarTipo: string = '';
  mesEstandarTipo: string = '';
  periodoEstandarTipo: string = '';
  selectPeriodoEstandarTipo: boolean = true;
  public loadingEstandarTipo: boolean = false;
  public errorEstandarTipo: string = '';
  public mostrarFormularioEstandarTipo: boolean = false;
  public savingEstandarTipo: boolean = false;
  public errorEstandarTipoForm: string = ''; 
  public estandarTipoForm!: FormGroup;

  filtersEstandarTipo = {
    id: "",
    id_estandar: "",
    tipo: "",
    indicador: "",
    tipo_centro: "",
    anio: "",
    est_fijo: "",
    est_01: "",
    est_02: "",
    est_03: "",
    est_04: "",
    est_05: "",
    est_06: "",
    est_07: "",
    est_08: "",
    est_09: "",
    est_10: "",
    est_11: "",
    est_12: "",
  }

  // tmi_estandar_nivel
  public dataEstandarNivel: any[] = [];
  public dataEstandarNivelFilter: any[] = [];
  anioEstandarNivel: string = '';
  mesEstandarNivel: string = '';
  periodoEstandarNivel: string = '';
  selectPeriodoEstandarNivel: boolean = true;
  public loadingEstandarNivel: boolean = false;
  public errorEstandarNivel: string = '';
  public mostrarFormularioEstandarNivel: boolean = false;
  public savingEstandarNivel: boolean = false;
  public errorEstandarNivelForm: string = '';
  public estandarNivelForm!: FormGroup;

  filtersEstandarNivel = {
    id: "",
    id_estandar: "",
    tipo: "",
    indicador: "",
    nivel_centro: "",
    anio: "",
    est_fijo: "",
    est_01: "",
    est_02: "",
    est_03: "",
    est_04: "",
    est_05: "",
    est_06: "",
    est_07: "",
    est_08: "",
    est_09: "",
    est_10: "",
    est_11: "",
    est_12: "",
    acept: "",
    aceptmenos: ""
  };

  // tmi_estandar_categoria
  public dataEstandarCategoria: any[] = [];
  public dataEstandarCategoriaFilter: any[] = [];
  anioEstandarCategoria: string = '';
  mesEstandarCategoria: string = '';
  periodoEstandarCategoria: string = '';
  selectPeriodoEstandarCategoria: boolean = true;
  public loadingEstandarCategoria: boolean = false;
  public errorEstandarCategoria: string = '';
  public mostrarFormularioEstandarCategoria: boolean = false;
  public savingEstandarCategoria: boolean = false;
  public errorEstandarCategoriaForm: string = '';
  public estandarCategoriaForm!: FormGroup;

  filtersEstandarCategoria = {
    id: "",
    id_estandar: "",
    tipo: "",
    indicador: "",
    categoria_centro: "",
    anio: "",
    est_fijo: "",
    est_01: "",
    est_02: "",
    est_03: "",
    est_04: "",
    est_05: "",
    est_06: "",
    est_07: "",
    est_08: "",
    est_09: "",
    est_10: "",
    est_11: "",
    est_12: "",
    acept: "",
    aceptmenos: ""
  };

  // tmi_centro
  public listaCentros: any[] = [];
  public dataCentrosTMI: any[] = [];
  public dataCentrosTMIFilter: any[] = [];
  anioCentrosTMI: string = '';
  mesCentrosTMI: string = '';
  periodoCentrosTMI: string = '';
  selectPeriodoCentrosTMI: boolean = false;
  public loadingCentrosTMI: boolean = false;
  public errorCentrosTMI: string = '';
  public mostrarFormularioCentrosTMI: boolean = false;
  public savingCentrosTMI: boolean = false;
  public errorCentroForm: string = '';
  public centrosForm!: FormGroup;

  filtersCentrosTMI = {
    id: "",
    red: "",
    orden: "",
    orden_tipo: "",
    codcentro: "",
    centro: "",
    categoria: "",
    nivel: "",
    tipo: "",
    flag: ""
  };

  // exclusion_centro_estandar
  public dataExclusion: any[] = [];
  public dataExclusionFilter: any[] = [];
  anioExclusion: string = '';
  mesExclusion: string = '';
  periodoExclusion: string = '';
  selectPeriodoExclusion: boolean = true;
  public loadingExclusion: boolean = false;
  public errorExclusion: string = '';
  public mostrarFormularioExclusion: boolean = false;
  public savingExclusion: boolean = false;
  public errorExclusionForm: string = '';
  public exclusionForm!: FormGroup;

  filtersExclusion = {
    id: "",
    red: "",
    codcentro: "",
    centro: "",
    tipo: "",
    indicador: "",
    anio: "",
    excl_01: "",
    excl_02: "",
    excl_03: "",
    excl_04: "",
    excl_05: "",
    excl_06: "",
    excl_07: "",
    excl_08: "",
    excl_09: "",
    excl_10: "",
    excl_11: "",
    excl_12: ""
  };

  constructor(
    private estandarSrv: TmiEstandarService,
    private centroSrv: TmiCentroService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService
  ) { }

  ngOnInit(): void {
    this.aniosDisponibles = this.generarAniosDinamicos(6);
    // por defecto el mes anterior al actual (en enero: diciembre del año anterior)
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    const anioDefecto = String(mesAnterior.getFullYear());
    const mesDefecto = String(mesAnterior.getMonth() + 1).padStart(2, '0');

    this.anioEstandarTipo = anioDefecto;
    this.mesEstandarTipo = mesDefecto;
    this.periodoEstandarTipo = `${anioDefecto}${mesDefecto}`;

    this.anioEstandarNivel = anioDefecto;
    this.mesEstandarNivel = mesDefecto;
    this.periodoEstandarNivel = `${anioDefecto}${mesDefecto}`;

    this.anioEstandarCategoria = anioDefecto;
    this.mesEstandarCategoria = mesDefecto;
    this.periodoEstandarCategoria = `${anioDefecto}${mesDefecto}`;

    this.anioCentrosTMI = anioDefecto;
    this.mesCentrosTMI = mesDefecto;
    this.periodoCentrosTMI = `${anioDefecto}${mesDefecto}`;

    this.anioExclusion = anioDefecto;
    this.mesExclusion = mesDefecto;
    this.periodoExclusion = `${anioDefecto}${mesDefecto}`;

    this.periodoMinimoEditable = `${anioDefecto}${mesDefecto}`;

    this.reactiveForm();
    this.getQueryEstandar();
    this.getQueryCentrosTMI();
    this.setActiveTab(this.activeTab);
  }

  // catálogo de indicadores/estándares (usado en selectores de formularios)
  getQueryEstandar(): void {
    this.estandarSrv.getQueryEstandar().subscribe({
      next: (res: any[]) => {
        this.listaEstandares = res || [];
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error al cargar catálogo de estándares', err);
      }
    });
  }

  loadFechaActualizacion() {
    this.fechaService.queryFechaActualizacion().subscribe({
      next: (data) => {
        this.currentDate = data.fecha_act;
      },
      error: (error) => {
        console.error('Error al cargar la fecha de actualizacion', error);
      }
    });
  }

  reactiveForm() {
    // Form 1: tmi_estandar_tipo
    this.estandarTipoForm = this.formBuilder.group({
      id: [null, []],
      id_estandar: [null, [Validators.required]],
      tipo_centro: ['', [Validators.required]],
      anio: [null, [Validators.required]],
      est_fijo: [0, [Validators.required]],
      est_01: [0, [Validators.required]],
      est_02: [0, [Validators.required]],
      est_03: [0, [Validators.required]],
      est_04: [0, [Validators.required]],
      est_05: [0, [Validators.required]],
      est_06: [0, [Validators.required]],
      est_07: [0, [Validators.required]],
      est_08: [0, [Validators.required]],
      est_09: [0, [Validators.required]],
      est_10: [0, [Validators.required]],
      est_11: [0, [Validators.required]],
      est_12: [0, [Validators.required]]
    });

    // Form 2: tmi_estandar_nivel
    this.estandarNivelForm = this.formBuilder.group({
      id: [null, []],
      id_estandar: [null, [Validators.required]],
      nivel_centro: ['', [Validators.required]],
      anio: [null, [Validators.required]],
      est_fijo: [0, [Validators.required]],
      est_01: [0, [Validators.required]],
      est_02: [0, [Validators.required]],
      est_03: [0, [Validators.required]],
      est_04: [0, [Validators.required]],
      est_05: [0, [Validators.required]],
      est_06: [0, [Validators.required]],
      est_07: [0, [Validators.required]],
      est_08: [0, [Validators.required]],
      est_09: [0, [Validators.required]],
      est_10: [0, [Validators.required]],
      est_11: [0, [Validators.required]],
      est_12: [0, [Validators.required]]
    });

    // Form 3: tmi_estandar_categoria
    this.estandarCategoriaForm = this.formBuilder.group({
      id: [null, []],
      id_estandar: [null, [Validators.required]],
      categoria_centro: ['', [Validators.required]],
      anio: [null, [Validators.required]],
      est_fijo: [0, [Validators.required]],
      est_01: [0, [Validators.required]],
      est_02: [0, [Validators.required]],
      est_03: [0, [Validators.required]],
      est_04: [0, [Validators.required]],
      est_05: [0, [Validators.required]],
      est_06: [0, [Validators.required]],
      est_07: [0, [Validators.required]],
      est_08: [0, [Validators.required]],
      est_09: [0, [Validators.required]],
      est_10: [0, [Validators.required]],
      est_11: [0, [Validators.required]],
      est_12: [0, [Validators.required]]
    });

    // Form 4: tmi_centro
    this.centrosForm = this.formBuilder.group({
      id: [null, []],
      red: ['', [Validators.required]],
      orden: ['', [Validators.required]],
      orden_tipo: ['', [Validators.required]],
      codcentro: ['', [Validators.required]],
      centro: ['', [Validators.required]],
      categoria: ['', []],
      nivel: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      flag: [true, []]
    });

    // Form 5: exclusion_centro_estandar
    this.exclusionForm = this.formBuilder.group({
      id: [null, []],
      id_centro: [null, [Validators.required]],
      id_estandar: [null, [Validators.required]],
      anio: [null, [Validators.required]],
      resultado: ['NA', [Validators.required]],
      excl_01: [false, []],
      excl_02: [false, []],
      excl_03: [false, []],
      excl_04: [false, []],
      excl_05: [false, []],
      excl_06: [false, []],
      excl_07: [false, []],
      excl_08: [false, []],
      excl_09: [false, []],
      excl_10: [false, []],
      excl_11: [false, []],
      excl_12: [false, []]
    });
  }

  private resolverIdEstandar(row: any): number | null {
    if (row.id_estandar != null && row.id_estandar !== '') {
      return Number(row.id_estandar);
    }
    const encontrado = this.listaEstandares.find(
      e => e.tipo === row.tipo && e.indicador === row.indicador
    );
    return encontrado ? Number(encontrado.id) : null;
  }

  private payloadEstandarAnual(form: FormGroup, campoCentro: 'tipo_centro' | 'nivel_centro' | 'categoria_centro'): any {
    const valor = form.getRawValue();
    return {
      id: valor.id ? Number(valor.id) : null,
      id_estandar: Number(valor.id_estandar),
      [campoCentro]: String(valor[campoCentro] ?? '').trim(),
      anio: Number(valor.anio),
      est_fijo: Number(valor.est_fijo ?? 0),
      est_01: Number(valor.est_01 ?? 0),
      est_02: Number(valor.est_02 ?? 0),
      est_03: Number(valor.est_03 ?? 0),
      est_04: Number(valor.est_04 ?? 0),
      est_05: Number(valor.est_05 ?? 0),
      est_06: Number(valor.est_06 ?? 0),
      est_07: Number(valor.est_07 ?? 0),
      est_08: Number(valor.est_08 ?? 0),
      est_09: Number(valor.est_09 ?? 0),
      est_10: Number(valor.est_10 ?? 0),
      est_11: Number(valor.est_11 ?? 0),
      est_12: Number(valor.est_12 ?? 0)
    };
  }

  // tmi_estandar_tipo
  getQueryEstandarTipo() {
    this.loadingEstandarTipo = true;
    this.errorEstandarTipo = '';

    this.estandarSrv.getQueryEstandarTipo(this.anioEstandarTipo).subscribe({
      next: (res: any) => {
        this.dataEstandarTipo = res || [];
        this.dataEstandarTipoFilter = res || [];
        this.loadingEstandarTipo = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.viewportTipo?.checkViewportSize();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorEstandarTipo = 'Error al cargar los estándares por tipo';
        this.loadingEstandarTipo = false;
        this.cdr.markForCheck();
      }
    });
  }

  // nueva fila en el año consultado
  iniciarAltaEstandarTipo(): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.estandarTipoForm) this.reactiveForm();
    this.estandarTipoForm.reset({
      id: null,
      id_estandar: null,
      tipo_centro: '',
      anio: Number(this.anioEstandarTipo),
      est_fijo: 0,
      est_01: 0,
      est_02: 0,
      est_03: 0,
      est_04: 0,
      est_05: 0,
      est_06: 0,
      est_07: 0,
      est_08: 0,
      est_09: 0,
      est_10: 0,
      est_11: 0,
      est_12: 0
    });
    this.errorEstandarTipoForm = '';
    this.mostrarFormularioEstandarTipo = true;
    this.cdr.markForCheck();
  }

  eliminarEstandarTipo(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.tipo} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.estandarSrv.deleteQueryEstandarTipo(row.id), () => this.getQueryEstandarTipo());
  }

  iniciarEdicionEstandarTipo(row: any): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.estandarTipoForm) this.reactiveForm();
    this.estandarTipoForm.reset();
    this.estandarTipoForm.patchValue({
      id: row.id ?? null,
      id_estandar: this.resolverIdEstandar(row),
      tipo_centro: row.tipo_centro ?? '',
      anio: row.anio ?? Number(this.anioEstandarTipo),
      est_fijo: row.est_fijo ?? 0,
      est_01: row.est_01 ?? 0,
      est_02: row.est_02 ?? 0,
      est_03: row.est_03 ?? 0,
      est_04: row.est_04 ?? 0,
      est_05: row.est_05 ?? 0,
      est_06: row.est_06 ?? 0,
      est_07: row.est_07 ?? 0,
      est_08: row.est_08 ?? 0,
      est_09: row.est_09 ?? 0,
      est_10: row.est_10 ?? 0,
      est_11: row.est_11 ?? 0,
      est_12: row.est_12 ?? 0
    });
    this.errorEstandarTipoForm = '';
    this.mostrarFormularioEstandarTipo = true;
    this.cdr.markForCheck();
  }

  cancelarEdicionEstandarTipo(): void {
    this.mostrarFormularioEstandarTipo = false;
    this.errorEstandarTipoForm = '';
    this.savingEstandarTipo = false;
    this.cdr.markForCheck();
  }

  updateQueryEstandarTipo(): void {
    if (this.estandarTipoForm.invalid) {
      this.estandarTipoForm.markAllAsTouched();
      this.errorEstandarTipoForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandarTipo = true;
    this.errorEstandarTipoForm = '';

    const dto = this.payloadEstandarAnual(this.estandarTipoForm, 'tipo_centro');
    const peticion = dto.id ? this.estandarSrv.putQueryEstandarTipo(dto) : this.estandarSrv.postQueryEstandarTipo(dto);
    peticion.subscribe({
      next: () => {
        this.savingEstandarTipo = false;
        this.mostrarFormularioEstandarTipo = false;
        this.getQueryEstandarTipo();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandarTipo = false;
        this.errorEstandarTipoForm = typeof error === 'string' ? error : (error?.error?.detail || (dto.id ? 'Error al actualizar ' : 'Error al agregar ') + 'estándar tipo');
        this.cdr.markForCheck();
      }
    });
  }

  filterDataEstandarTipo(column: keyof typeof this.filtersEstandarTipo, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandarTipo[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandarTipo = this.dataEstandarTipoFilter.filter(row =>
      check(row.tipo, this.filtersEstandarTipo.tipo) &&
      check(row.indicador, this.filtersEstandarTipo.indicador) &&
      check(row.tipo_centro, this.filtersEstandarTipo.tipo_centro) &&
      check(row.anio, this.filtersEstandarTipo.anio) &&
      check(row.est_fijo, this.filtersEstandarTipo.est_fijo) &&
      check(row.est_01, this.filtersEstandarTipo.est_01) &&
      check(row.est_02, this.filtersEstandarTipo.est_02) &&
      check(row.est_03, this.filtersEstandarTipo.est_03) &&
      check(row.est_04, this.filtersEstandarTipo.est_04) &&
      check(row.est_05, this.filtersEstandarTipo.est_05) &&
      check(row.est_06, this.filtersEstandarTipo.est_06) &&
      check(row.est_07, this.filtersEstandarTipo.est_07) &&
      check(row.est_08, this.filtersEstandarTipo.est_08) &&
      check(row.est_09, this.filtersEstandarTipo.est_09) &&
      check(row.est_10, this.filtersEstandarTipo.est_10) &&
      check(row.est_11, this.filtersEstandarTipo.est_11) &&
      check(row.est_12, this.filtersEstandarTipo.est_12)
    );
  }

  // tmi_estandar_nivel
  getQueryEstandarNivel() {
    this.loadingEstandarNivel = true;
    this.errorEstandarNivel = '';

    this.estandarSrv.getQueryEstandarNivel(this.anioEstandarNivel).subscribe({
      next: (res: any) => {
        this.dataEstandarNivel = res || [];
        this.dataEstandarNivelFilter = res || [];
        this.loadingEstandarNivel = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.viewportNivel?.checkViewportSize();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorEstandarNivel = 'Error al cargar los estándares por nivel';
        this.loadingEstandarNivel = false;
        this.cdr.markForCheck();
      }
    });
  }

  // nueva fila en el año consultado
  iniciarAltaEstandarNivel(): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.estandarNivelForm) this.reactiveForm();
    this.estandarNivelForm.reset({
      id: null,
      id_estandar: null,
      nivel_centro: '',
      anio: Number(this.anioEstandarNivel),
      est_fijo: 0,
      est_01: 0,
      est_02: 0,
      est_03: 0,
      est_04: 0,
      est_05: 0,
      est_06: 0,
      est_07: 0,
      est_08: 0,
      est_09: 0,
      est_10: 0,
      est_11: 0,
      est_12: 0
    });
    this.errorEstandarNivelForm = '';
    this.mostrarFormularioEstandarNivel = true;
    this.cdr.markForCheck();
  }

  eliminarEstandarNivel(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.tipo} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.estandarSrv.deleteQueryEstandarNivel(row.id), () => this.getQueryEstandarNivel());
  }

  iniciarEdicionEstandarNivel(row: any): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.estandarNivelForm) this.reactiveForm();
    this.estandarNivelForm.reset();
    this.estandarNivelForm.patchValue({
      id: row.id ?? null,
      id_estandar: this.resolverIdEstandar(row),
      nivel_centro: row.nivel_centro ?? '',
      anio: row.anio ?? Number(this.anioEstandarNivel),
      est_fijo: row.est_fijo ?? 0,
      est_01: row.est_01 ?? 0,
      est_02: row.est_02 ?? 0,
      est_03: row.est_03 ?? 0,
      est_04: row.est_04 ?? 0,
      est_05: row.est_05 ?? 0,
      est_06: row.est_06 ?? 0,
      est_07: row.est_07 ?? 0,
      est_08: row.est_08 ?? 0,
      est_09: row.est_09 ?? 0,
      est_10: row.est_10 ?? 0,
      est_11: row.est_11 ?? 0,
      est_12: row.est_12 ?? 0
    });
    this.errorEstandarNivelForm = '';
    this.mostrarFormularioEstandarNivel = true;
    this.cdr.markForCheck();
  }

  cancelarEdicionEstandarNivel(): void {
    this.mostrarFormularioEstandarNivel = false;
    this.errorEstandarNivelForm = '';
    this.savingEstandarNivel = false;
    this.cdr.markForCheck();
  }

  updateQueryEstandarNivel(): void {
    if (this.estandarNivelForm.invalid) {
      this.estandarNivelForm.markAllAsTouched();
      this.errorEstandarNivelForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandarNivel = true;
    this.errorEstandarNivelForm = '';

    const dto = this.payloadEstandarAnual(this.estandarNivelForm, 'nivel_centro');
    const peticion = dto.id ? this.estandarSrv.putQueryEstandarNivel(dto) : this.estandarSrv.postQueryEstandarNivel(dto);
    peticion.subscribe({
      next: () => {
        this.savingEstandarNivel = false;
        this.mostrarFormularioEstandarNivel = false;
        this.getQueryEstandarNivel();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandarNivel = false;
        this.errorEstandarNivelForm = typeof error === 'string' ? error : (error?.error?.detail || (dto.id ? 'Error al actualizar ' : 'Error al agregar ') + 'estándar nivel');
        this.cdr.markForCheck();
      }
    });
  }

  filterDataEstandarNivel(column: keyof typeof this.filtersEstandarNivel, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandarNivel[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandarNivel = this.dataEstandarNivelFilter.filter(row =>
      check(row.tipo, this.filtersEstandarNivel.tipo) &&
      check(row.indicador, this.filtersEstandarNivel.indicador) &&
      check(row.nivel_centro, this.filtersEstandarNivel.nivel_centro) &&
      check(row.anio, this.filtersEstandarNivel.anio) &&
      check(row.est_fijo, this.filtersEstandarNivel.est_fijo) &&
      check(row.est_01, this.filtersEstandarNivel.est_01) &&
      check(row.est_02, this.filtersEstandarNivel.est_02) &&
      check(row.est_03, this.filtersEstandarNivel.est_03) &&
      check(row.est_04, this.filtersEstandarNivel.est_04) &&
      check(row.est_05, this.filtersEstandarNivel.est_05) &&
      check(row.est_06, this.filtersEstandarNivel.est_06) &&
      check(row.est_07, this.filtersEstandarNivel.est_07) &&
      check(row.est_08, this.filtersEstandarNivel.est_08) &&
      check(row.est_09, this.filtersEstandarNivel.est_09) &&
      check(row.est_10, this.filtersEstandarNivel.est_10) &&
      check(row.est_11, this.filtersEstandarNivel.est_11) &&
      check(row.est_12, this.filtersEstandarNivel.est_12)
    );
  }

  // tmi_estandar_categoria
  getQueryEstandarCategoria() {
    this.loadingEstandarCategoria = true;
    this.errorEstandarCategoria = '';

    this.estandarSrv.getQueryEstandarCategoria(this.anioEstandarCategoria).subscribe({
      next: (res: any) => {
        this.dataEstandarCategoria = res || [];
        this.dataEstandarCategoriaFilter = res || [];
        this.loadingEstandarCategoria = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.viewportCategoria?.checkViewportSize();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorEstandarCategoria = 'Error al cargar los estándares por categoría';
        this.loadingEstandarCategoria = false;
        this.cdr.markForCheck();
      }
    });
  }

  // nueva fila en el año consultado
  iniciarAltaEstandarCategoria(): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.estandarCategoriaForm) this.reactiveForm();
    this.estandarCategoriaForm.reset({
      id: null,
      id_estandar: null,
      categoria_centro: '',
      anio: Number(this.anioEstandarCategoria),
      est_fijo: 0,
      est_01: 0,
      est_02: 0,
      est_03: 0,
      est_04: 0,
      est_05: 0,
      est_06: 0,
      est_07: 0,
      est_08: 0,
      est_09: 0,
      est_10: 0,
      est_11: 0,
      est_12: 0
    });
    this.errorEstandarCategoriaForm = '';
    this.mostrarFormularioEstandarCategoria = true;
    this.cdr.markForCheck();
  }

  eliminarEstandarCategoria(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.tipo} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.estandarSrv.deleteQueryEstandarCategoria(row.id), () => this.getQueryEstandarCategoria());
  }

  iniciarEdicionEstandarCategoria(row: any): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.estandarCategoriaForm) this.reactiveForm();
    this.estandarCategoriaForm.reset();
    this.estandarCategoriaForm.patchValue({
      id: row.id ?? null,
      id_estandar: this.resolverIdEstandar(row),
      categoria_centro: row.categoria_centro ?? '',
      anio: row.anio ?? Number(this.anioEstandarCategoria),
      est_fijo: row.est_fijo ?? 0,
      est_01: row.est_01 ?? 0,
      est_02: row.est_02 ?? 0,
      est_03: row.est_03 ?? 0,
      est_04: row.est_04 ?? 0,
      est_05: row.est_05 ?? 0,
      est_06: row.est_06 ?? 0,
      est_07: row.est_07 ?? 0,
      est_08: row.est_08 ?? 0,
      est_09: row.est_09 ?? 0,
      est_10: row.est_10 ?? 0,
      est_11: row.est_11 ?? 0,
      est_12: row.est_12 ?? 0
    });
    this.errorEstandarCategoriaForm = '';
    this.mostrarFormularioEstandarCategoria = true;
    this.cdr.markForCheck();
  }

  cancelarEdicionEstandarCategoria(): void {
    this.mostrarFormularioEstandarCategoria = false;
    this.errorEstandarCategoriaForm = '';
    this.savingEstandarCategoria = false;
    this.cdr.markForCheck();
  }

  updateQueryEstandarCategoria(): void {
    if (this.estandarCategoriaForm.invalid) {
      this.estandarCategoriaForm.markAllAsTouched();
      this.errorEstandarCategoriaForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandarCategoria = true;
    this.errorEstandarCategoriaForm = '';

    const dto = this.payloadEstandarAnual(this.estandarCategoriaForm, 'categoria_centro');
    const peticion = dto.id ? this.estandarSrv.putQueryEstandarCategoria(dto) : this.estandarSrv.postQueryEstandarCategoria(dto);
    peticion.subscribe({
      next: () => {
        this.savingEstandarCategoria = false;
        this.mostrarFormularioEstandarCategoria = false;
        this.getQueryEstandarCategoria();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandarCategoria = false;
        this.errorEstandarCategoriaForm = typeof error === 'string' ? error : (error?.error?.detail || (dto.id ? 'Error al actualizar ' : 'Error al agregar ') + 'estándar categoría');
        this.cdr.markForCheck();
      }
    });
  }

  filterDataEstandarCategoria(column: keyof typeof this.filtersEstandarCategoria, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandarCategoria[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandarCategoria = this.dataEstandarCategoriaFilter.filter(row =>
      check(row.tipo, this.filtersEstandarCategoria.tipo) &&
      check(row.indicador, this.filtersEstandarCategoria.indicador) &&
      check(row.categoria_centro, this.filtersEstandarCategoria.categoria_centro) &&
      check(row.anio, this.filtersEstandarCategoria.anio) &&
      check(row.est_fijo, this.filtersEstandarCategoria.est_fijo) &&
      check(row.est_01, this.filtersEstandarCategoria.est_01) &&
      check(row.est_02, this.filtersEstandarCategoria.est_02) &&
      check(row.est_03, this.filtersEstandarCategoria.est_03) &&
      check(row.est_04, this.filtersEstandarCategoria.est_04) &&
      check(row.est_05, this.filtersEstandarCategoria.est_05) &&
      check(row.est_06, this.filtersEstandarCategoria.est_06) &&
      check(row.est_07, this.filtersEstandarCategoria.est_07) &&
      check(row.est_08, this.filtersEstandarCategoria.est_08) &&
      check(row.est_09, this.filtersEstandarCategoria.est_09) &&
      check(row.est_10, this.filtersEstandarCategoria.est_10) &&
      check(row.est_11, this.filtersEstandarCategoria.est_11) &&
      check(row.est_12, this.filtersEstandarCategoria.est_12)
    );
  }

  /// tmi_centro
  getQueryCentrosTMI() {
    this.loadingCentrosTMI = true;
    this.errorCentrosTMI = '';

    this.centroSrv.getQueryCentrosTMI().subscribe({
      next: (res: any) => {
        this.listaCentros = res || [];
        this.dataCentrosTMI = res || [];
        this.dataCentrosTMIFilter = res || [];
        this.loadingCentrosTMI = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.viewportCentros?.checkViewportSize();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorCentrosTMI = 'Error al cargar los centros TMI';
        this.loadingCentrosTMI = false;
        this.cdr.markForCheck();
      }
    });
  }

  // nuevo centro
  iniciarAltaCentro(): void {
    if (!this.centrosForm) this.reactiveForm();
    this.centrosForm.reset({
      id: null,
      red: '',
      orden: '',
      orden_tipo: '',
      codcentro: '',
      centro: '',
      categoria: '',
      nivel: '',
      tipo: '',
      flag: true
    });
    this.errorCentroForm = '';
    this.mostrarFormularioCentrosTMI = true;
    this.cdr.markForCheck();
  }

  eliminarCentro(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar el centro ID ${row.id} (${row.codcentro} - ${row.centro})? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.centroSrv.deleteQueryCentrosTMI(row.id), () => this.getQueryCentrosTMI());
  }

  iniciarEdicionCentro(row: any): void {
    if (!this.centrosForm) this.reactiveForm();
    this.centrosForm.reset();
    this.centrosForm.patchValue({
      id: row.id ?? null,
      red: row.red ?? '',
      orden: String(row.orden ?? ''),
      orden_tipo: String(row.orden_tipo ?? ''),
      codcentro: String(row.codcentro ?? ''),
      centro: row.centro ?? '',
      categoria: row.categoria ?? '',
      nivel: row.nivel ?? '',
      tipo: row.tipo ?? '',
      flag: row.flag !== undefined && row.flag !== null ? Boolean(row.flag) : true
    });
    this.errorCentroForm = '';
    this.mostrarFormularioCentrosTMI = true;
    this.cdr.markForCheck();
  }

  cancelarEdicionCentro(): void {
    this.mostrarFormularioCentrosTMI = false;
    this.errorCentroForm = '';
    this.savingCentrosTMI = false;
    this.cdr.markForCheck();
  }

  updateQueryCentrosTMI(): void {
    if (this.centrosForm.invalid) {
      this.centrosForm.markAllAsTouched();
      this.errorCentroForm = 'Por favor, complete todos los campos obligatorios del formulario.';
      return;
    }
    this.savingCentrosTMI = true;
    this.errorCentroForm = '';

    const valor = this.centrosForm.getRawValue();
    const dto = {
      id: valor.id ? Number(valor.id) : null,
      red: String(valor.red ?? '').trim(),
      orden: String(valor.orden ?? '').trim(),
      orden_tipo: String(valor.orden_tipo ?? '').trim(),
      codcentro: String(valor.codcentro ?? '').trim(),
      centro: String(valor.centro ?? '').trim(),
      categoria: valor.categoria ? String(valor.categoria).trim() : null,
      nivel: String(valor.nivel ?? '').trim(),
      tipo: String(valor.tipo ?? '').trim(),
      flag: Boolean(valor.flag)
    };
    const peticion = dto.id ? this.centroSrv.putQueryCentrosTMI(dto) : this.centroSrv.postQueryCentrosTMI(dto);
    peticion.subscribe({
      next: () => {
        this.savingCentrosTMI = false;
        this.mostrarFormularioCentrosTMI = false;
        this.getQueryCentrosTMI();
      },
      error: (error: any) => {
        console.error(error);
        this.savingCentrosTMI = false;
        this.errorCentroForm = typeof error === 'string' ? error : (error?.error?.detail || (dto.id ? 'Error al actualizar ' : 'Error al agregar ') + 'centro TMI');
        this.cdr.markForCheck();
      }
    });
  }

  filterDataCentrosTMI(column: keyof typeof this.filtersCentrosTMI, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersCentrosTMI[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    const checkFlag = (val: any, filter: string) => {
      if (!filter) return true;
      const etiqueta = val ? 'activo' : 'inactivo';
      return etiqueta.includes(filter);
    };
    this.dataCentrosTMI = this.dataCentrosTMIFilter.filter(row =>
      check(row.id, this.filtersCentrosTMI.id) &&
      check(row.red, this.filtersCentrosTMI.red) &&
      check(row.orden, this.filtersCentrosTMI.orden) &&
      check(row.orden_tipo, this.filtersCentrosTMI.orden_tipo) &&
      check(row.codcentro, this.filtersCentrosTMI.codcentro) &&
      check(row.centro, this.filtersCentrosTMI.centro) &&
      check(row.categoria, this.filtersCentrosTMI.categoria) &&
      check(row.nivel, this.filtersCentrosTMI.nivel) &&
      check(row.tipo, this.filtersCentrosTMI.tipo) &&
      checkFlag(row.flag, this.filtersCentrosTMI.flag)
    );
  }

  /// exclusion_centro_estandar
  getQueryExclusion(): void {
    this.loadingExclusion = true;
    this.errorExclusion = '';

    this.centroSrv.getQueryExclusionCentroEstandar(this.anioExclusion).subscribe({
      next: (res: any) => {
        this.dataExclusion = res || [];
        this.dataExclusionFilter = res || [];
        this.loadingExclusion = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.viewportExclusion?.checkViewportSize();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorExclusion = 'Error al cargar las exclusiones de centros y estándares';
        this.loadingExclusion = false;
        this.cdr.markForCheck();
      }
    });
  }

  iniciarAltaExclusion(): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.listaCentros.length) this.getQueryCentrosTMI();
    if (!this.exclusionForm) this.reactiveForm();
    this.exclusionForm.reset({
      id: null,
      id_centro: null,
      id_estandar: null,
      anio: Number(this.anioExclusion),
      resultado: 'NA',
      excl_01: false,
      excl_02: false,
      excl_03: false,
      excl_04: false,
      excl_05: false,
      excl_06: false,
      excl_07: false,
      excl_08: false,
      excl_09: false,
      excl_10: false,
      excl_11: false,
      excl_12: false
    });
    this.errorExclusionForm = '';
    this.mostrarFormularioExclusion = true;
    this.cdr.markForCheck();
  }

  iniciarEdicionExclusion(row: any): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.listaCentros.length) this.getQueryCentrosTMI();
    if (!this.exclusionForm) this.reactiveForm();
    this.exclusionForm.reset();
    this.exclusionForm.patchValue({
      id: row.id ?? null,
      id_centro: row.id_centro != null ? Number(row.id_centro) : null,
      id_estandar: this.resolverIdEstandar(row),
      anio: row.anio ?? Number(this.anioExclusion),
      resultado: row.resultado === '0' ? '0' : 'NA',
      excl_01: Boolean(row.excl_01),
      excl_02: Boolean(row.excl_02),
      excl_03: Boolean(row.excl_03),
      excl_04: Boolean(row.excl_04),
      excl_05: Boolean(row.excl_05),
      excl_06: Boolean(row.excl_06),
      excl_07: Boolean(row.excl_07),
      excl_08: Boolean(row.excl_08),
      excl_09: Boolean(row.excl_09),
      excl_10: Boolean(row.excl_10),
      excl_11: Boolean(row.excl_11),
      excl_12: Boolean(row.excl_12)
    });
    this.errorExclusionForm = '';
    this.mostrarFormularioExclusion = true;
    this.cdr.markForCheck();
  }

  cancelarEdicionExclusion(): void {
    this.mostrarFormularioExclusion = false;
    this.errorExclusionForm = '';
    this.savingExclusion = false;
    this.cdr.markForCheck();
  }

  updateQueryExclusion(): void {
    if (this.exclusionForm.invalid) {
      this.exclusionForm.markAllAsTouched();
      this.errorExclusionForm = 'Por favor, seleccione el centro, el estándar y el año.';
      return;
    }
    this.savingExclusion = true;
    this.errorExclusionForm = '';

    const valor = this.exclusionForm.getRawValue();
    const dto = {
      id: valor.id ? Number(valor.id) : null,
      id_centro: Number(valor.id_centro),
      id_estandar: Number(valor.id_estandar),
      anio: Number(valor.anio),
      resultado: valor.resultado === '0' ? '0' : 'NA',
      excl_01: Boolean(valor.excl_01),
      excl_02: Boolean(valor.excl_02),
      excl_03: Boolean(valor.excl_03),
      excl_04: Boolean(valor.excl_04),
      excl_05: Boolean(valor.excl_05),
      excl_06: Boolean(valor.excl_06),
      excl_07: Boolean(valor.excl_07),
      excl_08: Boolean(valor.excl_08),
      excl_09: Boolean(valor.excl_09),
      excl_10: Boolean(valor.excl_10),
      excl_11: Boolean(valor.excl_11),
      excl_12: Boolean(valor.excl_12)
    };
    const peticion = dto.id
      ? this.centroSrv.putQueryExclusionCentroEstandar(dto)
      : this.centroSrv.postQueryExclusionCentroEstandar(dto);
    peticion.subscribe({
      next: () => {
        this.savingExclusion = false;
        this.mostrarFormularioExclusion = false;
        this.getQueryExclusion();
      },
      error: (error: any) => {
        console.error(error);
        this.savingExclusion = false;
        this.errorExclusionForm = typeof error === 'string' ? error : (error?.error?.detail || (dto.id ? 'Error al actualizar ' : 'Error al agregar ') + 'exclusión');
        this.cdr.markForCheck();
      }
    });
  }

  eliminarExclusion(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la exclusión ID ${row.id} (${row.centro} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.centroSrv.deleteQueryExclusionCentroEstandar(row.id), () => this.getQueryExclusion());
  }

  filterDataExclusion(column: keyof typeof this.filtersExclusion, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersExclusion[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    const checkExcl = (val: any, filter: string) => {
      if (!filter) return true;
      const etiqueta = val ? 'excluido' : 'no excluido';
      return etiqueta.includes(filter);
    };
    this.dataExclusion = this.dataExclusionFilter.filter(row =>
      check(row.id, this.filtersExclusion.id) &&
      check(row.red, this.filtersExclusion.red) &&
      check(row.codcentro, this.filtersExclusion.codcentro) &&
      check(row.centro, this.filtersExclusion.centro) &&
      check(row.tipo, this.filtersExclusion.tipo) &&
      check(row.indicador, this.filtersExclusion.indicador) &&
      check(row.anio, this.filtersExclusion.anio) &&
      checkExcl(row.excl_01, this.filtersExclusion.excl_01) &&
      checkExcl(row.excl_02, this.filtersExclusion.excl_02) &&
      checkExcl(row.excl_03, this.filtersExclusion.excl_03) &&
      checkExcl(row.excl_04, this.filtersExclusion.excl_04) &&
      checkExcl(row.excl_05, this.filtersExclusion.excl_05) &&
      checkExcl(row.excl_06, this.filtersExclusion.excl_06) &&
      checkExcl(row.excl_07, this.filtersExclusion.excl_07) &&
      checkExcl(row.excl_08, this.filtersExclusion.excl_08) &&
      checkExcl(row.excl_09, this.filtersExclusion.excl_09) &&
      checkExcl(row.excl_10, this.filtersExclusion.excl_10) &&
      checkExcl(row.excl_11, this.filtersExclusion.excl_11) &&
      checkExcl(row.excl_12, this.filtersExclusion.excl_12)
    );
  }

  downloadCSV(): void {
    if (!this.dataCentrosTMI?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `tmi_centros_${this.periodoCentrosTMI}.csv`;

    const headers = Object.keys(this.dataCentrosTMI[0]);
    const csvContent = [
      headers.join(';'),
      ...this.dataCentrosTMI.map((row) =>
        headers.map((h) => `="${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }


  // 202608 -> Agosto 2026
  nombrePeriodo(periodo: string): string {
    const p = String(periodo ?? '').trim();
    const mes = this.mesesDisponibles.find(m => m.value === p.substring(4, 6));
    return mes ? `${mes.label} ${p.substring(0, 4)}` : p;
  }

  // periodos anteriores al mínimo ya no se agregan ni modifican
  esPeriodoEditable(periodo: string): boolean {
    return String(periodo ?? '').trim() >= this.periodoMinimoEditable;
  }

  // un periodo sin filas se genera en su cierre copiando el anterior, por eso no se le agregan filas antes
  puedeAgregarFilas(periodo: string, filas: any[]): boolean {
    return this.esPeriodoEditable(periodo) && filas.length > 0;
  }

  motivoNoAgregar(periodo: string, filas: any[]): string {
    if (!this.esPeriodoEditable(periodo)) {
      return `El periodo ${this.nombrePeriodo(periodo)} ya no se puede modificar; el mínimo es ${this.nombrePeriodo(this.periodoMinimoEditable)}`;
    }
    if (!filas.length) return 'El periodo aún no tiene filas; se genera en su fecha de cierre';
    return `Agregar fila en ${this.nombrePeriodo(periodo)}`;
  }

  // la última fila de un periodo no se elimina: el cierre volvería a generar el periodo completo
  puedeEliminarFila(row: any, filas: any[]): boolean {
    return this.esPeriodoEditable(row.periodo) && filas.length > 1 && this.eliminandoId === null;
  }

  tituloEliminar(row: any, filas: any[]): string {
    if (!this.esPeriodoEditable(row.periodo)) return 'Periodo de solo lectura';
    if (filas.length <= 1) return 'No se puede eliminar la última fila del periodo';
    return 'Eliminar fila';
  }

  private eliminarFila(row: any, peticion: Observable<any>, recargar: () => void): void {
    this.eliminandoId = row.id;
    this.errorEliminarFila = '';
    this.cdr.markForCheck();
    peticion.subscribe({
      next: () => {
        this.eliminandoId = null;
        recargar();
      },
      error: (error: any) => {
        console.error(error);
        this.eliminandoId = null;
        this.errorEliminarFila = error?.error?.detail || 'Error al eliminar la fila';
        this.cdr.markForCheck();
      }
    });
  }

  private camposPeriodo(periodo: string) {
    return { periodo, anio: Number(periodo.substring(0, 4)), mes: Number(periodo.substring(4, 6)) };
  }

  private payloadFormulario(form: FormGroup): any {
    const valor = form.getRawValue();
    return { ...valor, id: valor.id || null };
  }

  // tabs
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
    this.errorEliminarFila = '';
    // los estándares y exclusiones se cargan solos la primera vez que se abre la pestaña
    if (tab === 'Estandares Tipo' && this.selectPeriodoEstandarTipo) this.onBuscarEstandarTipo();
    if (tab === 'Estandares Nivel' && this.selectPeriodoEstandarNivel) this.onBuscarEstandarNivel();
    if (tab === 'Estandares Categoria' && this.selectPeriodoEstandarCategoria) this.onBuscarEstandarCategoria();
    if (tab === 'Exclusion Centro Estandar' && this.selectPeriodoExclusion) this.onBuscarExclusion();
    if (tab === 'Centros TMI') this.getQueryCentrosTMI();
    this.cdr.markForCheck();
  }
}
