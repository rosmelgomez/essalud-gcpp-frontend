import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Resporteador } from '../../../model/resporteador';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { ReportDashboardReporteadorService } from '../../../services/reportes/report-dashboard-reporteador-service';

@Component({
  selector: 'app-report-dashboard-reporteador',
  imports: [CommonModule, FormsModule , MatPaginatorModule, MatTableModule],
  templateUrl: './report-dashboard-reporteador.html',
  styleUrl: './report-dashboard-reporteador.css',
})
export class ReportDashboardReporteador implements OnInit , AfterViewInit {
  currentDate: string = '';

  // Estados para el reporte
  loadingAM: boolean = false;
  errorAM: string | null = null;
  noDataAM: boolean = false;
  selectPeriodoAM: boolean = true;

  //filtros para el reporte
  periodo: string = '';
  anio: string = '';
  red_asistencial: string = '';
  centro_asistencial: string = '';
  servicio: string = '';
  actividad: string = '';
  subactividad: string = '';
  sexo: string = '';
  variable: string = '';
  capitulo_CIE: string = '';

  dataRed: any[] = [];
  dataCentro: any[] = [];
  dataCentroCompleto: any[] = [];
  dataServicio: any[] = [];
  dataActividad: any[] = [];
  dataSubactividad: any[] = [];
  dataSubactividadCompleto: any[] = [];
  dataCapitulo: any[] = [];
  dataVariable: any[] = [];

  filteredRed: any[] = [];
  filteredCentro: any[] = [];
  filteredActividad: any[] = [];
  filteredSubactividad: any[] = [];

  searchRed: string = '';
  isDropdownRedOpen: boolean = false;
  selectedRedName: string = '';

  searchCentro: string = '';
  isDropdownCentroOpen: boolean = false;
  selectedCentroName: string = '';
  isCentroEnabled: boolean = false;

  searchActividad: string = '';
  isDropdownActividadOpen: boolean = false;
  selectedActividadName: string = '';

  searchSubactividad: string = '';
  isDropdownSubactividadOpen: boolean = false;
  selectedSubactividadName: string = '';
  isSubactividadEnabled: boolean = false;

  ///datos del reporte
  reportData: any[] = [];

  // Paginación
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['Centro origen', 'Cód. red', 'Red asistencial', 'Cód. centro', 'Centro asistencial','Periodo','Año', 'Cód. servicio', 'Servicio', 'Cód. actividad', 'Actividad', 'Cód. subactividad', 'Subactividad', 'Sexo', 'Edad (años)', 'DNI médico','Acto médico','Paciente','Cód. diagnóstico','Diagnóstico'];

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  constructor(
    private ReportDashboardReporteadorService: ReportDashboardReporteadorService
  ) {
    this.currentDate = new Date().toLocaleDateString();
  }

  ngOnInit() {
    this.getDataSelects();
  }

  openDropdownRed() {
    this.isDropdownRedOpen = true;
    if (!this.searchRed) {
      this.filteredRed = this.dataRed;
    }
  }

  closeDropdownRed() {
    this.isDropdownRedOpen = false;
    this.searchRed = '';

    if (!this.selectedRedName) {
      this.isCentroEnabled = false;
      this.selectedCentroName = '';
      this.centro_asistencial = '';
    }
  }

  filterRed(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchRed = searchValue;
    this.isDropdownRedOpen = true;

    if (this.selectedRedName) {
      this.selectedRedName = '';
      this.red_asistencial = '';
      this.isCentroEnabled = false;
      this.selectedCentroName = '';
      this.centro_asistencial = '';
    }

    if (searchValue.trim() === '') {
      this.filteredRed = this.dataRed;
    } else {
      this.filteredRed = this.dataRed.filter((red: any) =>
        red.redasisdes.toLowerCase().includes(searchValue),
      );
    }
  }

  selectOptionRed(red: any) {
    this.selectedRedName = red.redasisdes;
    this.red_asistencial = red.redasiscod;
    this.isDropdownRedOpen = false;
    this.searchRed = '';

    this.dataCentro = this.dataCentroCompleto.filter(
      (centro: any) => centro.redasiscod === red.redasiscod,
    );
    this.filteredCentro = this.dataCentro;
    this.isCentroEnabled = true;

    this.selectedCentroName = '';
    this.centro_asistencial = '';
  }

  openDropdownCentro() {
    if (this.isCentroEnabled) {
      this.isDropdownCentroOpen = true;
      this.filteredCentro = this.dataCentro;
    }
  }

  closeDropdownCentro() {
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
  }

  filterCentro(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchCentro = searchValue;
    this.isDropdownCentroOpen = true;

    if (this.selectedCentroName) {
      this.selectedCentroName = '';
      this.centro_asistencial = '';
    }

    if (searchValue.trim() === '') {
      this.filteredCentro = this.dataCentro;
    } else {
      this.filteredCentro = this.dataCentro.filter((centro: any) =>
        centro.cenasides.toLowerCase().includes(searchValue),
      );
    }
  }

  selectOptionCentro(centro: any) {
    this.selectedCentroName = centro.cenasides;
    this.centro_asistencial = centro.cenasicod;
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
  }

  openDropdownActividad() {
    this.isDropdownActividadOpen = true;
    if (!this.searchActividad) {
      this.filteredActividad = this.dataActividad;
    }
  }

  closeDropdownActividad() {
    this.isDropdownActividadOpen = false;
    this.searchActividad = '';

    if (!this.selectedActividadName) {
      this.isSubactividadEnabled = false;
      this.selectedSubactividadName = '';
      this.subactividad = '';
    }
  }

  filterActividad(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchActividad = searchValue;
    this.isDropdownActividadOpen = true;

    if (this.selectedActividadName) {
      this.selectedActividadName = '';
      this.actividad = '';
      this.isSubactividadEnabled = false;
      this.selectedSubactividadName = '';
      this.subactividad = '';
    }

    if (searchValue.trim() === '') {
      this.filteredActividad = this.dataActividad;
    } else {
      this.filteredActividad = this.dataActividad.filter((actividadItem: any) =>
        actividadItem.actdes.toLowerCase().includes(searchValue),
      );
    }
  }

  selectOptionActividad(actividadItem: any) {
    this.selectedActividadName = actividadItem.actdes;
    this.actividad = actividadItem.actcod;
    this.isDropdownActividadOpen = false;
    this.searchActividad = '';

    this.dataSubactividad = this.dataSubactividadCompleto.filter(
      (subactividadItem: any) => subactividadItem.actcod === actividadItem.actcod,
    );
    this.filteredSubactividad = this.dataSubactividad;
    this.isSubactividadEnabled = true;

    this.selectedSubactividadName = '';
    this.subactividad = '';
  }

  openDropdownSubactividad() {
    if (this.isSubactividadEnabled) {
      this.isDropdownSubactividadOpen = true;
      this.filteredSubactividad = this.dataSubactividad;
    }
  }

  closeDropdownSubactividad() {
    this.isDropdownSubactividadOpen = false;
    this.searchSubactividad = '';
  }

  filterSubactividad(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchSubactividad = searchValue;
    this.isDropdownSubactividadOpen = true;

    if (this.selectedSubactividadName) {
      this.selectedSubactividadName = '';
      this.subactividad = '';
    }

    if (searchValue.trim() === '') {
      this.filteredSubactividad = this.dataSubactividad;
    } else {
      this.filteredSubactividad = this.dataSubactividad.filter((subactividadItem: any) =>
        subactividadItem.actespnom.toLowerCase().includes(searchValue),
      );
    }
  }

  selectOptionSubactividad(subactividadItem: any) {
    this.selectedSubactividadName = subactividadItem.actespnom;
    this.subactividad = subactividadItem.actespcod;
    this.isDropdownSubactividadOpen = false;
    this.searchSubactividad = '';
  }

  getDataSelects() {
    forkJoin({
      red: this.ReportDashboardReporteadorService.getQueryDRR(),
      centro: this.ReportDashboardReporteadorService.getQueryDRC(),
      servicio: this.ReportDashboardReporteadorService.getQueryDRS(),
      actividad: this.ReportDashboardReporteadorService.getQueryDRAC(),
      subactividad: this.ReportDashboardReporteadorService.getQueryDRSUBAC(),
      capitulo: this.ReportDashboardReporteadorService.getQueryDRCAP(),
      varible:this.ReportDashboardReporteadorService.getQueryDRVAR(),
    }).subscribe({
      next: (response) => {
        this.dataRed = response.red;
        this.dataCentroCompleto = response.centro;
        this.dataServicio = response.servicio;
        this.dataActividad = response.actividad;
        this.dataSubactividadCompleto = response.subactividad;
        this.dataCapitulo = response.capitulo;
        this.dataVariable = response.varible;
      },
      error: (error) => {
        console.error('Error al obtener los datos de los selects');
      },
    });
  }

  getReporte() {
    this.loadingAM = true;
    this.errorAM = null;
    this.noDataAM = false;
    const Resporteador : Resporteador = {
      anio: this.anio || '',
      periodo: this.periodo || '',
      redasiscod: this.red_asistencial || '',
      cod_centro: this.centro_asistencial || '',
      cod_servicio: this.servicio || '',
      cod_actividad: this.actividad || '',
      cod_subactividad: this.subactividad || '',
      sexo: this.sexo || '',
      capitulo: this.capitulo_CIE || '',
      variable: this.variable || ''
    };
    this.ReportDashboardReporteadorService.getQueryReporteador(Resporteador).subscribe({
      next: (response) => {
        this.loadingAM = false;
        this.reportData = response;
        this.dataSource.data = this.reportData;
      },
      error: (error) => {
        this.loadingAM = false;
        this.errorAM = error;
      },
    });
  }
}
