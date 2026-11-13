import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AyudaFlotante } from '../../Administrativo/ayuda-flotante';
import {
  TmiCalculoService, TmiDashboardDatos, TmiDashCentro, TmiDashDetalle, TmiDashIndicador, TmiDashRed, mensajeError,
} from '../../../../services/tmi';

const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre',
  'noviembre', 'diciembre'];
const MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Indicador con su posición en el arreglo det. acum: valor de enero al mes (ACUMULADO); si no, valor del mes (MENSUAL). */
interface Ind extends TmiDashIndicador { i: number; pct: boolean; acum: boolean; serv: string; }
/** Fila de la tabla: un indicador del centro elegido. */
interface Fila { x: Ind; d: TmiDashDetalle; meses: (number | null)[]; }
/** Fila de la tabla de la red: un centro en el indicador elegido. */
interface FilaCentro { c: TmiDashCentro; d: TmiDashDetalle; meses: (number | null)[]; }
interface Grupo { serv: string; filas: Fila[]; }

const titleCase = (s: string) => s.toLowerCase()
  .replace(/(^|[\s(.-])([a-záéíóúñ])/g, (_m, a, b) => a + b.toUpperCase())
  .replace(/(?<=\s)(De|Del|La|Y)\b/g, (w) => w.toLowerCase());
const esNum = (v: number | null | undefined): v is number => v != null && !isNaN(v);
const periodoActual = () => { const h = new Date(); return `${h.getFullYear()}${String(h.getMonth() + 1).padStart(2, '0')}`; };
const etiquetaPeriodo = (p: string) => `${MESES_L[+p.slice(4) - 1]} ${p.slice(0, 4)}`;

/** Dashboard de estándares del TMI (como el tablero de Power BI). Se filtra por periodo, red (al entrar, todas),
 *  nivel de atención, tipo y centro.
 *  - Sin centro elegido: los centros de la red que cumplen nivel y tipo, en un indicador a la vez.
 *  - Con centro: por indicador, el estándar, el % Acept, el valor real y el valor de cada mes del centro.
 *  Sin promedios ni medianas ni puntajes (eso va en el tablero TMI). */
@Component({
  selector: 'app-tmi-dashboard-estandar',
  imports: [FormsModule, MatIconModule, ScrollingModule, AyudaFlotante],
  templateUrl: './tmi-dashboard-estandar.html',
  styleUrl: './tmi-dashboard-estandar.css',
})
export class TmiDashboardEstandar implements OnInit {
  private calculoSrv = inject(TmiCalculoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly mesesC = MESES_C;

  /** Periodos para elegir: los que tienen datos actuales y el actual (sin datos se muestra vacío). */
  periodos = signal<string[]>([]);
  private calculados = new Set<string>();
  private cache = new Map<string, TmiDashboardDatos>();
  periodo = signal('');
  data = signal<TmiDashboardDatos | null>(null);
  cargando = signal(false);
  error = signal('');
  excelCargando = signal(false);
  excelError = signal('');

  // filtros (como el tablero de Power BI)
  red = signal('');
  nivel = signal('');
  tipo = signal('');
  centro = signal<number | null>(null);
  ind = signal<number | null>(null);
  cerrados = signal<Set<string>>(new Set());
  tip = signal<{ x: number; y: number; title: string; lines: string[] } | null>(null);

  // ---------- periodo ----------
  anios = computed(() => [...new Set(this.periodos().map((p) => p.slice(0, 4)))]);
  anioSel = computed(() => this.periodo().slice(0, 4));
  mesesDelAnio = computed(() => this.periodos().filter((p) => p.startsWith(this.anioSel()))
    .map((p) => ({ value: p, label: MESES_L[+p.slice(4) - 1], calculado: this.calculados.has(p) })));
  mes = computed(() => this.data()?.mes ?? (+this.periodo().slice(4) || 1));
  mesTxt = computed(() => MESES_L[this.mes() - 1]);
  sinDatos = computed(() => !this.data() || !this.data()!.centros.length);

  // ---------- catálogos ----------
  inds = computed<Ind[]>(() => (this.data()?.indicadores ?? []).map((x, i) => ({
    ...x, i, nombre: this.nombreInd(x.nombre), pct: x.formato === 'PORCENTAJE', acum: x.tipo_calculo === 'ACUMULADO',
    serv: this.nombreServ(x.servicio),
  })));
  redes = computed(() => this.data()?.redes ?? []);
  centros = computed(() => this.data()?.centros ?? []);
  /** Red elegida; '' = todas (al entrar no hay red elegida). */
  redSel = computed(() => {
    const r = this.red();
    return this.redes().some((x) => x.nombre === r) ? r : '';
  });
  redObj = computed(() => this.redes().find((r) => r.nombre === this.redSel()) ?? null);
  /** Centros de la red elegida; sin red, los de todas las redes. */
  centrosRed = computed(() => { const r = this.redSel(); return r ? this.centros().filter((c) => c.red === r) : this.centros(); });
  /** Nombre de la red elegida o «Todas las redes». */
  redTxt = computed(() => this.nombreRed(this.redObj()) || 'Todas las redes');
  /** Niveles y tipos que existen en la red (los tipos, además, dentro del nivel elegido). */
  /** Orden y nombre de cada nivel y tipo según los catálogos (nivel_centro, tipo_centro); sin catálogo, alfabético. */
  private catNivel = computed(() => new Map((this.data()?.catalogos?.niveles ?? []).map((x, k) => [x.codigo, { ...x, k }])));
  private catTipo = computed(() => new Map((this.data()?.catalogos?.tipos ?? []).map((x, k) => [x.codigo, { ...x, k }])));
  private porCatalogo(cat: Map<string, { k: number }>) {
    return (a: string, b: string) => (cat.get(a)?.k ?? 999) - (cat.get(b)?.k ?? 999) || a.localeCompare(b);
  }
  nivelesRed = computed(() => [...new Set(this.centrosRed().map((c) => c.nivel).filter((n): n is string => !!n))]
    .sort(this.porCatalogo(this.catNivel())));
  tiposRed = computed(() => {
    const nv = this.nivel();
    return [...new Set(this.centrosRed().filter((c) => !nv || c.nivel === nv).map((c) => c.tipo)
      .filter((t): t is string => !!t))].sort(this.porCatalogo(this.catTipo()));
  });
  /** Opciones de los selects: todo el catálogo (nivel_centro, tipo_centro) en su orden, más algún valor de los centros
   *  que no esté en el catálogo. Todas se pueden elegir; si no hay centros, se avisa. */
  private opciones(cat: Map<string, { k: number }>, conCentros: string[]) {
    const hay = new Set(conCentros);
    return [...new Set([...cat.keys(), ...conCentros])].sort(this.porCatalogo(cat)).map((codigo) => ({ codigo, hay: hay.has(codigo) }));
  }
  opcionesNivel = computed(() => this.opciones(this.catNivel(), this.nivelesRed()));
  opcionesTipo = computed(() => this.opciones(this.catTipo(), this.tiposRed()));
  /** Centros que cumplen red, nivel y tipo. */
  centrosFiltrados = computed(() => {
    const nv = this.nivel(), tp = this.tipo();
    return this.centrosRed().filter((c) => (!nv || c.nivel === nv) && (!tp || c.tipo === tp))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });
  /** Centro analizado: el elegido, si sigue en la lista. Sin centro se ven todos los centros filtrados. */
  cen = computed<TmiDashCentro | null>(() => this.centrosFiltrados().find((c) => c.cod === this.centro()) ?? null);

  // ---------- vista de la red (sin centro elegido) ----------
  /** Centros de la tabla: el elegido o, sin centro, todos los filtrados. */
  centrosTabla = computed(() => { const c = this.cen(); return c ? [c] : this.centrosFiltrados(); });
  /** Indicadores con valor en algún centro de la tabla. */
  indsRed = computed(() => {
    const cs = this.centrosTabla();
    return this.inds().filter((x) => cs.some((c) => !!c.det[x.i]));
  });
  indRedSel = computed<Ind | null>(() => this.indsRed().find((x) => x.i === this.ind()) ?? this.indsRed()[0] ?? null);
  serviciosRed = computed(() => [...new Set(this.indsRed().map((x) => x.serv))]);
  /** Cada centro de la tabla en el indicador elegido. */
  filasRed = computed<FilaCentro[]>(() => {
    const x = this.indRedSel(), mes = this.mes();
    if (!x) return [];
    return this.centrosTabla().flatMap((c) => {
      const d = c.det[x.i];
      return d ? [{ c, d, meses: Array.from({ length: 12 }, (_, k) => (k < mes ? d.m[k] ?? null : null)) }] : [];
    });
  });
  // ---------- virtual scroll (alto fijo por fila) ----------
  readonly altoFila = 46;
  /** Desplazamiento horizontal de las filas: la cabecera lo copia. */
  scrollX = signal(0);
  readonly altoBarra = 26;
  /** Alto de la zona de filas (la cabecera va aparte): hasta 520 px; sin filas, una para el aviso. */
  altoTabla = computed(() => Math.min(520, Math.max(1, this.filasRed().length) * this.altoFila + 2));
  /** Ancho mínimo de la tabla = suma de los anchos fijos de las columnas (ver .c-* en el CSS). */
  anchoTabla = computed(() => 240 + 2 * 60 + 3 * 84 + (this.conMenos() ? 104 : 0) + 12 * 58);
  /** Alto de las barras de centros: hasta 420 px. */
  altoComp = computed(() => Math.min(420, Math.max(1, this.comparacion().length) * this.altoBarra + 2));
  trackFilaCentro = (_: number, f: FilaCentro) => f.c.cod;
  trackComp = (_: number, r: { c: TmiDashCentro }) => r.c.cod;

  /** La columna «% Acept. menos» solo se muestra en los indicadores que la tienen (los de rango). */
  conMenos = computed(() => this.indRedSel()?.sentido === 'BANDA' || this.filasRed().some((f) => f.d.aceptmenos != null));

  /** Indicador que se compara entre centros y se grafica: el elegido en el select. */
  indComp = computed<Ind | null>(() => this.indRedSel());

  // ---------- tabla del centro ----------
  filas = computed<Fila[]>(() => {
    const c = this.cen(), mes = this.mes();
    if (!c) return [];
    return this.inds().flatMap((x) => {
      const d = c.det[x.i];
      if (!d) return [];
      return [{ x, d, meses: Array.from({ length: 12 }, (_, k) => (k < mes ? d.m[k] ?? null : null)) }];
    });
  });
  grupos = computed<Grupo[]>(() => {
    const m = new Map<string, Fila[]>();
    for (const f of this.filas()) { if (!m.has(f.x.serv)) m.set(f.x.serv, []); m.get(f.x.serv)!.push(f); }
    return [...m].map(([serv, filas]) => ({ serv, filas }));
  });

  // ---------- indicador elegido ----------
  indSel = computed<Fila | null>(() => {
    const fs = this.filas();
    return fs.find((f) => f.x.i === this.ind()) ?? fs[0] ?? null;
  });

  /** Cada indicador frente a su estándar, en su propia escala (las unidades no se pueden comparar entre indicadores). */
  bullets = computed(() => this.grupos().map((g) => ({
    serv: g.serv,
    filas: g.filas.map((f) => {
      const vals = [f.d.v, f.d.e, f.d.acept, f.d.aceptmenos].filter(esNum);
      const hi = Math.max(...vals, 0) * 1.15 || 1;
      const p = (v: number | null) => (v == null ? null : Math.max(0, Math.min(100, (v / hi) * 100)));
      return { f, v: p(f.d.v)!, e: p(f.d.e), a: p(f.d.acept), am: p(f.d.aceptmenos) };
    }),
  })));

  /** Evolución mensual del indicador elegido: valor de cada mes, con el estándar y el % Acept como líneas. */
  evolucion = computed(() => {
    const f = this.indSel();
    if (!f) return null;
    const W = 640, H = 230, L = 56, R = 16, T = 14, B = 30;
    const pts = f.meses.map((v, k) => ({ k, v })).filter((q): q is { k: number; v: number } => esNum(q.v));
    const vals = [...pts.map((q) => q.v), f.d.e, f.d.acept, f.d.aceptmenos].filter(esNum);
    if (!pts.length) return { f, vacio: true as const };
    const lo = Math.min(0, ...vals), hi = Math.max(...vals) * 1.12 || 1;
    const X = (k: number) => L + (k / 11) * (W - L - R);
    const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4).map((v) => ({ y: Y(v), label: this.fmtV(v, f.x) }));
    const ref = (v: number | null) => (v == null ? null : Y(v));
    return {
      f, vacio: false as const, W, H, L, R, T, B, ticks,
      meses: MESES_C.map((m, k) => ({ x: X(k), m })),
      linea: pts.map((q) => `${X(q.k).toFixed(1)},${Y(q.v).toFixed(1)}`).join(' '),
      puntos: pts.map((q) => ({ ...q, x: X(q.k), y: Y(q.v) })),
      e: ref(f.d.e), a: ref(f.d.acept), am: ref(f.d.aceptmenos),
    };
  });

  /** Centros filtrados (red, nivel y tipo) en el indicador elegido: el valor de cada uno (sin promedios), con su estándar. */
  comparacion = computed(() => {
    const x = this.indComp(), c = this.cen();
    if (!x) return [];
    const filas = this.centrosFiltrados().map((o) => ({ c: o, d: o.det[x.i] })).filter((r): r is { c: TmiDashCentro; d: TmiDashDetalle } => !!r.d)
      .sort((a, b) => b.d.v - a.d.v);
    const hi = Math.max(...filas.flatMap((r) => [r.d.v, r.d.e ?? 0]), 0) * 1.12 || 1;
    return filas.map((r) => ({ ...r, yo: r.c.cod === c?.cod, v: (r.d.v / hi) * 100, e: r.d.e == null ? null : (r.d.e / hi) * 100 }));
  });

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    this.red.set(qp.get('red') ?? '');
    this.centro.set(qp.get('centro') ? Number(qp.get('centro')) : null);
    this.ind.set(qp.get('ind') ? Number(qp.get('ind')) : null);
    this.cargando.set(true);
    this.calculoSrv.getPeriodosDashboard('ACTUAL').subscribe({
      next: (r) => {
        const calc = (r ?? []).map((p) => String(p.periodo));
        this.calculados = new Set(calc);
        const actual = periodoActual();
        const ps = [...new Set([actual, ...calc])].sort().reverse();
        this.periodos.set(ps);
        const pedido = qp.get('periodo');
        // sin periodo en la URL: el último calculado (el actual sin cálculo se ve vacío)
        this.cargar(ps.includes(pedido ?? '') ? pedido! : calc.sort().reverse()[0] ?? actual);
      },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e, 'No se pudo obtener los periodos calculados.')); },
    });
  }

  cargar(periodo: string) {
    this.periodo.set(periodo);
    this.error.set('');
    if (!this.calculados.has(periodo)) {
      this.data.set(null);
      this.cargando.set(false);
      this.guardarFiltros();
      return;
    }
    const enCache = this.cache.get(periodo);
    if (enCache) { this.aplicar(enCache); return; }
    this.cargando.set(true);
    this.calculoSrv.getDashboard(periodo, 'ACTUAL').subscribe({
      next: (d) => {
        this.cache.set(periodo, d);
        if (this.periodo() === periodo) this.aplicar(d);
      },
      error: (e) => { this.data.set(null); this.cargando.set(false); this.error.set(mensajeError(e, 'No se pudo cargar el resultado del periodo.')); },
    });
  }

  private aplicar(d: TmiDashboardDatos) {
    this.data.set(d);
    this.cargando.set(false);
    this.guardarFiltros();
  }

  // ---------- acciones ----------
  setAnio(anio: string) {
    const ps = this.periodos().filter((p) => p.startsWith(anio));
    this.cargar(ps.find((p) => this.calculados.has(p)) ?? ps[0]);
  }
  setRed(red: string) {
    this.red.set(red);
    this.nivel.set('');
    this.tipo.set('');
    this.centro.set(null);
    this.guardarFiltros();
  }
  /** Al cambiar nivel o tipo se deja de ver el centro elegido y se listan los centros que cumplen los filtros que
   *  quedan: con «Todos» en tipo y un nivel elegido, se filtra solo por nivel; con «Todos» en nivel y un tipo
   *  elegido, solo por tipo. */
  setNivel(n: string) {
    this.nivel.set(n);
    this.centro.set(null);
    // el tipo elegido puede no existir en el nivel nuevo
    if (this.tipo() && !this.tiposRed().includes(this.tipo())) this.tipo.set('');
    this.guardarFiltros();
  }
  setTipo(t: string) {
    this.tipo.set(t);
    this.centro.set(null);
    this.guardarFiltros();
  }
  /** Al elegir un centro, los selects de red, nivel y tipo pasan a los del centro. null = todos los centros de la red
   *  (vista de la red): nivel y tipo vuelven a «Todos» y la red se mantiene. */
  setCentro(cod: number | null) {
    this.centro.set(cod == null ? null : Number(cod));
    const c = cod == null ? null : this.centrosRed().find((x) => x.cod === Number(cod));
    if (c) this.red.set(c.red);
    this.nivel.set(c?.nivel ?? '');
    this.tipo.set(c?.tipo ?? '');
    this.guardarFiltros();
  }
  setInd(i: number) { this.ind.set(i); this.guardarFiltros(); }
  alternarGrupo(serv: string) { this.cerrados.set(this.alternar(this.cerrados(), serv)); }
  /** Borrar selección: sin red (todas), nivel, tipo ni centro. */
  borrar() {
    this.red.set('');
    this.nivel.set('');
    this.tipo.set('');
    this.centro.set(null);
    this.ind.set(null);
    this.guardarFiltros();
  }
  private alternar(s: Set<string>, v: string) {
    const n = new Set(s);
    if (n.has(v)) n.delete(v); else n.add(v);
    return n;
  }

  private guardarFiltros() {
    this.router.navigate([], {
      relativeTo: this.route, replaceUrl: true,
      queryParams: { periodo: this.periodo() || null, red: this.red() || null, centro: this.centro(), ind: this.ind() },
    });
  }

  /** Excel del periodo (el mismo de Administración), calculado con los datos actuales. */
  descargarExcel() {
    if (!this.periodo() || this.excelCargando()) return;
    this.excelCargando.set(true);
    this.excelError.set('');
    this.calculoSrv.descargarExcelDashboard(this.periodo(), 'ACTUAL').subscribe({
      next: () => this.excelCargando.set(false),
      error: (e: Error) => { this.excelCargando.set(false); this.excelError.set(e.message); },
    });
  }

  /** CSV de la tabla que se ve: la del centro elegido o, sin centro, la de los centros en el indicador elegido. */
  descargarCsv() {
    const c = this.cen(), x = this.indRedSel();
    if (!c && !x) return;
    const esc = (v: unknown) => { const t = v == null ? '' : String(v); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const n = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));
    const cab = ['Código', 'Centro', 'Red', 'Nivel', 'Tipo', 'Servicio', 'Indicador', 'Cálculo', 'Estándar', '% Acept', '% Acept. menos',
      'Valor real', ...MESES_C];
    const linea = (o: TmiDashCentro, i: Ind, f: { d: TmiDashDetalle; meses: (number | null)[] }) => [o.cod, titleCase(o.nombre), o.red,
      o.nivel, o.tipo, i.serv, i.nombre, i.acum ? 'Acumulado' : 'Mensual', n(f.d.e), n(f.d.acept), n(f.d.aceptmenos), n(f.d.v),
      ...f.meses.map(n)].map(esc).join(';');
    const cuerpo = c ? this.filas().map((f) => linea(c, f.x, f)) : this.filasRed().map((f) => linea(f.c, x!, f));
    const lineas = [cab.map(esc).join(';'), ...cuerpo];
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + lineas.join(String.fromCharCode(13, 10))], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = c ? `tmi_centro_${c.cod}_${this.periodo()}.csv` : `tmi_red_${x!.i + 1}_${this.periodo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- tooltip ----------
  mostrarTip(ev: MouseEvent, title: string, lines: string[]) {
    const x = ev.clientX + 14 + 280 > window.innerWidth ? ev.clientX - 294 : ev.clientX + 14;
    const y = ev.clientY + 14 + 140 > window.innerHeight ? ev.clientY - 140 : ev.clientY + 14;
    this.tip.set({ x: Math.max(8, x), y: Math.max(8, y), title, lines: lines.filter(Boolean) });
  }
  ocultarTip() { this.tip.set(null); }
  tipFila(ev: MouseEvent, f: Fila) {
    this.mostrarTip(ev, f.x.nombre, [
      `${f.x.acum ? 'Valor real acumulado de enero a ' : 'Valor real de '}${this.mesTxt()}: ${this.fmtV(f.d.v, f.x)}`,
      `Estándar: ${this.fmtV(f.d.e, f.x)}`,
      f.d.acept != null ? `% Acept: ${this.fmtAcept(f)}` : '',
      this.sentidoTxt(f.x),
    ]);
  }
  /** Tooltip de un mes en la tabla de la red. */
  tipMesCentro(ev: MouseEvent, f: FilaCentro, k: number) {
    const x = this.indRedSel()!, v = f.meses[k];
    this.mostrarTip(ev, `${titleCase(f.c.nombre)} · ${MESES_L[k]}`, [
      v == null ? 'Sin dato en el mes.' : `${x.acum ? 'Acumulado de enero a ' + MESES_L[k] : 'Valor del mes'}: ${this.fmtV(v, x)}`,
      `Estándar: ${this.fmtV(f.d.e, x)}`,
    ]);
  }
  tipMes(ev: MouseEvent, f: Fila, k: number) {
    const v = f.meses[k];
    this.mostrarTip(ev, `${f.x.nombre} · ${MESES_L[k]}`, [
      v == null ? 'Sin dato en el mes.' : `${f.x.acum ? 'Acumulado de enero a ' + MESES_L[k] : 'Valor del mes'}: ${this.fmtV(v, f.x)}`,
      `Estándar: ${this.fmtV(f.d.e, f.x)}`,
    ]);
  }
  tipComp(ev: MouseEvent, r: { c: TmiDashCentro; d: TmiDashDetalle }) {
    const x = this.indComp()!;
    this.mostrarTip(ev, titleCase(r.c.nombre), [`${r.c.tipo ?? ''}${r.c.nivel ? ' · nivel ' + r.c.nivel : ''}`,
      `Valor real: ${this.fmtV(r.d.v, x)}`, `Estándar: ${this.fmtV(r.d.e, x)}`]);
  }

  // ---------- utilidades ----------
  fmtV(v: number | null | undefined, x: Ind) {
    if (v == null) return '—';
    return x.pct ? (v * 100).toLocaleString('es-PE', { maximumFractionDigits: 2 }) + '%' : v.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }
  /** % Acept como se ve en la tabla; en banda, "de – a". */
  fmtAcept(f: { x: Ind; d: TmiDashDetalle }) {
    if (f.x.sentido === 'BANDA' && f.d.aceptmenos != null) return `${this.fmtV(f.d.aceptmenos, f.x)} – ${this.fmtV(f.d.acept, f.x)}`;
    return this.fmtV(f.d.acept, f.x);
  }
  sentidoTxt(x: Ind) {
    return x.sentido === 'MAYOR' ? '↑ mayor es mejor' : x.sentido === 'MENOR' ? '↓ menor es mejor' : x.sentido === 'BANDA' ? '↔ dentro del rango' : '';
  }
  /** Nombre corto de la red de un centro. */
  redDe(c: TmiDashCentro) { return this.nombreRed(this.redes().find((r) => r.nombre === c.red) ?? null) || c.red; }
  nombreRed(r: TmiDashRed | null) {
    if (!r) return '';
    return r.instituto ? titleCase(r.nombre) : 'R.A. ' + r.nombre.replace(/^RED (ASISTENCIAL|PRESTACIONAL) /i, '');
  }
  nombreCentro(c: TmiDashCentro) { return titleCase(c.nombre); }
  etiquetaPeriodo(p: string) { return etiquetaPeriodo(p); }
  private nombreServ(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Otros'; }
  private nombreInd(s: string) {
    const t = s.trim().toLowerCase();
    return (t.charAt(0).toUpperCase() + t.slice(1)).replace(/(?<![a-zñáéíóú])(i|ii|iii|iv|v)(?![a-zñáéíóú])/g, (m) => m.toUpperCase());
  }
}
