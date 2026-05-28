import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/procedimiento';
@Injectable({
  providedIn: 'root',
})
export class ProcedimientosService {
  constructor(private http: HttpClient) { }

  getqueryDP(anio: string, periodo: string, codcas: string, codasegu: string, codes: string) {
    return this.http.get<any[]>(base_url + `/queryDP/${anio}/${periodo}/${codcas}/${codasegu}/${codes}`);
  }

}
