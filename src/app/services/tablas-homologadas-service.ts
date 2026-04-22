import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../model/api';

const base_url = Backend.api + '/tablas-homologadas';

@Injectable({
  providedIn: 'root',
})
export class TablasHomologadasService {

  constructor(private http: HttpClient) { }

  ///Tabla Homologada Emergencia
  getQueryTHE(codcas: string) {
    return this.http.get<any[]>(base_url + `/queryTHE/${codcas}`, { withCredentials: true });
  }

  ///Tabla homologada consulta externa
  getQueryTHCE() {
    return this.http.get<any[]>(base_url + `/queryTHCE`, { withCredentials: true });
  }
}
