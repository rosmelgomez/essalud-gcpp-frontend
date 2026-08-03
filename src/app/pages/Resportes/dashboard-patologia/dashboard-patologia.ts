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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { LocalStorageService } from '../../../services/local-storage-service';
import { PatologiaService } from '../../../services/reportes/patologia-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

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
    MatSelectModule
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
  queryTotalPacientes: any[] = [];

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
  queryDiagnosticoServicios: any[] = [];

  ///total pacientes
  quryTotalPacientes: any[] = [];

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

  ///Detalle por patología
  dataAnioDP: any[] = [];
  anio_DP: string[] = [];

  dataPatologiaDP: any[] = [];
  patologia_DP: string[] = [];

  dataGrupoEtarioDP = ["Todos", "0-11", "12-17", "18-29", "30-44", "45-59", "60+", "SIN DATO"];
  grupoEtario_DP: string[] = ['Todos'];

  dataRedDP: any[] = [];
  red_DP: string[] = [];

  dataCentroDP: any[] = [];
  centro_DP: string[] = [];


  ///graficos 
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



  constructor(
    private dataService: LocalStorageService,
    private patologiaService: PatologiaService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadDataOpciones();
    this.loadDataAnaliticaPatologia();
  }
  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  private destroyAllCharts(): void {
    this.destroyChart(this.chartPacientesTotales);
    this.destroyChart(this.chartComorbilidadGlobal);
    this.destroyChart(this.chartRankingRed);
    this.destroyChart(this.chartComorbilidadesOncologico);
    this.destroyChart(this.chartComorbilidadesRenal);
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
          .map(red => ({ red }));
        this.dataRedDP = uniqueReds;

        // Map cenasides to centro property for the HTML template
        const uniqueCentros = Array.from(new Set(results.q2.map((item: any) => item.cenasides)))
          .filter(Boolean)
          .map(centro => ({ centro }));
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
        if (this.dataRedDP.length > 0) {
          this.red_DP = [this.dataRedDP[0].red];
        }
        if (this.dataCentroDP.length > 0) {
          this.centro_DP = [this.dataCentroDP[0].centro];
        }
        this.grupoEtario_DP = ['Todos'];

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

  onAnioApalChange() {
    this.loadDataAnaliticaPatologiaFiltros();
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
      q5: this.patologiaService.getQueryAPACPAS(['TODOS']),

    }).subscribe({
      next: (results) => {
        this.queryTotalPacientes = results.q0;
        this.queryComorbilidadGlobal = results.q1;
        this.queryRankingRed = results.q2;
        this.queryComorbilidadesOncologico = results.q3;
        this.queryComorbilidadesRenal = results.q4;
        this.queryPatologiaAreaServicio = results.q5;
        this.buildChartPacientesTotales();
        this.buildChartComorbilidadGlobal();
        this.buildChartRankingRed();
        this.buildChartComorbilidadesOncologico();
        this.buildChartComorbilidadesRenal();
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
    }).subscribe({
      next: (results) => {
        this.queryRankingRed = results.q0;
        this.queryPatologiaAreaServicio = results.q1;
        this.buildChartRankingRed();
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

  buildChartPacientesTotales(): void {
    setTimeout(() => {
      this.renderTopDonutChart(
        this.queryTotalPacientes,
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

      const patologias = ['Oncologico', 'Renal', 'Raras'];
      const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];
      const regressionYears = [2022, 2023, 2024, 2025];

      const series: any[] = [];
      const colors = ['#0064af', '#00a261', '#e29c00', '#0064af', '#00a261', '#e29c00'];
      const dashArray = [0, 0, 0, 5, 5, 5];

      patologias.forEach((pat) => {
        // Calculate linear regression on years 2022-2025
        const x = regressionYears;
        const y = regressionYears.map(yr => histMap.get(pat)?.get(yr.toString()) ?? 0);

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 1. Actuals Series (2019 to 2026)
        const actualData = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'].map(
          yr => histMap.get(pat)?.get(yr) ?? null
        );
        while (actualData.length < years.length) {
          actualData.push(null);
        }

        // 2. Trend Series (2025 actual connects to 2026-2030 projected)
        const trendData = Array(6).fill(null);
        const val2025 = histMap.get(pat)?.get('2025') ?? null;
        trendData.push(val2025);

        for (let yr = 2026; yr <= 2030; yr++) {
          trendData.push(Math.round(slope * yr + intercept));
        }

        series.push({
          name: pat,
          data: actualData
        });
        series.push({
          name: `Tendencia ${pat}`,
          data: trendData
        });
      });

      const options = this.createLineOptions(years, series, colors, dashArray);

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

      const oncoItem = this.queryTotalPacientes.find(item => item.patologia === 'Oncologico');
      const total = oncoItem ? Number(oncoItem.pacientes) : 285436;

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
        strokeWidth: [0, 0, 0, 2, 2, 2],
        colors: ['#0064af', '#00a261', '#e29c00', '#ffffff', '#ffffff', '#ffffff'],
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

          // Don't duplicate label at year 2025 for the trend line
          if (seriesIdx >= 3 && dataIdx === 6) return '';

          if (seriesIdx < 3) {
            if (dataIdx === 0) return val.toLocaleString();
            const prevVal = opts.w.config.series[seriesIdx].data[dataIdx - 1];
            if (prevVal === null || prevVal === undefined) return val.toLocaleString();
            const pct = ((val - prevVal) / prevVal) * 100;
            const sign = pct >= 0 ? '▲ +' : '▼ ';
            return [val.toLocaleString(), `${sign}${pct.toFixed(1)}%`];
          } else {
            return [val.toLocaleString(), '(estimado)'];
          }
        },
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: ['#0064af', '#00a261', '#e29c00', '#0064af', '#00a261', '#e29c00'],
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

  activeTab: 'Analítica por patología de alto costo' | 'Detalle por patología' | 'Comorbilidad del paciente' = 'Analítica por patología de alto costo';

  setActiveTab(tab: 'Analítica por patología de alto costo' | 'Detalle por patología' | 'Comorbilidad del paciente'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
    if (tab === 'Analítica por patología de alto costo') {
      this.buildChartPacientesTotales();
      this.buildChartComorbilidadGlobal();
      this.buildChartRankingRed();
      this.buildChartComorbilidadesOncologico();
      this.buildChartComorbilidadesRenal();
    } else if (tab === 'Detalle por patología') {

    } else if (tab === 'Comorbilidad del paciente') {

    }
  }


}
