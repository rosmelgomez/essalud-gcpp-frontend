import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { TmiIndicadoresService } from '../../services/tmi-indicadores-service';
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

export type TabType = 'Estandares Tipo' | 'Estandares Nivel' | 'Estandares Categoria' | 'Centros TMI';

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
    ReactiveFormsModule
  ],
  templateUrl: './tmi-indicadores.html',
  styleUrl: './tmi-indicadores.css',
})
export class TmiIndicadores implements OnInit {
  @ViewChild('viewportTipo') viewportTipo?: CdkVirtualScrollViewport;
  @ViewChild('viewportNivel') viewportNivel?: CdkVirtualScrollViewport;
  @ViewChild('viewportCategoria') viewportCategoria?: CdkVirtualScrollViewport;
  @ViewChild('viewportCentros') viewportCentros?: CdkVirtualScrollViewport;

  currentDate: string = '';

  // Tabs
  activeTab: TabType = 'Estandares Tipo';

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
    if (!this.anioEstandarTipo || !this.mesEstandarTipo) {
      this.errorEstandarTipo = 'Por favor seleccione un año y mes válidos.';
      return;
    }
    this.selectPeriodoEstandarTipo = false;
    this.periodoEstandarTipo = `${this.anioEstandarTipo}${this.mesEstandarTipo}`;
    this.getQueryEstandarTipo();
  }

  onBuscarEstandarNivel(): void {
    if (!this.anioEstandarNivel || !this.mesEstandarNivel) {
      this.errorEstandarNivel = 'Por favor seleccione un año y mes válidos.';
      return;
    }
    this.selectPeriodoEstandarNivel = false;
    this.periodoEstandarNivel = `${this.anioEstandarNivel}${this.mesEstandarNivel}`;
    this.getQueryEstandarNivel();
  }

  onBuscarEstandarCategoria(): void {
    if (!this.anioEstandarCategoria || !this.mesEstandarCategoria) {
      this.errorEstandarCategoria = 'Por favor seleccione un año y mes válidos.';
      return;
    }
    this.selectPeriodoEstandarCategoria = false;
    this.periodoEstandarCategoria = `${this.anioEstandarCategoria}${this.mesEstandarCategoria}`;
    this.getQueryEstandarCategoria();
  }

  onBuscarCentrosTMI(): void {
    if (!this.anioCentrosTMI || !this.mesCentrosTMI) {
      this.errorCentrosTMI = 'Por favor seleccione un año y mes válidos.';
      return;
    }
    this.selectPeriodoCentrosTMI = false;
    this.periodoCentrosTMI = `${this.anioCentrosTMI}${this.mesCentrosTMI}`;
    this.getQueryCentrosTMI();
  }


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
    tipo: "",
    indicador: "",
    tipo_centro: "",
    anio: "",
    mes: "",
    periodo: "",
    estandar: "",
    acept: "",
    aceptmenos: ""
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
    tipo: "",
    indicador: "",
    nivel_centro: "",
    anio: "",
    mes: "",
    periodo: "",
    estandar: "",
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
    tipo: "",
    indicador: "",
    categoria_centro: "",
    anio: "",
    mes: "",
    periodo: "",
    estandar: "",
    acept: "",
    aceptmenos: ""
  };

  // tmi_centro
  public dataCentrosTMI: any[] = [];
  public dataCentrosTMIFilter: any[] = [];
  anioCentrosTMI: string = '';
  mesCentrosTMI: string = '';
  periodoCentrosTMI: string = '';
  selectPeriodoCentrosTMI: boolean = true;
  public loadingCentrosTMI: boolean = false;
  public errorCentrosTMI: string = '';
  public mostrarFormularioCentrosTMI: boolean = false;
  public savingCentrosTMI: boolean = false;
  public errorCentroForm: string = '';
  public centrosForm!: FormGroup;

  filtersCentrosTMI = {
    id: "",
    red: "",
    codred: "",
    orden: "",
    orden_tipo: "",
    codcentro: "",
    categoria: "",
    tipo: "",
    nivel: "",
    centro: "",
    estado: "",
    anio: "",
    mes: "",
    periodo: ""
  };

  constructor(
    private tmiIndicadoresService: TmiIndicadoresService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService
  ) { }

  ngOnInit(): void {
    this.aniosDisponibles = this.generarAniosDinamicos(6);
    const fechaActual = new Date();
    const currentYearStr = String(fechaActual.getFullYear());
    const currentMonthStr = String(fechaActual.getMonth() + 1).padStart(2, '0');

    this.anioEstandarTipo = this.aniosDisponibles.includes(currentYearStr) ? currentYearStr : (this.aniosDisponibles[0] || currentYearStr);
    this.mesEstandarTipo = currentMonthStr;
    this.periodoEstandarTipo = `${this.anioEstandarTipo}${this.mesEstandarTipo}`;

    this.anioEstandarNivel = this.anioEstandarTipo;
    this.mesEstandarNivel = currentMonthStr;
    this.periodoEstandarNivel = `${this.anioEstandarNivel}${this.mesEstandarNivel}`;

    this.anioEstandarCategoria = this.anioEstandarTipo;
    this.mesEstandarCategoria = currentMonthStr;
    this.periodoEstandarCategoria = `${this.anioEstandarCategoria}${this.mesEstandarCategoria}`;

    this.anioCentrosTMI = this.anioEstandarTipo;
    this.mesCentrosTMI = currentMonthStr;
    this.periodoCentrosTMI = `${this.anioCentrosTMI}${this.mesCentrosTMI}`;

    this.reactiveForm();
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
      id: ['', []],
      tipo: ['', [Validators.required]],
      indicador: ['', [Validators.required]],
      tipo_centro: ['', [Validators.required]],
      anio: ['', []],
      mes: ['', []],
      periodo: ['', []],
      estandar: ['', [Validators.required]],
      acept: ['', [Validators.required]],
      aceptmenos: ['', [Validators.required]]
    });

    // Form 2: tmi_estandar_nivel
    this.estandarNivelForm = this.formBuilder.group({
      id: ['', []],
      tipo: ['', [Validators.required]],
      indicador: ['', [Validators.required]],
      nivel_centro: ['', [Validators.required]],
      anio: ['', []],
      mes: ['', []],
      periodo: ['', []],
      estandar: ['', [Validators.required]],
      acept: ['', [Validators.required]],
      aceptmenos: ['', [Validators.required]]
    });

    // Form 3: tmi_estandar_categoria
    this.estandarCategoriaForm = this.formBuilder.group({
      id: ['', []],
      tipo: ['', [Validators.required]],
      indicador: ['', [Validators.required]],
      categoria_centro: ['', [Validators.required]],
      anio: ['', []],
      mes: ['', []],
      periodo: ['', []],
      estandar: ['', [Validators.required]],
      acept: ['', [Validators.required]],
      aceptmenos: ['', [Validators.required]]
    });

    // Form 4: tmi_centro
    this.centrosForm = this.formBuilder.group({
      id: ['', []],
      red: ['', [Validators.required]],
      codred: ['', []],
      orden: ['', [Validators.required]],
      orden_tipo: ['', [Validators.required]],
      codcentro: ['', [Validators.required]],
      categoria: ['', []],
      tipo: ['', [Validators.required]],
      nivel: ['', [Validators.required]],
      centro: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      anio: ['', []],
      mes: ['', []],
      periodo: ['', []]
    });
  }
  // tmi_estandar_tipo
  getQueryEstandarTipo() {
    this.loadingEstandarTipo = true;
    this.errorEstandarTipo = '';

    this.tmiIndicadoresService.getQueryEstandarTipo(this.periodoEstandarTipo).subscribe({
      next: (res: any) => {
        this.dataEstandarTipo = res || [];
        this.dataEstandarTipoFilter = res || [];
        this.loadingEstandarTipo = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.viewportTipo?.checkViewportSize();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorEstandarTipo = 'Error al cargar los estándares por tipo';
        this.loadingEstandarTipo = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarEdicionEstandarTipo(row: any): void {
    if (!this.estandarTipoForm) this.reactiveForm();
    this.estandarTipoForm.reset();
    this.estandarTipoForm.patchValue({
      id: row.id ?? '',
      tipo: row.tipo ?? '',
      indicador: row.indicador ?? '',
      tipo_centro: row.tipo_centro ?? '',
      anio: row.anio ?? '',
      mes: row.mes ?? '',
      periodo: row.periodo ?? this.periodoEstandarTipo,
      estandar: row.estandar ?? '',
      acept: row.acept ?? '',
      aceptmenos: row.aceptmenos ?? ''
    });
    this.errorEstandarTipoForm = '';
    this.mostrarFormularioEstandarTipo = true;
    this.cdr.detectChanges();
  }

  cancelarEdicionEstandarTipo(): void {
    this.mostrarFormularioEstandarTipo = false;
    this.errorEstandarTipoForm = '';
    this.savingEstandarTipo = false;
    this.cdr.detectChanges();
  }

  updateQueryEstandarTipo(): void {
    if (this.estandarTipoForm.invalid) {
      this.estandarTipoForm.markAllAsTouched();
      this.errorEstandarTipoForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandarTipo = true;
    this.errorEstandarTipoForm = '';

    this.tmiIndicadoresService.putQueryEstandarTipo(this.estandarTipoForm.value).subscribe({
      next: () => {
        this.savingEstandarTipo = false;
        this.mostrarFormularioEstandarTipo = false;
        this.getQueryEstandarTipo();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandarTipo = false;
        this.errorEstandarTipoForm = typeof error === 'string' ? error : (error?.error?.detail || 'Error al actualizar estándar tipo');
        this.cdr.detectChanges();
      }
    });
  }

  filterDataEstandarTipo(column: keyof typeof this.filtersEstandarTipo, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandarTipo[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandarTipo = this.dataEstandarTipoFilter.filter(row =>
      check(row.id, this.filtersEstandarTipo.id) &&
      check(row.tipo, this.filtersEstandarTipo.tipo) &&
      check(row.indicador, this.filtersEstandarTipo.indicador) &&
      check(row.tipo_centro, this.filtersEstandarTipo.tipo_centro) &&
      check(row.anio, this.filtersEstandarTipo.anio) &&
      check(row.mes, this.filtersEstandarTipo.mes) &&
      check(row.periodo, this.filtersEstandarTipo.periodo) &&
      check(row.estandar, this.filtersEstandarTipo.estandar) &&
      check(row.acept, this.filtersEstandarTipo.acept) &&
      check(row.aceptmenos, this.filtersEstandarTipo.aceptmenos)
    );
  }

  // tmi_estandar_nivel
  getQueryEstandarNivel() {
    this.loadingEstandarNivel = true;
    this.errorEstandarNivel = '';

    this.tmiIndicadoresService.getQueryEstandarNivel(this.periodoEstandarNivel).subscribe({
      next: (res: any) => {
        this.dataEstandarNivel = res || [];
        this.dataEstandarNivelFilter = res || [];
        this.loadingEstandarNivel = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.viewportNivel?.checkViewportSize();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorEstandarNivel = 'Error al cargar los estándares por nivel';
        this.loadingEstandarNivel = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarEdicionEstandarNivel(row: any): void {
    if (!this.estandarNivelForm) this.reactiveForm();
    this.estandarNivelForm.reset();
    this.estandarNivelForm.patchValue({
      id: row.id ?? '',
      tipo: row.tipo ?? '',
      indicador: row.indicador ?? '',
      nivel_centro: row.nivel_centro ?? '',
      anio: row.anio ?? '',
      mes: row.mes ?? '',
      periodo: row.periodo ?? this.periodoEstandarNivel,
      estandar: row.estandar ?? '',
      acept: row.acept ?? '',
      aceptmenos: row.aceptmenos ?? ''
    });
    this.errorEstandarNivelForm = '';
    this.mostrarFormularioEstandarNivel = true;
    this.cdr.detectChanges();
  }

  cancelarEdicionEstandarNivel(): void {
    this.mostrarFormularioEstandarNivel = false;
    this.errorEstandarNivelForm = '';
    this.savingEstandarNivel = false;
    this.cdr.detectChanges();
  }

  updateQueryEstandarNivel(): void {
    if (this.estandarNivelForm.invalid) {
      this.estandarNivelForm.markAllAsTouched();
      this.errorEstandarNivelForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandarNivel = true;
    this.errorEstandarNivelForm = '';

    this.tmiIndicadoresService.putQueryEstandarNivel(this.estandarNivelForm.value).subscribe({
      next: () => {
        this.savingEstandarNivel = false;
        this.mostrarFormularioEstandarNivel = false;
        this.getQueryEstandarNivel();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandarNivel = false;
        this.errorEstandarNivelForm = typeof error === 'string' ? error : (error?.error?.detail || 'Error al actualizar estándar nivel');
        this.cdr.detectChanges();
      }
    });
  }

  filterDataEstandarNivel(column: keyof typeof this.filtersEstandarNivel, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandarNivel[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandarNivel = this.dataEstandarNivelFilter.filter(row =>
      check(row.id, this.filtersEstandarNivel.id) &&
      check(row.tipo, this.filtersEstandarNivel.tipo) &&
      check(row.indicador, this.filtersEstandarNivel.indicador) &&
      check(row.nivel_centro, this.filtersEstandarNivel.nivel_centro) &&
      check(row.anio, this.filtersEstandarNivel.anio) &&
      check(row.mes, this.filtersEstandarNivel.mes) &&
      check(row.periodo, this.filtersEstandarNivel.periodo) &&
      check(row.estandar, this.filtersEstandarNivel.estandar) &&
      check(row.acept, this.filtersEstandarNivel.acept) &&
      check(row.aceptmenos, this.filtersEstandarNivel.aceptmenos)
    );
  }

  // tmi_estandar_categoria
  getQueryEstandarCategoria() {
    this.loadingEstandarCategoria = true;
    this.errorEstandarCategoria = '';

    this.tmiIndicadoresService.getQueryEstandarCategoria(this.periodoEstandarCategoria).subscribe({
      next: (res: any) => {
        this.dataEstandarCategoria = res || [];
        this.dataEstandarCategoriaFilter = res || [];
        this.loadingEstandarCategoria = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.viewportCategoria?.checkViewportSize();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorEstandarCategoria = 'Error al cargar los estándares por categoría';
        this.loadingEstandarCategoria = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarEdicionEstandarCategoria(row: any): void {
    if (!this.estandarCategoriaForm) this.reactiveForm();
    this.estandarCategoriaForm.reset();
    this.estandarCategoriaForm.patchValue({
      id: row.id ?? '',
      tipo: row.tipo ?? '',
      indicador: row.indicador ?? '',
      categoria_centro: row.categoria_centro ?? '',
      anio: row.anio ?? '',
      mes: row.mes ?? '',
      periodo: row.periodo ?? this.periodoEstandarCategoria,
      estandar: row.estandar ?? '',
      acept: row.acept ?? '',
      aceptmenos: row.aceptmenos ?? ''
    });
    this.errorEstandarCategoriaForm = '';
    this.mostrarFormularioEstandarCategoria = true;
    this.cdr.detectChanges();
  }

  cancelarEdicionEstandarCategoria(): void {
    this.mostrarFormularioEstandarCategoria = false;
    this.errorEstandarCategoriaForm = '';
    this.savingEstandarCategoria = false;
    this.cdr.detectChanges();
  }

  updateQueryEstandarCategoria(): void {
    if (this.estandarCategoriaForm.invalid) {
      this.estandarCategoriaForm.markAllAsTouched();
      this.errorEstandarCategoriaForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandarCategoria = true;
    this.errorEstandarCategoriaForm = '';

    this.tmiIndicadoresService.putQueryEstandarCategoria(this.estandarCategoriaForm.value).subscribe({
      next: () => {
        this.savingEstandarCategoria = false;
        this.mostrarFormularioEstandarCategoria = false;
        this.getQueryEstandarCategoria();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandarCategoria = false;
        this.errorEstandarCategoriaForm = typeof error === 'string' ? error : (error?.error?.detail || 'Error al actualizar estándar categoría');
        this.cdr.detectChanges();
      }
    });
  }

  filterDataEstandarCategoria(column: keyof typeof this.filtersEstandarCategoria, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandarCategoria[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandarCategoria = this.dataEstandarCategoriaFilter.filter(row =>
      check(row.id, this.filtersEstandarCategoria.id) &&
      check(row.tipo, this.filtersEstandarCategoria.tipo) &&
      check(row.indicador, this.filtersEstandarCategoria.indicador) &&
      check(row.categoria_centro, this.filtersEstandarCategoria.categoria_centro) &&
      check(row.anio, this.filtersEstandarCategoria.anio) &&
      check(row.mes, this.filtersEstandarCategoria.mes) &&
      check(row.periodo, this.filtersEstandarCategoria.periodo) &&
      check(row.estandar, this.filtersEstandarCategoria.estandar) &&
      check(row.acept, this.filtersEstandarCategoria.acept) &&
      check(row.aceptmenos, this.filtersEstandarCategoria.aceptmenos)
    );
  }

  // tmi_centro
  getQueryCentrosTMI() {
    this.loadingCentrosTMI = true;
    this.errorCentrosTMI = '';

    this.tmiIndicadoresService.getQueryCentrosTMI(this.periodoCentrosTMI).subscribe({
      next: (res: any) => {
        this.dataCentrosTMI = res || [];
        this.dataCentrosTMIFilter = res || [];
        this.loadingCentrosTMI = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.viewportCentros?.checkViewportSize();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error: any) => {
        console.error(error);
        this.errorCentrosTMI = 'Error al cargar los centros TMI';
        this.loadingCentrosTMI = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarEdicionCentro(row: any): void {
    if (!this.centrosForm) this.reactiveForm();
    this.centrosForm.reset();
    this.centrosForm.patchValue({
      id: row.id ?? '',
      red: row.red ?? '',
      codred: row.codred ?? '',
      orden: row.orden ?? '',
      orden_tipo: row.orden_tipo ?? '',
      codcentro: row.codcentro ?? '',
      categoria: row.categoria ?? '',
      tipo: row.tipo ?? '',
      nivel: row.nivel ?? '',
      centro: row.centro ?? '',
      estado: row.estado ?? '',
      anio: row.anio ?? '',
      mes: row.mes ?? '',
      periodo: row.periodo ?? this.periodoCentrosTMI
    });
    this.errorCentroForm = '';
    this.mostrarFormularioCentrosTMI = true;
    this.cdr.detectChanges();
  }

  cancelarEdicionCentro(): void {
    this.mostrarFormularioCentrosTMI = false;
    this.errorCentroForm = '';
    this.savingCentrosTMI = false;
    this.cdr.detectChanges();
  }

  updateQueryCentrosTMI(): void {
    if (this.centrosForm.invalid) {
      this.centrosForm.markAllAsTouched();
      this.errorCentroForm = 'Por favor, complete todos los campos obligatorios del formulario.';
      return;
    }
    this.savingCentrosTMI = true;
    this.errorCentroForm = '';

    this.tmiIndicadoresService.putQueryCentrosTMI(this.centrosForm.value).subscribe({
      next: () => {
        this.savingCentrosTMI = false;
        this.mostrarFormularioCentrosTMI = false;
        this.getQueryCentrosTMI();
      },
      error: (error: any) => {
        console.error(error);
        this.savingCentrosTMI = false;
        this.errorCentroForm = typeof error === 'string' ? error : (error?.error?.detail || 'Error al actualizar centro TMI');
        this.cdr.detectChanges();
      }
    });
  }

  filterDataCentrosTMI(column: keyof typeof this.filtersCentrosTMI, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersCentrosTMI[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataCentrosTMI = this.dataCentrosTMIFilter.filter(row =>
      check(row.id, this.filtersCentrosTMI.id) &&
      check(row.red, this.filtersCentrosTMI.red) &&
      check(row.codred, this.filtersCentrosTMI.codred) &&
      check(row.orden, this.filtersCentrosTMI.orden) &&
      check(row.orden_tipo, this.filtersCentrosTMI.orden_tipo) &&
      check(row.codcentro, this.filtersCentrosTMI.codcentro) &&
      check(row.categoria, this.filtersCentrosTMI.categoria) &&
      check(row.tipo, this.filtersCentrosTMI.tipo) &&
      check(row.nivel, this.filtersCentrosTMI.nivel) &&
      check(row.centro, this.filtersCentrosTMI.centro) &&
      check(row.estado, this.filtersCentrosTMI.estado) &&
      check(row.anio, this.filtersCentrosTMI.anio) &&
      check(row.mes, this.filtersCentrosTMI.mes) &&
      check(row.periodo, this.filtersCentrosTMI.periodo)
    );
  }

  // tabs
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}
