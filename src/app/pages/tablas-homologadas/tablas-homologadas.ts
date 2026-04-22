import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage-service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TablasHomologadasService } from '../../services/tablas-homologadas-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-tablas-homologadas',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
  ],
  templateUrl: './tablas-homologadas.html',
  styleUrl: './tablas-homologadas.css',
})
export class TablasHomologadas implements OnInit {

  nameCentro: string = '';
  codcas: string = '';

  emergencia: boolean = false;
  consultaExterna: boolean = false;


  dataEmergencia: any[] = [];
  dataEmergenciaFilter: any[] = [];
  dataConsultaExterna: any[] = [];
  dataConsultaExternaFilter: any[] = [];

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

  constructor(
    private dataImport: LocalStorageService,
    private tablasHomologadasService: TablasHomologadasService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.nameCentro = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
  }

  loadDataEmergencia(): void {
    this.tablasHomologadasService.getQueryTHE(this.codcas).subscribe({
      next: (response) => {
        this.dataEmergencia = response;
        this.dataEmergenciaFilter = response;
        this.emergencia = true;
        this.consultaExterna = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos de emergencia:', error);
      },
    });

  }

  loadDataConsultaExterna(): void {
    this.tablasHomologadasService.getQueryTHCE().subscribe({
      next: (response) => {
        this.dataConsultaExterna = response;
        this.dataConsultaExternaFilter = response;
        this.emergencia = false;
        this.consultaExterna = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos de consulta externa:', error);
      },
    });
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
      row.cod_emergencia.toLowerCase().includes(this.filtersEmergencia.cod_emergencia)
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
    // Filtro desc_gpo_ocup
    if (
      this.filtersConsultaExterna.desc_gpo_ocup &&
      !row.desc_gpo_ocup.toLowerCase().includes(this.filtersConsultaExterna.desc_gpo_ocup)
    ) {
      return false;
    }
    // Filtro cod_area
    if (
      this.filtersConsultaExterna.cod_area &&
      !row.cod_area.toLowerCase().includes(this.filtersConsultaExterna.cod_area)
    ) {
      return false;
    }
    // Filtro desc_area
    if (
      this.filtersConsultaExterna.desc_area &&
      !row.desc_area.toLowerCase().includes(this.filtersConsultaExterna.desc_area)
    ) {
      return false;
    }
    // Filtro cod_actividad
    if (
      this.filtersConsultaExterna.cod_actividad &&
      !row.cod_actividad.toLowerCase().includes(this.filtersConsultaExterna.cod_actividad)
    ) {
      return false;
    }
    // Filtro desc_actividad
    if (
      this.filtersConsultaExterna.desc_actividad &&
      !row.desc_actividad.toLowerCase().includes(this.filtersConsultaExterna.desc_actividad)
    ) {
      return false;
    }
    // Filtro cod_subactividad
    if (
      this.filtersConsultaExterna.cod_subactividad &&
      !row.cod_subactividad.toLowerCase().includes(this.filtersConsultaExterna.cod_subactividad)
    ) {
      return false;
    }
    // Filtro desc_subactividad
    if (
      this.filtersConsultaExterna.desc_subactividad &&
      !row.desc_subactividad.toLowerCase().includes(this.filtersConsultaExterna.desc_subactividad)
    ) {
      return false;
    }
    // Filtro cod_servicio
    if (
      this.filtersConsultaExterna.cod_servicio &&
      !row.cod_servicio.toLowerCase().includes(this.filtersConsultaExterna.cod_servicio)
    ) {
      return false;
    }
    // Filtro desc_servicio
    if (
      this.filtersConsultaExterna.desc_servicio &&
      !row.desc_servicio.toLowerCase().includes(this.filtersConsultaExterna.desc_servicio)
    ) {
      return false;
    }
    // Filtro cod_especialidad
    if (
      this.filtersConsultaExterna.cod_especialidad &&
      !row.cod_especialidad.toLowerCase().includes(this.filtersConsultaExterna.cod_especialidad)
    ) {
      return false;
    }
    // Filtro especialidad
    if (
      this.filtersConsultaExterna.especialidad &&
      !row.especialidad.toLowerCase().includes(this.filtersConsultaExterna.especialidad)
    ) {
      return false;
    }
    // Filtro cod_subespecialidad
    if (
      this.filtersConsultaExterna.cod_subespecialidad &&
      !row.cod_subespecialidad.toLowerCase().includes(this.filtersConsultaExterna.cod_subespecialidad)
    ) {
      return false;
    }
    // Filtro subespecialidad
    if (
      this.filtersConsultaExterna.subespecialidad &&
      !row.subespecialidad.toLowerCase().includes(this.filtersConsultaExterna.subespecialidad)
    ) {
      return false;
    }
    // Filtro cod_agrupador
    if (
      this.filtersConsultaExterna.cod_agrupador &&
      !row.cod_agrupador.toLowerCase().includes(this.filtersConsultaExterna.cod_agrupador)
    ) {
      return false;
    }
    // Filtro agrupador
    if (
      this.filtersConsultaExterna.agrupador &&
      !row.agrupador.toLowerCase().includes(this.filtersConsultaExterna.agrupador)
    ) {
      return false;
    }
    // Filtro cod_variable
    if (
      this.filtersConsultaExterna.cod_variable &&
      !row.cod_variable.toLowerCase().includes(this.filtersConsultaExterna.cod_variable)
    ) {
      return false;
    }
    // Filtro variable
    if (
      this.filtersConsultaExterna.variable &&
      !row.variable.toLowerCase().includes(this.filtersConsultaExterna.variable)
    ) {
      return false;
    }
    // Filtro anio
    if (
      this.filtersConsultaExterna.anio &&
      !row.anio.toLowerCase().includes(this.filtersConsultaExterna.anio)
    ) {
      return false;
    }
    // Filtro anio_uso
    if (
      this.filtersConsultaExterna.anio_uso &&
      !row.anio_uso.toLowerCase().includes(this.filtersConsultaExterna.anio_uso)
    ) {
      return false;
    }
    return true;
  }

}
