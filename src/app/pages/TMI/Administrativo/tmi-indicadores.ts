import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { Observable } from 'rxjs';
import { TmiVariables } from './tmi-variables/tmi-variables';
import { TmiConfigIndicadores } from './tmi-config-indicadores/tmi-config-indicadores';
import { TmiCentroEstandarTab } from './tmi-centro-estandar/tmi-centro-estandar';
import { TmiCalculo } from './tmi-calculo/tmi-calculo';
import { TmiCierreComponent } from './tmi-cierre/tmi-cierre';

import { TmiAceptacion } from './tmi-aceptacion/tmi-aceptacion';
import { TmiEstandares } from './tmi-estandares/tmi-estandares';
import { TmiEstandarService } from '../../../services/tmi/tmi-estandar-service';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';
import { TmiCentroService } from '../../../services/tmi';

/** Exclusión (fila de tmi_exclusion_centro_indicador) con sus meses listos para pintar. */
interface FilaExclusion {
  row: any;
  todos: boolean;
  meses: boolean[];
  rango: string;
}

/** Exclusiones de un centro: el centro se muestra una vez y debajo sus indicadores. */
interface GrupoExclusion {
  clave: string;
  id_centro: number | null;
  codcentro: string;
  centro: string;
  filas: FilaExclusion[];
}

/** Fila de la lista virtual de Exclusiones: la cabecera del centro o una de sus exclusiones (si está abierto). */
interface FilaListaExclusion {
  g: GrupoExclusion;
  f?: FilaExclusion;
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export type TabType = 'Estandares' | 'Centros TMI' | 'Exclusion Centro Estandar' | 'Fecha Cierre'
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
    RouterLink,
    TmiVariables,
    TmiConfigIndicadores,
    TmiCentroEstandarTab,
    TmiCalculo,
    TmiCierreComponent,

    TmiAceptacion,
    TmiEstandares
  ],
  templateUrl: './tmi-indicadores.html',
  styleUrls: ['./tmi-indicadores.css', './lista-virtual.css'],
})
export class TmiIndicadores implements OnInit {
  @ViewChild('viewportCentros') viewportCentros?: CdkVirtualScrollViewport;

  currentDate: string = '';

  eliminandoId: number | null = null;
  errorEliminarFila: string = '';

  // Tabs, agrupadas en el orden del trabajo: fórmulas, estándares, centros y cierre
  activeTab: TabType = 'Estandares';
  readonly gruposTabs: { titulo: string; tabs: { id: TabType; texto: string }[] }[] = [
    { titulo: 'Fórmulas', tabs: [
      { id: 'Variables', texto: 'Variables' },
      { id: 'Indicadores', texto: 'Indicadores' },
    ] },
    { titulo: 'Estándares', tabs: [
      { id: 'Estandares', texto: 'Por indicador' },
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

  // Vista agrupada: un bloque por centro con sus indicadores excluidos
  public gruposExclusion: GrupoExclusion[] = [];
  public busquedaExclusion: string = '';
  public centrosExclusionAbiertos = new Set<string>();

  /** Lista virtual de Exclusiones: todas las filas miden lo mismo, así solo se dibujan las que se ven. */
  readonly altoFilaLista = 56;
  readonly esqueletoLista = [1, 2, 3, 4, 5, 6];
  public filasExclusion: FilaListaExclusion[] = [];
  public altoListaExclusion = 0;
  trackFilaExclusion = (_: number, r: FilaListaExclusion) => `${r.g.clave}-${r.f?.row?.id ?? ''}`;

  /** Rearma la lista plana (centros y, si están abiertos, sus exclusiones). */
  private armarFilasExclusion(): void {
    const out: FilaListaExclusion[] = [];
    for (const g of this.gruposExclusion) {
      out.push({ g });
      if (this.centrosExclusionAbiertos.has(g.clave)) for (const f of g.filas) out.push({ g, f });
    }
    this.filasExclusion = out;
    this.altoListaExclusion = Math.max(this.altoFilaLista, Math.min(out.length * this.altoFilaLista, 640));
  }

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

    this.anioCentrosTMI = anioDefecto;
    this.mesCentrosTMI = mesDefecto;
    this.periodoCentrosTMI = `${anioDefecto}${mesDefecto}`;

    this.anioExclusion = anioDefecto;
    this.mesExclusion = mesDefecto;
    this.periodoExclusion = `${anioDefecto}${mesDefecto}`;

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
      id_estandar: [null, []],
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

  /// tmi_centro
  getQueryCentrosTMI() {
    this.loadingCentrosTMI = true;
    this.errorCentrosTMI = '';

    this.centroSrv.getQueryCentrosTMI().subscribe({
      next: (res: any) => {
        this.listaCentros = res || [];
        // el formulario de exclusión se abrió antes de tener los centros: su red se completa ahora
        if (this.mostrarFormularioExclusion && !this.redExclusion) {
          this.redExclusion = this.redDeCentro(this.exclusionForm?.get('id_centro')?.value);
        }
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
        this.dataExclusionFilter = res || [];
        this.agruparExclusion();
        this.loadingExclusion = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error(error);
        this.errorExclusion = 'Error al cargar las exclusiones de centros y estándares';
        this.loadingExclusion = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** idCentro: alta desde el bloque de un centro (el centro queda elegido). */
  iniciarAltaExclusion(idCentro: number | null = null): void {
    if (!this.listaEstandares.length) this.getQueryEstandar();
    if (!this.listaCentros.length) this.getQueryCentrosTMI();
    if (!this.exclusionForm) this.reactiveForm();
    this.exclusionForm.reset({
      id: null,
      id_centro: idCentro != null ? Number(idCentro) : null,
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
    this.indicadoresExclusion = new Set<number>();
    this.todosIndicadoresExclusion = false;
    this.filtroIndicadorExclusion = '';
    this.redExclusion = this.redDeCentro(idCentro);
    this.errorExclusionForm = '';
    this.mostrarFormularioExclusion = true;
    this.cdr.markForCheck();
  }

  // Red del formulario de exclusión: filtra el select de centros ('' = todas las redes)
  public redExclusion: string = '';

  get redesExclusion(): string[] {
    return [...new Set(this.listaCentros.map(c => String(c.red ?? '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  get centrosExclusionPorRed(): any[] {
    return this.redExclusion
      ? this.listaCentros.filter(c => String(c.red ?? '').trim() === this.redExclusion)
      : this.listaCentros;
  }

  private redDeCentro(idCentro: any): string {
    if (idCentro == null) return '';
    const centro = this.listaCentros.find(c => Number(c.id) === Number(idCentro));
    return centro ? String(centro.red ?? '').trim() : '';
  }

  /** Al cambiar la red, el centro elegido se limpia si no pertenece a ella. */
  cambiarRedExclusion(red: string): void {
    this.redExclusion = red;
    const control = this.exclusionForm.get('id_centro');
    if (red && control?.value != null && this.redDeCentro(control.value) !== red) control.setValue(null);
  }

  /** Al elegir un centro con "Todas las redes", la red se ajusta a la del centro. */
  cambiarCentroExclusion(): void {
    if (!this.redExclusion) this.redExclusion = this.redDeCentro(this.exclusionForm.get('id_centro')?.value);
  }

  // Alta de exclusión: indicadores marcados (un registro por indicador)
  public indicadoresExclusion = new Set<number>();
  public todosIndicadoresExclusion: boolean = false;
  public filtroIndicadorExclusion: string = '';

  get indicadoresExclusionVisibles(): any[] {
    const filtro = this.filtroIndicadorExclusion.trim().toLowerCase();
    if (!filtro) return this.listaEstandares;
    return this.listaEstandares.filter(e => `${e.tipo ?? ''} ${e.indicador ?? ''}`.toLowerCase().includes(filtro));
  }

  /** Alta de un centro que ya tiene exclusión en el año (mismo centro, año e indicador): nombres de esos indicadores.
   *  Solo se puede saber para el año que está en pantalla (son las exclusiones cargadas). */
  get exclusionesExistentes(): string[] {
    const v = this.exclusionForm?.getRawValue();
    if (!v || v.id || v.id_centro == null || Number(v.anio) !== Number(this.anioExclusion)) return [];
    const delCentro = this.dataExclusionFilter.filter(r => Number(r.id_centro) === Number(v.id_centro));
    if (this.todosIndicadoresExclusion) {
      return delCentro.some(r => r.id_indicador == null && r.id_estandar == null) ? ['Todos los indicadores'] : [];
    }
    return delCentro
      .filter(r => this.indicadoresExclusion.has(Number(r.id_indicador ?? this.resolverIdEstandar(r))))
      .map(r => String(r.indicador ?? 'Indicador ' + (r.id_indicador ?? r.id_estandar)));
  }

  toggleIndicadorExclusion(id: number): void {
    if (this.indicadoresExclusion.has(id)) this.indicadoresExclusion.delete(id);
    else this.indicadoresExclusion.add(id);
  }

  marcarIndicadoresExclusion(marcar: boolean): void {
    for (const est of this.indicadoresExclusionVisibles) {
      if (marcar) this.indicadoresExclusion.add(Number(est.id));
      else this.indicadoresExclusion.delete(Number(est.id));
    }
  }

  // Meses del formulario de exclusión (controles excl_01..excl_12)
  public readonly mesesExclusion = [
    { key: 'excl_01', corto: 'Ene', nombre: 'Enero' }, { key: 'excl_02', corto: 'Feb', nombre: 'Febrero' },
    { key: 'excl_03', corto: 'Mar', nombre: 'Marzo' }, { key: 'excl_04', corto: 'Abr', nombre: 'Abril' },
    { key: 'excl_05', corto: 'May', nombre: 'Mayo' }, { key: 'excl_06', corto: 'Jun', nombre: 'Junio' },
    { key: 'excl_07', corto: 'Jul', nombre: 'Julio' }, { key: 'excl_08', corto: 'Ago', nombre: 'Agosto' },
    { key: 'excl_09', corto: 'Sep', nombre: 'Septiembre' }, { key: 'excl_10', corto: 'Oct', nombre: 'Octubre' },
    { key: 'excl_11', corto: 'Nov', nombre: 'Noviembre' }, { key: 'excl_12', corto: 'Dic', nombre: 'Diciembre' },
  ];

  get mesesExcluidosCount(): number {
    return this.mesesExclusion.filter(m => this.exclusionForm?.get(m.key)?.value).length;
  }

  toggleMesExclusion(key: string): void {
    const control = this.exclusionForm.get(key);
    control?.setValue(!control.value);
  }

  marcarMesesExclusion(marcar: boolean): void {
    this.exclusionForm.patchValue(Object.fromEntries(this.mesesExclusion.map(m => [m.key, marcar])));
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
    this.redExclusion = this.redDeCentro(row.id_centro);
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
    const valor = this.exclusionForm.getRawValue();
    const esAlta = !valor.id;
    // alta: los indicadores marcados (vacío con "Todos" marcado = un registro para todos los indicadores)
    const ids = esAlta && !this.todosIndicadoresExclusion ? Array.from(this.indicadoresExclusion) : [];
    if (esAlta && !this.todosIndicadoresExclusion && !ids.length) {
      this.errorExclusionForm = 'Marque al menos un indicador o "Todos los indicadores del centro".';
      return;
    }
    if (!this.mesesExcluidosCount) {
      this.errorExclusionForm = 'Marque al menos un mes excluido.';
      return;
    }
    this.savingExclusion = true;
    this.errorExclusionForm = '';

    const idEstandar = esAlta ? null : (valor.id_estandar != null ? Number(valor.id_estandar) : null);
    const dto = {
      id: valor.id ? Number(valor.id) : null,
      id_centro: Number(valor.id_centro),
      id_estandar: idEstandar,
      id_indicador: idEstandar,
      ids_indicador: ids.length ? ids : null,
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

  buscarExclusion(valor: string): void {
    this.busquedaExclusion = valor;
    this.agruparExclusion();
  }

  /** Agrupa las exclusiones por centro. La búsqueda (código, centro, tipo o indicador) filtra los indicadores; si
   *  coincide con el centro, se muestran todos sus indicadores. Con búsqueda los bloques se abren. */
  private agruparExclusion(): void {
    const texto = this.busquedaExclusion.trim().toLowerCase();
    const contiene = (...vals: any[]) => vals.some(v => String(v ?? '').toLowerCase().includes(texto));
    const grupos = new Map<string, GrupoExclusion>();

    for (const row of this.dataExclusionFilter) {
      const clave = String(row.codcentro ?? row.id_centro ?? '—');
      let grupo = grupos.get(clave);
      if (!grupo) {
        grupo = { clave, id_centro: row.id_centro ?? null, codcentro: String(row.codcentro ?? '—'), centro: row.centro ?? 'Centro sin nombre', filas: [] };
        grupos.set(clave, grupo);
      }
      const meses = Array.from({ length: 12 }, (_, i) => Boolean(row[`excl_${String(i + 1).padStart(2, '0')}`]));
      grupo.filas.push({ row, todos: row.id_indicador == null && row.id_estandar == null, meses, rango: this.rangoMeses(meses) });
    }

    const resultado: GrupoExclusion[] = [];
    for (const grupo of grupos.values()) {
      if (texto && !contiene(grupo.codcentro, grupo.centro)) {
        grupo.filas = grupo.filas.filter(f => contiene(f.row.tipo, f.row.indicador));
        if (!grupo.filas.length) continue;
      }
      grupo.filas.sort((a, b) => Number(b.todos) - Number(a.todos)
        || String(a.row.tipo ?? '').localeCompare(String(b.row.tipo ?? ''))
        || String(a.row.indicador ?? '').localeCompare(String(b.row.indicador ?? '')));
      resultado.push(grupo);
    }
    resultado.sort((a, b) => a.codcentro.localeCompare(b.codcentro, undefined, { numeric: true }));

    // Sin búsqueda: abiertos si son pocos centros; con búsqueda: todos abiertos
    if (texto || resultado.length <= 8) this.centrosExclusionAbiertos = new Set(resultado.map(g => g.clave));
    this.gruposExclusion = resultado;
    this.dataExclusion = resultado.flatMap(g => g.filas.map(f => f.row));
    this.armarFilasExclusion();
  }

  /** Meses excluidos como texto corto: "Todo el año", "Abr – Jun", "Ene, Mar – May". */
  private rangoMeses(meses: boolean[]): string {
    const n = meses.filter(Boolean).length;
    if (n === 12) return 'Todo el año';
    if (!n) return 'Sin meses';
    const tramos: string[] = [];
    for (let i = 0; i < 12; i++) {
      if (!meses[i]) continue;
      let j = i;
      while (j + 1 < 12 && meses[j + 1]) j++;
      tramos.push(i === j ? MESES_CORTOS[i] : `${MESES_CORTOS[i]} – ${MESES_CORTOS[j]}`);
      i = j;
    }
    return tramos.join(', ');
  }

  get mesesCortosExclusion(): string[] {
    return MESES_CORTOS;
  }

  toggleCentroExclusion(clave: string): void {
    if (this.centrosExclusionAbiertos.has(clave)) this.centrosExclusionAbiertos.delete(clave);
    else this.centrosExclusionAbiertos.add(clave);
    this.armarFilasExclusion();
  }

  abrirTodosCentrosExclusion(abrir: boolean): void {
    this.centrosExclusionAbiertos = abrir ? new Set(this.gruposExclusion.map(g => g.clave)) : new Set<string>();
    this.armarFilasExclusion();
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

  // tabs
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
    this.errorEliminarFila = '';
    // los estándares y exclusiones se cargan solos la primera vez que se abre la pestaña
    if (tab === 'Exclusion Centro Estandar' && this.selectPeriodoExclusion) this.onBuscarExclusion();
    if (tab === 'Centros TMI') this.getQueryCentrosTMI();
    this.cdr.markForCheck();
  }
}
