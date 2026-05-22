import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TramasService } from '../../../services/tramas-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-report-dashboard-tramas',
  imports: [CommonModule, FormsModule, MatTableModule, MatCardModule,
    MatButtonModule, MatPaginatorModule, MatSortModule, ScrollingModule],
  templateUrl: './report-dashboard-tramas.html',
  styleUrl: './report-dashboard-tramas.css',
})
export class ReportDashboardTramas implements OnInit {


  currentDate: string = '';

  centroAtencion: string = 'Red Asistencial Rebagliati';

  /// data establecimiento
  centros: any[] = []

  //Estados para tramas Tabla B1
  loadingTTB1: boolean = false;
  errorTTB1: string | null = null;
  noDataTTB1: boolean = false;
  selectFiltroTTB1: boolean = false;

  //Estados para tramas Tabla B2
  loadingTTB2: boolean = false;
  errorTTB2: string | null = null;
  noDataTTB2: boolean = false;
  selectFiltroTTB2: boolean = false;

  //data tabla B1
  tramasTablaB1: any[] = [];
  tramasTablaB1muestra: any[] = [];

  //data tabla B2
  tramasTablaB2: any[] = [];
  tramasTablaB2muestra: any[] = [];

  //filtro tramas Tabla B1
  fechaInicioB1: string = '';
  fechaFinB1: string = '';
  codcasB1: string = '';

  //filtro tramas Tabla B2
  fechaInicioB2: string = '';
  fechaFinB2: string = '';
  codcasB2: string = '';

  constructor(
    private tramasService: TramasService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCentros();
  }

  loadCentros() {
    this.establecimientoService.getCentros().subscribe((data) => {
      this.centros = data;
    });
  }

  formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}${parts[1]}${parts[0]}`;
  }

  loadQueryTablaB1(fechaInicioB1: string, fechaFinB1: string, codcasB1: string) {

    if (!fechaInicioB1 || !fechaFinB1 || !codcasB1) {
      this.selectFiltroTTB1 = false;
      return;
    }
    this.selectFiltroTTB1 = true;
    this.loadingTTB1 = true;
    this.errorTTB1 = null;
    this.noDataTTB1 = false;


    const fechaInicioB1Format = this.formatDateToDDMMYYYY(fechaInicioB1);
    const fechaFinB1Format = this.formatDateToDDMMYYYY(fechaFinB1);

    console.log(fechaInicioB1Format);
    console.log(fechaFinB1Format);
    console.log(codcasB1);

    if (fechaInicioB1Format && fechaFinB1Format) {
      this.tramasService.getQueryTablaB1(fechaInicioB1Format, fechaFinB1Format, codcasB1).subscribe({
        next: (data) => {
          console.log(data);
          this.tramasTablaB1 = data;
          this.tramasTablaB1muestra = data ? data.slice(0, 20) : [];
          this.loadingTTB1 = false;
          this.noDataTTB1 = false;
          this.errorTTB1 = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loadingTTB1 = false;
          this.errorTTB1 = error;
          this.noDataTTB1 = false;
          this.cdr.detectChanges();
        }
      }
      );
    }
  }



  loadQueryTablaB2(fechaInicioB2: string, fechaFinB2: string, codcasB2: string) {

    if (!fechaInicioB2 || !fechaFinB2 || !codcasB2) {
      this.selectFiltroTTB2 = false;
      return;
    }
    this.selectFiltroTTB2 = true;
    this.loadingTTB2 = true;
    this.errorTTB2 = null;
    this.noDataTTB2 = false;

    const fechaInicioB2Format = this.formatDateToDDMMYYYY(fechaInicioB2);
    const fechaFinB2Format = this.formatDateToDDMMYYYY(fechaFinB2);

    console.log(fechaInicioB2Format);
    console.log(fechaFinB2Format);
    console.log(codcasB2);

    if (fechaInicioB2Format && fechaFinB2Format) {
      this.tramasService.getQueryTablaB2(fechaInicioB2Format, fechaFinB2Format, codcasB2).subscribe({
        next: (data) => {
          console.log(data);
          this.tramasTablaB2 = data;
          this.tramasTablaB2muestra = data ? data.slice(0, 20) : [];
          this.loadingTTB2 = false;
          this.noDataTTB2 = false;
          this.errorTTB2 = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loadingTTB2 = false;
          this.errorTTB2 = error;
          this.noDataTTB2 = false;
          this.cdr.detectChanges();
        }
      }
      );
    }
  }

  // Tabs
  activeTab:
    | 'Tramas Tabla B1'

    | 'Tramas Tabla B2' = 'Tramas Tabla B1';

  setActiveTab(
    tab:
      | 'Tramas Tabla B1'
      | 'Tramas Tabla B2',
  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

}
