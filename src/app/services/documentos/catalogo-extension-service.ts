import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';
import { CatalogoExtension } from '../../model/documento';

const base_url = Backend.api + '/catalogo-extension';

@Injectable({
  providedIn: 'root',
})
export class CatalogoExtensionService {
  constructor(private http: HttpClient) { }

  getall() {
    return this.http.get<CatalogoExtension[]>(base_url + '/getall', { withCredentials: true });
  }
}
