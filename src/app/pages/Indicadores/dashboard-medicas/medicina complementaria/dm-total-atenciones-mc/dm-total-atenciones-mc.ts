import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {MatSort} from '@angular/material/sort';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { LocalStorageService } from '../../../../../services/local-storage-service';
import { ReportDashboardMedicasService } from '../../../../../services/report-dashboard-medicas-service';

@Component({
  selector: 'app-dm-total-atenciones-mc',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    ScrollingModule,
  ],
  templateUrl: './dm-total-atenciones-mc.html',
  styleUrl: './dm-total-atenciones-mc.css',
})
export class DmTotalAtencionesMc implements OnInit, OnDestroy {
  nameCentro: string = '';

  loading: boolean = false;
  error: string | null = null;

  periodo: string = '';

  // Datos de consultas

  query0DATA: any[] = []; // servicio - subactividad
  query1DATA: any[] = []; // agrupador - especialidades
  query2DATA: any[] = []; // registros no considerados
  query3DATA: any[] = []; // sexo grupo etario
  query4DATA: any[] = []; // diagnósticos - csv

  dataCSV: any[] = [];

  newtableQ4CountMap: any[] = [];

  ///DATA FILTRO
  query4TotalAtencionesFilter: any[] = [];
  query2TotalAtencionesFilter: any[] = [];

  // Filtros
  filters = {
    cod_servicio: '',
    cod_especialidad: '',
    cenasides: '',
    actividad: '',
    agrupador: '',
    subactividad: '',
    cod_tipo_consulta: '',
    cod_diag: '',
    descripcion_diagnostico: '',
    descripcion_servicio: '',
    descripcion_especialidad: '',
    descripcion_tipo_consulta: '',
    dni_medico: '',
    doc_paciente: '',
    anio_edad: '',
    cod_tipdoc_paciente: '',
    sexo: '',
    fecha_atencion: '',
    acto_med: '',
    total_atenciones: '',
  };

  filtersQuery2 = {
    servicio2: '',
    actividad2: '',
    subactividad2: '',
    tipo_consulta2: '',
    coddiag2: '',
    diagnostico2: '',
    dni_medico2: '',
    acto_med2: '',
    sexo2: '',
    fecha_atencion2: '',
    desc_cl2: '',
  };

  // Gráficos
  chartServicio: ApexCharts | null = null;
  chartSubactividad: ApexCharts | null = null;
  chartEspecialidad: ApexCharts | null = null;
  chartAgrupador: ApexCharts | null = null;
  chartTornado: ApexCharts | null = null;
  chartDiagnostico: ApexCharts | null = null;

  activeTab: 'produccion' | 'diagnosticos' | 'noconsiderados' = 'produccion';

  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild('chartServicio') chartServicioEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartSubactividad') chartSubactividadEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartEspecialidad') chartEspecialidadEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartAgrupador') chartAgrupadorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartTornado') chartTornadoEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chartDiagnostico') chartDiagnosticoEl!: ElementRef<HTMLDivElement>;
  constructor(
    private reporterDashboardMedicasService: ReportDashboardMedicasService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  loadAllData(): void {
    const { nameCentro, codcas } = this.dataImport.getDataCentro();
    const { anio, periodo, codasegu } = this.dataImport.getDataDMMC();

    this.nameCentro = nameCentro || '';
    this.periodo = `${anio}-${periodo}`;

    if (!codcas || !periodo || !anio || !codasegu) {
      this.error = 'Código CAS, período, año o código de aseguradora no proporcionado.';
      return;
    }
    this.loading = true;
    this.error = null;

    forkJoin({
        q0: this.reporterDashboardMedicasService.getQuery0DMMCTASS(anio, periodo, codcas, codasegu),
        q1: this.reporterDashboardMedicasService.getQuery1DMMCTAAE(anio, periodo, codcas, codasegu),
        q2: this.reporterDashboardMedicasService.getQuery2DMMCTANC(anio, periodo, codcas, codasegu),
        q3: this.reporterDashboardMedicasService.getQuery3DMMCTASGEA(anio, periodo, codcas, codasegu),
        q4: this.reporterDashboardMedicasService.getQuery4DMMCTACSV(anio, periodo, codcas, codasegu),
    }).subscribe({
      next: ({ q0, q1, q2, q3, q4 }) => {
        // Asignar datos a las variables correspondientes
        this.query4TotalAtencionesFilter = q4;
        this.query2TotalAtencionesFilter = q2;

        // Guardar datos para consultas con any
        this.query0DATA = q0;
        this.query1DATA = q1;
        this.query2DATA = q2;
        this.query3DATA = q3;
        this.query4DATA = q4;

        this.dataCSV = q4;

        // Construir tabla agrupada por descripcion_servicio, subactividad, sexo, cod_diag, descripcion_diagnostico
        const groupMap = new Map<
          string,
          {
            descripcion_servicio: string;
            subactividad: string;
            sexo: string;
            cod_diag: string;
            descripcion_diagnostico: string;
            total_atenciones: number;
          }
        >();

        for (const row of q4) {
          const descripcion_servicio = (row as any).descripcion_servicio || 'Sin descripción';
          const subactividad = (row as any).subactividad || 'Sin subactividad';
          const sexo = (row as any).sexo || 'Sin sexo';
          const cod_diag = (row as any).cod_diag || 'Sin cod_diag';
          const descripcion_diagnostico =
            (row as any).descripcion_diagnostico || 'Sin descripción diagnóstico';
          const key = `${descripcion_servicio}||${subactividad}||${sexo}||${cod_diag}||${descripcion_diagnostico}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              descripcion_servicio,
              subactividad,
              sexo,
              cod_diag,
              descripcion_diagnostico,
              total_atenciones: 1,
            });
          } else {
            groupMap.get(key)!.total_atenciones += 1;
          }
        }

        this.newtableQ4CountMap = Array.from(groupMap.values());
        this.calculateTotalAtencionesQ4();

        // Asignar datos a las variables correspondientes
        this.query4TotalAtencionesFilter = this.newtableQ4CountMap;

        // Desactivar loading inmediatamente después de obtener los datos
        this.loading = false;
        this.cdr.detectChanges();

        // Construir gráficos de forma inmediata sin delay adicional
        this.buildChartsForActiveTab();
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de atenciones.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  buildCharts(): void {
    this.buildBarServicioChart();
    this.buildBarSubactividadChart();
    this.buildBarEspecialidadChart();
    this.buildBarAgrupadorChart();
    this.buildGroupAgeChart();
  }

  buildChartsForActiveTab(): void {
    if (this.activeTab === 'produccion') {
      this.buildCharts();
    } else if (this.activeTab === 'diagnosticos') {
      this.buildDiagnosticoChart();
    }
  }

  buildBarServicioChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query0DATA,
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
        this.query0DATA,
        (d) => d.descripcion_subactividad,
        this.chartSubactividadEl?.nativeElement,
        this.chartSubactividad,
        (chart) => {
          this.chartSubactividad = chart;
        },
      );
    }, 100);
  }

  buildBarEspecialidadChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query1DATA,
        (d) => d.descripcion_especialidad,
        this.chartEspecialidadEl?.nativeElement,
        this.chartEspecialidad,
        (chart) => {
          this.chartEspecialidad = chart;
        },
      );
    }, 100);
  }

  buildBarAgrupadorChart(): void {
    setTimeout(() => {
      this.renderTopBarChart(
        this.query1DATA,
        (d) => d.agrupador,
        this.chartAgrupadorEl?.nativeElement,
        this.chartAgrupador,
        (chart) => {
          this.chartAgrupador = chart;
        },
      );
    }, 100);
  }

  buildGroupAgeChart(): void {
    setTimeout(() => {
      // Agrupar datos por grupo_etario y sexo
      const grouped = this.aggregateByLabelAndSex(
        this.query3DATA,
        (d) => d.grupo_etario,
        (d) => d.sexo,
        (d) => d.atenciones ?? 1,
      );

      // Ordenar por grupo etario (extraer el número inicial)
      const sortedGrouped = grouped.sort((a, b) => {
        const numA = parseInt(a.label.match(/^\s*(\d+)/)?.[1] || '999');
        const numB = parseInt(b.label.match(/^\s*(\d+)/)?.[1] || '999');
        return numA - numB;
      });

      const container = this.chartTornadoEl?.nativeElement;

      if (container) {
        this.destroyChart(this.chartTornado);

        const grandTotal = sortedGrouped.reduce((sum, d) => sum + d.masculino + d.femenino, 0);
        const maxValue = Math.max(0, ...sortedGrouped.flatMap((d) => [d.masculino, d.femenino]));

        const formatAbs = (value: number) => Math.round(Math.abs(value)).toLocaleString();
        const formatAbsPct = (value: number) => {
          const absValue = Math.abs(value);
          const percentage = grandTotal ? ((absValue / grandTotal) * 100).toFixed(1) : '0.0';
          return `${absValue.toLocaleString()} (${percentage}%)`;
        };

        const axisRange = maxValue > 0 ? { min: -maxValue, max: maxValue } : {};

        const options: ApexOptions = {
          chart: {
            type: 'bar',
            height: Math.max(container.clientHeight, 350),
            parentHeightOffset: 0,
            stacked: true,
            toolbar: { show: false },
          },
          series: [
            {
              name: 'Masculino',
              data: sortedGrouped.map((d) => -d.masculino),
            },
            {
              name: 'Femenino',
              data: sortedGrouped.map((d) => d.femenino),
            },
          ],
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: '70%',
            },
          },
          dataLabels: {
            enabled: true,
            formatter: (val) => formatAbsPct(Number(val)),
            style: {
              fontSize: '9px',
              fontWeight: 700,
              colors: ['#1f2937'],
            },
          },
          colors: ['#4C78A8', '#B82753'],
          xaxis: {
            categories: sortedGrouped.map((d) => d.label),
            ...axisRange,
            labels: {
              formatter: (val) => formatAbs(Number(val)),
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
            borderColor: 'rgba(10, 76, 140, 0.08)',
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
            padding: {
              top: 8,
              right: 20,
              bottom: 12,
              left: 8,
            },
          },
          legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
            fontSize: '11px',
            itemMargin: {
              horizontal: 12,
              vertical: 4,
            },
            formatter: (seriesName, opts) => {
              if (!opts) {
                return seriesName;
              }
              const values = (opts.w.globals.series[opts.seriesIndex] as number[]) ?? [];
              const totalSerie = values.reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0);
              return `${seriesName} (${Math.round(totalSerie).toLocaleString()})`;
            },
            onItemClick: {
              toggleDataSeries: false,
            },
            onItemHover: {
              highlightDataSeries: false,
            },
          },
          responsive: [
            {
              breakpoint: 768,
              options: {
                legend: {
                  position: 'bottom',
                  horizontalAlign: 'center',
                },
              },
            },
          ],
          tooltip: {
            shared: true,
            intersect: false,
            y: {
              formatter: (val) => formatAbsPct(Number(val)),
            },
          },
          noData: {
            text: 'Sin datos',
          },
        };

        this.renderApexChart(container, options, (chart) => {
          this.chartTornado = chart;
        });
      }
    }, 100);
  }

  buildDiagnosticoChart(): void {
    setTimeout(() => {
      // Obtener top 10 diagnósticos por total de atenciones
      const diagAgg = this.aggregateByLabel(this.query1DATA, (d) => d.cod_diag ?? 'Sin cod');

      // Top 10 diagnósticos
      const topDiagCodes = diagAgg
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map((d) => d.label);

      // Filtrar datos para solo top 10
      const topDiagData = this.query1DATA.filter((d) =>
        topDiagCodes.includes((d.cod_diag ?? 'Sin cod').toString()),
      );

      // Agrupar por código diagnóstico y sexo
      const diagBySex = this.aggregateByLabelAndSex(
        topDiagData,
        (d) => d.cod_diag ?? 'Sin cod',
        (d) => d.sexo,
      );

      // Crear mapa de descripción diagnóstica
      const descMap = new Map<string, string>();
      this.query1DATA.forEach((d) => {
        const cod = (d.cod_diag ?? 'Sin cod').toString();
        if (d.descripcion_diagnostico && !descMap.has(cod)) {
          descMap.set(cod, d.descripcion_diagnostico);
        }
      });

      // Ordenar por total descendente
      const orderY = diagAgg
        .filter((d) => topDiagCodes.includes(d.label))
        .sort((a, b) => b.total - a.total)
        .map((d) => d.label);

      const container = this.chartDiagnosticoEl?.nativeElement;

      if (container && diagBySex.length) {
        this.destroyChart(this.chartDiagnostico);

        const grandTotal = diagBySex.reduce((sum, d) => sum + d.masculino + d.femenino, 0);
        const formatPct = (value: number) => {
          const percentage = grandTotal ? ((value / grandTotal) * 100).toFixed(1) : '0.0';
          return `${value.toLocaleString()} (${percentage}%)`;
        };

        const seriesData = [
          {
            name: 'Masculino',
            data: orderY.map((cod) => {
              const item = diagBySex.find((d) => d.label === cod);
              return item ? item.masculino : 0;
            }),
          },
          {
            name: 'Femenino',
            data: orderY.map((cod) => {
              const item = diagBySex.find((d) => d.label === cod);
              return item ? item.femenino : 0;
            }),
          },
        ];

        const options: ApexOptions = {
          chart: {
            type: 'bar',
            height: Math.max(container.clientHeight, 400),
            parentHeightOffset: 0,
            toolbar: { show: false },
          },
          series: seriesData,
          plotOptions: {
            bar: {
              horizontal: true,
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
          colors: ['#4C78A8', '#B82753'],
          xaxis: {
            categories: orderY,
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
            borderColor: 'rgba(10, 76, 140, 0.08)',
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
            padding: {
              top: 8,
              right: 20,
              bottom: 12,
              left: 8,
            },
          },
          legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
            fontSize: '11px',
            itemMargin: {
              horizontal: 12,
              vertical: 4,
            },
            formatter: (seriesName, opts) => {
              if (!opts) {
                return seriesName;
              }
              const values = (opts.w.globals.series[opts.seriesIndex] as number[]) ?? [];
              const totalSerie = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
              return `${seriesName} (${Math.round(totalSerie).toLocaleString()})`;
            },
            onItemClick: {
              toggleDataSeries: false,
            },
            onItemHover: {
              highlightDataSeries: false,
            },
          },
          responsive: [
            {
              breakpoint: 768,
              options: {
                legend: {
                  position: 'bottom',
                  horizontalAlign: 'center',
                },
              },
            },
          ],
          tooltip: {
            x: {
              formatter: (value) => {
                const desc = descMap.get(String(value)) || '';
                return desc ? `${value} - ${desc}` : String(value);
              },
            },
            y: {
              formatter: (val) => formatPct(Number(val)),
            },
          },
          noData: {
            text: 'Sin datos',
          },
        };

        this.renderApexChart(container, options, (chart) => {
          this.chartDiagnostico = chart;
        });
      }
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

    const aggregated = this.aggregateByLabel(data, labelFn)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    this.destroyChart(currentChart);

    if (!aggregated.length) {
      return;
    }

    const total = aggregated.reduce((acc, item) => acc + item.total, 0);
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
        height: 350,
        parentHeightOffset: 0,
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
        padding: {
          top: 8,
          right: 20,
          bottom: 12,
          left: 8,
        },
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

  private destroyChart(chart: ApexCharts | null): void {
    if (chart) {
      chart.destroy();
    }
  }

  private destroyAllCharts(): void {
    this.destroyChart(this.chartServicio);
    this.destroyChart(this.chartSubactividad);
    this.destroyChart(this.chartEspecialidad);
    this.destroyChart(this.chartAgrupador);
    this.destroyChart(this.chartTornado);
    this.destroyChart(this.chartDiagnostico);
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

  private aggregateByLabelAndSex<T>(
    data: T[] = [],
    labelFn: (item: T) => string | undefined,
    sexFn: (item: T) => string | number | undefined,
    valueFn?: (item: T) => number | undefined,
  ): { label: string; masculino: number; femenino: number }[] {
    const totals = new Map<string, { masculino: number; femenino: number }>();

    data.forEach((item) => {
      const label = (labelFn(item) || 'Sin dato').trim();
      const value = valueFn ? (valueFn(item) ?? 0) : 1;
      const sexRaw = sexFn(item);
      const sex = typeof sexRaw === 'number' ? String(sexRaw) : (sexRaw || '').toUpperCase();
      const current = totals.get(label) ?? { masculino: 0, femenino: 0 };

      if (sex.startsWith('M')) {
        current.masculino += value;
      } else {
        current.femenino += value;
      }

      totals.set(label, current);
    });

    return Array.from(totals.entries()).map(([label, totals]) => ({ label, ...totals }));
  }

  setActiveTab(tab: 'produccion' | 'diagnosticos' | 'noconsiderados'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
    if (tab === 'produccion') {
      this.buildCharts();
    } else if (tab === 'diagnosticos') {
      this.buildDiagnosticoChart();
    }
  }

  // Variable total de atenciones de la tabla del query 4
  totalAtencionesQ4: number = 0;

  calculateTotalAtencionesQ4(): void {
    const data = this.newtableQ4CountMap || [];
    this.totalAtencionesQ4 = data.reduce(
      (sum: number, row: any) => sum + Number(row.total_atenciones ?? 0),
      0,
    );
  }

  ///Filtrar datos de la tabla del query 4 por columna

  filterData(column: keyof typeof this.filters, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filters[column] = filterValue;

    const filtered = this.query4TotalAtencionesFilter.filter((row) => this.applyAllFilters(row));

    this.newtableQ4CountMap = filtered;
    this.calculateTotalAtencionesQ4();
  }

  ///Aplicar todos los filtros activos a una fila

  private applyAllFilters(row: any): boolean {
    // Filtro Servicio
    if (
      this.filters.descripcion_servicio &&
      !row.descripcion_servicio.toLowerCase().includes(this.filters.descripcion_servicio)
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

    // Filtro sexo
    if (this.filters.sexo && !row.sexo.toLowerCase().includes(this.filters.sexo)) {
      return false;
    }

    // Filtro Diagnóstico
    if (this.filters.cod_diag && !row.cod_diag.toLowerCase().includes(this.filters.cod_diag)) {
      return false;
    }

    // Filtro Descripción Diagnóstico
    if (
      this.filters.descripcion_diagnostico &&
      !row.descripcion_diagnostico.toLowerCase().includes(this.filters.descripcion_diagnostico)
    ) {
      return false;
    }

    //Filtro Atenciones
    if (
      this.filters.total_atenciones &&
      !String(row.total_atenciones).toLowerCase().includes(this.filters.total_atenciones)
    ) {
      return false;
    }

    return true;
  }

  ///Filtrar datos de la tabla del query 2 por columna

  filterDataQuery2(column: keyof typeof this.filtersQuery2, event: any): void {
    const filterValue = event.target.value.toLowerCase().trim();
    this.filtersQuery2[column] = filterValue;

    const filtered = this.query2TotalAtencionesFilter.filter((row) =>
      this.applyAllFiltersQuery2(row),
    );

    this.query2DATA = filtered;
  }

  /// Aplicar todos los filtros activos a una fila

  private applyAllFiltersQuery2(row: any): boolean {
    // Filtro Servicio
    if (
      this.filtersQuery2.servicio2 &&
      !row.servicio2.toLowerCase().includes(this.filtersQuery2.servicio2)
    ) {
      return false;
    }

    // Filtro actividad
    if (
      this.filtersQuery2.actividad2 &&
      !row.actividad2.toLowerCase().includes(this.filtersQuery2.actividad2)
    ) {
      return false;
    }

    // Filtro subactividad
    if (
      this.filtersQuery2.subactividad2 &&
      !String(row.subactividad2).toLowerCase().includes(this.filtersQuery2.subactividad2)
    ) {
      return false;
    }

    // Filtro consulta
    if (
      this.filtersQuery2.tipo_consulta2 &&
      !row.tipo_consulta2.toLowerCase().includes(this.filtersQuery2.tipo_consulta2)
    ) {
      return false;
    }

    //codDiag
    if (
      this.filtersQuery2.coddiag2 &&
      !row.coddiag2.toLowerCase().includes(this.filtersQuery2.coddiag2)
    ) {
      return false;
    }

    // Filtro Diagnóstico
    if (
      this.filtersQuery2.diagnostico2 &&
      !row.diagnostico2.toLowerCase().includes(this.filtersQuery2.diagnostico2)
    ) {
      return false;
    }

    // Filtro dni_medico
    if (
      this.filtersQuery2.dni_medico2 &&
      !String(row.dni_medico2).toLowerCase().includes(this.filtersQuery2.dni_medico2)
    ) {
      return false;
    }

    // Filtro act_med
    if (
      this.filtersQuery2.acto_med2 &&
      !String(row.acto_med2).toLowerCase().includes(this.filtersQuery2.acto_med2)
    ) {
      return false;
    }

    //Filtro sexo
    if (this.filtersQuery2.sexo2 && !row.sexo2.toLowerCase().includes(this.filtersQuery2.sexo2)) {
      return false;
    }

    //filtro fecha_atencion
    if (
      this.filtersQuery2.fecha_atencion2 &&
      !String(row.fecha_atencion2).toLowerCase().includes(this.filtersQuery2.fecha_atencion2)
    ) {
      return false;
    }

    //Filtro desc_cl
    if (
      this.filtersQuery2.desc_cl2 &&
      !row.desc_cl2.toLowerCase().includes(this.filtersQuery2.desc_cl2)
    ) {
      return false;
    }
    return true;
  }

  // Descargar datos en formato CSV
  downloadCSV(): void {
    if (!this.dataCSV?.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `mc_total_atenciones_${this.periodo}_${this.nameCentro}.csv`;

    const headers = Object.keys(this.dataCSV[0]);
    const csvContent = [
      headers.join(';'),
      ...this.dataCSV.map((row) =>
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
