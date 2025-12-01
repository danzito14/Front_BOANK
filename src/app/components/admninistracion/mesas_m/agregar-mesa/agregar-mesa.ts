import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MesasService } from '../../../../services/administrador/mesas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-mesa',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-mesa.html',
  styleUrl: './agregar-mesa.css',
})
export class AgregarMesa implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() destino = new EventEmitter<string>();

  form!: FormGroup;
  loading: boolean = false;
  guardando: boolean = false;

  // Estados disponibles para mesa
  estadosMesa: string[] = ['Libre', 'Ocupada', 'Reservada'];

  // Capacidades sugeridas
  capacidadesSugeridas: number[] = [2, 4, 6, 8, 10, 12];

  constructor(
    private fb: FormBuilder,
    private mesasService: MesasService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Inicialización adicional si es necesaria
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Inicializar formulario
  initForm(): void {
    this.form = this.fb.group({
      Capacidad: [
        4,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(20)
        ]
      ],
      Estado: ['Libre', Validators.required],
      estatus_bool: [true]
    });
  }

  // Validar si un campo es inválido
  esCampoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Obtener mensaje de error
  getMensajeError(campo: string): string {
    const control = this.form.get(campo);

    if (!control || !control.errors) {
      return '';
    }

    const errores: { [key: string]: string } = {
      'required': 'Este campo es requerido',
      'min': 'El valor es demasiado bajo',
      'max': 'El valor es demasiado alto',
      'minlength': 'El texto es demasiado corto',
      'maxlength': 'El texto es demasiado largo',
      'pattern': 'El formato no es válido'
    };

    const primerError = Object.keys(control.errors)[0];

    // Mensajes específicos por campo
    if (campo === 'Capacidad') {
      if (control.errors['min']) return 'La capacidad debe ser al menos 1 persona';
      if (control.errors['max']) return 'La capacidad máxima es 20 personas';
    }

    return errores[primerError] || 'Campo inválido';
  }

  // Validar capacidad
  validarCapacidad(): void {
    const capacidad = this.form.get('Capacidad')?.value;

    if (capacidad && capacidad > 20) {
      this.form.patchValue({ Capacidad: 20 });
    } else if (capacidad && capacidad < 1) {
      this.form.patchValue({ Capacidad: 1 });
    }
  }

  // Mostrar información de capacidad
  mostrarInfoCapacidad(): string | null {
    const capacidad = this.form.get('Capacidad')?.value;

    if (!capacidad) return null;

    if (capacidad <= 2) return 'Mesa pequeña - Ideal para parejas';
    if (capacidad <= 4) return 'Mesa estándar - Perfecta para familias pequeñas';
    if (capacidad <= 6) return 'Mesa mediana - Ideal para grupos';
    if (capacidad <= 8) return 'Mesa grande - Para reuniones';
    return 'Mesa muy grande - Para eventos especiales';
  }

  // Obtener clase de badge para preview
  getEstadoPreviewClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'Libre': 'badge-libre',
      'Ocupada': 'badge-ocupada',
      'Reservada': 'badge-reservada'
    };
    return clases[estado] || 'badge-default';
  }

  // Guardar mesa
  guardarMesa(): void {
    if (this.form.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.guardando = true;

    const mesaData = this.form.value;

    this.mesasService.createMesa(mesaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Mesa creada exitosamente:', response);
          Swal.fire({
            title: 'Mesa creada exitosamente',
            text: 'Mesa creada exitosamente',
            icon: 'success',
            iconColor: '#d4af37',
            confirmButtonColor: '#d4af37',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.guardando = false;

            this.destino.emit('mesas_general');
          })
        },
        error: (error) => {
          console.error('Error al crear mesa:', error);
          Swal.fire({
            title: 'Error al crear la mesa',
            text: error.error.detail,
            icon: 'error',
            iconColor: '#773832',
            confirmButtonColor: '#773832',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.guardando = false;
          })
        }
      });
  }

  // Cancelar y volver
  cancelar(): void {
    if (this.form.dirty && !this.guardando) {
      const confirmar = confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.');
      if (!confirmar) return;
    }
    this.destino.emit('mesas_general');
  }

  // Verificar si hay datos en el preview
  get hayDatosPreview(): boolean {
    return this.form.get('Capacidad')?.value !== null &&
      this.form.get('Capacidad')?.value !== undefined;
  }
}