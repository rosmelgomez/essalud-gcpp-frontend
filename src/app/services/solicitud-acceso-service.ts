import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';
import { SolicitudAcceso } from '../model/SolicitudAcceso';

const base_url = BackendCredentials.api + '/solicitud';

@Injectable({
  providedIn: 'root',
})
export class SolicitudAccesoService  {

  constructor(private http: HttpClient) { }

  enviarSolicitud(solicitud: SolicitudAcceso) {
    return this.http.post(base_url + `/register`, solicitud, { withCredentials: true, responseType: 'text' });
  }

  getListSolicitud() {
    return this.http.get<SolicitudAcceso[]>(base_url + `/getSolicitudes`, { withCredentials: true });
  }

  updateSolicitud(solicitud: SolicitudAcceso) {
    return this.http.put(base_url + `/updateSolicitud`, solicitud, { withCredentials: true, responseType: 'text' });
  }

}
