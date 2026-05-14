import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';
import { VersionDocumento } from '../../model/documento';

const base_url = Backend.api + '/version-documento';

@Injectable({
  providedIn: 'root',
})
export class VersionDocumentoService {
  constructor(private http: HttpClient) {}


  saveVersionDocumento(documento: FormData) {
    return this.http.post(base_url+ '/save', documento, { withCredentials: true });
  }

  getVersionesDocumentos() {
    return this.http.get<VersionDocumento[]>(base_url + '/getall', { withCredentials: true });
  }

  getArchivo(id: number) {
    return this.http.get<Blob>(base_url + `/archivo/${id}`, { withCredentials: true, observe: 'response' as 'response' });
  }

  getVersionDocumentoByIdDoc(iddoc: number) {
    return this.http.get<VersionDocumento[]>(base_url + `/getvdbyiddoc/${iddoc}`, { withCredentials: true });
  }

  getVersionDocumentoByUser(idUser: number) {
    return this.http.get<VersionDocumento[]>(base_url + `/getByUser/${idUser}`, { withCredentials: true });
  }
  
}
