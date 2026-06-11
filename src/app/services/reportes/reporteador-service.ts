import { Resporteador } from '../../model/resporteador';
import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/reporteador';

@Injectable({
  providedIn: 'root',
})
export class ReporteadorService {
  constructor(private http: HttpClient) { }

  /// Dashboard Reporteador Red
  getQueryDRR() {
    return this.http.get<any>(base_url + `/queryDRR`, { withCredentials: true });
  }
  /// Dashboard Reporteador centro
  getQueryDRC() {
    return this.http.get<any>(base_url + `/queryDRC`, { withCredentials: true });
  }
  /// Dashboard Reporteador servicio
  getQueryDRS() {
    return this.http.get<any>(base_url + `/queryDRS`, { withCredentials: true });
  }
  /// Dashboard Reporteador actividad
  getQueryDRAC() {
    return this.http.get<any>(base_url + `/queryDRAC`, { withCredentials: true });
  }
  /// Dashboard Reporteador  subactividad
  getQueryDRSUBAC() {
    return this.http.get<any>(base_url + `/queryDRSUBAC`, { withCredentials: true });
  }
  /// Dashboard Reporteador capitulo
  getQueryDRCAP() {
    return this.http.get<any>(base_url + `/queryDRCAP`, { withCredentials: true });
  }
  /// Dashboard Reporteador variable
  getQueryDRVAR() {
    return this.http.get<any>(base_url + `/queryDRVAR`, { withCredentials: true });
  }
  /// Dashboard Reporteador query
  getQueryReporteador(Resporteador: Resporteador) {
    return this.http.post<any>(base_url + `/queryDRQ`, Resporteador, { withCredentials: true });
  }
}
