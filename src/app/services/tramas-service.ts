import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/tramas';

@Injectable({
  providedIn: 'root',
})
export class TramasService {

  constructor(private http: HttpClient) { }

  getQueryTablaB1(fi: string, ff: string, codcas: string) {
    return this.http.get<any[]>(base_url + `/queryTablaB1/${fi}/${ff}/${codcas}`, { withCredentials: true });
  }

  getQueryTablaB2(fi: string, ff: string, codcas: string) {
    return this.http.get<any[]>(base_url + `/queryTablaB2/${fi}/${ff}/${codcas}`, { withCredentials: true });
  }

}