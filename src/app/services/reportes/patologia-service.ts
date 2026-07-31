import { Injectable } from '@angular/core';
import { Backend } from '../../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.api + '/patologia';

@Injectable({
  providedIn: 'root',
})
export class PatologiaService {
  constructor(private http: HttpClient) { }

  /// opcion patologias
  getQueryOP(){
    return this.http.get<any>(base_url + `/queryOP`, { withCredentials: true });
  }

  /// opcion anio
  getQueryOA(){
    return this.http.get<any>(base_url + `/queryOA`, { withCredentials: true });
  }

  ///opcion red centro
  getQueryORC(){
    return this.http.get<any>(base_url + `/queryORC`, { withCredentials: true });
  }


  ///Analitica por patologia de alto costo
  /// pacientes totales
  getQueryAPACPT(){
    return this.http.get<any>(base_url + `/queryAPACPT`, { withCredentials: true });
  }

  ///comorbilidad global
  getQueryAPACCGB(){
    return this.http.get<any>(base_url + `/queryAPACCGB`, { withCredentials: true });
  }



}
