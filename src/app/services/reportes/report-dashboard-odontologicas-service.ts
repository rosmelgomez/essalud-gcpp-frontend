import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/odon';

@Injectable({
  providedIn: 'root',
})
export class ReportDashboardOdontologicasService {
  constructor(private http: HttpClient) { }

  ///Dashboard odontologicas
  ///  sesiones odontologicas - Atenciones
  getQueryDOSOA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDOSOA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  sesiones odontologicas - horas efectivas
  getQueryDOSOHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDOSOHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  ///  sesiones odontologicas - horas programadas
  getQueryDOSOHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDOSOHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  ///  sesiones odontologicas - medicos
  getQueryDOSOM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDOSOM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  ///  sesiones odontologicas - total consultante atencion
  getQueryDOSOTCA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDOSOTCA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  sesiones odontologicas - total consultante servicio
  getQueryDOSOTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDOSOTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
}
