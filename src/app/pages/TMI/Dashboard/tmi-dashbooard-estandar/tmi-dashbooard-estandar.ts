import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiCalculoService, TmiDashboardDatos, TmiDashCentro, TmiDashDetalle, TmiDashIndicador, TmiDashRed, mensajeError,
} from '../../../../services/tmi';

const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre',
  'noviembre', 'diciembre'];
const COLORES_SERV = ['#007AC9', '#7a5bb5', '#e08a00', '#ED202D', '#00A557', '#00A79C', '#475569'];
const POR_PAGINA = 100;

type Estado = 'ok' | 'warn' | 'bad' | 'na';
/** Indicador con los datos que usa la vista: posición en los arreglos pts/det y color del servicio. */
interface Ind extends TmiDashIndicador { i: number; pct: boolean; color: string; serv: string; }
/** Una evaluación: un indicador en un establecimiento. */
interface Fila {
  key: string; c: TmiDashCentro; x: Ind; d: TmiDashDetalle | null; estado: Estado; brecha: number | null;
  /** posiciones (0 a 100) en la barra de comparación */
  bar: { v: number; e: number | null; a0: number | null; a1: number | null } | null;
  spark: string;
}
interface Col { k: string; t: string; num?: boolean; sm?: boolean; v: (f: Fila) => string | number | null; }

const ESTADO_TXT: Record<Estado, string> = { ok: 'Cumple', warn: 'Aceptable', bad: 'No cumple', na: 'No aplica' };
const estadoDe = (d: TmiDashDetalle | null): Estado =>
  !d || d.p == null ? 'na' : d.p >= 5 ? 'ok' : d.p >= 3 ? 'warn' : 'bad';
const titleCase = (s: string) => s.toLowerCase()
  .replace(/(^|[\s(.-])([a-záéíóúñ])/g, (_m, a, b) => a + b.toUpperCase())
  .replace(/(?<=\s)(De|Del|La|Y)\b/g, (w) => w.toLowerCase());
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const pct = (n: number, t: number) => t ? Math.round(n / t * 100) + '%' : '—';

/** Dashboard de estándares del TMI: por cada indicador y establecimiento muestra el estándar, el rango aceptable,
 *  el valor real acumulado y si cumple, con filtros de periodo, red, establecimiento, servicio, indicador y estado. */
@Component({
  selector: 'app-tmi-dashbooard-estandar',
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './tmi-dashbooard-estandar.html',
  styleUrl: './tmi-dashbooard-estandar.css',
})
export class TmiDashbooardEstandar implements OnInit {
  private calculoSrv = inject(TmiCalculoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly estadoTxt = ESTADO_TXT;
  readonly estadosFiltro: Estado[] = ['ok', 'warn', 'bad'];
  periodos = signal<{ periodo: string; label: string }[]>([]);
  periodo = signal('');
  data = signal<TmiDashboardDatos | null>(null);
  cargando = signal(false);
  error = signal('');

  // filtros
  red = signal('');
  centro = signal<number | null>(null);
  serv = signal('');
  ind = signal<number | null>(null);
  estado = signal<Estado | ''>('');
  q = signal('');
  sortKey = signal('estado');
  sortDir = signal(1);
  limite = signal(POR_PAGINA);
  tip = signal<{ x: number; y: number; title: string; lines: string[] } | null>(null);

  // ---------- datos base ----------
  mesTxt = computed(() => MESES_L[(this.data()?.mes ?? 1) - 1]);
  servicioNombres = computed(() => [...new Set((this.data()?.indicadores ?? []).map((x) => x.servicio))]);
  inds = computed<Ind[]>(() => {
    const servs = this.servicioNombres();
    return (this.data()?.indicadores ?? []).map((x, i) => ({
      ...x, nombre: this.nombreInd(x.nombre), i, pct: x.formato === 'PORCENTAJE', serv: this.nombreServ(x.servicio),
      color: COLORES_SERV[servs.indexOf(x.servicio) % COLORES_SERV.length],
    }));
  });
  servicios = computed(() => this.servicioNombres().map((nombre, k) => ({
    value: nombre, nombre: this.nombreServ(nombre), color: COLORES_SERV[k % COLORES_SERV.length],
    inds: this.inds().filter((x) => x.servicio === nombre),
  })));
  redes = computed(() => this.data()?.redes ?? []);
  centros = computed(() => this.data()?.centros ?? []);
  redPorNombre = computed(() => new Map(this.redes().map((r) => [r.nombre, r])));
  centroPorCod = computed(() => new Map(this.centros().map((c) => [c.cod, c])));
  centrosDeRed = computed(() => {
    const m = new Map<string, TmiDashCentro[]>();
    this.centros().forEach((c) => { if (!m.has(c.red)) m.set(c.red, []); m.get(c.red)!.push(c); });
    return m;
  });

  opcionesRed = computed(() => this.redes().map((r) => ({ value: r.nombre, label: this.nombreRed(r, true) })));
  opcionesCentro = computed(() => {
    const items = (cs: TmiDashCentro[]) => cs.map((c) => ({ value: c.cod, label: titleCase(c.nombre) + (c.tipo ? ' · ' + c.tipo : '') }));
    if (this.red()) return [{ grupo: '', items: items(this.centrosDeRed().get(this.red()) ?? []) }];
    return this.redes().map((r) => ({ grupo: this.nombreRed(r, true), items: items(this.centrosDeRed().get(r.nombre) ?? []) }))
      .filter((g) => g.items.length);
  });
  opcionesInd = computed(() => this.servicios().filter((s) => !this.serv() || s.value === this.serv()));

  // ---------- ámbito ----------
  cen = computed(() => this.centro() != null ? this.centroPorCod().get(this.centro()!) ?? null : null);
  indSel = computed(() => this.ind() == null ? null : this.inds()[this.ind()!] ?? null);
  ambito = computed(() => {
    const cen = this.cen(), red = this.red() ? this.redPorNombre().get(this.red()) : null;
    return cen ? titleCase(cen.nombre) : red ? this.nombreRed(red) : 'Nivel nacional';
  });
  centrosAmbito = computed(() => this.cen() ? [this.cen()!] : this.red() ? this.centrosDeRed().get(this.red()) ?? [] : this.centros());
  indsAmbito = computed(() => this.indSel() ? [this.indSel()!] : this.inds().filter((x) => !this.serv() || x.servicio === this.serv()));

  /** Todas las evaluaciones del ámbito (sin el filtro de estado ni la búsqueda): base de los resúmenes. */
  base = computed<Fila[]>(() => {
    const out: Fila[] = [];
    const inds = this.indsAmbito(), conNa = !!this.cen();
    for (const c of this.centrosAmbito()) {
      for (const x of inds) {
        const d = c.det[x.i] ?? null;
        if (!d && !conNa) continue;
        out.push({ key: `${c.cod}-${x.i}`, c, x, d, estado: estadoDe(d), brecha: d && d.e != null ? d.v - d.e : null,
          bar: d ? this.barra(d, x) : null, spark: d ? this.spark(d.m) : '' });
      }
    }
    return out;
  });

  conteo = computed(() => {
    const o: Record<Estado, number> = { ok: 0, warn: 0, bad: 0, na: 0 };
    this.base().forEach((f) => o[f.estado]++);
    return { ...o, n: o.ok + o.warn + o.bad };
  });

  tiles = computed(() => {
    const k = this.conteo();
    return [
      { cls: '', estado: '' as Estado | '', label: 'Evaluaciones', value: k.n.toLocaleString('es-PE'),
        note: this.cen() ? 'Indicadores aplicables al establecimiento.' : `${this.centrosAmbito().length.toLocaleString('es-PE')} establecimientos × ${this.indsAmbito().length} indicadores aplicables.` },
      { cls: 'ok', estado: 'ok' as Estado, label: 'Cumplen el estándar', value: k.ok.toLocaleString('es-PE'), note: `${pct(k.ok, k.n)} · puntaje 5.` },
      { cls: 'warn', estado: 'warn' as Estado, label: 'En rango aceptable', value: k.warn.toLocaleString('es-PE'), note: `${pct(k.warn, k.n)} · puntaje 3.` },
      { cls: 'bad', estado: 'bad' as Estado, label: 'No cumplen', value: k.bad.toLocaleString('es-PE'), note: `${pct(k.bad, k.n)} · puntaje 1 o sin producción.` },
    ];
  });

  lead = computed(() => {
    const k = this.conteo(), x = this.indSel();
    const que = x ? `el indicador «${x.nombre}»` : this.serv() ? `los indicadores de ${this.nombreServ(this.serv()).toLowerCase()}` : 'los indicadores';
    return `${this.ambito()}, a ${this.mesTxt()}: de ${k.n.toLocaleString('es-PE')} evaluaciones de ${que}, `
      + `${k.ok.toLocaleString('es-PE')} cumplen el estándar, ${k.warn.toLocaleString('es-PE')} quedan en el rango aceptable `
      + `y ${k.bad.toLocaleString('es-PE')} no lo cumplen.`;
  });

  /** Resumen por indicador del ámbito (para elegir uno). Con un establecimiento elegido no hace falta. */
  resumenInds = computed(() => {
    if (this.cen() || this.indSel()) return [];
    const m = new Map<number, { x: Ind; ok: number; warn: number; bad: number; n: number }>();
    this.indsAmbito().forEach((x) => m.set(x.i, { x, ok: 0, warn: 0, bad: 0, n: 0 }));
    this.base().forEach((f) => { const r = m.get(f.x.i)!; if (f.estado !== 'na') { r[f.estado]++; r.n++; } });
    return [...m.values()].filter((r) => r.n).sort((a, b) => b.bad / b.n - a.bad / a.n);
  });

  // ---------- tabla ----------
  columnas = computed<Col[]>(() => {
    const cols: Col[] = [];
    if (!this.cen()) cols.push(
      { k: 'centro', t: 'Establecimiento', v: (f) => titleCase(f.c.nombre) },
      { k: 'red', t: 'Red', sm: true, v: (f) => this.redCorta(f.c.red) });
    if (!this.indSel()) cols.push(
      { k: 'serv', t: 'Servicio', sm: true, v: (f) => f.x.serv },
      { k: 'ind', t: 'Indicador', v: (f) => f.x.nombre });
    cols.push(
      { k: 'e', t: 'Estándar', num: true, v: (f) => f.d?.e ?? null },
      { k: 'a', t: 'Aceptable', num: true, v: (f) => f.d?.acept ?? null },
      { k: 'v', t: 'Valor real', num: true, v: (f) => f.d?.v ?? null },
      { k: 'b', t: 'Brecha', num: true, sm: true, v: (f) => f.brecha },
      { k: 'estado', t: 'Estado', v: (f) => ['bad', 'warn', 'ok', 'na'].indexOf(f.estado) });
    return cols;
  });

  filas = computed(() => {
    const q = norm(this.q().trim()), est = this.estado();
    const col = this.columnas().find((c) => c.k === this.sortKey()) ?? this.columnas()[this.columnas().length - 1];
    const dir = this.sortDir();
    return this.base()
      .filter((f) => !est || f.estado === est)
      .filter((f) => !q || norm(`${f.c.nombre} ${f.c.red} ${f.c.cod} ${f.x.nombre} ${f.x.codigo} ${f.x.servicio}`).includes(q))
      .sort((a, b) => {
        const x = col.v(a), y = col.v(b);
        if (x == null) return y == null ? 0 : 1;
        if (y == null) return -1;
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * dir
          || a.x.i - b.x.i;
      });
  });
  visibles = computed(() => this.filas().slice(0, this.limite()));

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    this.red.set(qp.get('red') ?? '');
    this.centro.set(qp.get('centro') ? Number(qp.get('centro')) : null);
    this.serv.set(qp.get('serv') ?? '');
    this.ind.set(qp.get('ind') ? Number(qp.get('ind')) : null);
    this.estado.set((qp.get('estado') as Estado) ?? '');
    this.cargando.set(true);
    this.calculoSrv.getPeriodosDashboard().subscribe({
      next: (r) => {
        const ps = (r ?? []).map((p) => String(p.periodo)).sort().reverse()
          .map((p) => ({ periodo: p, label: `${MESES_L[+p.slice(4) - 1]} ${p.slice(0, 4)}` }));
        this.periodos.set(ps);
        const pedido = qp.get('periodo');
        const inicial = ps.find((p) => p.periodo === pedido)?.periodo ?? ps[0]?.periodo;
        if (inicial) this.cargar(inicial);
        else { this.cargando.set(false); this.error.set('Todavía no hay ningún periodo calculado.'); }
      },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e, 'No se pudo obtener los periodos calculados.')); },
    });
  }

  cargar(periodo: string) {
    this.periodo.set(periodo);
    this.cargando.set(true);
    this.error.set('');
    this.calculoSrv.getDashboard(periodo).subscribe({
      next: (d) => {
        this.data.set(d);
        this.cargando.set(false);
        // filtros que no existen en este periodo
        if (this.red() && !this.redPorNombre().has(this.red())) this.red.set('');
        if (this.centro() != null && !this.centroPorCod().has(this.centro()!)) this.centro.set(null);
        if (this.serv() && !this.servicioNombres().includes(this.serv())) this.serv.set('');
        if (this.ind() != null && !this.inds()[this.ind()!]) this.ind.set(null);
        this.guardarFiltros();
      },
      error: (e) => { this.data.set(null); this.cargando.set(false); this.error.set(mensajeError(e, 'No se pudo cargar el resultado del periodo.')); },
    });
  }

  // ---------- acciones ----------
  setRed(red: string) { this.red.set(red); this.centro.set(null); this.guardarFiltros(); }
  setCentro(cod: number | null) {
    this.centro.set(cod);
    if (cod != null) this.red.set(this.centroPorCod().get(cod)?.red ?? '');
    this.guardarFiltros();
  }
  setServ(s: string) {
    this.serv.set(s);
    if (s && this.indSel() && this.indSel()!.servicio !== s) this.ind.set(null);
    this.guardarFiltros();
  }
  setInd(i: number | null) {
    this.ind.set(i);
    if (i != null) this.serv.set(this.inds()[i]?.servicio ?? '');
    this.guardarFiltros();
  }
  setEstado(e: Estado | '') { this.estado.set(this.estado() === e ? '' : e); this.guardarFiltros(); }
  limpiar() {
    this.red.set(''); this.centro.set(null); this.serv.set(''); this.ind.set(null); this.estado.set(''); this.q.set('');
    this.guardarFiltros();
  }
  ordenar(k: string, esNum: boolean) {
    if (this.sortKey() === k) this.sortDir.set(-this.sortDir());
    else { this.sortKey.set(k); this.sortDir.set(esNum ? -1 : 1); }
  }
  /** Clic en una fila: baja un nivel de detalle (al establecimiento o al indicador que falte). */
  irFila(f: Fila) {
    if (!this.cen()) this.setCentro(f.c.cod);
    else if (!this.indSel()) this.setInd(f.x.i);
  }
  verMas() { this.limite.set(this.limite() + POR_PAGINA); }

  private guardarFiltros() {
    this.limite.set(POR_PAGINA);
    this.router.navigate([], {
      relativeTo: this.route, replaceUrl: true,
      queryParams: { periodo: this.periodo() || null, red: this.red() || null, centro: this.centro(), serv: this.serv() || null,
        ind: this.ind(), estado: this.estado() || null },
    });
  }

  descargarCsv() {
    const esc = (v: unknown) => { const t = v == null ? '' : String(v); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const n = (v: number | null | undefined) => v == null ? '' : String(v).replace('.', ',');
    const cab = ['Código', 'Establecimiento', 'Red', 'Nivel', 'Tipo', 'Servicio', 'Cód. indicador', 'Indicador', 'Sentido', 'Formato',
      'Estándar', 'Aceptable desde', 'Aceptable hasta', 'Valor real', 'Brecha', 'Puntaje', 'Estado'];
    const lineas = [cab.map(esc).join(';'), ...this.filas().map((f) => [f.c.cod, titleCase(f.c.nombre), f.c.red, f.c.nivel, f.c.tipo,
      f.x.serv, f.x.codigo, f.x.nombre, f.x.sentido, f.x.formato, n(f.d?.e), n(f.d?.aceptmenos), n(f.d?.acept), n(f.d?.v), n(f.brecha),
      f.d?.p ?? '', ESTADO_TXT[f.estado]].map(esc).join(';'))];
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + lineas.join(String.fromCharCode(13, 10))], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `tmi_estandares_${this.periodo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- tooltip ----------
  mostrarTip(ev: MouseEvent, title: string, lines: string[]) {
    const x = ev.clientX + 14 + 260 > window.innerWidth ? ev.clientX - 274 : ev.clientX + 14;
    const y = ev.clientY + 14 + 130 > window.innerHeight ? ev.clientY - 130 : ev.clientY + 14;
    this.tip.set({ x: Math.max(8, x), y: Math.max(8, y), title, lines });
  }
  ocultarTip() { this.tip.set(null); }
  tipFila(ev: MouseEvent, f: Fila) {
    if (!f.d) return;
    const mes = this.mesTxt(), m = f.d.m.map((v, k) => v == null ? null : `${MESES_L[k].slice(0, 3)}: ${this.fmtV(v, f.x)}`).filter(Boolean) as string[];
    this.mostrarTip(ev, f.x.nombre, [titleCase(f.c.nombre), `Valor real a ${mes}: ${this.fmtV(f.d.v, f.x)}`,
      `Estándar: ${this.fmtV(f.d.e, f.x)} · Aceptable: ${this.aceptTxt(f)}`, `Puntaje: ${f.d.p ?? 'NA'} (${ESTADO_TXT[f.estado]})`,
      ...(m.length > 1 ? [m.join(' · ')] : [])]);
  }

  // ---------- utilidades ----------
  color(e: Estado | string) { return e === 'ok' ? 'var(--d-ok)' : e === 'warn' ? 'var(--d-warn)' : e === 'bad' ? 'var(--d-bad)' : 'var(--d-ref)'; }
  fmtV(v: number | null | undefined, x: Ind) {
    if (v == null) return '—';
    return x.pct ? (v * 100).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + '%' : v.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }
  /** Brecha con signo, en las unidades del indicador (puntos porcentuales si es porcentaje). */
  fmtBrecha(f: Fila) {
    if (f.brecha == null) return '—';
    const v = f.x.pct ? f.brecha * 100 : f.brecha;
    return (v > 0 ? '+' : '') + v.toLocaleString('es-PE', { maximumFractionDigits: f.x.pct ? 1 : 2 }) + (f.x.pct ? ' pp' : '');
  }
  aceptTxt(f: Fila) {
    const d = f.d;
    if (!d) return '—';
    if (f.x.sentido === 'BANDA' && d.aceptmenos != null) return `${this.fmtV(d.aceptmenos, f.x)} – ${this.fmtV(d.acept, f.x)}`;
    return this.fmtV(d.acept, f.x);
  }
  sentidoTxt(x: Ind) {
    return x.sentido === 'MAYOR' ? '↑ mayor es mejor' : x.sentido === 'MENOR' ? '↓ menor es mejor' : x.sentido === 'BANDA' ? '↔ dentro del rango' : '';
  }
  nombreRed(r: TmiDashRed, corto = false) {
    if (r.instituto) return titleCase(r.nombre);
    return (corto ? '' : 'Red ') + this.redCorta(r.nombre);
  }
  nombreCentro(c: TmiDashCentro) { return titleCase(c.nombre); }
  redCorta(n: string) { return titleCase(n.replace(/^RED (ASISTENCIAL|PRESTACIONAL) /i, '')); }
  private nombreServ(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Otros'; }
  private nombreInd(s: string) {
    const t = s.trim().toLowerCase();
    return (t.charAt(0).toUpperCase() + t.slice(1)).replace(/(?<![a-zñáéíóú])(i|ii|iii|iv|v)(?![a-zñáéíóú])/g, (m) => m.toUpperCase());
  }

  /** Escala común para valor real, estándar y aceptable: de 0 al mayor de ellos con un margen. */
  private barra(d: TmiDashDetalle, x: Ind) {
    const vs = [d.v, d.e, d.acept, d.aceptmenos].filter((v): v is number => v != null && !isNaN(v));
    const lo = Math.min(0, ...vs), hi = Math.max(...vs) * 1.12 || 1;
    const p = (v: number | null) => v == null ? null : Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
    const a = x.sentido === 'BANDA' ? [p(d.aceptmenos), p(d.acept)]
      : x.sentido === 'MENOR' ? [p(d.e), p(d.acept)] : [p(d.acept), p(d.e)];
    const [a0, a1] = a[0] != null && a[1] != null ? [Math.min(a[0], a[1]), Math.max(a[0], a[1])] : [null, null];
    return { v: p(d.v)!, e: p(d.e), a0, a1 };
  }
  /** Línea del acumulado mensual en un recuadro de 80 × 22. */
  private spark(m: (number | null)[]) {
    const vs = m.filter((v): v is number => v != null);
    if (vs.length < 2) return '';
    const lo = Math.min(...vs), hi = Math.max(...vs), r = hi - lo || 1, n = m.length;
    return m.map((v, k) => v == null ? '' : `${(k / (n - 1) * 78 + 1).toFixed(1)},${(20 - (v - lo) / r * 18).toFixed(1)}`)
      .filter(Boolean).join(' ');
  }
}
