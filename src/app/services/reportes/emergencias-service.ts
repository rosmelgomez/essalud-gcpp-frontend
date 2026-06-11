import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/emergencia';
@Injectable({
  providedIn: 'root',
})
export class EmergenciasService {
  constructor(private http: HttpClient) { }
  ///Dashboard Emergencias
  /* Prioridad */
  getQueryDEP(anio: string, periodo: string, codcas: string, codasegu: string, prioridad: number) {
    return this.http.get<any>(base_url + `/queryDEP/${anio}/${periodo}/${codcas}/${codasegu}/${prioridad}`, { withCredentials: true });
  }

  /* defunciones  */
  getQueryDED(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<number>(base_url + `/queryDED/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /* mayor a 24h */
  getQueryDEMY24HR(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<number>(base_url + `/queryDEMY24HR/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /* menor a 24h */
  getQueryDEMN24HR(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<number>(base_url + `/queryDEMN24HR/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
}
