import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.apiTmi;

@Injectable({
  providedIn: 'root',
})
export class TmiIndicadoresService {

  constructor(private http: HttpClient) { }

  /// estandares
  getQueryEstandares(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar/${periodo}`);
  }

  /// estandares by centro
  getQueryEstandaresByCentro(codcentro: string, periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-by-centro/${codcentro}/${periodo}`);
  }

  /// update estandar
  putQueryEstandares(dto: any) {
    return this.http.put(base_url + `/update-estandar`, dto);
  }

  /// estandares tipo
  getQueryEstandarTipo(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-tipo/${periodo}`);
  }
  putQueryEstandarTipo(dto: any) {
    return this.http.put(base_url + `/update-estandar-tipo`, dto);
  }

  /// estandares nivel
  getQueryEstandarNivel(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-nivel/${periodo}`);
  }
  putQueryEstandarNivel(dto: any) {
    return this.http.put(base_url + `/update-estandar-nivel`, dto);
  }

  /// estandares categoria
  getQueryEstandarCategoria(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-categoria/${periodo}`);
  }
  putQueryEstandarCategoria(dto: any) {
    return this.http.put(base_url + `/update-estandar-categoria`, dto);
  }

  /// centros TMI
  getQueryCentrosTMI(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-centros/${periodo}`);
  }

  /// update centro TMI
  putQueryCentrosTMI(dto: any) {
    return this.http.put(base_url + `/update-centro`, dto);
  }

  /// CE concent
  getQueryCEConcent() {
    return this.http.get<any[]>(base_url + `/ce-concent`);
  }







}
