import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendCredentials } from '../model/backendcredentials';
import { Modulo } from '../model/modulo';
import { Categoria } from '../model/categoria';
import { Subcategoria } from '../model/subcategoria';
import { Variable } from '../model/variable';
import { Encuesta } from '../model/encuesta';

const base_url = BackendCredentials.api + '/encuesta';

@Injectable({
  providedIn: 'root',
})
export class EncuestaService {
  constructor(private http: HttpClient) {}

  getModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(base_url + '/getModulos');
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(base_url + '/getCategorias');
  }

  getSubcategorias(): Observable<Subcategoria[]> {
    return this.http.get<Subcategoria[]>(base_url + '/getSubcategorias');
  }

  getVariables(): Observable<Variable[]> {
    return this.http.get<Variable[]>(base_url + '/getVariables');
  }


  createEncuesta(encuesta: any){
    return this.http.post(base_url + '/register', encuesta);
  }

  getEncuesta(): Observable<Encuesta[]> {
    return this.http.get<Encuesta[]>(base_url + '/getEncuestas');
  }
}
