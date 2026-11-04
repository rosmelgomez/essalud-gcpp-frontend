import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AyudaFlotante } from '../../Administrativo/ayuda-flotante';
import {
  TmiCalculoService, TmiDashboardDatos, TmiDashCentro, TmiDashDetalle, TmiDashIndicador, TmiDashRed, mensajeError,
} from '../../../../services/tmi';

const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre',
  'noviembre', 'diciembre'];
const COLORES_SERV = ['#007AC9', '#7a5bb5', '#e08a00', '#ED202D', '#00A557', '#00A79C', '#475569'];
const POR_PAGINA = 100;

/** Indicador con los datos que usa la vista: posición en el arreglo det y color del servicio. */
/** acum: el valor real suma de enero al mes (ACUMULADO); si no, es el valor del mes solo (MENSUAL). */
interface Ind extends TmiDashIndicador { i: number; pct: boolean; acum: boolean; color: string; serv: string; }
/** Un indicador en un establecimiento. */
interface Fila {
  key: string; c: TmiDashCentro; x: Ind; d: TmiDashDetalle | null; brecha: number | null;
  /** posiciones (0 a 100) del valor real y del estándar en la barra de comparación */
  bar: { v: number; e: number | null } | null;
  spark: string;
}
interface Col { k: string; t: string; num?: boolean; sm?: boolean; v: (f: Fila) => string | number | null; }
/** Fila de un gráfico de valor real frente a estándar (posiciones 0 a 100). */
interface Par { key: string; label: string; color: string; n: number; v: number | null; e: number | null; pv: number | null; pe: number | null; x: Ind; go?: () => void; }

const titleCase = (s: string) => s.toLowerCase()
  .replace(/(^|[\s(.-])([a-záéíóúñ])/g, (_m, a, b) => a + b.toUpperCase())
  .replace(/(?<=\s)(De|Del|La|Y)\b/g, (w) => w.toLowerCase());
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const esNum = (v: number | null | undefined): v is number => v != null && !isNaN(v);
const cuantil = (a: number[], q: number): number | null => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
  return s[lo] + (s[hi] - s[lo]) * (p - lo);
};
const mediana = (a: number[]) => cuantil(a, 0.5);
/** Escala de 0 (o del mínimo si es negativo) al máximo con un margen; devuelve posiciones 0 a 100. */
const escala = (vals: number[]) => {
  const lo = Math.min(0, ...vals), hi = Math.max(...vals, 0) * 1.12 || 1;
  return (v: number | null) => v == null ? null : Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
};
/** Cuatro marcas del eje entre lo y hi. */
const marcas = (lo: number, hi: number) => [0, 1, 2, 3, 4].map((k) => lo + (hi - lo) * k / 4);
const periodoActual = () => { const h = new Date(); return `${h.getFullYear()}${String(h.getMonth() + 1).padStart(2, '0')}`; };
const etiquetaPeriodo = (p: string) => `${MESES_L[+p.slice(4) - 1]} ${p.slice(0, 4)}`;

/** Dashboard de estándares del TMI: por cada indicador y establecimiento muestra el estándar y el valor real
 *  acumulado, con filtros de periodo, red, establecimiento, servicio e indicador. Sin calificación ni puntajes. */
@Component({
  selector: 'app-tmi-dashbooard-estandar',
  imports: [FormsModule, RouterLink, MatIconModule, NgTemplateOutlet, AyudaFlotante],
  templateUrl: './tmi-dashbooard-estandar.html',
  styleUrl: './tmi-dashbooard-estandar.css',
})
export class TmiDashbooardEstandar implements OnInit {
  private calculoSrv = inject(TmiCalculoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  periodos = signal<{ periodo: string; label: string }[]>([]);
  /** Periodos con resultado calculado (los demás, como el periodo actual sin cálculo, se muestran vacíos). */
  private calculados = new Set<string>();
  calculadosSig = signal<string[]>([]);
  /** Resultados ya descargados por periodo (evita volver a pedirlos). */
  private cache = new Map<string, TmiDashboardDatos>();
  compVersion = signal(0);
  comparando = signal(false);
  progresoComp = signal('');
  periodo = signal('');
  data = signal<TmiDashboardDatos | null>(null);
  cargando = signal(false);
  error = signal('');
  excelCargando = signal(false);
  excelError = signal('');

  // filtros
  red = signal('');
  centro = signal<number | null>(null);
  serv = signal('');
  ind = signal<number | null>(null);
  q = signal('');
  sortKey = signal('');
  sortDir = signal(1);
  limite = signal(POR_PAGINA);
  tip = signal<{ x: number; y: number; title: string; lines: string[] } | null>(null);
  /** Columna del mapa resaltada al pasar por su indicador en la leyenda. */
  colHl = signal<number | null>(null);

  // ---------- datos base ----------
  mesTxt = computed(() => MESES_L[(this.data()?.mes ?? (+this.periodo().slice(4) || 1)) - 1]);
  anio = computed(() => this.data()?.anio ?? +this.periodo().slice(0, 4));
  /** Sin datos: el periodo no está calculado o el resultado no trae establecimientos. */
  sinDatos = computed(() => !this.data() || !this.data()!.centros.length);
  servicioNombres = computed(() => [...new Set((this.data()?.indicadores ?? []).map((x) => x.servicio))]);
  inds = computed<Ind[]>(() => {
    const servs = this.servicioNombres();
    return (this.data()?.indicadores ?? []).map((x, i) => ({
      ...x, nombre: this.nombreInd(x.nombre), i, pct: x.formato === 'PORCENTAJE', acum: x.tipo_calculo === 'ACUMULADO', serv: this.nombreServ(x.servicio),
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

  /** Todos los pares indicador–establecimiento del ámbito (sin la búsqueda). */
  base = computed<Fila[]>(() => {
    const out: Fila[] = [];
    const inds = this.indsAmbito(), conNa = !!this.cen();
    for (const c of this.centrosAmbito()) {
      for (const x of inds) {
        const d = c.det[x.i] ?? null;
        if (!d && !conNa) continue;
        out.push({ key: `${c.cod}-${x.i}`, c, x, d, brecha: d && d.e != null ? d.v - d.e : null,
          bar: d ? this.barra(d) : null, spark: d ? this.spark(d.m) : '' });
      }
    }
    return out;
  });
  conValor = computed(() => this.base().filter((f) => f.d));

  tiles = computed(() => {
    const fs = this.conValor(), x = this.indSel(), vacio = this.sinDatos();
    const n = (v: number) => vacio ? '—' : v.toLocaleString('es-PE');
    const nCen = new Set(fs.map((f) => f.c.cod)).size, nInd = new Set(fs.map((f) => f.x.i)).size;
    const conEst = fs.filter((f) => f.d!.e != null).length;
    const t = [
      { label: 'Establecimientos', value: n(nCen), note: vacio ? 'Sin datos para el periodo.' : this.cen() ? 'Establecimiento elegido.' : this.red() ? `Con valor real en ${this.ambito()}.` : 'Con valor real en todo el país.' },
      { label: 'Indicadores', value: n(nInd), note: vacio ? 'Sin datos para el periodo.' : x ? 'Indicador elegido.' : this.serv() ? `De ${this.nombreServ(this.serv()).toLowerCase()}.` : 'Con valor real en el ámbito.' },
      { label: 'Valores reales', value: n(fs.length), note: vacio ? 'Sin datos para el periodo.' : `Combinaciones establecimiento–indicador con dato; ${conEst.toLocaleString('es-PE')} tienen estándar.` },
    ];
    if (x) {
      const uno = fs.length === 1;
      const v = mediana(fs.map((f) => f.d!.v).filter(esNum)), e = mediana(fs.map((f) => f.d!.e).filter(esNum));
      t.push(
        { label: uno ? 'Valor real' : 'Valor real típico', value: vacio ? '—' : this.fmtV(v, x),
          note: `${x.acum ? 'Lo logrado de enero a ' + this.mesTxt() + ' (acumulado)' : 'Lo logrado solo en ' + this.mesTxt() + ' (mensual)'}${uno ? '' : '; valor del medio de los establecimientos'}.` },
        { label: uno ? 'Estándar' : 'Estándar típico', value: vacio ? '—' : this.fmtV(e, x),
          note: `La meta. ${this.sentidoTxt(x) ? 'En este indicador: ' + this.sentidoTxt(x) + '.' : ''}` },
        { label: 'Brecha', value: vacio || v == null || e == null ? '—' : this.fmtDif(v - e, x),
          note: 'Valor real − estándar: + está por encima de la meta, − por debajo.' },
      );
    }
    return t;
  });

  lead = computed(() => {
    if (this.sinDatos()) return `Todavía no hay datos para ${this.mesTxt()} ${this.anio()}.`;
    const fs = this.conValor(), x = this.indSel();
    const que = x ? `del indicador «${x.nombre}»` : this.serv() ? `de los indicadores de ${this.nombreServ(this.serv()).toLowerCase()}` : 'de los indicadores';
    return `${this.ambito()}, ${this.mesTxt()} ${this.anio()}: valor real frente al estándar ${que} `
      + `en ${fs.length.toLocaleString('es-PE')} combinaciones indicador–establecimiento.`;
  });

  // ---------- gráficos ----------
  /** Por indicador: mediana del valor real y del estándar en el ámbito, cada fila en su propia escala. */
  porIndicador = computed<Par[]>(() => {
    if (this.indSel()) return [];
    const m = new Map<number, Fila[]>();
    this.conValor().forEach((f) => { if (!m.has(f.x.i)) m.set(f.x.i, []); m.get(f.x.i)!.push(f); });
    return [...m.values()].map((fs) => {
      const x = fs[0].x, v = mediana(fs.map((f) => f.d!.v).filter(esNum)), e = mediana(fs.map((f) => f.d!.e).filter(esNum));
      const p = escala([v, e].filter(esNum));
      return { key: String(x.i), label: x.nombre, color: x.color, n: fs.length, v, e, pv: p(v), pe: p(e), x, go: () => this.setInd(x.i) };
    }).sort((a, b) => a.x.i - b.x.i);
  });

  /** Por red (indicador elegido, nivel nacional): mediana del valor real y del estándar, en escala común. */
  porRed = computed<Par[]>(() => {
    const x = this.indSel();
    if (!x || this.red() || this.cen()) return [];
    const m = new Map<string, Fila[]>();
    this.conValor().forEach((f) => { if (!m.has(f.c.red)) m.set(f.c.red, []); m.get(f.c.red)!.push(f); });
    return this.pares([...m.entries()].map(([red, fs]) => {
      const rr = this.redPorNombre().get(red);
      return { key: red, label: rr ? this.nombreRed(rr, true) : this.redCorta(red), fs, go: () => this.setRed(red) };
    }), x).sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));
  });

  /** Evolución del valor real acumulado de enero al mes (mediana y rango intercuartil si hay varios establecimientos). */
  evolucion = computed(() => {
    const x = this.indSel(), fs = this.conValor();
    if (!x || !fs.length) return null;
    const nMes = Math.max(this.data()?.mes ?? 1, ...fs.map((f) => f.d!.m.length));
    const meses = Array.from({ length: nMes }, (_, k) => {
      const vs = fs.map((f) => f.d!.m[k]).filter(esNum);
      return { k, med: mediana(vs), q1: cuantil(vs, 0.25), q3: cuantil(vs, 0.75), n: vs.length };
    });
    const e = mediana(fs.map((f) => f.d!.e).filter(esNum));
    const todos = [...meses.flatMap((m) => [m.med, m.q1, m.q3]), e].filter(esNum);
    if (!todos.length) return null;
    const W = 800, H = 250, L = 64, R = 18, T = 14, B = 30;
    const mn = Math.min(...todos), mx = Math.max(...todos), pad = (mx - mn) * 0.2 || Math.abs(mx) * 0.1 || 1;
    const lo = mn >= 0 ? Math.max(0, mn - pad) : mn - pad, hi = mx + pad;
    const X = (k: number) => nMes === 1 ? L + (W - L - R) / 2 : L + k / (nMes - 1) * (W - L - R);
    const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const con = meses.filter((m) => m.med != null);
    const multi = fs.length > 1;
    const banda = multi && con.length > 1
      ? [...con.map((m) => `${X(m.k)},${Y(m.q3!)}`), ...[...con].reverse().map((m) => `${X(m.k)},${Y(m.q1!)}`)].join(' ') : '';
    return {
      W, H, L, R, T, B, multi, banda, e, eY: e != null ? Y(e) : null,
      linea: con.map((m) => `${X(m.k)},${Y(m.med!)}`).join(' '),
      ticks: marcas(lo, hi).map((v) => ({ y: Y(v), label: this.fmtV(v, x) })),
      puntos: meses.map((m) => ({ ...m, x: X(m.k), y: m.med != null ? Y(m.med) : null, label: MESES_L[m.k].slice(0, 3) })),
    };
  });

  /** Valor real de cada establecimiento (indicador elegido), de mayor a menor, con su estándar. */
  distribucion = computed(() => {
    const x = this.indSel();
    if (!x || this.cen()) return null;
    const fs = [...this.conValor()].sort((a, b) => b.d!.v - a.d!.v);
    const vals = fs.flatMap((f) => [f.d!.v, f.d!.e]).filter(esNum);
    if (!vals.length) return null;
    const W = 800, H = 230, L = 64, R = 10, T = 12, B = 12;
    const lo = Math.min(0, ...vals), hi = Math.max(...vals, 0) * 1.1 || 1;
    const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const bw = (W - L - R) / fs.length, gap = bw > 4 ? 1 : 0, y0 = Y(0);
    const barras = fs.map((f, k) => {
      const yv = Y(f.d!.v);
      return { f, x: L + k * bw, w: Math.max(bw - gap, 0.6), y: Math.min(yv, y0), h: Math.max(Math.abs(y0 - yv), 0.8) };
    });
    const est = fs.map((f, k) => f.d!.e == null ? '' : `M${(L + k * bw).toFixed(2)},${Y(f.d!.e).toFixed(2)}h${bw.toFixed(2)}`).join('');
    return { W, H, L, R, T, B, barras, est, y0, ticks: marcas(lo, hi).map((v) => ({ y: Y(v), label: this.fmtV(v, x) })) };
  });

  /** Por tipo de establecimiento (indicador elegido): mediana del valor real y del estándar, en escala común. */
  porTipo = computed<Par[]>(() => {
    const x = this.indSel();
    if (!x || this.cen()) return [];
    const m = new Map<string, Fila[]>();
    this.conValor().forEach((f) => { const t = f.c.tipo || 'Sin tipo'; if (!m.has(t)) m.set(t, []); m.get(t)!.push(f); });
    if (m.size < 2) return [];
    return this.pares([...m.entries()].map(([t, fs]) => ({ key: t, label: t, fs })), x)
      .sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));
  });

  /** Dispersión: estándar (eje X) frente a valor real (eje Y), un punto por establecimiento. */
  dispersion = computed(() => {
    const x = this.indSel();
    if (!x || this.cen()) return null;
    const fs = this.conValor().filter((f) => f.d!.e != null);
    if (fs.length < 2) return null;
    const W = 800, H = 300, L = 64, R = 16, T = 12, B = 34;
    const vals = fs.flatMap((f) => [f.d!.v, f.d!.e!]);
    const ex = this.eje(vals, L, W - R, x, false), ey = this.eje(vals, H - B, T, x, false);
    const unicoE = new Set(fs.map((f) => f.d!.e)).size === 1;
    // con un solo estándar los puntos se separan un poco en horizontal para que no se tapen
    const jit = (k: number) => unicoE ? ((k * 37) % 41 - 20) * 0.9 : 0;
    return {
      W, H, L, R, T, B, ex, ey, unicoE,
      diag: { x1: ex.f(ex.lo), y1: ey.f(ex.lo), x2: ex.f(ex.hi), y2: ey.f(ex.hi) },
      pts: fs.map((f, k) => ({ f, cx: ex.f(f.d!.e!) + jit(k), cy: ey.f(f.d!.v) })),
    };
  });

  /** Histograma del valor real (indicador elegido) con la mediana del estándar. */
  histograma = computed(() => {
    const x = this.indSel();
    if (!x || this.cen()) return null;
    const vs = this.conValor().map((f) => f.d!.v).filter(esNum);
    if (vs.length < 2) return null;
    const e = mediana(this.conValor().map((f) => f.d!.e).filter(esNum));
    let mn = Math.min(...vs), mx = Math.max(...vs);
    if (mn === mx) mx = mn + (Math.abs(mn) || 1) * 0.1;
    const nb = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(vs.length)))), w = (mx - mn) / nb;
    const bins = Array.from({ length: nb }, (_, k) => ({ a: mn + k * w, b: mn + (k + 1) * w, n: 0 }));
    vs.forEach((v) => bins[Math.min(nb - 1, Math.floor((v - mn) / w))].n++);
    const W = 800, H = 230, L = 48, R = 14, T = 12, B = 34;
    const lo = e != null ? Math.min(mn, e) : mn, hi = e != null ? Math.max(mx, e) : mx;
    const X = (v: number) => L + (v - lo) / (hi - lo || 1) * (W - L - R);
    const nmax = Math.max(...bins.map((b) => b.n)) || 1;
    const Y = (n: number) => H - B - n / nmax * (H - T - B);
    return {
      W, H, L, R, T, B, e, eX: e != null ? X(e) : null,
      barras: bins.map((b) => ({ ...b, x: X(b.a) + 0.5, w: Math.max(X(b.b) - X(b.a) - 1, 1), y: Y(b.n), h: H - B - Y(b.n) })),
      ticksY: [...new Set([0, Math.round(nmax / 2), nmax])].map((n) => ({ y: Y(n), label: n })),
      ticksX: marcas(lo, hi).map((v) => ({ x: X(v), label: this.fmtV(v, x) })),
    };
  });

  /** Los establecimientos con valores más altos y más bajos (indicador elegido). */
  extremos = computed(() => {
    const x = this.indSel();
    if (!x || this.cen()) return null;
    const fs = [...this.conValor()].sort((a, b) => b.d!.v - a.d!.v);
    if (fs.length < 4) return null;
    const k = Math.min(10, Math.floor(fs.length / 2));
    const top = fs.slice(0, k), bot = fs.slice(-k).reverse();
    const p = escala([...top, ...bot].flatMap((f) => [f.d!.v, f.d!.e]).filter(esNum));
    const fila = (f: Fila) => ({ f, pv: p(f.d!.v), pe: p(f.d!.e) });
    return { k, top: top.map(fila), bot: bot.map(fila) };
  });

  /** Brecha (valor real menos estándar) de cada establecimiento, de mayor a menor. */
  brechas = computed(() => {
    const x = this.indSel();
    if (!x || this.cen()) return null;
    const fs = this.conValor().filter((f) => f.brecha != null).sort((a, b) => b.brecha! - a.brecha!);
    if (fs.length < 2) return null;
    const W = 800, H = 230, L = 64, R = 10, T = 12, B = 12;
    const bs = fs.map((f) => f.brecha!);
    let lo = Math.min(0, ...bs) * 1.1, hi = Math.max(0, ...bs) * 1.1;
    if (lo === hi) hi = 1;
    const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const bw = (W - L - R) / fs.length, gap = bw > 4 ? 1 : 0, y0 = Y(0);
    return {
      W, H, L, R, T, B, y0,
      arriba: bs.filter((b) => b > 0).length, debajo: bs.filter((b) => b < 0).length, igual: bs.filter((b) => b === 0).length,
      barras: fs.map((f, k) => {
        const y = Y(f.brecha!);
        return { f, pos: f.brecha! >= 0, x: L + k * bw, w: Math.max(bw - gap, 0.6), y: Math.min(y, y0), h: Math.max(Math.abs(y0 - y), 0.8) };
      }),
      ticks: marcas(lo, hi).map((v) => ({ y: Y(v), label: this.fmtDif(v, x) })),
    };
  });

  /** Con un establecimiento elegido: mini gráfico de la evolución de cada indicador. */
  mini = computed(() => {
    if (!this.cen() || this.indSel()) return [];
    const W = 220, H = 64, P = 6;
    return this.conValor().map((f) => {
      const m = f.d!.m, vals = [...m.filter(esNum), f.d!.e].filter(esNum);
      const mn = Math.min(...vals), mx = Math.max(...vals), pad = (mx - mn) * 0.15 || Math.abs(mx) * 0.1 || 1;
      const lo = mn - pad, hi = mx + pad, n = m.length;
      const X = (k: number) => n <= 1 ? W / 2 : P + k / (n - 1) * (W - 2 * P);
      const Y = (v: number) => P + (1 - (v - lo) / (hi - lo)) * (H - 2 * P);
      const pts = m.map((v, k) => v == null ? null : { x: X(k), y: Y(v) }).filter((q): q is { x: number; y: number } => !!q);
      return { f, W, H, linea: pts.map((q) => `${q.x},${q.y}`).join(' '), ult: pts[pts.length - 1] ?? null,
        eY: f.d!.e != null ? Y(f.d!.e) : null };
    });
  });

  /** Con un establecimiento elegido: su valor real frente a la mediana de su red y la nacional. */
  comparaCentro = computed(() => {
    const c = this.cen();
    if (!c) return [];
    const red = this.centrosDeRed().get(c.red) ?? [], todos = this.centros();
    return this.indsAmbito().flatMap((x) => {
      const d = c.det[x.i];
      if (!d) return [];
      const mr = mediana(red.map((o) => o.det[x.i]?.v).filter(esNum)), mn = mediana(todos.map((o) => o.det[x.i]?.v).filter(esNum));
      const p = escala([d.v, d.e, mr, mn].filter(esNum));
      return [{ x, v: d.v, e: d.e, mr, mn, pv: p(d.v), pe: p(d.e), pr: p(mr), pn: p(mn) }];
    });
  });

  /** Mapa de calor: redes (o establecimientos de la red elegida) × indicadores, por la diferencia relativa al estándar. */
  mapa = computed(() => {
    if (this.indSel() || this.cen()) return null;
    const inds = this.indsAmbito();
    const grupos = this.red()
      ? (this.centrosDeRed().get(this.red()) ?? []).map((c) => ({ key: String(c.cod), label: titleCase(c.nombre), cs: [c], cod: c.cod as number | null, red: c.red }))
      : this.redes().map((r) => ({ key: r.nombre, label: this.nombreRed(r, true), cs: this.centrosDeRed().get(r.nombre) ?? [], cod: null as number | null, red: r.nombre }));
    const filas = grupos.map((g) => ({
      ...g, celdas: inds.map((x) => {
        const ds = g.cs.map((c) => c.det[x.i]).filter((d): d is TmiDashDetalle => !!d);
        const v = mediana(ds.map((d) => d.v).filter(esNum)), e = mediana(ds.map((d) => d.e).filter(esNum));
        const rel = v != null && e != null && e !== 0 ? (v - e) / Math.abs(e) : null;
        const t = rel == null ? 0 : Math.min(1, Math.abs(rel) / 0.5);
        return {
          x, v, e, n: ds.length, rel,
          bg: rel == null ? 'transparent' : rel >= 0 ? `rgba(0, 122, 201, ${0.08 + 0.72 * t})` : `rgba(224, 138, 0, ${0.08 + 0.72 * t})`,
          fg: t > 0.55 ? '#fff' : 'var(--d-fg)',
          txt: rel == null ? (ds.length ? '·' : '') : (rel > 0 ? '+' : '') + Math.round(rel * 100) + '%',
        };
      }),
    })).filter((f) => f.celdas.some((c) => c.n));
    // ejemplo real para la explicación: el primer cuadro con valor real y estándar
    let ejemplo: { fila: string; x: Ind; v: number; e: number; n: number; rel: number } | null = null;
    for (const f of filas) {
      const c = f.celdas.find((q) => q.rel != null && q.n > 0);
      if (c) { ejemplo = { fila: f.label, x: c.x, v: c.v!, e: c.e!, n: c.n, rel: c.rel! }; break; }
    }
    return { inds, filas, ejemplo };
  });

  /** Comparación entre periodos calculados (indicador elegido, en el ámbito actual). */
  serie = computed(() => {
    this.compVersion();
    const x = this.indSel();
    if (!x) return null;
    const cods = new Set(this.centrosAmbito().map((c) => c.cod));
    // solo los periodos del mismo año hasta el elegido (no se muestran meses posteriores al filtro)
    const ps = this.periodosSerie(this.calculadosSig());
    const puntos = ps.map((p) => {
      const d = this.cache.get(p);
      const k = d ? d.indicadores.findIndex((i) => i.id === x.id) : -1;
      const ds = d && k >= 0 ? d.centros.filter((c) => cods.has(c.cod)).map((c) => c.det[k]).filter((q): q is TmiDashDetalle => !!q) : [];
      return { p, label: `${MESES_L[+p.slice(4) - 1].slice(0, 3)} ${p.slice(2, 4)}`, cargado: !!d, n: ds.length,
        v: mediana(ds.map((q) => q.v).filter(esNum)), e: mediana(ds.map((q) => q.e).filter(esNum)) };
    });
    const faltan = puntos.filter((q) => !q.cargado).length;
    // se dibuja con los periodos que ya tengan valor; los que faltan cargar quedan en el eje sin punto
    const vals = puntos.flatMap((q) => [q.v, q.e]).filter(esNum);
    if (!puntos.some((q) => q.v != null)) return { faltan, total: ps.length, g: null };
    const W = 800, H = 230, L = 64, R = 18, T = 14, B = 30;
    const ey = this.eje(vals, H - B, T, x, false);
    const X = (k: number) => puntos.length === 1 ? L + (W - L - R) / 2 : L + k / (puntos.length - 1) * (W - L - R);
    const linea = (key: 'v' | 'e') => {
      const pts = puntos.map((q, k) => q[key] == null ? null : { x: X(k), y: ey.f(q[key]!) }).filter((q) => q != null);
      // un solo estándar: línea de referencia de lado a lado
      if (key === 'e' && pts.length === 1) return `${L},${pts[0].y} ${W - R},${pts[0].y}`;
      return pts.map((q) => `${q.x},${q.y}`).join(' ');
    };
    return {
      faltan, total: ps.length,
      g: { W, H, L, R, T, B, ey, lineaV: linea('v'), lineaE: linea('e'),
        puntos: puntos.map((q, k) => ({ ...q, x: X(k), y: q.v != null ? ey.f(q.v) : null })) },
    };
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
      { k: 'v', t: 'Valor real', num: true, v: (f) => f.d?.v ?? null },
      { k: 'b', t: 'Brecha', num: true, sm: true, v: (f) => f.brecha });
    return cols;
  });

  filas = computed(() => {
    const q = norm(this.q().trim());
    const col = this.columnas().find((c) => c.k === this.sortKey()) ?? this.columnas()[0];
    const dir = this.sortDir();
    return this.base()
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
    this.cargando.set(true);
    this.calculoSrv.getPeriodosDashboard().subscribe({
      next: (r) => {
        const calc = (r ?? []).map((p) => String(p.periodo));
        this.calculados = new Set(calc);
        this.calculadosSig.set(calc);
        // el periodo actual siempre está en la lista; si no está calculado se muestra vacío
        const actual = periodoActual();
        const ps = [...new Set([actual, ...calc])].sort().reverse().map((p) => ({ periodo: p, label: etiquetaPeriodo(p) }));
        this.periodos.set(ps);
        const pedido = qp.get('periodo');
        this.cargar(ps.find((p) => p.periodo === pedido)?.periodo ?? actual);
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
    this.calculoSrv.getDashboard(periodo).subscribe({
      next: (d) => {
        this.cache.set(periodo, d);
        this.compVersion.update((v) => v + 1);
        if (this.periodo() === periodo) this.aplicar(d);
      },
      error: (e) => { this.data.set(null); this.cargando.set(false); this.error.set(mensajeError(e, 'No se pudo cargar el resultado del periodo.')); },
    });
  }

  private aplicar(d: TmiDashboardDatos) {
    this.data.set(d);
    this.cargando.set(false);
    // filtros que no existen en este periodo
    if (this.red() && !this.redPorNombre().has(this.red())) this.red.set('');
    if (this.centro() != null && !this.centroPorCod().has(this.centro()!)) this.centro.set(null);
    if (this.serv() && !this.servicioNombres().includes(this.serv())) this.serv.set('');
    if (this.ind() != null && !this.inds()[this.ind()!]) this.ind.set(null);
    this.guardarFiltros();
  }

  /** Periodos calculados del año del periodo elegido, desde enero hasta el elegido (ordenados). */
  private periodosSerie(calc: string[]) {
    const sel = this.periodo();
    return calc.filter((p) => p <= sel && p.slice(0, 4) === sel.slice(0, 4)).sort();
  }

  /** Descarga, uno por uno, los periodos calculados que faltan para la comparación entre periodos. */
  compararPeriodos() {
    const faltan = this.periodosSerie([...this.calculados]).filter((p) => !this.cache.has(p)).reverse();
    if (!faltan.length || this.comparando()) return;
    this.comparando.set(true);
    const sig = (k: number) => {
      if (k >= faltan.length) { this.comparando.set(false); this.progresoComp.set(''); return; }
      this.progresoComp.set(`Cargando ${etiquetaPeriodo(faltan[k])} (${k + 1} de ${faltan.length})…`);
      this.calculoSrv.getDashboard(faltan[k]).subscribe({
        next: (d) => { this.cache.set(faltan[k], d); this.compVersion.update((v) => v + 1); sig(k + 1); },
        error: () => sig(k + 1),
      });
    };
    sig(0);
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
  limpiar() {
    this.red.set(''); this.centro.set(null); this.serv.set(''); this.ind.set(null); this.q.set('');
    this.guardarFiltros();
  }
  ordenar(k: string, esNumero: boolean) {
    if (this.sortKey() === k) this.sortDir.set(-this.sortDir());
    else { this.sortKey.set(k); this.sortDir.set(esNumero ? -1 : 1); }
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
        ind: this.ind() },
    });
  }

  /** Excel del periodo (el mismo de Administración), armado con el resultado guardado. */
  descargarExcel() {
    if (!this.periodo() || this.excelCargando()) return;
    this.excelCargando.set(true);
    this.excelError.set('');
    this.calculoSrv.descargarExcelDashboard(this.periodo()).subscribe({
      next: () => this.excelCargando.set(false),
      error: (e: Error) => { this.excelCargando.set(false); this.excelError.set(e.message); },
    });
  }

  descargarCsv() {
    const esc = (v: unknown) => { const t = v == null ? '' : String(v); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const n = (v: number | null | undefined) => v == null ? '' : String(v).replace('.', ',');
    const cab = ['Código', 'Establecimiento', 'Red', 'Nivel', 'Tipo', 'Servicio', 'Cód. indicador', 'Indicador', 'Sentido', 'Formato',
      'Estándar', 'Valor real', 'Brecha'];
    const lineas = [cab.map(esc).join(';'), ...this.filas().map((f) => [f.c.cod, titleCase(f.c.nombre), f.c.red, f.c.nivel, f.c.tipo,
      f.x.serv, f.x.codigo, f.x.nombre, f.x.sentido, f.x.formato, n(f.d?.e), n(f.d?.v), n(f.brecha)].map(esc).join(';'))];
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
    this.mostrarTip(ev, f.x.nombre, [titleCase(f.c.nombre), `${f.x.acum ? 'Valor real acumulado de enero a ' : 'Valor real de '}${mes}: ${this.fmtV(f.d.v, f.x)}`,
      `Estándar: ${this.fmtV(f.d.e, f.x)} · Brecha: ${this.fmtBrecha(f)}`, ...(m.length > 1 ? [m.join(' · ')] : [])]);
  }
  tipPar(ev: MouseEvent, p: Par, cuenta: string) {
    this.mostrarTip(ev, p.label, [`Valor real: ${this.fmtV(p.v, p.x)}`, `Estándar: ${this.fmtV(p.e, p.x)}`,
      `Brecha: ${p.v != null && p.e != null ? this.fmtDif(p.v - p.e, p.x) : '—'}`,
      p.n > 1 ? `Valor típico (mediana) de ${p.n.toLocaleString('es-PE')} ${cuenta}.` : '']);
  }
  tipMes(ev: MouseEvent, m: { k: number; med: number | null; q1: number | null; q3: number | null; n: number }) {
    const x = this.indSel()!, ev2 = this.evolucion();
    const lineas = [`${ev2?.multi ? 'Valor real típico (mediana)' : 'Valor real'}: ${this.fmtV(m.med, x)}`];
    if (ev2?.multi) lineas.push(`La mitad de los establecimientos está entre ${this.fmtV(m.q1, x)} – ${this.fmtV(m.q3, x)}`, `${m.n.toLocaleString('es-PE')} establecimientos con valor.`);
    lineas.push(`Estándar: ${this.fmtV(ev2?.e, x)}`);
    this.mostrarTip(ev, x.acum ? `Acumulado de enero a ${MESES_L[m.k]}` : `Valor de ${MESES_L[m.k]}`, lineas);
  }

  tipBin(ev: MouseEvent, b: { a: number; b: number; n: number }) {
    const x = this.indSel()!;
    this.mostrarTip(ev, `${this.fmtV(b.a, x)} – ${this.fmtV(b.b, x)}`, [`${b.n.toLocaleString('es-PE')} establecimientos`]);
  }
  tipCelda(ev: MouseEvent, fila: { label: string }, c: { x: Ind; v: number | null; e: number | null; n: number; rel: number | null }) {
    const varios = c.n > 1;
    this.mostrarTip(ev, c.x.nombre, [fila.label,
      `${varios ? 'Valor real típico' : 'Valor real'} (${this.calculoTxt(c.x)}): ${this.fmtV(c.v, c.x)}`,
      `${varios ? 'Estándar típico' : 'Estándar'}: ${this.fmtV(c.e, c.x)}`,
      c.rel == null || c.v == null || c.e == null ? 'Sin valor real o sin estándar: no se calcula.'
        : `Cálculo: (${this.fmtV(c.v, c.x)} − ${this.fmtV(c.e, c.x)}) ÷ ${this.fmtV(c.e, c.x)} = ${this.fmtRel(c.rel)}`,
      varios ? `«Típico» = valor del medio (mediana) de sus ${c.n.toLocaleString('es-PE')} establecimientos con dato.` : '']);
  }
  irCelda(fila: { red: string; cod: number | null }, c: { x: Ind; n: number }) {
    if (!c.n) return;
    if (fila.cod != null) this.setCentro(fila.cod); else this.setRed(fila.red);
    this.setInd(c.x.i);
  }
  tipComp(ev: MouseEvent, r: { x: Ind; v: number; e: number | null; mr: number | null; mn: number | null }) {
    this.mostrarTip(ev, r.x.nombre, [`${this.ambito()}: ${this.fmtV(r.v, r.x)}`, `Estándar: ${this.fmtV(r.e, r.x)}`,
      `Típico de su red: ${this.fmtV(r.mr, r.x)}`, `Típico del país: ${this.fmtV(r.mn, r.x)}`]);
  }
  tipPeriodo(ev: MouseEvent, q: { p: string; v: number | null; e: number | null; n: number; cargado: boolean }) {
    const x = this.indSel()!;
    this.mostrarTip(ev, etiquetaPeriodo(q.p), !q.cargado ? ['Sin cargar.'] : q.v == null ? ['Sin datos.'] : [
      `${q.n > 1 ? 'Valor real típico (mediana)' : 'Valor real'}: ${this.fmtV(q.v, x)}`, `Estándar: ${this.fmtV(q.e, x)}`,
      `${q.n.toLocaleString('es-PE')} establecimientos.`]);
  }

  // ---------- utilidades ----------
  fmtV(v: number | null | undefined, x: Ind) {
    if (v == null) return '—';
    return x.pct ? (v * 100).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + '%' : v.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }
  /** Diferencia con signo, en las unidades del indicador (puntos porcentuales si es porcentaje). */
  fmtDif(dif: number, x: Ind) {
    const v = x.pct ? dif * 100 : dif;
    return (v > 0 ? '+' : '') + v.toLocaleString('es-PE', { maximumFractionDigits: x.pct ? 1 : 2 }) + (x.pct ? ' pp' : '');
  }
  /** Diferencia relativa (proporción) como porcentaje con signo: 0,12 → +12%. */
  fmtRel(rel: number) {
    return (rel > 0 ? '+' : '') + (rel * 100).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + '%';
  }
  fmtBrecha(f: Fila) { return f.brecha == null ? '—' : this.fmtDif(f.brecha, f.x); }
  indsMapa(inds: Ind[], servicio: string) { return inds.filter((x) => x.servicio === servicio); }
  /** Cómo se calcula el valor real del indicador, en palabras simples. */
  calculoTxt(x: Ind, largo = false) {
    if (!largo) return x.acum ? 'acumulado' : 'mensual';
    return x.acum ? `acumulado: suma de enero a ${this.mesTxt()}` : `mensual: solo el valor de ${this.mesTxt()}`;
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

  /** Pares valor real / estándar (medianas) de varios grupos, en una escala común. */
  private pares(grupos: { key: string; label: string; fs: Fila[]; go?: () => void }[], x: Ind): Par[] {
    const filas = grupos.map((g) => ({ ...g, v: mediana(g.fs.map((f) => f.d!.v).filter(esNum)), e: mediana(g.fs.map((f) => f.d!.e).filter(esNum)) }));
    const p = escala(filas.flatMap((r) => [r.v, r.e]).filter(esNum));
    return filas.map((r) => ({ key: r.key, label: r.label, color: 'var(--d-accent)', n: r.fs.length, v: r.v, e: r.e, pv: p(r.v), pe: p(r.e), x, go: r.go }));
  }
  /** Eje lineal de a a b (píxeles) para los valores; sin cero obligatorio si cero = false. */
  private eje(vals: number[], a: number, b: number, x: Ind, cero = true) {
    const mn = Math.min(...vals), mx = Math.max(...vals);
    let lo: number, hi: number;
    if (cero) { lo = Math.min(0, mn); hi = Math.max(mx, 0) * 1.1 || 1; }
    else { const pad = (mx - mn) * 0.15 || Math.abs(mx) * 0.1 || 1; lo = mn >= 0 ? Math.max(0, mn - pad) : mn - pad; hi = mx + pad; }
    const f = (v: number) => a + (v - lo) / (hi - lo) * (b - a);
    return { lo, hi, f, ticks: marcas(lo, hi).map((v) => ({ p: f(v), label: this.fmtV(v, x) })) };
  }

  /** Escala común para valor real y estándar. */
  private barra(d: TmiDashDetalle) {
    const p = escala([d.v, d.e].filter(esNum));
    return { v: p(d.v)!, e: p(d.e) };
  }
  /** Línea del acumulado mensual en un recuadro de 80 × 22. */
  private spark(m: (number | null)[]) {
    const vs = m.filter(esNum);
    if (vs.length < 2) return '';
    const lo = Math.min(...vs), hi = Math.max(...vs), r = hi - lo || 1, n = m.length;
    return m.map((v, k) => v == null ? '' : `${(k / (n - 1) * 78 + 1).toFixed(1)},${(20 - (v - lo) / r * 18).toFixed(1)}`)
      .filter(Boolean).join(' ');
  }
}
