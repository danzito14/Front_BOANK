import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MesasService, Mesa } from '../../../../services/administrador/mesas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-mesa',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-mesa.html',
  styleUrl: './editar-mesa.css',
})
export class EditarMesa implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() id_mesa!: string;
  @Output() destino = new EventEmitter<string>();

  form!: FormGroup;
  loading: boolean = true;
  guardando: boolean = false;
  mesaOriginal: Mesa | null = null;

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
    if (!this.id_mesa) {
      this.mostrarError('No se proporcionó el ID de la mesa');
      this.cancelar();
      return;
    }
    this.cargarDatosMesa();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Inicializar formulario
  initForm(): void {
    this.form = this.fb.group({
      Nombre_mesa: [
        { value: '', disabled: true }
      ],
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

  // Cargar datos de la mesa
  cargarDatosMesa(): void {
    this.loading = true;

    // Obtener todas las mesas y filtrar por id
    this.mesasService.getAllMesas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mesas: Mesa[]) => {
          const mesa = mesas.find(m => m.id_mesa === this.id_mesa);

          if (mesa) {
            this.mesaOriginal = mesa;
            this.form.patchValue({
              Nombre_mesa: mesa.Nombre_mesa,
              Capacidad: mesa.Capacidad,
              Estado: mesa.Estado,
              estatus_bool: mesa.estatus_bool
            });
            this.loading = false;
          } else {
            this.mostrarError('No se encontró la mesa');
            this.cancelar();
          }
        },
        error: (error) => {
          console.error('Error cargando mesa:', error);
          this.mostrarError('Error al cargar los datos de la mesa');
          this.loading = false;
        }
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

  // Verificar si hay cambios
  hayCambios(): boolean {
    if (!this.mesaOriginal) return false;

    const valoresActuales = this.form.getRawValue();

    return (
      valoresActuales.Capacidad !== this.mesaOriginal.Capacidad ||
      valoresActuales.Estado !== this.mesaOriginal.Estado ||
      valoresActuales.estatus_bool !== this.mesaOriginal.estatus_bool
    );
  }

  // Actualizar mesa
  async actualizarMesa(): Promise<void> {
    if (this.form.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });

      await Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos requeridos',
        confirmButtonColor: '#d4af37',
        iconColor: '#ffc107'
      });
      return;
    }

    if (!this.hayCambios()) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se detectaron cambios en la mesa',
        confirmButtonColor: '#d4af37',
        iconColor: '#17a2b8'
      });
      return;
    }

    // Confirmación antes de actualizar
    const confirmacion = await Swal.fire({
      title: '¿Actualizar mesa?',
      text: '¿Estás seguro de que deseas guardar los cambios?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      iconColor: '#d4af37'
    });

    if (!confirmacion.isConfirmed) return;

    this.guardando = true;

    // Solo enviamos los campos que pueden cambiar
    const mesaData = {
      Capacidad: this.form.get('Capacidad')?.value,
      Estado: this.form.get('Estado')?.value,
      estatus_bool: this.form.get('estatus_bool')?.value
    };

    this.mesasService.updateMesa(this.id_mesa, mesaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          console.log('Mesa actualizada exitosamente:', response);
          this.guardando = false;

          await Swal.fire({
            icon: 'success',
            title: '¡Actualización exitosa!',
            text: 'La mesa se ha actualizado correctamente',
            confirmButtonColor: '#d4af37',
            iconColor: '#28a745',
            timer: 2000,
            showConfirmButton: false
          });
          this.destino.emit('mesas_general');
        },
        error: async (error) => {
          console.error('Error al actualizar mesa:', error);
          this.guardando = false;

          await Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: error.error?.detail || 'Ocurrió un error al actualizar la mesa',
            confirmButtonColor: '#d4af37',
            iconColor: '#dc3545'
          });
        }
      });
  }

  // Eliminar mesa
  async eliminarMesa(): Promise<void> {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar mesa?',
      html: `¿Estás seguro de que deseas eliminar <strong>${this.mesaOriginal?.Nombre_mesa}</strong>?<br><small>Esta acción no se puede deshacer</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#773832',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      iconColor: '#dc3545'
    });

    if (!confirmacion.isConfirmed) return;

    this.guardando = true;

    this.mesasService.deleteMesa(this.id_mesa)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          console.log('Mesa eliminada exitosamente:', response);
          this.guardando = false;

          await Swal.fire({
            icon: 'success',
            title: '¡Mesa eliminada!',
            text: 'La mesa se ha eliminado correctamente',
            confirmButtonColor: '#d4af37',
            iconColor: '#28a745',
            timer: 2000,
            showConfirmButton: false
          });

          this.cancelar();
        },
        error: async (error) => {
          console.error('Error al eliminar mesa:', error);
          this.guardando = false;

          await Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: error.error?.detail || 'Ocurrió un error al eliminar la mesa',
            confirmButtonColor: '#d4af37',
            iconColor: '#dc3545'
          });
        }
      });
  }

  // Mostrar error
  async mostrarError(mensaje: string): Promise<void> {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#d4af37',
      iconColor: '#dc3545'
    });
  }

  // Cancelar y volver
  async cancelar(): Promise<void> {
    if (this.hayCambios() && !this.guardando) {
      const confirmacion = await Swal.fire({
        title: '¿Cancelar cambios?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#773832',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando',
        iconColor: '#ffc107'
      });

      if (!confirmacion.isConfirmed) return;
    }

    this.destino.emit('mesas_general');
  }

  // Verificar si hay datos en el preview
  get hayDatosPreview(): boolean {
    return this.form.get('Capacidad')?.value !== null &&
      this.form.get('Capacidad')?.value !== undefined;
  }

  // Detectar si hubo cambios en la capacidad
  get cambioCapacidad(): boolean {
    return this.mesaOriginal?.Capacidad !== this.form.get('Capacidad')?.value;
  }

  // Detectar si hubo cambios en el estado
  get cambioEstado(): boolean {
    return this.mesaOriginal?.Estado !== this.form.get('Estado')?.value;
  }
}