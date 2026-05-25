import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';
import { CategoriaDocumento } from '../../model/documento';

const base_url = Backend.api + '/categoria-documento';

@Injectable({
  providedIn: 'root',
})
export class CategoriaDocumentoService {
  constructor(private http: HttpClient) { }

  saveCategoria(categoria: CategoriaDocumento) {
    return this.http.post(base_url + '/save', categoria, { withCredentials: true });
  }

  getCategorias() {
    return this.http.get<CategoriaDocumento[]>(base_url + '/getall', { withCredentials: true });
  }
}
