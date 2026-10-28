import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiAmbito,
  TmiCatalogo,
  TmiCentroCatalogo,
  TmiDinamicoService,
  TmiIndicador,
  TmiIndicadorEstandar,
  TmiLetra,
  TmiProblemaConfig,
  TmiVariable,
  TmiVariableLogica,
  mensajeError,
} from '../../../services/tmi-dinamico-service';

const FORMULA = /^[A-Z0-9 ().+*-]+$/;
const HOJA = /^[^\[\]:*?/\\]+$/;
export const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Indicadores definidos por el usuario: fórmula con letras, tipo de cálculo, puntaje, letras y ámbito. */
@Component({
  selector: 'app-tmi-config-indicadores',
  imports: [ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './tmi-config-indicadores.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiConfigIndicadores implements OnInit {
  private srv = inject(TmiDinamicoService);
  private fb = inject(FormBuilder);

  readonly letrasDisponibles = LETRAS;
  indicadores = signal<TmiIndicador[]>([]);
  seleccionado = signal<TmiIndicador | null>(null);
  letras = signal<TmiLetra[]>([]);
  ambito = signal<TmiAmbito[]>([]);
  estandaresIndicador = signal<TmiIndicadorEstandar[]>([]);
  centrosCatalogo = signal<TmiCentroCatalogo[]>([]);
  nivelesDisponibles = computed(() =>
    [...new Set(this.centrosCatalogo().map((c) => c.nivel).filter(Boolean))].sort(),
  );
  categoriasDisponibles = computed(() =>
    [...new Set(this.centrosCatalogo().map((c) => c.categoria || '').filter(Boolean))].sort(),
  );
  tiposDisponibles = computed(() =>
    [...new Set(this.centrosCatalogo().map((c) => c.tipo).filter(Boolean))].sort(),
  );
  redesDisponibles = computed(() =>
    [...new Set(this.centrosCatalogo().map((c) => c.red).filter(Boolean))].sort(),
  );
  variables = signal<TmiVariable[]>([]);
  gruposReporte = signal<TmiCatalogo[]>([]);
  tiposCalculo = signal<{ codigo: string; descripcion: string }[]>([]);
  problemas = signal<TmiProblemaConfig[] | null>(null);

  // Catálogos DIM_GRUPO, DIM_ACTIVIDAD y Servicio para configurar la lógica de cada variable desde Indicadores
  gruposDim = signal<TmiCatalogo[]>([]);
  actividadesDim = signal<TmiCatalogo[]>([]);
  filtroActividad = signal('');
  actividadesFiltradas = computed(() => {
    const f = this.filtroActividad().trim().toLowerCase();
    const lista = this.actividadesDim();
    return f
      ? lista.filter((a) =>
          `${a.actividad ?? a.id} ${a['descactividad'] ?? ''} ${a['desclarga'] ?? ''} ${a.descripcion ?? ''} ${a['Proceso'] ?? ''}`
            .toLowerCase()
            .includes(f),
        )
      : lista;
  });
  serviciosDim = signal<TmiCatalogo[]>([]);
  variableActiva = signal<{ id: number; nombre: string } | null>(null);
  logicaVariable = signal<TmiVariableLogica[]>([]);
  mostrarModalLogica = signal(false);
  mostrarModalNuevaVar = signal(false);
  errorLogicaModal = signal('');
  nuevaVar = {
    letra: 'A',
    nombre: '',
    total_anual: 'SUMA_MESES' as 'SUMA_MESES' | 'MEDIANA_PERIODO',
    tipgrupo: null as number | null,
    actividad: null as number | null,
    servicio: null as number | null,
    agregacion: 'SUMA' as 'SUMA' | 'MEDIANA',
  };
  nuevaFilaLogica = {
    id: 0,
    tipgrupo: null as number | null,
    actividad: null as number | null,
    servicio: null as number | null,
    condicion_hoja: '',
    agregacion: 'SUMA' as 'SUMA' | 'MEDIANA',
    periodo_desde: 200001,
    periodo_hasta: 999912,
  };

  /** Letras de la fórmula del indicador seleccionado que todavía no tienen variable. */
  letrasSinVariable = computed(() => {
    const ind = this.seleccionado();
    if (!ind) return [];
    const usadas = new Set((ind.expr_numerador + ' ' + ind.expr_denominador).split('').filter((c) => /[A-Z]/.test(c)));
    const definidas = new Set(this.letras().map((l) => l.letra));
    return [...usadas].filter((l) => !definidas.has(l)).sort();
  });

  loading = signal(false);
  error = signal('');
  errorDetalle = signal('');
  validando = signal(false);
  eliminandoId = signal<number | null>(null);
  mostrarForm = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  nuevaLetra = { letra: 'A', id_variable: null as number | null };
  nuevoEstandar = {
    id: 0,
    nivel: '',
    categoria: '',
    tipo: '',
    periodo_desde: 202601,
    periodo_hasta: 202612,
    estandar: null as number | null,
    acept: null as number | null,
    acept_mas: null as number | null,
  };
  nuevoAmbito = {
    red: '',
    nivel: '',
    categoria: '',
    tipo: '',
    codcentro: null as number | null,
    incluir: true,
    periodo_desde: 202601,
    periodo_hasta: 202612,
  };

  form = this.fb.nonNullable.group({
    id: [0],
    grupo: [null as number | null],
    indicador: ['', [Validators.required, Validators.maxLength(200)]],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre_hoja: ['', [Validators.required, Validators.maxLength(31), Validators.pattern(HOJA)]],
    titulo_hoja: [''],
    orden: [1, Validators.required],
    expr_numerador: ['A', [Validators.required, Validators.pattern(FORMULA)]],
    expr_denominador: ['B', [Validators.required, Validators.pattern(FORMULA)]],
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
    this.srv.getGrupos().subscribe({ next: (g) => this.gruposDim.set(g) });
    this.srv.getActividades().subscribe({ next: (a) => this.actividadesDim.set(a) });
    this.srv.getCentros().subscribe({ next: (c) => this.centrosCatalogo.set(c) });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.srv.getIndicadores().subscribe({
      next: (lista) => {
        this.indicadores.set(lista);
        const sel = this.seleccionado();
        if (sel) this.seleccionado.set(lista.find((x) => x.id === sel.id) ?? null);
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
        this.nuevaLetra.letra = this.letrasSinVariable()[0] ?? this.nuevaLetra.letra;
      },
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar las letras.')),
    });
    this.srv.getAmbito(id).subscribe({
      next: (a) => this.ambito.set(a),
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar el ámbito.')),
    });
    this.srv.getIndicadorEstandares(id).subscribe({
      next: (est) => this.estandaresIndicador.set(est),
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar los estándares del indicador.')),
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
    f.expr_numerador = (f.expr_numerador || '').toUpperCase();
    f.expr_denominador = (f.expr_denominador || '').toUpperCase();
    this.form.patchValue({ expr_numerador: f.expr_numerador, expr_denominador: f.expr_denominador });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorForm.set('Revise los campos obligatorios. La fórmula solo admite letras A-Z, números, espacios, + - * . y paréntesis; '
        + 'el nombre de hoja no admite [ ] : * ? / \\ y tiene máximo 31 caracteres.');
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
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.problemas.set(null);
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar el indicador.'));
        this.guardando.set(false);
      },
    });
  }

  eliminar(ind: TmiIndicador, ev?: Event): void {
    ev?.stopPropagation();
    if (!ind.id || !confirm(`¿Eliminar el indicador "${ind.indicador}" con sus letras, ámbito y resultados?\n`
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

  // letras
  agregarLetra(): void {
    const ind = this.seleccionado();
    if (!ind?.id || this.nuevaLetra.id_variable == null) {
      this.errorDetalle.set('Seleccione la letra y la variable.');
      return;
    }
    this.errorDetalle.set('');
    this.srv.postLetra({ id_indicador: ind.id, letra: this.nuevaLetra.letra, id_variable: Number(this.nuevaLetra.id_variable) })
      .subscribe({
        next: () => {
          this.nuevaLetra.id_variable = null;
          this.cargarDetalle();
          this.cargar();
        },
        error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo agregar la letra (¿ya existe esa variable en esa letra?).')),
      });
  }

  quitarLetra(l: TmiLetra): void {
    if (!l.id) return;
    this.srv.deleteLetra(l.id).subscribe({
      next: () => {
        this.cargarDetalle();
        this.cargar();
      },
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo quitar la letra.')),
    });
  }

  // estándares del indicador por Nivel, Categoría y/o Tipo (1, 2 o los 3) y por Periodo
  limpiarEstandarIndicador(): void {
    this.nuevoEstandar = {
      id: 0,
      nivel: '',
      categoria: '',
      tipo: '',
      periodo_desde: 202601,
      periodo_hasta: 202612,
      estandar: null,
      acept: null,
      acept_mas: null,
    };
  }

  editarEstandarIndicador(e: TmiIndicadorEstandar): void {
    this.nuevoEstandar = {
      id: e.id ?? 0,
      nivel: e.nivel ?? '',
      categoria: e.categoria ?? '',
      tipo: e.tipo ?? '',
      periodo_desde: e.periodo_desde,
      periodo_hasta: e.periodo_hasta,
      estandar: e.estandar,
      acept: e.acept ?? null,
      acept_mas: e.acept_mas ?? null,
    };
  }

  guardarEstandarIndicador(): void {
    const ind = this.seleccionado();
    const e = this.nuevoEstandar;
    if (!ind?.id) return;
    if (!e.nivel.trim() && !e.categoria.trim() && !e.tipo.trim()) {
      this.errorDetalle.set('Seleccione al menos Nivel, Categoría o Tipo (o combinación de dos o tres).');
      return;
    }
    if (e.estandar == null || (e.estandar as any) === '') {
      this.errorDetalle.set('Ingrese el valor del estándar.');
      return;
    }
    if (Number(e.periodo_desde) > Number(e.periodo_hasta)) {
      this.errorDetalle.set('El periodo "desde" no puede ser mayor que "hasta".');
      return;
    }
    this.errorDetalle.set('');
    const dto: TmiIndicadorEstandar = {
      id_indicador: ind.id,
      nivel: e.nivel.trim() || null,
      categoria: e.categoria.trim() || null,
      tipo: e.tipo.trim() || null,
      periodo_desde: Number(e.periodo_desde || 202601),
      periodo_hasta: Number(e.periodo_hasta || 202612),
      estandar: Number(e.estandar),
      acept: e.acept == null || (e.acept as any) === '' ? null : Number(e.acept),
      acept_mas: e.acept_mas == null || (e.acept_mas as any) === '' ? null : Number(e.acept_mas),
      activo: true,
    };
    const req = e.id ? this.srv.putIndicadorEstandar(e.id, dto) : this.srv.postIndicadorEstandar(dto);
    req.subscribe({
      next: () => {
        this.limpiarEstandarIndicador();
        this.cargarDetalle();
      },
      error: (err) => this.errorDetalle.set(mensajeError(err, 'No se pudo guardar el estándar del indicador.')),
    });
  }

  quitarEstandarIndicador(e: TmiIndicadorEstandar): void {
    if (!e.id) return;
    this.srv.deleteIndicadorEstandar(e.id).subscribe({
      next: () => this.cargarDetalle(),
      error: (err) => this.errorDetalle.set(mensajeError(err, 'No se pudo eliminar el estándar.')),
    });
  }

  descripcionEstandarCentro(e: TmiIndicadorEstandar): string {
    const partes = [
      e.nivel && `Nivel: ${e.nivel}`,
      e.categoria && `Categoría: ${e.categoria}`,
      e.tipo && `Tipo: ${e.tipo}`,
    ];
    return partes.filter(Boolean).join(' + ');
  }

  vigenciaPeriodo(desde: number, hasta: number): string {
    if (desde <= 200001 && hasta >= 999912) return 'Siempre';
    if (desde === hasta) return String(desde);
    return `${desde} – ${hasta}`;
  }

  // ámbito
  agregarAmbito(): void {
    const ind = this.seleccionado();
    const a = this.nuevoAmbito;
    if (!ind?.id) return;
    if (!a.red.trim() && !a.nivel.trim() && !a.categoria.trim() && !a.tipo.trim() && a.codcentro == null) {
      this.errorDetalle.set('Indique al menos nivel, categoría, tipo, red o código de centro.');
      return;
    }
    if (Number(a.periodo_desde) > Number(a.periodo_hasta)) {
      this.errorDetalle.set('El periodo "desde" no puede ser mayor que "hasta".');
      return;
    }
    this.errorDetalle.set('');
    this.srv.postAmbito({
      id_indicador: ind.id,
      red: a.red.trim() || null,
      nivel: a.nivel.trim() || null,
      categoria: a.categoria.trim() || null,
      tipo: a.tipo.trim() || null,
      codcentro: a.codcentro == null || (a.codcentro as any) === '' ? null : Number(a.codcentro),
      incluir: a.incluir,
      periodo_desde: Number(a.periodo_desde || 200001),
      periodo_hasta: Number(a.periodo_hasta || 999912),
    }).subscribe({
      next: () => {
        this.nuevoAmbito = {
          red: '',
          nivel: '',
          categoria: '',
          tipo: '',
          codcentro: null,
          incluir: true,
          periodo_desde: 202601,
          periodo_hasta: 202612,
        };
        this.cargarDetalle();
      },
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo agregar el ámbito.')),
    });
  }

  quitarAmbito(a: TmiAmbito): void {
    if (!a.id) return;
    this.srv.deleteAmbito(a.id).subscribe({
      next: () => this.cargarDetalle(),
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo quitar el ámbito.')),
    });
  }

  descripcionAmbito(a: TmiAmbito): string {
    const partes = [
      a.nivel && `Nivel ${a.nivel}`,
      a.categoria && `Categoría ${a.categoria}`,
      a.tipo && `Tipo ${a.tipo}`,
      a.red && `Red ${a.red}`,
      a.codcentro != null && `Centro ${a.codcentro}`,
    ];
    return partes.filter(Boolean).join(' + ');
  }

  textoSentido(s: string): string {
    return s === 'MENOR' ? 'Menor es mejor' : s === 'MAYOR' ? 'Mayor es mejor' : 'Dentro de una banda';
  }

  // Configuración directa de Grupo (DIM_GRUPO), Actividad (DIM_ACTIVIDAD) y Servicio para variables del indicador
  abrirLogicaVariable(l: TmiLetra): void {
    this.variableActiva.set({ id: l.id_variable, nombre: l.variable || `Variable #${l.id_variable}` });
    this.errorLogicaModal.set('');
    this.filtroActividad.set('');
    this.limpiarFilaLogica();
    this.cargarLogicaVariable(l.id_variable);
    this.mostrarModalLogica.set(true);
  }

  cargarLogicaVariable(idVariable: number): void {
    this.srv.getLogica(idVariable).subscribe({
      next: (filas) => this.logicaVariable.set(filas),
      error: (e) => this.errorLogicaModal.set(mensajeError(e, 'No se pudo cargar la lógica de la variable.')),
    });
  }

  limpiarFilaLogica(): void {
    this.nuevaFilaLogica = {
      id: 0,
      tipgrupo: null,
      actividad: null,
      servicio: null,
      condicion_hoja: '',
      agregacion: 'SUMA',
      periodo_desde: 200001,
      periodo_hasta: 999912,
    };
    this.serviciosDim.set([]);
  }

  editarFilaLogica(fila: TmiVariableLogica): void {
    this.nuevaFilaLogica = {
      id: fila.id ?? 0,
      tipgrupo: fila.tipgrupo,
      actividad: fila.actividad,
      servicio: fila.servicio,
      condicion_hoja: fila.condicion_hoja ?? '',
      agregacion: fila.agregacion,
      periodo_desde: fila.periodo_desde,
      periodo_hasta: fila.periodo_hasta,
    };
    this.cargarServiciosModal(fila.tipgrupo, fila.actividad);
  }

  cargarServiciosModal(tipgrupo: number | null, actividad: number | null): void {
    this.serviciosDim.set([]);
    if (tipgrupo == null || actividad == null) return;
    this.srv.getServicios(Number(tipgrupo), Number(actividad)).subscribe({
      next: (s) => this.serviciosDim.set(s),
    });
  }

  guardarFilaLogica(): void {
    const v = this.variableActiva();
    const f = this.nuevaFilaLogica;
    if (!v) return;
    if (f.tipgrupo == null || f.actividad == null) {
      this.errorLogicaModal.set('Seleccione Grupo (DIM_GRUPO) y Actividad (DIM_ACTIVIDAD).');
      return;
    }
    this.errorLogicaModal.set('');
    const dto: TmiVariableLogica = {
      id_variable: v.id,
      tipgrupo: Number(f.tipgrupo),
      actividad: Number(f.actividad),
      servicio: f.servicio == null || (f.servicio as any) === '' ? null : Number(f.servicio),
      condicion_hoja: f.condicion_hoja || null,
      agregacion: f.agregacion,
      periodo_desde: Number(f.periodo_desde || 200001),
      periodo_hasta: Number(f.periodo_hasta || 999912),
      activo: true,
    };
    const req = f.id ? this.srv.putLogica(f.id, dto) : this.srv.postLogica(dto);
    req.subscribe({
      next: () => {
        this.limpiarFilaLogica();
        this.cargarLogicaVariable(v.id);
        this.cargarDetalle();
        this.srv.getVariables().subscribe({ next: (vars) => this.variables.set(vars) });
      },
      error: (e) => this.errorLogicaModal.set(mensajeError(e, 'No se pudo guardar el grupo/actividad/servicio.')),
    });
  }

  quitarFilaLogica(fila: TmiVariableLogica): void {
    const v = this.variableActiva();
    if (!fila.id || !v) return;
    this.srv.deleteLogica(fila.id).subscribe({
      next: () => {
        this.cargarLogicaVariable(v.id);
        this.cargarDetalle();
        this.srv.getVariables().subscribe({ next: (vars) => this.variables.set(vars) });
      },
      error: (e) => this.errorLogicaModal.set(mensajeError(e, 'No se pudo quitar la actividad.')),
    });
  }

  abrirNuevaVariable(): void {
    this.nuevaVar = {
      letra: this.nuevaLetra.letra || 'A',
      nombre: '',
      total_anual: 'SUMA_MESES',
      tipgrupo: null,
      actividad: null,
      servicio: null,
      agregacion: 'SUMA',
    };
    this.filtroActividad.set('');
    this.serviciosDim.set([]);
    this.errorLogicaModal.set('');
    this.mostrarModalNuevaVar.set(true);
  }

  crearVariableYAsignar(): void {
    const ind = this.seleccionado();
    const nv = this.nuevaVar;
    if (!ind?.id) return;
    if (!nv.nombre.trim() || nv.tipgrupo == null || nv.actividad == null) {
      this.errorLogicaModal.set('Ingrese el nombre de la variable y seleccione Grupo (DIM_GRUPO) y Actividad (DIM_ACTIVIDAD).');
      return;
    }
    this.errorLogicaModal.set('');
    this.guardando.set(true);
    this.srv.postVariable({
      nombre: nv.nombre.trim(),
      descripcion: null,
      total_anual: nv.total_anual,
      activo: true,
    }).subscribe({
      next: (res) => {
        const idVar = res.id;
        this.srv.postLogica({
          id_variable: idVar,
          tipgrupo: Number(nv.tipgrupo),
          actividad: Number(nv.actividad),
          servicio: nv.servicio == null || (nv.servicio as any) === '' ? null : Number(nv.servicio),
          condicion_hoja: null,
          agregacion: nv.agregacion,
          periodo_desde: 200001,
          periodo_hasta: 999912,
          activo: true,
        }).subscribe({
          next: () => {
            this.srv.postLetra({ id_indicador: ind.id!, letra: nv.letra, id_variable: idVar }).subscribe({
              next: () => {
                this.guardando.set(false);
                this.mostrarModalNuevaVar.set(false);
                this.srv.getVariables().subscribe({ next: (vars) => this.variables.set(vars) });
                this.cargarDetalle();
                this.cargar();
              },
              error: (e) => {
                this.guardando.set(false);
                this.errorLogicaModal.set(mensajeError(e, 'Variable creada, pero no se pudo asignar a la letra.'));
              },
            });
          },
          error: (e) => {
            this.guardando.set(false);
            this.errorLogicaModal.set(mensajeError(e, 'Variable creada, pero no se pudo guardar su grupo/actividad.'));
          },
        });
      },
      error: (e) => {
        this.guardando.set(false);
        this.errorLogicaModal.set(mensajeError(e, 'No se pudo crear la variable.'));
      },
    });
  }
}
