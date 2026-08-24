import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/hospitalizacion';

@Injectable({
  providedIn: 'root',
})
export class HospitalizacionService {
  constructor(private http: HttpClient) { }

  getQueryDHE(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDHE/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///pacientes mes
  getQueryDHPM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any[]>(base_url + `/queryDHPM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }


}
