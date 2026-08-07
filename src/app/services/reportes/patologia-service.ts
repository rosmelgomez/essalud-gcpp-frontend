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
  getQueryOP() {
    return this.http.get<any>(base_url + `/queryOP`, { withCredentials: true });
  }

  /// opcion anio
  getQueryOA() {
    return this.http.get<any>(base_url + `/queryOA`, { withCredentials: true });
  }

  ///opcion red centro
  getQueryORC() {
    return this.http.get<any>(base_url + `/queryORC`, { withCredentials: true });
  }


  ///Analitica por patologia de alto costo
  /// pacientes totales
  getQueryAPACPT() {
    return this.http.get<any>(base_url + `/queryAPACPT`, { withCredentials: true });
  }

  ///comorbilidad global
  getQueryAPACCGB() {
    return this.http.get<any>(base_url + `/queryAPACCGB`, { withCredentials: true });
  }

  ///ranking red
  getQueryAPACRR(anios: String[]) {
    let parameters: any = {
      anios: anios
    };
    return this.http.get<any>(base_url + `/queryAPACRR`, { params: parameters, withCredentials: true });
  }

  ///comorbilidad grupo
  getQueryAPACCG(patologia: String, patron: String) {
    return this.http.get<any>(base_url + `/queryAPACCGP/${patologia}/${patron}`, { withCredentials: true });
  }

  ///comorbilidad interserccion
  getQueryAPACCI() {
    return this.http.get<any>(base_url + `/queryAPACCI`, { withCredentials: true });
  }

  ///patologia -> area ->servicio
  getQueryAPACPAS(anios: String[]) {
    let parameters: any = {
      anios: anios
    };
    return this.http.get<any>(base_url + `/queryAPACPAS`, { params: parameters, withCredentials: true });
  }

  /// diagnostico y servicios mas frecuente por patologia
  getQueryAPACDSFP(anios: String[]) {
    let parameters: any = {
      anios: anios
    };
    return this.http.get<any>(base_url + `/queryAPACDSFP`, { params: parameters, withCredentials: true });
  }

  ///total pacientes
  getQueryAPACTP(anios: String[]) {
    let parameters: any = {
      anios: anios
    };
    return this.http.get<any>(base_url + `/queryAPACTP`, { params: parameters, withCredentials: true });
  }

  ///mayor concentracion red
  getQueryAPACMCR(anios: String[]) {
    let parameters: any = {
      anios: anios
    };
    return this.http.get<any>(base_url + `/queryAPACMCR`, { params: parameters, withCredentials: true });
  }

  ///mayor concentrado centro
  getQueryAPACMCC(anios: String[]) {
    let parameters: any = {
      anios: anios
    };
    return this.http.get<any>(base_url + `/queryAPACMCC`, { params: parameters, withCredentials: true });
  }



  ///graficos Detalle por patología
  /// total de pacientes
  getQueryDPTP(patologias: String[], anios: String[], codreds: String[], codcens: String[], grupo_edades: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds,
      codcens: codcens,
      grupo_edades: grupo_edades
    };
    return this.http.get<any>(base_url + `/queryDPTP`, { params: parameters, withCredentials: true });
  }

  ///Total diagnosticos distintos
  getQueryDPTDD(patologias: String[], anios: String[], codreds: String[], codcens: String[], grupo_edades: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds,
      codcens: codcens,
      grupo_edades: grupo_edades
    };
    return this.http.get<any>(base_url + `/queryDPTDD`, { params: parameters, withCredentials: true });
  }

  ///Distribucion sexo
  getQueryDPDS(patologias: String[], anios: String[], codreds: String[], codcens: String[], grupo_edades: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds,
      codcens: codcens,
      grupo_edades: grupo_edades
    };
    return this.http.get<any>(base_url + `/queryDPDS`, { params: parameters, withCredentials: true });
  }

  ///Distribucion por grupo etario
  getQueryDPDGE(patologias: String[], anios: String[], codreds: String[], codcens: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds,
      codcens: codcens,
    };
    return this.http.get<any>(base_url + `/queryDPDGE`, { params: parameters, withCredentials: true });
  }

  ///Tabla diagnosticos
  getQueryDPTD(patologias: String[], anios: String[], codreds: String[], codcens: String[], grupo_edades: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds,
      codcens: codcens,
      grupo_edades: grupo_edades
    };
    return this.http.get<any>(base_url + `/queryDPTD`, { params: parameters, withCredentials: true });
  }

  ///evolucion anual
  getQueryDPEA(patologias: String[], codreds: String[], codcens: String[], grupo_edades: String[]) {
    let parameters: any = {
      patologias: patologias,
      codreds: codreds,
      codcens: codcens,
      grupo_edades: grupo_edades
    };
    return this.http.get<any>(base_url + `/queryDPEA`, { params: parameters, withCredentials: true });
  }

  ///Pacientes por servicio
  getQueryDPPS(patologias: String[], anios: String[], codreds: String[], codcens: String[], grupo_edades: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds,
      codcens: codcens,
      grupo_edades: grupo_edades
    };
    return this.http.get<any>(base_url + `/queryDPPS`, { params: parameters, withCredentials: true });
  }

  ///Ranking por centro
  getQueryDPRC(patologias: String[], anios: String[], codreds: String[]) {
    let parameters: any = {
      patologias: patologias,
      anios: anios,
      codreds: codreds
    };
    return this.http.get<any>(base_url + `/queryDPRC`, { params: parameters, withCredentials: true });
  }




  ////Comorbilidad del paciente
  ///buscar pacientes 
  getQueryCPCPD(documento: String) {
    return this.http.get<any[]>(base_url + `/queryCPCPD/${documento}`, { withCredentials: true });
  }

}
