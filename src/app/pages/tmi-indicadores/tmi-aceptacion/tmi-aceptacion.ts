import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TmiEstandarService, TmiAceptacionIndicador, TmiTipoEstandar, mensajeError } from '../../../services/tmi';
import { AyudaFlotante } from '../ayuda-flotante';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Porcentajes de un % Acept (en % en pantalla). En banda, arriba y abajo. */
interface Porcentaje {
  arriba: number | null;
  abajo: number | null;
}

/** Lo que el usuario edita de un indicador: si es % del estándar o puntos, el fijo del año y el valor del mes
 *  (solo si el mes ya alcanzó su fecha de cierre; antes el mes usa el fijo). */
interface Edicion {
  tipo: 'REL' | 'ABS';
  fijo: Porcentaje;
  mes: Porcentaje;
  cambiado: boolean;
}

/** % Acept de cada indicador, como la hoja "Estándares de indicadores": estándar y % Acept por clave. El % Acept se
 *  calcula (estándar ± porcentaje); el usuario solo define el porcentaje. Como el estándar fijo: hay un porcentaje fijo
 *  del año, que cada mes toma al llegar su fecha de cierre, y luego el valor del mes se puede modificar. */
@Component({
  selector: 'app-tmi-aceptacion',
  imports: [AyudaFlotante, FormsModule, MatCardModule, MatIconModule, DecimalPipe, PercentPipe],
  templateUrl: './tmi-aceptacion.html',
  styleUrls: ['../tmi-indicadores.css', '../tmi-dinamico.css', '../ayuda-flotante.css'],
})
export class TmiAceptacion implements OnInit {
  private estandarSrv = inject(TmiEstandarService);

  readonly meses = MESES.map((label, i) => ({ value: i + 1, label }));
  readonly anios = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() + 1 - i);
  anio = signal(new Date().getFullYear());
  mes = signal(new Date().getMonth() === 0 ? 12 : new Date().getMonth());
  nombreMes = computed(() => this.meses.find((m) => m.value === this.mes())?.label ?? '');

  indicadores = signal<TmiAceptacionIndicador[]>([]);
  tipos = signal<TmiTipoEstandar[]>([]);
  edicion = signal<Record<number, Edicion>>({});
  filtro = signal('');
  visibles = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return f ? this.indicadores().filter((i) => `${i.indicador} ${i.grupo ?? ''}`.toLowerCase().includes(f)) : this.indicadores();
  });

  cargando = signal(false);
  guardando = signal<number | null>(null);
  error = signal('');
  mensaje = signal('');

  ngOnInit(): void {
    this.estandarSrv.getTiposEstandar().subscribe({ next: (t) => this.tipos.set(t) });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.estandarSrv.getAceptacion(this.anio(), this.mes()).subscribe({
      next: (lista) => {
        this.indicadores.set(lista);
        const ed: Record<number, Edicion> = {};
        for (const i of lista) {
          ed[i.id] = {
            tipo: i.tipo_tolerancia === 'ABS' ? 'ABS' : 'REL',
            fijo: { arriba: this.aPorcentaje(i.tolerancia_fijo), abajo: this.aPorcentaje(i.tolerancia_menos_fijo) },
            mes: { arriba: this.aPorcentaje(i.tolerancia), abajo: this.aPorcentaje(i.tolerancia_menos) },
            cambiado: false,
          };
        }
        this.edicion.set(ed);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e, 'No se pudo cargar el % Acept de los indicadores.'));
        this.cargando.set(false);
      },
    });
  }

  cambiarPeriodo(anio: number, mes: number): void {
    this.anio.set(Number(anio));
    this.mes.set(Number(mes));
    this.cargar();
  }

  /** 0.2 -> 20: se guarda como fracción y en pantalla se muestra en %. */
  private aPorcentaje(v: number | null | undefined): number | null {
    return v == null ? null : Math.round(v * 100 * 1000) / 1000;
  }

  textoTipo(codigo: string): string {
    return this.tipos().find((t) => t.codigo === codigo)?.descripcion ?? codigo;
  }

  textoSentido(s: string): string {
    return s === 'MENOR' ? 'Menor es mejor: hacia arriba' : s === 'MAYOR' ? 'Mayor es mejor: hacia abajo' : 'Banda: hacia arriba y hacia abajo';
  }

  /** % Acept calculado con el porcentaje que está en pantalla (igual que usp_tmi_calcular). */
  calcular(i: TmiAceptacionIndicador, estandar: number | null, haciaAbajo = false): number | null {
    const e = this.edicion()[i.id];
    if (!e || estandar == null) return null;
    const p = i.mes_cerrado ? e.mes : e.fijo;
    const pct = haciaAbajo ? (p.abajo ?? p.arriba) : p.arriba;
    if (pct == null) return null;
    const t = pct / 100;
    const sube = !haciaAbajo && (i.sentido === 'MENOR' || i.sentido === 'BANDA');
    const v = e.tipo === 'ABS' ? (sube ? estandar + t : estandar - t) : (sube ? estandar * (1 + t) : estandar * (1 - t));
    return Math.round(v * 10000) / 10000;
  }

  cambiar(i: TmiAceptacionIndicador, campo: 'tipo' | 'arriba' | 'abajo', valor: any, de: 'fijo' | 'mes' = 'fijo'): void {
    const e = { ...this.edicion()[i.id] };
    if (campo === 'tipo') e.tipo = valor;
    else e[de] = { ...e[de], [campo]: valor === '' || valor == null ? null : Number(valor) };
    e.cambiado = true;
    this.edicion.update((ed) => ({ ...ed, [i.id]: e }));
  }

  guardar(i: TmiAceptacionIndicador): void {
    const e = this.edicion()[i.id];
    const mes = i.mes_cerrado ? e.mes : e.fijo;
    if (e.fijo.arriba == null || e.fijo.arriba < 0 || mes.arriba == null || mes.arriba < 0) {
      this.error.set(`Ingrese el porcentaje de ${i.indicador}.`);
      return;
    }
    const banda = (v: number | null) => (i.sentido === 'BANDA' && v != null ? v / 100 : null);
    const dto = {
      tipo_tolerancia: e.tipo,
      tolerancia_fijo: e.fijo.arriba / 100,
      tolerancia_menos_fijo: banda(e.fijo.abajo),
      tolerancia: mes.arriba / 100,
      tolerancia_menos: banda(mes.abajo),
      anio: this.anio(),
      mes: this.mes(),
    };
    const alcance = i.mes_cerrado ? `${this.anio()} y ${this.nombreMes()}` : `${this.anio()}`;
    this.guardando.set(i.id);
    this.error.set('');
    this.mensaje.set('');
    this.estandarSrv.putTolerancia(i.id, dto).subscribe({
      next: () => {
        this.guardando.set(null);
        this.mensaje.set(`% Acept de ${i.indicador} guardado para ${alcance}. Se aplica desde el próximo cálculo.`);
        this.cargar();
      },
      error: (err) => {
        this.error.set(mensajeError(err, 'No se pudo guardar el % Acept.'));
        this.guardando.set(null);
      },
    });
  }

  esPorcentaje(i: TmiAceptacionIndicador): boolean {
    return i.formato === 'PORCENTAJE';
  }
}
