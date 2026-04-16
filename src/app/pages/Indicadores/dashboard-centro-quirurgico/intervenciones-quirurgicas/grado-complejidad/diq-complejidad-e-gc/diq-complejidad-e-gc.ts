import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { MatSort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { DataImport } from './../../../../../../services/localstorage-service';
import { ReportDashboardIntervencionesQuirurgicasService } from './../../../../../../services/report-dashboard-intervenciones-quirurgicas-service';


@Component({
  selector: 'app-diq-complejidad-e-gc',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    ScrollingModule,],
  templateUrl: './diq-complejidad-e-gc.html',
  styleUrl: './diq-complejidad-e-gc.css',
})
export class DiqComplejidadEGc  implements OnInit, AfterViewInit, OnDestroy {
  loading: boolean = false;
  error: string | null = null;
  dataLoaded: boolean = false;

  periodo: string = '';
  nameCentro: string = '';

  query0Data: any[] = [];

  query0DataOriginal: any[] = [];

  queryDataCsv: any[] = [];

  // Filtros
  filters = {
    area: '',
    servicio: '',
    cpms: '',
    cod_complejidad: '',
    des_tipo_programacion: '',
    cod_sala: '',
    acto_med: '',
    num_solicitud: '',
    fec_oper: '',
    anio_edad: '',
    sexo: '',
    cod_tipdoc_paciente: '',
    doc_paciente: ''
  };

  // Gráficos
  chartServicio: ApexCharts | null = null;
  chartAreas: ApexCharts | null = null;
  chartTipoProgramacion: ApexCharts | null = null;

  constructor(
    private dataImport: DataImport,
    private report: ReportDashboardIntervencionesQuirurgicasService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    if (this.dataLoaded) {
      setTimeout(() => {
        this.buildAllCharts();
      }, 150);
    }
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('chartServicio') chartServicioEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartAreas') chartAreasEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartTipoProgramacion') chartTipoProgramacionEl!: ElementRef<HTMLDivElement>;

  loadData() {
    const codcas = this.dataImport.getDataCentro().codcas;
    this.nameCentro = this.dataImport.getDataCentro().nameCentro || '';
    const periodo = this.dataImport.getDataIQGC().periodo || '';
    const anio = this.dataImport.getDataIQGC().anio || '';
    const codasegu = this.dataImport.getDataIQGC().codasegu || '';
    this.periodo = this.dataImport.getDataIQGC().anio + '-' + periodo;

    if (!codcas || !periodo || !anio || !codasegu) {
      this.error = 'Código CAS, período, año o código de aseguradora no proporcionado.';
      return;
    }
    this.loading = true;
    this.error = null;

    this.report.getQueryDIQGC(anio, periodo, codcas, codasegu, 'E').subscribe({
      next: (response) => {
        this.query0Data = response;
        this.query0DataOriginal = response;
        this.queryDataCsv = response;
        this.buildAllCharts();
        this.dataLoaded = true;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos: ' + err.message;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private buildAllCharts(): void {
    this.buildBarServicioChart();
    this.buildBarAreasChart();
    this.buildBarTipoProgramacionChart();
  }

  buildBarServicioChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.servicio,
        this.chartServicioEl?.nativeElement,
        this.chartServicio,
        (chart) => {
          this.chartServicio = chart;
        },
      );
    }, 100);
  }

  buildBarAreasChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.area,
        this.chartAreasEl?.nativeElement,
        this.chartAreas,
        (chart) => {
          this.chartAreas = chart;
        },
      );
    }, 100);
  }

  buildBarTipoProgramacionChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.des_tipo_programacion,
        this.chartTipoProgramacionEl?.nativeElement,
        this.chartTipoProgramacion,
        (chart) => {
          this.chartTipoProgramacion = chart;
        },
      );
    }, 100);
  }


  private renderTopBarChart<T>(
    data: T[],
    labelFn: (item: T) => string | undefined,
    container: HTMLDivElement | undefined,
    currentChart: ApexCharts | null,
    assign: (chart: ApexCharts) => void,
  ): void {
    if (!container) {
      return;
    }

    const aggregatedAll = this.aggregateByLabel(data, labelFn).sort((a, b) => b.total - a.total);
    const aggregated = aggregatedAll.slice(0, 10);

    this.destroyChart(currentChart);

    if (!aggregated.length) {
      return;
    }

    const total = aggregatedAll.reduce((acc, item) => acc + item.total, 0);
    const colors = this.buildGradientColors(aggregated.length);
    const options = this.createHorizontalBarOptions(
      aggregated.map((d) => d.label),
      aggregated.map((d) => d.total),
      total,
      colors,
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
        height: 300,
        toolbar: { show: false },
      },
      series: [
        {
          name: 'Cantidad',
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

  private buildGradientColors(count: number): string[] {
    if (!count) {
      return [];
    }

    return Array.from({ length: count }, (_, idx) => {
      const gradient = idx / count;
      return `rgba(0, 100, 175, ${0.6 + gradient * 0.4})`;
    });
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

  private destroyChart(chart: ApexCharts | null): void {
    if (chart) {
      chart.destroy();
    }
  }
  private destroyAllCharts(): void {
    this.destroyChart(this.chartServicio);
    this.destroyChart(this.chartAreas);
    this.destroyChart(this.chartTipoProgramacion);
  }

  activeTab: 'Detalle IQ' = 'Detalle IQ';

  setActiveTab(tab: 'Detalle IQ'): void {
    this.activeTab = tab;
    // Reconstruir los gráficos al cambiar de pestaña
    this.cdr.detectChanges();
    setTimeout(() => {
      if (tab === 'Detalle IQ') {
        this.buildAllCharts();
      }
    }, 100);
  }

  /**
   * Filtrar datos de la tabla por columna
   */
  filterData(column: keyof typeof this.filters, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filters[column] = filterValue;

    // Filtrar los datos originales
    const filtered = this.query0DataOriginal.filter((row) => {
      return this.applyAllFilters(row);
    });

    // Actualizar los datos mostrados
    this.query0Data = filtered;
  }

  /**
   * Aplicar todos los filtros activos a una fila
   */
  private applyAllFilters(row: any): boolean {

    // Filtro area
    if (this.filters.area && !row.area.toLowerCase().includes(this.filters.area)) {
      return false;
    }

    // Filtro servicio
    if (this.filters.servicio && !row.servicio.toLowerCase().includes(this.filters.servicio)) {
      return false;
    }

    //filtro cpms
    if (this.filters.cpms && !row.cpms.toLowerCase().includes(this.filters.cpms)) {
      return false;
    }

    //filtro cod_complejidad
    if (this.filters.cod_complejidad && !row.cod_complejidad.toLowerCase().includes(this.filters.cod_complejidad)) {
      return false;
    }

    //filtro des_tipo_programacion
    if (this.filters.des_tipo_programacion && !row.des_tipo_programacion.toLowerCase().includes(this.filters.des_tipo_programacion)) {
      return false;
    }

    //filtro cod_sala
    if (this.filters.cod_sala && !row.cod_sala.toLowerCase().includes(this.filters.cod_sala)) {
      return false;
    }

    // Filtro acto_med
    if (
      this.filters.acto_med &&
      !String(row.acto_med).toLowerCase().includes(this.filters.acto_med)
    ) {
      return false;
    }

    //filtro num_solicitud
    if (this.filters.num_solicitud && !row.num_solicitud.toLowerCase().includes(this.filters.num_solicitud)) {
      return false;
    }

    //filtro fec_oper
    if (this.filters.fec_oper && !row.fec_oper.toLowerCase().includes(this.filters.fec_oper)) {
      return false;
    }

    //filtro anio_edad
    if (this.filters.anio_edad && !String(row.anio_edad).toLowerCase().includes(this.filters.anio_edad)) {
      return false;
    }

    //filtro sexo
    if (this.filters.sexo && !row.sexo.toLowerCase().includes(this.filters.sexo)) {
      return false;
    }

    //filtro cod_tipdoc_paciente
    if (this.filters.cod_tipdoc_paciente && !row.cod_tipdoc_paciente.toLowerCase().includes(this.filters.cod_tipdoc_paciente)) {
      return false;
    }
    //filtro doc_paciente
    if (this.filters.doc_paciente && !row.doc_paciente.toLowerCase().includes(this.filters.doc_paciente)) {
      return false;
    }

    return true;
  }

  descargarCSV(): void {
    const { anio, periodo, codasegu } = this.dataImport.getDataIQGC();
    const { codcas } = this.dataImport.getDataCentro();

    if (!anio || !periodo || !codcas || !codasegu) {
      this.error = 'Parámetros incompletos para descargar datos';
      return;
    }

    this.downloadTableCSV(
      this.queryDataCsv,
      `gc_complejidad_e_${periodo}_${anio}_${this.nameCentro}.csv`,
    );
  }

  private downloadTableCSV(data: any[], fileName: string): void {
    if (!data?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
