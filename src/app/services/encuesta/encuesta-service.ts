import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Backend } from '../../model/api';
import {Modulo, Categoria,Subcategoria ,Variable ,Encuesta } from '../../model/encuesta';


const base_url = Backend.api + '/encuesta';

@Injectable({
  providedIn: 'root',
})
export class EncuestaService {
  constructor(private http: HttpClient) {}

  getModulos(){
    return this.http.get<Modulo[]>(base_url + '/getmodulos');
  }

  getCategorias() {
    return this.http.get<Categoria[]>(base_url + '/getcategorias');
  }

  getSubcategorias() {
    return this.http.get<Subcategoria[]>(base_url + '/getsubcategorias');
  }

  getVariables() {
    return this.http.get<Variable[]>(base_url + '/getvariables');
  }


  createEncuesta(encuesta: any){
    return this.http.post(base_url + '/register', encuesta);
  }

  getEncuesta() {
    return this.http.get<Encuesta[]>(base_url + '/getall');
  }
}
