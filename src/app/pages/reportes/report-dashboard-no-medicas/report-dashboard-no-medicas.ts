import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../../services/local-storage-service';
import { FileService } from '../../../services/file-service';

import { forkJoin } from 'rxjs';
import { ReportDashboardNoMedicasService } from '../../../services/reportes/report-dashboard-no-medicas-service';

@Component({
  selector: 'app-report-dashboard-no-medicas',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-dashboard-no-medicas.html',
  styleUrl: './report-dashboard-no-medicas.css',
})
export class ReportDashboardNoMedicas implements OnInit {
  currentDate: string = '';

  //data importantes
  centroAtencion: string = '';
  codcas: string = '';

  // Estados para obstetricia
  loadingO: boolean = false;
  errorO: string | null = null;
  noDataO: boolean = false;
  selectPeriodoO: boolean = true;

  // Estados para preventivo promocional
  loadingPP: boolean = false;
  errorPP: string | null = null;
  noDataPP: boolean = false;
  selectPeriodoPP: boolean = true;

  // Estados para nutricion
  loadingN: boolean = false;
  errorN: string | null = null;
  noDataN: boolean = false;
  selectPeriodoN: boolean = true;

  // Estados para enfermeria
  loadingE: boolean = false;
  errorE: string | null = null;
  noDataE: boolean = false;
  selectPeriodoE: boolean = true;

  //Estados para psicologia
  loadingPs: boolean = false;
  errorPs: string | null = null;
  noDataPs: boolean = false;
  selectPeriodoPs: boolean = true;

  //Estados para trabajo social
  loadingTs: boolean = false;
  errorTs: string | null = null;
  noDataTs: boolean = false;
  selectPeriodoTs: boolean = true;

  //Estados para procedimientos terapeuticos
  loadingPT: boolean = false;
  errorPT: string | null = null;
  noDataPT: boolean = false;
  selectPeriodoPT: boolean = true;

  //Estados para procedimientos diagnosticos
  loadingPD: boolean = false;
  errorPD: string | null = null;
  noDataPD: boolean = false;
  selectPeriodoPD: boolean = true;

  //Estados para CRED
  loadingCRED: boolean = false;
  errorCRED: string | null = null;
  noDataCRED: boolean = false;
  selectPeriodoCRED: boolean = true;

  //filtros  para obstetricia
  periodoO: string = '';
  anioO: string = '';
  tipo_aseguradoO: string = '';

  //filtros  para preventivo promocional
  periodoPP: string = '';
  anioPP: string = '';
  tipo_aseguradoPP: string = '';

  //filtros  para nutricion
  periodoN: string = '';
  anioN: string = '';
  tipo_aseguradoN: string = '';

  //filtros  para enfermeria
  periodoE: string = '';
  anioE: string = '';
  tipo_aseguradoE: string = '';

  //filtros  para psicologia
  periodoPs: string = '';
  anioPs: string = '';
  tipo_aseguradoPs: string = '';

  //filtros  para trabajo social
  periodoTs: string = '';
  anioTs: string = '';
  tipo_aseguradoTs: string = '';

  //filtros  para procedimientos terapeuticos
  periodoPt: string = '';
  anioPt: string = '';
  tipo_aseguradoPt: string = '';

  //filtros  para procedimientos diagnosticos
  periodoPd: string = '';
  anioPd: string = '';
  tipo_aseguradoPd: string = '';

  //filtros  para CRED
  periodoCRED: string = '';
  anioCRED: string = '';
  tipo_aseguradoCRED: string = '';

  //Indicadores obstetricia
  atencionesO: number = 0;
  atencionesPrenatalesO: number = 0;
  atencionesPlanificacionFamiliarO: number = 0;
  actividadesComplementariasO: number = 0;
  atencionesPreconcepcionalO: number = 0;

  //Indicadores preventivo promocional
  atencionesPP: number = 0;
  visitasDomiciliariasPP: number = 0;
  educacionGrupalPP: number = 0;
  psicoprofilaxisPP: number = 0;
  consejeriaPP: number = 0;

  //indicadores nutricion
  atencionesN: number = 0;

  //Indicadores enfermeria
  atencionesE: number = 0;
  atencionesTuberculosisE: number = 0;
  atencionItsE: number = 0;
  atencionEnfermedadesCronicasE: number = 0;
  otrasActividadesE: number = 0;
  atencionPreventivoE: number = 0;

  //indicadores psicologia
  consultantesPs: number = 0;
  consultasPs: number = 0;
  horasEfectivasPs: number = 0;
  horasProgramadasPs: number = 0;
  medicosPs: number = 0;
  procedimientosTerapeuticosPs: number = 0;
  procedimientosDiagnosticosPs: number = 0;

  //indicadores trabajo social
  trabajoSocialAtenciones: number = 0;

  //indicadores procedimientos terapeuticos
  procedimientosTerapeuticosAtenciones: number = 0;
  terapiaIndividual: number = 0;
  terapiaFamiliar: number = 0;
  terapiaGrupal: number = 0;

  //indicadores CRED
  credAtenciones: number = 0;

  //indicadores procedimientos diagnosticos
  procedimientosDiagnosticosAtenciones: number = 0;

  //data indicadores obstetricia
  dataAtencionesO: any[] = [];
  dataAtencionesPrenatalesO: any[] = [];
  dataAtencionesPlanificacionFamiliarO: any[] = [];
  dataActividadesComplementariasO: any[] = [];
  dataAtencionesPreconcepcionalO: any[] = [];

  //Data indicadores preventivo promocional
  dataAtencionesPP: any[] = [];
  dataVisitasDomiciliariasPP: any[] = [];
  dataEducacionGrupalPP: any[] = [];
  dataPsicoprofilaxisPP: any[] = [];
  dataConsejeriaPP: any[] = [];

  //data indicadores nutricion
  dataAtencionesN: any[] = [];

  //data indicadores enfermeria
  dataAtencionesE: any[] = [];
  dataAtencionesTuberculosisE: any[] = [];
  dataAtencionItsE: any[] = [];
  dataAtencionEnfermedadesCronicasE: any[] = [];
  dataOtrasActividadesE: any[] = [];
  dataAtencionPreventivoE: any[] = [];

  //data indicadores psicologia
  dataConsultasPs: any[] = [];
  dataHorasEfectivasPs: any[] = [];
  dataHorasProgramadasPs: any[] = [];
  dataMedicosPs: any[] = [];
  dataProcedimientosTerapeuticosPs: any[] = [];
  dataProcedimientosDiagnosticosPs: any[] = [];

  //data indicadores trabajo social
  dataTrabajoSocialAtenciones: any[] = [];

  //data indicadores procedimientos terapeuticos
  dataProcedimientosTerapeuticosAtenciones: any[] = [];
  dataTerapiaIndividual: any[] = [];
  dataTerapiaFamiliar: any[] = [];
  dataTerapiaGrupal: any[] = [];

  //data indicadores procedimientos diagnosticos
  dataProcedimientosDiagnosticosAtenciones: any[] = [];

  //data indicadores CRED
  dataCredAtenciones: any[] = [];

  constructor(
    private dataImport: LocalStorageService,
    private RDNMS: ReportDashboardNoMedicasService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentDate = this.formatDate(new Date());
    this.centroAtencion = this.dataImport.getDataCentro()?.nameCentro || '';
    this.codcas = this.dataImport.getDataCentro()?.codcas || '';
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  downloadFichaTecnica(): void {
    this.fileService.getFile('f_consulta_externa_nm.pdf').subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'FICHA_TECNICA_NO_MEDICAS.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => {
        console.error('Error al descargar la ficha técnica:', err);
        alert(
          'Hubo un error al descargar la ficha técnica. Por favor, inténtelo de nuevo más tarde.',
        );
      },
    });
  }

  loadDashboardObstetricia() {
    if (!this.periodoO || !this.anioO || !this.tipo_aseguradoO) {
      this.errorO = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }

    this.loadingO = true;
    this.errorO = null;
    this.noDataO = false;
    this.selectPeriodoO = false;
    this.cdr.detectChanges();

    forkJoin({
      atenciones: this.RDNMS.getQueryDNMOA(
        this.anioO,
        this.periodoO,
        this.codcas,
        this.tipo_aseguradoO,
      ),
      atencionesPrenatales: this.RDNMS.getQueryDNMOP(
        this.anioO,
        this.periodoO,
        this.codcas,
        this.tipo_aseguradoO,
      ),
      atencionesPlanificacionFamiliar: this.RDNMS.getQueryDNMOF(
        this.anioO,
        this.periodoO,
        this.codcas,
        this.tipo_aseguradoO,
      ),
      actividadesComplementarias: this.RDNMS.getQueryDNMOC(
        this.anioO,
        this.periodoO,
        this.codcas,
        this.tipo_aseguradoO,
      ),
      atencionesPreconcepcional: this.RDNMS.getQueryDNMOPC(
        this.anioO,
        this.periodoO,
        this.codcas,
        this.tipo_aseguradoO,
      ),
    }).subscribe({
      next: (results) => {
        // Atenciones
        this.atencionesO = results.atenciones.length || 0;
        // Atenciones Prenatales
        this.atencionesPrenatalesO = results.atencionesPrenatales.length || 0;
        //data por actespnom
        const actespnomCountMapPren = new Map<string, number>();
        for (const row of results.atencionesPrenatales) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapPren.set(actespnom, (actespnomCountMapPren.get(actespnom) || 0) + 1);
        }
        this.dataAtencionesPrenatalesO = Array.from(
          actespnomCountMapPren,
          ([actespnom, total]) => ({
            actespnom,
            total,
          }),
        );
        this.dataAtencionesPrenatalesO.sort((a, b) => b.total - a.total);

        // Atenciones Planificación Familiar
        this.atencionesPlanificacionFamiliarO = results.atencionesPlanificacionFamiliar.length || 0;
        //data por actespnom
        const actespnomCountMapPlan = new Map<string, number>();
        for (const row of results.atencionesPlanificacionFamiliar) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapPlan.set(actespnom, (actespnomCountMapPlan.get(actespnom) || 0) + 1);
        }
        this.dataAtencionesPlanificacionFamiliarO = Array.from(
          actespnomCountMapPlan,
          ([actespnom, total]) => ({
            actespnom,
            total,
          }),
        );
        this.dataAtencionesPlanificacionFamiliarO.sort((a, b) => b.total - a.total);

        // Actividades Complementarias
        this.actividadesComplementariasO = results.actividadesComplementarias.length || 0;
        //data por actespnom
        const actespnomCountMapCom = new Map<string, number>();
        for (const row of results.actividadesComplementarias) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapCom.set(actespnom, (actespnomCountMapCom.get(actespnom) || 0) + 1);
        }
        this.dataActividadesComplementariasO = Array.from(
          actespnomCountMapCom,
          ([actespnom, total]) => ({
            actespnom,
            total,
          }),
        );
        this.dataActividadesComplementariasO.sort((a, b) => b.total - a.total);

        // Atenciones Preconcepcional
        this.atencionesPreconcepcionalO = results.atencionesPreconcepcional.length || 0;
        //data por actespnom
        const actespnomCountMapPre = new Map<string, number>();
        for (const row of results.atencionesPreconcepcional) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapPre.set(actespnom, (actespnomCountMapPre.get(actespnom) || 0) + 1);
        }
        this.dataAtencionesPreconcepcionalO = Array.from(
          actespnomCountMapPre,
          ([actespnom, total]) => ({
            actespnom,
            total,
          }),
        );
        this.dataAtencionesPreconcepcionalO.sort((a, b) => b.total - a.total);

        this.loadingO = false;
        this.cdr.detectChanges();
        this.dataImport.saveDataDNMOB(this.anioO, this.periodoO, this.tipo_aseguradoO);
      },
    });
  }

  loadDashboardPreventivoPromocional() {
    if (!this.periodoPP || !this.anioPP || !this.tipo_aseguradoPP) {
      this.errorPP = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }

    this.loadingPP = true;
    this.errorPP = null;
    this.noDataPP = false;
    this.selectPeriodoPP = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesPP: this.RDNMS.getQueryDNMPPA(
        this.anioPP,
        this.periodoPP,
        this.codcas,
        this.tipo_aseguradoPP,
      ),
      visitasDomiciliariasPP: this.RDNMS.getQueryDNMPPD(
        this.anioPP,
        this.periodoPP,
        this.codcas,
        this.tipo_aseguradoPP,
      ),
      educacionGrupalPP: this.RDNMS.getQueryDNMPPG(
        this.anioPP,
        this.periodoPP,
        this.codcas,
        this.tipo_aseguradoPP,
      ),
      psicoprofilaxisPP: this.RDNMS.getQueryDNMPPP(
        this.anioPP,
        this.periodoPP,
        this.codcas,
        this.tipo_aseguradoPP,
      ),
      consejeriaPP: this.RDNMS.getQueryDNMPPC(
        this.anioPP,
        this.periodoPP,
        this.codcas,
        this.tipo_aseguradoPP,
      ),
    }).subscribe({
      next: (results) => {
        // Atenciones
        this.atencionesPP = results.atencionesPP.length || 0;

        // Visitas Domiciliarias
        this.visitasDomiciliariasPP = results.visitasDomiciliariasPP.length || 0;
        //data por actespnom
        const actespnomCountMapVD = new Map<string, number>();
        for (const row of results.visitasDomiciliariasPP) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapVD.set(actespnom, (actespnomCountMapVD.get(actespnom) || 0) + 1);
        }
        this.dataVisitasDomiciliariasPP = Array.from(actespnomCountMapVD, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataVisitasDomiciliariasPP.sort((a, b) => b.total - a.total);

        // Educacion Grupal
        this.educacionGrupalPP = results.educacionGrupalPP.length || 0;
        //data por actespnom
        const actespnomCountMapEG = new Map<string, number>();
        for (const row of results.educacionGrupalPP) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapEG.set(actespnom, (actespnomCountMapEG.get(actespnom) || 0) + 1);
        }
        this.dataEducacionGrupalPP = Array.from(actespnomCountMapEG, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataEducacionGrupalPP.sort((a, b) => b.total - a.total);

        // Psicoprofilaxis
        this.psicoprofilaxisPP = results.psicoprofilaxisPP.length || 0;
        //data por actespnom
        const actespnomCountMapPP = new Map<string, number>();
        for (const row of results.psicoprofilaxisPP) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapPP.set(actespnom, (actespnomCountMapPP.get(actespnom) || 0) + 1);
        }
        this.dataPsicoprofilaxisPP = Array.from(actespnomCountMapPP, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataPsicoprofilaxisPP.sort((a, b) => b.total - a.total);

        // Consejeria
        this.consejeriaPP = results.consejeriaPP.length || 0;
        //data por actespnom
        const actespnomCountMapC = new Map<string, number>();
        for (const row of results.consejeriaPP) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapC.set(actespnom, (actespnomCountMapC.get(actespnom) || 0) + 1);
        }
        this.dataConsejeriaPP = Array.from(actespnomCountMapC, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataConsejeriaPP.sort((a, b) => b.total - a.total);

        this.dataImport.saveDataDNMPP(this.anioPP, this.periodoPP, this.tipo_aseguradoPP);
        this.loadingPP = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardNutricion() {
    if (!this.periodoN || !this.anioN || !this.tipo_aseguradoN) {
      this.errorN = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }

    this.loadingN = true;
    this.errorN = null;
    this.noDataN = false;
    this.selectPeriodoN = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesN: this.RDNMS.getQueryDNMNNT(
        this.anioN,
        this.periodoN,
        this.codcas,
        this.tipo_aseguradoN,
      ),
    }).subscribe({
      next: (results) => {
        this.atencionesN = results.atencionesN.length || 0;
        //data por actespnom
        const actespnomCountMap = new Map<string, number>();
        for (const row of results.atencionesN) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMap.set(actespnom, (actespnomCountMap.get(actespnom) || 0) + 1);
        }
        this.dataAtencionesN = Array.from(actespnomCountMap, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataAtencionesN.sort((a, b) => b.total - a.total);

        this.dataImport.saveDataDNMNU(this.anioN, this.periodoN, this.tipo_aseguradoN);
        this.loadingN = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardEnfermeria() {
    if (!this.periodoE || !this.anioE || !this.tipo_aseguradoE) {
      this.errorE = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }

    this.loadingE = true;
    this.errorE = null;
    this.noDataE = false;
    this.selectPeriodoE = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesE: this.RDNMS.getQueryDNMEET(
        this.anioE,
        this.periodoE,
        this.codcas,
        this.tipo_aseguradoE,
      ),
      atencionesTuberculosisE: this.RDNMS.getQueryDNMEETU(
        this.anioE,
        this.periodoE,
        this.codcas,
        this.tipo_aseguradoE,
      ),
      atencionItsE: this.RDNMS.getQueryDNMEETV(
        this.anioE,
        this.periodoE,
        this.codcas,
        this.tipo_aseguradoE,
      ),
      atencionEnfermedadesCronicasE: this.RDNMS.getQueryDNMEECA(
        this.anioE,
        this.periodoE,
        this.codcas,
        this.tipo_aseguradoE,
      ),
      otrasActividadesE: this.RDNMS.getQueryDNMEEO(
        this.anioE,
        this.periodoE,
        this.codcas,
        this.tipo_aseguradoE,
      ),
      atencionPreventivoE: this.RDNMS.getQueryDNMEEPA(
        this.anioE,
        this.periodoE,
        this.codcas,
        this.tipo_aseguradoE,
      ),
    }).subscribe({
      next: (results) => {
        // Atenciones
        this.atencionesE = results.atencionesE.length || 0;
        // Atenciones Tuberculosis
        this.atencionesTuberculosisE = results.atencionesTuberculosisE.length || 0;
        //data por actespnom
        const actespnomCountMapT = new Map<string, number>();
        for (const row of results.atencionesTuberculosisE) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapT.set(actespnom, (actespnomCountMapT.get(actespnom) || 0) + 1);
        }
        this.dataAtencionesTuberculosisE = Array.from(actespnomCountMapT, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataAtencionesTuberculosisE.sort((a, b) => b.total - a.total);

        // Atencion ITS
        this.atencionItsE = results.atencionItsE.length || 0;
        //data por actespnom
        const actespnomCountMapITS = new Map<string, number>();
        for (const row of results.atencionItsE) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapITS.set(actespnom, (actespnomCountMapITS.get(actespnom) || 0) + 1);
        }
        this.dataAtencionItsE = Array.from(actespnomCountMapITS, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataAtencionItsE.sort((a, b) => b.total - a.total);

        // Atencion Enfermedades Cronicas
        this.atencionEnfermedadesCronicasE = results.atencionEnfermedadesCronicasE.length || 0;
        //data por actespnom
        const actespnomCountMapEC = new Map<string, number>();
        for (const row of results.atencionEnfermedadesCronicasE) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapEC.set(actespnom, (actespnomCountMapEC.get(actespnom) || 0) + 1);
        }
        this.dataAtencionEnfermedadesCronicasE = Array.from(
          actespnomCountMapEC,
          ([actespnom, total]) => ({
            actespnom,
            total,
          }),
        );
        this.dataAtencionEnfermedadesCronicasE.sort((a, b) => b.total - a.total);
        // Otras Actividades
        this.otrasActividadesE = results.otrasActividadesE.length || 0;
        //data por actespnom
        const actespnomCountMapOA = new Map<string, number>();
        for (const row of results.otrasActividadesE) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapOA.set(actespnom, (actespnomCountMapOA.get(actespnom) || 0) + 1);
        }
        this.dataOtrasActividadesE = Array.from(actespnomCountMapOA, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataOtrasActividadesE.sort((a, b) => b.total - a.total);

        // Atencion Preventivo
        this.atencionPreventivoE = results.atencionPreventivoE.length || 0;
        //data por actespnom
        const actespnomCountMapAP = new Map<string, number>();
        for (const row of results.atencionPreventivoE) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapAP.set(actespnom, (actespnomCountMapAP.get(actespnom) || 0) + 1);
        }
        this.dataAtencionPreventivoE = Array.from(actespnomCountMapAP, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataAtencionPreventivoE.sort((a, b) => b.total - a.total);

        this.dataImport.saveDataDNMEN(this.anioE, this.periodoE, this.tipo_aseguradoE);
        this.loadingE = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardPsicologia() {
    if (!this.periodoPs || !this.anioPs || !this.tipo_aseguradoPs) {
      this.errorPs = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    this.loadingPs = true;
    this.errorPs = null;
    this.noDataPs = false;
    this.selectPeriodoPs = false;
    this.cdr.detectChanges();
    forkJoin({
      consultantes: this.RDNMS.getQueryDNMPSTCS(
        this.anioPs,
        this.periodoPs,
        this.codcas,
        this.tipo_aseguradoPs,
      ),
      consultas: this.RDNMS.getQueryDNMPSTC(
        this.anioPs,
        this.periodoPs,
        this.codcas,
        this.tipo_aseguradoPs,
      ),
      horasEfectivas: this.RDNMS.getQueryDNMPSHE(this.anioPs, this.periodoPs, this.codcas),
      horasProgramadas: this.RDNMS.getQueryDNMPHP(this.anioPs, this.periodoPs, this.codcas),
      medicos: this.RDNMS.getQueryDNMPSM(
        this.anioPs,
        this.periodoPs,
        this.codcas,
      ),
      procedemientosTerapeuticos: this.RDNMS.getQueryDNMPSPT(
        this.anioPs,
        this.periodoPs,
        this.codcas,
        this.tipo_aseguradoPs,
      ),
      procedimientosDiagnosticos: this.RDNMS.getQueryDNMPSPD(
        this.anioPs,
        this.periodoPs,
        this.codcas,
        this.tipo_aseguradoPs,
      ),
    }).subscribe({
      next: (results) => {
        this.consultantesPs = results.consultantes[0]?.cantidad || 0;
        this.consultasPs = results.consultas.length || 0;
        this.horasEfectivasPs = results.horasEfectivas.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        this.horasProgramadasPs = results.horasProgramadas.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        this.medicosPs = results.medicos.length || 0;

        this.procedimientosTerapeuticosPs = results.procedemientosTerapeuticos.length || 0;

        this.procedimientosDiagnosticosPs = results.procedimientosDiagnosticos.length || 0;

        this.dataImport.saveDataDNMPS(this.anioPs, this.periodoPs, this.tipo_aseguradoPs);
        this.loadingPs = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardTrabajoSocial() {
    if (!this.periodoTs || !this.anioTs || !this.tipo_aseguradoTs) {
      this.errorTs = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    this.loadingTs = true;
    this.errorTs = null;
    this.noDataTs = false;
    this.selectPeriodoTs = false;
    this.cdr.detectChanges();
    forkJoin({
      trabajoSocialAtenciones: this.RDNMS.getQueryDNMTST(
        this.anioTs,
        this.periodoTs,
        this.codcas,
        this.tipo_aseguradoTs,
      ),
    }).subscribe({
      next: (results) => {
        this.trabajoSocialAtenciones = results.trabajoSocialAtenciones.length || 0;

        this.dataImport.saveDataDNMTS(this.anioTs, this.periodoTs, this.tipo_aseguradoTs);
        this.loadingTs = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardProcedimientosTerapeuticos() {
    if (!this.periodoPt || !this.anioPt || !this.tipo_aseguradoPt) {
      this.errorPT = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    this.loadingPT = true;
    this.errorPT = null;
    this.noDataPT = false;
    this.selectPeriodoPT = false;
    this.cdr.detectChanges();
    forkJoin({
      procedimientosTerapeuticosAtenciones: this.RDNMS.getQueryDNMPTT(
        this.anioPt,
        this.periodoPt,
        this.codcas,
        this.tipo_aseguradoPt,
      ),
      terapiaIndividual: this.RDNMS.getQueryDNMPTTI(
        this.anioPt,
        this.periodoPt,
        this.codcas,
        this.tipo_aseguradoPt,
      ),
      terapiaFamiliar: this.RDNMS.getQueryDNMPTTPF(
        this.anioPt,
        this.periodoPt,
        this.codcas,
        this.tipo_aseguradoPt,
      ),
      terapiaGrupal: this.RDNMS.getQueryDNMPTTG(
        this.anioPt,
        this.periodoPt,
        this.codcas,
        this.tipo_aseguradoPt,
      ),
    }).subscribe({
      next: (results) => {
        /// Procedimientos Terapeuticos - TOTAL ATENCIONES
        this.procedimientosTerapeuticosAtenciones =
          results.procedimientosTerapeuticosAtenciones.length || 0;

        // Terapia Individual
        this.terapiaIndividual = results.terapiaIndividual.length || 0;
        const actespnomCountMapT = new Map<string, number>();
        for (const row of results.terapiaIndividual) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapT.set(actespnom, (actespnomCountMapT.get(actespnom) || 0) + 1);
        }
        this.dataTerapiaIndividual = Array.from(actespnomCountMapT, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataTerapiaIndividual.sort((a, b) => b.total - a.total);

        // Terapia Familiar
        this.terapiaFamiliar = results.terapiaFamiliar.length || 0;
        const actespnomCountMapTF = new Map<string, number>();
        for (const row of results.terapiaFamiliar) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapTF.set(actespnom, (actespnomCountMapTF.get(actespnom) || 0) + 1);
        }
        this.dataTerapiaFamiliar = Array.from(actespnomCountMapTF, ([actespnom, total]) => ({
          actespnom,
          total,
        }));
        this.dataTerapiaFamiliar.sort((a, b) => b.total - a.total);

        // Terapia Grupal
        this.terapiaGrupal = results.terapiaGrupal.length || 0;

        const actespnomCountMapTG = new Map<string, number>();
        for (const row of results.terapiaGrupal) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapTG.set(actespnom, (actespnomCountMapTG.get(actespnom) || 0) + 1);
        }
        this.dataTerapiaGrupal = Array.from(actespnomCountMapTG, ([actespnom, total]) => ({
          actespnom,
          total,
        }));

        this.dataTerapiaGrupal.sort((a, b) => b.total - a.total);

        this.dataImport.saveDataDNMPT(this.anioPt, this.periodoPt, this.tipo_aseguradoPt);
        this.loadingPT = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardProcedimientosDiagnosticos() {
    if (!this.periodoPd || !this.anioPd || !this.tipo_aseguradoPd) {
      this.errorPD = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    this.loadingPD = true;
    this.errorPD = null;
    this.noDataPD = false;
    this.selectPeriodoPD = false;
    this.cdr.detectChanges();
    forkJoin({
      procedimientosDiagnosticosAtenciones: this.RDNMS.getQueryDNMPDT(
        this.anioPd,
        this.periodoPd,
        this.codcas,
        this.tipo_aseguradoPd,
      ),
    }).subscribe({
      next: (results) => {
        this.procedimientosDiagnosticosAtenciones =
          results.procedimientosDiagnosticosAtenciones.length || 0;
        this.dataImport.saveDataDNMPD(this.anioPd, this.periodoPd, this.tipo_aseguradoPd);
        this.loadingPD = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardCRED() {
    if (!this.periodoCRED || !this.anioCRED || !this.tipo_aseguradoCRED) {
      this.errorCRED = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    this.loadingCRED = true;
    this.errorCRED = null;
    this.noDataCRED = false;

    this.selectPeriodoCRED = false;
    this.cdr.detectChanges();
    forkJoin({
      credAtenciones: this.RDNMS.getQueryDNMCREDT(
        this.anioCRED,
        this.periodoCRED,
        this.codcas,
        this.tipo_aseguradoCRED,
      ),
    }).subscribe({
      next: (results) => {
        this.credAtenciones = results.credAtenciones.length || 0;
        //this.dataImport.saveDataDNMCRED(this.anioCRED, this.periodoCRED, this.tipo_aseguradoCRED);

        //data por actespnom
        const actespnomCountMapPren = new Map<string, number>();
        for (const row of results.credAtenciones) {
          const actespnom = (row as any).actespnom || 'Sin data';
          actespnomCountMapPren.set(actespnom, (actespnomCountMapPren.get(actespnom) || 0) + 1);
        }
        this.dataCredAtenciones = Array.from(actespnomCountMapPren, ([actespnom, total]) => ({
          actespnom,
          total,
        }));

        this.dataCredAtenciones.sort((a, b) => b.total - a.total);

        this.loadingCRED = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el dashboard de CRED:', err);
        this.errorCRED =
          'Hubo un error al cargar los datos de CRED. Por favor, inténtelo de nuevo más tarde.';
        this.loadingCRED = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Tabs
  activeTab:
    | 'Obstetricia'
    | 'Preventiva Promocional'
    | 'Nutricion'
    | 'Enfermeria'
    | 'Psicologia'
    | 'Trabajo Social'
    | 'Procedimientos Terapeúticos'
    | 'Procedimientos Diagnósticos'
    | 'CRED' = 'Obstetricia';

  setActiveTab(
    tab:
      | 'Obstetricia'
      | 'Preventiva Promocional'
      | 'Nutricion'
      | 'Enfermeria'
      | 'Psicologia'
      | 'Trabajo Social'
      | 'Procedimientos Terapeúticos'
      | 'Procedimientos Diagnósticos'
      | 'CRED',
  ): void {
    this.activeTab = tab;
  }
}
