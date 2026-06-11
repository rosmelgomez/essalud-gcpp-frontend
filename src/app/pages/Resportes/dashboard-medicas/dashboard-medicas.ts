import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { OnInit } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { FileService } from '../../../services/documentos/file-service';
import { MedicasService } from '../../../services/reportes/medicas-service';

@Component({
  selector: 'app-dashboard-medicas',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-medicas.html',
  styleUrl: './dashboard-medicas.css',
})
export class DashboardMedicas implements OnInit {
  currentDate: string = '';

  // Estados para Atenciones Médicas
  loadingAM: boolean = false;
  errorAM: string | null = null;
  noDataAM: boolean = false;
  selectPeriodoAM: boolean = true;

  // Estados para Medicinas Complementarias
  loadingMC: boolean = false;
  errorMC: string | null = null;
  noDataMC: boolean = false;
  selectPeriodoMC: boolean = true;

  //Estados para Medicina Ocupacional
  loadingMO: boolean = false;
  errorMO: string | null = null;
  noDataMO: boolean = false;
  selectPeriodoMO: boolean = true;

  //Estados para Medico de Personal
  loadingMP: boolean = false;
  errorMP: string | null = null;
  noDataMP: boolean = false;
  selectPeriodoMP: boolean = true;

  //Estados para Consulta de Atencion Intermedia
  loadingCAI: boolean = false;
  errorCAI: string | null = null;
  noDataCAI: boolean = false;
  selectPeriodoCAI: boolean = true;

  //Estados para Consulta de Apoyo  Desc
  loadingCAD: boolean = false;
  errorCAD: string | null = null;
  noDataCAD: boolean = false;
  selectPeriodoCAD: boolean = true;

  //data importantes
  centroAtencion: string = '';
  codcas: string = '';

  //filtros para Atenciones Medicas
  periodo: string = '';
  anio: string = '';
  tipo_asegurado: string = '';

  //filtros para Medicinas Complementarias
  periodo_mc: string = '';
  anio_mc: string = '';
  tipo_asegurado_mc: string = '';

  //filtros para Medicina Ocupacional
  periodo_mo: string = '';
  anio_mo: string = '';
  tipo_asegurado_mo: string = '';

  //filtros para Medico de Personal
  periodo_mp: string = '';
  anio_mp: string = '';
  tipo_asegurado_mp: string = '';

  //filtros para Consulta de Atencion Intermedia
  periodo_cai: string = '';
  anio_cai: string = '';
  tipo_asegurado_cai: string = '';

  //filtros para Consulta de Apoyo  Desc
  periodo_cad: string = '';
  anio_cad: string = '';
  tipo_asegurado_cad: string = '';

  //Indicadores Atenciones Medicas
  totalAtenciones: number = 0;
  totalConsultantesAtencionMedica: number = 0;
  totalConsultantesServicio: number = 0;
  totalMedicos: number = 0;
  horasEfectivas: number = 0;
  horasProgramadas: number = 0;
  desercion: number = 0;
  totalCitasOtorgadas: number = 0;
  totalCitas: number = 0;

  // Indicadores Medicinas Complementarias
  totalAtencionesMC: number = 0;
  totalConsultantesMC: number = 0;
  totalConsultantesServicioMC: number = 0;
  totalMedicosMC: number = 0;
  horasEfectivasMC: number = 0;
  horasProgramadasMC: number = 0;

  // Indicadores Medicina Ocupacional
  totalAtencionesMO: number = 0;
  totalConsultantesMO: number = 0;
  totalConsultantesServicioMO: number = 0;
  totalMedicosMO: number = 0;
  horasEfectivasMO: number = 0;
  horasProgramadasMO: number = 0;

  // Indicadores Medico de Personal
  totalAtencionesMP: number = 0;
  totalConsultantesMP: number = 0;
  totalConsultantesServicioMP: number = 0;
  totalMedicosMP: number = 0;
  horasEfectivasMP: number = 0;
  horasProgramadasMP: number = 0;

  //Indicadores Consulta de Atencion Intermedia
  totalAtencionesCAI: number = 0;
  totalConsultantesCAI: number = 0;
  totalConsultantesServicioCAI: number = 0;
  totalMedicosCAI: number = 0;
  horasEfectivasCAI: number = 0;
  horasProgramadasCAI: number = 0;

  //Indicadores Consulta de Apoyo Desc
  totalAtencionesCAD: number = 0;
  totalConsultantesCAD: number = 0;
  totalConsultantesServicioCAD: number = 0;
  totalMedicosCAD: number = 0;
  horasEfectivasCAD: number = 0;
  horasProgramadasCAD: number = 0;

  //data indicadores Atenciones Medicas
  dataTotalConsultantesServicio: any[] = [];
  dataTotalConsultas: any[] = [];
  dataTotalMedicos: any[] = [];
  dataDesercion: any[] = [];
  dataCitasOtorgadas: any[] = [];
  dataHorasEfectivas: any[] = [];
  dataHorasProgramadas: any[] = [];

  //data indicadores Medicinas Complementarias
  dataTotalConsultantesServicioMC: any[] = [];
  dataTotalConsultasMC: any[] = [];
  dataTotalMedicosMC: any[] = [];
  dataHorasEfectivasMC: any[] = [];
  dataHorasProgramadasMC: any[] = [];

  //data indicadores Medicina Ocupacional
  dataTotalConsultantesServicioMO: any[] = [];
  dataTotalConsultasMO: any[] = [];
  dataTotalMedicosMO: any[] = [];
  dataHorasEfectivasMO: any[] = [];
  dataHorasProgramadasMO: any[] = [];

  //data indicadores Medico de Personal
  dataTotalConsultantesServicioMP: any[] = [];
  dataTotalConsultasMP: any[] = [];
  dataTotalMedicosMP: any[] = [];
  dataHorasEfectivasMP: any[] = [];
  dataHorasProgramadasMP: any[] = [];

  //data indicadores Consulta de Atencion Intermedia
  dataTotalConsultantesServicioCAI: any[] = [];
  dataTotalConsultasCAI: any[] = [];
  dataTotalMedicosCAI: any[] = [];
  dataHorasEfectivasCAI: any[] = [];
  dataHorasProgramadasCAI: any[] = [];

  //data indicadores Consulta de Apoyo Desc
  dataTotalConsultantesServicioCAD: any[] = [];
  dataTotalConsultasCAD: any[] = [];
  dataTotalMedicosCAD: any[] = [];
  dataHorasEfectivasCAD: any[] = [];
  dataHorasProgramadasCAD: any[] = [];

  constructor(
    private report: MedicasService,
    private cdr: ChangeDetectorRef,
    private dataImport: LocalStorageService,
    private fileService: FileService,
  ) { }

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

  downloadFichaTecnica(): void {
    this.fileService.getFile('f_consulta_externa.pdf').subscribe({
      next: (blob: Blob) => {
        // Validar que el archivo se descargó correctamente
        if (!blob || blob.size === 0) {
          alert(
            'No se pudo obtener el archivo. Por favor, descárgalo manualmente desde el servidor o contacta al administrador.',
          );
          return;
        }

        // Descargar el archivo directamente en lugar de abrir visualización
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'FICHA_TECNICA_MEDICAS.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar la ficha técnica:', err);
        alert(
          'No se puede visualizar el archivo en línea. Te recomendamos descargarlo localmente. Si persiste el error, contacta al administrador del sistema.',
        );
      },
    });
  }

  loadDashboardAtencionesMedicas(): void {
    if (!this.periodo || !this.anio || !this.tipo_asegurado) {
      this.errorAM = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }

    // Reset estado
    this.loadingAM = true;
    this.errorAM = null;
    this.noDataAM = false;
    this.selectPeriodoAM = false;
    this.cdr.detectChanges();

    forkJoin({
      atenciones: this.report.getQueryDMAMA(this.anio, this.periodo, this.codcas, this.tipo_asegurado),
      horasEfectivas: this.report.getQueryDMAMHE(this.anio, this.periodo, this.codcas),
      horasProgramadas: this.report.getQueryDMAMHP(this.anio, this.periodo, this.codcas),
      citados: this.report.getQueryDMAMC(this.anio, this.periodo, this.codcas, this.tipo_asegurado),
      desercion: this.report.getQueryDMAMD(this.anio, this.periodo, this.codcas, this.tipo_asegurado),
      medicos: this.report.getQueryDMAMM(this.anio, this.periodo, this.codcas),
      consultantes: this.report.getQueryDMAMTC(this.anio, this.periodo, this.codcas, this.tipo_asegurado),
      consultantesServicio: this.report.getQueryDMAMTCS(this.anio, this.periodo, this.codcas, this.tipo_asegurado),
    }).subscribe({
      next: (result) => {
        this.totalConsultantesAtencionMedica = result.consultantes[0]?.cantidad ?? 0;
        this.totalAtenciones = result.atenciones.length;
        this.totalCitasOtorgadas = result.citados.length;
        this.desercion = result.desercion.length;
        this.totalMedicos = result.medicos.length;

        this.horasEfectivas = result.horasEfectivas.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );

        this.horasProgramadas = result.horasProgramadas.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );

        this.totalConsultantesServicio = result.consultantesServicio.reduce(
          (sum: number, row: { cantidad: any }) => sum + Number(row.cantidad ?? 0),
          0,
        );

        //guardar data para indicadores
        //data para total consultantes por servicio
        this.dataTotalConsultantesServicio = result.consultantesServicio;
        this.dataTotalConsultantesServicio.sort((a, b) => b.cantidad - a.cantidad);

        ///datar para total consultas por agrupador
        const agrupadorCountMap = new Map<string, number>();

        for (const row of result.atenciones) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMap.set(agrupador, (agrupadorCountMap.get(agrupador) || 0) + 1);
        }

        this.dataTotalConsultas = Array.from(agrupadorCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalConsultas.sort((a, b) => b.total - a.total);


        //data total medicos por agrupador
        const medicosCountMap = new Map<string, number>();
        for (const row of result.medicos) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          medicosCountMap.set(agrupador, (medicosCountMap.get(agrupador) || 0) + 1);
        }
        this.dataTotalMedicos = Array.from(medicosCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalMedicos.sort((a, b) => b.total - a.total);

        //data numero de desercion por agrupador
        const desercionCountMap = new Map<string, number>();
        for (const row of result.desercion) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          desercionCountMap.set(agrupador, (desercionCountMap.get(agrupador) || 0) + 1);
        }
        this.dataDesercion = Array.from(desercionCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataDesercion.sort((a, b) => b.total - a.total);

        //data numero de citas otorgadas por agrupador
        const citasOtorgadasCountMap = new Map<string, number>();
        for (const row of result.citados) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          citasOtorgadasCountMap.set(agrupador, (citasOtorgadasCountMap.get(agrupador) || 0) + 1);
        }
        this.dataCitasOtorgadas = Array.from(citasOtorgadasCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataCitasOtorgadas.sort((a, b) => b.total - a.total);

        //data horas efectivas por agrupador
        const horasEfectivasCountMap = new Map<string, number>();
        for (const row of result.horasEfectivas) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMap.set(
            agrupador,
            (horasEfectivasCountMap.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivas = Array.from(horasEfectivasCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasEfectivas.sort((a, b) => b.total - a.total);
        //data horas programadas por agrupador
        const horasProgramadasCountMap = new Map<string, number>();
        for (const row of result.horasProgramadas) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMap.set(
            agrupador,
            (horasProgramadasCountMap.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadas = Array.from(horasProgramadasCountMap, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasProgramadas.sort((a, b) => b.total - a.total);

        // Guardar datos de importación para AM con las variables correctas
        this.dataImport.saveDataDMA(this.anio, this.periodo, this.tipo_asegurado);
        this.loadingAM = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardMedicinasComplementarias(): void {
    if (!this.periodo_mc || !this.anio_mc || !this.tipo_asegurado_mc) {
      this.errorMC = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    // Reset estado
    this.loadingMC = true;
    this.errorMC = null;
    this.noDataMC = false;
    this.selectPeriodoMC = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesMC: this.report.getQueryDMMCA(
        this.anio_mc,
        this.periodo_mc,
        this.codcas,
        this.tipo_asegurado_mc,
      ),
      horasEfectivasMC: this.report.getQueryDMMCHE(this.anio_mc, this.periodo_mc, this.codcas),
      horasProgramadasMC: this.report.getQueryDMMCHP(this.anio_mc, this.periodo_mc, this.codcas),
      consultantesMC: this.report.getQueryDMMCTC(
        this.anio_mc,
        this.periodo_mc,
        this.codcas,
        this.tipo_asegurado_mc,
      ),
      consultanteServicioMC: this.report.getQueryDMMCTCS(
        this.anio_mc,
        this.periodo_mc,
        this.codcas,
        this.tipo_asegurado_mc,
      ),
      medicosMC: this.report.getQueryDMMCM(
        this.anio_mc,
        this.periodo_mc,
        this.codcas,
      ),
    }).subscribe({
      next: (result) => {
        this.totalConsultantesMC = result.consultantesMC[0]?.cantidad ?? 0;
        this.totalAtencionesMC = result.atencionesMC.length;
        this.totalMedicosMC = result.medicosMC.length; //Ajustar cuando haya endpoint de medicos MC

        this.horasEfectivasMC = result.horasEfectivasMC.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        this.horasProgramadasMC = result.horasProgramadasMC.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        this.totalConsultantesServicioMC = result.consultanteServicioMC.reduce(
          (sum: number, row: { cantidad: any }) => sum + Number(row.cantidad ?? 0),
          0,
        );

        // Guardar data para indicadores MC
        //data para total consultantes por servicio
        this.dataTotalConsultantesServicioMC = result.consultanteServicioMC;
        this.dataTotalConsultantesServicioMC.sort((a, b) => b.cantidad - a.cantidad);

        // Data para total medicos MC por agrupador

        const medicosCountMapMC = new Map<string, number>();
        for (const row of result.medicosMC) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          medicosCountMapMC.set(agrupador, (medicosCountMapMC.get(agrupador) || 0) + 1);
        }
        this.dataTotalMedicosMC = Array.from(medicosCountMapMC, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalMedicosMC.sort((a, b) => b.total - a.total);

        // Data para total consultas MC por agrupador
        const agrupadorCountMapMC = new Map<string, number>();
        for (const row of result.atencionesMC) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMapMC.set(agrupador, (agrupadorCountMapMC.get(agrupador) || 0) + 1);
        }
        this.dataTotalConsultasMC = Array.from(agrupadorCountMapMC, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalConsultasMC.sort((a, b) => b.total - a.total);

        // Data horas efectivas MC por agrupador
        const horasEfectivasCountMapMC = new Map<string, number>();
        for (const row of result.horasEfectivasMC) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMapMC.set(
            agrupador,
            (horasEfectivasCountMapMC.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivasMC = Array.from(horasEfectivasCountMapMC, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasEfectivasMC.sort((a, b) => b.total - a.total);

        // Data horas programadas MC por agrupador
        const horasProgramadasCountMapMC = new Map<string, number>();
        for (const row of result.horasProgramadasMC) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMapMC.set(
            agrupador,
            (horasProgramadasCountMapMC.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadasMC = Array.from(
          horasProgramadasCountMapMC,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasProgramadasMC.sort((a, b) => b.total - a.total);

        //Guardar datos de importación para MC con las variables correctas
        this.dataImport.saveDataDMMC(this.anio_mc, this.periodo_mc, this.tipo_asegurado_mc);

        // Actualizar la pagina inmediatamente cuando se obtienen todos los datos
        this.loadingMC = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardMedicinaOcupacional(): void {
    if (!this.periodo_mo || !this.anio_mo || !this.tipo_asegurado_mo) {
      this.errorMO = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    // Reset estado
    this.loadingMO = true;
    this.errorMO = null;
    this.noDataMO = false;
    this.selectPeriodoMO = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesMO: this.report.getQueryDMMOA(
        this.anio_mo,
        this.periodo_mo,
        this.codcas,
        this.tipo_asegurado_mo,
      ),
      horasEfectivasMO: this.report.getQueryDMMOHE(this.anio_mo, this.periodo_mo, this.codcas),
      horasProgramadasMO: this.report.getQueryDMMOHP(this.anio_mo, this.periodo_mo, this.codcas),
      consultantesMO: this.report.getQueryDMMOTC(
        this.anio_mo,
        this.periodo_mo,
        this.codcas,
        this.tipo_asegurado_mo,
      ),
      consultanteServicioMO: this.report.getQueryDMMOTCS(
        this.anio_mo,
        this.periodo_mo,
        this.codcas,
        this.tipo_asegurado_mo,
      ),
      medicosMO: this.report.getQueryDMMOM(
        this.anio_mo,
        this.periodo_mo,
        this.codcas,
      ),
    }).subscribe({
      next: (result) => {
        this.totalConsultantesMO = result.consultantesMO[0]?.cantidad ?? 0;
        this.totalAtencionesMO = result.atencionesMO.length;
        this.totalMedicosMO = result.medicosMO.length; //Ajustar cuando haya endpoint de medicos MO

        this.horasEfectivasMO = result.horasEfectivasMO.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        this.horasProgramadasMO = result.horasProgramadasMO.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        this.totalConsultantesServicioMO = result.consultanteServicioMO.reduce(
          (sum: number, row: { cantidad: any }) => sum + Number(row.cantidad ?? 0),
          0,
        );

        // Guardar data para indicadores MO
        //data para total consultantes por servicio
        this.dataTotalConsultantesServicioMO = result.consultanteServicioMO;
        this.dataTotalConsultantesServicioMO.sort((a, b) => b.cantidad - a.cantidad);

        // Data para total medicos MO por agrupador

        const medicosCountMapMO = new Map<string, number>();
        for (const row of result.medicosMO) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          medicosCountMapMO.set(agrupador, (medicosCountMapMO.get(agrupador) || 0) + 1);
        }
        this.dataTotalMedicosMO = Array.from(medicosCountMapMO, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalMedicosMO.sort((a, b) => b.total - a.total);

        // Data para total consultas MO por agrupador
        const agrupadorCountMapMO = new Map<string, number>();
        for (const row of result.atencionesMO) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMapMO.set(agrupador, (agrupadorCountMapMO.get(agrupador) || 0) + 1);
        }
        this.dataTotalConsultasMO = Array.from(agrupadorCountMapMO, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalConsultasMO.sort((a, b) => b.total - a.total);

        // Data horas efectivas MO por agrupador
        const horasEfectivasCountMapMO = new Map<string, number>();
        for (const row of result.horasEfectivasMO) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMapMO.set(
            agrupador,
            (horasEfectivasCountMapMO.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivasMO = Array.from(horasEfectivasCountMapMO, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasEfectivasMO.sort((a, b) => b.total - a.total);

        // Data horas programadas MO por agrupador
        const horasProgramadasCountMapMO = new Map<string, number>();
        for (const row of result.horasProgramadasMO) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMapMO.set(
            agrupador,
            (horasProgramadasCountMapMO.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadasMO = Array.from(
          horasProgramadasCountMapMO,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasProgramadasMO.sort((a, b) => b.total - a.total);

        //Guardar datos de importación para MO con las variables correctas
        this.dataImport.saveDataDMMO(this.anio_mo, this.periodo_mo, this.tipo_asegurado_mo);

        // Actualizar la pagina inmediatamente cuando se obtienen todos los datos
        this.loadingMO = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardMedicoPersonal(): void {
    if (!this.periodo_mp || !this.anio_mp || !this.tipo_asegurado_mp) {
      this.errorMP = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    // Reset estado
    this.loadingMP = true;
    this.errorMP = null;
    this.noDataMP = false;
    this.selectPeriodoMP = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesMP: this.report.getQueryDMMPA(
        this.anio_mp,
        this.periodo_mp,
        this.codcas,
        this.tipo_asegurado_mp,
      ),
      horasEfectivasMP: this.report.getQueryDMMPHE(this.anio_mp, this.periodo_mp, this.codcas),
      horasProgramadasMP: this.report.getQueryDMMPHP(this.anio_mp, this.periodo_mp, this.codcas),
      consultantesMP: this.report.getQueryDMMPTC(
        this.anio_mp,
        this.periodo_mp,
        this.codcas,
        this.tipo_asegurado_mp,
      ),
      consultanteServicioMP: this.report.getQueryDMMPTCS(
        this.anio_mp,
        this.periodo_mp,
        this.codcas,
        this.tipo_asegurado_mp,
      ),
      medicosMP: this.report.getQueryDMMPM(
        this.anio_mp,
        this.periodo_mp,
        this.codcas,
      ),
    }).subscribe({
      next: (result) => {
        this.totalConsultantesMP = result.consultantesMP[0]?.cantidad ?? 0;
        this.totalAtencionesMP = result.atencionesMP.length;
        this.totalMedicosMP = result.medicosMP.length; //Ajustar cuando haya endpoint de medicos MP

        this.horasEfectivasMP = result.horasEfectivasMP.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        this.horasProgramadasMP = result.horasProgramadasMP.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        this.totalConsultantesServicioMP = result.consultanteServicioMP.reduce(
          (sum: number, row: { cantidad: any }) => sum + Number(row.cantidad ?? 0),
          0,
        );

        // Guardar data para indicadores MP
        //data para total consultantes por servicio
        this.dataTotalConsultantesServicioMP = result.consultanteServicioMP;
        this.dataTotalConsultantesServicioMP.sort((a, b) => b.cantidad - a.cantidad);

        // Data para total medicos MP por agrupador

        const medicosCountMapMP = new Map<string, number>();
        for (const row of result.medicosMP) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          medicosCountMapMP.set(agrupador, (medicosCountMapMP.get(agrupador) || 0) + 1);
        }
        this.dataTotalMedicosMP = Array.from(medicosCountMapMP, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalMedicosMP.sort((a, b) => b.total - a.total);

        // Data para total consultas MP por agrupador
        const agrupadorCountMapMP = new Map<string, number>();
        for (const row of result.atencionesMP) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMapMP.set(agrupador, (agrupadorCountMapMP.get(agrupador) || 0) + 1);
        }
        this.dataTotalConsultasMP = Array.from(agrupadorCountMapMP, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalConsultasMP.sort((a, b) => b.total - a.total);

        // Data horas efectivas MO por agrupador
        const horasEfectivasCountMapMP = new Map<string, number>();
        for (const row of result.horasEfectivasMP) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMapMP.set(
            agrupador,
            (horasEfectivasCountMapMP.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivasMP = Array.from(horasEfectivasCountMapMP, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataHorasEfectivasMP.sort((a, b) => b.total - a.total);

        // Data horas programadas MP por agrupador
        const horasProgramadasCountMapMP = new Map<string, number>();
        for (const row of result.horasProgramadasMP) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMapMP.set(
            agrupador,
            (horasProgramadasCountMapMP.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadasMP = Array.from(
          horasProgramadasCountMapMP,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasProgramadasMP.sort((a, b) => b.total - a.total);

        ///Guardar datos de importación para MP con las variables correctas
        this.dataImport.saveDataDMMP(this.anio_mp, this.periodo_mp, this.tipo_asegurado_mp);
        // Actualizar la pagina inmediatamente cuando se obtienen todos los datos
        this.loadingMP = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardConsultaAtencionInmediata(): void {
    if (!this.periodo_cai || !this.anio_cai || !this.tipo_asegurado_cai) {
      this.errorCAI = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    // Reset estado
    this.loadingCAI = true;
    this.errorCAI = null;
    this.noDataCAI = false;
    this.selectPeriodoCAI = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesCAI: this.report.getQueryDMCAIA(
        this.anio_cai,
        this.periodo_cai,
        this.codcas,
        this.tipo_asegurado_cai,
      ),
      horasEfectivasCAI: this.report.getQueryDMCAIHE(this.anio_cai, this.periodo_cai, this.codcas),
      horasProgramadasCAI: this.report.getQueryDMCAIHP(
        this.anio_cai,
        this.periodo_cai,
        this.codcas,
      ),
      consultantesCAI: this.report.getQueryDMCAITC(
        this.anio_cai,
        this.periodo_cai,
        this.codcas,
        this.tipo_asegurado_cai,
      ),
      consultanteServicioCAI: this.report.getQueryDMCAITCS(
        this.anio_cai,
        this.periodo_cai,
        this.codcas,
        this.tipo_asegurado_cai,
      ),
      medicosCAI: this.report.getQueryDMCAIM(
        this.anio_cai,
        this.periodo_cai,
        this.codcas,
      ),
    }).subscribe({
      next: (result) => {
        this.totalConsultantesCAI = result.consultantesCAI[0]?.cantidad ?? 0;
        this.totalAtencionesCAI = result.atencionesCAI.length;
        this.totalMedicosCAI = result.medicosCAI.length;

        this.horasEfectivasCAI = result.horasEfectivasCAI.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        this.horasProgramadasCAI = result.horasProgramadasCAI.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        this.totalConsultantesServicioCAI = result.consultanteServicioCAI.reduce(
          (sum: number, row: { cantidad: any }) => sum + Number(row.cantidad ?? 0),
          0,
        );

        // Guardar data para indicadores CAI
        //data para total consultantes por servicio
        this.dataTotalConsultantesServicioCAI = result.consultanteServicioCAI;
        this.dataTotalConsultantesServicioCAI.sort((a, b) => b.cantidad - a.cantidad);
        // Data para total medicos CAI por agrupador

        const medicosCountMapCAI = new Map<string, number>();
        for (const row of result.medicosCAI) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          medicosCountMapCAI.set(agrupador, (medicosCountMapCAI.get(agrupador) || 0) + 1);
        }
        this.dataTotalMedicosCAI = Array.from(medicosCountMapCAI, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalMedicosCAI.sort((a, b) => b.total - a.total);

        // Data para total consultas CAI por agrupador
        const agrupadorCountMapCAI = new Map<string, number>();
        for (const row of result.atencionesCAI) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMapCAI.set(agrupador, (agrupadorCountMapCAI.get(agrupador) || 0) + 1);
        }
        this.dataTotalConsultasCAI = Array.from(agrupadorCountMapCAI, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalConsultasCAI.sort((a, b) => b.total - a.total);

        // Data horas efectivas CAI por agrupador
        const horasEfectivasCountMapCAI = new Map<string, number>();
        for (const row of result.horasEfectivasCAI) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMapCAI.set(
            agrupador,
            (horasEfectivasCountMapCAI.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivasCAI = Array.from(
          horasEfectivasCountMapCAI,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasEfectivasCAI.sort((a, b) => b.total - a.total);

        // Data horas programadas CAI por agrupador
        const horasProgramadasCountMapCAI = new Map<string, number>();
        for (const row of result.horasProgramadasCAI) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMapCAI.set(
            agrupador,
            (horasProgramadasCountMapCAI.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadasCAI = Array.from(
          horasProgramadasCountMapCAI,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasProgramadasCAI.sort((a, b) => b.total - a.total);

        //Guardar datos de importación para CAI con las variables correctas
        this.dataImport.saveDataDMCAI(this.anio_cai, this.periodo_cai, this.tipo_asegurado_cai);
        // Actualizar la pagina inmediatamente cuando se obtienen todos los datos
        this.loadingCAI = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadDashboardConsultaApoyoDesc(): void {
    if (!this.periodo_cad || !this.anio_cad || !this.tipo_asegurado_cad) {
      this.errorCAD = 'Por favor seleccione un período, año y tipo de asegurado válidos';
      return;
    }
    // Reset estado
    this.loadingCAD = true;
    this.errorCAD = null;
    this.noDataCAD = false;
    this.selectPeriodoCAD = false;
    this.cdr.detectChanges();

    forkJoin({
      atencionesCAD: this.report.getQueryDMCADA(
        this.anio_cad,
        this.periodo_cad,
        this.codcas,
        this.tipo_asegurado_cad,
      ),
      horasEfectivasCAD: this.report.getQueryDMCADHE(this.anio_cad, this.periodo_cad, this.codcas),
      horasProgramadasCAD: this.report.getQueryDMCADHP(
        this.anio_cad,
        this.periodo_cad,
        this.codcas,
      ),
      consultantesCAD: this.report.getQueryDMCADTC(
        this.anio_cad,
        this.periodo_cad,
        this.codcas,
        this.tipo_asegurado_cad,
      ),
      consultanteServicioCAD: this.report.getQueryDMCADTCS(
        this.anio_cad,
        this.periodo_cad,
        this.codcas,
        this.tipo_asegurado_cad,
      ),
      medicosCAD: this.report.getQueryDMCADM(
        this.anio_cad,
        this.periodo_cad,
        this.codcas,
      ),
    }).subscribe({
      next: (result) => {
        this.totalConsultantesCAD = result.consultantesCAD[0]?.cantidad ?? 0;
        this.totalAtencionesCAD = result.atencionesCAD.length;
        this.totalMedicosCAD = result.medicosCAD.length;

        this.horasEfectivasCAD = result.horasEfectivasCAD.reduce(
          (sum: number, row: { horas_efec_def: any }) => sum + Number(row.horas_efec_def ?? 0),
          0,
        );
        this.horasProgramadasCAD = result.horasProgramadasCAD.reduce(
          (sum: number, row: { total_horas: any }) => sum + Number(row.total_horas ?? 0),
          0,
        );
        this.totalConsultantesServicioCAD = result.consultanteServicioCAD.reduce(
          (sum: number, row: { cantidad: any }) => sum + Number(row.cantidad ?? 0),
          0,
        );

        // Guardar data para indicadores CAD
        //data para total consultantes por servicio
        this.dataTotalConsultantesServicioCAD = result.consultanteServicioCAD;
        this.dataTotalConsultantesServicioCAD.sort((a, b) => b.cantidad - a.cantidad);

        // Data para total medicos CAD por agrupador
        const medicosCountMapCAD = new Map<string, number>();
        for (const row of result.medicosCAD) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          medicosCountMapCAD.set(agrupador, (medicosCountMapCAD.get(agrupador) || 0) + 1);
        }
        this.dataTotalMedicosCAD = Array.from(medicosCountMapCAD, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalMedicosCAD.sort((a, b) => b.total - a.total);

        // Data para total consultas MP por agrupador
        const agrupadorCountMapCAD = new Map<string, number>();
        for (const row of result.atencionesCAD) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          agrupadorCountMapCAD.set(agrupador, (agrupadorCountMapCAD.get(agrupador) || 0) + 1);
        }
        this.dataTotalConsultasCAD = Array.from(agrupadorCountMapCAD, ([agrupador, total]) => ({
          agrupador,
          total,
        }));
        this.dataTotalConsultasCAD.sort((a, b) => b.total - a.total);

        // Data horas efectivas CAD por agrupador
        const horasEfectivasCountMapCAD = new Map<string, number>();
        for (const row of result.horasEfectivasCAD) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasEfectivasCountMapCAD.set(
            agrupador,
            (horasEfectivasCountMapCAD.get(agrupador) || 0) + Number(row.horas_efec_def ?? 0),
          );
        }
        this.dataHorasEfectivasCAD = Array.from(
          horasEfectivasCountMapCAD,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasEfectivasCAD.sort((a, b) => b.total - a.total);

        // Data horas programadas CAD por agrupador
        const horasProgramadasCountMapCAD = new Map<string, number>();
        for (const row of result.horasProgramadasCAD) {
          const agrupador = (row as any).agrupador || 'Sin agrupador';
          horasProgramadasCountMapCAD.set(
            agrupador,
            (horasProgramadasCountMapCAD.get(agrupador) || 0) + Number(row.total_horas ?? 0),
          );
        }
        this.dataHorasProgramadasCAD = Array.from(
          horasProgramadasCountMapCAD,
          ([agrupador, total]) => ({
            agrupador,
            total,
          }),
        );
        this.dataHorasProgramadasCAD.sort((a, b) => b.total - a.total);

        // Guardar datos de importación para CAD con las variables correctas
        this.dataImport.saveDataDMCAD(this.anio_cad, this.periodo_cad, this.tipo_asegurado_cad);

        // Actualizar la pagina inmediatamente cuando se obtienen todos los datos
        this.loadingCAD = false;
        this.cdr.detectChanges();
      },
    });
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Atenciones Medicas'
    | 'Medicina Complementaria'
    | 'Medicina Ocupacional'
    | 'Medico de Personal'
    | 'Consulta de Atencion Inmediata'
    | 'Consulta de Apoyo  Desc' = 'Atenciones Medicas';

  setActiveTab(
    tab:
      | 'Atenciones Medicas'
      | 'Medicina Complementaria'
      | 'Medicina Ocupacional'
      | 'Medico de Personal'
      | 'Consulta de Atencion Inmediata'
      | 'Consulta de Apoyo  Desc',
  ): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  downloadCSV(): void { }
}
