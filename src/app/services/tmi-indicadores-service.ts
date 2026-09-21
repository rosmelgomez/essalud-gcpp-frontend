import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.apiTmi;

@Injectable({
  providedIn: 'root',
})
export class TmiIndicadoresService {

  constructor(private http: HttpClient) { }

  /// estandares tipo
  getQueryEstandarTipo(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-tipo/${periodo}`);
  }
  putQueryEstandarTipo(dto: any) {
    return this.http.put(base_url + `/update-estandar-tipo`, dto);
  }

  /// estandares nivel
  getQueryEstandarNivel(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-nivel/${periodo}`);
  }
  putQueryEstandarNivel(dto: any) {
    return this.http.put(base_url + `/update-estandar-nivel`, dto);
  }

  /// estandares categoria
  getQueryEstandarCategoria(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-categoria/${periodo}`);
  }
  putQueryEstandarCategoria(dto: any) {
    return this.http.put(base_url + `/update-estandar-categoria`, dto);
  }

  /// centros TMI
  getQueryCentrosTMI(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-centros/${periodo}`);
  }

  /// update centro TMI
  putQueryCentrosTMI(dto: any) {
    return this.http.put(base_url + `/update-centro`, dto);
  }

  /// consultas
  /// CE_Concent
  getQueryCeConcent(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-ce-concent/${periodo}`);
  }

  /// CE_GCHProg
  getQueryCeGCHProg(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-ce-gchprog/${periodo}`);
  }

  /// CE_Recetas
  getQueryCeRecetas(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-ce-recetas/${periodo}`);
  }

  /// CE_RHrMedico
  getQueryCeRHrMedico(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-ce-rhrmedico/${periodo}`);
  }

  /// Em_PrioI_II
  getQueryEmPrioI_II(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-em-prio-i-ii/${periodo}`);
  }

  /// Em_PrioIV_V
  getQueryEmPrioIV_V(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-em-prio-iv-v/${periodo}`);
  }

  /// H_Estancias
  getQueryHEstancias(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-h-estancias/${periodo}`);
  }

  /// H_ISust
  getQueryHISust(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-h-isust/${periodo}`);
  }

  /// H_OCamas
  getQueryHOCamas(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-h-ocamas/${periodo}`);
  }

  /// H_RCama
  getQueryHRCama(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-h-rcama/${periodo}`);
  }

  /// H_TBMHosp
  getQueryHTBHosp(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-h-tbmhosp/${periodo}`);
  }

  /// O_Concent
  getQueryOConcent(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-o-concent/${periodo}`);
  }

  /// O_GCHOdon
  getQueryOGCHodon(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-o-gchodon/${periodo}`);
  }

  /// O_HrOdont
  getQueryOHrOdont(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-o-hrodont/${periodo}`);
  }

  /// O_NTOdontS
  getQueryONTOdontS(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-o-ntodonts/${periodo}`);
  }


  /// Qx_GCHProg
  getQueryQxGCHProg(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-qx-gchprog/${periodo}`);
  }

  /// Qx_HTCesareas
  getQueryQxHTCesareas(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-qx-htcesareas/${periodo}`);
  }

  /// Qx_IAlta
  getQueryQxIAlta(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-qx-ialta/${periodo}`);
  }

  /// Qx_IMenor
  getQueryQxIMenor(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-qx-imenor/${periodo}`);
  }

  /// Qx_IntSusp
  getQueryQxIntSusp(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-qx-intsusp/${periodo}`);
  }

  /// Qx_RendSO
  getQueryQRendSO(periodo: string) {
    return this.http.get<any[]>(base_url + `/lista-qx-rendso/${periodo}`);
  }





}
