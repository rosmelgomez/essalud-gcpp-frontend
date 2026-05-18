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
import { ReportDashboardMedicasService } from '../../../../../../services/reportes/report-dashboard-medicas-service';
import { LocalStorageService } from '../../../../../../services/local-storage-service';
import { FormsModule } from '@angular/forms';

interface MedicoRow {
  descripcion_servicio: string;
  dni_medico: string;
  fecha_atencion: string;
  atenciones: number;
}
interface PivotRow {
  dni_medico: string;
  cells: Record<string, number>;
  total: number;
}

@Component({
  selector: 'app-dm-total-horas-efectivas-mp',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
  ],
  templateUrl: './dm-total-horas-efectivas-mp.html',
  styleUrl: './dm-total-horas-efectivas-mp.css',
})
export class DmTotalHorasEfectivasMp implements OnInit, AfterViewInit, OnDestroy {
  nameCentro: String = '';

  periodo: string = '';
  loading: boolean = false;
  error: string | null = null;
  dataLoaded: boolean = false;
  viewReady: boolean = false;

  // Datos de consultas
  query0Data: any[] = []; // Servicios
  query0DataOriginal: any[] = []; // Almacenar datos originales

  newtableData: any[] = [];

  // Filtros
  filters = {
    dni: '',
    servicio: '',
    agrupador: '',
    especialidad: '',
    subactividad: '',
    fecha: '',
    horas: '',
  };
  pivotHeaders: string[] = []; // fechas
  pivotRows: Array<{ dni_medico: string; cells: Record<string, number>; total: number }> = [];
  pivotRowsFiltered: Array<{ dni_medico: string; cells: Record<string, number>; total: number }> =
    [];
  pivotColumnTotals: Record<string, number> = {};
  pivotColumnTotalsFiltered: Record<string, number> = {};
  pivotGrandTotal = 0;
  pivotGrandTotalFiltered = 0;
  pivotFilters = {
    dni_medico: '',
    total: '' as string,
    columns: {} as Record<string, string>,
  };

  // Gráficos
  chartServicio: ApexCharts | null = null;
  chartSubactividad: ApexCharts | null = null;
  chartAgrupador: ApexCharts | null = null;
  chartEspecialidad: ApexCharts | null = null;
  tableRows: MedicoRow[] = [];

  constructor(
    private reportDashboardMedicasService: ReportDashboardMedicasService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
  ) {}

  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild('chartServicio') chartServicioEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartSubactividad') chartSubactividadEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartAgrupador') chartAgrupadorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartEspecialidad') chartEspecialidadEl!: ElementRef<HTMLDivElement>;

  activeTab: 'produccion' | 'diagnosticos' | 'noconsiderados' = 'produccion';

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
    const anio = this.dataImport.getDataDMMP().anio;
    const periodo = this.dataImport.getDataDMMP().periodo;
    this.periodo = anio + '-' + periodo;

    if (!codcas || !periodo || !anio) {
      this.error = 'codcas, anio o período no proporcionado.';
      return;
    }
    this.loading = true;
    this.error = null;
    this.reportDashboardMedicasService.getQueryDMMPTHE(anio, periodo, codcas).subscribe({
      next: (data) => {
        this.query0Data = data;
        const groupMap = new Map<
          string,
          {
            dni_medico: string;
            servicio: string;
            agrupador: string;
            especialidad: string;
            subactividad: string;
            fecha_prog: string;
            horas_efec_def: number;
          }
        >();

        for (const row of data) {
          const dni_medico = (row as any).dni_medico || 'Sin dni_medico';
          const servicio = (row as any).servicio || 'Sin descripción servicio';
          const subactividad = (row as any).subactividad || 'Sin descripción subactividad';
          const agrupador = (row as any).agrupador || 'Sin cod_diag';
          const especialidad = (row as any).especialidad || 'Sin descripción especialidad';
          const fecha_prog = (row as any).fecha_prog || 'Sin fecha';
          const key = `${fecha_prog}||${dni_medico}||${servicio}||${subactividad}||${agrupador}||${especialidad}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              dni_medico,
              servicio,
              agrupador,
              especialidad,
              subactividad,
              fecha_prog,
              horas_efec_def: Number((row as any).horas_efec_def ?? 0),
            });
          } else {
            groupMap.get(key)!.horas_efec_def += Number((row as any).horas_efec_def ?? 0);
          }
        }

        this.newtableData = Array.from(groupMap.values());
        this.query0DataOriginal = this.newtableData;

        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
        if (this.viewReady) {
          setTimeout(() => this.buildAllCharts(), 150);
        }
        this.buildPivotTable();
        this.TotalHorasEfectivas();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos: ' + err.message;
        this.loading = false;
        console.error(err);
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

    const aggregatedAll = this.aggregateByLabel(data, labelFn, (d) =>
      Number((d as any).horas_efec_def ?? 0),
    );

    const aggregated = aggregatedAll
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    this.destroyChart(currentChart);

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
          name: 'Horas Efectivas',
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

  buildPivotTable(): void {
    if (!this.query0Data?.length) {
      this.pivotHeaders = [];
      this.pivotRows = [];
      this.pivotColumnTotals = {};
      this.pivotGrandTotal = 0;
      return;
    }
    // Determinar el campo de fecha disponible (prefiere `fecha_prog`) y
    // construir lista de fechas únicas ordenadas (de menor a mayor)
    const dateField = this.query0Data.some((r: any) => r.fecha_prog)
      ? 'fecha_prog'
      : 'fecha_atencion';
    const fechas = (
      Array.from(new Set(this.query0Data.map((r: any) => r[dateField] || 'Sin fecha'))) as string[]
    )
      .filter((f: string) => f && f !== 'Sin fecha')
      .sort((a, b) => this.parseDate(a) - this.parseDate(b));

    // Agrupar por médico y fecha (SUMAR `horas_efec_def`)
    const rowsMap = new Map<string, Record<string, number>>();
    for (const row of this.query0Data) {
      const dni = row.dni_medico || 'Sin DNI';
      const fecha = row[dateField] || 'Sin fecha';
      const horas = Number(row.horas_efec_def ?? 0) || 0;
      const bucket = rowsMap.get(dni) || {};
      bucket[fecha] = (bucket[fecha] || 0) + horas;
      rowsMap.set(dni, bucket);
    }

    // Construir filas con totales (suma de horas por fila)
    const pivotRows = Array.from(rowsMap.entries()).map(([dni, cells]) => {
      const total = fechas.reduce((sum, f) => sum + (cells[f] || 0), 0);
      return { dni_medico: dni, cells, total };
    });

    // Ordenar por total desc
    pivotRows.sort((a, b) => b.total - a.total);

    // Totales por columna (suma de horas) y total general
    const columnTotals: Record<string, number> = {};
    let grandTotal = 0;
    for (const fecha of fechas) {
      const colSum = pivotRows.reduce((sum, r) => sum + (r.cells[fecha] || 0), 0);
      columnTotals[fecha] = colSum;
      grandTotal += colSum;
    }

    this.pivotHeaders = fechas;
    this.pivotRows = pivotRows;
    this.pivotRowsFiltered = pivotRows;
    this.pivotColumnTotals = columnTotals;
    this.pivotColumnTotalsFiltered = columnTotals;
    this.pivotGrandTotal = grandTotal;
    this.pivotGrandTotalFiltered = grandTotal;

    // Inicializar filtros de columnas
    this.pivotFilters.columns = {};
    fechas.forEach((f) => (this.pivotFilters.columns[f] = ''));
  }

  getCellClass(value: number): string {
    if (!value || value === 0) return '';
    return 'cell-highlight';
  }

  trackByString(_index: number, item: string): string {
    return item;
  }

  trackByPivotRow(_index: number, row: PivotRow): string {
    return row.dni_medico;
  }

  filterPivotByDni(): void {
    this.applyAllPivotFilters();
  }

  filterPivotByTotal(): void {
    this.applyAllPivotFilters();
  }

  filterPivotByColumn(_fecha: string): void {
    this.applyAllPivotFilters();
  }

  private applyAllPivotFilters(): void {
    let filtered = [...this.pivotRows];

    const dniFilter = this.pivotFilters.dni_medico.trim().toLowerCase();
    if (dniFilter) {
      filtered = filtered.filter((row) => row.dni_medico.toLowerCase().includes(dniFilter));
    }

    const totalFilter = this.pivotFilters.total.trim().toLowerCase();
    if (totalFilter) {
      filtered = filtered.filter((row) => String(row.total).toLowerCase().includes(totalFilter));
    }

    for (const fecha of this.pivotHeaders) {
      const colFilter = (this.pivotFilters.columns[fecha] || '').trim().toLowerCase();
      if (colFilter) {
        filtered = filtered.filter((row) =>
          String(row.cells[fecha] || 0)
            .toLowerCase()
            .includes(colFilter),
        );
      }
    }

    this.pivotRowsFiltered = filtered;
    this.recalculatePivotTotals();
  }

  private recalculatePivotTotals(): void {
    // Recalcular totales por columna basados en las filas filtradas
    const columnTotals: Record<string, number> = {};
    let grandTotal = 0;

    for (const fecha of this.pivotHeaders) {
      const colSum = this.pivotRowsFiltered.reduce((sum, r) => sum + (r.cells[fecha] || 0), 0);
      columnTotals[fecha] = colSum;
      grandTotal += colSum;
    }

    this.pivotColumnTotalsFiltered = columnTotals;
    this.pivotGrandTotalFiltered = grandTotal;
  }

  private parseDate(fecha: string): number {
    const ts = Date.parse(fecha);
    return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
  }

  totalHorasEfectivas: number = 0;

  TotalHorasEfectivas(): void {
    const data = this.newtableData || [];
    this.totalHorasEfectivas = data.reduce(
      (sum: number, row: any) => sum + Number(row.horas_efec_def ?? 0),
      0,
    );
  }

  setActiveTab(tab: 'produccion' | 'diagnosticos' | 'noconsiderados'): void {
    this.activeTab = tab;
    // Reconstruir los gráficos al cambiar de pestaña
    this.cdr.detectChanges();
    setTimeout(() => {
      if (tab === 'produccion') {
        this.buildBarServicioChart();
        this.buildBarSubactividadChart();
        this.buildBarAgrupadorChart();
        this.buildBarEspecialidadChart();
      } else if (tab === 'diagnosticos') {
        // Construir gráficos para la pestaña de diagnósticos
      }
    }, 100);
  }

  //Filtrar datos de la tabla por columna

  filterData(column: keyof typeof this.filters, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filters[column] = filterValue;

    // Filtrar los datos originales
    const filtered = this.query0DataOriginal.filter((row) => {
      return this.applyAllFilters(row);
    });

    // Actualizar los datos mostrados
    this.newtableData = filtered;
    this.TotalHorasEfectivas();
  }

  /**
   * Aplicar todos los filtros activos a una fila
   */
  private applyAllFilters(row: any): boolean {
    // Filtro DNI
    if (this.filters.dni && !String(row.dni_medico).toLowerCase().includes(this.filters.dni)) {
      return false;
    }

    // Filtro Servicio
    if (this.filters.servicio && !row.servicio.toLowerCase().includes(this.filters.servicio)) {
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

    // Filtro Subactividad
    if (
      this.filters.subactividad &&
      !row.subactividad.toLowerCase().includes(this.filters.subactividad)
    ) {
      return false;
    }

    // Filtro Fecha
    if (this.filters.fecha && !String(row.fecha_prog).toLowerCase().includes(this.filters.fecha)) {
      return false;
    }

    // Filtro Horas
    if (
      this.filters.horas &&
      !String(row.horas_efec_def).toLowerCase().includes(this.filters.horas)
    ) {
      return false;
    }

    return true;
  }

  downloadCSV(): void {
    const data = this.query0Data || [];
    this.downloadTableCSV(
      data,
      'am_total_horas_efectivas_' + this.periodo + '_' + this.nameCentro + '.csv',
    );
  }

  downloadTableCSV(data: any[], fileName: string): void {
    if (!data || data.length === 0) {
      console.warn('No hay datos para descargar');
      return;
    }

    const headers = Object.keys(data[0]);

    let csv = headers.join(';') + '\n';

    for (const row of data) {
      csv += headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';') + '\n';
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
