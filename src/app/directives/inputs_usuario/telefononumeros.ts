
import {
  Directive, HostListener, Renderer2, forwardRef
} from '@angular/core';
import {
  NG_VALIDATORS, Validator, AbstractControl, ValidationErrors
} from '@angular/forms';

@Directive({
  selector: '[appTelefononumeros]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => Telefononumeros),
      multi: true
    }
  ]
})
export class Telefononumeros implements Validator {

  constructor(private renderer: Renderer2) { }

  validate(control: AbstractControl): ValidationErrors | null {
    const rawValue = control.value?.replace(/\s+/g, '');
    const isValid = /^\d{10}$/.test(rawValue);
    return isValid ? null : { numeroTelefonoInvalido: true };
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 10);

    // Formato: 3-3-4 → 662 123 4567
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)} ${raw.slice(3)}`;
    }

    input.value = formatted;

    const borderColor = raw.length === 10
      ? '#D0AF43' // válido
      : '#773832'; // inválido

    this.renderer.setStyle(input, 'border-bottom', `2px solid ${borderColor}`);
  }
}