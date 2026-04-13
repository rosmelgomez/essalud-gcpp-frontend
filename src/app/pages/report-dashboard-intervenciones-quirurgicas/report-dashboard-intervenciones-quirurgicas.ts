import { logoutGuard } from './../../guards/logout-guard';
import { Component } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ReportDashboardIntervencionesQuirurgicasService } from '../../services/report-dashboard-intervenciones-quirurgicas-service';
import{ DataImport } from '../../services/data-import';
//import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-report-dashboard-intervenciones-quirurgicas',
  imports: [],
  templateUrl: './report-dashboard-intervenciones-quirurgicas.html',
  styleUrl: './report-dashboard-intervenciones-quirurgicas.css',
})
export class ReportDashboardIntervencionesQuirurgicas {

  currentDate: string = '';

    // Estados para grado de complejidad
  loadingGC: boolean = false;
  errorGC: string | null = null;
  noDataGC: boolean = false;
  selectPeriodoGC: boolean = true;

  //data importantes
  centroAtencion: string = '';
  codcas: string = '';

  //filtros para grado de complejidad
  periodo_gc: string = '';
  anio_gc: string = '';
  tipo_asegurado_gc: string = '';


  //Indicadores grado de complejidad
  complejidadA: number = 0;
  complejidadB: number = 0;
  complejidadC: number = 0;
  complejidadD: number = 0;
  complejidadE: number = 0;


    //data indicadores grado de complejidad
  dataComplejidadA: any[] = [];
  dataComplejidadB: any[] = [];
  dataComplejidadC: any[] = [];
  dataComplejidadD: any[] = [];
  dataComplejidadE: any[] = [];

  constructor(
    private report: ReportDashboardIntervencionesQuirurgicasService,
    private cdr: ChangeDetectorRef,
    private dataImport: DataImport,
    //private fileService: FileService,
  ) {}


  ngOnInit(): void {
    this.currentDate = this.formatDate(new Date());
    this.centroAtencion = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  loadGradoComplejidad() {
    if (!this.periodo_gc || !this.anio_gc || !this.tipo_asegurado_gc) {
      this.errorGC = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    this.loadingGC = true;
    this.errorGC = null;
    this.noDataGC = false;
    this.selectPeriodoGC = false;
    this.cdr.detectChanges();

    const dataComplejidad = ['A', 'B', 'C', 'D', 'E'];

    dataComplejidad.forEach((tipo) => {
      switch (tipo) {
        case 'A':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, 'A', 'COMPLEJIDAD A').subscribe({
            next: (data) => {
              this.dataComplejidadA = data;
              this.complejidadA = data.length;
              this.loadingGC = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.errorGC = 'Error al cargar los datos de complejidad A';
              this.loadingGC = false;
              this.cdr.detectChanges();
            }
          });
          break;
        case 'B':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, 'B', 'COMPLEJIDAD B').subscribe({
            next: (data) => {
              this.dataComplejidadB = data;
              this.complejidadB = data.length;
              this.loadingGC = false;
              this.cdr.detectChanges();
            }
          });
          break;
        case 'C':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, 'C', 'COMPLEJIDAD C').subscribe({
            next: (data) => {
              this.dataComplejidadC = data;
              this.complejidadC = data.length;
              this.loadingGC = false;
              this.cdr.detectChanges();
            }
          });
          break;
        case 'D':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, 'D', 'COMPLEJIDAD D').subscribe({
            next: (data) => {
              this.dataComplejidadD = data;
              this.complejidadD = data.length;
              this.loadingGC = false;
              this.cdr.detectChanges();
            }
          });
          break;
        case 'E':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, 'E', 'COMPLEJIDAD E').subscribe({
            next: (data) => {
              this.dataComplejidadE = data;
              this.complejidadE = data.length;
              this.loadingGC = false;
              this.cdr.detectChanges();
            }
          });
          break;
      }
    });
  }


   formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Atenciones Medicas'
    | 'Medicina Complementaria'
    | 'Medicina Ocupacional'
    | 'Medico de Personal'
    | 'Consulta de Atencion Inmediata'
    | 'Consulta de Apoyo  Desc' = 'Atenciones Medicas';

  setActiveTab(
    tab:
      | 'Atenciones Medicas'
      | 'Medicina Complementaria'
      | 'Medicina Ocupacional'
      | 'Medico de Personal'
      | 'Consulta de Atencion Inmediata'
      | 'Consulta de Apoyo  Desc',
  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

}
