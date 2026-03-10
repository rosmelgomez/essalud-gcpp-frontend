import { Resporteador } from './../model/resporteador';
import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/gcpp/query';

@Injectable({
  providedIn: 'root',
})
export class ReportDashboardReporteadorService {
  constructor(private http: HttpClient) {}

  /// Dashboard Reporteador Red
  getQueryDRR() {
    const url = base_url + `/queryDRR`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Dashboard Reporteador centro
  getQueryDRC() {
    const url = base_url + `/getCentroRedTotal`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Dashboard Reporteador servicio
  getQueryDRS() {
    const url = base_url + `/queryDRS`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Dashboard Reporteador actividad
  getQueryDRAC() {
    const url = base_url + `/queryDRAC`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Dashboard Reporteador  subactividad
  getQueryDRSUBAC() {
    const url = base_url + `/queryDRSUBAC`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Dashboard Reporteador capitulo
  getQueryDRCAP() {
    const url = base_url + `/queryDRCAP`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /// Dashboard Reporteador query
  getQueryReporteador(Resporteador: Resporteador) {
    const url = base_url + `/queryReporteador`;
    return this.http.post<any>(url, Resporteador, { withCredentials: true });
  }
}
