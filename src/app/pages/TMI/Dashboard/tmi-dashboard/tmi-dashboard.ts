import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AyudaFlotante } from '../../Administrativo/ayuda-flotante';
import {
  TmiCalculoService, TmiDashboardDatos, TmiDashCentro, TmiDashDetalle, TmiDashIndicador, TmiDashRed, mensajeError,
} from '../../../../services/tmi';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre',
  'noviembre', 'diciembre'];
const COLORES_SERV = ['#007AC9', '#7a5bb5', '#e08a00', '#ED202D', '#00A557', '#00A79C', '#475569'];

type Banda = 'ok' | 'warn' | 'bad' | '';
/** Indicador con los datos que usa la vista: posición en los arreglos pts/det, código corto y color del servicio. */
interface Ind extends TmiDashIndicador { i: number; ab: string; pct: boolean; color: string; }
interface Tile { label: string; value: string; note?: string; cls?: Banda; }
interface Seg { t: string; b?: boolean; }
interface Serie { name: string; vals: (number | null)[]; color: string; dash?: string; main?: boolean; }
interface Grafico {
  W: number; H: number; grid: { y: number; label: string }[]; xl: { x: number; label: string }[];
  paths: { d: string; color: string; dash?: string; main?: boolean }[]; dots: { cx: number; cy: number; color: string }[];
  refY: number | null; bandas: number[]; x0: number; x1: number; y0: number; y1: number;
  xs: number[]; series: Serie[]; ref: number | null; refName: string; fmt: (v: number | null) => string;
}
interface Distrib { 5: number; 3: number; 1: number; n: number; }

const avg = (a: (number | null | undefined)[]) => {
  const n = a.filter((v): v is number => v != null && !isNaN(v));
  return n.length ? n.reduce((s, v) => s + v, 0) / n.length : null;
};
const num = (v: number | null | undefined, d: number) =>
  v == null || isNaN(v) ? '—' : v.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v: number | null | undefined) =>
  v == null || isNaN(v) ? '—' : (v * 100).toLocaleString('es-PE', { maximumFractionDigits: 0 }) + '%';
const band20 = (v: number | null | undefined): Banda => v == null ? '' : v >= 16 ? 'ok' : v >= 12 ? 'warn' : 'bad';
const band5 = (v: number | null | undefined): Banda => v == null ? '' : v >= 4 ? 'ok' : v >= 3 ? 'warn' : 'bad';
const BAND_WORD: Record<string, string> = { ok: 'Nivel alto', warn: 'Nivel medio', bad: 'Nivel bajo', '': 'Sin dato' };
const titleCase = (s: string) => s.toLowerCase()
  .replace(/(^|[\s(.-])([a-záéíóúñ])/g, (_m, a, b) => a + b.toUpperCase())
  .replace(/(?<=\s)(De|Del|La|Y)\b/g, (w) => w.toLowerCase());
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/** Dashboard del resultado final del TMI: puntaje nacional, por red, por establecimiento y por indicador,
 *  con filtros de periodo, red, establecimiento e indicador. */
@Component({
  selector: 'app-tmi-dashboard',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, MatIconModule, AyudaFlotante],
  templateUrl: './tmi-dashboard.html',
  styleUrl: './tmi-dashboard.css',
})
export class TmiDashboard implements OnInit {
  private calculoSrv = inject(TmiCalculoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly bandWord = BAND_WORD;
  periodos = signal<{ periodo: string; label: string }[]>([]);
  periodo = signal('');
  data = signal<TmiDashboardDatos | null>(null);
  cargando = signal(false);
  error = signal('');
  excelCargando = signal(false);
  excelError = signal('');

  // filtros
  red = signal('');
  centro = signal<number | null>(null);
  ind = signal<number | null>(null);
  q = signal('');
  sortKey = signal('nota');
  sortDir = signal(-1);
  tip = signal<{ x: number; y: number; title: string; lines: string[] } | null>(null);

  // ---------- datos base ----------
  mesTxt = computed(() => MESES_L[(this.data()?.mes ?? 1) - 1]);
  meses = computed(() => MESES.slice(0, this.data()?.mes ?? 0));
  inds = computed<Ind[]>(() => {
    const d = this.data();
    if (!d) return [];
    const servs = this.servicioNombres();
    const cuenta: Record<string, number> = {};
    return d.indicadores.map((x, i) => {
      const s = servs.indexOf(x.servicio);
      cuenta[x.servicio] = (cuenta[x.servicio] ?? 0) + 1;
      const ab = (x.servicio || 'I').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() + cuenta[x.servicio];
      return { ...x, nombre: this.nombreInd(x.nombre), i, ab, pct: x.formato === 'PORCENTAJE', color: COLORES_SERV[s % COLORES_SERV.length] };
    });
  });
  servicioNombres = computed(() => [...new Set((this.data()?.indicadores ?? []).map((x) => x.servicio))]);
  servicios = computed(() => this.servicioNombres().map((nombre, k) => ({
    nombre: this.nombreServ(nombre), color: COLORES_SERV[k % COLORES_SERV.length],
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
  redesNac = computed(() => this.redes().filter((r) => !r.app && !r.instituto));
  notaNacional = computed(() => {
    const v = this.inds().map((x) => x.nacional).filter((x): x is number => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / (5 * v.length) * 20 : null;
  });
  mensualNac = computed(() => this.meses().map((_, m) => avg(this.redesNac().map((r) => r.mensual[m]))));

  // ---------- ámbito según los filtros ----------
  S = computed(() => {
    const ind = this.ind() == null ? null : this.inds()[this.ind()!] ?? null;
    const red = this.red() ? this.redPorNombre().get(this.red()) ?? null : null;
    const cen = this.centro() != null ? this.centroPorCod().get(this.centro()!) ?? null : null;
    const centros = cen ? [cen] : red ? this.centrosDeRed().get(red.nombre) ?? [] : this.centros();
    const kind: 'nacional' | 'red' | 'centro' = cen ? 'centro' : red ? 'red' : 'nacional';
    const nombre = cen ? titleCase(cen.nombre) : red ? this.nombreRed(red) : 'Nivel nacional';
    const nota = cen ? cen.nota : red ? red.nota : this.notaNacional();
    const pts = cen ? cen.pts : red ? red.pts : this.inds().map((x) => x.nacional);
    const mensual: (number | null)[] = cen ? cen.mensual : red ? red.mensual : this.mensualNac();
    return { ind, red, cen, centros, kind, nombre, nota, pts, mensual };
  });

  /** Establecimientos que se listan en ranking, mapa y tabla (los de la red del centro elegido). */
  lista = computed(() => {
    const S = this.S();
    if (!S.cen) return S.centros;
    return this.centrosDeRed().get(S.cen.red) ?? [];
  });
  porRed = computed(() => this.S().kind === 'nacional');

  opcionesRed = computed(() => this.redes().map((r) => ({ value: r.nombre, label: this.nombreRed(r, true) })));
  opcionesCentro = computed(() => {
    const filtra = (cs: TmiDashCentro[]) => cs
      .map((c) => ({ value: c.cod, label: titleCase(c.nombre) + (this.catTxt(c) ? ' · ' + this.catTxt(c) : '') }));
    if (this.red()) return [{ grupo: '', items: filtra(this.centrosDeRed().get(this.red()) ?? []) }];
    return this.redes().map((r) => ({ grupo: this.nombreRed(r, true), items: filtra(this.centrosDeRed().get(r.nombre) ?? []) }))
      .filter((g) => g.items.length);
  });

  // ---------- resumen ----------
  lead = computed<Seg[]>(() => {
    const S = this.S(), mes = this.mesTxt();
    if (S.ind) {
      const segs: Seg[] = [{ t: `${S.nombre}: el indicador ` }, { t: lcFirst(S.ind.nombre), b: true },
        { t: ' obtiene ' }, { t: num(S.pts[S.ind.i], 2), b: true }, { t: ` de 5 puntos a ${mes}.` }];
      if (!S.cen) {
        const d = this.distrib(S.centros, S.ind.i);
        segs.push({ t: ` De ${d.n} establecimientos evaluados, ` }, { t: String(d[5]), b: true },
          { t: ' cumplen el estándar y ' }, { t: String(d[1]), b: true }, { t: ' no lo cumplen.' });
      }
      return segs;
    }
    const evaluados = S.pts.filter((v) => v != null).length;
    const fuertes = S.pts.filter((v) => v != null && v >= 4).length;
    const crit = this.inds().filter((x) => S.pts[x.i] != null && S.pts[x.i]! < 3);
    const segs: Seg[] = [{ t: `A ${mes}, ${S.kind === 'nacional' ? 'la gestión prestacional nacional' : S.nombre} obtiene ` },
      { t: num(S.nota, 1), b: true }, { t: ' de 20 puntos (' }, { t: pct(S.nota == null ? null : S.nota / 20), b: true },
      { t: ' del máximo). ' }, { t: String(fuertes), b: true }, { t: ` de ${evaluados} indicadores evaluados alcanzan 4 puntos o más` }];
    if (crit.length) {
      segs.push({ t: '; la brecha está en ' }, { t: String(crit.length), b: true }, { t: ' bajo 3 puntos: ' },
        { t: crit.slice(0, 5).map((x) => lcFirst(x.nombre)).join(', ') + (crit.length > 5 ? ` y ${crit.length - 5} más` : ''), b: true }, { t: '.' });
    } else segs.push({ t: '.' });
    return segs;
  });

  gauge = computed(() => {
    const S = this.S();
    const v = S.ind ? S.pts[S.ind.i] : S.nota, max = S.ind ? 5 : 20, min = S.ind ? 1 : 0;
    const b = S.ind ? band5(v) : band20(v);
    const cx = 150, cy = 150, r = 120;
    const pt = (t: number, rr: number) => [cx - rr * Math.cos(Math.PI * t), cy - rr * Math.sin(Math.PI * t)];
    const arc = (t0: number, t1: number) => {
      const [x0, y0] = pt(t0, r), [x1, y1] = pt(t1, r);
      return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`;
    };
    const t = v == null ? 0 : Math.max(0.004, Math.min(1, (v - min) / (max - min)));
    const marcas = (S.ind ? [3, 4] : [12, 16]).map((k) => {
      const tt = (k - min) / (max - min), [x1, y1] = pt(tt, r - 14), [x2, y2] = pt(tt, r + 14);
      return { x1, y1, x2, y2 };
    });
    const titulo = S.ind ? `${S.ind.nombre} · ${S.nombre}` : `Índice de gestión · ${S.nombre}`;
    const nota = S.ind ? (S.cen ? 'Puntaje del establecimiento en este indicador (5, 3 o 1).' : 'Promedio de los puntajes de los establecimientos en este indicador.')
      : S.kind === 'nacional' ? 'Suma de los puntajes nacionales de los indicadores sobre el máximo posible, en escala de 20.'
      : 'Puntaje obtenido sobre el máximo posible, en escala de 20.';
    return { fondo: arc(0, 1), valor: v == null ? '' : arc(0, t), marcas, b, max, min, titulo, nota,
      texto: S.ind ? num(v, 2) : num(v, 1), color: this.color(b) };
  });

  tiles = computed<Tile[]>(() => {
    const S = this.S(), mes = this.mesTxt();
    if (S.cen) {
      const c = S.cen, red = this.redPorNombre().get(c.red);
      const deRed = [...(this.centrosDeRed().get(c.red) ?? [])].sort((a, b) => b.nota - a.nota);
      const posRed = `${deRed.indexOf(c) + 1} de ${deRed.length}`;
      const evals = c.pts.filter((p) => p != null);
      if (S.ind) {
        const d = c.det[S.ind.i], f = (v: number | null | undefined) => this.fmtV(v, S.ind!);
        return [
          { label: 'Valor real', value: d ? f(d.v) : '—', note: d ? (S.ind.tipo_calculo === 'ACUMULADO' ? `Acumulado de enero a ${mes}.` : `Solo el valor de ${mes} (mensual).`) : 'El indicador no aplica a este establecimiento.' },
          { label: 'Estándar', value: d ? f(d.e) : '—', note: d ? this.textoAcept(d, S.ind) : undefined },
          { label: 'Puntaje total del establecimiento', value: num(c.nota, 1), note: `Sobre 20, con ${evals.length} indicadores evaluados.`, cls: band20(c.nota) },
          { label: 'Puesto en su red', value: posRed, note: red ? this.nombreRed(red) : c.red },
        ];
      }
      const posNac = [...this.centros()].sort((a, b) => b.nota - a.nota).indexOf(c) + 1;
      return [
        { label: 'Puesto en su red', value: posRed, note: red ? this.nombreRed(red) : c.red },
        { label: 'Puesto nacional', value: `${posNac} de ${this.centros().length}`, note: 'Entre todos los establecimientos evaluados.' },
        { label: 'Indicadores que cumplen', value: `${evals.filter((p) => p === 5).length} de ${evals.length}`, note: 'Con el puntaje máximo de 5.' },
        { label: 'Nivel y tipo', value: [c.nivel, this.catTxt(c)].filter(Boolean).join(' · ') || '—', note: `Código ${c.cod}. Puntaje de la red: ${num(red?.nota, 1)}.` },
      ];
    }
    if (S.ind) {
      const d = this.distrib(S.centros, S.ind.i);
      return [
        { label: 'Establecimientos evaluados', value: d.n.toLocaleString('es-PE'), note: 'Con el indicador aplicable.' },
        { label: 'Cumplen el estándar', value: pct(d.n ? d[5] / d.n : null), note: `${d[5]} con 5 puntos.`, cls: 'ok' },
        { label: 'Cerca del estándar', value: pct(d.n ? d[3] / d.n : null), note: `${d[3]} con 3 puntos.`, cls: 'warn' },
        { label: 'No cumplen', value: pct(d.n ? d[1] / d.n : null), note: `${d[1]} con 1 punto o sin producción.`, cls: 'bad' },
      ];
    }
    const evals = S.centros.flatMap((c) => c.pts.filter((p) => p != null));
    const cumplen = pct(evals.length ? evals.filter((p) => p === 5).length / evals.length : null);
    if (S.kind === 'nacional') {
      const rs = this.redes(), alto = rs.filter((r) => r.nota >= 16).length, bajo = rs.filter((r) => r.nota < 12).length;
      return [
        { label: 'Redes evaluadas', value: String(rs.length), note: 'Redes asistenciales, prestacionales e institutos.' },
        { label: 'Establecimientos evaluados', value: S.centros.length.toLocaleString('es-PE'), note: 'Activos, con al menos un indicador medido.' },
        { label: 'Evaluaciones que cumplen', value: cumplen, note: `De ${evals.length.toLocaleString('es-PE')} evaluaciones indicador–establecimiento.` },
        { label: 'Redes en nivel alto', value: String(alto), note: `${rs.length - alto - bajo} en nivel medio y ${bajo} en nivel bajo.`, cls: 'ok' },
      ];
    }
    const ord = [...this.redes()].sort((a, b) => b.nota - a.nota);
    const alto = S.centros.filter((c) => c.nota >= 16).length, bajo = S.centros.filter((c) => c.nota < 12).length;
    return [
      { label: 'Puesto entre redes', value: `${ord.indexOf(S.red!) + 1} de ${ord.length}`, note: `Índice nacional: ${num(this.notaNacional(), 1)}.` },
      { label: 'Establecimientos evaluados', value: String(S.centros.length), note: 'Activos, con al menos un indicador medido.' },
      { label: 'Evaluaciones que cumplen', value: cumplen, note: `De ${evals.length} evaluaciones indicador–establecimiento.` },
      { label: 'Establecimientos en nivel alto', value: String(alto), note: `${S.centros.length - alto - bajo} en nivel medio y ${bajo} en nivel bajo.`, cls: 'ok' },
    ];
  });

  // ---------- servicios ----------
  areas = computed(() => {
    const S = this.S();
    return this.servicios().map((sv) => ({
      ...sv,
      score: avg(sv.inds.map((x) => S.pts[x.i])),
      filas: sv.inds.map((x) => {
        const v = S.pts[x.i];
        const det = S.cen ? S.cen.det[x.i] : null;
        return { x, v, b: band5(v), txt: v == null ? 'NA' : S.cen ? String(v) : num(v, 2),
          sub: det ? `Valor ${this.fmtV(det.v, x)} · estándar ${this.fmtV(det.e, x)}` : '',
          d: S.cen ? null : this.distrib(S.centros, x.i) };
      }),
    }));
  });

  // ---------- ranking ----------
  ranking = computed(() => {
    const S = this.S(), i = S.ind?.i ?? null, max = i == null ? 20 : 5;
    const val = (x: { nota: number; pts: (number | null)[] }) => i == null ? x.nota : x.pts[i];
    let items: { key: string; name: string; v: number | null; sub: string; on: boolean; red?: string; cod?: number }[];
    let ref: number | null, refName: string, titulo: string;
    if (this.porRed()) {
      items = this.redes().map((r) => ({ key: r.nombre, name: this.nombreRed(r, true), v: val(r), on: false, red: r.nombre,
        sub: `${(this.centrosDeRed().get(r.nombre) ?? []).length} establecimientos` }));
      ref = i == null ? this.notaNacional() : S.ind!.nacional; refName = 'nacional'; titulo = 'Ranking de redes';
    } else {
      items = this.lista().map((c) => ({ key: String(c.cod), name: titleCase(c.nombre), v: val(c), on: S.cen === c, cod: c.cod,
        sub: `${this.redCorta(c.red)} · ${[c.nivel, this.catTxt(c)].filter(Boolean).join(' ')}` }));
      ref = i == null ? (S.red ? S.red.nota : this.notaNacional()) : (S.red ? S.red.pts[i] : S.ind!.nacional);
      refName = S.red ? 'de la red' : 'nacional';
      titulo = S.cen ? 'Ranking de establecimientos de su red' : 'Ranking de establecimientos';
    }
    const bf = i == null ? band20 : band5;
    const filas = items.filter((x) => x.v != null).sort((a, b) => b.v! - a.v!)
      .map((x, k) => ({ ...x, pos: k + 1, w: x.v! / max * 100, b: bf(x.v), txt: i == null ? num(x.v, 1) : num(x.v, 2) }));
    const limites = i == null ? [16, 12] : [4, 3];
    const leyenda = [
      { cls: 'ok', n: filas.filter((x) => x.v! >= limites[0]).length, t: `alto (${limites[0]} o más)` },
      { cls: 'warn', n: filas.filter((x) => x.v! >= limites[1] && x.v! < limites[0]).length, t: 'medio' },
      { cls: 'bad', n: filas.filter((x) => x.v! < limites[1]).length, t: `bajo (menos de ${limites[1]})` },
    ];
    const sub = (i == null ? `Puntaje sobre 20 a ${this.mesTxt()}` : `Puntaje en ${lcFirst(S.ind!.nombre)} (1 a 5)`)
      + `. La línea vertical marca el valor ${refName}. Clic en una fila para filtrar.`;
    return { titulo, sub, filas, leyenda, ref: ref == null ? null : ref / max * 100, max };
  });

  // ---------- evolución ----------
  tendencia = computed(() => {
    const S = this.S();
    const series: Serie[] = [{ name: S.kind === 'nacional' ? 'Promedio de redes' : S.nombre, vals: S.mensual, color: '#007AC9', main: true }];
    if (S.cen) {
      const red = this.redPorNombre().get(S.cen.red);
      if (red && red.nombre !== S.cen.nombre) series.push({ name: this.nombreRed(red), vals: red.mensual, color: '#7a5bb5', dash: '6 4' });
      if (!red?.instituto) series.push({ name: 'Promedio de redes', vals: this.mensualNac(), color: '#94a3b8', dash: '2 4' });
    } else if (S.kind === 'red') series.push({ name: 'Promedio de redes', vals: this.mensualNac(), color: '#94a3b8', dash: '2 4' });
    const g = this.grafico(series, {
      fmt: (v) => num(v, 1), bandas: [12, 16],
      dominio: (lo, hi) => [Math.max(0, Math.floor(lo - 1)), Math.min(20, Math.ceil(hi + 1))],
    });
    const sub = 'Puntaje sobre 20 de cada mes (calculado con los puntajes del mes). '
      + (S.kind === 'nacional' ? 'A nivel nacional se muestra el promedio simple de las redes, sin las redes APP e institutos.' : 'Se compara con su referencia.')
      + (S.ind ? ' No depende del indicador elegido.' : '');
    return { g, sub };
  });

  // ---------- detalle del indicador ----------
  detalle = computed(() => {
    const S = this.S();
    if (!S.ind) return null;
    const x = S.ind, f = (v: number | null | undefined) => this.fmtV(v, x);
    const ficha = [['Servicio', this.nombreServ(x.servicio)], ['Código', x.codigo],
      ['Sentido', x.sentido === 'MAYOR' ? 'De incremento (mayor es mejor)' : x.sentido === 'MENOR' ? 'De decremento (menor es mejor)' : x.sentido === 'BANDA' ? 'De banda (dentro del rango)' : ''],
      ['Formato', x.pct ? 'Porcentaje' : 'Número'], ['Puntaje nacional', `${num(x.nacional, 2)} de 5`]].filter((p) => p[1]);
    if (S.cen) {
      const det = S.cen.det[x.i];
      return { ficha, cen: true, det, nota: det ? `Puntaje: ${det.p ?? 'NA'} · Valor a ${this.mesTxt()}: ${f(det.v)} · Estándar: ${f(det.e)}` : '',
        g: det ? this.grafico([{ name: 'Valor real', vals: det.m, color: '#007AC9', main: true }], { fmt: f, ref: det.e, refName: 'Estándar' }) : null,
        dist: null, filas: [], escala: null };
    }
    const dist = this.distrib(S.centros, x.i);
    const filas0 = S.centros.filter((c) => c.det[x.i] && c.det[x.i]!.v != null).map((c) => ({ c, d: c.det[x.i]! }));
    filas0.sort((a, b) => (a.d.p ?? 9) - (b.d.p ?? 9) || a.d.v / (a.d.e || 1) - b.d.v / (b.d.e || 1));
    const vs = filas0.flatMap((r) => [r.d.v, r.d.e]).filter((v): v is number => v != null);
    const vmin = Math.min(...vs), vmax = Math.max(...vs), pad = (vmax - vmin) * 0.08 || Math.abs(vmax) * 0.1 || 1;
    const lo = Math.max(0, vmin - pad), hi = vmax + pad;
    const xp = (v: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100;
    const filas = filas0.map(({ c, d }) => ({ c, d, nombre: titleCase(c.nombre), xv: xp(d.v), xe: d.e == null ? null : xp(d.e),
      b: (d.p === 5 ? 'ok' : d.p === 3 ? 'warn' : 'bad') as Banda, txt: f(d.v) }));
    return { ficha, cen: false, det: null, nota: '', g: null, dist, filas, escala: filas.length ? [f(lo), f(hi)] : null };
  });

  // ---------- mapa de calor ----------
  mapa = computed(() => {
    const S = this.S();
    const filas = this.porRed()
      ? [...this.redes()].sort((a, b) => b.nota - a.nota).map((r) => ({ name: this.nombreRed(r, true), pts: r.pts, nota: r.nota, on: false, red: r.nombre, cod: null as number | null }))
      : [...this.lista()].sort((a, b) => b.nota - a.nota).map((c) => ({ name: titleCase(c.nombre), pts: c.pts, nota: c.nota, on: S.cen === c, red: '', cod: c.cod as number | null }));
    return filas.map((r) => ({ ...r, b: band20(r.nota), celdas: r.pts.map((v) => ({ v, b: v == null ? 'na' : band5(v), txt: v == null ? 'NA' : Number.isInteger(v) ? String(v) : num(v, 1) })) }));
  });

  // ---------- tabla ----------
  columnas = computed(() => {
    const ind = this.S().ind;
    const cols: { k: string; t: string; v: (c: TmiDashCentro) => string | number | null; num?: boolean; f?: (v: any) => string; pill?: (v: any) => Banda; sm?: boolean }[] = [
      { k: 'nombre', t: 'Establecimiento', v: (c) => titleCase(c.nombre) },
      { k: 'red', t: 'Red', v: (c) => this.redCorta(c.red), sm: true },
      { k: 'nivel', t: 'Nivel', v: (c) => c.nivel ?? '' },
      { k: 'tipo', t: 'Tipo', v: (c) => this.catTxt(c), sm: true },
      { k: 'n', t: 'Indicadores', v: (c) => c.pts.filter((p) => p != null).length, num: true, sm: true },
      { k: 'cumple', t: 'Con 5', v: (c) => c.pts.filter((p) => p === 5).length, num: true, sm: true },
    ];
    if (ind) cols.push(
      { k: 'pi', t: 'Puntaje ind.', v: (c) => c.pts[ind.i], num: true, pill: band5 },
      { k: 'vi', t: 'Valor real', v: (c) => c.det[ind.i]?.v ?? null, num: true, f: (v) => this.fmtV(v, ind) },
      { k: 'ei', t: 'Estándar', v: (c) => c.det[ind.i]?.e ?? null, num: true, f: (v) => this.fmtV(v, ind), sm: true });
    cols.push({ k: 'nota', t: 'Puntaje /20', v: (c) => c.nota, num: true, f: (v) => num(v, 1), pill: band20 });
    return cols;
  });
  filasTabla = computed(() => {
    const cols = this.columnas(), q = norm(this.q().trim());
    const col = cols.find((c) => c.k === this.sortKey()) ?? cols[cols.length - 1], dir = this.sortDir();
    return this.lista()
      .filter((c) => !q || norm(`${c.nombre} ${c.red} ${this.catTxt(c)} ${c.cod}`).includes(q))
      .map((c) => ({ c, celdas: cols.map((cc) => {
        const v = cc.v(c);
        return { v, txt: v == null ? (cc.num ? 'NA' : '') : cc.f ? cc.f(v) : String(v), pill: cc.pill && v != null ? cc.pill(v) : null, num: !!cc.num, sm: !!cc.sm };
      }) }))
      .sort((a, b) => {
        const x = col.v(a.c), y = col.v(b.c);
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * dir;
      });
  });

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    this.red.set(qp.get('red') ?? '');
    this.centro.set(qp.get('centro') ? Number(qp.get('centro')) : null);
    this.ind.set(qp.get('ind') ? Number(qp.get('ind')) : null);
    this.cargando.set(true);
    this.calculoSrv.getPeriodosDashboard('ACTUAL').subscribe({
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
    this.calculoSrv.getDashboard(periodo, 'ACTUAL').subscribe({
      next: (d) => {
        this.data.set(d);
        this.cargando.set(false);
        // filtros que no existen en este periodo
        if (this.red() && !this.redPorNombre().has(this.red())) this.red.set('');
        if (this.centro() != null && !this.centroPorCod().has(this.centro()!)) this.centro.set(null);
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
  setInd(i: number | null) { this.ind.set(i === this.ind() ? null : i); this.guardarFiltros(); }
  elegirInd(valor: string) { this.ind.set(valor === '' ? null : Number(valor)); this.guardarFiltros(); }
  limpiar() { this.red.set(''); this.centro.set(null); this.ind.set(null); this.q.set(''); this.guardarFiltros(); }
  ordenar(k: string, esNum: boolean) {
    if (this.sortKey() === k) this.sortDir.set(-this.sortDir());
    else { this.sortKey.set(k); this.sortDir.set(esNum ? -1 : 1); }
  }
  irFila(r: { red?: string; cod?: number | null }) { if (r.cod != null) this.setCentro(r.cod); else if (r.red) this.setRed(r.red); }

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

  descargarCsv() {
    const cols = this.columnas();
    const esc = (v: unknown) => { const t = v == null ? '' : String(v); return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const lineas = [['Código', ...cols.map((c) => c.t)].map(esc).join(';'),
      ...this.filasTabla().map(({ c, celdas }) => [c.cod, ...celdas.map((x) => typeof x.v === 'number' ? String(x.v).replace('.', ',') : x.v)].map(esc).join(';'))];
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + lineas.join(String.fromCharCode(13, 10))], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `tmi_establecimientos_${this.periodo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- tooltip ----------
  mostrarTip(ev: MouseEvent, title: string, lines: string[]) {
    const x = ev.clientX + 14 + 260 > window.innerWidth ? ev.clientX - 274 : ev.clientX + 14;
    const y = ev.clientY + 14 + 110 > window.innerHeight ? ev.clientY - 110 : ev.clientY + 14;
    this.tip.set({ x: Math.max(8, x), y: Math.max(8, y), title, lines });
  }
  ocultarTip() { this.tip.set(null); }
  tipIndicador(ev: MouseEvent, f: { x: Ind; d: Distrib | null }) {
    if (!f.d?.n) return;
    this.mostrarTip(ev, f.x.nombre, [`${f.d.n} establecimientos evaluados`, `Cumplen (5): ${f.d[5]}`, `Cerca (3): ${f.d[3]}`, `No cumplen (1): ${f.d[1]}`]);
  }
  tipRanking(ev: MouseEvent, x: { name: string; sub: string; txt: string; pos: number }) {
    this.mostrarTip(ev, x.name, [x.sub, `Puntaje: ${x.txt} / ${this.ranking().max}`, `Puesto ${x.pos} de ${this.ranking().filas.length}`]);
  }
  tipCelda(ev: MouseEvent, fila: string, i: number, v: number | null) {
    this.mostrarTip(ev, fila, [this.inds()[i]?.nombre ?? '', v == null ? 'No aplica' : `Puntaje: ${num(v, 2)} / 5`]);
  }
  tipPunto(ev: MouseEvent, f: { c: TmiDashCentro; d: TmiDashDetalle }) {
    const x = this.S().ind!;
    this.mostrarTip(ev, titleCase(f.c.nombre), [`${this.redCorta(f.c.red)} · ${this.catTxt(f.c)}`, `Valor real: ${this.fmtV(f.d.v, x)}`,
      `Estándar: ${this.fmtV(f.d.e, x)}`, `Puntaje: ${f.d.p ?? 'NA'}`]);
  }
  hoverK = signal<{ g: Grafico; k: number } | null>(null);
  tipGrafico(ev: MouseEvent, g: Grafico, svg: Element) {
    const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * g.W / r.width;
    let k = 0;
    g.xs.forEach((x, j) => { if (Math.abs(x - px) < Math.abs(g.xs[k] - px)) k = j; });
    this.hoverK.set({ g, k });
    const lines = g.series.map((s) => `${s.name}: ${g.fmt(s.vals[k])}`);
    if (g.ref != null) lines.push(`${g.refName}: ${g.fmt(g.ref)}`);
    this.mostrarTip(ev, MESES_L[k].charAt(0).toUpperCase() + MESES_L[k].slice(1), lines);
  }
  salirGrafico() { this.hoverK.set(null); this.ocultarTip(); }

  // ---------- utilidades ----------
  distrib(centros: TmiDashCentro[], i: number): Distrib {
    const o: Distrib = { 5: 0, 3: 0, 1: 0, n: 0 };
    centros.forEach((c) => {
      const p = c.pts[i];
      if (p == null) return;
      o.n++;
      if (p === 5) o[5]++; else if (p === 3) o[3]++; else o[1]++;
    });
    return o;
  }
  color(b: Banda | string) { return b === 'ok' ? 'var(--d-ok)' : b === 'warn' ? 'var(--d-warn)' : b === 'bad' ? 'var(--d-bad)' : 'var(--d-ref)'; }
  fmtV(v: number | null | undefined, x: Ind) {
    if (v == null) return '—';
    return x.pct ? (v * 100).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + '%' : v.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }
  private textoAcept(d: TmiDashDetalle, x: Ind) {
    if (x.sentido === 'BANDA') return `Rango aceptable: ${this.fmtV(d.aceptmenos, x)} a ${this.fmtV(d.acept, x)}.`;
    return d.acept != null ? `Aceptable hasta ${this.fmtV(d.acept, x)}.` : '';
  }
  nombreRed(r: TmiDashRed, corto = false) {
    if (r.instituto) return titleCase(r.nombre);
    return (corto ? '' : 'Red ') + this.redCorta(r.nombre);
  }
  /** Este tablero muestra la categoría del centro (C.A.P.I, P.M., ...); si no viene, el tipo. */
  catTxt(c: TmiDashCentro) { return c.categoria ?? c.tipo ?? ''; }
  redCorta(n: string) { return titleCase(n.replace(/^RED (ASISTENCIAL|PRESTACIONAL) /i, '')); }
  private nombreServ(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Otros'; }
  private nombreInd(s: string) {
    const t = s.trim().toLowerCase();
    return (t.charAt(0).toUpperCase() + t.slice(1)).replace(/(?<![a-zñáéíóú])(i|ii|iii|iv|v)(?![a-zñáéíóú])/g, (m) => m.toUpperCase());
  }

  private grafico(series: Serie[], opt: { fmt: (v: number | null) => string; ref?: number | null; refName?: string; bandas?: number[];
    dominio?: (lo: number, hi: number) => [number, number] }): Grafico {
    const W = 600, H = 260, m = { l: 44, r: 14, t: 12, b: 26 };
    const n = this.meses().length;
    const todos = series.flatMap((s) => s.vals).concat(opt.ref != null ? [opt.ref] : []).filter((v): v is number => v != null);
    let lo = todos.length ? Math.min(...todos) : 0, hi = todos.length ? Math.max(...todos) : 1;
    if (opt.dominio) [lo, hi] = opt.dominio(lo, hi);
    else { const pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.1 || 1; lo = Math.max(0, lo - pad); hi += pad; }
    if (hi === lo) hi = lo + 1;
    const x = (k: number) => m.l + (n <= 1 ? (W - m.l - m.r) / 2 : k * (W - m.l - m.r) / (n - 1));
    const y = (v: number) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
    const grid = [0, 1, 2, 3, 4].map((k) => { const v = lo + (hi - lo) * k / 4; return { y: y(v), label: opt.fmt(v) }; });
    const xs = this.meses().map((_, k) => x(k));
    const paths = series.map((s) => {
      let d = '', pen = false;
      s.vals.forEach((v, k) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(k)},${y(v)}`; pen = true; });
      return { d, color: s.color, dash: s.dash, main: s.main };
    });
    const dots = series.filter((s) => s.main).flatMap((s) => s.vals.map((v, k) => v == null ? null : { cx: x(k), cy: y(v), color: s.color })
      .filter((p): p is { cx: number; cy: number; color: string } => !!p));
    return { W, H, grid, xl: this.meses().map((label, k) => ({ x: x(k), label })), paths, dots,
      refY: opt.ref != null ? y(opt.ref) : null, bandas: (opt.bandas ?? []).filter((v) => v > lo && v < hi).map(y),
      x0: m.l, x1: W - m.r, y0: m.t, y1: H - m.b, xs, series, ref: opt.ref ?? null, refName: opt.refName ?? '', fmt: opt.fmt };
  }
}
