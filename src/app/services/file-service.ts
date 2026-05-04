import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/file';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private http: HttpClient) {}
  getFile(nameFile: string) {
    return this.http.get(base_url + `/${nameFile}`, { withCredentials: true, responseType: 'blob' });
  }

  insertfile(documento: FormData) {
    return this.http.post(base_url+ '/insert-archivo', documento, { withCredentials: true });
  }

  getFiles() {
    return this.http.get(base_url + '/get-documentos', { withCredentials: true });
  }

  getArchivo(id: number | string) {
    return this.http.get(base_url + `/documento/${id}`, { withCredentials: true, responseType: 'blob' });
  }

  updateArchivo(documento: FormData) {
    return this.http.put(base_url + '/update', documento, { withCredentials: true });
  } 

  deleteArchivo(id: number | string) {
    return this.http.delete(base_url + `/delete/${id}`, { withCredentials: true });
  }
}
