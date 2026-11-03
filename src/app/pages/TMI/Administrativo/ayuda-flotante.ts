import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** "Cómo funciona" flotante: el <details class="dyn-ayuda"> se cierra al hacer clic fuera o con Esc. */
@Directive({ selector: 'details.dyn-ayuda' })
export class AyudaFlotante {
  private readonly el = inject<ElementRef<HTMLDetailsElement>>(ElementRef).nativeElement;

  @HostListener('document:click', ['$event'])
  clicFuera(ev: MouseEvent): void {
    if (this.el.open && !this.el.contains(ev.target as Node)) this.el.open = false;
  }

  @HostListener('document:keydown.escape')
  cerrar(): void {
    if (!this.el.open) return;
    this.el.open = false;
    this.el.querySelector('summary')?.focus();
  }
}
