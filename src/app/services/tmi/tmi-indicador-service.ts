import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiAnalisisFormula, TmiIndicador, TmiLetra } from './tmi-models';

const base_url = Backend.apiTmi + '/dinamico';

/** Indicadores: datos de la hoja, fórmula con letras y letras. */
@Injectable({ providedIn: 'root' })
export class TmiIndicadorService {
  constructor(private http: HttpClient) { }

  getIndicadores() { return this.http.get<TmiIndicador[]>(`${base_url}/indicadores`); }
  postIndicador(dto: TmiIndicador) { return this.http.post<{ id: number }>(`${base_url}/indicadores`, dto); }
  putIndicador(id: number, dto: TmiIndicador) { return this.http.put(`${base_url}/indicadores/${id}`, dto); }
  deleteIndicador(id: number) { return this.http.delete(`${base_url}/indicadores/${id}`); }

  /** Guarda la fórmula con letras ((A - B) / C) y la variable de cada letra: el backend genera la fórmula interna. */
  putFormula(idIndicador: number, formula_alias: string, variables: Record<string, number>) {
    return this.http.put<TmiAnalisisFormula>(`${base_url}/indicadores/${idIndicador}/formula`, { formula_alias, variables });
  }
  analizarFormula(formula_alias: string, variables: Record<string, number>) {
    return this.http.post<TmiAnalisisFormula>(`${base_url}/formula/analizar`, { formula_alias, variables });
  }

  getLetras(idIndicador: number) { return this.http.get<TmiLetra[]>(`${base_url}/indicadores/${idIndicador}/letras`); }
}
