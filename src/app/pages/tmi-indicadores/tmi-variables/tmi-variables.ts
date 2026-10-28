import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  TmiCatalogo,
  TmiDinamicoService,
  TmiVariable,
  TmiVariableLogica,
  mensajeError,
} from '../../../services/tmi-dinamico-service';

@Component({
  selector: 'app-tmi-variables',
  imports: [ReactiveFormsModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './tmi-variables.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css'],
})
export class TmiVariables implements OnInit {
  private srv = inject(TmiDinamicoService);
  private fb = inject(FormBuilder);

  variables = signal<TmiVariable[]>([]);
  filtro = signal('');
  variablesFiltradas = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return f ? this.variables().filter((v) => v.nombre.toLowerCase().includes(f)) : this.variables();
  });
  seleccionada = signal<TmiVariable | null>(null);
  logica = signal<TmiVariableLogica[]>([]);

  grupos = signal<TmiCatalogo[]>([]);
  actividades = signal<TmiCatalogo[]>([]);
  filtroActividad = signal('');
  actividadesFiltradas = computed(() => {
    const f = this.filtroActividad().trim().toLowerCase();
    const lista = this.actividades();
    return f
      ? lista.filter((a) =>
          `${a.actividad ?? a.id} ${a['descactividad'] ?? ''} ${a['desclarga'] ?? ''} ${a.descripcion ?? ''} ${a['Proceso'] ?? ''}`
            .toLowerCase()
            .includes(f),
        )
      : lista;
  });
  servicios = signal<TmiCatalogo[]>([]);

  loading = signal(false);
  loadingLogica = signal(false);
  error = signal('');
  errorLogica = signal('');
  eliminandoId = signal<number | null>(null);

  mostrarFormVariable = signal(false);
  mostrarFormLogica = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  formVariable = this.fb.nonNullable.group({
    id: [0],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    total_anual: ['SUMA_MESES' as 'SUMA_MESES' | 'MEDIANA_PERIODO'],
    activo: [true],
  });

  formLogica = this.fb.group({
    id: [0],
    tipgrupo: [null as number | null, Validators.required],
    actividad: [null as number | null, Validators.required],
    servicio: [null as number | null],
    condicion_hoja: [''],
    agregacion: ['SUMA' as 'SUMA' | 'MEDIANA'],
    periodo_desde: [200001, [Validators.required, Validators.min(200001), Validators.max(999912)]],
    periodo_hasta: [999912, [Validators.required, Validators.min(200001), Validators.max(999912)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargar();
    this.srv.getGrupos().subscribe({ next: (g) => this.grupos.set(g) });
    this.srv.getActividades().subscribe({ next: (a) => this.actividades.set(a) });
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.srv.getVariables().subscribe({
      next: (v) => {
        this.variables.set(v);
        const sel = this.seleccionada();
        if (sel) this.seleccionada.set(v.find((x) => x.id === sel.id) ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar las variables.'));
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
    this.loadingLogica.set(true);
    this.errorLogica.set('');
    this.srv.getLogica(v.id).subscribe({
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
    this.formVariable.reset({ id: 0, nombre: '', descripcion: '', total_anual: 'SUMA_MESES', activo: true });
    this.errorForm.set('');
    this.mostrarFormVariable.set(true);
  }

  editarVariable(v: TmiVariable, ev?: Event): void {
    ev?.stopPropagation();
    this.formVariable.reset({
      id: v.id ?? 0,
      nombre: v.nombre,
      descripcion: v.descripcion ?? '',
      total_anual: v.total_anual,
      activo: v.activo,
    });
    this.errorForm.set('');
    this.mostrarFormVariable.set(true);
  }

  guardarVariable(): void {
    if (this.formVariable.invalid) {
      this.formVariable.markAllAsTouched();
      this.errorForm.set('Ingrese el nombre de la variable.');
      return;
    }
    const { id, ...dto } = this.formVariable.getRawValue();
    const datos: TmiVariable = { ...dto, descripcion: dto.descripcion || null };
    this.guardando.set(true);
    const req = id ? this.srv.putVariable(id, datos) : this.srv.postVariable(datos);
    req.subscribe({
      next: () => {
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
    if (!v.id || !confirm(`¿Eliminar la variable "${v.nombre}" y su lógica?`)) return;
    this.eliminandoId.set(v.id);
    this.srv.deleteVariable(v.id).subscribe({
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

  // lógica
  nuevaLogica(): void {
    this.formLogica.reset({
      id: 0, tipgrupo: null, actividad: null, servicio: null, condicion_hoja: '',
      agregacion: 'SUMA', periodo_desde: 200001, periodo_hasta: 999912, activo: true,
    });
    this.servicios.set([]);
    this.filtroActividad.set('');
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
      agregacion: l.agregacion,
      periodo_desde: l.periodo_desde,
      periodo_hasta: l.periodo_hasta,
      activo: l.activo,
    });
    this.filtroActividad.set('');
    this.errorForm.set('');
    this.cargarServicios();
    this.mostrarFormLogica.set(true);
  }

  /** Servicios con datos en TOTALIZADO3 para el grupo y la actividad elegidos. */
  cargarServicios(): void {
    const { tipgrupo, actividad } = this.formLogica.getRawValue();
    this.servicios.set([]);
    if (tipgrupo == null || actividad == null) return;
    this.srv.getServicios(tipgrupo, actividad).subscribe({ next: (s) => this.servicios.set(s) });
  }

  guardarLogica(): void {
    const v = this.seleccionada();
    if (!v?.id) return;
    if (this.formLogica.invalid) {
      this.formLogica.markAllAsTouched();
      this.errorForm.set('Seleccione grupo y actividad, y revise la vigencia (AAAAMM).');
      return;
    }
    const f = this.formLogica.getRawValue();
    if ((f.periodo_desde ?? 0) > (f.periodo_hasta ?? 0)) {
      this.errorForm.set('El periodo "desde" no puede ser mayor que "hasta".');
      return;
    }
    const dto: TmiVariableLogica = {
      id_variable: v.id,
      tipgrupo: Number(f.tipgrupo),
      actividad: Number(f.actividad),
      servicio: f.servicio == null || (f.servicio as any) === '' ? null : Number(f.servicio),
      condicion_hoja: f.condicion_hoja || null,
      agregacion: f.agregacion ?? 'SUMA',
      periodo_desde: Number(f.periodo_desde),
      periodo_hasta: Number(f.periodo_hasta),
      activo: !!f.activo,
    };
    this.guardando.set(true);
    const req = f.id ? this.srv.putLogica(f.id, dto) : this.srv.postLogica(dto);
    req.subscribe({
      next: () => {
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
    this.srv.deleteLogica(l.id).subscribe({
      next: () => {
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

  vigencia(l: TmiVariableLogica): string {
    if (l.periodo_desde <= 200001 && l.periodo_hasta >= 999912) return 'Siempre';
    const d = l.periodo_desde <= 200001 ? '…' : String(l.periodo_desde);
    const h = l.periodo_hasta >= 999912 ? '…' : String(l.periodo_hasta);
    return `${d} – ${h}`;
  }
}
