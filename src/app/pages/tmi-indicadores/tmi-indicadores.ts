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
import { forkJoin, Observable } from 'rxjs';

export type TabType = 'Estandares' | 'Estandares Tipo' | 'Estandares Nivel' | 'Estandares Categoria' | 'Centros TMI' | 'Fecha Cierre';

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
  @ViewChild('viewportEstandar') viewportEstandar?: CdkVirtualScrollViewport;
  @ViewChild('viewportTipo') viewportTipo?: CdkVirtualScrollViewport;
  @ViewChild('viewportNivel') viewportNivel?: CdkVirtualScrollViewport;
  @ViewChild('viewportCategoria') viewportCategoria?: CdkVirtualScrollViewport;
  @ViewChild('viewportCentros') viewportCentros?: CdkVirtualScrollViewport;

  currentDate: string = '';

  periodoMinimoEditable: string = '';
  eliminandoId: number | null = null;
  errorEliminarFila: string = '';

  // Tabs
  activeTab: TabType = 'Estandares';

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
    if (!this.anioCentrosTMI) {
      this.errorCentrosTMI = 'Por favor seleccione un año válido.';
      return;
    }
    this.selectPeriodoCentrosTMI = false;
    this.periodoCentrosTMI = `${this.anioCentrosTMI}${this.mesCentrosTMI}`;
    this.getQueryCentrosTMI();
  }


  // catalogo tmi_estandar (tab Estándares + select en formularios)
  public listaEstandares: any[] = [];
  public dataEstandar: any[] = [];
  public dataEstandarFilter: any[] = [];
  public loadingEstandar: boolean = false;
  public errorEstandar: string = '';
  public mostrarFormularioEstandar: boolean = false;
  public savingEstandar: boolean = false;
  public errorEstandarForm: string = '';
  public estandarForm!: FormGroup;

  filtersEstandar = {
    id: "",
    tipo: "",
    indicador: "",
    fecha_creacion: "",
    fecha_modificacion: ""
  };

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
    estandar_01: "",
    estandar_02: "",
    estandar_03: "",
    estandar_04: "",
    estandar_05: "",
    estandar_06: "",
    estandar_07: "",
    estandar_08: "",
    estandar_09: "",
    estandar_10: "",
    estandar_11: "",
    estandar_12: "",
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
    estandar_01: "",
    estandar_02: "",
    estandar_03: "",
    estandar_04: "",
    estandar_05: "",
    estandar_06: "",
    estandar_07: "",
    estandar_08: "",
    estandar_09: "",
    estandar_10: "",
    estandar_11: "",
    estandar_12: "",
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
    estandar_01: "",
    estandar_02: "",
    estandar_03: "",
    estandar_04: "",
    estandar_05: "",
    estandar_06: "",
    estandar_07: "",
    estandar_08: "",
    estandar_09: "",
    estandar_10: "",
    estandar_11: "",
    estandar_12: "",
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
    orden: "",
    orden_tipo: "",
    codcentro: "",
    centro: "",
    categoria: "",
    nivel: "",
    tipo: "",
    anio: "",
    flag_01: "",
    flag_02: "",
    flag_03: "",
    flag_04: "",
    flag_05: "",
    flag_06: "",
    flag_07: "",
    flag_08: "",
    flag_09: "",
    flag_10: "",
    flag_11: "",
    flag_12: ""
  };

  constructor(
    private tmiIndicadoresService: TmiIndicadoresService,
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

    // Excel TMI: último periodo cerrado
    this.anioExcelTMI = anioDefecto;
    this.mesExcelTMI = mesDefecto;
    this.periodoMinimoEditable = `${anioDefecto}${mesDefecto}`;

    this.reactiveForm();
    this.getQueryEstandar();
  }

  // tmi_estandar
  getQueryEstandar(): void {
    this.loadingEstandar = true;
    this.errorEstandar = '';
    this.tmiIndicadoresService.getQueryEstandar().subscribe({
      next: (res: any[]) => {
        this.listaEstandares = res || [];
        this.dataEstandar = res || [];
        this.dataEstandarFilter = res || [];
        this.loadingEstandar = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.viewportEstandar?.checkViewportSize();
          this.cdr.markForCheck();
        }, 0);
      },
      error: (err: any) => {
        console.error('Error al cargar catálogo de estándares', err);
        this.errorEstandar = 'Error al cargar el catálogo de estándares';
        this.loadingEstandar = false;
        this.cdr.markForCheck();
      }
    });
  }

  iniciarAltaEstandar(): void {
    if (!this.estandarForm) this.reactiveForm();
    this.estandarForm.reset({
      id: null,
      tipo: '',
      indicador: ''
    });
    this.errorEstandarForm = '';
    this.mostrarFormularioEstandar = true;
    this.cdr.markForCheck();
  }

  iniciarEdicionEstandar(row: any): void {
    if (!this.estandarForm) this.reactiveForm();
    this.estandarForm.reset({
      id: row.id ?? null,
      tipo: row.tipo ?? '',
      indicador: row.indicador ?? ''
    });
    this.errorEstandarForm = '';
    this.mostrarFormularioEstandar = true;
    this.cdr.markForCheck();
  }

  cancelarEdicionEstandar(): void {
    this.mostrarFormularioEstandar = false;
    this.errorEstandarForm = '';
    this.savingEstandar = false;
    this.cdr.markForCheck();
  }

  updateQueryEstandar(): void {
    if (this.estandarForm.invalid) {
      this.estandarForm.markAllAsTouched();
      this.errorEstandarForm = 'Por favor, complete todos los campos obligatorios.';
      return;
    }
    this.savingEstandar = true;
    this.errorEstandarForm = '';

    const valor = this.estandarForm.getRawValue();
    const dto = {
      id: valor.id ? Number(valor.id) : null,
      tipo: String(valor.tipo ?? '').trim(),
      indicador: String(valor.indicador ?? '').trim()
    };

    const peticion = dto.id ? this.tmiIndicadoresService.putQueryEstandar(dto) : this.tmiIndicadoresService.postQueryEstandar(dto);
    peticion.subscribe({
      next: () => {
        this.savingEstandar = false;
        this.mostrarFormularioEstandar = false;
        this.getQueryEstandar();
      },
      error: (error: any) => {
        console.error(error);
        this.savingEstandar = false;
        this.errorEstandarForm = typeof error === 'string' ? error : (error?.error?.detail || (dto.id ? 'Error al actualizar ' : 'Error al agregar ') + 'estándar');
        this.cdr.markForCheck();
      }
    });
  }

  eliminarEstandar(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar el estándar ID ${row.id} (${row.tipo} - ${row.indicador})? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.tmiIndicadoresService.deleteQueryEstandar(row.id), () => this.getQueryEstandar());
  }

  filterDataEstandar(column: keyof typeof this.filtersEstandar, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandar[column] = filterValue;
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);
    this.dataEstandar = this.dataEstandarFilter.filter(row =>
      check(row.id, this.filtersEstandar.id) &&
      check(row.tipo, this.filtersEstandar.tipo) &&
      check(row.indicador, this.filtersEstandar.indicador) &&
      check(row.fecha_creacion, this.filtersEstandar.fecha_creacion) &&
      check(row.fecha_modificacion, this.filtersEstandar.fecha_modificacion)
    );
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
    // Form 0: tmi_estandar
    this.estandarForm = this.formBuilder.group({
      id: [null, []],
      tipo: ['', [Validators.required]],
      indicador: ['', [Validators.required]]
    });

    // Form 1: tmi_estandar_tipo
    this.estandarTipoForm = this.formBuilder.group({
      id: [null, []],
      id_estandar: [null, [Validators.required]],
      tipo_centro: ['', [Validators.required]],
      anio: [null, [Validators.required]],
      estandar_01: [0, [Validators.required]],
      estandar_02: [0, [Validators.required]],
      estandar_03: [0, [Validators.required]],
      estandar_04: [0, [Validators.required]],
      estandar_05: [0, [Validators.required]],
      estandar_06: [0, [Validators.required]],
      estandar_07: [0, [Validators.required]],
      estandar_08: [0, [Validators.required]],
      estandar_09: [0, [Validators.required]],
      estandar_10: [0, [Validators.required]],
      estandar_11: [0, [Validators.required]],
      estandar_12: [0, [Validators.required]]
    });

    // Form 2: tmi_estandar_nivel
    this.estandarNivelForm = this.formBuilder.group({
      id: [null, []],
      id_estandar: [null, [Validators.required]],
      nivel_centro: ['', [Validators.required]],
      anio: [null, [Validators.required]],
      estandar_01: [0, [Validators.required]],
      estandar_02: [0, [Validators.required]],
      estandar_03: [0, [Validators.required]],
      estandar_04: [0, [Validators.required]],
      estandar_05: [0, [Validators.required]],
      estandar_06: [0, [Validators.required]],
      estandar_07: [0, [Validators.required]],
      estandar_08: [0, [Validators.required]],
      estandar_09: [0, [Validators.required]],
      estandar_10: [0, [Validators.required]],
      estandar_11: [0, [Validators.required]],
      estandar_12: [0, [Validators.required]]
    });

    // Form 3: tmi_estandar_categoria
    this.estandarCategoriaForm = this.formBuilder.group({
      id: [null, []],
      id_estandar: [null, [Validators.required]],
      categoria_centro: ['', [Validators.required]],
      anio: [null, [Validators.required]],
      estandar_01: [0, [Validators.required]],
      estandar_02: [0, [Validators.required]],
      estandar_03: [0, [Validators.required]],
      estandar_04: [0, [Validators.required]],
      estandar_05: [0, [Validators.required]],
      estandar_06: [0, [Validators.required]],
      estandar_07: [0, [Validators.required]],
      estandar_08: [0, [Validators.required]],
      estandar_09: [0, [Validators.required]],
      estandar_10: [0, [Validators.required]],
      estandar_11: [0, [Validators.required]],
      estandar_12: [0, [Validators.required]]
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
      anio: [null, [Validators.required]],
      flag_01: [true, []],
      flag_02: [true, []],
      flag_03: [true, []],
      flag_04: [true, []],
      flag_05: [true, []],
      flag_06: [true, []],
      flag_07: [true, []],
      flag_08: [true, []],
      flag_09: [true, []],
      flag_10: [true, []],
      flag_11: [true, []],
      flag_12: [true, []]
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
      estandar_01: Number(valor.estandar_01 ?? 0),
      estandar_02: Number(valor.estandar_02 ?? 0),
      estandar_03: Number(valor.estandar_03 ?? 0),
      estandar_04: Number(valor.estandar_04 ?? 0),
      estandar_05: Number(valor.estandar_05 ?? 0),
      estandar_06: Number(valor.estandar_06 ?? 0),
      estandar_07: Number(valor.estandar_07 ?? 0),
      estandar_08: Number(valor.estandar_08 ?? 0),
      estandar_09: Number(valor.estandar_09 ?? 0),
      estandar_10: Number(valor.estandar_10 ?? 0),
      estandar_11: Number(valor.estandar_11 ?? 0),
      estandar_12: Number(valor.estandar_12 ?? 0)
    };
  }

  // tmi_estandar_tipo
  getQueryEstandarTipo() {
    this.loadingEstandarTipo = true;
    this.errorEstandarTipo = '';

    this.tmiIndicadoresService.getQueryEstandarTipo(this.anioEstandarTipo).subscribe({
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
      estandar_01: 0,
      estandar_02: 0,
      estandar_03: 0,
      estandar_04: 0,
      estandar_05: 0,
      estandar_06: 0,
      estandar_07: 0,
      estandar_08: 0,
      estandar_09: 0,
      estandar_10: 0,
      estandar_11: 0,
      estandar_12: 0
    });
    this.errorEstandarTipoForm = '';
    this.mostrarFormularioEstandarTipo = true;
    this.cdr.markForCheck();
  }

  eliminarEstandarTipo(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.tipo} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.tmiIndicadoresService.deleteQueryEstandarTipo(row.id), () => this.getQueryEstandarTipo());
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
      estandar_01: row.estandar_01 ?? 0,
      estandar_02: row.estandar_02 ?? 0,
      estandar_03: row.estandar_03 ?? 0,
      estandar_04: row.estandar_04 ?? 0,
      estandar_05: row.estandar_05 ?? 0,
      estandar_06: row.estandar_06 ?? 0,
      estandar_07: row.estandar_07 ?? 0,
      estandar_08: row.estandar_08 ?? 0,
      estandar_09: row.estandar_09 ?? 0,
      estandar_10: row.estandar_10 ?? 0,
      estandar_11: row.estandar_11 ?? 0,
      estandar_12: row.estandar_12 ?? 0
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
    const peticion = dto.id ? this.tmiIndicadoresService.putQueryEstandarTipo(dto) : this.tmiIndicadoresService.postQueryEstandarTipo(dto);
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
      check(row.estandar_01, this.filtersEstandarTipo.estandar_01) &&
      check(row.estandar_02, this.filtersEstandarTipo.estandar_02) &&
      check(row.estandar_03, this.filtersEstandarTipo.estandar_03) &&
      check(row.estandar_04, this.filtersEstandarTipo.estandar_04) &&
      check(row.estandar_05, this.filtersEstandarTipo.estandar_05) &&
      check(row.estandar_06, this.filtersEstandarTipo.estandar_06) &&
      check(row.estandar_07, this.filtersEstandarTipo.estandar_07) &&
      check(row.estandar_08, this.filtersEstandarTipo.estandar_08) &&
      check(row.estandar_09, this.filtersEstandarTipo.estandar_09) &&
      check(row.estandar_10, this.filtersEstandarTipo.estandar_10) &&
      check(row.estandar_11, this.filtersEstandarTipo.estandar_11) &&
      check(row.estandar_12, this.filtersEstandarTipo.estandar_12)
    );
  }

  // tmi_estandar_nivel
  getQueryEstandarNivel() {
    this.loadingEstandarNivel = true;
    this.errorEstandarNivel = '';

    this.tmiIndicadoresService.getQueryEstandarNivel(this.anioEstandarNivel).subscribe({
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
      estandar_01: 0,
      estandar_02: 0,
      estandar_03: 0,
      estandar_04: 0,
      estandar_05: 0,
      estandar_06: 0,
      estandar_07: 0,
      estandar_08: 0,
      estandar_09: 0,
      estandar_10: 0,
      estandar_11: 0,
      estandar_12: 0
    });
    this.errorEstandarNivelForm = '';
    this.mostrarFormularioEstandarNivel = true;
    this.cdr.markForCheck();
  }

  eliminarEstandarNivel(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.tipo} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.tmiIndicadoresService.deleteQueryEstandarNivel(row.id), () => this.getQueryEstandarNivel());
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
      estandar_01: row.estandar_01 ?? 0,
      estandar_02: row.estandar_02 ?? 0,
      estandar_03: row.estandar_03 ?? 0,
      estandar_04: row.estandar_04 ?? 0,
      estandar_05: row.estandar_05 ?? 0,
      estandar_06: row.estandar_06 ?? 0,
      estandar_07: row.estandar_07 ?? 0,
      estandar_08: row.estandar_08 ?? 0,
      estandar_09: row.estandar_09 ?? 0,
      estandar_10: row.estandar_10 ?? 0,
      estandar_11: row.estandar_11 ?? 0,
      estandar_12: row.estandar_12 ?? 0
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
    const peticion = dto.id ? this.tmiIndicadoresService.putQueryEstandarNivel(dto) : this.tmiIndicadoresService.postQueryEstandarNivel(dto);
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
      check(row.estandar_01, this.filtersEstandarNivel.estandar_01) &&
      check(row.estandar_02, this.filtersEstandarNivel.estandar_02) &&
      check(row.estandar_03, this.filtersEstandarNivel.estandar_03) &&
      check(row.estandar_04, this.filtersEstandarNivel.estandar_04) &&
      check(row.estandar_05, this.filtersEstandarNivel.estandar_05) &&
      check(row.estandar_06, this.filtersEstandarNivel.estandar_06) &&
      check(row.estandar_07, this.filtersEstandarNivel.estandar_07) &&
      check(row.estandar_08, this.filtersEstandarNivel.estandar_08) &&
      check(row.estandar_09, this.filtersEstandarNivel.estandar_09) &&
      check(row.estandar_10, this.filtersEstandarNivel.estandar_10) &&
      check(row.estandar_11, this.filtersEstandarNivel.estandar_11) &&
      check(row.estandar_12, this.filtersEstandarNivel.estandar_12)
    );
  }

  // tmi_estandar_categoria
  getQueryEstandarCategoria() {
    this.loadingEstandarCategoria = true;
    this.errorEstandarCategoria = '';

    this.tmiIndicadoresService.getQueryEstandarCategoria(this.anioEstandarCategoria).subscribe({
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
      estandar_01: 0,
      estandar_02: 0,
      estandar_03: 0,
      estandar_04: 0,
      estandar_05: 0,
      estandar_06: 0,
      estandar_07: 0,
      estandar_08: 0,
      estandar_09: 0,
      estandar_10: 0,
      estandar_11: 0,
      estandar_12: 0
    });
    this.errorEstandarCategoriaForm = '';
    this.mostrarFormularioEstandarCategoria = true;
    this.cdr.markForCheck();
  }

  eliminarEstandarCategoria(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.tipo} - ${row.indicador}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.tmiIndicadoresService.deleteQueryEstandarCategoria(row.id), () => this.getQueryEstandarCategoria());
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
      estandar_01: row.estandar_01 ?? 0,
      estandar_02: row.estandar_02 ?? 0,
      estandar_03: row.estandar_03 ?? 0,
      estandar_04: row.estandar_04 ?? 0,
      estandar_05: row.estandar_05 ?? 0,
      estandar_06: row.estandar_06 ?? 0,
      estandar_07: row.estandar_07 ?? 0,
      estandar_08: row.estandar_08 ?? 0,
      estandar_09: row.estandar_09 ?? 0,
      estandar_10: row.estandar_10 ?? 0,
      estandar_11: row.estandar_11 ?? 0,
      estandar_12: row.estandar_12 ?? 0
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
    const peticion = dto.id ? this.tmiIndicadoresService.putQueryEstandarCategoria(dto) : this.tmiIndicadoresService.postQueryEstandarCategoria(dto);
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
      check(row.estandar_01, this.filtersEstandarCategoria.estandar_01) &&
      check(row.estandar_02, this.filtersEstandarCategoria.estandar_02) &&
      check(row.estandar_03, this.filtersEstandarCategoria.estandar_03) &&
      check(row.estandar_04, this.filtersEstandarCategoria.estandar_04) &&
      check(row.estandar_05, this.filtersEstandarCategoria.estandar_05) &&
      check(row.estandar_06, this.filtersEstandarCategoria.estandar_06) &&
      check(row.estandar_07, this.filtersEstandarCategoria.estandar_07) &&
      check(row.estandar_08, this.filtersEstandarCategoria.estandar_08) &&
      check(row.estandar_09, this.filtersEstandarCategoria.estandar_09) &&
      check(row.estandar_10, this.filtersEstandarCategoria.estandar_10) &&
      check(row.estandar_11, this.filtersEstandarCategoria.estandar_11) &&
      check(row.estandar_12, this.filtersEstandarCategoria.estandar_12)
    );
  }

  /// tmi_centro
  getQueryCentrosTMI() {
    this.loadingCentrosTMI = true;
    this.errorCentrosTMI = '';

    this.tmiIndicadoresService.getQueryCentrosTMI(this.anioCentrosTMI).subscribe({
      next: (res: any) => {
        this.dataCentrosTMI = res || [];
        this.dataCentrosTMIFilter = res || [];
        this.loadingCentrosTMI = false;
        this.cdr.markForCheck();
        this.getQuerysTmiConsultas();
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

  // nueva fila en el año consultado
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
      anio: Number(this.anioCentrosTMI),
      flag_01: true,
      flag_02: true,
      flag_03: true,
      flag_04: true,
      flag_05: true,
      flag_06: true,
      flag_07: true,
      flag_08: true,
      flag_09: true,
      flag_10: true,
      flag_11: true,
      flag_12: true
    });
    this.errorCentroForm = '';
    this.mostrarFormularioCentrosTMI = true;
    this.cdr.markForCheck();
  }

  eliminarCentro(row: any): void {
    if (this.eliminandoId !== null) return;
    if (!confirm(`¿Eliminar la fila ID ${row.id} (${row.codcentro} - ${row.centro}) del año ${row.anio}? Esta acción no se puede deshacer.`)) return;
    this.eliminarFila(row, this.tmiIndicadoresService.deleteQueryCentrosTMI(row.id), () => this.getQueryCentrosTMI());
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
      anio: row.anio ?? Number(this.anioCentrosTMI),
      flag_01: Boolean(row.flag_01),
      flag_02: Boolean(row.flag_02),
      flag_03: Boolean(row.flag_03),
      flag_04: Boolean(row.flag_04),
      flag_05: Boolean(row.flag_05),
      flag_06: Boolean(row.flag_06),
      flag_07: Boolean(row.flag_07),
      flag_08: Boolean(row.flag_08),
      flag_09: Boolean(row.flag_09),
      flag_10: Boolean(row.flag_10),
      flag_11: Boolean(row.flag_11),
      flag_12: Boolean(row.flag_12)
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
      anio: Number(valor.anio),
      flag_01: Boolean(valor.flag_01),
      flag_02: Boolean(valor.flag_02),
      flag_03: Boolean(valor.flag_03),
      flag_04: Boolean(valor.flag_04),
      flag_05: Boolean(valor.flag_05),
      flag_06: Boolean(valor.flag_06),
      flag_07: Boolean(valor.flag_07),
      flag_08: Boolean(valor.flag_08),
      flag_09: Boolean(valor.flag_09),
      flag_10: Boolean(valor.flag_10),
      flag_11: Boolean(valor.flag_11),
      flag_12: Boolean(valor.flag_12)
    };
    const peticion = dto.id ? this.tmiIndicadoresService.putQueryCentrosTMI(dto) : this.tmiIndicadoresService.postQueryCentrosTMI(dto);
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
      check(row.anio, this.filtersCentrosTMI.anio) &&
      checkFlag(row.flag_01, this.filtersCentrosTMI.flag_01) &&
      checkFlag(row.flag_02, this.filtersCentrosTMI.flag_02) &&
      checkFlag(row.flag_03, this.filtersCentrosTMI.flag_03) &&
      checkFlag(row.flag_04, this.filtersCentrosTMI.flag_04) &&
      checkFlag(row.flag_05, this.filtersCentrosTMI.flag_05) &&
      checkFlag(row.flag_06, this.filtersCentrosTMI.flag_06) &&
      checkFlag(row.flag_07, this.filtersCentrosTMI.flag_07) &&
      checkFlag(row.flag_08, this.filtersCentrosTMI.flag_08) &&
      checkFlag(row.flag_09, this.filtersCentrosTMI.flag_09) &&
      checkFlag(row.flag_10, this.filtersCentrosTMI.flag_10) &&
      checkFlag(row.flag_11, this.filtersCentrosTMI.flag_11) &&
      checkFlag(row.flag_12, this.filtersCentrosTMI.flag_12)
    );
  }

  ///  consultas
  dataCeConcent: any[] = [];
   dataCeGCHProg: any[] = [];
  dataCeRecetas: any[] = [];
  dataCeRHrMedico: any[] = [];
  dataEmPrioI_II: any[] = [];
  dataEmPrioIV_V: any[] = [];
  dataHEstancias: any[] = [];
  dataHISust: any[] = [];
  dataHOcamas: any[] = [];
  dataHRcama: any[] = [];
  dataHTBMHosp: any[] = [];
  dataOConcent: any[] = [];
  dataOGCHodon: any[] = [];
  dataOHrOdont: any[] = [];
  dataONTOdontS: any[] = [];
  dataQxGCHProg: any[] = [];
  dataQxHTCesareas: any[] = [];
  dataQxIAlta: any[] = [];
  dataQxIMenor: any[] = [];
  dataQxIntSusp: any[] = [];
  dataQRendSO: any[] = [];

  getQuerysTmiConsultas() : void {

     forkJoin({
      CeConcent: this.tmiIndicadoresService.getQueryCeConcent(this.periodoCentrosTMI),
      CeGCHProg: this.tmiIndicadoresService.getQueryCeGCHProg(this.periodoCentrosTMI),
      CeRecetas: this.tmiIndicadoresService.getQueryCeRecetas(this.periodoCentrosTMI),
      CeRHrMedico: this.tmiIndicadoresService.getQueryCeRHrMedico(this.periodoCentrosTMI),
      EmPrioI_II: this.tmiIndicadoresService.getQueryEmPrioI_II(this.periodoCentrosTMI),
      EmPrioIV_V: this.tmiIndicadoresService.getQueryEmPrioIV_V(this.periodoCentrosTMI),
      HEstancias: this.tmiIndicadoresService.getQueryHEstancias(this.periodoCentrosTMI),
      HISust: this.tmiIndicadoresService.getQueryHISust(this.periodoCentrosTMI),
      HOcamas: this.tmiIndicadoresService.getQueryHOCamas(this.periodoCentrosTMI),
      HRcama: this.tmiIndicadoresService.getQueryHRCama(this.periodoCentrosTMI),
      HTBMHosp: this.tmiIndicadoresService.getQueryHTBHosp(this.periodoCentrosTMI),
      OConcent: this.tmiIndicadoresService.getQueryOConcent(this.periodoCentrosTMI),
      OGCHodon: this.tmiIndicadoresService.getQueryOGCHodon(this.periodoCentrosTMI),
      OHrOdont: this.tmiIndicadoresService.getQueryOHrOdont(this.periodoCentrosTMI),
      ONTOdontS: this.tmiIndicadoresService.getQueryONTOdontS(this.periodoCentrosTMI),
      QxGCHProg: this.tmiIndicadoresService.getQueryQxGCHProg(this.periodoCentrosTMI),
      QxHTCesareas: this.tmiIndicadoresService.getQueryQxHTCesareas(this.periodoCentrosTMI),
      QxIAlta: this.tmiIndicadoresService.getQueryQxIAlta(this.periodoCentrosTMI),
      QxIMenor: this.tmiIndicadoresService.getQueryQxIMenor(this.periodoCentrosTMI),
      QxIntSusp: this.tmiIndicadoresService.getQueryQxIntSusp(this.periodoCentrosTMI),
      QRendSO: this.tmiIndicadoresService.getQueryQRendSO(this.periodoCentrosTMI)
     }).subscribe({
       next: (data) => {
        console.log('Datos de consultas TMI:', data);
          this.dataCeConcent = data.CeConcent || [];
          this.dataCeGCHProg = data.CeGCHProg || [];
          this.dataCeRecetas = data.CeRecetas || [];
          this.dataCeRHrMedico = data.CeRHrMedico || [];
          this.dataEmPrioI_II = data.EmPrioI_II || [];
          this.dataEmPrioIV_V = data.EmPrioIV_V || [];
          this.dataHEstancias = data.HEstancias || [];
          this.dataHISust = data.HISust || [];
          this.dataHOcamas = data.HOcamas || [];
          this.dataHRcama = data.HRcama || [];
          this.dataHTBMHosp = data.HTBMHosp || [];
          this.dataOConcent = data.OConcent || [];
          this.dataOGCHodon = data.OGCHodon || [];
          this.dataOHrOdont = data.OHrOdont || [];
          this.dataONTOdontS = data.ONTOdontS || [];
          this.dataQxGCHProg = data.QxGCHProg || [];
          this.dataQxHTCesareas = data.QxHTCesareas || [];
          this.dataQxIAlta = data.QxIAlta || [];
          this.dataQxIMenor = data.QxIMenor || [];
          this.dataQxIntSusp = data.QxIntSusp || [];
          this.dataQRendSO = data.QRendSO || [];


       }









     })


  }


  public descargandoExcelTMI: boolean = false;
  public errorExcelTMI: string = '';
  anioExcelTMI: string = '';
  mesExcelTMI: string = '';

  descargarExcelTMI(): void {
    if (!this.anioExcelTMI || !this.mesExcelTMI) {
      this.errorExcelTMI = 'Por favor seleccione un año y periodo válidos.';
      return;
    }
    const periodo = `${this.anioExcelTMI}${this.mesExcelTMI}`;
    this.descargandoExcelTMI = true;
    this.errorExcelTMI = '';
    this.cdr.markForCheck();

    this.tmiIndicadoresService.getExcelTMI(periodo).subscribe({
      next: (response: any) => {
        const blob = response.body;
        if (blob) {
          const fileBlob = new Blob([blob], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(fileBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `TMI_Prelim_${periodo}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
        this.descargandoExcelTMI = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error al descargar el Excel TMI', error);
        this.errorExcelTMI = 'Error al generar/descargar el Excel del TMI.';
        this.descargandoExcelTMI = false;
        this.cdr.markForCheck();
      },
    });
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


  // cierre
  public dataCierre: any[] = [];
  public loadingCierre: boolean = false;
  public errorCierre: string = '';
  public cierreSeleccionado: any = null;
  public fechaCierreEdit: string = '';
  public savingCierre: boolean = false;
  public errorCierreForm: string = '';
  public readonly hoyISO: string = this.toISODate(new Date());

  private readonly estadosCierre: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    EJECUTADO: 'Ejecutado',
    ERROR: 'Error'
  };

  getQueryCierres(): void {
    this.loadingCierre = true;
    this.errorCierre = '';
    this.tmiIndicadoresService.getQueryCierres().subscribe({
      next: (res: any) => {
        this.dataCierre = res || [];
        this.loadingCierre = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error(error);
        this.errorCierre = 'Error al cargar las fechas de cierre';
        this.loadingCierre = false;
        this.cdr.markForCheck();
      }
    });
  }

  iniciarEdicionCierre(row: any): void {
    this.cierreSeleccionado = row;
    this.fechaCierreEdit = String(row.fecha_cierre ?? '').substring(0, 10);
    this.errorCierreForm = '';
    this.cdr.markForCheck();
  }

  cancelarEdicionCierre(): void {
    this.cierreSeleccionado = null;
    this.errorCierreForm = '';
    this.savingCierre = false;
    this.cdr.markForCheck();
  }

  updateQueryFechaCierre(): void {
    if (!this.fechaCierreEdit) {
      this.errorCierreForm = 'Seleccione una fecha de cierre.';
      return;
    }
    // el cierre se ejecuta cuando llega la fecha de cierre (o en la siguiente revisión si ya pasó)
    if (this.fechaCierreEdit < this.hoyISO) {
      this.errorCierreForm = 'La fecha de cierre no puede ser anterior a hoy.';
      return;
    }
    this.savingCierre = true;
    this.errorCierreForm = '';
    this.tmiIndicadoresService.putQueryFechaCierre(this.cierreSeleccionado.periodo, this.fechaCierreEdit).subscribe({
      next: () => {
        this.savingCierre = false;
        this.cierreSeleccionado = null;
        this.getQueryCierres();
      },
      error: (error: any) => {
        console.error(error);
        this.savingCierre = false;
        this.errorCierreForm = error?.error?.detail || 'Error al actualizar la fecha de cierre';
        this.cdr.markForCheck();
      }
    });
  }

  esCierreEditable(row: any): boolean {
    return row.estado === 'PENDIENTE' || row.estado === 'ERROR';
  }

  esCierreHoy(row: any): boolean {
    return String(row.fecha_cierre ?? '').substring(0, 10) === this.hoyISO;
  }

  etiquetaEstadoCierre(estado: string): string {
    return this.estadosCierre[estado] ?? estado;
  }

  get cierresConError(): number {
    return this.dataCierre.filter(row => row.estado === 'ERROR').length;
  }

  get cierresAtrasados(): number {
    return this.dataCierre.filter(row => this.esCierreAtrasado(row)).length;
  }

  // pendiente cuya fecha de cierre ya pasó
  esCierreAtrasado(row: any): boolean {
    const fecha = String(row.fecha_cierre ?? '').substring(0, 10);
    return row.estado === 'PENDIENTE' && !!fecha && fecha < this.hoyISO;
  }

  // un cierre en ERROR solo se reintenta automáticamente el mismo día en que falló
  errorSeReintentaHoy(row: any): boolean {
    return row.estado === 'ERROR' && String(row.fecha_ejecucion ?? '').substring(0, 10) === this.hoyISO;
  }

  // 202608 -> Agosto 2026
  nombrePeriodo(periodo: string): string {
    const p = String(periodo ?? '').trim();
    const mes = this.mesesDisponibles.find(m => m.value === p.substring(4, 6));
    return mes ? `${mes.label} ${p.substring(0, 4)}` : p;
  }

  // 2026-09-10 -> 10/09/2026 (sin conversión de zona horaria)
  formatoFecha(valor: string): string {
    if (!valor) return '—';
    const [fecha, hora] = String(valor).split('T');
    const [a, m, d] = fecha.split('-');
    return hora ? `${d}/${m}/${a} ${hora.substring(0, 5)}` : `${d}/${m}/${a}`;
  }

  private toISODate(fecha: Date): string {
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${m}-${d}`;
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
    if (tab === 'Estandares') this.getQueryEstandar();
    if (tab === 'Fecha Cierre') this.getQueryCierres();
    this.cdr.markForCheck();
  }
}
