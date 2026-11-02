import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiPeriodoCalculo, TmiProblemaConfig, TmiResultadoFinal } from './tmi-models';

const base_url = Backend.apiTmi + '/dinamico';

/** Validación de la configuración, cálculo del periodo, resultados y Excel. */
@Injectable({ providedIn: 'root' })
export class TmiCalculoService {
  constructor(private http: HttpClient) { }

  validarConfig() { return this.http.get<TmiProblemaConfig[]>(`${base_url}/validar-config`); }
  calcular(periodo: string) {
    return this.http.post<{ periodo: string; puntajes: Record<string, number> }>(`${base_url}/calcular/${periodo}`, {});
  }
  getPeriodoCalculo() { return this.http.get<TmiPeriodoCalculo>(`${base_url}/periodo-calculo`); }
  getResultado(periodo: string, idIndicador: number) {
    return this.http.get<TmiResultadoFinal[]>(`${base_url}/resultado/${periodo}/${idIndicador}`);
  }
  /** ids: indicadores que lleva el Excel; sin ids, todos. */
  getExcel(periodo: string, calcular: boolean, ids?: number[]) {
    const filtro = ids?.length ? `&indicadores=${ids.join(',')}` : '';
    return this.http.get(`${base_url}/generar-excel/${periodo}?calcular=${calcular}${filtro}`, {
      responseType: 'blob',
      observe: 'response' as 'response',
    });
  }
}
