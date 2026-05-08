import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkTableModule } from "@angular/cdk/table";
import { FileService } from '../../../services/file-service';
import { ReportTransplante } from '../../../services/reportes/report-transplante';

@Component({
  selector: 'app-report-dashboard-transplate',
  imports: [CommonModule, FormsModule, CdkTableModule],
  templateUrl: './report-dashboard-transplante.html',
  styleUrl: './report-dashboard-transplante.css',
})
export class ReportDashboardTransplante implements OnInit {

  currentDate: string = '';

  // Estados para grado de complejidad
  loadingT: boolean = false;
  errorT: string | null = null;
  noDataT: boolean = false;
  selectPeriodoT: boolean = true;


  //data importantes
  centroAtencion: string = '';
  codcas: string = '';


  //filtros para grado de complejidad
  periodo_trans: string = '';
  anio_trans: string = '';
  tipo_asegurado_trans: string = '';

  //Indicadores grado de complejidad
  complejidadA: number = 0;

  //data indicadores grado de complejidad
  dataComplejidadA: any[] = [];


  constructor(
    private report: ReportTransplante,
    private cdr: ChangeDetectorRef,
    private dataImport: LocalStorageService,
     private fileService: FileService,
  ) {}

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }


  ngOnInit(): void {
    this.currentDate = this.formatDate(new Date());
    this.centroAtencion = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
  }

   downloadFichaTecnica(): void {
    this.fileService.getFile('f_centro_quirurgico_tras.pdf').subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'FICHA_TECNICA_CENTRO_QUIRURGICO_TRANSPLANTE.pdf';
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



  loadtransplante() {
  if (!this.periodo_trans || !this.anio_trans || !this.tipo_asegurado_trans || !this.codcas ) {
    this.errorT = 'Por favor, complete todos los campos de filtro.';
    this.loadingT = false;
    this.noDataT = false;
    this.selectPeriodoT = true;
    return;
  }
  this.loadingT = true;
  this.errorT = null;
  this.noDataT = false;
  this.selectPeriodoT = false;
    this.cdr.detectChanges();

  this.report.getQueryTransplante(this.anio_trans, this.periodo_trans,this.codcas ,this.tipo_asegurado_trans).subscribe({
    next: (data) => {
      this.dataComplejidadA = data;
      this.complejidadA = data.length ;

      ///datos para el detalle de complejidad A
              const salaCountMap = new Map<string, number>();

              for (const row of data) {
                const sala = (row as any).cpms || 'Sin sala';
                salaCountMap.set(sala, (salaCountMap.get(sala) || 0) + 1);
              }

              this.dataComplejidadA = Array.from(salaCountMap, ([sala, total]) => ({
                sala,
                total,
              }));
              this.dataComplejidadA.sort((a, b) => b.total - a.total);



      this.loadingT = false;
      this.noDataT = data.length === 0;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.errorT = 'Error al cargar los datos. Por favor, inténtelo de nuevo.';
      this.loadingT = false;
      this.noDataT = false;
      this.cdr.detectChanges();
    }
  });
  }

   formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Transplante' = 'Transplante';

  setActiveTab(
    tab:
      | 'Transplante'

  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}
