import { Injectable } from '@angular/core';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root',
})
export class DataImport {
  saveUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  saveDataCentro(codcas?: string, nameCentro?: string): void {
    const data: { c?: string; n?: string } = {};

    if (codcas?.trim()) {
      data.c = codcas;
    }

    if (nameCentro?.trim()) {
      data.n = nameCentro;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('dc', JSON.stringify(data));
    }
  }

  getDataCentro(): { codcas?: string; nameCentro?: string } {
    const raw = localStorage.getItem('dc');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        codcas: data.c,
        nameCentro: data.n,
      };
    } catch {
      return {};
    }
  }

  saveDataModulo(modulo: string): void {

    const data: { modulo?: string } = {};

    if (modulo?.trim()) {
      data.modulo = modulo;
    }
    if (Object.keys(data).length > 0) {
      localStorage.setItem('modulo', JSON.stringify(data));
    }


  }

  getDataModulo(): {modulo?: string} {
    const raw = localStorage.getItem('modulo');
   if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        modulo: data.modulo,
      };
    } catch {
      return {};
    }

  }

  clearAllAppData(): void {
    const keys = ['dc', 'data_dma', 'data_dmmc', 'data_dmmo', 'data_dmmp'];
    keys.forEach((k) => localStorage.removeItem(k));
  }

  ///datos de filtros de dashboard medicas (DM)
  ///guardar datos de filtros de dashboard-medicas-atenciones
  saveDataDMA(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dma', JSON.stringify(data));
    }
  }
  getDataDMA(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dma');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  ///guardar datos de filtros de dashboard-medicas-medicina-complementaria
  saveDataDMMC(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dmmc', JSON.stringify(data));
    }
  }
  getDataDMMC(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dmmc');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  ///guardar datos de filtros de dashboard-medicas-medicina-ocupacional
  saveDataDMMO(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dmmo', JSON.stringify(data));
    }
  }
  getDataDMMO(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dmmo');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  ///guardar datos de filtros de dashboard-medicas-medicos-personal
  saveDataDMMP(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dmmp', JSON.stringify(data));
    }
  }
  getDataDMMP(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dmmp');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-medicas-consulta-atencion-inmediata
  saveDataDMCAI(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dmcai', JSON.stringify(data));
    }
  }
  getDataDMCAI(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dmcai');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-medicas-cons-apoyo-desc
  saveDataDMCAD(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dmcad', JSON.stringify(data));
    }
  }
  getDataDMCAD(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dmcad');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  ///datos de filtros de dashboard no medicas
  //guardar datos de filtros de dashboard-no-medicas-obstetricia
  saveDataDNMOB(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmo', JSON.stringify(data));
    }
  }
  getDataDNMOB(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmo');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }
  //guardar datos de filtros de dashboard-no-medicas-preventivo-promocional
  saveDataDNMPP(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmpp', JSON.stringify(data));
    }
  }
  getDataDNMPP(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmpp');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-no-medicas-nutricion
  saveDataDNMNU(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmnu', JSON.stringify(data));
    }
  }
  getDataDNMNU(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmnu');
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-no-medicas-enfermeria
  saveDataDNMEN(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnme', JSON.stringify(data));
    }
  }
  getDataDNMEN(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnme');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-no-medicas-psicologia
  saveDataDNMPS(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }
    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmp', JSON.stringify(data));
    }
  }
  getDataDNMPS(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmp');
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-no-medicas-trabajo-social
  saveDataDNMTS(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }
    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmt', JSON.stringify(data));
    }
  }
  getDataDNMTS(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmt');
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-no-medicas-procedimientos terapéuticos
  saveDataDNMPT(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }
    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmp', JSON.stringify(data));
    }
  }
  getDataDNMPT(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmp');
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-no-medicas-procedimientos diagnósticos
  saveDataDNMPD(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }
    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_dnmpd', JSON.stringify(data));
    }
  }
  getDataDNMPD(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_dnmpd');
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  //guardar datos de filtros de dashboard-emergencias
  saveDataDE(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }

    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }

    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_de', JSON.stringify(data));
    }
  }
  getDataDE(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_de');
    if (!raw) return {};

    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }



  ///guardar datos de filtros de dashboard-intervenciones-quirurgicas
  saveDataIQGC(anio?: string, periodo?: string, codasegu?: string): void {
    const data: { a?: string; p?: string; c?: string } = {};

    if (anio?.trim()) {
      data.a = anio;
    }
    if (periodo?.trim()) {
      data.p = periodo;
    }
    if (codasegu?.trim()) {
      data.c = codasegu;
    }
    if (Object.keys(data).length > 0) {
      localStorage.setItem('data_iqgc', JSON.stringify(data));
    }
  }
  getDataIQGC(): { anio?: string; periodo?: string; codasegu?: string } {
    const raw = localStorage.getItem('data_iqgc');
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return {
        anio: data.a,
        periodo: data.p,
        codasegu: data.c,
      };
    } catch {
      return {};
    }
  }

  deleteDataIndicadores(): void {
    const keys = [
      'data_dma',
      'data_dmmc',
      'data_dmmo',
      'data_dmmp',
      'data_dmcai',
      'data_dmcad',
      'data_dnmo',
      'data_dnmpp',
      'data_dnmnu',
      'data_dnme',
      'data_dnmp',
      'data_dnmt',
      'data_dnmp',
      'data_dnmpd',
      'data_de',
      'data_iqgc',
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  }
}
