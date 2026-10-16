import { Injectable } from '@angular/core';
import { Backend } from '../model/api';
import { HttpClient } from '@angular/common/http';

const base_url = Backend.apiTmi;

@Injectable({
  providedIn: 'root',
})
export class TmiIndicadoresService {

  constructor(private http: HttpClient) { }

  /// catalogo de estandares (tmi_estandar)
  getQueryEstandar() {
    return this.http.get<any[]>(base_url + `/lista-estandar`);
  }
  putQueryEstandar(dto: any) {
    return this.http.put(base_url + `/update-estandar`, dto);
  }
  postQueryEstandar(dto: any) {
    return this.http.post(base_url + `/create-estandar`, dto);
  }
  deleteQueryEstandar(id: number) {
    return this.http.delete(base_url + `/delete-estandar/${id}`);
  }

  /// estandares tipo
  getQueryEstandarTipo(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-tipo/${anio}`);
  }
  putQueryEstandarTipo(dto: any) {
    return this.http.put(base_url + `/update-estandar-tipo`, dto);
  }
  postQueryEstandarTipo(dto: any) {
    return this.http.post(base_url + `/create-estandar-tipo`, dto);
  }
  deleteQueryEstandarTipo(id: number) {
    return this.http.delete(base_url + `/delete-estandar-tipo/${id}`);
  }

  /// estandares nivel
  getQueryEstandarNivel(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-nivel/${anio}`);
  }
  putQueryEstandarNivel(dto: any) {
    return this.http.put(base_url + `/update-estandar-nivel`, dto);
  }
  postQueryEstandarNivel(dto: any) {
    return this.http.post(base_url + `/create-estandar-nivel`, dto);
  }
  deleteQueryEstandarNivel(id: number) {
    return this.http.delete(base_url + `/delete-estandar-nivel/${id}`);
  }

  /// estandares categoria
  getQueryEstandarCategoria(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-estandar-categoria/${anio}`);
  }
  putQueryEstandarCategoria(dto: any) {
    return this.http.put(base_url + `/update-estandar-categoria`, dto);
  }
  postQueryEstandarCategoria(dto: any) {
    return this.http.post(base_url + `/create-estandar-categoria`, dto);
  }
  deleteQueryEstandarCategoria(id: number) {
    return this.http.delete(base_url + `/delete-estandar-categoria/${id}`);
  }

  /// centros TMI
  getQueryCentrosTMI(anio: string) {
    return this.http.get<any[]>(base_url + `/lista-centros/${anio}`);
  }

  /// update centro TMI
  putQueryCentrosTMI(dto: any) {
    return this.http.put(base_url + `/update-centro`, dto);
  }
  postQueryCentrosTMI(dto: any) {
    return this.http.post(base_url + `/create-centro`, dto);
  }
  deleteQueryCentrosTMI(id: number) {
    return this.http.delete(base_url + `/delete-centro/${id}`);
  }

  /// cierre (fecha en que se generan centros y estándares del nuevo periodo)
  getQueryCierres() {
    return this.http.get<any[]>(base_url + `/cierre/lista`);
  }
  putQueryFechaCierre(periodo: string, fecha_cierre: string) {
    return this.http.put(base_url + `/cierre/${periodo}`, { fecha_cierre });
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

  /// Descarga del Excel TMI (todas las consultas de vistas, CE_Concent hacia abajo)
  getExcelTMI(periodo: string) {
    return this.http.get(base_url + `/generar-excel/${periodo}`, {
      responseType: 'blob',
      observe: 'response' as 'response',
    });
  }





}
