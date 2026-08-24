import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/fecha';

@Injectable({
  providedIn: 'root',
})
export class FechaActualizacionService {

  constructor(private http: HttpClient) { }

  queryFechaActualizacion() {
    return this.http.get<any>(`${base_url}/actualizacion`);
  }

}
