import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/auditoria-documental';

@Injectable({
  providedIn: 'root',
})
export class AuditoriaDocumentoService {
  constructor(private http: HttpClient) { }

  getAuditorias() {
    return this.http.get<any[]>(base_url + '/getall', { withCredentials: true });
  }
}
