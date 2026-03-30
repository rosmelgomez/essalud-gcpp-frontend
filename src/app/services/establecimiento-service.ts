import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/establecimiento';

@Injectable({
  providedIn: 'root',
})
export class EstablecimientoService {
  constructor(private http: HttpClient) { }

  getCentros() {
    return this.http.get<any[]>(base_url + '/getCentros', { withCredentials: true });
  }

  getRed() {
    return this.http.get<any[]>(base_url + '/getRedes', { withCredentials: true });
  }

  getCentrosWithRed() {
    return this.http.get<any[]>(base_url + '/getRedesWithCentros', { withCredentials: true });
  }

  getCentrosByRed(code_red: string) {
    return this.http.get<any[]>(base_url + `/getCentroAsistencialByRed/${code_red}`, { withCredentials: true });
  }
}
