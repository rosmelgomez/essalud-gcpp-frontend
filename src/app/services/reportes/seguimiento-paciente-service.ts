import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/seguimiento-paciente';

@Injectable({
  providedIn: 'root',
})
export class SeguimientoPacienteService {
  constructor(private http: HttpClient) { }

  /// Query 1 atenciones
  getQuery1SPA(doc: string, tipo_doc: number) {
    return this.http.get<any[]>(base_url + `/query1SPA/${doc}/${tipo_doc}`);
  }

  /// Query 2 atenciones
  getQuery2SPA(doc: string, tipo_doc: number) {
    return this.http.get<any[]>(base_url + `/query2SPA/${doc}/${tipo_doc}`);
  }

}
