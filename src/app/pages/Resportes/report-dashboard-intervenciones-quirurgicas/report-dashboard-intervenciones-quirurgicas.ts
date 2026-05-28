import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import { LocalStorageService } from '../../../services/local-storage-service';
import { forkJoin } from 'rxjs';
import { CdkTableModule } from "@angular/cdk/table";
import { OnInit } from '@angular/core';
import { ReportDashboardIntervencionesQuirurgicasService } from '../../../services/reportes/report-dashboard-intervenciones-quirurgicas-service';
import { FileService } from '../../../services/documentos/file-service';

@Component({
  selector: 'app-report-dashboard-intervenciones-quirurgicas',
  imports: [CommonModule, FormsModule, CdkTableModule],
  templateUrl: './report-dashboard-intervenciones-quirurgicas.html',
  styleUrl: './report-dashboard-intervenciones-quirurgicas.css',
})
export class ReportDashboardIntervencionesQuirurgicas implements OnInit {

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
  sinComplejidad: number = 0;
  intervacionesEmergencia: number = 0;
  horasQuirurgicasElectivas: number = 0;
  horasQuirurgicasEmergencia: number = 0;


  //data indicadores grado de complejidad
  dataComplejidadA: any[] = [];
  dataComplejidadB: any[] = [];
  dataComplejidadC: any[] = [];
  dataComplejidadD: any[] = [];
  dataComplejidadE: any[] = [];
  dataSinComplejidad: any[] = [];
  dataInternvacionesEmergencia: any[] = [];

  constructor(
    private report: ReportDashboardIntervencionesQuirurgicasService,
    private cdr: ChangeDetectorRef,
    private dataImport: LocalStorageService,
    private fileService: FileService,
  ) { }


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

  downloadFichaTecnica(): void {
    this.fileService.getFile('f_centro_quirurgico_comp.pdf').subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'FICHA_TECNICA_CENTRO_QUIRURGICO_COMPLEJIDAD.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => {
        console.error('Error al descargar la ficha técnica:', err);
        alert(
          'Hubo un error al descargar la ficha técnica. Por favor, inténtelo de nuevo más tarde.',
        );
      },
    });
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

    const dataComplejidad = ['A', 'B', 'C', 'D', 'E', 'null'];

    dataComplejidad.forEach((tipo) => {
      switch (tipo) {
        case 'A':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc, tipo).subscribe({
            next: (data) => {
              this.complejidadA = data.length;
              this.loadingGC = false;

              ///datos para el detalle de complejidad A
              const areaCountMap = new Map<string, number>();

              for (const row of data) {
                const area = (row as any).area || 'Sin area';
                areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
              }

              this.dataComplejidadA = Array.from(areaCountMap, ([area, total]) => ({
                area,
                total,
              }));
              this.dataComplejidadA.sort((a, b) => b.total - a.total);



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
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc, tipo).subscribe({
            next: (data) => {

              this.complejidadB = data.length;
              this.loadingGC = false;

              const areaCountMap = new Map<string, number>();

              for (const row of data) {
                const area = (row as any).area || 'Sin area';
                areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
              }

              this.dataComplejidadB = Array.from(areaCountMap, ([area, total]) => ({
                area,
                total,
              }));
              this.dataComplejidadB.sort((a, b) => b.total - a.total);

              this.cdr.detectChanges();
            }
          });
          break;
        case 'C':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc, tipo).subscribe({
            next: (data) => {
              this.dataComplejidadC = data;
              this.complejidadC = data.length;
              this.loadingGC = false;

              const areaCountMap = new Map<string, number>();

              for (const row of data) {
                const area = (row as any).area || 'Sin area';
                areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
              }

              this.dataComplejidadC = Array.from(areaCountMap, ([area, total]) => ({
                area,
                total,
              }));
              this.dataComplejidadC.sort((a, b) => b.total - a.total);

              this.cdr.detectChanges();
            }
          });
          break;
        case 'D':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc, tipo).subscribe({
            next: (data) => {
              this.dataComplejidadD = data;
              this.complejidadD = data.length;
              this.loadingGC = false;


              const areaCountMap = new Map<string, number>();

              for (const row of data) {
                const area = (row as any).area || 'Sin area';
                areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
              }

              this.dataComplejidadD = Array.from(areaCountMap, ([area, total]) => ({
                area,
                total,
              }));
              this.dataComplejidadD.sort((a, b) => b.total - a.total);

              this.cdr.detectChanges();
            }
          });
          break;
        case 'E':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc, tipo).subscribe({
            next: (data) => {
              this.dataComplejidadE = data;
              this.complejidadE = data.length;
              this.loadingGC = false;


              const areaCountMap = new Map<string, number>();

              for (const row of data) {
                const area = (row as any).area || 'Sin area';
                areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
              }

              this.dataComplejidadE = Array.from(areaCountMap, ([area, total]) => ({
                area,
                total,
              }));
              this.dataComplejidadE.sort((a, b) => b.total - a.total);

              this.cdr.detectChanges();
            }
          });
          break;
        case 'null':
          this.report.getQueryDIQGC(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc, tipo).subscribe({
            next: (data) => {

              this.sinComplejidad = data.length;

              const areaCountMap = new Map<string, number>();

              for (const row of data) {
                const area = (row as any).area || 'Sin area';
                areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
              }

              this.dataSinComplejidad = Array.from(areaCountMap, ([area, total]) => ({
                area,
                total,
              }));
              this.dataSinComplejidad.sort((a, b) => b.total - a.total);

              this.loadingGC = false;
              this.cdr.detectChanges();
            }
          });
          break;
      }
    });

    forkJoin({
      intervencionesEmergencia: this.report.getQueryDIQE(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc),
      horasQuirurgicasElectivas: this.report.getQueryDIQHQE(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc),
      horasQuirurgicasEmergencia: this.report.getQueryDIQHQEME(this.anio_gc, this.periodo_gc, this.codcas, this.tipo_asegurado_gc),
    }).subscribe({
      next: (result) => {
        this.intervacionesEmergencia = result.intervencionesEmergencia.length;

        const areaCountMap = new Map<string, number>();

        for (const row of result.intervencionesEmergencia) {
          const area = (row as any).area || 'Sin area';
          areaCountMap.set(area, (areaCountMap.get(area) || 0) + 1);
        }

        this.dataInternvacionesEmergencia = Array.from(areaCountMap, ([area, total]) => ({
          area,
          total,
        }));
        this.dataInternvacionesEmergencia.sort((a, b) => b.total - a.total);
        this.horasQuirurgicasElectivas = result.horasQuirurgicasElectivas[0].horas_quirurgicas_realizadas_iq_electivas || 0;
        this.horasQuirurgicasEmergencia = result.horasQuirurgicasEmergencia[0].horas_quirurgicas_realizadas_iq_emergencia || 0;
        this.cdr.detectChanges();
      }
    });
    this.dataImport.saveDataIQGC(this.anio_gc, this.periodo_gc, this.tipo_asegurado_gc);

  }


  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Grado de Complejidad' = 'Grado de Complejidad';

  setActiveTab(
    tab:
      | 'Grado de Complejidad'

  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

}
