import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiCentroCatalogo, TmiCentroEstandar } from './tmi-models';

const base_url = Backend.apiTmi;
const dinamico_url = Backend.apiTmi + '/dinamico';

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
    return this.http.get<TmiCentroCatalogo[]>(`${dinamico_url}/catalogo/centros`);
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
  deleteQueryExclusionCentroEstandar(id: number) {
    return this.http.delete(base_url + `/delete-exclusion-centro-estandar/${id}`);
  }

  // estándares específicos de centro
  getCentroEstandar(anio: number) { 
    return this.http.get<TmiCentroEstandar[]>(`${dinamico_url}/centro-estandar/${anio}`); 
  }
  postCentroEstandar(dto: TmiCentroEstandar) { 
    return this.http.post(`${dinamico_url}/centro-estandar`, dto); 
  }
  putCentroEstandar(id: number, dto: TmiCentroEstandar) { 
    return this.http.put(`${dinamico_url}/centro-estandar/${id}`, dto); 
  }
  deleteCentroEstandar(id: number) { 
    return this.http.delete(`${dinamico_url}/centro-estandar/${id}`); 
  }
}
