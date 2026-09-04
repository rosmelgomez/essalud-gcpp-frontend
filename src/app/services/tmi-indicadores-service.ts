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
  getQueryEstandares() {
    return this.http.get<any[]>(base_url + `/lista-estandar`);
  }

  /// estandares by centro
  getQueryEstandaresByCentro(codcentro: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-by-centro/${codcentro}`);
  }

  /// update estandar
  putQueryEstandares(dto: any) {
    return this.http.put<any[]>(base_url + `/update-estandar`, dto);
  }

  /// centros TMI
  getQueryCentrosTMI() {
    return this.http.get<any[]>(base_url + `/lista-centros`);
  }

  /// update centro TMI
  putQueryCentrosTMI(dto: any) {
    return this.http.put<any[]>(base_url + `/update-centro`, dto);
  }

  /// CE concent
  getQueryCEConcent() {
    return this.http.get<any[]>(base_url + `/ce-concent`);
  }







}
