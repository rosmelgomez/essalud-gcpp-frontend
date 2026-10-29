import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiBloqueFormula,
  TmiCatalogo,
  TmiDinamicoService,
  TmiIndicador,
  TmiLetra,
  TmiProblemaConfig,
  TmiTipoEstandar,
  TmiVariable,
  mensajeError,
} from '../../../services/tmi-dinamico-service';

/** Operaciones de los bloques: valor guardado y cómo se muestra. */
export const OPERACIONES: { op: TmiBloqueFormula['op']; texto: string }[] = [
  { op: '+', texto: '+ Suma' }, { op: '-', texto: '− Resta' }, { op: '*', texto: '× Multiplica' }, { op: '/', texto: '÷ Divide' },
];
const SIMBOLO: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
type Parte = 'num' | 'den';
const HOJA = /^[^\[\]:*?/\\]+$/;
export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Indicadores definidos por el usuario: fórmula en bloques (variable + operación), cálculo y cómo se evalúa. */
@Component({
  selector: 'app-tmi-config-indicadores',
  imports: [ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './tmi-config-indicadores.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiConfigIndicadores implements OnInit {
  private srv = inject(TmiDinamicoService);
  private fb = inject(FormBuilder);

  readonly operaciones = OPERACIONES;
  indicadores = signal<TmiIndicador[]>([]);
  seleccionado = signal<TmiIndicador | null>(null);
  letras = signal<TmiLetra[]>([]);
  variables = signal<TmiVariable[]>([]);
  gruposReporte = signal<TmiCatalogo[]>([]);
  tiposCalculo = signal<{ codigo: string; descripcion: string }[]>([]);
  problemas = signal<TmiProblemaConfig[] | null>(null);

  /** Tipos de estándar (tabla maestra) para elegir cómo se evalúa el indicador. */
  tiposEstandar = signal<TmiTipoEstandar[]>([]);

  // Fórmula en bloques: numerador y denominador; cada variable recibe una letra automática por orden de aparición
  bloquesNum = signal<TmiBloqueFormula[]>([]);
  bloquesDen = signal<TmiBloqueFormula[]>([]);
  /** Texto de la fórmula guardada que no se puede pasar a bloques (números o paréntesis); '' = se puede. */
  formulaAvanzada = signal('');
  formulaCambiada = signal(false);
  guardandoFormula = signal(false);
  errorFormula = signal('');
  /** Letra de cada variable: A, B, C... según el orden en que aparece (numerador y luego denominador). */
  letraDe = computed(() => {
    const m = new Map<number, string>();
    for (const b of [...this.bloquesNum(), ...this.bloquesDen()]) {
      if (b.id_variable != null && !m.has(b.id_variable) && m.size < LETRAS.length) m.set(b.id_variable, LETRAS[m.size]);
    }
    return m;
  });
  leyenda = computed(() =>
    [...this.letraDe()].map(([id, letra]) => ({ letra, variable: this.nombreVariable(id) })));
  vistaPrevia = computed(() => {
    const num = this.textoBloques(this.bloquesNum()) || '?';
    const den = this.textoBloques(this.bloquesDen()) || '1';
    return `(${num}) / (${den})`;
  });

  loading = signal(false);
  error = signal('');
  errorDetalle = signal('');
  validando = signal(false);
  eliminandoId = signal<number | null>(null);
  mostrarForm = signal(false);
  guardando = signal(false);
  errorForm = signal('');


  form = this.fb.nonNullable.group({
    id: [0],
    grupo: [null as number | null],
    indicador: ['', [Validators.required, Validators.maxLength(200)]],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre_hoja: ['', [Validators.required, Validators.maxLength(31), Validators.pattern(HOJA)]],
    titulo_hoja: [''],
    orden: [1, Validators.required],
    // la fórmula se arma con bloques en el panel del indicador; el backend no la toma del formulario
    expr_numerador: [''],
    expr_denominador: [''],
    tipo_calculo: ['MENSUAL', Validators.required],
    factor: [1],
    den_cero: ['CERO' as 'CERO' | 'NA'],
    num_cero_na: [false],
    cero_si_letra_mes_0: [false],
    sin_datos_anio: ['NA' as 'MOSTRAR' | 'NA' | 'OCULTAR'],
    base_estandar: ['TIPO' as TmiIndicador['base_estandar']],
    sentido: ['MENOR' as TmiIndicador['sentido']],
    tipo_tolerancia: ['REL' as 'REL' | 'ABS'],
    tolerancia: [0.1],
    decimales: [null as number | null],
    cero_es_logro: [false],
    mostrar_no_aplica: [true],
    activo: [true],
    formato: ['NUMERO' as TmiIndicador['formato']],
  });

  ngOnInit(): void {
    this.cargar();
    this.srv.getVariables().subscribe({ next: (v) => this.variables.set(v) });
    this.srv.getGruposReporte().subscribe({ next: (g) => this.gruposReporte.set(g) });
    this.srv.getTiposCalculo().subscribe({ next: (t) => this.tiposCalculo.set(t) });
    this.srv.getTiposEstandar().subscribe({ next: (t) => this.tiposEstandar.set(t) });
  }

  /** seleccionarId: indicador recién creado, para armar su fórmula a continuación. */
  cargar(seleccionarId?: number): void {
    this.loading.set(true);
    this.error.set('');
    this.srv.getIndicadores().subscribe({
      next: (lista) => {
        this.indicadores.set(lista);
        const nuevo = seleccionarId ? lista.find((x) => x.id === seleccionarId) : undefined;
        if (nuevo) {
          this.seleccionar(nuevo);
        } else {
          const sel = this.seleccionado();
          if (sel) this.seleccionado.set(lista.find((x) => x.id === sel.id) ?? null);
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar los indicadores.'));
        this.loading.set(false);
      },
    });
  }

  validar(): void {
    this.validando.set(true);
    this.srv.validarConfig().subscribe({
      next: (p) => {
        this.problemas.set(p);
        this.validando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo validar la configuración.'));
        this.validando.set(false);
      },
    });
  }

  seleccionar(ind: TmiIndicador): void {
    this.seleccionado.set(ind);
    this.errorDetalle.set('');
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    const id = this.seleccionado()?.id;
    if (!id) return;
    this.srv.getLetras(id).subscribe({
      next: (l) => {
        this.letras.set(l);
        this.cargarBloques();
      },
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar la fórmula.')),
    });
  }

  // indicador
  nuevo(): void {
    const siguiente = Math.max(0, ...this.indicadores().map((i) => i.orden ?? 0)) + 1;
    this.form.reset();
    this.form.patchValue({ orden: siguiente });
    this.errorForm.set('');
    this.mostrarForm.set(true);
  }

  editar(ind: TmiIndicador, ev?: Event): void {
    ev?.stopPropagation();
    this.form.reset();
    this.form.patchValue({ ...ind, id: ind.id ?? 0, titulo_hoja: ind.titulo_hoja ?? '' });
    this.errorForm.set('');
    this.mostrarForm.set(true);
  }

  guardar(): void {
    const f = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Revise los campos obligatorios. El nombre de hoja no admite [ ] : * ? / \\ y tiene máximo 31 caracteres.');
      return;
    }
    const { id, ...resto } = f;
    const dto: TmiIndicador = {
      ...resto,
      grupo: resto.grupo == null ? null : Number(resto.grupo),
      titulo_hoja: resto.titulo_hoja || null,
      orden: Number(resto.orden),
      factor: Number(resto.factor ?? 1),
      tolerancia: Number(resto.tolerancia ?? 0),
      decimales: resto.decimales == null || (resto.decimales as any) === '' ? null : Number(resto.decimales),
    };
    this.guardando.set(true);
    const req = id ? this.srv.putIndicador(id, dto) : this.srv.postIndicador(dto);
    req.subscribe({
      next: (res: any) => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.problemas.set(null);
        // indicador nuevo: queda seleccionado para armar su fórmula
        this.cargar(id ? undefined : res?.id);
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el indicador.'));
        this.guardando.set(false);
      },
    });
  }

  eliminar(ind: TmiIndicador, ev?: Event): void {
    ev?.stopPropagation();
    if (!ind.id || !confirm(`¿Eliminar el indicador "${ind.indicador}" con su fórmula y resultados?\n`
      + 'Si solo quiere quitarlo del reporte, edítelo y márquelo como inactivo.')) return;
    this.eliminandoId.set(ind.id);
    this.srv.deleteIndicador(ind.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        if (this.seleccionado()?.id === ind.id) this.seleccionado.set(null);
        this.cargar();
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo eliminar el indicador.'));
        this.eliminandoId.set(null);
      },
    });
  }

  // cómo se evalúa el indicador
  textoTipoEstandar(codigo: string | null | undefined): string {
    return this.tiposEstandar().find((t) => t.codigo === codigo)?.descripcion ?? codigo ?? '—';
  }

  // fórmula en bloques
  nombreVariable(id: number | null): string {
    return id == null ? '' : (this.variables().find((v) => v.id === id)?.nombre ?? `Variable #${id}`);
  }

  letra(b: TmiBloqueFormula): string {
    return b.id_variable == null ? '·' : (this.letraDe().get(b.id_variable) ?? '?');
  }

  private textoBloques(bloques: TmiBloqueFormula[]): string {
    return bloques.map((b, i) => `${i ? ' ' + SIMBOLO[b.op] + ' ' : ''}${this.letra(b)}`).join('');
  }

  private lista(parte: Parte) {
    return parte === 'num' ? this.bloquesNum : this.bloquesDen;
  }

  agregarBloque(parte: Parte): void {
    this.lista(parte).update((b) => [...b, { op: '+', id_variable: null }]);
    this.formulaCambiada.set(true);
  }

  cambiarBloque(parte: Parte, i: number, cambio: Partial<TmiBloqueFormula>): void {
    this.lista(parte).update((b) => b.map((x, k) => (k === i ? { ...x, ...cambio } : x)));
    this.formulaCambiada.set(true);
  }

  quitarBloque(parte: Parte, i: number): void {
    this.lista(parte).update((b) => b.filter((_, k) => k !== i));
    this.formulaCambiada.set(true);
  }

  /** Pasa la fórmula guardada (letras + tmi_indicador_variable) a bloques. Una letra con varias variables se
   *  abre en varios bloques sumados cuando el resultado es el mismo (la letra se suma o va al inicio y no se
   *  multiplica ni divide); si no, o si la fórmula tiene números o paréntesis, se avisa y se puede rehacer. */
  cargarBloques(): void {
    const ind = this.seleccionado();
    this.formulaCambiada.set(false);
    this.errorFormula.set('');
    this.formulaAvanzada.set('');
    if (!ind) return;
    const varsDe = new Map<string, number[]>();
    for (const l of this.letras()) varsDe.set(l.letra, [...(varsDe.get(l.letra) ?? []), l.id_variable]);
    const convertir = (expr: string | null, esDen: boolean): TmiBloqueFormula[] | null => {
      const s = (expr ?? '').replace(/\s+/g, '').toUpperCase();
      if (!s || (esDen && s === '1')) return [];
      if (!/^[A-Z]([+\-*/][A-Z])*$/.test(s)) return null;
      const bloques: TmiBloqueFormula[] = [];
      for (let k = 0; k < s.length; k += 2) {
        const op = (k ? s[k - 1] : '+') as TmiBloqueFormula['op'];
        const siguiente = s[k + 1];
        const vars = varsDe.get(s[k]) ?? [];
        if (!vars.length) {
          bloques.push({ op, id_variable: null });
          continue;
        }
        if (vars.length > 1 && (op !== '+' || siguiente === '*' || siguiente === '/')) return null;
        vars.forEach((v, j) => bloques.push({ op: j ? '+' : op, id_variable: v }));
      }
      return bloques;
    };
    const num = convertir(ind.expr_numerador, false);
    const den = convertir(ind.expr_denominador, true);
    if (num == null || den == null) {
      this.formulaAvanzada.set(`(${ind.expr_numerador}) / (${ind.expr_denominador})`);
      this.bloquesNum.set([]);
      this.bloquesDen.set([]);
      return;
    }
    this.bloquesNum.set(num);
    this.bloquesDen.set(den);
  }

  guardarFormula(): void {
    const ind = this.seleccionado();
    if (!ind?.id) return;
    const num = this.bloquesNum();
    const den = this.bloquesDen();
    if (!num.length) {
      this.errorFormula.set('Agregue al menos una variable en el numerador.');
      return;
    }
    if ([...num, ...den].some((b) => b.id_variable == null)) {
      this.errorFormula.set('Elija la variable de cada bloque o quite los bloques vacíos.');
      return;
    }
    if (new Set([...num, ...den].map((b) => b.id_variable)).size > LETRAS.length) {
      this.errorFormula.set('La fórmula admite como máximo 26 variables distintas (A-Z).');
      return;
    }
    this.errorFormula.set('');
    this.guardandoFormula.set(true);
    this.srv.putFormula(ind.id, num, den).subscribe({
      next: () => {
        this.guardandoFormula.set(false);
        this.formulaCambiada.set(false);
        this.formulaAvanzada.set('');
        this.problemas.set(null);
        this.cargar();
        this.cargarDetalle();
      },
      error: (e) => {
        this.errorFormula.set(mensajeError(e, 'No se pudo guardar la fórmula.'));
        this.guardandoFormula.set(false);
      },
    });
  }

  /** Fórmula con números o paréntesis: se descarta y se arma de nuevo con bloques. */
  rehacerFormula(): void {
    this.formulaAvanzada.set('');
    this.bloquesNum.set([{ op: '+', id_variable: null }]);
    this.bloquesDen.set([]);
    this.formulaCambiada.set(true);
  }

  textoSentido(s: string): string {
    return s === 'MENOR' ? 'Menor es mejor' : s === 'MAYOR' ? 'Mayor es mejor' : 'Dentro de una banda';
  }
}
