import { Component, ElementRef, HostListener, Injector, OnInit, afterNextRender, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CatalogoGas } from '../catalogo-gas';
import { mostrarAyudaEntera } from '../ayuda-visible';

import { TmiVariableService, TmiVariable, TmiVariableLogica, TmiVariableComponente, TmiCatalogoService, mensajeError } from '../../../../services/tmi';

interface OpcionCalculo {
  valor: string;
  agregacion: 'SUMA' | 'MEDIANA';
  total_anual: 'SUMA_MESES' | 'MEDIANA_PERIODO';
  corto: string;
  nombre: string;
  detalle: string;
}

/** Periodo de cierre: el mes anterior al actual como AAAAMM (en noviembre de 2026, 202610). */
function periodoCierre(): number {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.getFullYear() * 100 + d.getMonth() + 1;
}

@Component({
  selector: 'app-tmi-variables',
  imports: [ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './tmi-variables.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css'],
})
export class TmiVariables implements OnInit {
  private variableSrv = inject(TmiVariableService);
  private fb = inject(FormBuilder);

  variables = signal<TmiVariable[]>([]);
  filtro = signal('');
  variablesFiltradas = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return f ? this.variables().filter((v) => v.nombre.toLowerCase().includes(f)) : this.variables();
  });
  seleccionada = signal<TmiVariable | null>(null);
  logica = signal<TmiVariableLogica[]>([]);
  /** Variables que suma la variable seleccionada (variable compuesta). */
  componentes = signal<TmiVariableComponente[]>([]);
  nuevoComponente: number | null = null;
  /** Variables que se pueden agregar como componente: con el mismo cálculo, ni la misma ni las que ya están. */
  candidatos = computed(() => {
    const sel = this.seleccionada();
    const ya = new Set(this.componentes().map((c) => c.id_variable_componente));
    return this.variables().filter((v) => v.id !== sel?.id && !ya.has(v.id!) && !!sel && this.calculoDe(v) === this.calculoDe(sel));
  });
  /** Alta de una actividad: servicios marcados (se crea una fila por cada uno; ninguno = todos los servicios). */
  serviciosMarcados = signal<number[]>([]);

  /** Grupo -> actividad -> servicio en cascada (DIM_GRUPOACTIVIDADSERVICIO). */
  readonly gas = new CatalogoGas(inject(TmiCatalogoService));

  loading = signal(false);
  loadingLogica = signal(false);
  error = signal('');
  errorLogica = signal('');
  /** Indicadores cuya fórmula no se pudo actualizar después del último cambio (siguen con la fórmula anterior). */
  avisosFormula = signal<string[]>([]);
  eliminandoId = signal<number | null>(null);

  mostrarFormVariable = signal(false);
  mostrarFormLogica = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  formVariable = this.fb.nonNullable.group({
    id: [0],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    agregacion: ['SUMA' as 'SUMA' | 'MEDIANA'],
    total_anual: ['SUMA_MESES' as 'SUMA_MESES' | 'MEDIANA_PERIODO'],
    activo: [true],
  });

  formLogica = this.fb.group({
    id: [0],
    tipgrupo: [null as number | null, Validators.required],
    actividad: [null as number | null, Validators.required],
    servicio: [null as number | null],
    condicion_hoja: [''],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.variableSrv.getVariables().subscribe({
      next: (v) => {
        this.variables.set(v);
        const sel = this.seleccionada();
        if (sel) this.seleccionada.set(v.find((x) => x.id === sel.id) ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudieron cargar las variables.'));
        this.loading.set(false);
      },
    });
  }

  seleccionar(v: TmiVariable): void {
    this.seleccionada.set(v);
    this.cargarLogica();
  }

  cargarLogica(): void {
    const v = this.seleccionada();
    if (!v?.id) return;
    this.cargarComponentes();
    this.loadingLogica.set(true);
    this.errorLogica.set('');
    this.variableSrv.getLogica(v.id).subscribe({
      next: (l) => {
        this.logica.set(l);
        this.loadingLogica.set(false);
      },
      error: (e) => {
        this.errorLogica.set(mensajeError(e, 'No se pudo cargar la lógica de la variable.'));
        this.loadingLogica.set(false);
      },
    });
  }

  // variable
  nuevaVariable(): void {
    this.formVariable.reset({ id: 0, nombre: '', descripcion: '', agregacion: 'SUMA', total_anual: 'SUMA_MESES', activo: true });
    this.errorForm.set('');
    this.ayudaCalculo.set(false);   // el formulario se abre siempre con la ayuda cerrada
    this.mostrarFormVariable.set(true);
  }

  editarVariable(v: TmiVariable, ev?: Event): void {
    ev?.stopPropagation();
    this.formVariable.reset({
      id: v.id ?? 0,
      nombre: v.nombre,
      descripcion: v.descripcion ?? '',
      agregacion: v.agregacion,
      total_anual: v.total_anual,
      activo: v.activo,
    });
    this.errorForm.set('');
    this.ayudaCalculo.set(false);   // el formulario se abre siempre con la ayuda cerrada
    this.mostrarFormVariable.set(true);
  }

  /** Cálculos de una variable (CONSTRUCCION_TMI): cómo se toma el mes y el acumulado de enero al mes. */
  readonly opcionesCalculo: OpcionCalculo[] = [
    { valor: 'SUMA', agregacion: 'SUMA', total_anual: 'SUMA_MESES', corto: 'SUMA',
      nombre: 'Suma',
      detalle: 'Cada mes suma las cantidades. De enero al mes, suma los meses.' },
    { valor: 'SUMA_PERIODO', agregacion: 'SUMA', total_anual: 'MEDIANA_PERIODO', corto: 'SUMA · MED. PERIODO',
      nombre: 'Suma con mediana del periodo',
      detalle: 'Cada mes suma las cantidades. De enero al mes, saca la mediana de cada conjunto y servicio ' +
        'con todos los registros de esos meses, la redondea y suma las medianas.' },
    { valor: 'MEDIANA', agregacion: 'MEDIANA', total_anual: 'MEDIANA_PERIODO', corto: 'MEDIANA',
      nombre: 'Mediana',
      detalle: 'Cada mes saca la mediana de cada conjunto y servicio, la redondea y suma las medianas. ' +
        'De enero al mes, hace lo mismo con todos los registros de esos meses.' },
  ];

  /** Periodo del SQL de prueba: el de cierre, el mes anterior (en noviembre, 202610). En el archivo se cambia @PERIODO. */
  readonly periodoSql = periodoCierre();
  descargandoSql = signal(false);

  /** Descarga el query que calcula la variable en SQL Server: valor de cada mes y de enero al mes. */
  descargarSql(v: TmiVariable): void {
    const periodo = this.periodoSql;
    if (!v.id) return;
    this.errorLogica.set('');
    this.descargandoSql.set(true);
    this.variableSrv.getConsultaSql(v.id, periodo).subscribe({
      next: ({ sql }) => {
        this.descargandoSql.set(false);
        // BOM: SSMS abre el archivo como UTF-8 y conserva las tildes de los comentarios
        const url = window.URL.createObjectURL(new Blob(['\ufeff' + sql], { type: 'application/sql;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `variable_${v.id}_${(v.nombre || '').replace(/[^\w.-]+/g, '_').slice(0, 60)}_${periodo}.sql`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (e) => {
        this.descargandoSql.set(false);
        this.errorLogica.set(mensajeError(e, 'No se pudo generar el SQL de la variable.'));
      },
    });
  }

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Ayuda del campo "Cálculo de la variable" (signo de pregunta). */
  ayudaCalculo = signal(false);

  alternarAyudaCalculo(ev: Event): void {
    ev.stopPropagation();
    this.ayudaPagina.set(false);
    this.ayudaCompuesta.set(false);
    this.ayudaVariable.set(false);
    this.ayudaCalculo.update((v) => !v);
    if (!this.ayudaCalculo()) return;
    // el formulario tiene scroll propio: si la ayuda queda cortada abajo, se desplaza hasta verla entera
    afterNextRender(() => mostrarAyudaEntera(this.host.nativeElement.querySelector('.dyn-ayuda-pop')),
      { injector: this.injector });
  }

  /** Ayuda de la página (signo de pregunta junto al título). */
  ayudaPagina = signal(false);

  alternarAyudaPagina(ev: Event): void {
    ev.stopPropagation();
    this.ayudaCalculo.set(false);
    this.ayudaCompuesta.set(false);
    this.ayudaVariable.set(false);
    this.ayudaPagina.update((v) => !v);
  }

  /** Ayuda junto al nombre de la variable elegida: cómo se calcula. */
  ayudaVariable = signal(false);

  alternarAyudaVariable(ev: Event): void {
    ev.stopPropagation();
    this.ayudaCalculo.set(false);
    this.ayudaPagina.set(false);
    this.ayudaCompuesta.set(false);
    this.ayudaVariable.update((v) => !v);
  }

  /** Ayuda de la sección "Variables que suma" del detalle. */
  ayudaCompuesta = signal(false);

  alternarAyudaCompuesta(ev: Event): void {
    ev.stopPropagation();
    this.ayudaCalculo.set(false);
    this.ayudaPagina.set(false);
    this.ayudaVariable.set(false);
    this.ayudaCompuesta.update((v) => !v);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  cerrarAyudaCalculo(): void {
    this.ayudaCalculo.set(false);
    this.ayudaPagina.set(false);
    this.ayudaCompuesta.set(false);
    this.ayudaVariable.set(false);
  }

  calculoDe(v: { agregacion?: string | null; total_anual?: string | null }): string {
    if (v.agregacion === 'MEDIANA') return 'MEDIANA';
    return v.total_anual === 'MEDIANA_PERIODO' ? 'SUMA_PERIODO' : 'SUMA';
  }

  calculoForm(): string {
    return this.calculoDe(this.formVariable.getRawValue());
  }

  opcionCalculo(valor: string): OpcionCalculo {
    return this.opcionesCalculo.find((o) => o.valor === valor) ?? this.opcionesCalculo[0];
  }

  elegirCalculo(valor: string): void {
    const o = this.opcionCalculo(valor);
    this.formVariable.patchValue({ agregacion: o.agregacion, total_anual: o.total_anual });
  }

  guardarVariable(): void {
    if (this.formVariable.invalid) {
      this.formVariable.markAllAsTouched();
      this.errorForm.set('Escriba el nombre de la variable.');
      return;
    }
    const { id, ...dto } = this.formVariable.getRawValue();
    // MEDIANA solo acumula con la mediana del periodo
    const datos: TmiVariable = {
      ...dto,
      descripcion: dto.descripcion || null,
      total_anual: dto.agregacion === 'MEDIANA' ? 'MEDIANA_PERIODO' : dto.total_anual,
    };
    this.guardando.set(true);
    const req = id ? this.variableSrv.putVariable(id, datos) : this.variableSrv.postVariable(datos);
    this.avisosFormula.set([]);
    req.subscribe({
      next: (r) => {
        this.verAvisos(r);
        this.guardando.set(false);
        this.mostrarFormVariable.set(false);
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar la variable.'));
        this.guardando.set(false);
      },
    });
  }

  eliminarVariable(v: TmiVariable, ev?: Event): void {
    ev?.stopPropagation();
    if (!v.id || !confirm(`¿Eliminar la variable "${v.nombre}" y todos sus conjuntos?`)) return;
    this.eliminandoId.set(v.id);
    this.variableSrv.deleteVariable(v.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        if (this.seleccionada()?.id === v.id) {
          this.seleccionada.set(null);
          this.logica.set([]);
        }
        this.cargar();
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo eliminar la variable.'));
        this.eliminandoId.set(null);
      },
    });
  }

  /** Texto del cálculo de la variable para la lista y el panel. */
  textoCalculo(v: TmiVariable): string {
    const mes = v.agregacion === 'SUMA' ? 'suma las cantidades del mes' : 'mediana de cada conjunto y servicio en el mes';
    return v.total_anual === 'MEDIANA_PERIODO'
      ? `${mes}; el total anual es la mediana del periodo`
      : `${mes}; el total anual es la suma de los meses`;
  }

  // componentes (variable compuesta)
  cargarComponentes(): void {
    const v = this.seleccionada();
    if (!v?.id) return;
    this.variableSrv.getComponentes(v.id).subscribe({
      next: (c) => this.componentes.set(c),
      error: (e) => this.errorLogica.set(mensajeError(e, 'No se pudieron cargar los componentes de la variable.')),
    });
  }

  agregarComponente(): void {
    const v = this.seleccionada();
    if (!v?.id || this.nuevoComponente == null) return;
    this.errorLogica.set('');
    this.avisosFormula.set([]);
    this.variableSrv.postComponente({ id_variable: v.id, id_variable_componente: Number(this.nuevoComponente) }).subscribe({
      next: (r) => {
        this.verAvisos(r);
        this.nuevoComponente = null;
        this.cargarComponentes();
        this.cargar();
      },
      error: (e) => this.errorLogica.set(mensajeError(e, 'No se pudo agregar el componente.')),
    });
  }

  quitarComponente(c: TmiVariableComponente): void {
    if (!c.id || !confirm(`¿Quitar "${c.componente}" de la variable?`)) return;
    this.avisosFormula.set([]);
    this.variableSrv.deleteComponente(c.id).subscribe({
      next: (r) => {
        this.verAvisos(r);
        this.cargarComponentes();
        this.cargar();
      },
      error: (e) => this.errorLogica.set(mensajeError(e, 'No se pudo quitar el componente.')),
    });
  }

  // lógica
  marcarServicio(id: number, marcado: boolean): void {
    this.serviciosMarcados.update((s) => (marcado ? [...s, id] : s.filter((x) => x !== id)));
  }

  nuevaLogica(): void {
    this.serviciosMarcados.set([]);
    this.formLogica.reset({
      id: 0, tipgrupo: null, actividad: null, servicio: null, condicion_hoja: '',
      activo: true,
    });
    this.errorForm.set('');
    this.mostrarFormLogica.set(true);
  }

  editarLogica(l: TmiVariableLogica): void {
    this.formLogica.reset({
      id: l.id ?? 0,
      tipgrupo: l.tipgrupo,
      actividad: l.actividad,
      servicio: l.servicio,
      condicion_hoja: l.condicion_hoja ?? '',
      activo: l.activo,
    });
    this.errorForm.set('');
    this.mostrarFormLogica.set(true);
  }

  /** Al cambiar el grupo se vuelven a elegir la actividad y el servicio (dependen del grupo). */
  alCambiarGrupo(): void {
    this.formLogica.patchValue({ actividad: null, servicio: null });
    this.serviciosMarcados.set([]);
  }

  alCambiarActividad(): void {
    this.formLogica.patchValue({ servicio: null });
    this.serviciosMarcados.set([]);
  }

  guardarLogica(): void {
    const v = this.seleccionada();
    if (!v?.id) return;
    if (this.formLogica.invalid) {
      this.formLogica.markAllAsTouched();
      this.errorForm.set('Elija el grupo y la actividad.');
      return;
    }
    const f = this.formLogica.getRawValue();
    const dto: TmiVariableLogica = {
      id_variable: v.id,
      tipgrupo: Number(f.tipgrupo),
      actividad: Number(f.actividad),
      servicio: f.servicio == null || (f.servicio as any) === '' ? null : Number(f.servicio),
      condicion_hoja: f.condicion_hoja || null,
      activo: !!f.activo,
    };
    this.guardando.set(true);
    // alta con varios servicios marcados: una fila por servicio (como "servicio IN (...)" en Generar_pivot.sql)
    const marcados = f.id ? [] : this.serviciosMarcados();
    const req = f.id
      ? this.variableSrv.putLogica(f.id, dto)
      : marcados.length
        ? forkJoin(marcados.map((s) => this.variableSrv.postLogica({ ...dto, servicio: s })))
        : this.variableSrv.postLogica(dto);
    this.avisosFormula.set([]);
    req.subscribe({
      next: (r) => {
        this.verAvisos(r);
        this.guardando.set(false);
        this.mostrarFormLogica.set(false);
        this.cargarLogica();
        this.cargar();
      },
      error: (e) => {
        this.errorForm.set(mensajeError(e, 'No se pudo guardar la lógica.'));
        this.guardando.set(false);
      },
    });
  }

  eliminarLogica(l: TmiVariableLogica): void {
    if (!l.id || !confirm(`¿Quitar ${l.desctipgrupo ?? l.tipgrupo} / ${l.descactividad ?? l.actividad} de la variable?`)) return;
    this.eliminandoId.set(l.id);
    this.avisosFormula.set([]);
    this.variableSrv.deleteLogica(l.id).subscribe({
      next: (r) => {
        this.verAvisos(r);
        this.eliminandoId.set(null);
        this.cargarLogica();
        this.cargar();
      },
      error: (e) => {
        this.errorLogica.set(mensajeError(e, 'No se pudo eliminar la fila.'));
        this.eliminandoId.set(null);
      },
    });
  }

  /** avisos de la respuesta (o de cada respuesta, si se guardaron varias filas a la vez), sin repetir. */
  private verAvisos(r: unknown): void {
    const lista = (Array.isArray(r) ? r : [r]).flatMap((x: any) => (Array.isArray(x?.avisos) ? x.avisos : []));
    this.avisosFormula.set([...new Set<string>(lista)]);
  }
}
