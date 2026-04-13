import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/intervenciones-q';

@Injectable({
  providedIn: 'root',
})
export class ReportDashboardIntervencionesQuirurgicasService {
  constructor(private http: HttpClient) {}

  ///Dashboard Intervenciones Quirurgicas
  /* Intervenciones quirúrgicas */
  /// Grado de complejidad
  getQueryDIQGC(anio: string, periodo: string, codcas: string, codasegu: string, complejidad: string) {
    return this.http.get<any>(base_url + `/queryDIQGC/${anio}/${periodo}/${codcas}/${codasegu}/${complejidad}`, { withCredentials: true });
  }

}
