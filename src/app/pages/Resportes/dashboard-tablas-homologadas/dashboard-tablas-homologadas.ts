import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TablasHomologadasService } from '../../../services/tablas-homologadas-service';
import { ChangeDetectorRef } from '@angular/core';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';
import { ClasificacionCamas } from '../../../model/clasificacion-camas';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-tablas-homologadas',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
    FormsModule,
  ],
  templateUrl: './dashboard-tablas-homologadas.html',
  styleUrl: './dashboard-tablas-homologadas.css',
})
export class DashboardTablasHomologadas implements OnInit {

  currentDate: string = '';


  centroAtencion: string = '';
  codcas: string = '';

  ///estados de emergencia
  loadingEM: boolean = true;
  errorEM: string = '';

  ///estados de consulta externa
  loadingCE: boolean = true;
  errorCE: string = '';

  ///estados de camas
  loadingCAM: boolean = true;
  errorCAM: string = '';

  dataEmergencia: any[] = [];
  dataEmergenciaFilter: any[] = [];
  dataConsultaExterna: any[] = [];
  dataConsultaExternaFilter: any[] = [];

  dataCamas: any[] = [];
  dataCamasFilter: any[] = [];
  dataCamasCSV: any[] = [];

  valoresClasificacion: Record<string, string> = {};


  dataServicio: any[] = [];

  filtersEmergencia = {
    cod_centro: '',
    cenasides: '',
    cod_topico: '',
    topemedes: '',
    cod_emergencia: '',
    desc_emergencia: '',
    cod_estandar: '',
    des_estandar: '',
  }

  filtersConsultaExterna = {
    desc_gpo_ocup: '',
    cod_area: '',
    desc_area: '',
    cod_actividad: '',
    desc_actividad: '',
    cod_subactividad: '',
    desc_subactividad: '',
    cod_servicio: '',
    desc_servicio: '',
    cod_especialidad: '',
    especialidad: '',
    cod_subespecialidad: '',
    subespecialidad: '',
    cod_agrupador: '',
    agrupador: '',
    cod_variable: '',
    variable: '',
    anio: '',
    anio_uso: '',
  }

  filtersCamas = {
    "oricenasicod": "",
    "cenasicod": "",
    "arehoscod": "",
    "servhoscod": "",
    "estenfcod": "",
    "habcod": "",
    "camcod": "",
    "tipcamcod": "",
    "estcamcod": "",
    "camobsdes": "",
    "camestregcod": "",
    "camflgfun": "",
    "cametiqcod": "",
    "arehosdes": "",
    "cenasides": "",
    "servhosdes": "",
    "descripcion_clasificacion": ""
  }
  constructor(
    private dataImport: LocalStorageService,
    private tablasHomologadasService: TablasHomologadasService,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService,
  ) { }

  ngOnInit(): void {
    this.centroAtencion = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
    this.loadFechaActualizacion();
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


  loadDataEmergencia(): void {
    this.loadingEM = true;
    this.errorEM = '';

    this.tablasHomologadasService.getQueryTHE(this.codcas).subscribe({
      next: (response) => {
        this.dataEmergencia = response;
        this.dataEmergenciaFilter = response;
        this.loadingEM = false;

      },
      error: (error) => {
        console.error('Error al cargar datos de emergencia:', error);
        this.loadingEM = false;
        this.errorEM = error;
      },
    });

    this.cdr.detectChanges();
  }

  loadDataConsultaExterna(): void {

    this.loadingCE = true;
    this.errorCE = '';

    this.tablasHomologadasService.getQueryTHCE().subscribe({
      next: (response) => {
        this.dataConsultaExterna = response;
        this.dataConsultaExternaFilter = response;
        this.loadingCE = false;
      },
      error: (error) => {
        console.error('Error al cargar datos de consulta externa:', error);
        this.loadingCE = false;
        this.errorCE = error;
      },
    });
    this.cdr.detectChanges();
  }

  loadDataCamas(): void {

    this.loadingCAM = true;
    this.errorCAM = '';

    this.tablasHomologadasService.getQueryTHCAMA(this.codcas).subscribe({
      next: (response) => {
        this.dataCamas = response.map((row: any) => {
          const desc = row.descripcion_clasificacion || 'no seleccionado';
          return {
            ...row,
            descripcion_clasificacion: desc,
            original_descripcion: desc
          };
        });
        this.dataCamasFilter = [...this.dataCamas];
        this.dataCamasCSV = [...this.dataCamas];
        this.loadingCAM = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos de camas:', error);
        this.loadingCAM = false;
        this.errorCAM = error;
        this.cdr.detectChanges();
      },
    });

  }

  guardarClasificacion(): void {
    const { register, update } = this.buildClasificaciones();

    if (register.length === 0 && update.length === 0) {
      console.log('No hay cambios para guardar');
      return;
    }

    const solicitudes = [
      ...register.map((clasi) => this.tablasHomologadasService.registerClasificacionCamas(clasi)),
      ...update.map((clasi) => this.tablasHomologadasService.updateClasificacionCamas(clasi))
    ];

    forkJoin(solicitudes).subscribe({
      next: (responses) => {
        this.loadDataCamas();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al registrar o actualizar datos de camas:', error);
        this.cdr.markForCheck();
      },
    });
  }

  private buildClasificaciones(): { register: ClasificacionCamas[], update: ClasificacionCamas[] } {
    const register: ClasificacionCamas[] = [];
    const update: ClasificacionCamas[] = [];

    this.dataCamasFilter.forEach((row) => {
      // Check if the value has changed
      if (row.descripcion_clasificacion === row.original_descripcion) {
        return;
      }

      const clasi: ClasificacionCamas = {
        id: row.id_clasificacion || 0,
        cenasicod: row.cenasicod,
        camcod: row.camcod,
        arehoscod: row.arehoscod,
        habcod: row.habcod,
        servhoscod: row.servhoscod,
        descripcion: row.descripcion_clasificacion
      };

      if (row.id_clasificacion) {
        update.push(clasi);
      } else {
        register.push(clasi);
      }
    });

    return { register, update };
  }


  filterDataEmergencia(column: keyof typeof this.filtersEmergencia, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEmergencia[column] = filterValue;

    const filtered = this.dataEmergenciaFilter.filter((row) => this.applyAllFiltersEmergencia(row));

    this.dataEmergencia = filtered;
    //this.calculateTotalAtencionesQ4();
  }

  private applyAllFiltersEmergencia(row: any): boolean {
    // Filtor Cod Centro
    if (
      this.filtersEmergencia.cod_centro &&
      !row.cod_centro.toLowerCase().includes(this.filtersEmergencia.cod_centro)
    ) {
      return false;
    }

    // Filtro cenasides
    if (
      this.filtersEmergencia.cenasides &&
      !row.cenasides.toLowerCase().includes(this.filtersEmergencia.cenasides)
    ) {
      return false;
    }

    // Filtro cod_topico
    if (this.filtersEmergencia.cod_topico && !row.cod_topico.toLowerCase().includes(this.filtersEmergencia.cod_topico)) {
      return false;
    }

    // Filtro topemedes
    if (
      this.filtersEmergencia.topemedes &&
      !row.topemedes.toLowerCase().includes(this.filtersEmergencia.topemedes)
    ) {
      return false;
    }

    //Filtro cod_emergencia
    if (
      this.filtersEmergencia.cod_emergencia &&
      !row.cod_emergencia.toLowerCase().includes(this.filtersEmergencia.cod_emergencia)
    ) {
      return false;
    }

    //Filtro desc_emergencia
    if (
      this.filtersEmergencia.desc_emergencia &&
      !row.desc_emergencia.toLowerCase().includes(this.filtersEmergencia.desc_emergencia)
    ) {
      return false;
    }

    //Filtro cod_estandar
    if (
      this.filtersEmergencia.cod_estandar &&
      !row.cod_estandar.toLowerCase().includes(this.filtersEmergencia.cod_estandar)
    ) {
      return false;
    }

    //Filtro des_estandar
    if (
      this.filtersEmergencia.des_estandar &&
      !row.des_estandar.toLowerCase().includes(this.filtersEmergencia.des_estandar)
    ) {
      return false;
    }

    return true;
  }


  filterDataConsultaExterna(column: keyof typeof this.filtersConsultaExterna, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersConsultaExterna[column] = filterValue;
    const filtered = this.dataConsultaExternaFilter.filter((row) => this.applyAllFiltersConsultaExterna(row));
    this.dataConsultaExterna = filtered;
  }

  private applyAllFiltersConsultaExterna(row: any): boolean {
    const keys = Object.keys(this.filtersConsultaExterna) as (keyof typeof this.filtersConsultaExterna)[];
    for (const key of keys) {
      const filterVal = this.filtersConsultaExterna[key];
      if (filterVal) {
        const rowVal = String(row[key] ?? '').toLowerCase();
        if (!rowVal.includes(filterVal)) {
          return false;
        }
      }
    }
    return true;
  }

  ///filtro dinamico para la tabla de camas para cada columna
  filterDataCamas(column: keyof typeof this.filtersCamas, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersCamas[column] = filterValue;
    const filtered = this.dataCamasFilter.filter((row) => this.applyAllFiltersCamas(row));
    this.dataCamas = filtered;
  }

  private applyAllFiltersCamas(row: any): boolean {
    // Filtro oricenasicod
    if (this.filtersCamas.oricenasicod && !row.oricenasicod.toLowerCase().includes(this.filtersCamas.oricenasicod)
    ) { return false; }
    // Filtro cenario
    if (this.filtersCamas.cenasicod && !row.cenasicod.toLowerCase().includes(this.filtersCamas.cenasicod)) {
      return false;
    }
    // Filtro area
    if (this.filtersCamas.arehoscod && !row.arehoscod.toLowerCase().includes(this.filtersCamas.arehoscod)) {
      return false;
    }
    // Filtro servicio
    if (this.filtersCamas.servhoscod && !row.servhoscod.toLowerCase().includes(this.filtersCamas.servhoscod)) {
      return false;
    }
    // Filtro estenfcod
    if (this.filtersCamas.estenfcod && !row.estenfcod.toLowerCase().includes(this.filtersCamas.estenfcod)) {
      return false;
    }
    // Filtro habcod
    if (this.filtersCamas.habcod && !row.habcod.toLowerCase().includes(this.filtersCamas.habcod)) {
      return false;
    }
    // Filtro camcod
    if (this.filtersCamas.camcod && !row.camcod.toLowerCase().includes(this.filtersCamas.camcod)) {
      return false;
    }
    // Filtro tipcamcod
    if (this.filtersCamas.tipcamcod && !row.tipcamcod.toLowerCase().includes(this.filtersCamas.tipcamcod)) {
      return false;
    }
    // Filtro estcamcod
    if (this.filtersCamas.estcamcod && !row.estcamcod.toLowerCase().includes(this.filtersCamas.estcamcod)) {
      return false;
    }
    // Filtro camobsdes
    if (this.filtersCamas.camobsdes && !row.camobsdes.toLowerCase().includes(this.filtersCamas.camobsdes)) {
      return false;
    }
    // Filtro camestregcod
    if (this.filtersCamas.camestregcod && !row.camestregcod.toLowerCase().includes(this.filtersCamas.camestregcod)) {
      return false;
    }
    // Filtro camflgfun
    if (this.filtersCamas.camflgfun && !row.camflgfun.toLowerCase().includes(this.filtersCamas.camflgfun)) {
      return false;
    }
    // Filtro cametiqcod
    if (this.filtersCamas.cametiqcod && !row.camtiqcod.toLowerCase().includes(this.filtersCamas.cametiqcod)) {
      return false;
    }
    // Filtro cenasides
    if (this.filtersCamas.cenasides && !row.cenasides.toLowerCase().includes(this.filtersCamas.cenasides)) {
      return false;
    }
    //Filtro arehosdes
    if (this.filtersCamas.arehosdes && !row.arehosdes.toLowerCase().includes(this.filtersCamas.arehosdes)) {
      return false;
    }
    // Filtro servhosdes
    if (this.filtersCamas.servhosdes && !row.servhosdes.toLowerCase().includes(this.filtersCamas.servhosdes)) {
      return false;
    }
    // Filtro descripcion_clasificacion
    if (this.filtersCamas.descripcion_clasificacion && !row.descripcion_clasificacion.toLowerCase().includes(this.filtersCamas.descripcion_clasificacion)) {
      return false;
    }

    return true;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Tablas homologadas - Emergencia'
    | 'Tablas homologadas - Consulta Externa'
    | 'Tablas homologadas - Camas' = 'Tablas homologadas - Emergencia';

  setActiveTab(
    tab:
      | 'Tablas homologadas - Emergencia'
      | 'Tablas homologadas - Consulta Externa'
      | 'Tablas homologadas - Camas',
  ): void {
    this.activeTab = tab;

    if (tab === 'Tablas homologadas - Camas') {
      this.loadDataCamas();
    } else if (tab === 'Tablas homologadas - Consulta Externa') {
      this.loadDataConsultaExterna();
    } else if (tab === 'Tablas homologadas - Emergencia') {
      this.loadDataEmergencia();
    }

    this.cdr.detectChanges();
  }

}
