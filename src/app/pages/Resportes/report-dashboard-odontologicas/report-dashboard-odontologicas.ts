import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../../services/local-storage-service';
import { FileService } from '../../../services/documentos/file-service';

import { forkJoin } from 'rxjs';
import { ReportDashboardOdontologicasService } from '../../../services/reportes/report-dashboard-odontologicas-service';

@Component({
  selector: 'app-report-dashboard-odontologicas',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-dashboard-odontologicas.html',
  styleUrl: './report-dashboard-odontologicas.css',
})
export class ReportDashboardOdontologicas implements OnInit {
  currentDate: string = '';

  //data importantes
  centroAtencion: string = '';
  codcas: string = '';

  //estados para sesiones odontologicas
  loadingSO: boolean = false;
  errorSO: string | null = null;
  noDataSO: boolean = false;
  selectPeriodoSO: boolean = true;

  //Filtros para sesiones odontologicas
  anioSO: string = '';
  periodoSO: string = '';
  tipo_aseguradoSO: string = '';

  //Indicadores para sesiones odontologicas
  atencionesSO: number = 0;
  horasEfectivasSO: number = 0;
  horasProgramadasSO: number = 0;
  totalMedicosSO: number = 0;
  totalConsultantesAtencionSO: number = 0;
  totalConsultantesServicioSO: number = 0;

  //Data indicadores para sesiones odontologicas
  dataAtencionesSO: any[] = [];
  dataHorasEfectivasSO: any[] = [];
  dataHorasProgramadasSO: any[] = [];
  dataMedicosSO: any[] = [];
  dataTotalConsultantesAtencionSO: any[] = [];
  dataTotalConsultantesServicioSO: any[] = [];

  constructor(
    private dataImport: LocalStorageService,
    private reportDashboardOdonS: ReportDashboardOdontologicasService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
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

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  downloadFichaTecnica(): void {
    this.fileService.getFile('f_consulta_externa_odo.pdf').subscribe({
      next: (blob: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'FICHA_TECNICA_ODONTOLOGICA.pdf';
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


  loadSesionesOdontologicas() {
    if (!this.anioSO || !this.periodoSO || !this.tipo_aseguradoSO) {
      this.errorSO = 'Por favor, complete todos los filtros.';
      return;
    }
    this.loadingSO = true;
    this.errorSO = null;
    this.noDataSO = false;
    this.selectPeriodoSO = false;
    this.cdr.detectChanges();
    forkJoin({
      atenciones: this.reportDashboardOdonS.getQueryDOSOA(
        this.anioSO,
        this.periodoSO,
        this.codcas,
        this.tipo_aseguradoSO,
      ),
      horasEfectivas: this.reportDashboardOdonS.getQueryDOSOHE(
        this.anioSO,
        this.periodoSO,
        this.codcas,
      ),
      horasProgramadas: this.reportDashboardOdonS.getQueryDOSOHP(
        this.anioSO,
        this.periodoSO,
        this.codcas,
      ),
      medicos: this.reportDashboardOdonS.getQueryDOSOM(this.anioSO, this.periodoSO, this.codcas),
      totalConsultantesAtencion: this.reportDashboardOdonS.getQueryDOSOTCA(
        this.anioSO,
        this.periodoSO,
        this.codcas,
        this.tipo_aseguradoSO,
      ),
      totalConsultantesServicio: this.reportDashboardOdonS.getQueryDOSOTCS(
        this.anioSO,
        this.periodoSO,
        this.codcas,
        this.tipo_aseguradoSO,
      ),
    }).subscribe({
      next: (results) => {
        //total consultantes atencion
        this.totalConsultantesAtencionSO = results.totalConsultantesAtencion[0].cantidad ?? 0;

        //total consultantes servicio
        this.totalConsultantesServicioSO = results.totalConsultantesServicio[0].cantidad ?? 0;
        this.dataTotalConsultantesServicioSO = results.totalConsultantesServicio;

        //total atenciones
        this.atencionesSO = results.atenciones.length;
        const atencionesAgrupadorCountMap = new Map<string, number>();
        for (const row of results.atenciones) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          atencionesAgrupadorCountMap.set(agrupador, (atencionesAgrupadorCountMap.get(agrupador) || 0) + 1);
        }

        this.dataAtencionesSO = Array.from(atencionesAgrupadorCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataAtencionesSO.sort((a, b) => b.total - a.total);


        //total medicos
        this.totalMedicosSO = results.medicos.length || 0;
        ///datar por agrupador
        const agrupadorCountMap = new Map<string, number>();
        for (const row of results.medicos) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMap.set(agrupador, (agrupadorCountMap.get(agrupador) || 0) + 1);
        }

        this.dataMedicosSO = Array.from(agrupadorCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataMedicosSO.sort((a, b) => b.total - a.total);

        //total horas programadas
        this.horasProgramadasSO = results.horasProgramadas.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        //data horas programadas por agrupador
        const horasProgramadasCountMap = new Map<string, number>();
        for (const row of results.horasProgramadas) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMap.set(
            agrupador,
            (horasProgramadasCountMap.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadasSO = Array.from(horasProgramadasCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasProgramadasSO.sort((a, b) => b.total - a.total);


        //total horas efectivas
        this.horasEfectivasSO = results.horasEfectivas.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        //data horas efectivas por agrupador
        const horasEfectivasCountMap = new Map<string, number>();
        for (const row of results.horasEfectivas) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMap.set(
            agrupador,
            (horasEfectivasCountMap.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivasSO = Array.from(horasEfectivasCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasEfectivasSO.sort((a, b) => b.total - a.total);

        this.loadingSO = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el dashboard odontológico:', err);
        this.errorSO = 'Ocurrió un error al cargar los datos. Por favor, intente nuevamente.';
        this.loadingSO = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Tabs
  activeTab: 'Sesiones Odontológicas' = 'Sesiones Odontológicas';

  setActiveTab(tab: 'Sesiones Odontológicas'): void {
    this.activeTab = tab;
  }
}
