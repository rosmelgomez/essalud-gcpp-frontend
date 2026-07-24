import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/establecimiento';

@Injectable({
  providedIn: 'root',
})
export class EstablecimientoService {
  constructor(private http: HttpClient) { }

  getCentros() {
    return this.http.get<any[]>(base_url + '/getcentros', { withCredentials: true });
  }

  getRed() {
    return this.http.get<any[]>(base_url + '/getredes', { withCredentials: true });
  }

  getCentrosWithRed() {
    return this.http.get<any[]>(base_url + '/getredeswithcentros', { withCredentials: true });
  }

  getCentrosByRed(code_red: string) {
    return this.http.get<any[]>(base_url + `/getcentrobyred/${code_red}`, { withCredentials: true });
  }

  getCentroWithRedByCodcas(codcas: string) {
    return this.http.get<any>(base_url + `/getredwithcentrosbycodcas/${codcas}`, { withCredentials: true });
  }
}
