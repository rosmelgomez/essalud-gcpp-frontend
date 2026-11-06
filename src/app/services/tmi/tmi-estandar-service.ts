import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiAceptacionIndicador, TmiEstandarPeriodo, TmiTipoEstandar } from './tmi-models';

const base_url = Backend.apiTmi;
const dinamico_url = Backend.apiTmi + '/dinamico';

/** Estándares: lista de indicadores, tipos de estándar, estándares del periodo y % Acept. */
@Injectable({ providedIn: 'root' })
export class TmiEstandarService {
  constructor(private http: HttpClient) { }

  /// estandares
  getQueryEstandar() {
    return this.http.get<any[]>(base_url + `/lista-estandar`);
  }

  // tablas maestras de estándares
  getTiposEstandar() { return this.http.get<TmiTipoEstandar[]>(`${dinamico_url}/tipos-estandar`); }

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
