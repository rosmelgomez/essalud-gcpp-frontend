import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, catchError, debounceTime, map, of, switchMap } from 'rxjs';

import { AyudaFlotante } from '../ayuda-flotante';
import { TmiCatalogoService, TmiVariableService, TmiIndicadorService, TmiEstandarService, TmiCalculoService, TmiIndicador, TmiCatalogo, TmiProblemaConfig, TmiTipoEstandar, TmiLetra, TmiVariable, TmiAnalisisFormula, mensajeError, TmiTerminoFormula } from '../../../../services/tmi';

const HOJA = /^[^\[\]:*?/\\]+$/;
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Bloque de la fórmula: una variable (su letra), una operación, un paréntesis o un número. */
interface Bloque {
  tipo: 'var' | 'op' | 'par' | 'num';
  valor: string;
}

/** Operaciones y paréntesis que se pueden agregar a la fórmula. */
const OPERACIONES = ['+', '-', '*', '/', '(', ')'];

/** Ayuda de cada campo del formulario del indicador (se abre con el "?" junto al nombre del campo). */
const AYUDA_INDICADOR = {
  grupo: 'Sección del reporte en la que se agrupa el indicador, por ejemplo Consulta Externa u Hospitalización.',
  tipo_calculo: 'MENSUAL: cada letra de la fórmula toma el valor del mes. ACUMULADO: cada letra toma la suma de enero '
    + 'hasta el mes, sin contar los meses excluidos.',
  sin_datos_anio: 'Qué pasa con un centro que no tiene ningún registro en todo el año. NA: aparece en la hoja con NA. '
    + 'Mostrar 0: aparece con 0. No listar: no aparece en la hoja del indicador.',
  base_estandar: 'Qué estándar se usa para evaluar al centro: el de su nivel estándar, su tipo, su categoría o una combinación. '
    + 'Los valores se cargan en las pestañas de Estándares. Si el centro tiene un estándar propio en Estándar por '
    + 'Centro, se usa ese.',
  sentido: 'Menor es mejor: puntaje 5 si el valor no pasa el estándar, 3 si no pasa el % Acept y 1 si lo pasa. '
    + 'Mayor es mejor: lo mismo, al revés. Dentro de una banda: 5 si el valor queda cerca del estándar, 3 si queda '
    + 'entre el % Aceptmenos y el % Acept, y 1 si sale de la banda.',
  formato: 'Cómo se muestran los valores del indicador en el Excel: como número o como porcentaje.',
  decimales: 'Decimales a los que se redondea el valor antes de compararlo con el estándar. Si lo deja vacío, no se '
    + 'redondea.',
  cero_es_logro: 'Qué puntaje recibe un mes con valor 0. Sin producción: puntaje 0. Es un buen resultado: el 0 se '
    + 'califica contra el estándar como cualquier otro valor.',
  mostrar_no_aplica: 'Centros que no tienen estándar o que quedan fuera del ámbito del indicador. Listar como NA: '
    + 'aparecen en la hoja con NA. No listar: no aparecen.',
  activo: 'Un indicador inactivo no se calcula ni sale en el Excel.',
} as const;
type CampoAyuda = keyof typeof AYUDA_INDICADOR;

/** Convierte la fórmula guardada ((A - B) / C) en bloques. */
function aBloques(texto: string | null | undefined): Bloque[] {
  return ((texto ?? '').toUpperCase().match(/[A-Z]|\d+(?:\.\d+)?|[-+*/()]/g) ?? []).map((v): Bloque => ({
    tipo: /[A-Z]/.test(v) ? 'var' : /\d/.test(v) ? 'num' : v === '(' || v === ')' ? 'par' : 'op',
    valor: v,
  }));
}

/** Parte de la vista previa: su HTML y si es un solo grupo entre paréntesis (que la raya de la fracción ya agrupa). */
interface Pieza {
  h: string;
  grupo: boolean;
}

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** HTML de la fórmula como se lee en matemáticas (la división como fracción); '' si los bloques no forman una fórmula. */
function vistaPrevia(bloques: Bloque[], nombre: (letra: string) => string): string {
  let i = 0;
  const op = (s: string) => `<span class="fx-op">${s}</span>`;
  const sinGrupo = (p: Pieza) => (p.grupo ? p.h.slice(op('(').length, -op(')').length) : p.h);
  // suma y resta
  const expresion = (): Pieza | null => {
    let p = termino();
    while (p && (bloques[i]?.valor === '+' || bloques[i]?.valor === '-')) {
      const s = bloques[i++].valor === '+' ? '+' : '−';
      const d = termino();
      p = d && { h: p.h + op(s) + d.h, grupo: false };
    }
    return p;
  };
  // multiplicación y división (la división se dibuja como fracción)
  const termino = (): Pieza | null => {
    let p = factor();
    while (p && (bloques[i]?.valor === '*' || bloques[i]?.valor === '/')) {
      const s = bloques[i++].valor;
      const d = factor();
      if (!d) return null;
      p = s === '*'
        ? { h: p.h + op('×') + d.h, grupo: false }
        : { h: `<span class="fx-frac"><span class="fx-num">${sinGrupo(p)}</span><span class="fx-den">${sinGrupo(d)}</span></span>`, grupo: false };
    }
    return p;
  };
  // menos, variable, número o paréntesis
  const factor = (): Pieza | null => {
    const b = bloques[i++];
    if (!b) return null;
    if (b.valor === '-') {
      const p = factor();
      return p && { h: op('−') + p.h, grupo: false };
    }
    if (b.tipo === 'var') return { h: `<span class="fx-var" title="${escapar(nombre(b.valor))}">${escapar(b.valor)}</span>`, grupo: false };
    if (b.tipo === 'num') return { h: `<span class="fx-n">${escapar(b.valor)}</span>`, grupo: false };
    if (b.valor !== '(') return null;
    const p = expresion();
    if (!p || bloques[i++]?.valor !== ')') return null;
    return { h: op('(') + p.h + op(')'), grupo: true };
  };
  const p = expresion();
  return p && i === bloques.length ? p.h : '';
}

/** El backend indica la posición del carácter en el texto; con bloques se muestra el número de bloque. */
function enBloques(mensaje: string, alias: string): string {
  return mensaje.replace(/en la posición (\d+)/, (_, pos) =>
    `en el bloque ${alias.slice(0, Number(pos) - 1).split(' ').filter(Boolean).length + 1}`);
}

/** Fórmula para comparar si cambió: en mayúsculas y sin espacios. */
function normalizar(texto: string | null | undefined): string {
  return (texto ?? '').toUpperCase().replace(/\s+/g, '');
}

/** Indicadores definidos por el usuario: fórmula con variables como letras (A, B, C…), cálculo y cómo se evalúa.
 *  Internamente la fórmula se guarda con términos de TOTALIZADO3 (la genera el backend). */
@Component({
  selector: 'app-tmi-config-indicadores',
  imports: [AyudaFlotante, ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule, CdkDropList, CdkDrag],
  templateUrl: './tmi-config-indicadores.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css'],
})
export class TmiConfigIndicadores implements OnInit {
  private catalogoSrv = inject(TmiCatalogoService);
  private variableSrv = inject(TmiVariableService);
  private indicadorSrv = inject(TmiIndicadorService);
  private estandarSrv = inject(TmiEstandarService);
  private calculoSrv = inject(TmiCalculoService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  indicadores = signal<TmiIndicador[]>([]);
  seleccionado = signal<TmiIndicador | null>(null);
  gruposReporte = signal<TmiCatalogo[]>([]);
  tiposCalculo = signal<{ codigo: string; descripcion: string }[]>([]);
  problemas = signal<TmiProblemaConfig[] | null>(null);

  /** Tipos de estándar (tabla maestra) para elegir cómo se evalúa el indicador. */
  tiposEstandar = signal<TmiTipoEstandar[]>([]);

  /** Campo del formulario con su ayuda abierta (una a la vez). */
  readonly ayuda = AYUDA_INDICADOR;
  ayudaCampo = signal<CampoAyuda | null>(null);

  alternarAyuda(campo: CampoAyuda, ev: Event): void {
    ev.stopPropagation();
    this.ayudaCampo.update((c) => (c === campo ? null : campo));
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  cerrarAyuda(): void {
    this.ayudaCampo.set(null);
  }

  /** Fórmula armada con bloques ((A - B) / C) y variable de cada letra. */
  bloques = signal<Bloque[]>([]);
  numero = signal('');
  readonly operaciones = OPERACIONES;
  letras = signal<TmiLetra[]>([]);
  variables = signal<TmiVariable[]>([]);
  idVariableNueva = signal<number | null>(null);
  /** Fórmula que se envía: los bloques separados por espacios. */
  formulaAlias = computed(() => this.bloques().map((b) => b.valor).join(' '));
  /** Cómo va quedando la fórmula, con las letras asignadas. */
  vista = computed(() => vistaPrevia(this.bloques(), (l) => this.nombreVariable(l)));
  /** Estado guardado (fórmula y letras) para saber si hay cambios. */
  private guardado = signal({ alias: '', letras: '' });
  private claveLetras = computed(() => this.letras().map((l) => `${l.letra}=${l.id_variable}`).sort().join(','));
  formulaCambiada = computed(() =>
    normalizar(this.formulaAlias()) !== this.guardado().alias || this.claveLetras() !== this.guardado().letras);
  letrasUsadas = computed(() => new Set(this.bloques().filter((b) => b.tipo === 'var').map((b) => b.valor)));
  /** Variables que se pueden agregar: activas y sin letra. */
  variablesLibres = computed(() => {
    const ya = new Set(this.letras().map((l) => l.id_variable));
    return this.variables().filter((v) => v.activo && !ya.has(v.id!));
  });
  /** Análisis del backend: fórmula interna y términos de TOTALIZADO3, o el error. */
  analisis = signal<TmiAnalisisFormula | null>(null);
  errorAnalisis = signal('');
  analizando = signal(false);
  guardandoFormula = signal(false);
  errorFormula = signal('');
  private aAnalizar = new Subject<{ alias: string; vars: Record<string, number> }>();

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
    // la fórmula se escribe en el panel del indicador (PUT /formula); el backend no la toma del formulario
    tipo_calculo: ['MENSUAL', Validators.required],
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
    // la fórmula se analiza en el backend mientras se arma (el mismo análisis que al guardar)
    this.aAnalizar.pipe(
      debounceTime(350),
      switchMap(({ alias, vars }) => {
        if (!alias) return of({ ok: null as TmiAnalisisFormula | null, err: '' });
        this.analizando.set(true);
        return this.indicadorSrv.analizarFormula(alias, vars).pipe(
          map((a) => ({ ok: a as TmiAnalisisFormula | null, err: '' })),
          catchError((e) => of({ ok: null, err: enBloques(mensajeError(e, 'Fórmula no válida.'), alias) })));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ ok, err }) => {
      this.analizando.set(false);
      this.analisis.set(ok);
      this.errorAnalisis.set(err);
    });
    this.variableSrv.getVariables().subscribe({ next: (v) => this.variables.set(v) });
    this.catalogoSrv.getGruposReporte().subscribe({ next: (g) => this.gruposReporte.set(g) });
    this.catalogoSrv.getTiposCalculo().subscribe({ next: (t) => this.tiposCalculo.set(t) });
    this.estandarSrv.getTiposEstandar().subscribe({ next: (t) => this.tiposEstandar.set(t) });
  }

  /** seleccionarId: indicador recién creado, para armar su fórmula a continuación. */
  cargar(seleccionarId?: number): void {
    this.loading.set(true);
    this.error.set('');
    this.indicadorSrv.getIndicadores().subscribe({
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
    this.calculoSrv.validarConfig().subscribe({
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
    this.deshacerFormula();
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
      tolerancia: Number(resto.tolerancia ?? 0),
      decimales: resto.decimales == null || (resto.decimales as any) === '' ? null : Number(resto.decimales),
    };
    this.guardando.set(true);
    const req = id ? this.indicadorSrv.putIndicador(id, dto) : this.indicadorSrv.postIndicador(dto);
    req.subscribe({
      next: (res: any) => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.problemas.set(null);
        // indicador nuevo: queda seleccionado para escribir su fórmula
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
    this.indicadorSrv.deleteIndicador(ind.id).subscribe({
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

  // fórmula con variables como letras (A, B, C…)
  private mapa(): Record<string, number> {
    return Object.fromEntries(this.letras().map((l) => [l.letra, l.id_variable]));
  }

  private analizar(): void {
    this.errorFormula.set('');
    this.aAnalizar.next({ alias: this.formulaAlias(), vars: this.mapa() });
  }

  private cambiarBloques(bloques: Bloque[]): void {
    this.bloques.set(bloques);
    this.analizar();
  }

  agregarBloque(valor: string): void {
    const tipo: Bloque['tipo'] = /[A-Z]/.test(valor) ? 'var' : valor === '(' || valor === ')' ? 'par' : 'op';
    this.cambiarBloques([...this.bloques(), { tipo, valor }]);
  }

  agregarNumero(): void {
    const n = this.numero().trim().replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(n)) {
      this.errorFormula.set('Escriba un número, por ejemplo 100 o 0.5.');
      return;
    }
    this.cambiarBloques([...this.bloques(), { tipo: 'num', valor: n }]);
    this.numero.set('');
  }

  quitarBloque(i: number): void {
    this.cambiarBloques(this.bloques().filter((_, j) => j !== i));
  }

  borrarUltimo(): void {
    this.cambiarBloques(this.bloques().slice(0, -1));
  }

  limpiarFormula(): void {
    this.cambiarBloques([]);
  }

  /** Reordena la fórmula al arrastrar un bloque. */
  moverBloque(ev: CdkDragDrop<Bloque[]>): void {
    if (ev.previousIndex === ev.currentIndex) return;
    const bloques = [...this.bloques()];
    moveItemInArray(bloques, ev.previousIndex, ev.currentIndex);
    this.cambiarBloques(bloques);
  }

  simbolo(valor: string): string {
    return ({ '-': '−', '*': '×', '/': '÷' } as Record<string, string>)[valor] ?? valor;
  }

  nombreVariable(letra: string): string {
    return this.letras().find((l) => l.letra === letra)?.variable ?? 'Sin variable';
  }

  /** La variable elegida recibe la siguiente letra libre (A, B, C…). */
  agregarVariable(): void {
    const v = this.variables().find((x) => x.id === Number(this.idVariableNueva()));
    const libre = LETRAS.find((l) => !this.letras().some((x) => x.letra === l));
    if (!v || !libre) return;
    this.letras.update((l) => [...l, { letra: libre, id_variable: v.id!, variable: v.nombre, agregacion: v.agregacion }]);
    this.idVariableNueva.set(null);
    this.analizar();
  }

  quitarLetra(letra: string): void {
    if (this.letrasUsadas().has(letra)) return;
    this.letras.update((l) => l.filter((x) => x.letra !== letra));
    this.analizar();
  }

  /** Carga la fórmula guardada del indicador y la variable de cada letra. */
  deshacerFormula(): void {
    const ind = this.seleccionado();
    this.bloques.set(aBloques(ind?.formula_alias));
    this.letras.set([]);
    this.guardado.set({ alias: normalizar(ind?.formula_alias), letras: '' });
    this.analisis.set(null);
    this.errorAnalisis.set('');
    if (!ind?.id) return;
    this.indicadorSrv.getLetras(ind.id).subscribe({
      next: (l) => {
        if (this.seleccionado()?.id !== ind.id) return;
        this.letras.set(l.map((x) => ({ letra: x.letra, id_variable: x.id_variable, variable: x.variable, agregacion: x.agregacion })));
        this.guardado.set({ alias: normalizar(ind.formula_alias), letras: this.claveLetras() });
        this.analizar();
      },
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar las variables de la fórmula.')),
    });
  }

  textoServicios(t: TmiTerminoFormula): string {
    return t.servicios.length
      ? t.servicios.map((s) => (s.descservicio ? `${s.servicio} · ${s.descservicio}` : String(s.servicio))).join(', ')
      : 'Todos';
  }

  guardarFormula(): void {
    const ind = this.seleccionado();
    const alias = this.formulaAlias();
    if (!ind?.id) return;
    if (!alias) {
      this.errorFormula.set('Arme la fórmula con los bloques de las variables y operaciones.');
      return;
    }
    this.guardandoFormula.set(true);
    this.indicadorSrv.putFormula(ind.id, alias, this.mapa()).subscribe({
      next: (a) => {
        this.guardandoFormula.set(false);
        this.problemas.set(null);
        const actualizado = { ...ind, formula_alias: a.formula_alias, formula: a.formula };
        this.seleccionado.set(actualizado);
        this.indicadores.update((l) => l.map((x) => (x.id === ind.id ? actualizado : x)));
        this.deshacerFormula();   // recarga las letras que quedaron (solo las usadas)
      },
      error: (e) => {
        this.errorFormula.set(mensajeError(e, 'No se pudo guardar la fórmula.'));
        this.guardandoFormula.set(false);
      },
    });
  }

  textoSentido(s: string): string {
    return s === 'MENOR' ? 'Menor es mejor' : s === 'MAYOR' ? 'Mayor es mejor' : 'Dentro de una banda';
  }
}
