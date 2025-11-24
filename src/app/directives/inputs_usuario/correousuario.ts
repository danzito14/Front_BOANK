import {
  Directive, HostListener, Renderer2, forwardRef
} from '@angular/core';
import {
  NG_VALIDATORS, Validator, AbstractControl, ValidationErrors
} from '@angular/forms';

@Directive({
  selector: '[appCorreo]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CorreoDirective),
      multi: true
    }
  ]
})
export class CorreoDirective implements Validator {

  constructor(private renderer: Renderer2) { }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    // Regex simple para validar correo
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValid ? null : { correoInvalido: true };
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    const borderColor = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? '#D0AF43'   // verde si es válido
      : '#773832';  // rojo si es inválido

    this.renderer.setStyle(input, 'border-bottom', `2px solid ${borderColor}`);
  }
}