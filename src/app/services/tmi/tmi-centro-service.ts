import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiCatalogosCentro, TmiCentroCatalogo, TmiCentroEstandar, TmiCentroEstandarPeriodo } from './tmi-models';

const base_url = Backend.apiTmi + '/centro';

/** Centros TMI, exclusión de centro por indicador y estándares propios de centro. */
@Injectable({ providedIn: 'root' })
export class TmiCentroService {
  constructor(private http: HttpClient) { }

  /// centros TMI
  getQueryCentrosTMI() {
    return this.http.get<any[]>(base_url + `/lista-centros`);
  }
  putQueryCentrosTMI(dto: any) {
    return this.http.put(base_url + `/update-centro`, dto);
  }
  postQueryCentrosTMI(dto: any) {
    return this.http.post(base_url + `/create-centro`, dto);
  }
  deleteQueryCentrosTMI(id: number) {
    return this.http.delete(base_url + `/delete-centro/${id}`);
  }
  /** Centros activos con red, tipo, nivel y categoría, para los formularios. */
  getCentros() {
    return this.http.get<TmiCentroCatalogo[]>(`${base_url}/catalogo/centros`);
  }

  /** Catálogos de nivel, tipo y categoría (nivel_centro, tipo_centro, categoria_centro), en su orden. */
  getCatalogosCentro() {
    return this.http.get<TmiCatalogosCentro>(`${base_url}/catalogos-centro`);
  }

  /// exclusion centro estandar
  getQueryExclusionCentroEstandar(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-exclusion-centro-estandar/${anio}`);
  }
  putQueryExclusionCentroEstandar(dto: any) {
    return this.http.put(base_url + `/update-exclusion-centro-estandar`, dto);
  }
  postQueryExclusionCentroEstandar(dto: any) {
    return this.http.post(base_url + `/create-exclusion-centro-estandar`, dto);
  }
  /** Con mes (1-12): solo quita la exclusión de ese periodo; sin mes, todo el año. */
  deleteQueryExclusionCentroEstandar(id: number, mes?: number) {
    return this.http.delete(base_url + `/delete-exclusion-centro-estandar/${id}` + (mes ? `?mes=${mes}` : ''));
  }

  // estándares específicos de centro
  getCentroEstandar(anio: number, mes?: number) {
    return this.http.get<TmiCentroEstandarPeriodo>(`${base_url}/centro-estandar/${anio}`, { params: mes ? { mes } : {} }); 
  }
  postCentroEstandar(dto: TmiCentroEstandar) { 
    return this.http.post(`${base_url}/centro-estandar`, dto); 
  }
  putCentroEstandar(id: number, dto: TmiCentroEstandar) { 
    return this.http.put(`${base_url}/centro-estandar/${id}`, dto); 
  }
  deleteCentroEstandar(id: number) { 
    return this.http.delete(`${base_url}/centro-estandar/${id}`); 
  }
}
