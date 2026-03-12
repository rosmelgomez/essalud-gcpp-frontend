import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendCredentials } from '../model/backendcredentials';
import { ModuloDto } from '../model/modulo-dto';
import { CategoriaDto } from '../model/categoria-dto';
import { SubcategoriaDto } from '../model/subcategoria-dto';
import { VariableDto } from '../model/variable-dto';
import { EncuestaDto } from '../model/encuesta-dto';

const base_url = BackendCredentials.api + '/encuesta';

@Injectable({
  providedIn: 'root',
})
export class EncuestaService {
  constructor(private http: HttpClient) {}

  getModulos(): Observable<ModuloDto[]> {
    return this.http.get<ModuloDto[]>(base_url + '/getModulos');
  }

  getCategorias(): Observable<CategoriaDto[]> {
    return this.http.get<CategoriaDto[]>(base_url + '/getCategorias');
  }

  getSubcategorias(): Observable<SubcategoriaDto[]> {
    return this.http.get<SubcategoriaDto[]>(base_url + '/getSubcategorias');
  }

  getVariables(): Observable<VariableDto[]> {
    return this.http.get<VariableDto[]>(base_url + '/getVariables');
  }


  createEncuesta(encuesta: any): Observable<any> {
    return this.http.post(base_url + '/register', encuesta);
  }

  getEncuesta(): Observable<EncuestaDto[]> {
    return this.http.get<EncuestaDto[]>(base_url);
  }
}
