import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../../services/local-storage-service';
import { EmergenciasService } from '../../../services/reportes/emergencias-service';


@Component({
  selector: 'app-dashboard-emergencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-emergencia.html',
  styleUrl: './dashboard-emergencia.css',
})
export class DashboardEmergencia implements OnInit {
  currentDate: string = '';
  centroNombre: string = '';

  periodo: string = '';
  anio: string = '';
  tipo_asegurado: string = '';
  codcas: string = '';

  /*Prioridades */
  prioridad1: any = null;
  prioridad2: any = null;
  prioridad3: any = null;
  prioridad4: any = null;
  prioridad5: any = null;

  numberPrioridad1: number = 0;
  numberPrioridad2: number = 0;
  numberPrioridad3: number = 0;
  numberPrioridad4: number = 0;
  numberPrioridad5: number = 0;

  /*Defunciones */
  defuncionesData: any = null;
  numberDefunciones: number = 0;

  /* Estancias */
  estanciasMayor24h: any = null;
  estanciasMenor24h: any = null;
  numberEstanciasMayor24h: number = 0;
  numberEstanciasMenor24h: number = 0;

  /* Estados */
  loading: boolean = false;
  error: string | null = null;
  selectPeriodo: boolean = true;
  completedRequests: number = 0;

  constructor(
    private reportDashboardEmergenciasService: EmergenciasService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.currentDate = this.formatDate(new Date());
    this.centroNombre = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  getTotalPrioridad(): void {
    if (!this.periodo) {
      this.error = 'Por favor seleccione un período';
      return;
    }

    // Establecer estados
    this.loading = true;
    this.error = null;
    this.selectPeriodo = false;
    this.completedRequests = 0;

    // Limpiar datos anteriores
    this.numberPrioridad1 = 0;
    this.numberPrioridad2 = 0;
    this.numberPrioridad3 = 0;
    this.numberPrioridad4 = 0;
    this.numberPrioridad5 = 0;
    this.numberDefunciones = 0;
    this.numberEstanciasMayor24h = 0;
    this.numberEstanciasMenor24h = 0;

    const totalRequests = 8; // 5 prioridades + 3 adicionales (defunciones, estancias mayor y menor)

    for (let i = 1; i <= 5; i++) {
      this.reportDashboardEmergenciasService.getQueryDEP(this.anio, this.periodo, this.codcas, this.tipo_asegurado, i)
        .subscribe({
          next: (data) => {
            switch (i) {
              case 1:
                this.numberPrioridad1 = data.length;
                const topico_sesCountMap = new Map<string, number>();

                for (const row of data) {
                  const topico_ses = (row as any).topico_ses || 'Sin agrupador';
                  topico_sesCountMap.set(topico_ses, (topico_sesCountMap.get(topico_ses) || 0) + 1);
                }
                this.prioridad1 = Array.from(topico_sesCountMap, ([topico_ses, total]) => ({
                  topico_ses,
                  total,
                }));
                break;
              case 2:
                this.numberPrioridad2 = data.length;
                const topico_sesCountMap2 = new Map<string, number>();
                for (const row of data) {
                  const topico_ses = (row as any).topico_ses || 'Sin agrupador';
                  topico_sesCountMap2.set(
                    topico_ses,
                    (topico_sesCountMap2.get(topico_ses) || 0) + 1,
                  );
                }
                this.prioridad2 = Array.from(topico_sesCountMap2, ([topico_ses, total]) => ({
                  topico_ses,
                  total,
                }));
                break;
              case 3:
                this.numberPrioridad3 = data.length;
                const topico_sesCountMap3 = new Map<string, number>();
                for (const row of data) {
                  const topico_ses = (row as any).topico_ses || 'Sin agrupador';
                  topico_sesCountMap3.set(
                    topico_ses,
                    (topico_sesCountMap3.get(topico_ses) || 0) + 1,
                  );
                }
                this.prioridad3 = Array.from(topico_sesCountMap3, ([topico_ses, total]) => ({
                  topico_ses,
                  total,
                }));
                break;
              case 4:
                this.numberPrioridad4 = data.length;
                const topico_sesCountMap4 = new Map<string, number>();
                for (const row of data) {
                  const topico_ses = (row as any).topico_ses || 'Sin agrupador';
                  topico_sesCountMap4.set(
                    topico_ses,
                    (topico_sesCountMap4.get(topico_ses) || 0) + 1,
                  );
                }
                this.prioridad4 = Array.from(topico_sesCountMap4, ([topico_ses, total]) => ({
                  topico_ses,
                  total,
                }));
                break;
              case 5:
                this.numberPrioridad5 = data.length;
                const topico_sesCountMap5 = new Map<string, number>();
                for (const row of data) {
                  const topico_ses = (row as any).topico_ses || 'Sin agrupador';
                  topico_sesCountMap5.set(
                    topico_ses,
                    (topico_sesCountMap5.get(topico_ses) || 0) + 1,
                  );
                }
                this.prioridad5 = Array.from(topico_sesCountMap5, ([topico_ses, total]) => ({
                  topico_ses,
                  total,
                }));
                break;
            }
            this.completedRequests++;
            if (this.completedRequests === totalRequests) {
              this.dataImport.saveDataDE(this.anio, this.periodo, this.tipo_asegurado);
              this.loading = false;
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            console.error(`Error al obtener prioridad`);
            this.completedRequests++;
            if (this.completedRequests === totalRequests) {
              this.loading = false;
              this.cdr.detectChanges();
            }
          },
        });
    }

    // Cargar defunciones
    this.getDefunciones();

    // Cargar estancias mayor a 24h
    this.getTotalEstanciasMayor24h();

    // Cargar estancias menor a 24h
    this.getTotalEstanciasMenor24h();

    if (this.completedRequests === totalRequests) {
      this.dataImport.saveDataDE(this.anio, this.periodo, this.tipo_asegurado);
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }


  getDefunciones(): void {
    this.reportDashboardEmergenciasService
      .getQueryDED(this.anio, this.periodo, this.codcas, this.tipo_asegurado)
      .subscribe({
        next: (data: any) => {
          this.numberDefunciones = data.length || 0;
          this.completedRequests++;
        },
        error: (error) => {
          console.error('Error al obtener defunciones');
          this.numberDefunciones = 0;
          this.completedRequests++;
        },
      });
  }

  getTotalEstanciasMayor24h(): void {
    this.reportDashboardEmergenciasService
      .getQueryDEMY24HR(this.anio, this.periodo, this.codcas, this.tipo_asegurado)
      .subscribe({
        next: (data: any) => {
          this.estanciasMayor24h = data;
          const des_estanciaAggMap = new Map<string, number>();
          for (const item of data) {
            const des_estancia = item.des_estancia || 'Desconocido';
            const total = Number((item as any).total || 0);
            des_estanciaAggMap.set(
              des_estancia,
              (des_estanciaAggMap.get(des_estancia) || 0) + total,
            );
          }
          let totalEstanciasMayor24h = 0;
          des_estanciaAggMap.forEach((value) => {
            totalEstanciasMayor24h += value;
          });

          this.numberEstanciasMayor24h = totalEstanciasMayor24h || 0;

          this.completedRequests++;
        },
        error: (error) => {
          console.error('Error al obtener estancias mayor 24h');
          this.estanciasMayor24h = 0;
          this.completedRequests++;
        },
      });
  }

  getTotalEstanciasMenor24h(): void {
    this.reportDashboardEmergenciasService
      .getQueryDEMN24HR(this.anio, this.periodo, this.codcas, this.tipo_asegurado)
      .subscribe({
        next: (data: any) => {
          const des_estanciaAggMap = new Map<string, number>();
          this.estanciasMenor24h = data || [];
          for (const item of data) {
            const des_estancia = item.des_estancia || 'Desconocido';
            const total = Number((item as any).total || 0);
            des_estanciaAggMap.set(
              des_estancia,
              (des_estanciaAggMap.get(des_estancia) || 0) + total,
            );
          }
          let totalEstanciasMenor24h = 0;
          des_estanciaAggMap.forEach((value) => {
            totalEstanciasMenor24h += value;
          });

          this.numberEstanciasMenor24h = totalEstanciasMenor24h || 0;
          this.completedRequests++;
        },
        error: (error) => {
          console.error('Error al obtener estancias menor 24h');
          this.estanciasMenor24h = 0;
          this.completedRequests++;
        },
      });
  }

  downloadCSV(): void {
    const headers = [
      'Fecha',
      'Prioridad 1',
      'Prioridad 2',
      'Prioridad 3',
      'Prioridad 4',
      'Prioridad 5',
      'Defunciones',
      'Estancias > 24h',
      'Estancias < 24h',
    ];
    const data = [
      [
        this.currentDate,
        this.numberPrioridad1,
        this.numberPrioridad2,
        this.numberPrioridad3,
        this.numberPrioridad4,
        this.numberPrioridad5,
        this.numberDefunciones,
        this.numberEstanciasMayor24h,
        this.numberEstanciasMenor24h,
      ],
    ];

    let csv = headers.join(',') + '\n';
    data.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-eme-${this.currentDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
