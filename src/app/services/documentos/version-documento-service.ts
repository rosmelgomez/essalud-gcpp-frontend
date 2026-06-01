import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';
import { VersionDocumento } from '../../model/documento';

const base_url = Backend.api + '/version-documento';

@Injectable({
  providedIn: 'root',
})
export class VersionDocumentoService {
  constructor(private http: HttpClient) { }


  saveVersionDocumento(documento: FormData) {
    return this.http.post(base_url + '/save', documento, { withCredentials: true });
  }

  getVersionesDocumentos() {
    return this.http.get<VersionDocumento[]>(base_url + '/getall', { withCredentials: true });
  }

  getArchivo(id: number, download: boolean = false) {
    return this.http.get<Blob>(base_url + `/archivo/${id}?download=${download}`, {
      withCredentials: true,
      observe: 'response' as 'response',
      responseType: 'blob' as 'json'
    });
  }

  getVersionDocumentoByIdDoc(iddoc: number) {
    return this.http.get<VersionDocumento[]>(base_url + `/getbyiddoc/${iddoc}`, { withCredentials: true });
  }

  getVersionDocumentoByUser(idUser: number) {
    return this.http.get<VersionDocumento[]>(base_url + `/getbyuser/${idUser}`, { withCredentials: true });
  }

  updateVersionDocumento(version: any) {
    return this.http.put(base_url + '/update', version, { withCredentials: true });
  }

  deleteVersionDocumento(id: number, userId: number) {
    return this.http.delete(base_url + `/delete/${id}/${userId}`, { withCredentials: true });
  }

  getVersionDocumentoByCodcas(codcas: string) {
    return this.http.get<VersionDocumento[]>(base_url + `/getbycodcas/${codcas}`, { withCredentials: true });
  }

  getVersionesDocumentoByCodred(codred: string) {
    return this.http.get<VersionDocumento[]>(base_url + `/getbycodred/${codred}`, { withCredentials: true });
  }

}
