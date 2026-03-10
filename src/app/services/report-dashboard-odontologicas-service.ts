import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/odon';

@Injectable({
  providedIn: 'root',
})
export class ReportDashboardOdontologicasService {
  constructor(private http: HttpClient) {}

  ///Dashboard odontologicas
  ///  sesiones odontologicas - Atenciones
  getQueryDOSOA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/queryDOSOA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///  sesiones odontologicas - horas efectivas
  getQueryDOSOHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDOSOHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///  sesiones odontologicas - horas programadas
  getQueryDOSOHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDOSOHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///  sesiones odontologicas - medicos
  getQueryDOSOM(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDOSOM/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///  sesiones odontologicas - total consultante atencion
  getQueryDOSOTCA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/queryDOSOTCA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///  sesiones odontologicas - total consultante servicio
  getQueryDOSOTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/queryDOSOTCS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
}
