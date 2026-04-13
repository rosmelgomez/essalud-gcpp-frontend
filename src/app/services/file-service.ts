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
}
