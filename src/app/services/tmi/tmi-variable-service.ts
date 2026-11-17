import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiVariable, TmiVariableComponente, TmiVariableLogica } from './tmi-models';

const base_url = Backend.apiTmi + '/variable';

/** Variables, sus componentes (variable compuesta) y su lógica sobre TOTALIZADO3. */
@Injectable({ providedIn: 'root' })
export class TmiVariableService {
  constructor(private http: HttpClient) { }

  getVariables() {
    return this.http.get<TmiVariable[]>(`${base_url}/variables`);
  }
  postVariable(dto: TmiVariable) {
    return this.http.post<{ id: number }>(`${base_url}/variables`, dto);
  }
  putVariable(id: number, dto: TmiVariable) {
    return this.http.put(`${base_url}/variables/${id}`, dto);
  }
  deleteVariable(id: number) {
    return this.http.delete(`${base_url}/variables/${id}`);
  }

  getComponentes(idVariable: number) {
    return this.http.get<TmiVariableComponente[]>(`${base_url}/variables/${idVariable}/componentes`);
  }
  postComponente(dto: TmiVariableComponente) { return this.http.post(`${base_url}/componentes`, dto); }
  deleteComponente(id: number) { return this.http.delete(`${base_url}/componentes/${id}`); }

  /** Query para SSMS que calcula la variable directo de TOTALIZADO3 (AAAAMM): valor de cada mes y de enero al mes. */
  getConsultaSql(idVariable: number, periodo: number) {
    return this.http.get<{ sql: string }>(`${base_url}/variables/${idVariable}/consulta/${periodo}`);
  }

  getLogica(idVariable: number) { return this.http.get<TmiVariableLogica[]>(`${base_url}/variables/${idVariable}/logica`); }
  postLogica(dto: TmiVariableLogica) { return this.http.post(`${base_url}/logica`, dto); }
  putLogica(id: number, dto: TmiVariableLogica) { return this.http.put(`${base_url}/logica/${id}`, dto); }
  deleteLogica(id: number) { return this.http.delete(`${base_url}/logica/${id}`); }
}
