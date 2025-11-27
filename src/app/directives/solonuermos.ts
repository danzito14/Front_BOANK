import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appSolonumerosDinero]'
})
export class SolonumerosDinero {

  private formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  private lastCleanValue = '';

  constructor(private el: ElementRef<HTMLInputElement>) { }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;

    // Quitar todo lo que no sea número o punto
    let raw = input.value.replace(/[^0-9.]/g, '');

    // Controlar múltiples puntos decimales
    const parts = raw.split('.');
    if (parts.length > 2) {
      raw = this.lastCleanValue;
    } else {

      // 🔥 LIMITE MÁXIMO 10 CIFRAS EN LA PARTE ENTERA
      if (parts[0].length > 10) {
        parts[0] = parts[0].substring(0, 10);
      }

      // Limitar decimales a máximo 2
      if (parts[1]?.length > 2) {
        parts[1] = parts[1].substring(0, 2);
      }

      raw = parts.join('.');
    }

    this.lastCleanValue = raw;

    if (!raw) {
      input.value = '';
      return;
    }

    const [integer, decimal] = raw.split('.');

    // Formato con comas
    const formattedInteger = this.formatter.format(Number(integer));

    // Construir el valor final
    const formatted =
      decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;

    input.value = formatted;
  }
}
