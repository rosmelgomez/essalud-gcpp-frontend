import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Backend } from '../../model/api';
import { TmiCatalogo, TmiGrupoActividadServicio } from './tmi-models';

const base_url = Backend.apiTmi + '/dinamico';

/** Catálogos de TOTALIZADO3 y DIM_*: grupos, actividades, servicios y tipos de cálculo. */
@Injectable({ providedIn: 'root' })
export class TmiCatalogoService {
  constructor(private http: HttpClient) { }

  private relacionGas$?: Observable<TmiGrupoActividadServicio[]>;
  /** Relación grupo -> actividad -> servicio; se pide una sola vez y la comparten los formularios. */
  getGrupoActividadServicio() {
    this.relacionGas$ ??= this.http
      .get<TmiGrupoActividadServicio[]>(`${base_url}/catalogo/grupo-actividad-servicio`)
      .pipe(shareReplay(1));
    return this.relacionGas$;
  }

  getGrupos() {
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/grupos`);
  }
  getGruposReporte() {
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/grupos-reporte`);
  }
  getActividades() {
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/actividades`);
  }
  getServicios(tipgrupo: number, actividad: number) {
    return this.http.get<TmiCatalogo[]>(`${base_url}/catalogo/servicios/${tipgrupo}/${actividad}`);
  }
  getTiposCalculo() {
    return this.http.get<{ codigo: string; descripcion: string }[]>(`${base_url}/catalogo/tipos-calculo`);
  }
}
