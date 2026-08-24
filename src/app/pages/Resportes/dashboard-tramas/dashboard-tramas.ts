import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { TramasService } from '../../../services/tramas-service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { LocalStorageService } from '../../../services/local-storage-service';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { User } from '../../../model/user';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';

@Component({
  selector: 'app-dashboard-tramas',
  imports: [CommonModule, FormsModule, MatTableModule, MatCardModule,
    MatButtonModule, MatPaginatorModule, MatSortModule, ScrollingModule],
  templateUrl: './dashboard-tramas.html',
  styleUrl: './dashboard-tramas.css',
})
export class DashboardTramas implements OnInit {

  public centroForm!: FormGroup;

  currentDate: string = '';

  // Datos para el dropdown de Centro Asistencial
  dataCentro: any = [];
  dataCentroCompleto: any[] = [];
  filteredCentro: any = [];
  searchCentro: string = '';
  isDropdownOpen: boolean = false;
  selectedCentroName: string = '';
  activeCentroIndex: number = -1;
  showSurveyReminder: boolean = false;
  surveyReminderError: string = '';

  /// data usuario
  user: User | null = null;


  @ViewChildren('centroOption') centroOptions!: QueryList<ElementRef<HTMLElement>>;

  // Datos para el dropdown de Red Asistencial
  dataRed: any[] = [];
  filteredRed: any = [];
  searchRed: string = '';
  isDropdownRedOpen: boolean = false;
  selectedRedName: string = '';

  activeRedIndex: number = -1;

  /// data establecimiento
  centros: any[] = []
  nameRed: string = '';
  nameCentro: string = '';

  /* Estados */
  selectCentro: boolean = false;

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
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService
  ) {
    this.loadFechaActualizacion();
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

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }
  ngOnInit(): void {
    this.user = this.dataImport.getUser();
    this.getCentro();

    const selectedCentro = this.dataImport.getDataCentro();
    if (selectedCentro && selectedCentro.codcas) {
      this.codcasB1 = selectedCentro.codcas;
      this.codcasB2 = selectedCentro.codcas;
      this.selectedCentroName = selectedCentro.nameCentro || '';
    } else {
      const isUser = Array.isArray(this.user?.roles) ? this.user?.roles.includes('USER') : this.user?.roles === 'USER';
      if (isUser && this.user?.codcas) {
        const codcas = this.user.codcas.toString();
        this.codcasB1 = codcas;
        this.codcasB2 = codcas;
      }
    }
  }

  getCentro() {
    const isUser = Array.isArray(this.user?.roles) ? this.user?.roles.includes('USER') : this.user?.roles === 'USER';
    const isAdminRed = Array.isArray(this.user?.roles) ? this.user?.roles.includes('ADMIN_RED') : this.user?.roles === 'ADMIN_RED';

    if (isAdminRed) {
      this.selectCentro = false;
      const codeRed = this.user?.codred?.toString() || '';
      this.establecimientoService.getCentrosByRed(codeRed).subscribe({
        next: (resp) => {
          this.dataCentro = resp;
          this.centros = resp;
          this.nameRed = resp.length > 0 ? resp[0].redasisdes : '';
          if (this.codcasB1) {
            const found = resp.find((centro: any) => centro.cenasicod === this.codcasB1);
            if (found) {
              this.selectedCentroName = found.cenasides || '';
              this.nameCentro = found.cenasides || '';
            }
          }
          this.cdr.detectChanges();
        },
        error: () => {
          console.log('Error al obtener los centros por red');
        },
      });
    } else {
      // Para usuarios USER, establecer selectCentro = true ANTES de la suscripción asincrónica
      if (isUser) {
        this.selectCentro = true;
      }

      this.establecimientoService.getCentros().subscribe({
        next: (resp) => {
          this.dataCentro = resp;
          this.centros = resp;
          if (this.codcasB1) {
            const found = resp.find((centro: any) => centro.cenasicod === this.codcasB1);
            if (found) {
              this.selectedCentroName = found.cenasides || '';
              this.nameCentro = found.cenasides || '';
            }
          }
          if (isUser) {
            const codcas = this.user?.codcas?.toString();
            this.nameCentro = this.dataCentro.find((centro: any) => centro.cenasicod === codcas)?.cenasides || '';
          }
          this.cdr.detectChanges();
        },
      });
    }
  }


  // Métodos para Centro Asistencial
  filterCentro(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchCentro = searchValue;
    this.isDropdownOpen = true;

    if (searchValue.trim() === '') {
      this.filteredCentro = this.dataCentro;
    } else {
      this.filteredCentro = this.dataCentro.filter((centro: any) =>
        centro.cenasides.toLowerCase().includes(searchValue),
      );
    }
    const centroOptions = this.getCentroOptions();
    this.activeCentroIndex = centroOptions.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }

  openDropdown() {
    this.isDropdownOpen = true;
    this.filteredCentro = this.dataCentro;
    this.activeCentroIndex = this.filteredCentro.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
  }

  selectDropdownOption(centro: any) {
    this.selectedCentroName = centro.cenasides;
    this.codcasB1 = centro.cenasicod;
    this.isDropdownOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
  }

  private restoreAllCentros() {
    if (this.dataCentroCompleto.length > 0) {
      this.dataCentro = this.dataCentroCompleto;
      this.filteredCentro = this.dataCentroCompleto;
    }
  }

  private getCentroOptions(): any[] {
    return this.searchCentro ? this.filteredCentro : this.dataCentro;
  }


  handleCentroKeydown(event: KeyboardEvent) {
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownOpen) {
        this.openDropdown();
      }
      const options = this.getCentroOptions();
      if (options.length === 0) {
        this.activeCentroIndex = -1;
        return;
      }
      this.activeCentroIndex = Math.min(this.activeCentroIndex + 1, options.length - 1);
      this.scrollActiveCentroIntoView();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isDropdownOpen) {
        this.openDropdown();
      }
      const options = this.getCentroOptions();
      if (options.length === 0) {
        this.activeCentroIndex = -1;
        return;
      }
      this.activeCentroIndex = Math.max(this.activeCentroIndex - 1, 0);
      this.scrollActiveCentroIntoView();
      return;
    }

    if (key === 'Enter') {
      if (!this.isDropdownOpen) {
        return;
      }
      event.preventDefault();
      const options = this.getCentroOptions();
      const index = this.activeCentroIndex >= 0 ? this.activeCentroIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectDropdownOption(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdown();
    }
  }


  private scrollActiveCentroIntoView() {
    if (!this.isDropdownOpen || this.activeCentroIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.centroOptions?.toArray();
      const target = items?.[this.activeCentroIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }


  changeCentro() {
    if (this.dataCentro.length === 0) {
      this.getCentro();
    }
    this.selectCentro = false;
    this.selectedCentroName = '';
    this.selectedRedName = '';
    this.searchCentro = '';
    this.searchRed = '';
    this.activeCentroIndex = -1;
    this.activeRedIndex = -1;
    this.centroForm.reset();

    // Para admin, al cambiar centro se vuelve al estado sin filtro de red.
    if (Array.isArray(this.user?.roles) ? this.user?.roles.includes('ADMIN') : this.user?.roles === 'ADMIN') {
      this.restoreAllCentros();
    }
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

    ///direfencia de dias entre la fecha fin e inicio 
    const dias = Math.floor((Date.parse(fechaFinB1) - Date.parse(fechaInicioB1)) / (1000 * 60 * 60 * 24));

    if (fechaInicioB1Format && fechaFinB1Format && dias <= 31) {
      this.tramasService.getQueryTablaB1(fechaInicioB1Format, fechaFinB1Format, codcasB1).subscribe({
        next: (data) => {
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
    } else {
      this.loadingTTB1 = false;
      this.errorTTB1 = 'La diferencia entre la fecha de fin y la fecha de inicio no debe exceder los 31 días';
      this.noDataTTB1 = true;
      this.cdr.detectChanges();
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
    const dias = Math.floor((Date.parse(fechaFinB2) - Date.parse(fechaInicioB2)) / (1000 * 60 * 60 * 24));

    if (fechaInicioB2Format && fechaFinB2Format && dias <= 31) {
      this.tramasService.getQueryTablaB2(fechaInicioB2Format, fechaFinB2Format, codcasB2).subscribe({
        next: (data) => {
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
    } else {
      this.loadingTTB2 = false;
      this.errorTTB2 = 'La diferencia entre la fecha de fin y la fecha de inicio no debe exceder los 31 días';
      this.noDataTTB2 = true;
      this.cdr.detectChanges();
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


  exportarExcelTablaB1() {
    if (this.tramasTablaB1.length === 0) {
      console.warn('No hay datos para descargar');
      return;
    }

    // Construir el CSV
    const csvContent = [
      // Encabezados
      Object.keys(this.tramasTablaB1[0]).join(','),
      // Filas de datos
      ...this.tramasTablaB1.map(row =>
        Object.values(row).map(value => `"${value}"`).join(',')
      )
    ].join('\n');

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'tramas_tabla_b1.xlsx';
    link.click();
    URL.revokeObjectURL(url);

  }

  exportarExcelTablaB2(): void {
    if (!this.tramasTablaB2?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `tramas_tabla_b2.xlsx`;

    const headers = Object.keys(this.tramasTablaB1[0]);
    const csvContent = [
      headers.join(';'),
      ...this.tramasTablaB1.map((row) =>
        headers.map((h) => `="${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

}
