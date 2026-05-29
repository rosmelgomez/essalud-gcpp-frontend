import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage-service';
import { HospitalizacionService } from '../../../services/reportes/hospitalizacion-service';
import { ApexOptions } from 'apexcharts';
import ApexCharts from 'apexcharts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-dashboard-hospitalizacion',
  imports: [CommonModule, FormsModule],
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
  totalPacientesDia: number = 0;


  //Datos para egresos
  dataEgresos: any[] = [];


  chartDiagnosticos: ApexCharts | null = null;
  chartFechaAten: ApexCharts | null = null;

  //Graficos
  @ViewChild('chartDiagnosticos') chartDiagnosticosEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartFechaAten') chartFechaAtenEl!: ElementRef<HTMLDivElement>;


  constructor(
    private hospservice: HospitalizacionService,
    private lsService: LocalStorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentDate = this.formatDate(new Date());
    this.centroAtencion = this.lsService.getDataCentro()?.nameCentro || '';
    this.codcas = this.lsService.getDataCentro()?.codcas || '';
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }


  loadDataEgresos(): void {
    if (!this.anioE || !this.periodoE || !this.tipo_aseguradoE) {
      this.selectPeriodoE = true;
      return;
    }

    this.loadingE = true;
    this.errorE = null;
    this.noDataE = false;

    this.hospservice.getqueryDHE(this.anioE, this.periodoE, this.codcas, this.tipo_aseguradoE).subscribe({
      next: (data) => {
        this.dataEgresos = data;

        this.totalEgresos = data.length;
        this.totalDiasEstancia = data.reduce((sum, item) => sum + item.dias_hospit, 0);
        this.totalPacientesDia = data.reduce((sum, item) => sum + item.dias_hospit, 0);

        console.log("Total Egresos:", this.totalEgresos);
        console.log("Total Dias Estancia:", this.totalDiasEstancia);
        console.log("Total Pacientes Dia:", this.totalPacientesDia);






        this.loadingE = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorE = 'Error al cargar los datos: ' + err.message;
        this.loadingE = false;
        this.cdr.detectChanges();
      },
    });




  }

  private buildBarFechaAtenChart(): void {
    const container = this.chartFechaAtenEl?.nativeElement;
    if (!container) {
      return;
    }

    const aggregated = this.aggregateByLabel(this.dataEgresos, (row) => row.fecha_aten).sort(
      (a, b) => a.label.localeCompare(b.label),
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
    this.cdr.detectChanges();
  }





}
