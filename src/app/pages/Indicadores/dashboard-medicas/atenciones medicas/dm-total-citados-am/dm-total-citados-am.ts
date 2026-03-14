import {Component, OnInit,OnDestroy,AfterViewInit,ChangeDetectorRef,ViewChild,ElementRef,} from '@angular/core';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { MatSort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSortModule } from '@angular/material/sort';
import { ReportDashboardMedicasService } from '../../../../../services/report-dashboard-medicas-service';
import { DataImport } from '../../../../../services/data-import';


@Component({
  selector: 'app-dm-total-citados-am',
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatPaginatorModule, MatSortModule, ScrollingModule],
  templateUrl: './dm-total-citados-am.html',
  styleUrl: './dm-total-citados-am.css',
})
export class DmTotalCitadosAm implements OnInit, AfterViewInit, OnDestroy {

  nameCentro: string = '';

  periodo: string = '';
  loading: boolean = false;
  error: string | null = null;
  dataLoaded: boolean = false;
  viewReady: boolean = false;

  ///Datos de consulta
  query0Data: any[] = [];
  query0DataOriginal: any[] = [];

  ///Filtros
  filters = {
    cod_servicio: '',
    cod_especialidad: '',
    cenasides: '',
    actividad: '',
    agrupador: '',
    detalle_subactividad: '',
    descripcion_servicio: '',
    descripcion_especialidad: '',
    estado_cita: '',
    tipo_paciente: '',
    cod_paciente: '',
    acto_med: ''
  };


  ///Graficos
  chartServicio: ApexCharts | null = null;
  chartSubactividad: ApexCharts | null = null;
  chartAgrupador: ApexCharts | null = null;
  chartEspecialidad: ApexCharts | null = null;
  chartEstado: ApexCharts | null = null;

  constructor(
    private reportDashboardMedicasService: ReportDashboardMedicasService,
    private dataImport: DataImport,
    private cdr: ChangeDetectorRef
  ) { }

  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild('chartServicio') chartServicioEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartSubactividad') chartSubactividadEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartAgrupador') chartAgrupadorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartEspecialidad') chartEspecialidadEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartEstado') chartEstadoEl!: ElementRef<HTMLDivElement>;




  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataLoaded) {
      setTimeout(() => this.buildAllCharts(), 150);
    }
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  loadData(): void {

    this.nameCentro = this.dataImport.getDataCentro().nameCentro || '';
    const codcas = this.dataImport.getDataCentro().codcas;
    const anio = this.dataImport.getDataDMA().anio;
    const periodo = this.dataImport.getDataDMA().periodo;
    const codasegu = this.dataImport.getDataDMA().codasegu;
    this.periodo = anio + "-" + periodo

    if (!codcas || !periodo || !anio || !codasegu) {
      this.error = 'Código CAS o período no proporcionado.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.reportDashboardMedicasService.getQuery0DMAMTC(anio, periodo, codcas, codasegu).subscribe({
      next: (data) => {
        this.query0Data = data;
        this.query0DataOriginal = data; // Almacenar datos originales
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
        if (this.viewReady) {
          setTimeout(() => this.buildAllCharts(), 150);
        }

      },
      error: (err) => {
        this.error = 'Error al cargar los datos: ' + err.message;
        this.loading = false;
        console.error(err);
      }
    });
  }


  private buildAllCharts(): void {
    this.buildBarServicioChart();
    this.buildBarSubactividadChart();
    this.buildBarAgrupadorChart();
    this.buildBarEspecialidadChart();
    this.buildPieEstadoChart();
  }

  buildBarServicioChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.descripcion_servicio,
        this.chartServicioEl?.nativeElement,
        this.chartServicio,
        (chart) => {
          this.chartServicio = chart;
        },
      );
    }, 100);
  }

  buildBarSubactividadChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.detalle_subactividad,
        this.chartSubactividadEl?.nativeElement,
        this.chartSubactividad,
        (chart) => {
          this.chartSubactividad = chart;
        },
      );
    }, 100);
  }

  buildBarAgrupadorChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.agrupador,
        this.chartAgrupadorEl?.nativeElement,
        this.chartAgrupador,
        (chart) => {
          this.chartAgrupador = chart;
        },
      );
    }, 100);
  }

  buildBarEspecialidadChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.descripcion_especialidad,
        this.chartEspecialidadEl?.nativeElement,
        this.chartEspecialidad,
        (chart) => {
          this.chartEspecialidad = chart;
        },
      );
    }, 100);
  }


  private renderTopBarChart<T>(
    data: T[] = [],
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
      const percentage = total ? ((value / total) * 100).toFixed(2) : '0.00';
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
    this.destroyChart(this.chartSubactividad);
    this.destroyChart(this.chartAgrupador);
    this.destroyChart(this.chartEspecialidad);
    this.destroyChart(this.chartEstado);
  }


  buildPieEstadoChart(): void {
    setTimeout(() => {
      const data = this.query0Data || [];
      if (!data.length) return;

      const estadoMap = new Map<string, number>();
      for (const row of data) {
        const estado = (row as any).estado_cita || 'Sin estado';
        estadoMap.set(estado, (estadoMap.get(estado) || 0) + 1);
      }

      const labels = Array.from(estadoMap.keys());
      const counts = Array.from(estadoMap.values());
      const total = counts.reduce((acc, n) => acc + n, 0);

      const colors = [
        '#1d77c3', '#f28b2c', '#35a853', '#d13c3c', '#8e44ad',
        '#2d9cdb', '#f2c94c', '#27ae60', '#f2994a', '#eb5757'
      ];

      const container = this.chartEstadoEl?.nativeElement;
      if (container) {
        this.destroyChart(this.chartEstado);

        const options: ApexOptions = {
          chart: {
            type: 'pie',
            height: 320,
            toolbar: { show: false },
          },
          plotOptions: {
            pie: {
              startAngle: 90,
              endAngle: 450,
              dataLabels: {
                offset: 120,
                minAngleToShowLabel: 0,
              },
            },
          },
          series: counts,
          labels,
          colors: labels.map((_, i) => colors[i % colors.length]),
          stroke: {
            colors: ['#ffffff'],
            width: 2,
          },
          dataLabels: {
            enabled: true,
            formatter: (val, opts) => {
              const seriesIndex = opts?.seriesIndex ?? -1;
              const value = opts?.w?.globals?.series?.[seriesIndex] ?? 0;
              const label = opts?.w?.globals?.labels?.[seriesIndex] ?? '';
              return `${label}\n${Number(val).toFixed(2)}% (${value.toLocaleString()})`;
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
              formatter: (val) => {
                const pct = total ? ((val / total) * 100).toFixed(1) : '0.0';
                return `${val.toLocaleString()} (${pct}%)`;
              },
            },
          },
          noData: {
            text: 'Sin datos',
          },
        };

        this.renderApexChart(container, options, (chart) => {
          this.chartEstado = chart;
        });
      }
    }, 100);
  }



  activeTab: 'Numero de citas' | 'Numero de citas x servicio' = 'Numero de citas';
  setActiveTab(tab: 'Numero de citas' | 'Numero de citas x servicio'): void {
    this.activeTab = tab;
    // Reconstruir los gráficos al cambiar de pestaña
    this.cdr.detectChanges();
    setTimeout(() => {
      if (tab === 'Numero de citas') {
        this.buildAllCharts();

      } else if (tab === 'Numero de citas x servicio') {
        // Construir gráficos para la pestaña de diagnósticos
      }
    }, 100);
  }



  ///Filtrar datos de la tabla por columna

  filterData(column: keyof typeof this.filters, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filters[column] = filterValue;

    // Filtrar los datos originales
    const filtered = this.query0DataOriginal.filter(row => {
      return this.applyAllFilters(row);
    });

    // Actualizar los datos mostrados
    this.query0Data = filtered;
  }

  /// Aplicar todos los filtros activos a una fila

  private applyAllFilters(row: any): boolean {

    // Filtro Servicio
    if (this.filters.descripcion_servicio && !row.descripcion_servicio.toLowerCase().includes(this.filters.descripcion_servicio)) {
      return false;
    }

    // Filtro Agrupador
    if (this.filters.agrupador && !row.agrupador.toLowerCase().includes(this.filters.agrupador)) {
      return false;
    }

    // Filtro Act med
    if (this.filters.acto_med && !String(row.acto_med).toLowerCase().includes(this.filters.acto_med)) {
      return false;
    }

    // Filtro Estado Cita
    if (this.filters.estado_cita && !row.estado_cita.toLowerCase().includes(this.filters.estado_cita)) {
      return false;
    }

    // Filtro Tipo Paciente
    if (this.filters.tipo_paciente && !row.tipo_paciente.toLowerCase().includes(this.filters.tipo_paciente)) {
      return false;
    }

    return true;
  }

  downloadCSV(): void {

     const { anio, periodo, codasegu } = this.dataImport.getDataDMA();
    const { codcas } = this.dataImport.getDataCentro();

    if (!anio || !periodo || !codcas || !codasegu) {
      this.error = 'Parámetros incompletos para descargar datos';
      return;
    }

    this.downloadTableCSV(this.query0Data, `am_total_citados_${anio}_${periodo}_${this.nameCentro}.csv`);
  }

  private downloadTableCSV(data: any[], fileName: string): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para descargar');
      return;
    }

    const headers = Object.keys(data[0]);

    let csv = headers.join(';') + '\n';

    for (const row of data) {
      csv += headers
        .map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
        .join(';') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }




}
