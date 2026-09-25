import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { HospitalizacionService } from '../../../services/reportes/hospitalizacion-service';
import { ApexOptions } from 'apexcharts';
import ApexCharts from 'apexcharts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';


@Component({
  selector: 'app-dashboard-hospitalizacion',
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
  templateUrl: './dashboard-hospitalizacion.html',
  styleUrl: './dashboard-hospitalizacion.css',
})
export class DashboardHospitalizacion {

  currentDate: string = '';
  centroAtencion: string = '';
  codcas: string = '';


  // Estados para Egresos
  loadingE: boolean = false;
  errorE: string | null = null;
  noDataE: boolean = false;
  selectPeriodoE: boolean = true;


  //filtros para Egresos
  periodoE: string = '';
  anioE: string = '';
  tipo_aseguradoE: string = '';



  /// Indicadores para egresos
  totalEgresos: number = 0;
  totalDiasEstancia: number = 0;
  totalPacientesMes: number = 0;


  //Datos para egresos
  dataEgresos: any[] = [];
  dataPacientesMes: any[] = [];

  chartPacientesMes: ApexCharts | null = null;
  chartDiagnosticos: ApexCharts | null = null;
  chartServicio: ApexCharts | null = null;
  chartCapitulo: ApexCharts | null = null;
  chartFechaAten: ApexCharts | null = null;

  //Graficos
  @ViewChild('chartPacientesMes') chartPacientesMesEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartDiagnosticos') chartDiagnosticosEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartServicio') chartServicioEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartCapitulo') chartCapituloEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartFechaAten') chartFechaAtenEl!: ElementRef<HTMLDivElement>;


  constructor(
    private hospservice: HospitalizacionService,
    private lsService: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService,
  ) {
    this.loadFechaActualizacion();
    this.centroAtencion = this.lsService.getDataCentro()?.nameCentro || '';
    this.codcas = this.lsService.getDataCentro()?.codcas || '';
  }

  loadFechaActualizacion() {
    this.fechaService.queryFechaActualizacion().subscribe({
      next: (data) => {
        this.currentDate = data.fecha_act;
      },
      error: (error) => {
        console.error('Error al cargar la fecha de actualizacion', error);
      }
    });
  }


  loadDataEgresos(): void {
    if (!this.anioE || !this.periodoE || !this.tipo_aseguradoE) {
      this.selectPeriodoE = true;
      return;
    }

    this.loadingE = true;
    this.errorE = null;
    this.noDataE = false;
    // Al mostrar "Cargando" se retiran del DOM los contenedores: las instancias previas ya no sirven
    this.destroyAllCharts();


    forkJoin({
      egresos: this.hospservice.getQueryDHE(this.anioE, this.periodoE, this.codcas, this.tipo_aseguradoE),
      pacientesMes: this.hospservice.getQueryDHPM(this.anioE, this.periodoE, this.codcas),
    }).subscribe({
      next: (data) => {
        this.dataEgresos = data.egresos;
        this.dataPacientesMes = data.pacientesMes;
        this.totalEgresos = data.egresos.length;
        this.totalDiasEstancia = data.egresos.length
          ? data.egresos.reduce((sum, item) => sum + Number(item.dias_hospit), 0) / data.egresos.length
          : 0;
        this.totalPacientesMes = data.pacientesMes.reduce((sum, item) => sum + Number(item.pacientes_hospitalizados), 0)

        this.selectPeriodoE = false;
        this.loadingE = false;

        // Primero se pinta la vista: los contenedores de los gráficos están dentro de un *ngIf
        // que depende de loadingE/selectPeriodoE y no existen hasta este detectChanges.
        this.cdr.detectChanges();
        this.buildAllCharts();
      },
      error: (err) => {
        this.errorE = 'Error al cargar los datos: ' + err.message;
        this.loadingE = false;
        this.cdr.detectChanges();
      },
    })
  }

  private buildBarFechaAtenChart(): void {
    const container = this.chartPacientesMesEl?.nativeElement;
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByDate(this.dataPacientesMes);

    this.destroyChart(this.chartPacientesMes);

    if (!aggregated.length) {
      return;
    }

    const total_pacientes = aggregated.reduce((sum, item) => sum + item.total, 0);
    const options = this.createVerticalBarOptions(
      aggregated.map((item) => item.label),
      aggregated.map((item) => item.total),
      total_pacientes,
      this.buildGradientColors(aggregated.length),
    );

    this.renderApexChart(container, options, (chart) => {
      this.chartPacientesMes = chart;
    });
  }

  private aggregateByDate(
    data: any[] = [],
  ): { label: string; rawDate: string; total: number }[] {
    const totals = new Map<string, { rawDate: string; label: string; total: number }>();

    data.forEach((item) => {
      if (!item) return;
      const rawDateStr = item.fecha ? String(item.fecha).trim() : '';
      const datePart = rawDateStr.split('T')[0];

      let formattedLabel = datePart;
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        formattedLabel = `${day}/${month}/${year}`;
      }

      const labelKey = datePart || 'Sin dato';
      const val = Number(item.pacientes_hospitalizados ?? item.total ?? item.cant ?? 0);

      if (totals.has(labelKey)) {
        totals.get(labelKey)!.total += val;
      } else {
        totals.set(labelKey, {
          rawDate: datePart,
          label: formattedLabel || 'Sin dato',
          total: val,
        });
      }
    });

    return Array.from(totals.values()).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }

  private buildBarDiagnosticosChart(): void {
    this.renderTopHorizontalBarChart(
      this.dataEgresos,
      (row) => row.diagdes,
      this.chartDiagnosticosEl?.nativeElement,
      this.chartDiagnosticos,
      (chart) => {
        this.chartDiagnosticos = chart;
      },
    );
  }

  private buildBarServicioChart(): void {
    this.renderTopHorizontalBarChart(
      this.dataEgresos,
      (row) => row.servicio,
      this.chartServicioEl?.nativeElement,
      this.chartServicio,
      (chart) => {
        this.chartServicio = chart;
      },
    );
  }

  private buildBarCapituloChart(): void {
    this.renderTopHorizontalBarChart(
      this.dataEgresos,
      (row) => row.capitulo,
      this.chartCapituloEl?.nativeElement,
      this.chartCapitulo,
      (chart) => {
        this.chartCapitulo = chart;
      },
    );
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

  private destroyChart(chart: ApexCharts | null): void {
    if (chart) {
      chart.destroy();
    }
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
          name: 'Pacientes Hospitalizados',
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

  private buildGradientColors(count: number): string[] {
    if (!count) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => {
      const gradient = index / count;
      return `rgba(0, 100, 175, ${0.6 + gradient * 0.4})`;
    });
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



  getTableHeight(count?: number, itemSize: number = 48, maxHeight: number = 420): number {
    if (!count || count === 0) return itemSize;
    return Math.min(maxHeight, count * itemSize + 4);
  }


  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Egresos Hospitalarios'
    = 'Egresos Hospitalarios';

  setActiveTab(
    tab:
      | 'Egresos Hospitalarios'
  ): void {
    this.activeTab = tab;
    this.destroyAllCharts();
    this.cdr.detectChanges();
    this.buildAllCharts();
  }

  private buildAllCharts(): void {
    this.buildBarFechaAtenChart();
    this.buildBarDiagnosticosChart();
    this.buildBarServicioChart();
    this.buildBarCapituloChart();
  }

  private destroyAllCharts(): void {
    this.destroyChart(this.chartPacientesMes);
    this.destroyChart(this.chartDiagnosticos);
    this.destroyChart(this.chartServicio);
    this.destroyChart(this.chartCapitulo);
    this.chartPacientesMes = null;
    this.chartDiagnosticos = null;
    this.chartServicio = null;
    this.chartCapitulo = null;
  }





}
