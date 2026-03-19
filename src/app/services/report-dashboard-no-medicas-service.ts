import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/no-medica';

@Injectable({
  providedIn: 'root',
})
export class ReportDashboardNoMedicasService {
  constructor(private http: HttpClient) {}

  /// Query Dashboard no medicas
  /// Obstetricia - Atenciones Medicas
  getQueryDNMOA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMOA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Obstetricia - Prenatal
  getQueryDNMOP(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMOP/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Obstetricia - Familiar
  getQueryDNMOF(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMOF/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Obstetricia - Complementarias
  getQueryDNMOC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMOC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Obstetricia - Preconcepcional
  getQueryDNMOPC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMOPC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///  Preventivo Promocional - Atenciones
  getQueryDNMPPA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMPPA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Preventivo Promocional - domiciliaria
  getQueryDNMPPD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Preventivo Promocional - grupal
  getQueryDNMPPG(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPG/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Preventivo Promocional - psicoprofilaxis
  getQueryDNMPPP(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPP/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Preventivo Promocional - consejeria
  getQueryDNMPPC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///  Nutricion - nutricion_total
  getQueryDNMNNT(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMNNT/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///  Enfermeria - enfermeria_total
  getQueryDNMEET(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMEET/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Enfermeria - enfermeria_tuberculosis
  getQueryDNMEETU(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMEETU/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Enfermeria - enfermeria_vih
  getQueryDNMEETV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMEEV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Enfermeria - enfermeria_cronicas_am
  getQueryDNMEECA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMEECA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Enfermeria - enfermeria_otros
  getQueryDNMEEO(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMEEO/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  ///  Enfermeria - enfermeria_prev_anemia
  getQueryDNMEEPA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMEEPA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Psicologia
  /// psicologia total consultantes
  getQueryDNMPSTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPSTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// psicologia - total - consultas
  getQueryDNMPSTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPSTC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Psicologia - horas - efectivas
  getQueryDNMPSHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDNMPSHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Psicologia - horas - programadas
  getQueryDNMPHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDNMPHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Psicologia - medicos
  getQueryDNMPSM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDNMPSM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Psicologia - procedimiento terapéutico
  getQueryDNMPSPT(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMPSPT/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Psicologia - procedimiento diagnóstico
  getQueryDNMPSPD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMPSPD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  ///Trabajo Social (TS)
  ///Trabajo - social - total
  getQueryDNMTST(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMTST/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Procedimientos terapéuticos (PT)
  /// Procedimientos terapéuticos - total
  getQueryDNMPTT(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTT/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Procedimientos terapéuticos - terapia Individual
  getQueryDNMPTTI(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTTI/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Procedimientos terapéuticos - terapia pareja / familiar
  getQueryDNMPTTPF(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTTPF/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Procedimientos terapéuticos - terapia grupal
  getQueryDNMPTTG(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTTG/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Procedimientos diagnósticos (PD)
  /// Procedimientos diagnósticos - total
  getQueryDNMPDT(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPDT/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// CRED
  /// CRED -total
  getQueryDNMCREDT(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMCREDT/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de obstetricia
  /// total atenciones - servicio - subactividad
  getQueryDNMOBBTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMOBTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMOBTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMOBTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMOBTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMOBTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de preventiva promocional
  /// total atenciones - servicio - subactividad
  getQueryDNMPPTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMPPTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMPPTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPPTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de nutricion
  /// total atenciones - servicio - subactividad
  getQueryDNMNUTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMNUTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMNUTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMNUTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMNUTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMNUTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de enfermeria
  /// total atenciones - servicio - subactividad
  getQueryDNMENTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMENTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMENTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMENTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMENTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDNMENTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de psicologia
  /// total atenciones - servicio - subactividad
  getQueryDNMPSTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPSTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMPSTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPSTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMPSTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPSTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de trabajo social
  /// total atenciones - servicio - subactividad
  getQueryDNMTSTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMTSTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMTSTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMTSTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMTSTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMTSTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de procedimientos terapeuticos
  /// total atenciones - servicio - subactividad
  getQueryDNMPTTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMPTTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMPTTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPTTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Indicadores de procedimiento diagnostico
  /// total atenciones - servicio - subactividad
  getQueryDNMPDTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPDTASS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - diagnostico
  getQueryDNMPDTAD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPDTAD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// total atenciones - csv
  getQueryDNMPDTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDNMPDTACSV/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
}
