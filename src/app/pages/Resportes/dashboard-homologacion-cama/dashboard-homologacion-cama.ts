import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { TablasHomologadasService } from '../../../services/tablas-homologadas-service';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ClasificacionCamas } from '../../../model/clasificacion-camas';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-homologacion-cama',
  imports: [CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,],
  templateUrl: './dashboard-homologacion-cama.html',
  styleUrl: './dashboard-homologacion-cama.css',
})
export class DashboardHomologacionCama implements OnInit {
  nameCentro: string = '';
  codcas: string = '';

  dataCamas: any[] = [];
  dataCamasFilter: any[] = [];

  valoresClasificacion: Record<string, string> = {};

  filtersCamas = {
    "oricenasicod": "",
    "cenasicod": "",
    "arehoscod": "",
    "servhoscod": "",
    "estenfcod": "",
    "habcod": "",
    "camcod": "",
    "tipcamcod": "",
    "estcamcod": "",
    "camobsdes": "",
    "camestregcod": "",
    "camflgfun": "",
    "cametiqcod": "",
    "arehosdes": "",
    "cenasides": "",
    "servhosdes": "",
    "descripcion_clasificacion": ""
  }

  constructor(
    private dataImport: LocalStorageService,
    private tablasHomologadasService: TablasHomologadasService,
    private cdr: ChangeDetectorRef,
  ) { }


  ngOnInit(): void {
    this.nameCentro = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
    this.loadDataCamas();
  }

  loadDataCamas(): void {
    this.tablasHomologadasService.getQueryTHCAMA(this.codcas).subscribe({
      next: (response) => {
        console.log(response);
        this.dataCamas = response;
        this.dataCamasFilter = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos de camas:', error);
      },
    });
  }
  registrarClasificacion(): void {
    this.submitClasificacionCamas(false);
  }

  actualizarClasificacion(): void {
    this.submitClasificacionCamas(true);
  }

  private submitClasificacionCamas(isUpdate: boolean): void {

    const clasificacion = this.buildClasificacionFromSelect();
    if (!clasificacion) {
      return;
    }

    const solicitudes = clasificacion.map((clasi) =>
      isUpdate
        ? this.tablasHomologadasService.updateClasificacionCamas(clasi)
        : this.tablasHomologadasService.registerClasificacionCamas(clasi)
    );

    forkJoin(solicitudes).subscribe({
      next: (responses) => {
        console.log(responses);
        this.loadDataCamas();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al registrar o actualizar datos de camas:', error);
        this.cdr.markForCheck();
      },
    });


  }

  private buildClasificacionFromSelect(): ClasificacionCamas[] | null {

    const clasificacion: ClasificacionCamas[] = [];

    Object.entries(this.valoresClasificacion).forEach(([key, value]) => {
      const item = this.dataCamasFilter.find((row) => row.cenasicod === key);
      if (!item) {
        return;
      }

      const id_clasificacion = item.id_clasificacion || 0;
      const cenasicod = item.cenasicod;
      const camcod = item.camcod;
      const arehoscod = item.arehoscod;
      const habcod = item.habcod;
      const servhoscod = item.servhoscod;
      const descripcion = this.valoresClasificacion[key] ?? 'sin calificacion';

      clasificacion.push({
        id: id_clasificacion,
        codcas: this.codcas,
        camcod: camcod,
        arehoscod: arehoscod,
        habcod: habcod,
        servhoscod: servhoscod,
        descripcion: descripcion
      });

    });

    return clasificacion;

  }













  filterDataCamas(column: keyof typeof this.filtersCamas, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersCamas[column] = filterValue;
    const filtered = this.dataCamasFilter.filter((row) => this.applyAllFiltersCamas(row));
    this.dataCamas = filtered;
  }

  private applyAllFiltersCamas(row: any): boolean {
    // Filtro oricenasicod
    if (
      this.filtersCamas.oricenasicod &&
      !row.oricenasicod.toLowerCase().includes(this.filtersCamas.oricenasicod)
    ) {
      return false;
    }
    // Filtro cenario
    if (
      this.filtersCamas.cenasicod &&
      !row.cenasicod.toLowerCase().includes(this.filtersCamas.cenasicod)
    ) {
      return false;
    }
    // Filtro area
    if (
      this.filtersCamas.arehoscod &&
      !row.arehoscod.toLowerCase().includes(this.filtersCamas.arehoscod)
    ) {
      return false;
    }
    // Filtro servicio
    if (
      this.filtersCamas.servhoscod &&
      !row.servhoscod.toLowerCase().includes(this.filtersCamas.servhoscod)
    ) {
      return false;
    }
    // Filtro estenfcod
    if (
      this.filtersCamas.estenfcod &&
      !row.estenfcod.toLowerCase().includes(this.filtersCamas.estenfcod)
    ) {
      return false;
    }
    // Filtro habcod
    if (
      this.filtersCamas.habcod &&
      !row.habcod.toLowerCase().includes(this.filtersCamas.habcod)
    ) {
      return false;
    }
    // Filtro camcod
    if (
      this.filtersCamas.camcod &&
      !row.camcod.toLowerCase().includes(this.filtersCamas.camcod)
    ) {
      return false;
    }
    // Filtro tipcamcod
    if (
      this.filtersCamas.tipcamcod &&
      !row.tipcamcod.toLowerCase().includes(this.filtersCamas.tipcamcod)
    ) {
      return false;
    }
    // Filtro estcamcod
    if (
      this.filtersCamas.estcamcod &&
      !row.estcamcod.toLowerCase().includes(this.filtersCamas.estcamcod)
    ) {
      return false;
    }
    // Filtro camobsdes
    if (
      this.filtersCamas.camobsdes &&
      !row.camobsdes.toLowerCase().includes(this.filtersCamas.camobsdes)
    ) {
      return false;
    }
    // Filtro camestregcod
    if (
      this.filtersCamas.camestregcod &&
      !row.camestregcod.toLowerCase().includes(this.filtersCamas.camestregcod)
    ) {
      return false;
    }
    // Filtro camflgfun
    if (
      this.filtersCamas.camflgfun &&
      !row.camflgfun.toLowerCase().includes(this.filtersCamas.camflgfun)
    ) {
      return false;
    }
    // Filtro cametiqcod
    if (
      this.filtersCamas.cametiqcod &&
      !row.camtiqcod.toLowerCase().includes(this.filtersCamas.cametiqcod)
    ) {
      return false;
    }
    // Filtro cenasides
    if (
      this.filtersCamas.cenasides &&
      !row.cenasides.toLowerCase().includes(this.filtersCamas.cenasides)
    ) {
      return false;
    }

    //Filtro arehosdes
    if (
      this.filtersCamas.arehosdes &&
      !row.arehosdes.toLowerCase().includes(this.filtersCamas.arehosdes)
    ) {
      return false;
    }


    // Filtro servhosdes
    if (
      this.filtersCamas.servhosdes &&
      !row.servhosdes.toLowerCase().includes(this.filtersCamas.servhosdes)
    ) {
      return false;
    }

    // Filtro descripcion_clasificacion
    if (
      this.filtersCamas.descripcion_clasificacion &&
      !row.descripcion_clasificacion.toLowerCase().includes(this.filtersCamas.descripcion_clasificacion)
    ) {
      return false;
    }


    return true;
  }






}
