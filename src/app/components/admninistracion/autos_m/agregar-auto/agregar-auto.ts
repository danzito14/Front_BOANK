import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AutomovilesService, AutomovilSchema } from '../../../../services/administrador/automoviles';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-agregar-automovil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-auto.html',
  styleUrls: ['./agregar-auto.css'],
})
export class AgregarAutomovil implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() volver = new EventEmitter<void>();

  form!: FormGroup;
  loading: boolean = false;
  guardando: boolean = false;

  // Opciones para selects
  estadosAutomovil = ['Activo', 'En mantenimiento', 'Baja'];

  // Marcas populares de autos
  marcasPopulares = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Ford',
    'Chevrolet', 'Volkswagen', 'Hyundai', 'Kia', 'BMW',
    'Mercedes-Benz', 'Audi', 'Jeep', 'RAM', 'GMC',
    'Suzuki', 'Mitsubishi', 'Peugeot', 'Renault', 'SEAT',
    'Otra'
  ];

  // Fecha mínima y máxima
  fechaMinima: string = '';
  fechaMaxima: string = '';
  anoMinimo: number = 1900;
  anoMaximo: number = new Date().getFullYear() + 1;

  constructor(
    private automovilesService: AutomovilesService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.establecerFechas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  establecerFechas(): void {
    const hoy = new Date();
    this.fechaMaxima = hoy.toISOString().split('T')[0];

    // Fecha mínima: hace 50 años
    const fechaMin = new Date();
    fechaMin.setFullYear(fechaMin.getFullYear() - 50);
    this.fechaMinima = fechaMin.toISOString().split('T')[0];
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      apodo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      Marca: ['', [Validators.required, Validators.minLength(2)]],
      Modelo: ['', [Validators.required, Validators.minLength(2)]],
      Año: [new Date().getFullYear(), [
        Validators.required,
        Validators.min(this.anoMinimo),
        Validators.max(this.anoMaximo)
      ]],
      Placas: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]],
      Color: ['', [Validators.required, Validators.minLength(3)]],
      Fecha_compra: ['', Validators.required],
      Estado: ['Activo', Validators.required],
      id_empleado: ['']
    });
  }

  // Validaciones personalizadas
  validarPlacas(): void {
    const placas = this.form.get('Placas')?.value;
    if (placas) {
      const validacion = this.automovilesService.validarPlacas(placas);
      if (!validacion.valid) {
        this.form.get('Placas')?.setErrors({ placasInvalidas: true });
      }
    }
  }

  validarAnio(): void {
    const año = this.form.get('Año')?.value;
    if (año) {
      const validacion = this.automovilesService.validarAño(año);
      if (!validacion.valid) {
        this.form.get('Año')?.setErrors({ añoInvalido: true });
      }
    }
  }

  // Formatear campos
  formatearPlacas(): void {
    const control = this.form.get('Placas');
    if (control?.value) {
      control.setValue(control.value.toUpperCase().trim());
    }
  }

  formatearApodo(): void {
    const control = this.form.get('apodo');
    if (control?.value) {
      control.setValue(control.value.trim());
    }
  }

  // ============================================
  // GUARDAR AUTOMÓVIL
  // ============================================

  async guardarAutomovil(): Promise<void> {
    if (this.form.invalid) {
      this.marcarCamposInvalidos();

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    // Validaciones adicionales
    this.validarPlacas();
    this.validarAnio();

    if (this.form.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos inválidos',
        text: 'Por favor verifica los datos ingresados',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Crear automóvil?',
      text: 'Se creará el automóvil con los datos proporcionados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.guardando = true;

    try {
      const automovilData: AutomovilSchema = {
        apodo: this.form.get('apodo')?.value.trim(),
        Marca: this.form.get('Marca')?.value.trim(),
        Modelo: this.form.get('Modelo')?.value.trim(),
        Año: parseInt(this.form.get('Año')?.value),
        Placas: this.form.get('Placas')?.value.toUpperCase().trim(),
        Color: this.form.get('Color')?.value.trim(),
        Fecha_compra: this.form.get('Fecha_compra')?.value,
        Estado: this.form.get('Estado')?.value as 'Activo' | 'En mantenimiento' | 'Baja',
        id_empleado: '01bc38ac-b7fd-40aa-bc35-d655f915361d'
      };

      await this.automovilesService.createAutomovil(automovilData).toPromise();

      this.guardando = false;

      Swal.fire({
        icon: 'success',
        title: '¡Automóvil creado!',
        text: 'El automóvil se creó correctamente',
        confirmButtonColor: '#d4af37'
      }).then(() => {
        this.volver.emit();
      });

    } catch (error: any) {
      console.error('Error creando automóvil:', error.error.detail);
      this.guardando = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo crear el automóvil',
        confirmButtonColor: '#773832'
      });
    }
  }

  marcarCamposInvalidos(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  getMensajeError(campo: string): string {
    const control = this.form.get(campo);

    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('min')) {
      return `El valor mínimo es ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `El valor máximo es ${control.errors?.['max'].max}`;
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      return `Máximo ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('placasInvalidas')) {
      return 'Formato de placas inválido';
    }
    if (control?.hasError('añoInvalido')) {
      return 'Año inválido';
    }

    return '';
  }

  cancelar(): void {
    if (this.form.dirty) {
      Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Tienes cambios sin guardar. ¿Deseas salir de todas formas?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#773832',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.volver.emit();
        }
      });
    } else {
      this.volver.emit();
    }
  }

  // Helper para mostrar información adicional
  calcularAntiguedad(): number | null {
    const año = this.form.get('Año')?.value;
    if (año) {
      return this.automovilesService.calcularAntiguedad(año);
    }
    return null;
  }

  mostrarAntiguedad(): string {
    const antiguedad = this.calcularAntiguedad();
    if (antiguedad !== null) {
      if (antiguedad === 0) return 'Nuevo';
      if (antiguedad === 1) return '1 año de antigüedad';
      return `${antiguedad} años de antigüedad`;
    }
    return '';
  }
}