import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/gcpp/file';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private http: HttpClient) {}
  getFile(nameFile: string) {
    const url = base_url + `/${nameFile}`;
    return this.http.get(url, { withCredentials: true, responseType: 'blob' });
  }
}
