import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TmiIndicadoresService } from '../../services/tmi-indicadores-service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FechaActualizacionService } from '../../services/fecha-actualizacion-service';

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
  currentDate: string = '';

  ///data estandares
  public dataEstandar: any[] = [];
  public dataEstandarFilter: any[] = [];

  periodoEstandar: string = "202608";

  ///estado estandares
  public loadingEstandar: boolean = false;
  public errorEstandar: string = '';
  public mostrarFormularioEstandar: boolean = false;
  public savingEstandar: boolean = false;
  public errorEstandarForm: string = '';


  ///data centros tmi
  public dataCentrosTMI: any[] = [];
  public dataCentrosTMIFilter: any[] = [];
  periodoCentrosTMI: string = "202608";

  ///estado centros tmi
  public loadingCentrosTMI: boolean = false;
  public errorCentrosTMI: string = '';
  public mostrarFormularioCentrosTMI: boolean = false;
  public savingCentrosTMI: boolean = false;
  public errorCentroForm: string = '';

  ///formularios
  public estandarForm!: FormGroup;
  public centrosForm!: FormGroup;

  constructor(
    private tmiIndicadoresService: TmiIndicadoresService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService
  ) { }

  ngOnInit(): void {
    this.reactiveForm();
    this.getQueryEstandares();
    this.getQueryCentrosTMI();
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
    this.estandarForm = this.formBuilder.group({
      id: ['', []],
      orden_indicador: ['', [Validators.required]],
      codigo_unico: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      indicador: ['', [Validators.required]],
      nivel_centro: ['', [Validators.required]],
      tipo_centro: ['', [Validators.required]],
      nivel_estandar_centro: ['', [Validators.required]],
      estandar: ['', [Validators.required]],
      acept: ['', [Validators.required]],
      aceptmenos: ['', [Validators.required]],
      periodo: ['', []]
    });

    this.centrosForm = this.formBuilder.group({
      id: ['', []],
      red: ['', [Validators.required]],
      orden: ['', [Validators.required]],
      orden_tipo: ['', [Validators.required]],
      codcentro: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      nivel: ['', [Validators.required]],
      nivel_estandar: ['', [Validators.required]],
      centro: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      periodo: ['', []]
    });
  }

  getQueryEstandares() {
    this.loadingEstandar = true;
    this.errorEstandar = '';

    this.tmiIndicadoresService.getQueryEstandares(this.periodoEstandar).subscribe(
      (res: any) => {
        this.dataEstandar = res;
        this.dataEstandarFilter = res;
        this.loadingEstandar = false;
      },
      (error: any) => {
        console.error(error);
        this.errorEstandar = error;
        this.loadingEstandar = false;
      }
    );
    this.cdr.detectChanges();
  }

  iniciarEdicionEstandar(row: any): void {
    if (!this.estandarForm) {
      this.reactiveForm();
    }
    this.estandarForm.reset();
    this.estandarForm.patchValue({
      id: row.id ?? '',
      orden_indicador: row.orden_indicador ?? '',
      codigo_unico: row.codigo_unico ?? '',
      tipo: row.tipo ?? '',
      indicador: row.indicador ?? '',
      nivel_centro: row.nivel_centro ?? '',
      tipo_centro: row.tipo_centro ?? '',
      nivel_estandar_centro: row.nivel_estandar_centro ?? '',
      estandar: row.estandar ?? '',
      acept: row.acept ?? '',
      aceptmenos: row.aceptmenos ?? '',
      periodo: row.periodo ?? this.periodoEstandar
    });
    this.errorEstandarForm = '';
    this.mostrarFormularioEstandar = true;
    this.cdr.detectChanges();
  }

  cancelarEdicionEstandar(): void {
    this.mostrarFormularioEstandar = false;
    this.errorEstandarForm = '';
    this.savingEstandar = false;
    this.cdr.detectChanges();
  }

  updateQueryEstandar(): void {
    if (this.estandarForm.invalid) {
      this.estandarForm.markAllAsTouched();
      this.errorEstandarForm = 'Por favor, complete todos los campos obligatorios del formulario.';
      return;
    }

    this.savingEstandar = true;
    this.errorEstandarForm = '';

    this.tmiIndicadoresService.putQueryEstandares(this.estandarForm.value).subscribe(
      (res: any) => {
        this.savingEstandar = false;
        this.mostrarFormularioEstandar = false;
        this.getQueryEstandares();
      },
      (error: any) => {
        console.error(error);
        this.savingEstandar = false;
        this.errorEstandarForm = typeof error === 'string' ? error : (error?.error?.message || 'Error al actualizar data de estándar');
      }
    );
    this.cdr.detectChanges();
  }

  getQueryCentrosTMI() {
    this.loadingCentrosTMI = true;
    this.errorCentrosTMI = '';

    this.tmiIndicadoresService.getQueryCentrosTMI(this.periodoCentrosTMI).subscribe(
      (res: any) => {
        this.dataCentrosTMI = res;
        this.dataCentrosTMIFilter = res;
        this.loadingCentrosTMI = false;
      },
      (error: any) => {
        console.error(error);
        this.errorCentrosTMI = error;
        this.loadingCentrosTMI = false;
      }
    );
  }

  iniciarEdicionCentro(row: any): void {
    if (!this.centrosForm) {
      this.reactiveForm();
    }
    this.centrosForm.reset();
    this.centrosForm.patchValue({
      id: row.id ?? '',
      red: row.red ?? '',
      orden: row.orden ?? '',
      orden_tipo: row.orden_tipo ?? '',
      codcentro: row.codcentro ?? '',
      tipo: row.tipo ?? '',
      nivel: row.nivel ?? '',
      nivel_estandar: row.nivel_estandar ?? '',
      centro: row.centro ?? '',
      estado: row.estado ?? '',
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

    this.tmiIndicadoresService.putQueryCentrosTMI(this.centrosForm.value).subscribe(
      (res: any) => {
        this.savingCentrosTMI = false;
        this.mostrarFormularioCentrosTMI = false;
        this.getQueryCentrosTMI();
      },
      (error: any) => {
        console.error(error);
        this.savingCentrosTMI = false;
        this.errorCentroForm = typeof error === 'string' ? error : (error?.error?.message || 'Error al actualizar data de centro');
      }
    );
    this.cdr.detectChanges();
  }

  ///filtros estandares
  filtersEstandares = {
    "id": "",
    "orden_indicador": "",
    "codigo_unico": "",
    "tipo": "",
    "indicador": "",
    "nivel_centro": "",
    "tipo_centro": "",
    "nivel_estandar_centro": "",
    "estandar": "",
    "acept": "",
    "aceptmenos": "",
    "periodo": ""
  };

  ///filtro dinamico para la tabla indicadores
  filterDataEstandares(column: keyof typeof this.filtersEstandares, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandares[column] = filterValue;
    const filtered = this.dataEstandarFilter.filter((row) => this.applyAllFiltersEstandares(row));
    this.dataEstandar = filtered;
  }

  private applyAllFiltersEstandares(row: any): boolean {
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);

    if (!check(row.id, this.filtersEstandares.id)) return false;
    if (!check(row.orden_indicador, this.filtersEstandares.orden_indicador)) return false;
    if (!check(row.codigo_unico, this.filtersEstandares.codigo_unico)) return false;
    if (!check(row.tipo, this.filtersEstandares.tipo)) return false;
    if (!check(row.indicador, this.filtersEstandares.indicador)) return false;
    if (!check(row.nivel_centro, this.filtersEstandares.nivel_centro)) return false;
    if (!check(row.tipo_centro, this.filtersEstandares.tipo_centro)) return false;
    if (!check(row.nivel_estandar_centro, this.filtersEstandares.nivel_estandar_centro)) return false;
    if (!check(row.estandar, this.filtersEstandares.estandar)) return false;
    if (!check(row.acept, this.filtersEstandares.acept)) return false;
    if (!check(row.aceptmenos, this.filtersEstandares.aceptmenos)) return false;
    if (!check(row.periodo, this.filtersEstandares.periodo)) return false;

    return true;
  }

  ///filtros centros tmi
  filtersCentrosTMI = {
    "id": "",
    "red": "",
    "orden": "",
    "orden_tipo": "",
    "codcentro": "",
    "tipo": "",
    "nivel": "",
    "nivel_estandar": "",
    "centro": "",
    "estado": "",
    "periodo": ""
  };

  ///filtro dinamico para la tabla centros tmi
  filterDataCentrosTMI(column: keyof typeof this.filtersCentrosTMI, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersCentrosTMI[column] = filterValue;
    const filtered = this.dataCentrosTMIFilter.filter((row) => this.applyAllFiltersCentrosTMI(row));
    this.dataCentrosTMI = filtered;
  }

  private applyAllFiltersCentrosTMI(row: any): boolean {
    const check = (val: any, filter: string) => !filter || String(val ?? '').toLowerCase().includes(filter);

    if (!check(row.id, this.filtersCentrosTMI.id)) return false;
    if (!check(row.red, this.filtersCentrosTMI.red)) return false;
    if (!check(row.orden, this.filtersCentrosTMI.orden)) return false;
    if (!check(row.orden_tipo, this.filtersCentrosTMI.orden_tipo)) return false;
    if (!check(row.codcentro, this.filtersCentrosTMI.codcentro)) return false;
    if (!check(row.tipo, this.filtersCentrosTMI.tipo)) return false;
    if (!check(row.nivel, this.filtersCentrosTMI.nivel)) return false;
    if (!check(row.nivel_estandar, this.filtersCentrosTMI.nivel_estandar)) return false;
    if (!check(row.centro, this.filtersCentrosTMI.centro)) return false;
    if (!check(row.estado, this.filtersCentrosTMI.estado)) return false;
    if (!check(row.periodo, this.filtersCentrosTMI.periodo)) return false;

    return true;
  }

  // Tabs
  activeTab: 'Estandares tmi' | 'Centros tmi' = 'Estandares tmi';

  setActiveTab(tab: 'Estandares tmi' | 'Centros tmi'): void {
    this.activeTab = tab;

    if (tab === 'Estandares tmi') {
      this.getQueryEstandares();
    } else if (tab === 'Centros tmi') {
      this.getQueryCentrosTMI();
    }

    this.cdr.detectChanges();
  }
}

