import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/transplante';

@Injectable({
  providedIn: 'root',
})
export class TransplanteService {
  constructor(private http: HttpClient) { }

  getQueryTransplante(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any[]>(base_url + `/queryDTrans/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

}
