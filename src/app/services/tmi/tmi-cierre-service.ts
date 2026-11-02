import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Backend } from '../../model/api';
import { TmiCalendarioCierre, TmiCierre } from './tmi-models';

const base_url = Backend.apiTmi;

/** Calendario de cierre por año y ejecución del cierre de cada periodo. */
@Injectable({ providedIn: 'root' })
export class TmiCierreService {
  constructor(private http: HttpClient) { }

  getQueryCierres() {
    return this.http.get<TmiCierre[]>(base_url + `/cierre/lista`);
  }
  getCalendario() {
    return this.http.get<TmiCalendarioCierre[]>(base_url + `/cierre/calendario`);
  }
  /** dias: dia_01..dia_12 (null = el día general). ejecutando = algún cierre quedó con la fecha de hoy y ya se ejecuta. */
  putCalendario(anio: number, dia_fijo: number, dias: Record<string, number | null>) {
    return this.http.put<{ ejecutando: boolean }>(base_url + `/cierre/calendario/${anio}`, { dia_fijo, ...dias });
  }
}
