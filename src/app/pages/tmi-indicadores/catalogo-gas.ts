import { signal } from '@angular/core';
import { TmiCatalogoService, TmiGrupoActividadServicio } from '../../services/tmi';

export interface OpcionGas {
  id: number;
  texto: string;
  /** false = el valor guardado no está en la relación grupo -> actividad -> servicio (dato anterior). */
  valido: boolean;
}

/** Grupo -> actividad -> servicio para la lógica de las variables: cada lista depende de la anterior,
 *  según DIM_GRUPOACTIVIDADSERVICIO. La usa el formulario de lógica de la pestaña Variables. */
export class CatalogoGas {
  readonly filas = signal<TmiGrupoActividadServicio[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor(srv: TmiCatalogoService) {
    srv.getGrupoActividadServicio().subscribe({
      next: (f) => {
        this.filas.set(f);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la relación de grupos, actividades y servicios.');
        this.cargando.set(false);
      },
    });
  }

  grupos(actual: number | null = null): OpcionGas[] {
    const vistos = new Map<number, OpcionGas>();
    for (const f of this.filas()) {
      if (!vistos.has(f.tipgrupo)) vistos.set(f.tipgrupo, { id: f.tipgrupo, texto: `${f.tipgrupo} · ${f.desctipgrupo ?? ''}`, valido: true });
    }
    return this.conActual([...vistos.values()], actual, 'grupo');
  }

  /** Actividades del grupo. */
  actividades(tipgrupo: number | null, actual: number | null = null): OpcionGas[] {
    if (tipgrupo == null) return [];
    const vistos = new Map<number, OpcionGas>();
    for (const x of this.filas()) {
      if (x.tipgrupo !== Number(tipgrupo) || vistos.has(x.actividad)) continue;
      const texto = `${x.actividad} · ${x.descactividad ?? ''}${x.proceso ? ' [' + x.proceso.trim() + ']' : ''}${x.recurso ? ' (Recurso)' : ''}`;
      vistos.set(x.actividad, { id: x.actividad, texto, valido: true });
    }
    return this.conActual([...vistos.values()], actual, 'actividad');
  }

  /** Servicios de la actividad dentro del grupo. */
  servicios(tipgrupo: number | null, actividad: number | null, actual: number | null = null): OpcionGas[] {
    if (tipgrupo == null || actividad == null) return [];
    const lista = this.filas()
      .filter((x) => x.tipgrupo === Number(tipgrupo) && x.actividad === Number(actividad))
      .map((x) => ({ id: x.servicio, texto: `${x.servicio} · ${x.descservicio || 'Servicio ' + x.servicio}`, valido: true }));
    return this.conActual(lista, actual, 'servicio');
  }

  /** Mantiene en la lista el valor ya guardado aunque no esté en la relación, para no perderlo al editar. */
  private conActual(lista: OpcionGas[], actual: number | null, que: string): OpcionGas[] {
    if (actual == null || this.cargando() || lista.some((o) => o.id === Number(actual))) return lista;
    return [{ id: Number(actual), texto: `${actual} · (${que} fuera de la relación)`, valido: false }, ...lista];
  }
}
