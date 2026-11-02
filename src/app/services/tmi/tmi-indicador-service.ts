import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiAmbito, TmiAnalisisFormula, TmiIndicador, TmiLetra, TmiResultadoDirecto } from './tmi-models';

const base_url = Backend.apiTmi + '/dinamico';

/** Indicadores: datos de la hoja, fórmula con letras, letras y ámbito de centros. */
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
  /** Calcula el indicador con el query automático sobre TOTALIZADO3 (sin estándares ni exclusiones). */
  getResultadoDirecto(idIndicador: number, periodo: number) {
    return this.http.get<TmiResultadoDirecto>(`${base_url}/indicadores/${idIndicador}/resultado-directo/${periodo}`);
  }

  getLetras(idIndicador: number) { return this.http.get<TmiLetra[]>(`${base_url}/indicadores/${idIndicador}/letras`); }
  postLetra(dto: TmiLetra) { return this.http.post(`${base_url}/letras`, dto); }
  deleteLetra(id: number) { return this.http.delete(`${base_url}/letras/${id}`); }

  getAmbito(idIndicador: number) { return this.http.get<TmiAmbito[]>(`${base_url}/indicadores/${idIndicador}/ambito`); }
  postAmbito(dto: TmiAmbito) { return this.http.post(`${base_url}/ambito`, dto); }
  deleteAmbito(id: number) { return this.http.delete(`${base_url}/ambito/${id}`); }
}
