import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/farmacia';

@Injectable({
  providedIn: 'root',
})
export class FarmaciaService {

  constructor(private http: HttpClient) { }

  /// Recetas atendidas
  getQueryDFRA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDFRA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// csv
  getQueryDFCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDFCSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }



}
