import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { PlatillosService, TipoPlatillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-agregar-tipo-platillo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-tipo-platillo.html',
  styleUrls: ['./agregar-tipo-platillo.css'],
})
export class AgregarTipoPlatillo implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading: boolean = false;

  // Colores predefinidos para selección
  coloresDisponibles: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C'
  ];

  colorSeleccionado: string = '#FF6B6B';
  colorPersonalizado: string = '#FF6B6B';
  usarColorPersonalizado: boolean = false;

  // Variables para el ícono
  iconoSeleccionado: File | null = null;
  previsualizacionIcono: string | null = null;

  @Output() volver = new EventEmitter<void>();

  constructor(
    private platillosService: PlatillosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      color: [this.colorSeleccionado],
      estatus: [true, Validators.required]
    });
  }

  /**
   * Selecciona un color de la paleta predefinida
   */
  seleccionarColor(color: string): void {
    this.colorSeleccionado = color;
    this.colorPersonalizado = color;
    this.usarColorPersonalizado = false;
    this.form.patchValue({ color: color });
  }

  /**
   * Maneja el cambio en el input[type="color"]
   */
  onColorPersonalizadoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.colorPersonalizado = input.value.toUpperCase();
  }

  /**
   * Maneja el input manual del código hexadecimal
   */
  onColorHexInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.trim();

    // Agregar # si no lo tiene
    if (valor && !valor.startsWith('#')) {
      valor = '#' + valor;
    }

    this.colorPersonalizado = valor.toUpperCase();
  }

  /**
   * Aplica el color personalizado
   */
  aplicarColorPersonalizado(): void {
    if (!this.esColorHexValido(this.colorPersonalizado)) {
      Swal.fire({
        icon: 'warning',
        title: 'Color inválido',
        text: 'Por favor ingresa un color hexadecimal válido (ejemplo: #FF6B6B)',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    this.usarColorPersonalizado = true;
    this.form.patchValue({ color: this.colorPersonalizado });

    Swal.fire({
      icon: 'success',
      title: 'Color aplicado',
      text: `Color personalizado ${this.colorPersonalizado} aplicado correctamente`,
      timer: 1500,
      showConfirmButton: false
    });
  }

  /**
   * Valida si un color hexadecimal es válido
   */
  esColorHexValido(color: string): boolean {
    const regex = /^#[0-9A-F]{6}$/i;
    return regex.test(color);
  }

  /**
   * Obtiene el color final a usar (personalizado o de paleta)
   */
  getColorFinal(): string {
    if (this.usarColorPersonalizado && this.esColorHexValido(this.colorPersonalizado)) {
      return this.colorPersonalizado;
    }
    return this.colorSeleccionado;
  }

  /**
   * Obtiene las iniciales del tipo de platillo para el placeholder
   */
  getInicialesTipo(): string {
    const descripcion = this.form.get('descripcion')?.value || '';
    const palabras = descripcion.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return descripcion.charAt(0).toUpperCase() || '📁';
  }

  /**
   * Maneja la selección de ícono
   */
  onIconoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          text: 'Por favor selecciona una imagen válida (PNG, SVG, JPG, GIF)',
          confirmButtonColor: '#773832'
        });
        return;
      }

      // Validar tamaño (máximo 2MB para íconos)
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'El ícono no debe superar los 2MB',
          confirmButtonColor: '#773832'
        });
        return;
      }

      this.iconoSeleccionado = file;

      // Crear previsualización
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionIcono = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Elimina el ícono seleccionado
   */
  eliminarIconoSeleccionado(): void {
    this.iconoSeleccionado = null;
    this.previsualizacionIcono = null;

    // Limpiar el input file
    const inputFile = document.getElementById('icono-tipo') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  /**
   * Crea un nuevo tipo de platillo
   */
  create_tipo_platillo(): void {
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

    const nuevoTipo: Partial<TipoPlatillo> = this.form.getRawValue();

    // IMPORTANTE: Usar el color final
    nuevoTipo.color = this.getColorFinal();

    // Mostrar confirmación
    Swal.fire({
      title: '¿Crear nuevo tipo de platillo?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Descripción:</strong> ${nuevoTipo.descripcion}</p>
          <p><strong>Color:</strong> <span style="display: inline-block; width: 20px; height: 20px; background: ${nuevoTipo.color}; border: 1px solid #ddd; border-radius: 3px; vertical-align: middle;"></span> ${nuevoTipo.color}</p>
          ${this.iconoSeleccionado ? '<p><strong>Ícono:</strong> ✓ Archivo seleccionado</p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarTipoPlatillo(nuevoTipo);
      }
    });
  }

  /**
   * Guarda el tipo de platillo en la base de datos
   */
  private async guardarTipoPlatillo(tipo: Partial<TipoPlatillo>): Promise<void> {
    this.loading = true;

    try {
      // 1. Crear el tipo de platillo
      const tipoCreado = await this.platillosService.createTipoPlatillo(tipo).toPromise();
      console.log('Tipo de platillo creado:', tipoCreado?.id_tipo_platillo);

      // 2. Si hay ícono seleccionado, subirlo
      if (this.iconoSeleccionado && tipoCreado) {
        const idTipo = tipoCreado.id_tipo_platillo || tipoCreado.__id_tipo_platillo__;

        if (idTipo) {
          await this.subirIconoTipo(idTipo);
        } else {
          console.error('No se pudo obtener el ID del tipo creado');
        }
      }

      this.mostrarExitoYSalir(tipo);

    } catch (error: any) {
      console.error('Error al crear tipo de platillo:', error);
      this.loading = false;

      Swal.fire({
        icon: 'error',
        title: 'Error al crear tipo de platillo',
        text: error.error?.detail || error.message || 'Ocurrió un error inesperado',
        confirmButtonColor: '#773832'
      });
    }
  }

  /**
   * Sube el ícono del tipo de platillo
   */
  private async subirIconoTipo(idTipo: number): Promise<void> {
    if (!this.iconoSeleccionado) {
      return;
    }

    try {
      const resultado = await this.platillosService.uploadIconTipoPlatillo(
        idTipo,
        this.iconoSeleccionado
      ).toPromise();

      console.log('Ícono subido correctamente:', resultado);

    } catch (error: any) {
      console.error('Error al subir ícono:', error);

      // No detener el proceso, solo mostrar advertencia
      Swal.fire({
        icon: 'warning',
        title: 'Tipo creado',
        text: 'El tipo de platillo se creó correctamente, pero hubo un problema al subir el ícono. Puedes intentar subirlo más tarde.',
        confirmButtonColor: '#d4af37'
      });
    }
  }

  /**
   * Muestra mensaje de éxito y sale del formulario
   */
  private mostrarExitoYSalir(tipo: Partial<TipoPlatillo>): void {
    this.loading = false;

    Swal.fire({
      icon: 'success',
      title: '¡Tipo de platillo creado!',
      text: `${tipo.descripcion} ha sido agregado exitosamente`,
      confirmButtonColor: '#d4af37'
    }).then(() => {
      this.resetearFormulario();
      this.volver.emit();
    });
  }

  /**
   * Resetea el formulario a su estado inicial
   */
  private resetearFormulario(): void {
    this.form.reset({ estatus: true, color: '#FF6B6B' });
    this.colorSeleccionado = '#FF6B6B';
    this.colorPersonalizado = '#FF6B6B';
    this.usarColorPersonalizado = false;
    this.iconoSeleccionado = null;
    this.previsualizacionIcono = null;
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
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }

    return '';
  }

  regresar(): void {
    if (this.form.dirty || this.iconoSeleccionado) {
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
}