import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSortModule } from '@angular/material/sort';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { ReportDashboardEmergenciasService } from '../../../../services/report-dashboard-emergencias-service';
import { DataImport } from '../../../../services/localstorage-service';

@Component({
  selector: 'app-aten-topicos-3',
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatPaginatorModule, MatSortModule, ScrollingModule],
  templateUrl: './aten-topicos-3.html',
  styleUrl: './aten-topicos-3.css',
})
export class AtenTopicos3 implements OnInit, OnDestroy {
  nameCentro: string = '';
  periodo: string = '';
  loading: boolean = false;
  error: string | null = null;

  query0Data: any[] = [];

  chartDiagnosticos: ApexCharts | null = null;
  chartFechaAten: ApexCharts | null = null;
  chartTipoPaciNom: ApexCharts | null = null;

  activeTab: 'produccion' = 'produccion';

  @ViewChild('chartDiagnosticos') chartDiagnosticosEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartFechaAten') chartFechaAtenEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartTipoPaciNom') chartTipoPaciNomEl!: ElementRef<HTMLDivElement>;

  constructor(
    private dataImport: DataImport,
    private reportDashboardEmergenciasService: ReportDashboardEmergenciasService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  loadData(): void {
    const dataImport = this.dataImport.getDataDE();

    this.nameCentro = this.dataImport.getDataCentro()?.nameCentro || '';
    const codcas = this.dataImport.getDataCentro()?.codcas || '';
    const periodo = dataImport.periodo;
    const anio = dataImport.anio;
    const codasegu = dataImport.codasegu;
    this.periodo = `${anio}-${periodo}`;

    if (!anio || !periodo || !codcas || !codasegu) {
      this.error = 'Código CAS o período no proporcionado.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.reportDashboardEmergenciasService.getQueryDEP(anio, periodo, codcas, codasegu, 3).subscribe({
      next: (data) => {
        this.query0Data = data || [];
        this.loading = false;
        this.cdr.detectChanges();
        this.buildChartsForActiveTab();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos: ' + err.message;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private buildChartsForActiveTab(): void {
    if (this.activeTab === 'produccion') {
      this.buildCharts();
    }
  }

  private buildCharts(): void {
    this.buildBarDiagnosticosChart();
    this.buildBarFechaAtenChart();
    this.buildPieTipoPaciNomChart();
  }

  private buildBarDiagnosticosChart(): void {
    this.renderTopHorizontalBarChart(
      this.query0Data,
      (row) => row.diagdes,
      this.chartDiagnosticosEl?.nativeElement,
      this.chartDiagnosticos,
      (chart) => {
        this.chartDiagnosticos = chart;
      },
    );
  }

  private buildBarFechaAtenChart(): void {
    const container = this.chartFechaAtenEl?.nativeElement;
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByLabel(this.query0Data, (row) => row.fecha_aten).sort((a, b) =>
      a.label.localeCompare(b.label),
    );

    this.destroyChart(this.chartFechaAten);

    if (!aggregated.length) {
      return;
    }

    const total = aggregated.reduce((sum, item) => sum + item.total, 0);
    const options = this.createVerticalBarOptions(
      aggregated.map((item) => item.label),
      aggregated.map((item) => item.total),
      total,
      this.buildGradientColors(aggregated.length),
    );

    this.renderApexChart(container, options, (chart) => {
      this.chartFechaAten = chart;
    });
  }

  private buildPieTipoPaciNomChart(): void {
    const container = this.chartTipoPaciNomEl?.nativeElement;
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByLabel(this.query0Data, (row) => row.tipopacinom ?? 'Sin estado');

    this.destroyChart(this.chartTipoPaciNom);

    if (!aggregated.length) {
      return;
    }

    const labels = aggregated.map((item) => item.label);
    const values = aggregated.map((item) => item.total);
    const total = values.reduce((sum, value) => sum + value, 0);
    const options = this.createPieOptions(labels, values, total);

    this.renderApexChart(container, options, (chart) => {
      this.chartTipoPaciNom = chart;
    });
  }

  private renderTopHorizontalBarChart<T>(
    data: T[],
    labelFn: (item: T) => string | undefined,
    container: HTMLDivElement | undefined,
    currentChart: ApexCharts | null,
    assign: (chart: ApexCharts) => void,
  ): void {
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByLabel(data, labelFn)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    this.destroyChart(currentChart);

    if (!aggregated.length) {
      return;
    }

    const total = aggregated.reduce((sum, item) => sum + item.total, 0);
    const options = this.createHorizontalBarOptions(
      aggregated.map((item) => item.label),
      aggregated.map((item) => item.total),
      total,
      this.buildGradientColors(aggregated.length),
    );

    this.renderApexChart(container, options, assign);
  }

  private createHorizontalBarOptions(
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
        type: 'bar',
        height: '100%',
        toolbar: { show: true },
      },
      series: [
        {
          name: 'Atenciones',
          data: values,
        },
      ],
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          barHeight: '70%',
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => formatPct(Number(val)),
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: ['#1f2937'],
        },
      },
      colors,
      xaxis: {
        categories,
        labels: {
          formatter: (val) => Math.round(Number(val)).toLocaleString(),
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '9px',
          },
        },
      },
      grid: {
        borderColor: '#E8EAED',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        y: {
          formatter: (val) => formatPct(Number(val)),
        },
      },
      legend: {
        show: false,
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createVerticalBarOptions(
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
        type: 'bar',
        height: '100%',
        toolbar: { show: true },
      },
      series: [
        {
          name: 'Atenciones',
          data: values,
        },
      ],
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 2,
          columnWidth: '60%',
        },
      },
      dataLabels: {
        enabled: false,
        formatter: (val) => formatPct(Number(val)),
        style: {
          fontSize: '9px',
          fontWeight: 700,
          colors: ['#1f2937'],
        },
      },
      colors,
      xaxis: {
        categories,
        tickPlacement: 'on',
        labels: {
          rotate: -90,
          hideOverlappingLabels: false,
          showDuplicates: true,
          trim: false,
          minHeight: 90,
          maxHeight: 130,
          style: {
            fontSize: '9px',
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (val) => Math.round(Number(val)).toLocaleString(),
          style: {
            fontSize: '9px',
          },
        },
      },
      grid: {
        borderColor: '#E8EAED',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      markers: {
        size: 0,
      },
      tooltip: {
        x: {
          formatter: (_val, opts) => categories[opts?.dataPointIndex ?? -1] ?? String(_val),
        },
        y: {
          formatter: (val) => formatPct(Number(val)),
        },
      },
      legend: {
        show: false,
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private createPieOptions(labels: string[], values: number[], total: number): ApexOptions {
    const palette = [
      '#1D77C3',
      '#F28B2C',
      '#35A853',
      '#D13C3C',
      '#8E44AD',
      '#2D9CDB',
      '#F2C94C',
      '#27AE60',
      '#F2994A',
      '#EB5757',
    ];

    return {
      chart: {
        type: 'pie',
        height: 320,
        toolbar: { show: true },
      },
      plotOptions: {
        pie: {
          startAngle: 90,
          endAngle: 450,
          dataLabels: {
            offset: 20,
            minAngleToShowLabel: 0,
          },
        },
      },
      labels,
      series: values,
      colors: labels.map((_, index) => palette[index % palette.length]),
      stroke: {
        colors: ['#ffffff'],
        width: 2,
      },
      dataLabels: {
        enabled: true,
        formatter: (value, opts) => {
          const seriesIndex = opts?.seriesIndex ?? -1;
          const rawValue = values[seriesIndex] ?? 0;
          const label = labels[seriesIndex] ?? '';
          return `${label}\n${Number(value).toFixed(2)}% (${rawValue.toLocaleString()})`;
        },
        style: {
          fontSize: '10px',
          fontWeight: 700,
          colors: ['#ffffff'],
        },
        background: {
          enabled: true,
          foreColor: '#1f2937',
          padding: 4,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: '#cbd5e1',
          opacity: 0.96,
        },
      },
      legend: {
        show: true,
        position: 'right',
        fontSize: '11px',
      },
      tooltip: {
        y: {
          formatter: (value) => {
            const numericValue = Number(value);
            const pct = total ? ((numericValue / total) * 100).toFixed(1) : '0.0';
            return `${numericValue.toLocaleString()} (${pct}%)`;
          },
        },
      },
      noData: {
        text: 'Sin datos',
      },
    };
  }

  private aggregateByLabel<T>(
    data: T[] = [],
    labelFn: (item: T) => string | undefined,
  ): { label: string; total: number }[] {
    const totals = new Map<string, number>();

    data.forEach((item) => {
      const label = (labelFn(item) || 'Sin dato').trim();
      totals.set(label, (totals.get(label) ?? 0) + 1);
    });

    return Array.from(totals.entries()).map(([label, total]) => ({ label, total }));
  }

  private buildGradientColors(count: number): string[] {
    if (!count) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => {
      const gradient = index / count;
      return `rgba(0, 100, 175, ${0.6 + gradient * 0.4})`;
    });
  }

  private destroyChart(chart: ApexCharts | null): void {
    if (chart) {
      chart.destroy();
    }
  }

  private destroyAllCharts(): void {
    this.destroyChart(this.chartDiagnosticos);
    this.destroyChart(this.chartFechaAten);
    this.destroyChart(this.chartTipoPaciNom);
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

  setActiveTab(tab: 'produccion'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();

    if (tab === 'produccion') {
      this.buildCharts();
    }
  }

  downloadCSV(): void {
    const data = this.query0Data || [];
    this.downloadTableCSV(data, `atenciones_prioridad_I_${this.periodo}.csv`);
  }

  private downloadTableCSV(data: any[], fileName: string): void {
    if (!data.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map((row) =>
        headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';'),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
