import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSortModule } from '@angular/material/sort';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PatologiaService } from '../../../services/reportes/patologia-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { EstablecimientoService } from '../../../services/establecimiento-service';

@Component({
  selector: 'app-dashboard-patologia',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    ScrollingModule,
    MatPaginatorModule,
  ],
  templateUrl: './dashboard-patologia.html',
  styleUrl: './dashboard-patologia.css',
})
export class DashboardPatologia implements OnInit, OnDestroy {

  loading: boolean = false;
  error: string | null = null;

  currentDate: string = '';

  ///////Analitica por patologia de alto costo
  //filtros  




  dataAnioApal: any[] = [];
  anio_apal: string[] = [];

  ///pacientes totales
  queryPacientesTotales: any[] = [];

  ///comorbilidad global
  queryComorbilidadGlobal: any[] = [];

  ///comorbilidad grupo
  queryComorbilidadGrupo: any[] = [];

  ///comorbilidad grupo total
  queryComorbilidadGrupoTotal: any[] = [];

  ///comorbilidad interserccion
  queryComorbilidadInterserccion: any[] = [];

  ///comorbilidad interserccion total
  queryComorbilidadInterserccionTotal: any[] = [];

  ///patologia -> area ->servicio
  queryPatologiaAreaServicio: any[] = [];

  ///Diagnostico y servicios mas frecuentes por patologia
  queryDiagnosticoServiciosMasFrecPato: any[] = [];

  ///total pacientes
  queryTotalPacientes: any[] = [];

  ///mayor concentracion red
  queryMayorConcentracionRed: any[] = [];

  ///mayor concentrado centro
  queryMayorConcentracionCentro: any[] = [];

  ///ranking red
  queryRankingRed: any[] = [];

  ///Comorbilidades asociadas a Oncológico
  queryComorbilidadesOncologico: any[] = [];

  ///Comorbilidades asociadas a Renal
  queryComorbilidadesRenal: any[] = [];

  ////// Detalle por patología
  // Datos de Redes Asistenciales
  dataRed_DP: any[] = [];
  filteredRed_DP: any = [];
  searchRed_DP: string = '';
  isDropdownRedOpen_DP: boolean = false;
  selectedRedName_DP: string = '';
  activeRedIndex_DP: number = -1;

  // Datos para el dropdown de Centro Asistencial
  dataCentro_DP: any = [];
  dataCentroWithRed_DP: any[] = [];
  filteredCentro_DP: any = [];
  searchCentro_DP: string = '';
  isDropdownCentroOpen_DP: boolean = false;
  selectedCentroName_DP: string = '';
  activeCentroIndex_DP: number = -1;


  dataAnioDP: any[] = [];
  anio_DP: string[] = ["TODOS"];

  dataPatologiaDP: any[] = [];
  patologia_DP: string[] = ["TODOS"];

  dataGrupoEtarioDP = ["TODOS", "0-11", "12-17", "18-29", "30-44", "45-59", "60+", "SIN DATO"];
  grupoEtario_DP: string[] = ['TODOS'];

  dataRedDP: any[] = [];
  red_DP: string[] = ["TODAS"];

  dataCentroDP: any[] = [];
  centro_DP: string[] = ["TODOS"];

  //total pacientes
  dataQueryDPTP: any[] = [];

  ///Total diagnosticos distintos
  dataQueryDPTDD: any[] = [];
  totalPacientesQueryDPTDD: number = 0;

  ///Distribucion sexo
  dataQueryDPDS: any[] = [];

  ///Distribucion por grupo etario
  dataQueryDPDGE: any[] = [];

  ///Tabla diagnosticos  
  dataQueryDPTD: any[] = [];

  ///evolucion anual
  dataQueryDPEA: any[] = [];

  ///Pacientes por servicio
  dataQueryDPPS: any[] = [];

  ///Ranking por centro
  dataQueryDPRC: any[] = [];

  ////Comorbilidad del paciente

  documentoCPAP: string = '';
  sexoCPAP: string = '';
  rangoEdadCPAP: string = '';
  patologiasCPAP: number = 0;
  centrosCPAP: number = 0;


  dataQueryCPCPD: any[] = [];
  dataAnioMatrizQueryCPCPD: any[] = [];
  dataPatologiaMatrizQueryCPCPD: any[] = [];
  dataMatrizQueryCPCPD: any = {};



  ///graficos Analitica por patologia de alto costo
  chartPacientesTotales: ApexCharts | null = null;
  @ViewChild('chartPacientesTotales') chartPacientesTotalesElement!: ElementRef<HTMLDivElement>;

  chartComorbilidadGlobal: ApexCharts | null = null;
  @ViewChild('chartComorbilidadGlobal') chartComorbilidadGlobalElement!: ElementRef<HTMLDivElement>;

  chartRankingRed: ApexCharts | null = null;
  @ViewChild('chartRankingRed') chartRankingRedElement!: ElementRef<HTMLDivElement>;

  chartComorbilidadesOncologico: ApexCharts | null = null;
  @ViewChild('chartComorbilidadesOncologico') chartComorbilidadesOncologicoElement!: ElementRef<HTMLDivElement>;

  chartComorbilidadesRenal: ApexCharts | null = null;
  @ViewChild('chartComorbilidadesRenal') chartComorbilidadesRenalElement!: ElementRef<HTMLDivElement>;

  chartDiagnosticoServiciosMasFrecPato: ApexCharts | null = null;
  @ViewChild('chartDiagnosticoServiciosMasFrecPato') chartDiagnosticoServiciosMasFrecPatoElement!: ElementRef<HTMLDivElement>;

  chartComorbilidadInterserccion: ApexCharts | null = null;
  @ViewChild('chartComorbilidadInterserccion') chartComorbilidadInterserccionElement!: ElementRef<HTMLDivElement>;

  chartPatologiaAreaServicio: ApexCharts | null = null;
  @ViewChild('chartPatologiaAreaServicio') chartPatologiaAreaServicioElement!: ElementRef<HTMLDivElement>;

  ///graficos Detalle por patología
  chartDistribucionSexo: ApexCharts | null = null;
  @ViewChild('chartDistribucionSexo') chartDistribucionSexoElement!: ElementRef<HTMLDivElement>;

  chartDistribucionGrupoEtario: ApexCharts | null = null;
  @ViewChild('chartDistribucionGrupoEtario') chartDistribucionGrupoEtarioElement!: ElementRef<HTMLDivElement>;

  chartTopDiagnostico: ApexCharts | null = null;
  @ViewChild('chartTopDiagnostico') chartTopDiagnosticoElement!: ElementRef<HTMLDivElement>;

  chartEvolucionAnual: ApexCharts | null = null;
  @ViewChild('chartEvolucionAnual') chartEvolucionAnualElement!: ElementRef<HTMLDivElement>;

  chartPacientesPorServicio: ApexCharts | null = null;
  @ViewChild('chartPacientesPorServicio') chartPacientesPorServicioElement!: ElementRef<HTMLDivElement>;

  chartRankingCentro: ApexCharts | null = null;
  @ViewChild('chartRankingCentro') chartRankingCentroElement!: ElementRef<HTMLDivElement>;

  constructor(
    private patologiaService: PatologiaService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadDataOpciones();
    this.loadDataDetallePatologia();
  }
  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }


  private destroyAllCharts(): void {
    this.destroyChart(this.chartPacientesTotales);
    this.destroyChart(this.chartComorbilidadGlobal);
    this.destroyChart(this.chartRankingRed);
    this.destroyChart(this.chartComorbilidadesOncologico);
    this.destroyChart(this.chartComorbilidadesRenal);
    this.destroyChart(this.chartDiagnosticoServiciosMasFrecPato);
    this.destroyChart(this.chartComorbilidadInterserccion);
    this.destroyChart(this.chartPatologiaAreaServicio);
    this.destroyChart(this.chartDistribucionSexo);
    this.destroyChart(this.chartDistribucionGrupoEtario);
    this.destroyChart(this.chartTopDiagnostico);
    this.destroyChart(this.chartEvolucionAnual);
    this.destroyChart(this.chartPacientesPorServicio);
  }

  loadDataRedAndCentro() {
    forkJoin({
      red: this.establecimientoService.getRed(),
      centrowithcentro: this.establecimientoService.getCentrosWithRed(),
    }).subscribe({
      next: (results) => {
        this.dataRed_DP = results.red;
        this.dataCentroWithRed_DP = results.centrowithcentro;
      },
      error: (err) => {
        console.log('Error al obtener las redes y centros', err);
      },
    });
  }


  loadDataOpciones() {
    forkJoin({
      q0: this.patologiaService.getQueryOP(),
      q1: this.patologiaService.getQueryOA(),
      q2: this.patologiaService.getQueryORC(),
    }).subscribe({
      next: (results) => {
        this.dataPatologiaDP = results.q0;
        this.dataAnioApal = results.q1;
        this.dataAnioDP = results.q1;

        // Map redasisdes to red property for the HTML template
        const uniqueReds = Array.from(new Set(results.q2.map((item: any) => item.redasisdes)))
          .filter(Boolean)
          .map(redasisdes => ({ redasisdes }));
        this.dataRedDP = uniqueReds;

        // Map cenasides to centro property for the HTML template
        const uniqueCentros = Array.from(new Set(results.q2.map((item: any) => item.cenasides)))
          .filter(Boolean)
          .map(cenasides => ({ cenasides }));
        this.dataCentroDP = uniqueCentros;

        // Set default values for the dropdowns
        if (this.dataAnioApal.length > 0) {
          this.anio_apal = [this.dataAnioApal[0].anio];
        }
        if (this.dataAnioDP.length > 0) {
          this.anio_DP = [this.dataAnioDP[0].anio];
        }
        if (this.dataPatologiaDP.length > 0) {
          this.patologia_DP = [this.dataPatologiaDP[0].patologia];
        }
        if (this.dataRed_DP.length > 0) {
          this.red_DP = [this.dataRed_DP[0].redasiscod];
        }
        if (this.dataCentroWithRed_DP.length > 0) {
          this.centro_DP = [this.dataCentroWithRed_DP[0].cenasicod];
        }
        this.grupoEtario_DP = ['TODOS'];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos.';

        this.loading = false;
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  loadDataAnaliticaPatologia() {
    this.loading = true;
    this.error = null;

    let selectedAnios = this.anio_apal;
    if (!selectedAnios || selectedAnios.length === 0 || selectedAnios.includes('Todos los anios') || selectedAnios.includes('TODOS')) {
      selectedAnios = ['TODOS'];
    }

    forkJoin({
      q0: this.patologiaService.getQueryAPACPT(),
      q1: this.patologiaService.getQueryAPACCGB(),
      q2: this.patologiaService.getQueryAPACRR(['TODOS']),
      q3: this.patologiaService.getQueryAPACCG('Oncologico', 'Coomorbilidad Oncología'),
      q4: this.patologiaService.getQueryAPACCG('Renal', 'Coomorbilidad Renal'),

      q5: this.patologiaService.getQueryAPACDSFP(['TODOS']),
      q6: this.patologiaService.getQueryAPACPAS(['TODOS']),

      q7: this.patologiaService.getQueryAPACTP(['TODOS']),
      q8: this.patologiaService.getQueryAPACMCR(['TODOS']),
      q9: this.patologiaService.getQueryAPACMCC(['TODOS']),

      q10: this.patologiaService.getQueryAPACCI(),

    }).subscribe({
      next: (results) => {
        this.queryPacientesTotales = results.q0;
        this.queryComorbilidadGlobal = results.q1;
        this.queryRankingRed = results.q2;
        this.queryComorbilidadesOncologico = results.q3;
        this.queryComorbilidadesRenal = results.q4;

        this.queryDiagnosticoServiciosMasFrecPato = results.q5;
        this.queryPatologiaAreaServicio = results.q6;

        this.queryTotalPacientes = results.q7;
        this.queryMayorConcentracionRed = results.q8;
        this.queryMayorConcentracionCentro = results.q9;
        this.queryComorbilidadInterserccion = results.q10;



        this.buildChartPacientesTotales();
        this.buildChartComorbilidadGlobal();
        this.buildChartRankingRed();
        this.buildChartComorbilidadesOncologico();
        this.buildChartComorbilidadesRenal();
        this.buildChartPatologiaAreaServicio();
        this.buildChartDiagnosticoServiciosMasFrecPato();
        this.buildChartComorbilidadInterserccion();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos.';
        this.loading = false;
        console.error(error);
        this.cdr.detectChanges();
      }
    });

  }

  loadDataAnaliticaPatologiaFiltros() {

    let selectedAnios = this.anio_apal;
    if (!selectedAnios || selectedAnios.length === 0 || selectedAnios.includes('Todos los anios') || selectedAnios.includes('TODOS')) {
      selectedAnios = ['TODOS'];
    }

    forkJoin({
      q0: this.patologiaService.getQueryAPACRR(selectedAnios),
      q1: this.patologiaService.getQueryAPACPAS(selectedAnios),
      q2: this.patologiaService.getQueryAPACTP(selectedAnios),
      q3: this.patologiaService.getQueryAPACMCR(selectedAnios),
      q4: this.patologiaService.getQueryAPACMCC(selectedAnios),
      q5: this.patologiaService.getQueryAPACDSFP(selectedAnios),
    }).subscribe({
      next: (results) => {
        this.queryRankingRed = results.q0;
        this.queryPatologiaAreaServicio = results.q1;
        this.queryTotalPacientes = results.q2;
        this.queryMayorConcentracionRed = results.q3;
        this.queryMayorConcentracionCentro = results.q4;
        this.queryDiagnosticoServiciosMasFrecPato = results.q5;

        this.buildChartRankingRed();
        this.buildChartComorbilidadesOncologico();
        this.buildChartComorbilidadesRenal();
        this.buildChartPatologiaAreaServicio();
        this.buildChartDiagnosticoServiciosMasFrecPato();


        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos.';
        this.loading = false;
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  loadDataDetallePatologia() {
    this.loading = true;
    this.error = null;

    if (!this.anio_DP) {
      this.anio_DP = ['TODOS'];
    }

    if (!this.patologia_DP) {
      this.patologia_DP = ['Acidosis metabólica'];
    }

    if (!this.red_DP) {
      this.red_DP = ['TODAS'];
    }

    if (!this.centro_DP) {
      this.centro_DP = ['TODOS'];
    }

    if (!this.grupoEtario_DP) {
      this.grupoEtario_DP = ['TODOS'];
    }

    forkJoin({
      q0: this.patologiaService.getQueryDPTP(this.patologia_DP, this.anio_DP, this.red_DP, this.centro_DP, this.grupoEtario_DP),
      q1: this.patologiaService.getQueryDPTDD(this.patologia_DP, this.anio_DP, this.red_DP, this.centro_DP, this.grupoEtario_DP),
      q2: this.patologiaService.getQueryDPDS(this.patologia_DP, this.anio_DP, this.red_DP, this.centro_DP, this.grupoEtario_DP),
      q3: this.patologiaService.getQueryDPDGE(this.patologia_DP, this.anio_DP, this.red_DP, this.centro_DP),
      q4: this.patologiaService.getQueryDPTD(this.patologia_DP, this.anio_DP, this.red_DP, this.centro_DP, this.grupoEtario_DP),
      q5: this.patologiaService.getQueryDPEA(this.patologia_DP, this.red_DP, this.centro_DP, this.grupoEtario_DP),
      q6: this.patologiaService.getQueryDPPS(this.patologia_DP, this.anio_DP, this.red_DP, this.centro_DP, this.grupoEtario_DP),
      q7: this.patologiaService.getQueryDPRC(this.patologia_DP, this.anio_DP, this.red_DP),
    }).subscribe({
      next: (results) => {
        this.dataQueryDPTP = results.q0;
        this.dataQueryDPTDD = results.q1;
        this.dataQueryDPDS = results.q2;
        this.dataQueryDPDGE = results.q3;
        this.dataQueryDPTD = results.q4;
        this.dataQueryDPEA = results.q5;
        this.dataQueryDPPS = results.q6;
        this.dataQueryDPRC = results.q7;


        this.totalPacientesQueryDPTDD = results.q4.reduce(
          (sum: number, row: any) => sum + Number(row.pacientes ?? 0),
          0,
        );

        ///graficos Detalle por patologia
        this.buildChartDistribucionSexo();
        this.buildChartDistribucionGrupoEtario();
        this.buildChartEvolucionAnual();
        this.buildChartPacientesServicio();
        this.buildChartRankingCentro();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos.';
        this.loading = false;
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  loadDataComorbilidadPaciente(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      q0: this.patologiaService.getQueryCPCPD(this.documentoCPAP),
    }).subscribe({
      next: (results) => {
        this.dataQueryCPCPD = results.q0;
        this.patologiasCPAP = this.dataQueryCPCPD.length;

        ///obtener sexo de pacientes de dataQueryCPCPD
        const dataSexo = [...new Set(this.dataQueryCPCPD.map((item: any) => item.sexo))];
        if (dataSexo[0] == 'F') {
          this.sexoCPAP = 'FEMENINO'
        } else if (dataSexo[0] == 'M') {
          this.sexoCPAP = 'MASCULINO'
        }
        ///obtener edad de pacientes de dataQueryCPCPD
        const dataEdad = [...new Set(this.dataQueryCPCPD.map((item: any) => item.anio_edad))];
        ///ordenar de menor a mayor 
        dataEdad.sort((a: any, b: any) => a - b);
        this.rangoEdadCPAP = dataEdad[0] + '-' + dataEdad[dataEdad.length - 1]

        ///obtener centros de pacientes de dataQueryCPCPD
        const dataCentro = [...new Set(this.dataQueryCPCPD.map((item: any) => item.cenasides))];
        this.centrosCPAP = dataCentro.length

        ///matriz patologia por año
        ///columna anio 
        this.dataAnioMatrizQueryCPCPD = [...new Set(this.dataQueryCPCPD.map((item: any) => item.anio))];
        this.dataAnioMatrizQueryCPCPD.sort((a: any, b: any) => a - b);
        /// fila patologia
        this.dataPatologiaMatrizQueryCPCPD = [...new Set(this.dataQueryCPCPD.map((item: any) => item.patologia))];
        this.dataPatologiaMatrizQueryCPCPD.sort((a: any, b: any) => a.localeCompare(b));

        this.dataMatrizQueryCPCPD = this.dataQueryCPCPD.reduce((acc: any, item: any) => {
          const patologia = item.patologia;
          const anio = item.anio;
          if (!acc[patologia]) {
            acc[patologia] = {};
          }
          acc[patologia][anio] = "check";
          return acc;
        }, {});



        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Error al cargar los datos.';
        this.loading = false;
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  hasComorbilidad(patologia: string, anio: any): boolean {
    const matrix = this.dataMatrizQueryCPCPD as Record<string, Record<string, any>>;
    return !!(matrix && matrix[patologia] && matrix[patologia][anio]);
  }

  ///Analitica por patologia de alto costo

  buildChartPacientesTotales(): void {
    setTimeout(() => {
      this.renderTopDonutChart(
        this.queryPacientesTotales,
        (item) => item.patologia,
        (item) => item.pacientes,
        this.chartPacientesTotalesElement?.nativeElement,
        this.chartPacientesTotales,
        (chart) => (this.chartPacientesTotales = chart),
      );
    });
  }

  buildChartComorbilidadGlobal(): void {
    setTimeout(() => {
      if (!this.chartComorbilidadGlobalElement?.nativeElement) {
        return;
      }

      const data = this.queryComorbilidadGlobal;
      if (!data || !data.length) {
        return;
      }

      //obtener patologias diferentes de dataQueryDPEA
      const dataPatologia = [...new Set(data.map((item: any) => item.patologia))].filter((item: any) => item !== 'Alto costo');

      ///obtener años diferentes de dataQueryDPEA
      const dataAnios = [...new Set(data.map((item: any) => item.anio))].filter((item: any) => item !== 'Alto costo');

      ///regresion 4 años de dataAnios
      const dataAniosRegresion = dataAnios.slice(-4);

      ///agregar 4 años en adelante del ultimo año obtenido
      const dataAniosFinal: string[] = [];
      const yearAnioFinal = parseInt(dataAnios[dataAnios.length - 1]);
      for (let i = 1; i <= 4; i++) {
        dataAniosFinal.push((yearAnioFinal + i).toString());
      }

      const dataAniosFinalUnido = dataAnios.concat(dataAniosFinal);

      // Map historical data
      const histMap = new Map<string, Map<string, number>>();
      data.forEach((item: any) => {
        const pat = item.patologia;
        const yr = item.anio;
        const val = Number(item.pacientes) || 0;
        if (!histMap.has(pat)) {
          histMap.set(pat, new Map<string, number>());
        }
        histMap.get(pat)!.set(yr, val);
      });

      const patologias = dataPatologia;
      const years = dataAniosFinalUnido;
      const regressionYears = dataAniosRegresion.map(yr => parseInt(yr));

      const series: any[] = [];
      const colors: string[] = [];
      const dashArray: number[] = [];
      const markerStrokeWidths: number[] = [];
      const markerColors: string[] = [];
      const dataLabelColors: string[] = [];

      const baseColors = ['#0064af', '#e29c00', '#00a261', '#8b5cf6', '#ec4899', '#f97316'];

      patologias.forEach((pat, i) => {
        const color = baseColors[i % baseColors.length];

        // Calculate linear regression
        const x = regressionYears;
        const y = regressionYears.map(yr => histMap.get(pat)?.get(yr.toString()) ?? 0);

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const actualData = dataAnios.map(yr => histMap.get(pat)?.get(yr) ?? null);
        while (actualData.length < years.length) {
          actualData.push(null);
        }

        const trendData = Array(dataAnios.length - 1).fill(null);
        const lastYearVal = histMap.get(pat)?.get(dataAnios[dataAnios.length - 1]) ?? null;
        trendData.push(lastYearVal);

        dataAniosFinal.forEach(yrStr => {
          const yr = parseInt(yrStr);
          trendData.push(Math.round(slope * yr + intercept));
        });

        series.push({ name: pat, data: actualData });
        series.push({ name: `Tendencia ${pat}`, data: trendData });

        // Actual series style
        colors.push(color);
        dashArray.push(0);
        markerStrokeWidths.push(0);
        markerColors.push(color);
        dataLabelColors.push(color);

        // Trend series style
        colors.push(color + '66'); // 40% opacity
        dashArray.push(5);
        markerStrokeWidths.push(2);
        markerColors.push('#ffffff');
        dataLabelColors.push(color);
      });

      const options = this.createLineOptions(
        years,
        series,
        colors,
        dashArray,
        markerStrokeWidths,
        markerColors,
        dataLabelColors,
        dataAnios.length - 1
      );

      this.destroyChart(this.chartComorbilidadGlobal);
      this.renderApexChart(
        this.chartComorbilidadGlobalElement.nativeElement,
        options,
        (chart) => (this.chartComorbilidadGlobal = chart)
      );
    });
  }

  buildChartRankingRed(): void {
    setTimeout(() => {
      if (!this.chartRankingRedElement?.nativeElement) {
        return;
      }

      const data = this.queryRankingRed;
      if (!data || !data.length) {
        return;
      }

      // 1. Calculate total patients per network to find the top 15
      const networkTotals = new Map<string, number>();
      data.forEach((item: any) => {
        const net = item.redasisdes || 'Sin dato';
        const val = Number(item.pacientes) || 0;
        networkTotals.set(net, (networkTotals.get(net) ?? 0) + val);
      });

      const topNetworks = Array.from(networkTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name]) => name);

      // 2. Build map of patients by network and patologia
      const patMap = new Map<string, Map<string, number>>();
      data.forEach((item: any) => {
        const net = item.redasisdes || 'Sin dato';
        const pat = item.patologia;
        const val = Number(item.pacientes) || 0;
        if (!patMap.has(net)) {
          patMap.set(net, new Map<string, number>());
        }
        patMap.get(net)!.set(pat, val);
      });

      // 3. Extract series data for top 15 networks
      const renalData = topNetworks.map(net => patMap.get(net)?.get('Renal') ?? 0);
      const rarasData = topNetworks.map(net => patMap.get(net)?.get('Raras') ?? 0);
      const oncologicoData = topNetworks.map(net => patMap.get(net)?.get('Oncologico') ?? 0);

      const series = [
        { name: 'Renal', data: renalData },
        { name: 'Raras', data: rarasData },
        { name: 'Oncologico', data: oncologicoData }
      ];

      const colors = ['#00a261', '#e29c00', '#0064af'];

      const options = this.createStackedBarOptions(topNetworks, series, colors);

      this.destroyChart(this.chartRankingRed);
      this.renderApexChart(
        this.chartRankingRedElement.nativeElement,
        options,
        (chart) => (this.chartRankingRed = chart)
      );
    });
  }

  buildChartComorbilidadesOncologico(): void {
    setTimeout(() => {
      const data = this.queryComorbilidadesOncologico;
      if (!data || data.length === 0) return;

      const total = data.reduce(
        (sum: number, row: any) => sum + Number(row.pacientes ?? 0),
        0,
      );

      const sorted = [...data].sort((a, b) => Number(b.pacientes) - Number(a.pacientes)).slice(0, 15);
      const categories = sorted.map(d => d.patologia_b);
      const seriesData = sorted.map(d => (Number(d.pacientes) / total) * 100);

      const options = this.createComorbilidadBarOptions(categories, seriesData, sorted, '#0064af');

      this.destroyChart(this.chartComorbilidadesOncologico);
      this.renderApexChart(
        this.chartComorbilidadesOncologicoElement.nativeElement,
        options,
        (chart) => (this.chartComorbilidadesOncologico = chart)
      );
    });
  }

  buildChartComorbilidadesRenal(): void {
    setTimeout(() => {
      const data = this.queryComorbilidadesRenal;
      if (!data || data.length === 0) return;

      const renalItem = this.queryTotalPacientes.find(item => item.patologia === 'Renal');
      const total = renalItem ? Number(renalItem.pacientes) : 498378;

      const sorted = [...data].sort((a, b) => Number(b.pacientes) - Number(a.pacientes)).slice(0, 15);
      const categories = sorted.map(d => d.patologia_b);
      const seriesData = sorted.map(d => (Number(d.pacientes) / total) * 100);

      const options = this.createComorbilidadBarOptions(categories, seriesData, sorted, '#00a261');

      this.destroyChart(this.chartComorbilidadesRenal);
      this.renderApexChart(
        this.chartComorbilidadesRenalElement.nativeElement,
        options,
        (chart) => (this.chartComorbilidadesRenal = chart)
      );
    });
  }

  private loadPlotly(): Promise<void> {
    return new Promise((resolve) => {
      const plotlyLib = (window as any).Plotly;
      if (plotlyLib) {
        resolve();
        return;
      }

      const scriptId = 'plotly-cdn-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.plot.ly/plotly-2.24.1.min.js';
        document.body.appendChild(script);
      }

      script.addEventListener('load', () => resolve());
    });
  }

  buildChartDiagnosticoServiciosMasFrecPato(): void {
    this.loadPlotly().then(() => {
      setTimeout(() => {
        const container = this.chartDiagnosticoServiciosMasFrecPatoElement?.nativeElement;
        if (!container) {
          return;
        }

        const plotlyLib = (window as any).Plotly;
        if (!plotlyLib) {
          return;
        }

        const data = this.queryDiagnosticoServiciosMasFrecPato;
        if (!data || data.length === 0) return;

        // Group by patologia: 'Renal', 'Oncologico', 'Raras'
        const tree: { [pat: string]: { [area: string]: { [serv: string]: number } } } = {
          'Renal': {},
          'Oncologico': {},
          'Raras': {}
        };

        data.forEach(item => {
          const pat = item.patologia;
          const area = item.diagdes || 'Sin Área';
          const serv = item.servhosdes || 'Sin Servicio';
          const val = Number(item.pacientes) || 0;

          if (tree[pat]) {
            if (!tree[pat][area]) {
              tree[pat][area] = {};
            }
            tree[pat][area][serv] = (tree[pat][area][serv] || 0) + val;
          }
        });

        // Prepare lists for Plotly Treemap
        const ids: string[] = [];
        const labels: string[] = [];
        const parents: string[] = [];
        const values: number[] = [];

        // Add Nivel 1 (Roots)
        const patNames = ['Renal', 'Oncologico', 'Raras'];
        patNames.forEach(pat => {
          let totalPatVal = 0;
          const patAreaObj = tree[pat];

          Object.keys(patAreaObj).forEach(area => {
            let totalAreaVal = 0;
            const areaId = `${pat} - ${area}`;
            const servObj = patAreaObj[area];

            // Sort services and take top 10 per area to avoid rendering hundreds of tiny boxes
            const sortedServices = Object.keys(servObj)
              .map(serv => ({ name: serv, val: servObj[serv] }))
              .sort((a, b) => b.val - a.val);

            const topServices = sortedServices.slice(0, 10);
            topServices.forEach(serv => {
              const servId = `${areaId} - ${serv.name}`;
              ids.push(servId);
              labels.push(serv.name);
              parents.push(areaId);
              values.push(serv.val);
              totalAreaVal += serv.val;
            });

            // Only add area if it has children services
            if (topServices.length > 0) {
              ids.push(areaId);
              labels.push(area);
              parents.push(pat);
              values.push(totalAreaVal);
              totalPatVal += totalAreaVal;
            }
          });

          // Only add pathology root if it has children areas
          if (totalPatVal > 0) {
            ids.push(pat);
            labels.push(pat);
            parents.push("");
            values.push(totalPatVal);
          }
        });

        if (ids.length === 0) {
          return;
        }

        // Calculate maximum value for each pathology to dynamically scale opacity
        const maxVals: { [key: string]: number } = { 'Renal': 1, 'Oncologico': 1, 'Raras': 1 };
        ids.forEach((id, idx) => {
          const root = id.split(' - ')[0];
          const val = values[idx];
          if (val > maxVals[root]) {
            maxVals[root] = val;
          }
        });

        // Map dynamic opacity shading based on the node's value relative to its pathology root
        const colors = ids.map((id, idx) => {
          const root = id.split(' - ')[0];
          const val = values[idx];
          const maxVal = maxVals[root];
          const opacity = maxVal > 0 ? 0.35 + (val / maxVal) * 0.6 : 0.8;

          if (root === 'Renal') {
            return `rgba(16, 185, 129, ${opacity})`; // Green shade
          } else if (root === 'Oncologico') {
            return `rgba(0, 100, 175, ${opacity})`;  // Blue shade
          } else {
            return `rgba(234, 179, 8, ${opacity})`;   // Yellow/Orange shade
          }
        });

        // Clear the element before rendering to avoid duplicates
        plotlyLib.purge(container);

        const trace: any = {
          type: 'treemap',
          ids: ids,
          labels: labels,
          parents: parents,
          values: values,
          textinfo: 'label+value',
          textposition: 'middle center',
          textfont: {
            family: 'Calibri, Segoe UI, sans-serif',
            size: 11,
            color: '#ffffff'
          },
          marker: {
            colors: colors,
            line: {
              color: '#ffffff',
              width: 1.5
            }
          },
          hoverinfo: 'label+value+percent parent',
          branchvalues: 'total'
        };

        const layout = {
          margin: { l: 0, r: 0, b: 0, t: 0 },
          height: 400,
        };

        const config = {
          responsive: true,
          displayModeBar: false
        };

        plotlyLib.newPlot(container, [trace], layout, config);
      });
    });
  }

  buildChartComorbilidadInterserccion(): void {
    this.loadPlotly().then(() => {
      setTimeout(() => {
        const container = this.chartComorbilidadInterserccionElement?.nativeElement;
        if (!container) {
          return;
        }
        const data = this.queryComorbilidadInterserccion;
        if (!data || data.length === 0) return;

        const plotlyLib = (window as any).Plotly;
        if (!plotlyLib) {
          return;
        }

        // Calculate max intersection value for each category
        const maxVals: { [key: string]: number } = {};
        data.forEach(item => {
          const pA = item.patologia_a;
          const pB = item.patologia_b;
          const val = Number(item.pacientes) || 0;

          if (pA === pB) return;

          if (!maxVals[pA] || val > maxVals[pA]) maxVals[pA] = val;
          if (!maxVals[pB] || val > maxVals[pB]) maxVals[pB] = val;
        });

        // Sort categories in ascending order of max value (Plotly renders Y-axis from bottom to top)
        let uniqueCategories = Object.keys(maxVals).sort((a, b) => maxVals[a] - maxVals[b]);

        // Keep only top 20 categories with the highest intersection values
        if (uniqueCategories.length > 20) {
          const topCategories = [...uniqueCategories]
            .sort((a, b) => maxVals[b] - maxVals[a])
            .slice(0, 20);
          uniqueCategories = uniqueCategories.filter(cat => topCategories.includes(cat));
        }

        const xVals: number[] = [];
        const yVals: string[] = [];
        const colorVals: number[] = [];
        const textVals: string[] = [];

        data.forEach(item => {
          const pA = item.patologia_a;
          const pB = item.patologia_b;
          const val = Number(item.pacientes) || 0;

          if (pA === pB) return;

          if (!uniqueCategories.includes(pA) || !uniqueCategories.includes(pB)) return;

          // Point 1 (Row: pA)
          xVals.push(val);
          yVals.push(pA);
          colorVals.push(val);
          textVals.push(`${pA} ∩ ${pB}<br>${val.toLocaleString()} pacientes`);

          // Point 2 (Row: pB)
          xVals.push(val);
          yVals.push(pB);
          colorVals.push(val);
          textVals.push(`${pB} ∩ ${pA}<br>${val.toLocaleString()} pacientes`);
        });

        const maxVal = Math.max(...xVals, 1);
        const minVal = Math.min(...xVals, 0);

        // Scale bubble sizes between 8 and 38 pixels
        const sizeVals = xVals.map(v => {
          const ratio = (v - minVal) / (maxVal - minVal || 1);
          return 8 + ratio * 30;
        });

        plotlyLib.purge(container);

        const trace: any = {
          x: xVals,
          y: yVals,
          mode: 'markers',
          type: 'scatter',
          text: textVals,
          hoverinfo: 'text',
          marker: {
            size: sizeVals,
            color: colorVals,
            colorscale: 'Blues',
            showscale: true,
            reversescale: false,
            colorbar: {
              title: 'Pacientes',
              titleside: 'top',
              tickformat: '.2s',
              outlinewidth: 0,
              thickness: 15,
              len: 1.0
            },
            line: {
              color: '#1e3a8a',
              width: 0.5
            },
            opacity: 0.7
          }
        };

        const layout = {
          margin: { l: 280, r: 50, b: 50, t: 30 },
          height: 580,
          hovermode: 'closest',
          xaxis: {
            title: 'Pacientes en común',
            tickformat: '.2s',
            gridcolor: '#e2e8f0',
            zeroline: false
          },
          yaxis: {
            categoryorder: 'array',
            categoryarray: uniqueCategories,
            gridcolor: '#f1f5f9',
            zeroline: false,
            tickfont: {
              size: 9,
              family: 'Segoe UI, sans-serif'
            }
          }
        };

        const config = {
          responsive: true,
          displayModeBar: false
        };

        plotlyLib.newPlot(container, [trace], layout, config);
      });
    });
  }

  buildChartPatologiaAreaServicio(): void {
    this.loadPlotly().then(() => {
      setTimeout(() => {
        const container = this.chartPatologiaAreaServicioElement?.nativeElement;
        if (!container) {
          return;
        }

        const plotlyLib = (window as any).Plotly;
        if (!plotlyLib) {
          return;
        }

        const data = this.queryPatologiaAreaServicio;
        if (!data || data.length === 0) return;

        // Grouping logic
        const patToArea: { [key: string]: number } = {};
        const areaToServ: { [area: string]: { [serv: string]: number } } = {};

        data.forEach(item => {
          const pat = item.patologia;
          const area = item.area;
          const serv = item.servhosdes;
          const val = Number(item.pacientes) || 0;

          if (!area) return;

          // Path to Area
          const patAreaKey = `${pat} -> ${area}`;
          patToArea[patAreaKey] = (patToArea[patAreaKey] || 0) + val;

          // Area to Service
          if (!areaToServ[area]) {
            areaToServ[area] = {};
          }
          if (serv) {
            areaToServ[area][serv] = (areaToServ[area][serv] || 0) + val;
          }
        });

        const nodes: any[] = [];
        const edges: any[] = [];

        const patColors: { [key: string]: string } = {
          'Renal': '#10b981',      // Green
          'Oncologico': '#0064af', // Blue
          'Raras': '#eab308'       // Yellow/Orange
        };

        const areaTitles: { [key: string]: string } = {
          'CONSULTA EXTERNA': 'Consulta Externa',
          'EMERGENCIA': 'Emergencia',
          'HOSPITALIZACION': 'Hospitalizacion',
          'CENTRO QUIRURGICO': 'Centro Quirurgico'
        };

        const toTitleCase = (str: string): string => {
          if (!str) return '';
          return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };

        // Collect all present pathologies and areas dynamically to prevent unmatched IDs
        const patsInQuery = new Set<string>();
        const areasInQuery = new Set<string>();

        data.forEach(item => {
          if (item.patologia) patsInQuery.add(item.patologia);
          if (item.area) areasInQuery.add(item.area);
        });

        // Add pathology nodes
        patsInQuery.forEach(pat => {
          nodes.push({
            id: `pat-${pat}`,
            title: pat,
            color: patColors[pat] || '#cbd5e1'
          });
        });

        // Add area nodes
        areasInQuery.forEach(area => {
          nodes.push({
            id: `area-${area}`,
            title: areaTitles[area] || toTitleCase(area),
            color: '#cbd5e1' // Cool light grey for areas
          });
        });

        // Add edges from Pathology -> Area
        Object.keys(patToArea).forEach(key => {
          const [pat, area] = key.split(' -> ');
          if (patsInQuery.has(pat) && areasInQuery.has(area)) {
            edges.push({
              source: `pat-${pat}`,
              target: `area-${area}`,
              value: patToArea[key]
            });
          }
        });

        // Process services per area
        areasInQuery.forEach(area => {
          const servicesMap = areaToServ[area] || {};
          const serviceList = Object.keys(servicesMap)
            .map(name => ({ name: name, value: servicesMap[name] }))
            .sort((a, b) => b.value - a.value);

          if (serviceList.length === 0) return;

          // Take top 6 services, aggregate the rest
          const topCount = 6;
          const topServices = serviceList.slice(0, topCount);
          const remainingServices = serviceList.slice(topCount);

          topServices.forEach(serv => {
            const servId = `serv-${area}-${serv.name}`;
            nodes.push({
              id: servId,
              title: toTitleCase(serv.name),
              color: '#cbd5e1' // Cool light grey for services
            });
            edges.push({
              source: `area-${area}`,
              target: servId,
              value: serv.value
            });
          });

          if (remainingServices.length > 0) {
            const totalVal = remainingServices.reduce((sum, s) => sum + s.value, 0);
            const count = remainingServices.length;
            const servId = `serv-${area}-OTHERS`;
            nodes.push({
              id: servId,
              title: `Otros Servicios (${count})`,
              color: '#94a3b8' // Soft grey for others
            });
            edges.push({
              source: `area-${area}`,
              target: servId,
              value: totalVal
            });
          }
        });

        // Build mapping to indices for Plotly
        const nodeIdToIndex = new Map<string, number>();
        const nodeLabels: string[] = [];
        const nodeColors: string[] = [];

        nodes.forEach((n, idx) => {
          nodeIdToIndex.set(n.id, idx);
          nodeLabels.push(n.title);
          nodeColors.push(n.color);
        });

        const plotlySources = edges.map(e => nodeIdToIndex.get(e.source));
        const plotlyTargets = edges.map(e => nodeIdToIndex.get(e.target));
        const plotlyValues = edges.map(e => e.value);

        const linkColors = edges.map(e => {
          if (e.source.startsWith('pat-')) {
            const pat = e.source.substring(4);
            if (pat === 'Renal') return 'rgba(16, 185, 129, 0.45)';
            if (pat === 'Oncologico') return 'rgba(0, 100, 175, 0.45)';
            if (pat === 'Raras') return 'rgba(234, 179, 8, 0.45)';
          }
          return 'rgba(203, 213, 225, 0.35)';
        });

        plotlyLib.purge(container);

        const trace: any = {
          type: 'sankey',
          orientation: 'h',
          node: {
            pad: 12,
            thickness: 15,
            line: { color: '#ffffff', width: 1.5 },
            label: nodeLabels,
            color: nodeColors,
            hovertemplate: '%{label}<br>%{value:,} pacientes<extra></extra>',
            textfont: {
              family: 'Segoe UI, sans-serif',
              size: 10,
              color: '#334155'
            }
          },
          link: {
            source: plotlySources,
            target: plotlyTargets,
            value: plotlyValues,
            color: linkColors,
            hovertemplate: '%{source.label} → %{target.label}<br>%{value:,} pacientes<extra></extra>'
          }
        };

        const layout = {
          margin: { l: 20, r: 120, b: 20, t: 20 },
          height: 500
        };

        const config = {
          responsive: true,
          displayModeBar: false
        };

        plotlyLib.newPlot(container, [trace], layout, config);
      });
    });
  }

  ///Detalle por patología

  buildChartDistribucionSexo() {
    setTimeout(() => {
      this.renderTopDonutChart(
        this.dataQueryDPDS,
        (item) => item.sexo,
        (item) => item.pacientes,
        this.chartDistribucionSexoElement?.nativeElement,
        this.chartDistribucionSexo,
        (chart) => (this.chartDistribucionSexo = chart),
      );
    });
  }

  buildChartDistribucionGrupoEtario() {
    setTimeout(() => {
      this.renderTopDonutChart(
        this.dataQueryDPDGE,
        (item) => item.grupo_edad,
        (item) => item.pacientes,
        this.chartDistribucionGrupoEtarioElement?.nativeElement,
        this.chartDistribucionGrupoEtario,
        (chart) => (this.chartDistribucionGrupoEtario = chart),
      );
    });
  }

  buildChartTopDiagnostico() {

  }

  buildChartEvolucionAnual() {
    setTimeout(() => {
      if (!this.chartEvolucionAnualElement?.nativeElement) {
        return;
      }
      const data = this.dataQueryDPEA;
      if (!data || !data.length) {
        return;
      }

      //obtener patologias diferentes de dataQueryDPEA
      const dataPatologia = [...new Set(data.map((item: any) => item.patologia))].filter((item: any) => item !== 'Alto costo');

      ///obtener años diferentes de dataQueryDPEA
      const dataAnios = [...new Set(data.map((item: any) => item.anio))].filter((item: any) => item !== 'Alto costo');

      ///regresion 4 años de dataAnios
      const dataAniosRegresion = dataAnios.slice(-4);

      ///agregar 4 años en adelante
      const dataAniosFinal: string[] = [];
      const yearAnioFinal = parseInt(dataAnios[dataAnios.length - 1]);
      for (let i = 1; i <= 4; i++) {
        dataAniosFinal.push((yearAnioFinal + i).toString());
      }

      const dataAniosFinalUnido = dataAnios.concat(dataAniosFinal);

      // Map historical data
      const histMap = new Map<string, Map<string, number>>();
      data.forEach((item: any) => {
        const pat = item.patologia;
        const yr = item.anio;
        const val = Number(item.pacientes) || 0;
        if (!histMap.has(pat)) {
          histMap.set(pat, new Map<string, number>());
        }
        histMap.get(pat)!.set(yr, val);
      });

      const patologias = dataPatologia;
      const years = dataAniosFinalUnido;
      const regressionYears = dataAniosRegresion.map(yr => parseInt(yr));

      const series: any[] = [];
      const colors: string[] = [];
      const dashArray: number[] = [];
      const markerStrokeWidths: number[] = [];
      const markerColors: string[] = [];
      const dataLabelColors: string[] = [];

      const baseColors = ['#0064af', '#e29c00', '#00a261', '#8b5cf6', '#ec4899', '#f97316'];

      patologias.forEach((pat, i) => {
        const color = baseColors[i % baseColors.length];

        // Calculate linear regression
        const x = regressionYears;
        const y = regressionYears.map(yr => histMap.get(pat)?.get(yr.toString()) ?? 0);

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const actualData = dataAnios.map(yr => histMap.get(pat)?.get(yr) ?? null);
        while (actualData.length < years.length) {
          actualData.push(null);
        }

        const trendData = Array(dataAnios.length - 1).fill(null);
        const lastYearVal = histMap.get(pat)?.get(dataAnios[dataAnios.length - 1]) ?? null;
        trendData.push(lastYearVal);

        dataAniosFinal.forEach(yrStr => {
          const yr = parseInt(yrStr);
          trendData.push(Math.round(slope * yr + intercept));
        });

        series.push({ name: pat, data: actualData });
        series.push({ name: `Tendencia ${pat}`, data: trendData });

        // Actual series style
        colors.push(color);
        dashArray.push(0);
        markerStrokeWidths.push(0);
        markerColors.push(color);
        dataLabelColors.push(color);

        // Trend series style
        colors.push(color + '66'); // 40% opacity
        dashArray.push(5);
        markerStrokeWidths.push(2);
        markerColors.push('#ffffff');
        dataLabelColors.push(color);
      });

      const options = this.createLineOptions(
        years,
        series,
        colors,
        dashArray,
        markerStrokeWidths,
        markerColors,
        dataLabelColors,
        dataAnios.length - 1
      );

      this.destroyChart(this.chartEvolucionAnual);
      this.renderApexChart(
        this.chartEvolucionAnualElement.nativeElement,
        options,
        (chart) => (this.chartEvolucionAnual = chart)
      );
    });
  }

  buildChartPacientesServicio() {
    setTimeout(() => {
      const data = this.dataQueryDPPS;
      if (!data || data.length === 0) return;

      const total = data.reduce(
        (sum: number, row: any) => sum + Number(row.pacientes ?? 0),
        0,
      );

      const sorted = [...data].sort((a, b) => Number(b.pacientes) - Number(a.pacientes)).slice(0, 15);
      const categories = sorted.map(d => d.servhosdes);
      const seriesData = sorted.map(d => (Number(d.pacientes) / total) * 100);

      const options = this.createComorbilidadBarOptions(categories, seriesData, sorted, '#0064af');

      this.destroyChart(this.chartPacientesPorServicio);
      this.renderApexChart(
        this.chartPacientesPorServicioElement.nativeElement,
        options,
        (chart) => (this.chartPacientesPorServicio = chart)
      );
    });
  }

  buildChartRankingCentro() {
    setTimeout(() => {
      const data = this.dataQueryDPRC;
      if (!data || data.length === 0) return;

      const total = data.reduce(
        (sum: number, row: any) => sum + Number(row.pacientes ?? 0),
        0,
      );

      const sorted = [...data].sort((a, b) => Number(b.pacientes) - Number(a.pacientes)).slice(0, 15);
      const categories = sorted.map(d => d.cenasides);
      const seriesData = sorted.map(d => (Number(d.pacientes) / total) * 100);

      const options = this.createComorbilidadBarOptions(categories, seriesData, sorted, '#0064af');

      this.destroyChart(this.chartRankingCentro);
      this.renderApexChart(
        this.chartRankingCentroElement.nativeElement,
        options,
        (chart) => (this.chartRankingCentro = chart)
      );
    });
  }



  private renderTopDonutChart<T>(
    data: T[],
    labelFn: (item: T) => string | undefined,
    valueFn: (item: T) => number | undefined,
    container: HTMLDivElement | undefined,
    currentChart: ApexCharts | null,
    assign: (chart: ApexCharts) => void,
  ): void {
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByLabel(data, labelFn, valueFn)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    this.destroyChart(currentChart);

    if (!aggregated.length) {
      return;
    }

    const total = aggregated.reduce((acc, item) => acc + item.total, 0);
    const colors = this.buildGradientColors(aggregated.length);
    const options = this.createDonutOptions(
      aggregated.map((d) => d.label),
      aggregated.map((d) => d.total),
      total,
      colors,
    );

    this.renderApexChart(container, options, assign);
  }

  private renderBarChart<T>(
    data: T[],
    labelFn: (item: T) => string | undefined,
    valueFn: (item: T) => number | undefined,
    container: HTMLDivElement | undefined,
    currentChart: ApexCharts | null,
    assign: (chart: ApexCharts) => void,
  ): void {
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByLabel(data, labelFn, valueFn)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    this.destroyChart(currentChart);

    if (!aggregated.length) {
      return;
    }

    const colors = this.buildGradientColors(aggregated.length);
    const options = this.createBarOptions(
      aggregated.map((d) => d.label),
      aggregated.map((d) => d.total),
      colors,
    );

    this.renderApexChart(container, options, assign);
  }

  private renderTreemapChart<T>(
    data: T[],
    labelFn: (item: T) => string | undefined,
    valueFn: (item: T) => number | undefined,
    container: HTMLDivElement | undefined,
    currentChart: ApexCharts | null,
    assign: (chart: ApexCharts) => void,

  ) {

  }

  private aggregateByLabel<T>(
    data: T[] = [],
    labelFn: (item: T) => string | undefined,
    valueFn?: (item: T) => number | undefined,
  ): { label: string; total: number }[] {
    const totals = new Map<string, number>();

    data.forEach((item) => {
      const label = (labelFn(item) || 'Sin dato').trim();
      const value = valueFn ? (valueFn(item) ?? 0) : 1;
      totals.set(label, (totals.get(label) ?? 0) + value);
    });

    return Array.from(totals.entries()).map(([label, total]) => ({ label, total }));
  }

  private destroyChart(chart: ApexCharts | null): void {
    if (chart) {
      chart.destroy();
    }
  }

  private buildGradientColors(count: number): string[] {
    if (!count) {
      return [];
    }

    return Array.from({ length: count }, (_, idx) => {
      const gradient = idx / count;
      return `rgba(0, 100, 175, ${0.6 + gradient * 0.4})`;
    });
  }

  private createDonutOptions(
    categories: string[],
    values: number[],
    total: number,
    colors: string[],
  ): ApexOptions {
    const formatPct = (value: number) => {
      const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
      return `${value.toLocaleString()} (${percentage}%)`;
    };

    return {
      chart: {
        type: 'donut',
        height: 350,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      series: values,
      labels: categories,
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total pacientes',
                formatter: () => total.toLocaleString(),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val, opts: any) => {
          const rawVal = opts.w.config.series[opts.seriesIndex];
          return formatPct(Number(rawVal));
        },
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: ['#1f2937'],
        },
      },
      colors: ['#0EA5E9', '#14B8A6', '#F59E0B', '#F43F5E'],
      tooltip: {
        y: {
          formatter: (val) => formatPct(Number(val)),
        },
      },
      legend: {
        show: true,
        position: 'bottom',
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createLineOptions(
    categories: string[],
    series: any[],
    colors: string[],
    dashArray: number[],
    markerStrokeWidths: number[],
    markerColors: string[],
    dataLabelColors: string[],
    lastActualDataIdx: number
  ): ApexOptions {
    return {
      chart: {
        type: 'line',
        height: 350,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      series: series,
      colors: colors,
      stroke: {
        width: 3,
        curve: 'smooth',
        dashArray: dashArray,
      },
      markers: {
        size: 5,
        strokeColors: colors,
        strokeWidth: markerStrokeWidths,
        colors: markerColors,
        hover: {
          size: 7,
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (val) => {
            if (val >= 1000) {
              return (val / 1000) + 'k';
            }
            return val ? val.toString() : '0';
          },
          style: {
            fontSize: '11px',
          },
        },
        title: {
          text: 'Pacientes',
          style: {
            fontSize: '12px',
            fontWeight: 600,
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any, opts: any) => {
          if (val === null || val === undefined) return '';
          const seriesIdx = opts.seriesIndex;
          const dataIdx = opts.dataPointIndex;

          const isTrend = seriesIdx % 2 === 1;

          if (isTrend) {
            // Don't duplicate label at the overlap point of the trend line
            if (dataIdx === lastActualDataIdx) return '';
            return [val.toLocaleString(), '(estimado)'];
          } else {
            if (dataIdx === 0) return val.toLocaleString();
            const prevVal = opts.w.config.series[seriesIdx].data[dataIdx - 1];
            if (prevVal === null || prevVal === undefined) return val.toLocaleString();
            const pct = ((val - prevVal) / prevVal) * 100;
            const sign = pct >= 0 ? '▲ +' : '▼ ';
            return [val.toLocaleString(), `${sign}${pct.toFixed(1)}%`];
          }
        },
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: dataLabelColors,
        },
      },
      grid: {
        borderColor: '#E8EAED',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => (val !== null && val !== undefined) ? val.toLocaleString() + ' pacientes' : '',
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createStackedBarOptions(
    categories: string[],
    series: any[],
    colors: string[],
  ): ApexOptions {
    return {
      chart: {
        type: 'bar',
        height: 480,
        stacked: true,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      series: series,
      colors: colors,
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '65%',
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
          formatter: (val) => {
            const num = Number(val);
            if (num >= 1000) {
              return (num / 1000) + 'k';
            }
            return num.toString();
          }
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => {
          return val ? val.toLocaleString() : '';
        },
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: ['#fff'],
        }
      },
      grid: {
        borderColor: '#E8EAED',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        y: {
          formatter: (val) => (val !== null && val !== undefined) ? val.toLocaleString() + ' pacientes' : '',
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createBarOptions(
    categories: string[],
    series: any[],
    colors: string[],
  ): ApexOptions {
    return {
      chart: {
        type: 'bar',
        height: 480,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      series: [{ name: 'Pacientes', data: series }],
      colors: colors,
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '65%',
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
          formatter: (val) => {
            const num = Number(val);
            if (num >= 1000) {
              return (num / 1000) + 'k';
            }
            return num.toString();
          }
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => {
          return val ? val.toLocaleString() : '';
        }
        ,
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: ['#fff'],
        }
      },
      grid: {
        borderColor: '#E8EAED',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        y: {
          formatter: (val) => (val !== null && val !== undefined) ? val.toLocaleString() + ' pacientes' : '',
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createTreemapOptions(
    seriesData: any[],
    colors: string[],
  ): ApexOptions {
    return {
      chart: {
        type: 'treemap',
        height: 480,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      series: seriesData,
      colors: colors,
      plotOptions: {
        treemap: {
          distributed: false,
          enableShades: true,
          shadeIntensity: 0.5
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any, opts: any) => {
          const dataPoint = opts.w.config.series[opts.seriesIndex]?.data[opts.dataPointIndex];
          if (!dataPoint) return '';
          const xVal = dataPoint.x;
          if (Array.isArray(xVal)) {
            return [...xVal, val.toLocaleString()];
          }
          return [xVal, val.toLocaleString()];
        },
        style: {
          fontSize: '10px',
          fontWeight: 700,
          colors: ['#ffffff'],
        },
      },
      tooltip: {
        y: {
          formatter: (val, opts?: any) => {
            if (!opts) return val ? val.toLocaleString() : '';
            const dataPoint = opts.w.config.series[opts.seriesIndex]?.data[opts.dataPointIndex];
            if (!dataPoint) return val ? val.toLocaleString() : '';
            const xVal = dataPoint.x;
            const label = Array.isArray(xVal) ? xVal.join(' - ') : xVal;
            return `${label}: ${val.toLocaleString()} pacientes`;
          }
        },
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createComorbilidadBarOptions(
    categories: string[],
    seriesData: number[],
    originalData: any[],
    color: string,
  ): ApexOptions {
    return {
      chart: {
        type: 'bar',
        height: 480,
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      series: [
        {
          name: '% de pacientes',
          data: seriesData,
        },
      ],
      colors: [color],
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '70%',
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
        },
        title: {
          text: '% de pacientes',
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#4b5563',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500,
          },
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: 45,
        formatter: (val: any, opts: any) => {
          const idx = opts.dataPointIndex;
          const patients = originalData[idx]?.pacientes || 0;
          return `${patients.toLocaleString()} (${Number(val).toFixed(1)}%)`;
        },
        style: {
          fontSize: '10px',
          fontWeight: 700,
          colors: ['#374151'],
        },
      },
      grid: {
        borderColor: '#E8EAED',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: {
          right: 50,
        },
      },
      tooltip: {
        y: {
          formatter: (val, opts?: any) => {
            if (!opts) return val ? val.toLocaleString() : '';
            const idx = opts.dataPointIndex;
            const patients = originalData[idx]?.pacientes || 0;
            return `${patients.toLocaleString()} pacientes (${Number(val).toFixed(2)}%)`;
          },
        },
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private renderApexChart(
    container: HTMLElement,
    options: ApexOptions,
    assign: (chart: ApexCharts) => void,
    retries: number = 6,
  ): void {
    const tryRender = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) {
        if (retries > 0) {
          setTimeout(() => this.renderApexChart(container, options, assign, retries - 1), 50);
        }
        return;
      }

      const chart = new ApexCharts(container, options);
      assign(chart);
      chart.render();
    };

    requestAnimationFrame(tryRender);
  }


  filterRed(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchRed_DP = searchValue;
    this.isDropdownRedOpen_DP = true;

    if (this.selectedRedName_DP) {
      this.selectedRedName_DP = '';
      //this.centroForm_DP.patchValue({ code_red: '' });
      //this.restoreAllCentros_DP();
    }

    if (searchValue.trim() === '') {
      this.filteredRed_DP = this.dataRed_DP;
    } else {
      this.filteredRed_DP = this.dataRed_DP.filter((red: any) =>
        red.redasisdes.toLowerCase().includes(searchValue),
      );
    }
    this.activeRedIndex_DP = this.filteredRed_DP.length > 0 ? 0 : -1;
    //this.scrollActiveRedIntoView_DP();
  }

  filterCentro_DP(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchCentro_DP = searchValue;
    this.isDropdownCentroOpen_DP = true;

    if (searchValue.trim() === '') {
      this.filteredCentro_DP = this.dataCentro_DP;
    } else {
      this.filteredCentro_DP = this.dataCentro_DP.filter((centro: any) =>
        centro.cenasides.toLowerCase().includes(searchValue),
      );
    }
    //const centroOptions = this.getCentroOptions_DP();
    //this.activeCentroIndex_DP = centroOptions.length > 0 ? 0 : -1;
    //this.scrollActiveCentroIntoView_DP();
  }



  activeTab: 'Detalle por patología' | 'Analítica por patología de alto costo' | 'Comorbilidad del paciente' = 'Detalle por patología';

  setActiveTab(tab: 'Detalle por patología' | 'Analítica por patología de alto costo' | 'Comorbilidad del paciente'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
    if (tab === 'Analítica por patología de alto costo') {
      this.loadDataAnaliticaPatologia();
      this.loadDataAnaliticaPatologiaFiltros();

      ///graficos Analitica por patologia de alto costo
      /*.buildChartPacientesTotales();
      this.buildChartComorbilidadGlobal();

      ///filtros Analitica por patologia de alto costo
      this.buildChartRankingRed();
      this.buildChartComorbilidadesOncologico();
      this.buildChartComorbilidadesRenal();
      this.buildChartPatologiaAreaServicio();
      this.buildChartDiagnosticoServiciosMasFrecPato();
      this.buildChartComorbilidadInterserccion();
      */

    } else if (tab === 'Detalle por patología') {
      this.loadDataDetallePatologia();
      this.loadDataRedAndCentro();
    } else if (tab === 'Comorbilidad del paciente') {

    }
  }


}
