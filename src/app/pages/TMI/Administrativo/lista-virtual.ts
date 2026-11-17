import { DestroyRef, Signal, inject, signal } from '@angular/core';

/** Ancho en que las filas de las listas del TMI pasan a dos líneas (el mismo @media de lista-virtual.css). */
export const MEDIA_FILA_ESTRECHA = '(max-width: 720px)';

/**
 * true mientras la pantalla es angosta. La lista virtual necesita saberlo: todas sus filas miden lo mismo
 * (itemSize) y, con los 12 meses debajo del indicador, la fila de Exclusiones y Por centro es más alta.
 * Se llama en un contexto de inyección (inicializador de campo o constructor).
 */
export function filaEstrecha(): Signal<boolean> {
  const consulta = window.matchMedia(MEDIA_FILA_ESTRECHA);
  const estrecha = signal(consulta.matches);
  // "change" basta en los navegadores; "resize" cubre la emulación de tamaño de las herramientas de desarrollo
  const revisar = () => estrecha.set(consulta.matches);
  consulta.addEventListener('change', revisar);
  window.addEventListener('resize', revisar, { passive: true });
  inject(DestroyRef).onDestroy(() => {
    consulta.removeEventListener('change', revisar);
    window.removeEventListener('resize', revisar);
  });
  return estrecha.asReadonly();
}
