import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/establecimiento';

@Injectable({
  providedIn: 'root',
})
export class CentroService {
  constructor(private http: HttpClient) {}

  getCentros() {
    const url = base_url + '/getCentros';
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  getRed() {
    const url = base_url + '/getRedes';
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  getCentrosWithRed() {
    const url = base_url + '/getRedesWithCentros';
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  getCentrosByRed(code_red: string) {
    const url = base_url + `/getCentroAsistencialByRed/${code_red}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }
}
