/**
 * Desplaza lo necesario para que una ayuda flotante se vea entera. Dentro de un formulario mueve solo el cuerpo
 * del formulario (.modal-body), que es el que tiene scroll; scrollIntoView no siempre lo hace en el celular.
 */
export function mostrarAyudaEntera(el: Element | null): void {
  if (!el) return;
  const caja = el.closest<HTMLElement>('.modal-body');
  if (!caja) {
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }
  const margen = 8;
  const r = el.getBoundingClientRect();
  // el borde visible es el del cuerpo del formulario o el de la pantalla, el que esté más arriba
  const limite = Math.min(caja.getBoundingClientRect().bottom, window.innerHeight) - margen;
  if (r.bottom > limite) caja.scrollBy({ top: r.bottom - limite, behavior: 'smooth' });
}
