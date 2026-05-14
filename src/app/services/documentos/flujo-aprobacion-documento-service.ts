import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/flujo-aprobacion-documento';

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

}
