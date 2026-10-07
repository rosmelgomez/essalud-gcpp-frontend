import { ChangeDetectorRef, Component } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { FarmaciaService } from '../../../services/reportes/farmacia-service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';

@Component({
  selector: 'app-dashboard-farmacia',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-farmacia.html',
  styleUrl: './dashboard-farmacia.css',
})
export class DashboardFarmacia {
  currentDate: string = '';
  centroAtencion: string = '';

  loadingRA: boolean = false;
  errorRA: string | null = null;
  selectPeriodoRA: boolean = false;




  ///filtros
  periodoRA: string = '';
  anioRA: string = '';
  tipo_aseguradoRA: string = '';
  codcasRA: string = '';

  ///data
  dataRA: any[] = [];
  dataDFCSV: any[] = [];

  ///indicadores
  totalRecetasAtendidasRA: number = 0;
  consultaExternaRA: number = 0;
  urgenciaEmergenciaRA: number = 0;
  hospitalizacionRA: number = 0;
  centroQuirurgicosRA: number = 0;
  ayudaDiagnosticoRA: number = 0;



  constructor(
    private service: FarmaciaService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService
  ) { }

  ngOnInit(): void {
    this.loadFechaActualizacion();
    this.centroAtencion = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcasRA = this.dataImport.getDataCentro()?.codcas || '';
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


  loadRecetasAtendidas() {

    if (!this.periodoRA || !this.anioRA || !this.tipo_aseguradoRA || !this.codcasRA) {
      this.errorRA = 'Por favor seleccione un período';
      return;
    }
    this.errorRA = null;
    this.loadingRA = true;
    this.selectPeriodoRA = false;

    forkJoin({
      recetasAtendidas: this.service.getQueryDFRA(this.anioRA, this.periodoRA, this.codcasRA, this.tipo_aseguradoRA),
      csv: this.service.getQueryDFCSV(this.anioRA, this.periodoRA, this.codcasRA, this.tipo_aseguradoRA),
    }).subscribe({
      next: (data) => {

        this.totalRecetasAtendidasRA = data.recetasAtendidas.reduce(
          (sum: number, row: { recetas: any }) => sum + Number(row.recetas ?? 0),
          0,
        );


        this.consultaExternaRA = data.recetasAtendidas.find((item: { area: string; recetas: number }) => item.area === 'CONSULTA EXTERNA')?.recetas || 0;
        this.urgenciaEmergenciaRA = data.recetasAtendidas.find((item: { area: string; recetas: number }) => item.area === 'URGENCIAS / EMERGENCIA')?.recetas || 0;
        this.hospitalizacionRA = data.recetasAtendidas.find((item: { area: string; recetas: number }) => item.area === 'HOSPITALIZACION')?.recetas || 0;
        this.centroQuirurgicosRA = data.recetasAtendidas.find((item: { area: string; recetas: number }) => item.area === 'CENTRO QUIRURGICO')?.recetas || 0;
        this.ayudaDiagnosticoRA = data.recetasAtendidas.find((item: { area: string; recetas: number }) => item.area === 'AYUDA AL DIAGNOSTICO')?.recetas || 0;

        this.dataDFCSV = data.csv;
        console.log('Recetas Atendidas:', data.recetasAtendidas);
        console.log('Datos CSV:', data.csv);

        this.loadingRA = false;
        this.selectPeriodoRA = true;
        this.cdr.detectChanges();

      },
      error: (error) => {
        console.error('Error al cargar las recetas atendidas', error);
        this.loadingRA = false;
        this.selectPeriodoRA = true;
        this.cdr.detectChanges();
      },
    })
  }

  // Descargar datos en formato CSV
  downloadCSV(): void {
    if (!this.dataDFCSV?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `df_recetas_atendidas_${this.periodoRA}_${this.centroAtencion}.csv`;

    const headers = Object.keys(this.dataDFCSV[0]);
    const csvContent = [
      headers.join(';'),
      ...this.dataDFCSV.map((row) =>
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



  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Recetas Atendidas' = 'Recetas Atendidas';

  setActiveTab(
    tab:
      | 'Recetas Atendidas'
  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }


}
