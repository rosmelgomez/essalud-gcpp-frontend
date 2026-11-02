import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { MatCardModule } from '@angular/material/card';
import { MedicasService } from '../../../../../../services/reportes/medicas-service';
import { LocalStorageService } from '../../../../../../services/local-storage-service';

// Configuración centralizada de estilos
const STYLE_CONFIG = {
  BRAND: '#0064AF',
  FONT_FAMILY: 'Inter, Segoe UI, Calibri, sans-serif',
} as const;

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
  selector: 'app-dm-total-medicos-mc',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    ScrollingModule,
  ],
  templateUrl: './dm-total-medicos-mc.html',
  styleUrl: '../../estilos-dashboard-medica-3.css',
})
export class DmTotalMedicosMc implements OnInit, AfterViewInit, OnDestroy {
  periodo: string = '';
  nameCentro: string = '';


  loading: boolean = false;
  error: string | null = null;
  dniMedicoFiltro: string = '';

  viewReady: boolean = false;

  // Data consultas
  query0Data: MedicoRow[] = [];  // Datos para el gráfico y tabla
  query0DataOriginal: MedicoRow[] = [];

  // Datos para pivote (heatmap tipo tabla dinámica)
  query1Data: any[] = [];
  query2DataCSV: any[] = [];

  pivotHeaders: string[] = []; // fechas
  pivotRows: Array<{ dni_medico: string; cells: Record<string, number>; total: number }> = [];
  pivotRowsFiltered: Array<{ dni_medico: string; cells: Record<string, number>; total: number }> = [];
  pivotColumnTotals: Record<string, number> = {};
  pivotColumnTotalsFiltered: Record<string, number> = {};
  pivotGrandTotal = 0;
  pivotGrandTotalFiltered = 0;
  pivotFilters = {
    dni_medico: '',
    total: '' as string,
    columns: {} as Record<string, string>,
  };

  chartMedicos: ApexCharts | null = null;
  tableRows: MedicoRow[] = [];
  tableTotal: number = 0;

  filters = {
    dni_medico: '',
    fecha_atencion: '',
    descripcion_servicio: '',
    atenciones: '',
  };

  @ViewChild('tmLineChart') tmLineChartEl!: ElementRef<HTMLDivElement>;

  constructor(
    private reportDashboardMedicasService: MedicasService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
  }


  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.query0Data?.length) {
      this.buildMedicosChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  onDniMedicoFiltroChange(): void {
    this.buildMedicosChart();
  }


  private loadData(): void {
    const { nameCentro, codcas } = this.dataImport.getDataCentro();
    const { anio, periodo, codasegu } = this.dataImport.getDataDMMC();

    this.nameCentro = nameCentro || 'Centro no definido';
    this.periodo = `${anio}-${periodo}`;

    if (!anio || !periodo || !codcas || !codasegu) {
      this.error = 'Parámetros incompletos para cargar datos';
      return;
    }

    this.loading = true;
    this.error = null;

    forkJoin({
      q0: this.reportDashboardMedicasService.getQuery0DMMCTM(anio, periodo, codcas, codasegu),
      q1: this.reportDashboardMedicasService.getQuery1DMMCTM(anio, periodo, codcas, codasegu),
      q2: this.reportDashboardMedicasService.getQuery2DMMCTMCSV(anio, periodo, codcas, codasegu),
    })
      .subscribe({
        next: ({ q0, q1, q2 }) => {
          this.query0Data = q0 as MedicoRow[];
          this.query1Data = q1 as any[];
          this.query2DataCSV = q2 as any[];
          this.buildMedicosTable();
          this.buildPivotTable();
          this.loading = false;
          this.cdr.detectChanges();
          if (this.viewReady) {
            this.buildMedicosChart();
          }
        },
        error: (err) => {
          this.error = 'Error al cargar datos';
          this.loading = false;
          console.error(err);
        },
      });
  }

  private buildMedicosChart(): void {
    if (!this.query0Data?.length) {
      this.destroyChart();
      return;
    }

    const dniFiltro = this.dniMedicoFiltro?.trim();
    const filteredData = dniFiltro
      ? this.query0Data.filter((r) => r.dni_medico === dniFiltro)
      : this.query0Data;

    const { labels, data } = this.aggregateByDate(filteredData);
    if (!labels.length) {
      this.destroyChart();
      return;
    }

    this.destroyChart();

    const container = this.tmLineChartEl?.nativeElement;
    if (!container) {
      return;
    }

    const title = `Tendencia de atenciones - Período ${this.periodo}${dniFiltro ? ` (Médico: ${dniFiltro})` : ''}`;

    const options = this.buildChartOptions(title, labels, data);
    this.renderApexChart(container, options, (chart) => {
      this.chartMedicos = chart;
    });
  }

  private buildChartOptions(title: string, labels: string[], data: number[]): ApexOptions {
    return {
      chart: {
        type: 'line',
        height: '100%',
        toolbar: { show: true },
      },
      series: [
        {
          name: 'Atenciones',
          data,
        },
      ],
      title: {
        text: title,
        style: {
          color: STYLE_CONFIG.BRAND,
          fontFamily: STYLE_CONFIG.FONT_FAMILY,
          fontSize: '16px',
          fontWeight: '600',
        },
      },
      stroke: {
        curve: 'smooth',
        width: 2.5,
      },
      markers: {
        size: 3,
        hover: { size: 6 },
      },
      colors: [STYLE_CONFIG.BRAND],
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: labels,
        title: {
          text: 'Fecha',
          style: {
            color: '#475569',
            fontFamily: STYLE_CONFIG.FONT_FAMILY,
          },
        },
        labels: {
          rotate: -45,
          style: {
            fontFamily: STYLE_CONFIG.FONT_FAMILY,
          },
        },
      },
      yaxis: {
        title: {
          text: 'Atenciones',
          style: {
            color: '#1F2937',
            fontFamily: STYLE_CONFIG.FONT_FAMILY,
          },
        },
        labels: {
          formatter: (val) => Math.round(val).toLocaleString(),
          style: {
            fontFamily: STYLE_CONFIG.FONT_FAMILY,
          },
        },
      },
      grid: {
        borderColor: 'rgba(10,76,140,0.08)',
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => Math.round(Number(val)).toLocaleString(),
        },
      },
    };
  }

  private aggregateByDate(data: MedicoRow[]): { labels: string[]; data: number[] } {
    const grouped = new Map<string, number>();
    for (const row of data) {
      const fecha = row.fecha_atencion || 'Sin fecha';
      grouped.set(fecha, (grouped.get(fecha) || 0) + 1);
    }

    const labels = Array.from(grouped.keys()).sort((a, b) => this.parseDate(a) - this.parseDate(b));
    return { labels, data: labels.map((f) => grouped.get(f) || 0) };
  }

  // Construye una tabla pivote: filas = dni_medico, columnas = fecha_atencion, valor = conteo
  buildPivotTable(): void {
    if (!this.query0Data?.length) {
      this.pivotHeaders = [];
      this.pivotRows = [];
      this.pivotColumnTotals = {};
      this.pivotGrandTotal = 0;
      return;
    }

    // Fechas únicas ordenadas (de menor a mayor)
    const fechas = Array.from(
      new Set(this.query0Data.map((r) => r.fecha_atencion || 'Sin fecha'))
    ).filter(f => f !== 'Sin fecha').sort((a, b) => this.parseDate(a) - this.parseDate(b));

    // Agrupar por médico y fecha (conteo)
    const rowsMap = new Map<string, Record<string, number>>();
    for (const row of this.query0Data) {
      const dni = row.dni_medico || 'Sin DNI';
      const fecha = row.fecha_atencion || 'Sin fecha';
      const bucket = rowsMap.get(dni) || {};
      bucket[fecha] = (bucket[fecha] || 0) + 1;
      rowsMap.set(dni, bucket);
    }

    // Construir filas con totales
    const pivotRows = Array.from(rowsMap.entries()).map(([dni, cells]) => {
      const total = fechas.reduce((sum, f) => sum + (cells[f] || 0), 0);
      return { dni_medico: dni, cells, total };
    });

    // Ordenar por total desc
    pivotRows.sort((a, b) => b.total - a.total);

    // Totales por columna y general
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
    fechas.forEach(f => this.pivotFilters.columns[f] = '');
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

  trackByTableRow(_index: number, row: MedicoRow): string {
    return `${row.dni_medico}-${row.fecha_atencion}-${row.descripcion_servicio}`;
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
      filtered = filtered.filter(row => row.dni_medico.toLowerCase().includes(dniFilter));
    }

    const totalFilter = this.pivotFilters.total.trim().toLowerCase();
    if (totalFilter) {
      filtered = filtered.filter(row => String(row.total).toLowerCase().includes(totalFilter));
    }

    for (const fecha of this.pivotHeaders) {
      const colFilter = (this.pivotFilters.columns[fecha] || '').trim().toLowerCase();
      if (colFilter) {
        filtered = filtered.filter(row => String(row.cells[fecha] || 0).toLowerCase().includes(colFilter));
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

  private destroyChart(): void {
    if (this.chartMedicos) {
      this.chartMedicos.destroy();
      this.chartMedicos = null;
    }
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

  private buildMedicosTable(): void {
    const groupMap = new Map<string, MedicoRow>();

    for (const row of this.query0Data) {
      const key = `${row.descripcion_servicio || 'Sin servicio'}||${row.dni_medico || 'Sin DNI'}||${row.fecha_atencion}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          descripcion_servicio: row.descripcion_servicio || 'Sin servicio',
          dni_medico: row.dni_medico || 'Sin DNI',
          fecha_atencion: row.fecha_atencion,
          atenciones: 1,
        });
      } else {
        groupMap.get(key)!.atenciones += 1;
      }
    }

    this.tableRows = Array.from(groupMap.values()).sort((a, b) => b.atenciones - a.atenciones);
    this.query0DataOriginal = Array.from(groupMap.values()).sort((a, b) => b.atenciones - a.atenciones);
    this.tableTotal = this.tableRows.reduce((sum, r) => sum + r.atenciones, 0);
  }

  /// Filtrar datos de la tabla por columna
  filterData(column: keyof typeof this.filters, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filters[column] = filterValue;

    // Filtrar los datos originales
    const filtered = this.query0DataOriginal.filter(row => {
      return this.applyAllFilters(row);
    });

    // Actualizar los datos mostrados
    this.tableRows = filtered;
    this.tableTotal = this.tableRows.reduce((sum, r) => sum + r.atenciones, 0);
  }

  ///Aplicar todos los filtros activos a una fila
  private applyAllFilters(row: any): boolean {
    // Filtro DNI
    if (this.filters.dni_medico && !String(row.dni_medico).toLowerCase().includes(this.filters.dni_medico)) {
      return false;
    }

    // Filtro fecha_atencion
    if (this.filters.fecha_atencion && !String(row.fecha_atencion).toLowerCase().includes(this.filters.fecha_atencion)) {
      return false;
    }

    // Filtro descripcion_servicio
    if (this.filters.descripcion_servicio && !row.descripcion_servicio.toLowerCase().includes(this.filters.descripcion_servicio)) {
      return false;
    }
    // Filtro Atenciones
    if (this.filters.atenciones && !String(row.atenciones).toLowerCase().includes(this.filters.atenciones)) {
      return false;
    }

    return true;
  }

  activeTab: 'Produccion' = 'Produccion';
  setActiveTab(tab: 'Produccion'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
    // Diferir la construcción de gráficos para permitir que el DOM se actualice
    requestAnimationFrame(() => {
      this.buildMedicosChart();
      this.buildMedicosTable();
    });
  }

  downloadCSV(): void {
    if (!this.query2DataCSV?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `dm_mc_total_medicos_${this.periodo}_${this.nameCentro}.csv`;

    const headers = Object.keys(this.query2DataCSV[0]);
    const csvContent = [
      headers.join(';'),
      ...this.query2DataCSV.map((row) =>
        headers.map((h) => `="${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'),
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
