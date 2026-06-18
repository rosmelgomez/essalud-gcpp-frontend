import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../model/api';
import { ClasificacionCamas } from '../model/clasificacion-camas';

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

  ///Tabla homologada camas
  getQueryTHCAMA(codcas: string) {
    return this.http.get<any[]>(base_url + `/queryTHCAMA/${codcas}`, { withCredentials: true });
  }

  ///clasificar camas
  registerClasificacionCamas(clasificacionCamas: ClasificacionCamas) {
    return this.http.post(base_url + `/clasificar-cama`, clasificacionCamas, { withCredentials: true });
  }

  ///update clasificar camas
  updateClasificacionCamas(clasificacionCamas: ClasificacionCamas) {
    return this.http.put(base_url + `/update-clasificacion-cama`, clasificacionCamas, { withCredentials: true });
  }

  //tabla servicio para camas
  getQueryTHCAMASERV() {
    return this.http.get<any[]>(base_url + `/queryTHCAMASERV`, { withCredentials: true });
  }
}
