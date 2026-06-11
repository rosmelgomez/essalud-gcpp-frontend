import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/intervenciones-q';

@Injectable({
  providedIn: 'root',
})
export class IntervencionesQuirurgicasService {
  constructor(private http: HttpClient) { }

  ///Dashboard Intervenciones Quirurgicas
  /* Intervenciones quirúrgicas */
  /// Grado de complejidad
  getQueryDIQGC(anio: string, periodo: string, codcas: string, codasegu: string, complejidad: string) {
    return this.http.get<any[]>(base_url + `/queryDIQGC/${anio}/${periodo}/${codcas}/${codasegu}/${complejidad}`, { withCredentials: true });
  }

  /// Intervenciones de emergencia
  getQueryDIQE(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDIQE/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///horas quirurgicas electivas
  getQueryDIQHQE(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDIQHQE/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///horas quirurgicas emergencia
  getQueryDIQHQEME(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDIQHQEME/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///Indicadores de grado de complejidad
  getQueryDIQIGC(anio: string, periodo: string, codcas: string, codasegu: string, complejidad: string) {
    return this.http.get<any[]>(base_url + `/queryDIQIGC/${anio}/${periodo}/${codcas}/${codasegu}/${complejidad}`, { withCredentials: true });
  }


}
