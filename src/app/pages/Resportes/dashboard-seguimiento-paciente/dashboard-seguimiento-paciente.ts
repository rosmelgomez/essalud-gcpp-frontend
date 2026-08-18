import { Component, OnInit } from '@angular/core';
import { SeguimientoPacienteService } from '../../../services/reportes/seguimiento-paciente-service';
import { ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dashboard-seguimiento-paciente',
  imports: [CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,],
  templateUrl: './dashboard-seguimiento-paciente.html',
  styleUrl: './dashboard-seguimiento-paciente.css',
})
export class DashboardSeguimientoPaciente implements OnInit {

  //filtros
  documento: string = '';
  tipo_documento: number = 0;

  //data
  dataQuery1SPA: any[] = [];
  dataQuery2SPA: any[] = [];

  // Estados para datos
  ingreseDocumento: boolean = true;
  loadingSPA: boolean = false;
  errorSPA: string | null = null;
  noDataSPA: boolean = false;

  constructor(
    private seguimientoPacienteService: SeguimientoPacienteService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    ///this.loadAtenciones();
  }


  loadAtenciones() {

    if (!this.documento || !this.tipo_documento) {
      this.errorSPA = 'Por favor, complete todos los campos de filtro.';
      this.loadingSPA = false;
      this.noDataSPA = false;
      return;
    }
    this.loadingSPA = true;
    this.ingreseDocumento = false;
    this.errorSPA = null;
    this.noDataSPA = false;
    this.cdr.detectChanges();

    forkJoin({
      query1: this.seguimientoPacienteService.getQuery1SPA(this.documento, this.tipo_documento),
      query2: this.seguimientoPacienteService.getQuery2SPA(this.documento, this.tipo_documento),
    }).subscribe({
      next: (data) => {
        this.dataQuery1SPA = data.query1;
        this.dataQuery2SPA = data.query2;

        this.loadingSPA = false;
        console.log("dataQuery1SPA " + this.dataQuery1SPA.length);
        console.log("dataQuery2SPA " + this.dataQuery2SPA.length);

        if (data.query1.length === 0 || data.query2.length === 0) {
          this.noDataSPA = true;
        } else {
          this.noDataSPA = false;
        }

        console.log("noDataSPA " + this.noDataSPA);


        this.cdr.detectChanges();
      },
      error: () => {
        this.errorSPA = 'Error al cargar los datos. Por favor, inténtelo de nuevo.';
        this.loadingSPA = false;
        this.noDataSPA = false;
        this.cdr.detectChanges();
      }
    });
  }


  ///obtener diagnostico para act_med
  diagnostico(code: any): string {
    if (code === null || code === undefined || code === '') {
      return '-';
    }

    const targetCode = String(code).trim().toLowerCase();

    const matches = (this.dataQuery2SPA || []).filter((row: any) => {
      const actoMed = row.acto_med ?? row.ACTO_MED;
      if (actoMed === null || actoMed === undefined) {
        return false;
      }
      return String(actoMed).trim().toLowerCase() === targetCode;
    });

    if (matches.length > 0) {
      const descripciones = matches
        .map((row: any) => row.diagdes ?? row.DIAGDES)
        .filter((desc: any) => desc !== null && desc !== undefined && String(desc).trim() !== '');

      return descripciones.length > 0 ? descripciones.join(', ') : '-';
    }

    return '-';
  }


  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Atenciones' = 'Atenciones';

  setActiveTab(
    tab:
      | 'Atenciones',
  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }


  getTableHeight(count?: number, itemSize: number = 48, maxHeight: number = 420): number {
    if (!count || count === 0) return itemSize;
    return Math.min(maxHeight, count * itemSize + 4);
  }



  // Descargar datos en formato CSV
  downloadCSV(): void {
    if (!this.dataQuery1SPA?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `dashboard-seguimiento-paciente.csv`;

    const dataToExport = this.dataQuery1SPA.map((row: any) => {
      const actoMed = row.ACTO_MED ?? row.acto_med;
      const diag = this.diagnostico(actoMed);

      const exportRow: any = {};
      const keys = Object.keys(row);

      for (const key of keys) {
        exportRow[key] = row[key];
        if (key.toUpperCase() === 'SERVICIO') {
          exportRow['DIAGNOSTICO'] = diag;
        }
      }

      if (!('DIAGNOSTICO' in exportRow)) {
        exportRow['DIAGNOSTICO'] = diag;
      }

      return exportRow;
    });

    const headers = Object.keys(dataToExport[0]);

    const csvContent = [
      headers.join(';'),
      ...dataToExport.map((row) =>
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
}
