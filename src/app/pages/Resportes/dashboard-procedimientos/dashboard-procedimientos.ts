import { ChangeDetectorRef, Component } from '@angular/core';
import { ProcedimientosService } from '../../../services/reportes/procedimientos-service';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../../services/local-storage-service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';

export interface ProcedimientoInfo {
  cod_relacional: number; // codigo solo de referencia 
  nombre: string;
  total: number;
  data: any[];
}


@Component({
  selector: 'app-dashboard-procedimientos',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-procedimientos.html',
  styleUrl: './dashboard-procedimientos.css',
})
export class DashboardProcedimientos {
  currentDate: string = '';
  centroAtencion: string = '';

  // Estados para Procedimientos 
  loadingP: boolean = false;
  errorP: string | null = null;
  noDataP: boolean = false;
  selectPeriodoP: boolean = true;

  //filtros para Procedimientos 
  periodoP: string = '';
  anioP: string = '';
  tipo_aseguradoP: string = '';

  /// indicadores + data
  informacion: ProcedimientoInfo[] = [
    //{ cod_relacional: 1, nombre: "Ablación Transcatéter", total: 0, data: [] },
    //{ cod_relacional: 2, nombre: "Administración de Oxígeno por Casco Cefálico (OXIHOOD)", total: 0, data: [] },
    //{ cod_relacional: 3, nombre: "Angiografía Cerebral", total: 0, data: [] },
    //{ cod_relacional: 4, nombre: "Angioplastia coronaria", total: 0, data: [] },
    { cod_relacional: 5, nombre: 'Angiografía Retinal', total: 0, data: [] },
    //{ cod_relacional: 6, nombre: 'Angioplastia con Balón', total: 0, data: [] },
    //{ cod_relacional: 7, nombre: 'Angioplastia con Stent Metálico', total: 0, data: [] },
    { cod_relacional: 8, nombre: 'Audiometría', total: 0, data: [] },
    //{ cod_relacional: 9, nombre: 'Biopsia Endomiocárdica', total: 0, data: [] },
    { cod_relacional: 10, nombre: 'Cardio Holter', total: 0, data: [] },
    //{ cod_relacional: 11, nombre: 'Cardioversión Eléctrica Electiva', total: 0, data: [] },
    //{ cod_relacional: 12, nombre: 'Cateterismo + Medición de CIA', total: 0, data: [] },
    //{ cod_relacional: 13, nombre: 'Cateterismo Cardíaco', total: 0, data: [] },
    { cod_relacional: 14, nombre: 'Colposcopía', total: 0, data: [] },
    //{ cod_relacional: 15, nombre: 'Cono Frío', total: 0, data: [] },
    //{ cod_relacional: 16, nombre: 'Cono LEEP', total: 0, data: [] },
    //{ cod_relacional: 17, nombre: 'Crioterapia', total: 0, data: [] },
    //{ cod_relacional: 18, nombre: 'Dilatación con Protesis de Coartación de Aorta', total: 0, data: [] },
    //{ cod_relacional: 19, nombre: 'Ecocardiografía Stress', total: 0, data: [] },
    { cod_relacional: 20, nombre: 'Ecocardiografía Transesofágica', total: 0, data: [] },
    { cod_relacional: 21, nombre: 'Ecocardiografía Transtorácica', total: 0, data: [] },
    { cod_relacional: 22, nombre: 'Electrocardiografía', total: 0, data: [] },
    { cod_relacional: 23, nombre: 'Electroencefalografía', total: 0, data: [] },
    //{ cod_relacional: 24, nombre: 'Electromiografía y Velocidad de Conducción', total: 0, data: [] },
    { cod_relacional: 25, nombre: 'Endoscopía Diagnóstica no Digestiva', total: 0, data: [] },
    { cod_relacional: 26, nombre: 'Endoscopía Digestiva Diagnóstica', total: 0, data: [] },
    { cod_relacional: 27, nombre: 'Espirometría', total: 0, data: [] },
    //{ cod_relacional: 28, nombre: 'Estimulacion Electrica Cerebral', total: 0, data: [] },
    //{ cod_relacional: 29, nombre: 'Estudios Fisiológicos (Electrofisiológicos)', total: 0, data: [] },
    //{ cod_relacional: 30, nombre: 'Implantación de Cardiovector Desfibrilador Automático', total: 0, data: [] },
    //{ cod_relacional: 31, nombre: 'Instalación y Mantenimiento de CPAC de burbuja', total: 0, data: [] },
    //{ cod_relacional: 32, nombre: 'Instalacion y Mantenimiento de Cateter Venoso Central de Insercion Periferica (PICC)', total: 0, data: [] },
    //{ cod_relacional: 33, nombre: 'Laparoscopía Diagnóstica', total: 0, data: [] },
    { cod_relacional: 34, nombre: 'Laserterapia Ocular', total: 0, data: [] },
    //{ cod_relacional: 35, nombre: 'Marcapaso Definitivo Bicameral', total: 0, data: [] },
    //{ cod_relacional: 36, nombre: 'Marcapaso Definitivo para Resincronización', total: 0, data: [] },
    //{ cod_relacional: 37, nombre: 'Marcapaso Definitivo Unicameral', total: 0, data: [] },
    //{ cod_relacional: 38, nombre: 'Marcapaso Transitorio', total: 0, data: [] },
    //{ cod_relacional: 39, nombre: 'Oclusión de Defecto Septal Interauricular', total: 0, data: [] },
    //{ cod_relacional: 40, nombre: 'Oclusión de Defecto Septal Interventricular', total: 0, data: [] },
    //{ cod_relacional: 41, nombre: 'Perimetría (Campimetría)', total: 0, data: [] },
    { cod_relacional: 42, nombre: 'Procedimiento Corneal Instrumentado', total: 0, data: [] },
    { cod_relacional: 43, nombre: 'Procedimientos Médicos de Rehabilitación', total: 0, data: [] },
    //{ cod_relacional: 44, nombre: 'Prueba de Esfuerzo', total: 0, data: [] },
    //{ cod_relacional: 45, nombre: 'Reserva de Flujo Fraccionado', total: 0, data: [] },
    //{ cod_relacional: 46, nombre: 'Test de Inclinación', total: 0, data: [] },
    //{ cod_relacional: 47, nombre: 'Test del Aliento', total: 0, data: [] },
    //{ cod_relacional: 48, nombre: 'Tomografía de Coherencia Óptica (OCT)', total: 0, data: [] },
    { cod_relacional: 49, nombre: 'Tratamiento del Dolor (Manejo del Dolor)', total: 0, data: [] },
    //{ cod_relacional: 50, nombre: 'Trombólisis Sistémica', total: 0, data: [] },
    //{ cod_relacional: 51, nombre: 'Ultrasonico Endovascular', total: 0, data: [] },
    //{ cod_relacional: 52, nombre: 'Urodinamia', total: 0, data: [] },
    //{ cod_relacional: 53, nombre: 'Valvuloplastia Mitral con Balón', total: 0, data: [] },
    //{ cod_relacional: 54, nombre: 'Valvuloplastía Pulmonar y/o Aórtica', total: 0, data: [] },
    //{ cod_relacional: 55, nombre: 'Video/Epilepsia', total: 0, data: [] },
  ];


  constructor(
    private lsService: LocalStorageService,
    private proservice: ProcedimientosService,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService,
  ) {
    this.loadFechaActualizacion
    this.centroAtencion = this.lsService.getDataCentro()?.nameCentro || "";
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


  loadDashboardProcedimientos() {
    if (!this.anioP || !this.periodoP || !this.tipo_aseguradoP) {
      this.errorP = 'Por favor, complete todos los filtros.';
      return;
    }
    this.loadingP = true;
    this.errorP = null;
    this.noDataP = false;
    this.selectPeriodoP = true;
    this.cdr.detectChanges();

    const codcas = this.lsService.getDataCentro()?.codcas || '';

    // Mapeamos dinámicamente cada objeto de la lista a su consulta HTTP
    const peticiones = this.informacion.map(item =>
      this.proservice.getqueryDP(this.anioP, this.periodoP, codcas, this.tipo_aseguradoP, item.cod_relacional)
    );

    forkJoin(peticiones).subscribe({
      next: (results) => {
        // results mantiene exactamente el mismo orden del array "informacion"
        results.forEach((data, index) => {

          ///data para total consultas por servicio
          const servicioCountMap = new Map<string, number>();
          for (const row of data) {
            const servicio = (row as any).servicio || 'Sin servicio';
            servicioCountMap.set(servicio, (servicioCountMap.get(servicio) || 0) + 1);
          }

          this.informacion[index].data = Array.from(servicioCountMap, ([servicio, total]) => ({
            servicio,
            total,
          }));
          this.informacion[index].data.sort((a, b) => b.total - a.total);

          this.informacion[index].total = data.length;
        });

        this.loadingP = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar procedimientos:', err);
        this.errorP = 'Ocurrió un error al cargar los datos. Por favor, intente de nuevo.';
        this.loadingP = false;
        this.cdr.detectChanges();
      }
    });

    /*
    this.codes_relacionados.forEach(code => {
      this.proservice.getqueryDP(this.anioP, this.periodoP, codcas, this.tipo_aseguradoP, code).subscribe(
        (data) => {

          this.informacion[code].total = data.length;

          ///data para total consultas por servicio
          const servicioCountMap = new Map<string, number>();
          for (const row of data) {
            const servicio = (row as any).servicio || 'Sin servicio';
            servicioCountMap.set(servicio, (servicioCountMap.get(servicio) || 0) + 1);
          }

          this.informacion[code].data = Array.from(servicioCountMap, ([servicio, total]) => ({
            servicio,
            total,
          }));
          this.informacion[code].data.sort((a, b) => b.total - a.total);

        },
        (error) => {
          this.errorP = 'Error al cargar los datos';
          this.loadingP = false;
          this.noDataP = true;
        }
      );
    });
    */

    this.loadingP = false;
    this.noDataP = false;
    this.selectPeriodoP = false;
    this.cdr.detectChanges();
  }


  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Total Procedimientos Realizados' = 'Total Procedimientos Realizados';

  setActiveTab(
    tab:
      | 'Total Procedimientos Realizados'
  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  downloadCSV(): void { }

}
