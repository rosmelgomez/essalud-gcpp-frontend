import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/solicitud-aprobacion-documento';

@Injectable({
  providedIn: 'root',
})
export class FlujoAprobacionDocumentoService {
  
  constructor(private http: HttpClient) {}
 
  getFlujoAprobacion() {
    return this.http.get(base_url + '/getall', { withCredentials: true });
  }

  getFlujoAprobacionByUser(id: number) {
    return this.http.get<any>(base_url + `/getflujobyuser/${id}`, { withCredentials: true });
  }

  updateFlujoAprobacion(dto: any) {
    return this.http.put(base_url + '/update', dto, { withCredentials: true });
  }

  getHistorial(flujoId: number) {
    return this.http.get<any[]>(base_url + `/historial/${flujoId}`, { withCredentials: true });
  }

  getFlujoByVersionId(versionId: number) {
    return this.http.get<any[]>(base_url + `/version/${versionId}`, { withCredentials: true });
  }
}
