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
import { MatPaginatorModule } from '@angular/material/paginator';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MedicasService } from '../../../../../../services/reportes/medicas-service';
import { LocalStorageService } from '../../../../../../services/local-storage-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'dm-app-total-desercion-am',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
    MatIconModule,
  ],
  templateUrl: './dm-total-desercion-am.html',
  styleUrl: './dm-total-desercion-am.css',
})
export class DmTotalDesercionAm implements OnInit, AfterViewInit, OnDestroy {
  loading: boolean = false;
  error: string | null = null;
  dataLoaded: boolean = false;

  periodo: string = '';
  nameCentro: string = '';

  // Datos de consultas
  query0Data: any[] = []; // Servicios
  query1Data: any[] = []; // Detalle deserciones
  query2DataCSV: any[] = []; // CSV para descarga
  query1DataOriginal: any[] = []; // Almacenar datos originales

  // Filtros
  filters = {
    servicio: '',
    subactividad: '',
    agrupador: '',
    especialidad: '',
    actdes: '',
    cenasides: '',
    acto_med: '',
  };

  // Gráficos
  chartServicio: ApexCharts | null = null;
  chartSubactividad: ApexCharts | null = null;
  chartAgrupador: ApexCharts | null = null;
  chartEspecialidad: ApexCharts | null = null;

  constructor(
    private dataImport: LocalStorageService,
    private reportDashboardMedicasService: MedicasService,
    private cdr: ChangeDetectorRef,
  ) { }

  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild('chartServicio') chartServicioEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartSubactividad') chartSubactividadEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartAgrupador') chartAgrupadorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartEspecialidad') chartEspecialidadEl!: ElementRef<HTMLDivElement>;

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

  loadData(): void {
    const codcas = this.dataImport.getDataCentro().codcas;
    this.nameCentro = this.dataImport.getDataCentro().nameCentro || '';
    const periodo = this.dataImport.getDataDMA().periodo;
    const anio = this.dataImport.getDataDMA().anio;
    const codasegu = this.dataImport.getDataDMA().codasegu;
    this.periodo = this.dataImport.getDataDMA().anio + '-' + periodo;

    if (!codcas || !periodo || !anio || !codasegu) {
      this.error = 'Código CAS, período, año o código de aseguradora no proporcionado.';
      return;
    }

    this.loading = true;
    this.error = null;
    forkJoin({
      query0TD: this.reportDashboardMedicasService.getQuery0DMAMTD(anio, periodo, codcas, codasegu),
      query1TD: this.reportDashboardMedicasService.getQuery1DMAMTD(anio, periodo, codcas, codasegu),
      query2TDCSV: this.reportDashboardMedicasService.getQuery2DMAMTDCSV(anio, periodo, codcas, codasegu),
    }).subscribe({
      next: (results) => {
        this.query0Data = results.query0TD;
        this.query1Data = results.query1TD;
        this.query2DataCSV = results.query2TDCSV;

        this.query1DataOriginal = this.query1Data;
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
        this.buildAllCharts();
      },
      error: () => {
        this.error = 'Error al cargar los datos';
        this.loading = false;
      },
    });
  }

  private buildAllCharts(): void {
    this.buildBarServicioChart();
    this.buildBarSubactividadChart();
    this.buildBarAgrupadorChart();
    this.buildBarEspecialidadChart();
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
  }

  buildBarSubactividadChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0Data,
        (d) => d.subactividad,
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
        (d) => d.especialidad,
        this.chartEspecialidadEl?.nativeElement,
        this.chartEspecialidad,
        (chart) => {
          this.chartEspecialidad = chart;
        },
      );
    }, 100);
  }

  activeTab: 'Detalle deserciones' = 'Detalle deserciones';

  setActiveTab(tab: 'Detalle deserciones'): void {
    this.activeTab = tab;
    // Reconstruir los gráficos al cambiar de pestaña
    this.cdr.detectChanges();
    setTimeout(() => {
      if (tab === 'Detalle deserciones') {
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
    const filtered = this.query1DataOriginal.filter((row) => {
      return this.applyAllFilters(row);
    });

    // Actualizar los datos mostrados
    this.query1Data = filtered;
  }

  /**
   * Aplicar todos los filtros activos a una fila
   */
  private applyAllFilters(row: any): boolean {
    // Filtro servicio
    if (this.filters.servicio && !row.servicio.toLowerCase().includes(this.filters.servicio)) {
      return false;
    }

    // Filtro subactividad
    if (
      this.filters.subactividad &&
      !row.subactividad.toLowerCase().includes(this.filters.subactividad)
    ) {
      return false;
    }

    // Filtro Agrupador
    if (this.filters.agrupador && !row.agrupador.toLowerCase().includes(this.filters.agrupador)) {
      return false;
    }

    // Filtro Especialidad
    if (
      this.filters.especialidad &&
      !row.especialidad.toLowerCase().includes(this.filters.especialidad)
    ) {
      return false;
    }

    // Filtro actdes
    if (this.filters.actdes && !row.actdes.toLowerCase().includes(this.filters.actdes)) {
      return false;
    }

    // Filtro cenasides
    if (
      this.filters.cenasides &&
      !String(row.cenasides).toLowerCase().includes(this.filters.cenasides)
    ) {
      return false;
    }

    // Filtro acto_med
    if (
      this.filters.acto_med &&
      !String(row.acto_med).toLowerCase().includes(this.filters.acto_med)
    ) {
      return false;
    }

    return true;
  }

  descargarCSV(): void {
    const { anio, periodo, codasegu } = this.dataImport.getDataDMA();
    const { codcas } = this.dataImport.getDataCentro();

    if (!anio || !periodo || !codcas || !codasegu) {
      this.error = 'Parámetros incompletos para descargar datos';
      return;
    }

    this.downloadTableCSV(
      this.query2DataCSV,
      `am_total_desercion_${periodo}_${anio}_${this.nameCentro}.csv`,
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
