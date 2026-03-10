import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/eme';
@Injectable({
  providedIn: 'root',
})
export class ReportDashboardEmergenciasService {
  constructor(private http: HttpClient) {}
  ///Dashboard Emergencias
  /* Prioridad */
  getQueryDEP(anio: string, periodo: string, codcas: string, codasegu: string, prioridad: number) {
    const url = base_url + `/queryDEP/${anio}/${periodo}/${codcas}/${codasegu}/${prioridad}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /* defunciones  */
  getQueryDED(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/queryDED/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<number>(url, { withCredentials: true });
  }

  /* mayor a 24h */
  getQueryDEMY24HR(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/queryDEMY24HR/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<number>(url, { withCredentials: true });
  }

  /* menor a 24h */
  getQueryDEMN24HR(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/queryDEMN24HR/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<number>(url, { withCredentials: true });
  }
}
