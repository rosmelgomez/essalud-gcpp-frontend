import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TmiIndicadoresService } from '../../services/tmi-indicadores-service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tmi-indicadores',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './tmi-indicadores.html',
  styleUrl: './tmi-indicadores.css',
})
export class TmiIndicadores implements OnInit {

  ///data estandares
  public dataEstandar: any[] = [];
  public dataEstandarFilter: any[] = [];

  ///estado estandares
  public loadingEstandar: boolean = false;
  public errorEstandar: string = '';
  public mostrarFormularioEstandar: boolean = false;


  ///data centros tmi
  public dataCentrosTMI: any[] = [];
  public dataCentrosTMIFilter: any[] = [];

  ///estado centros tmi
  public loadingCentrosTMI: boolean = false;
  public errorCentrosTMI: string = '';
  public mostrarFormularioCentrosTMI: boolean = false;

  ///formularios
  public estandarForm!: FormGroup;
  public centrosForm!: FormGroup;

  constructor(
    private tmiIndicadoresService: TmiIndicadoresService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.getQueryEstandares();
    this.getQueryCentrosTMI();
  }

  reactiveForm() {
    this.estandarForm = this.formBuilder.group({
      id: ['', []],
      orden_indicador: ['', [Validators.required]],
      codigo_unico: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      indicador: ['', [Validators.required]],
      nivel_centro: ['', [Validators.required]],
      tipo_centro: ['', [Validators.required]],
      nivel_estandar_centro: ['', [Validators.required]],
      estandar: ['', [Validators.required]],
      acept: ['', [Validators.required]],
      aceptmenos: ['', [Validators.required]],

    });

    this.centrosForm = this.formBuilder.group({
      id: ['', []],
      red: ['', [Validators.required]],
      orden: ['', [Validators.required]],
      orden_tipo: ['', [Validators.required]],
      codcentro: ['', [Validators.required]],
      tipo: ['', [Validators.required]],
      nivel: ['', [Validators.required]],
      nivel_estandar: ['', [Validators.required]],
      centro: ['', [Validators.required]],
      estado: ['', [Validators.required]],
    });

  }


  getQueryEstandares() {

    this.loadingEstandar = true;
    this.errorEstandar = '';

    this.tmiIndicadoresService.getQueryEstandares().subscribe(
      (res: any) => {
        console.log(res);
        this.dataEstandar = res;
        this.dataEstandarFilter = res;

        this.loadingEstandar = false;
        this.mostrarFormularioEstandar = false;
      },
      (error: any) => {
        console.log(error);
        this.errorEstandar = error;
        this.loadingEstandar = false;
        this.loadingCentrosTMI = false;
      }
    );
    this.cdr.detectChanges();
  }

  updateQueryEstandar() {

    console.log(this.estandarForm.value);
    this.tmiIndicadoresService.putQueryEstandares(this.estandarForm.value).subscribe(
      (res: any) => {
        console.log(res);
        this.getQueryEstandares();
        this.mostrarFormularioEstandar = false
        alert("Data actualizada correctamente")
      },
      (error: any) => {
        console.log(error);
        this.errorEstandar = error;
        this.loadingEstandar = false;
        alert("Error al actualizar data")
      }
    );
    this.cdr.detectChanges();
  }


  getQueryCentrosTMI() {

    this.loadingCentrosTMI = true;
    this.errorCentrosTMI = '';

    this.tmiIndicadoresService.getQueryCentrosTMI().subscribe(
      (res: any) => {
        console.log(res);
        this.dataCentrosTMI = res;
        this.dataCentrosTMIFilter = res;

        this.loadingCentrosTMI = false;
        this.mostrarFormularioCentrosTMI = false;
      },
      (error: any) => {
        console.log(error);
        this.errorCentrosTMI = error;
        this.loadingCentrosTMI = false;
      }
    );
  }


  updateQueryCentrosTMI() {
    console.log(this.centrosForm.value);
    this.tmiIndicadoresService.putQueryCentrosTMI(this.centrosForm.value).subscribe(
      (res: any) => {
        console.log(res);
        this.getQueryCentrosTMI();
        this.mostrarFormularioCentrosTMI = false
        alert("Data actualizada correctamente")
      },
      (error: any) => {
        console.log(error);
        this.errorCentrosTMI = error;
        this.loadingCentrosTMI = false;
        alert("Error al actualizar data")
      }
    );
    this.cdr.detectChanges();

  }

  ///filtros estandares
  filtersEstandares = {
    "id": "",
    "orden_indicador": "",
    "codigo_unico": "",
    "tipo": "",
    "indicador": "",
    "nivel_centro": "",
    "tipo_centro": "",
    "nivel_estandar_centro": "",
    "estandar": "",
    "acept": "",
    "aceptmenos": ""
  }

  ///filtro dinamico para la tabla indicadores
  filterDataEstandares(column: keyof typeof this.filtersEstandares, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersEstandares[column] = filterValue;
    const filtered = this.dataEstandarFilter.filter((row) => this.applyAllFiltersEstandares(row));
    this.dataEstandar = filtered;
  }

  private applyAllFiltersEstandares(row: any): boolean {
    // Filtro id
    if (this.filtersEstandares.id && !row.id.toLowerCase().includes(this.filtersEstandares.id)
    ) { return false; }
    // Filtro orden_indicador
    if (this.filtersEstandares.orden_indicador && !row.orden_indicador.toLowerCase().includes(this.filtersEstandares.orden_indicador)) {
      return false;
    }
    // Filtro codigo_unico
    if (this.filtersEstandares.codigo_unico && !row.codigo_unico.toLowerCase().includes(this.filtersEstandares.codigo_unico)) {
      return false;
    }
    // Filtro tipo
    if (this.filtersEstandares.tipo && !row.tipo.toLowerCase().includes(this.filtersEstandares.tipo)) {
      return false;
    }
    // Filtro indicador
    if (this.filtersEstandares.indicador && !row.indicador.toLowerCase().includes(this.filtersEstandares.indicador)) {
      return false;
    }
    // Filtro nivel_centro
    if (this.filtersEstandares.nivel_centro && !row.nivel_centro.toLowerCase().includes(this.filtersEstandares.nivel_centro)) {
      return false;
    }
    // Filtro tipo_centro
    if (this.filtersEstandares.tipo_centro && !row.tipo_centro.toLowerCase().includes(this.filtersEstandares.tipo_centro)) {
      return false;
    }
    // Filtro nivel_estandar_centro
    if (this.filtersEstandares.nivel_estandar_centro && !row.nivel_estandar_centro.toLowerCase().includes(this.filtersEstandares.nivel_estandar_centro)) {
      return false;
    }
    // Filtro estandar
    if (this.filtersEstandares.estandar && !row.estandar.toLowerCase().includes(this.filtersEstandares.estandar)) {
      return false;
    }
    // Filtro acept
    if (this.filtersEstandares.acept && !row.acept.toLowerCase().includes(this.filtersEstandares.acept)) {
      return false;
    }
    // Filtro aceptmenos
    if (this.filtersEstandares.aceptmenos && !row.aceptmenos.toLowerCase().includes(this.filtersEstandares.aceptmenos)) {
      return false;
    }

    return true;
  }


  ///filtros centros tmi
  filtersCentrosTMI = {
    "id": "",
    "red": "",
    "orden": "",
    "orden_tipo": "",
    "codcentro": "",
    "tipo": "",
    "nivel": "",
    "nivel_estandar": "",
    "centro": "",
    "estado": ""
  }

  ///filtro dinamico para la tabla centros tmi
  filterDataCentrosTMI(column: keyof typeof this.filtersCentrosTMI, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersCentrosTMI[column] = filterValue;
    const filtered = this.dataCentrosTMIFilter.filter((row) => this.applyAllFiltersCentrosTMI(row));
    this.dataCentrosTMI = filtered;
  }

  private applyAllFiltersCentrosTMI(row: any): boolean {
    // Filtro id
    if (this.filtersCentrosTMI.id && !row.id.toLowerCase().includes(this.filtersCentrosTMI.id)) { return false; }
    // Filtro red
    if (this.filtersCentrosTMI.red && !row.red.toLowerCase().includes(this.filtersCentrosTMI.red)) {
      return false;
    }
    // Filtro orden
    if (this.filtersCentrosTMI.orden && !row.orden.toLowerCase().includes(this.filtersCentrosTMI.orden)) {
      return false;
    }
    // Filtro orden_tipo
    if (this.filtersCentrosTMI.orden_tipo && !row.orden_tipo.toLowerCase().includes(this.filtersCentrosTMI.orden_tipo)) {
      return false;
    }
    // Filtro codcentro
    if (this.filtersCentrosTMI.codcentro && !row.codcentro.toLowerCase().includes(this.filtersCentrosTMI.codcentro)) {
      return false;
    }
    // Filtro tipo
    if (this.filtersCentrosTMI.tipo && !row.tipo.toLowerCase().includes(this.filtersCentrosTMI.tipo)) {
      return false;
    }
    // Filtro nivel
    if (this.filtersCentrosTMI.nivel && !row.nivel.toLowerCase().includes(this.filtersCentrosTMI.nivel)) {
      return false;
    }
    // Filtro nivel_estandar
    if (this.filtersCentrosTMI.nivel_estandar && !row.nivel_estandar.toLowerCase().includes(this.filtersCentrosTMI.nivel_estandar)) {
      return false;
    }
    // Filtro centro
    if (this.filtersCentrosTMI.centro && !row.centro.toLowerCase().includes(this.filtersCentrosTMI.centro)) {
      return false;
    }
    // Filtro estado
    if (this.filtersCentrosTMI.estado && !row.estado.toLowerCase().includes(this.filtersCentrosTMI.estado)) {
      return false;
    }

    return true;
  }





  // Tabs
  activeTab:
    | 'Estandares tmi'
    | 'Centros tmi' = 'Estandares tmi';

  setActiveTab(
    tab:
      | 'Estandares tmi'
      | 'Centros tmi'
  ): void {
    this.activeTab = tab;

    if (tab === 'Estandares tmi') {
      this.getQueryEstandares();
    } else if (tab === 'Centros tmi') {
      this.getQueryCentrosTMI();
    }

    this.cdr.detectChanges();
  }


}
