import { Component, OnDestroy } from '@angular/core';
import { SeguimientoPacienteService } from '../../../services/reportes/seguimiento-paciente-service';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FechaActualizacionService } from '../../../services/fecha-actualizacion-service';

type TipoColumna = 'texto' | 'numero' | 'fecha';
type Direccion = 'asc' | 'desc';

interface Columna {
  key: string;
  label: string;
  tipo: TipoColumna;
  /** Ancho mínimo de la columna en px. */
  ancho: number;
}

/** Atención con sus valores de presentación y búsqueda resueltos una sola vez. */
interface FilaAtencion {
  row: any;
  diagnostico: string;
  esHipertension: boolean;
  fechaTexto: string;
  fechaOrden: number;
  /** Texto mostrado por columna. */
  valores: Record<string, string>;
  /** Mismo texto normalizado (minúsculas, sin tildes) para los filtros. */
  busqueda: Record<string, string>;
}

/** Enfermedades hipertensivas: CIE-10 I10 a I16. */
const CIE10_HIPERTENSION = /^I1[0-6]/i;

@Component({
  selector: 'app-dashboard-seguimiento-paciente',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-seguimiento-paciente.html',
  styleUrl: './dashboard-seguimiento-paciente.css',
})
export class DashboardSeguimientoPaciente implements OnDestroy {

  currentDate: string = '';

  //filtros
  documento: string = '';
  tipo_documento: string = '1';

  readonly tiposDocumento = [
    { value: '1', label: 'D.N.I.' },
    { value: '2', label: 'CARNE DE EXTRANJERIA/PASAPORTE' },
    { value: '8', label: 'NEONATO' },
    { value: '6', label: 'CARNET DE IDENTIDAD - RR.EE.' },
    { value: '7', label: 'CARNET PERMISO TEMP PERM CPP' },
    { value: '4', label: 'DOCUMENTO IDENTIDAD EXTRANJERO' },
    { value: '5', label: 'PERMISO TEMPORAL DE PERMANENCIA' },
    { value: 'T', label: 'CARNET DE REFUGIADOS' },
  ];

  //data
  dataQuery1SPA: any[] = [];
  dataQuery2SPA: any[] = [];

  // Estados para datos
  ingreseDocumento: boolean = true;
  loadingSPA: boolean = false;
  errorSPA: string | null = null;
  noDataSPA: boolean = false;
  private cargaSub?: Subscription;
  private filtroTimer?: ReturnType<typeof setTimeout>;

  // Tabla
  readonly columnas: Columna[] = [
    { key: 'RED', label: 'Red', tipo: 'texto', ancho: 110 },
    { key: 'CENTRO', label: 'Centro', tipo: 'texto', ancho: 120 },
    { key: 'ACTO_MED', label: 'Acto médico', tipo: 'numero', ancho: 100 },
    { key: 'AREA', label: 'Área', tipo: 'texto', ancho: 130 },
    { key: 'SERVICIO', label: 'Servicio', tipo: 'texto', ancho: 150 },
    { key: 'DIAGNOSTICO', label: 'Diagnóstico (hipertensión)', tipo: 'texto', ancho: 190 },
    { key: 'TIPO_ATENCION', label: 'Tipo de atención', tipo: 'texto', ancho: 110 },
    { key: 'EDAD_EN_ATENCION', label: 'Edad en atención', tipo: 'numero', ancho: 90 },
    { key: 'FECHA_ATENCION', label: 'Fecha de atención', tipo: 'fecha', ancho: 110 },
    { key: 'ACTMEDATE', label: 'Atención', tipo: 'numero', ancho: 92 },
    { key: 'ACTMEDPRO', label: 'Procedimiento', tipo: 'numero', ancho: 112 },
    { key: 'ACTMEDREC', label: 'Receta', tipo: 'numero', ancho: 84 },
    { key: 'ACTMEDEXAIMA', label: 'Examen imagen', tipo: 'numero', ancho: 96 },
    { key: 'ACTMEDEXALAB', label: 'Examen laboratorio', tipo: 'numero', ancho: 110 },
    { key: 'ACTMEDEXAPAT', label: 'Examen patología', tipo: 'numero', ancho: 104 },
    { key: 'ACTMEDHOS', label: 'Hospitalización', tipo: 'numero', ancho: 118 },
    { key: 'ACTMEDOPE', label: 'Operación', tipo: 'numero', ancho: 96 },
    { key: 'ACTMEDCITT', label: 'Cita tópico', tipo: 'numero', ancho: 92 },
  ];

  filtrosColumna: Record<string, string> = {};
  ordenColumna = 'FECHA_ATENCION';
  ordenDireccion: Direccion = 'desc';

  private filas: FilaAtencion[] = [];
  filasVisibles: FilaAtencion[] = [];
  totalHipertension = 0;

  constructor(
    private seguimientoPacienteService: SeguimientoPacienteService,
    private cdr: ChangeDetectorRef,
    private fechaService: FechaActualizacionService,
  ) {
    this.loadFechaActualizacion();
  }

  ngOnDestroy(): void {
    this.cargaSub?.unsubscribe();
    clearTimeout(this.filtroTimer);
  }

  loadFechaActualizacion() {
    this.fechaService.queryFechaActualizacion().subscribe({
      next: (data) => {
        this.currentDate = data.fecha_act;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar la fecha de actualizacion', error);
      }
    });
  }

  get esPacienteHipertenso(): boolean {
    return this.totalHipertension > 0;
  }

  get textoOrden(): string {
    const columna = this.columnas.find((c) => c.key === this.ordenColumna);
    if (!columna) return '';
    if (columna.tipo === 'fecha') {
      return this.ordenDireccion === 'desc'
        ? 'Ordenadas de la más reciente a la más antigua.'
        : 'Ordenadas de la más antigua a la más reciente.';
    }
    const sentido = columna.tipo === 'numero'
      ? (this.ordenDireccion === 'asc' ? 'de menor a mayor' : 'de mayor a menor')
      : (this.ordenDireccion === 'asc' ? 'de la A a la Z' : 'de la Z a la A');
    return `Ordenadas por ${columna.label.toLowerCase()}, ${sentido}.`;
  }

  get hayFiltrosColumna(): boolean {
    return Object.values(this.filtrosColumna).some((valor) => !!valor?.trim());
  }

  loadAtenciones() {
    const documento = this.documento.trim();
    if (!documento || !this.tipo_documento) {
      this.errorSPA = 'Selecciona el tipo de documento e ingresa el número de documento.';
      this.loadingSPA = false;
      this.noDataSPA = false;
      return;
    }

    this.cargaSub?.unsubscribe();
    this.loadingSPA = true;
    this.ingreseDocumento = false;
    this.errorSPA = null;
    this.noDataSPA = false;
    this.cdr.markForCheck();

    this.cargaSub = forkJoin({
      query1: this.seguimientoPacienteService.getQuery1SPA(documento, this.tipo_documento as any),
      query2: this.seguimientoPacienteService.getQuery2SPA(documento, this.tipo_documento as any),
    }).subscribe({
      next: (data) => {
        this.dataQuery1SPA = data.query1 || [];
        this.dataQuery2SPA = data.query2 || [];

        // Sin diagnósticos no significa sin atenciones: solo query1 define si hay datos
        this.noDataSPA = this.dataQuery1SPA.length === 0;
        this.filtrosColumna = {};
        this.construirFilas();
        this.aplicarVista();

        this.loadingSPA = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorSPA = 'No se pudieron cargar las atenciones del paciente. Inténtalo de nuevo.';
        this.loadingSPA = false;
        this.noDataSPA = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ===== DIAGNÓSTICOS =====

  /** Diagnósticos de hipertensión por acto médico, con código y descripción. */
  private diagnosticosPorActo(): Map<string, string[]> {
    const mapa = new Map<string, string[]>();
    for (const row of this.dataQuery2SPA) {
      const acto = String(row.acto_med ?? row.ACTO_MED ?? '').trim().toLowerCase();
      const codigo = String(row.cod_diagnostico ?? row.COD_DIAGNOSTICO ?? '').trim();
      const descripcion = String(row.diagdes ?? row.DIAGDES ?? '').trim();
      if (!acto || !CIE10_HIPERTENSION.test(codigo)) continue;

      const texto = [codigo, descripcion].filter(Boolean).join(' - ');
      const lista = mapa.get(acto) ?? [];
      if (!lista.includes(texto)) lista.push(texto);
      mapa.set(acto, lista);
    }
    return mapa;
  }

  /** Se mantiene por compatibilidad con la exportación: primer diagnóstico de hipertensión del acto. */
  diagnostico(code: any): string {
    const acto = String(code ?? '').trim().toLowerCase();
    return this.diagnosticosPorActo().get(acto)?.join(' | ') || '-';
  }

  // ===== TABLA =====

  private construirFilas(): void {
    const diagnosticos = this.diagnosticosPorActo();

    this.filas = this.dataQuery1SPA.map((row) => {
      const acto = String(row.ACTO_MED ?? '').trim().toLowerCase();
      const lista = diagnosticos.get(acto) ?? [];
      const fecha = this.parseFecha(row.FECHA_ATENCION);

      const valores: Record<string, string> = {};
      for (const columna of this.columnas) {
        if (columna.key === 'DIAGNOSTICO') {
          valores[columna.key] = lista.join('\n');
        } else if (columna.tipo === 'fecha') {
          valores[columna.key] = fecha ? this.formatearFecha(fecha) : String(row[columna.key] ?? '');
        } else {
          valores[columna.key] = String(row[columna.key] ?? '').trim();
        }
      }

      const busqueda: Record<string, string> = {};
      for (const key of Object.keys(valores)) {
        busqueda[key] = this.normalizar(valores[key]);
      }

      return {
        row,
        diagnostico: lista.join('\n'),
        esHipertension: lista.length > 0,
        fechaTexto: valores['FECHA_ATENCION'],
        fechaOrden: fecha?.getTime() ?? 0,
        valores,
        busqueda,
      };
    });

    this.totalHipertension = this.filas.filter((f) => f.esHipertension).length;
  }

  ordenarPor(columna: Columna): void {
    if (this.ordenColumna === columna.key) {
      this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenColumna = columna.key;
      // Fechas y números suelen leerse de mayor a menor; textos de la A a la Z
      this.ordenDireccion = columna.tipo === 'texto' ? 'asc' : 'desc';
    }
    this.aplicarVista();
    this.cdr.markForCheck();
  }

  ariaSort(columna: Columna): 'ascending' | 'descending' | 'none' {
    if (this.ordenColumna !== columna.key) return 'none';
    return this.ordenDireccion === 'asc' ? 'ascending' : 'descending';
  }

  onFiltroColumnaChange(): void {
    clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => {
      this.aplicarVista();
      this.cdr.markForCheck();
    }, 200);
  }

  limpiarFiltrosColumna(): void {
    this.filtrosColumna = {};
    this.aplicarVista();
    this.cdr.markForCheck();
  }

  private aplicarVista(): void {
    const terminos = Object.entries(this.filtrosColumna)
      .map(([key, valor]) => [key, this.normalizar(valor)] as const)
      .filter(([, valor]) => !!valor);

    const filtradas = terminos.length
      ? this.filas.filter((fila) => terminos.every(([key, termino]) => (fila.busqueda[key] ?? '').includes(termino)))
      : [...this.filas];

    const columna = this.columnas.find((c) => c.key === this.ordenColumna);
    const signo = this.ordenDireccion === 'asc' ? 1 : -1;

    if (columna) {
      filtradas.sort((a, b) => {
        let resultado: number;
        if (columna.tipo === 'fecha') {
          resultado = a.fechaOrden - b.fechaOrden;
        } else if (columna.tipo === 'numero') {
          resultado = (Number(a.valores[columna.key]) || 0) - (Number(b.valores[columna.key]) || 0);
        } else {
          resultado = a.valores[columna.key].localeCompare(b.valores[columna.key], 'es', { sensitivity: 'base' });
        }
        // Desempate estable por fecha, lo más reciente primero
        return resultado * signo || b.fechaOrden - a.fechaOrden;
      });
    }

    this.filasVisibles = filtradas;
  }

  trackFila = (_: number, fila: FilaAtencion) => fila.row.ACTO_MED ?? fila;

  // ===== UTILIDADES =====

  /** Acepta milisegundos, ISO (2026-06-30T...), "2026-06-30 00:00:00" y dd/mm/aaaa. */
  private parseFecha(valor: unknown): Date | null {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor === 'number') return new Date(valor);

    const texto = String(valor).trim();
    const dmy = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

    const ymd = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private formatearFecha(fecha: Date): string {
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${fecha.getFullYear()}`;
  }

  private normalizar(valor: string): string {
    return (valor || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  // Tabs
  activeTab:
    | 'Atenciones' = 'Atenciones';

  setActiveTab(
    tab:
      | 'Atenciones',
  ): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  // Descargar datos en formato CSV (filas y orden visibles en la tabla)
  downloadCSV(): void {
    if (!this.filasVisibles.length) {
      console.warn('No hay datos para descargar');
      return;
    }

    const fileName = `dashboard-seguimiento-paciente.csv`;
    const headers = this.columnas.map((c) => c.label);
    const csvContent = [
      headers.join(';'),
      ...this.filasVisibles.map((fila) =>
        this.columnas
          .map((c) => `="${String(fila.valores[c.key] ?? '').replace(/\n/g, ' | ').replace(/"/g, '""')}"`)
          .join(';'),
      ),
    ].join('\r\n');

    // BOM para que Excel abra correctamente tildes y eñes
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
