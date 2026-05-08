import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';
import { Documento } from '../../model/documento';

const base_url = Backend.api + '/documento';

@Injectable({
  providedIn: 'root',
})
export class DocumentoService {
  constructor(private http: HttpClient) { }

  saveDocumento(documento: FormData) {
    return this.http.post(base_url + '/save', documento, { withCredentials: true });
  }

  getDocumentos() {
    return this.http.get<Documento[]>(base_url + '/getall', { withCredentials: true });
  }

  getDocumentosByCodred(codred: string) {
    return this.http.get<Documento[]>(base_url + `/getdocbycodred/${codred}`, { withCredentials: true });
  }

  getDocumentoByCodcas(codcas: string) {
    return this.http.get<Documento[]>(base_url + `/getdocbycodcas/${codcas}`, { withCredentials: true });
  }

  getDocumentoByUser(iduser: number) {
    return this.http.get<Documento[]>(base_url + `/getdocbyuser/${iduser}`, { withCredentials: true });
  }


}
