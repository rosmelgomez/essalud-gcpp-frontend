import { Injectable } from '@angular/core';
import { BackendCredentials } from '../model/backendcredentials';
import { HttpClient } from '@angular/common/http';

const base_url = BackendCredentials.api + '/medica';

@Injectable({
  providedIn: 'root',
})
export class ReportDashboardMedicasService {
  constructor(private http: HttpClient) { }

  /// Query Dashboard medicas
  /// Atenciones Medicas
  getQueryDMAMA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMAMA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Atenciones médicas - horas efectivas
  getQueryDMAMHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMAMHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Atenciones médicas - horas programadas
  getQueryDMAMHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMAMHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Atenciones médicas - citadas
  getQueryDMAMC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMAMC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Atenciones médicas - desercion
  getQueryDMAMD(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMAMD/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Atenciones médicas - medicos
  getQueryDMAMM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMAMM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Atenciones médicas - total consultante
  getQueryDMAMTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMAMTC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Atenciones médicas - total consultante servicio
  getQueryDMAMTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMAMTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Medicinas Complementaria - atenciones
  getQueryDMMCA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMCA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Medicinas Complementaria - horas efectivas
  getQueryDMMCHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMMCHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Medicinas Complementaria - horas programadas
  getQueryDMMCHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMMCHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Medicinas Complementaria - medicos
  getQueryDMMCM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMMCM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Medicinas Complementaria - total consultante
  getQueryDMMCTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMCTC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Medicinas Complementaria - total consultante servicio
  getQueryDMMCTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMCTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Medicina Ocupacional - atenciones
  getQueryDMMOA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMOA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Medicina Ocupacional - horas efectivas
  getQueryDMMOHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMMOHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Medicina Ocupacional - horas programadas
  getQueryDMMOHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMMOHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Medicina Ocupacional - medicos
  getQueryDMMOM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMMOM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Medicina Ocupacional - total consultante
  getQueryDMMOTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDMMOTC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Medicina Ocupacional - total consultante servicio
  getQueryDMMOTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMOTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Médico Personal - Atenciones
  getQueryDMMPA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMPA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Médico Personal - Horas Efectivas
  getQueryDMMPHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMMPHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Médico Personal - Horas Programadas
  getQueryDMMPHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMMPHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Médico Personal - Medicos
  getQueryDMMPM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMMPM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Médico Personal - Total Consultante
  getQueryDMMPTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMMPTC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Médico Personal - Total Consultante Servicio
  getQueryDMMPTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>( base_url + `/queryDMMPTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Consulta Atención Inmediata - atenciones
  getQueryDMCAIA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMCAIA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Consulta Atención Inmediata - horas efectivas
  getQueryDMCAIHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMCAIHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Consulta Atención Inmediata - horas programadas
  getQueryDMCAIHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMCAIHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Consulta Atención Inmediata - medicos
  getQueryDMCAIM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMCAIM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Consulta Atención Inmediata - total de consultante
  getQueryDMCAITC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMCAITC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Consulta Atención Inmediata - total de consultante servicio
  getQueryDMCAITCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMCAITCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /// Consulta Apoyo Desc - atenciones
  getQueryDMCADA(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMCADA/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Consulta Apoyo Desc - horas efectivas
  getQueryDMCADHE(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMCADHE/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Consulta Apoyo Desc - horas programadas
  getQueryDMCADHP(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>(base_url + `/queryDMCADHP/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Consulta Apoyo Desc - medicos
  getQueryDMCADM(anio: string, periodo: string, codcas: string) {
    return this.http.get<any>( base_url + `/queryDMCADM/${anio}/${periodo}/${codcas}`, { withCredentials: true });
  }
  /// Consulta Apoyo Desc - total consultante
  getQueryDMCADTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMCADTC/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }
  /// Consulta Apoyo Desc - total consultante servicio
  getQueryDMCADTCS(anio: string, periodo: string, codcas: string, codasegu: string) {
    return this.http.get<any>(base_url + `/queryDMCADTCS/${anio}/${periodo}/${codcas}/${codasegu}`, { withCredentials: true });
  }

  /* Indicadores de atenciones medicas */
  // total_atenciones - servicio - subactividad
  getQuery0DMAMTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMAMTASS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_atenciones - agrupador - especialidad
  getQuery1DMAMTAAE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMAMTAAE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_atenciones  - no considerados
  getQuery2DMAMTANC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMAMTANC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_atenciones  - sexo grupo etario
  getQuery3DMAMTASGE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query3DMAMTASGE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_atenciones  - CSV
  getQuery4DMAMTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query4DMAMTACSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /// total_medicos - query 0
  getQuery0DMAMTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMAMTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_medicos - query 1
  getQuery1DMAMTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMAMTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_medicos - query 2 csv
  getQuery2DMAMTMCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMAMTMCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /// total_horas_efectivas
  getQuery0DMAMHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/query0DMAMHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /// total_horas_programadas
  getQuery0DMAMHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/query0DMAMHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  // total_citados
  getQuery0DMAMTC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMAMTC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /// total_deserción - query 0
  getQuery0DMAMTD(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMAMTD/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_deserción - query 1
  getQuery1DMAMTD(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMAMTD/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total_deserción - query 2 csv
  getQuery2DMAMTDCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMAMTDCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  ///Indicadores de medicina complementaria
  /// total - atenciones- servicio - subactividad
  getQuery0DMMCTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMMCTASS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total - atenciones- agrupador - especialidad
  getQuery1DMMCTAAE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMMCTAAE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones - no considerados
  getQuery2DMMCTANC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMMCTANC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- sexo y grupo etario vs atenciones
  getQuery3DMMCTASGEA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query3DMMCTASGEA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- CSV
  getQuery4DMMCTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query4DMMCTACSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  ///total - medicos query0
  getQuery0DMMCTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMMCTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query1
  getQuery1DMMCTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMMCTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - medicos query2 CSV
  getQuery2DMMCTMCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMMCTMCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- programadas
  getQueryDMMCTHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMMCTHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- efectivas
  getQueryDMMCTHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMMCTHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  ///Indicadores de medicina ocupacional
  /// total - atenciones- servicio - subactividad
  getQuery0DMMOTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMMOTASS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total - atenciones- agrupador - especialidad
  getQuery1DMMOTAAE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMMOTAAE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones - no considerados
  getQuery2DMMOTANC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMMOTANC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- sexo y grupo etario vs atenciones
  getQuery3DMMOTASGEA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query3DMMOTASGEA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- CSV
  getQuery4DMMOTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query4DMMOTACSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query0
  getQuery0DMOCTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMOCTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query1
  getQuery1DMOCTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMOCTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - medicos query2 CSV
  getQuery2DMMOTMCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMMOTMCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- programadas
  getQueryDMMOTHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMMOTHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- efectivas
  getQueryDMMOTHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMMOTHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  ///Indicadores de medico de personal
  /// total - atenciones- servicio - subactividad
  getQuery0DMMPTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMMPTASS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total - atenciones- agrupador - especialidad
  getQuery1DMMPTAAE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMMPTAAE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones - no considerados
  getQuery2DMMPTANC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMMPTANC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- sexo y grupo etario vs atenciones
  getQuery3DMMPTASGEA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query3DMMPTASGEA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- CSV
  getQuery4DMMPTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query4DMMPTACSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query0
  getQuery0DMMPTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMMPTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query1
  getQuery1DMMPTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMMPTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - medicos query2 CSV
  getQuery2DMMPTMCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMMPTMCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- programadas
  getQueryDMMPTHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMMPTHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- efectivas
  getQueryDMMPTHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMMPTHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  ///Indicadores de consulta de atencion inmediata
  /// total - atenciones- servicio - subactividad
  getQuery0DMCAITASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMCAITASS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total - atenciones- agrupador - especialidad
  getQuery1DMCAITAAE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMCAITAAE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones - no considerados
  getQuery2DMCAITANC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMCAITANC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /// Total - atenciones- sexo y grupo etario vs atenciones
  getQuery3DMCAITASGEA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query3DMCAITASGEA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- CSV
  getQuery4DMCAITACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query4DMCAITACSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query0
  getQuery0DMCAITM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMCAITM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query1
  getQuery1DMCAITM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMCAITM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - medicos query2 CSV
  getQuery2DMCAITMCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMCAITMCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- programadas
  getQueryDMCAITHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMCAITHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- efectivas
  getQueryDMCAITHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMCAITHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  ///Indicadores de cons apoyo desc
  /// total - atenciones- servicio - subactividad
  getQuery0DMCADTASS(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMCADTASS/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// total - atenciones- agrupador - especialidad
  getQuery1DMCADTAAE(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMCADTAAE/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones - no considerados
  getQuery2DMCADTANC(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMCADTANC/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- sexo y grupo etario vs atenciones
  getQuery3DMCADTASGEA(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query3DMCADTASGEA/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  /// Total - atenciones- CSV
  getQuery4DMCADTACSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query4DMCADTACSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query0
  getQuery0DMCADTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query0DMCADTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///total - medicos query1
  getQuery1DMCADTM(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query1DMCADTM/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - medicos query2 CSV
  getQuery2DMCADTMCSV(anio: string, periodo: string, codcas: string, codasegu: string) {
    const url = base_url + `/query2DMCADTMCSV/${anio}/${periodo}/${codcas}/${codasegu}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- programadas
  getQueryDMCADTHP(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMCADTHP/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
  ///Total - horas- efectivas
  getQueryDMCADTHE(anio: string, periodo: string, codcas: string) {
    const url = base_url + `/queryDMCADTHE/${anio}/${periodo}/${codcas}`;
    return this.http.get<any>(url, { withCredentials: true });
  }
}
