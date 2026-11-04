import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import {
  TmiAceptacionIndicador, TmiEstandarClave, TmiEstandarPeriodo, TmiIndicadorEstandar, TmiTipoEstandar, TmiValorEstandar,
} from './tmi-models';

const base_url = Backend.apiTmi;
const dinamico_url = Backend.apiTmi + '/dinamico';

/** Estándares: por tipo, nivel y categoría de centro, tablas maestras, valores por indicador y % Acept. */
@Injectable({ providedIn: 'root' })
export class TmiEstandarService {
  constructor(private http: HttpClient) { }

  /// estandares
  getQueryEstandar() {
    return this.http.get<any[]>(base_url + `/lista-estandar`);
  }
  putQueryEstandar(dto: any) {
    return this.http.put(base_url + `/update-estandar`, dto);
  }
  postQueryEstandar(dto: any) {
    return this.http.post(base_url + `/create-estandar`, dto);
  }
  deleteQueryEstandar(id: number) {
    return this.http.delete(base_url + `/delete-estandar/${id}`);
  }

  /// estandares tipo
  getQueryEstandarTipo(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-tipo/${anio}`);
  }
  putQueryEstandarTipo(dto: any) {
    return this.http.put(base_url + `/update-estandar-tipo`, dto);
  }
  postQueryEstandarTipo(dto: any) {
    return this.http.post(base_url + `/create-estandar-tipo`, dto);
  }
  deleteQueryEstandarTipo(id: number) {
    return this.http.delete(base_url + `/delete-estandar-tipo/${id}`);
  }

  /// estandares nivel
  getQueryEstandarNivel(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-nivel/${anio}`);
  }
  putQueryEstandarNivel(dto: any) {
    return this.http.put(base_url + `/update-estandar-nivel`, dto);
  }
  postQueryEstandarNivel(dto: any) {
    return this.http.post(base_url + `/create-estandar-nivel`, dto);
  }
  deleteQueryEstandarNivel(id: number) {
    return this.http.delete(base_url + `/delete-estandar-nivel/${id}`);
  }

  /// estandares categoria
  getQueryEstandarCategoria(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-categoria/${anio}`);
  }
  putQueryEstandarCategoria(dto: any) {
    return this.http.put(base_url + `/update-estandar-categoria`, dto);
  }
  postQueryEstandarCategoria(dto: any) {
    return this.http.post(base_url + `/create-estandar-categoria`, dto);
  }
  deleteQueryEstandarCategoria(id: number) {
    return this.http.delete(base_url + `/delete-estandar-categoria/${id}`);
  }

  // tablas maestras de estándares
  getTiposEstandar() { return this.http.get<TmiTipoEstandar[]>(`${dinamico_url}/tipos-estandar`); }
  postTipoEstandar(dto: TmiTipoEstandar) { return this.http.post<{ id: number }>(`${dinamico_url}/tipos-estandar`, dto); }
  putTipoEstandar(id: number, dto: TmiTipoEstandar) { return this.http.put(`${dinamico_url}/tipos-estandar/${id}`, dto); }
  deleteTipoEstandar(id: number) { return this.http.delete(`${dinamico_url}/tipos-estandar/${id}`); }
  getEstandarClaves() { return this.http.get<TmiEstandarClave[]>(`${dinamico_url}/estandar-claves`); }
  postEstandarClave(dto: TmiEstandarClave) { return this.http.post<{ id: number }>(`${dinamico_url}/estandar-claves`, dto); }
  putEstandarClave(id: number, dto: TmiEstandarClave) { return this.http.put(`${dinamico_url}/estandar-claves/${id}`, dto); }
  deleteEstandarClave(id: number) { return this.http.delete(`${dinamico_url}/estandar-claves/${id}`); }

  // estándares del periodo: cada indicador solo con las claves de su base_estandar
  getEstandaresPeriodo(anio: number, mes: number) {
    return this.http.get<TmiEstandarPeriodo[]>(`${dinamico_url}/estandares-periodo/${anio}/${mes}`);
  }
  putEstandarPeriodo(idIndicador: number, dto: {
    anio: number; mes: number;
    valores: { fuente: string; clave: string; fijo: number | null; mes: number | null }[];
  }) {
    return this.http.put(`${dinamico_url}/indicadores/${idIndicador}/estandar-periodo`, dto);
  }

  // estándar por mes de un indicador en cada clave de su tipo de estándar
  getValoresEstandar(idIndicador: number, anio: number) {
    return this.http.get<TmiValorEstandar[]>(`${dinamico_url}/indicadores/${idIndicador}/valores-estandar/${anio}`);
  }
  putValorEstandar(idIndicador: number, dto: { anio: number; fuente: string; clave: string; [mes: string]: any }) {
    return this.http.put(`${dinamico_url}/indicadores/${idIndicador}/valores-estandar`, dto);
  }

  // estándares del indicador por nivel, categoría, tipo y periodo
  getIndicadorEstandares(idIndicador: number) {
    return this.http.get<TmiIndicadorEstandar[]>(`${dinamico_url}/indicadores/${idIndicador}/estandares`);
  }
  postIndicadorEstandar(dto: TmiIndicadorEstandar) {
    return this.http.post(`${dinamico_url}/indicador-estandar`, dto);
  }
  putIndicadorEstandar(id: number, dto: TmiIndicadorEstandar) {
    return this.http.put(`${dinamico_url}/indicador-estandar/${id}`, dto);
  }
  deleteIndicadorEstandar(id: number) {
    return this.http.delete(`${dinamico_url}/indicador-estandar/${id}`);
  }

  // % Acept: porcentaje de cada indicador (el % Acept se calcula con el estándar)
  getAceptacion(anio: number, mes: number) {
    return this.http.get<TmiAceptacionIndicador[]>(`${dinamico_url}/aceptacion/${anio}/${mes}`);
  }
  putTolerancia(
    idIndicador: number,
    dto: {
      tipo_tolerancia: 'REL' | 'ABS';
      tolerancia: number;
      tolerancia_menos: number | null;
      tolerancia_fijo?: number | null;
      tolerancia_menos_fijo?: number | null;
      anio?: number;
      mes?: number;
    },
  ) {
    return this.http.put(`${dinamico_url}/indicadores/${idIndicador}/tolerancia`, dto);
  }
}
