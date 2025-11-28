import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { PlatillosService, TipoPlatillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-editar-tipo-platillo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './editar-tipo-platillo.html',
  styleUrls: ['./editar-tipo-platillo.css'],
})
export class EditarTipoPlatillo implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrlserve = environment.apiUrl;

  form!: FormGroup;
  loading: boolean = false;
  tipoOriginal?: TipoPlatillo;

  // Guardar valores originales
  private valoresOriginales: any = {};

  // Colores predefinidos
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
  subiendoIcono: boolean = false;

  @Input() id_tipo_platillo: number = 0;
  @Output() volver = new EventEmitter<void>();

  constructor(
    private platillosService: PlatillosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();

    if (this.id_tipo_platillo) {
      this.cargarDatosTipo();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cancelar() {
    Swal.fire({
      title: "¿Seguro que quiere salir?",
      text: "Algunos cambios no se guardarán si no dio guardar previamente",
      icon: "question",
      iconColor: "#d4af37",
      confirmButtonText: "Sí, salir",
      confirmButtonColor: "#d4af37"
    }).then((result) => {
      if (result.isConfirmed) {
        this.volver.emit();
      }
    });
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      color: [this.colorSeleccionado],
      estatus: [true, Validators.required]
    });
  }

  cargarDatosTipo(): void {
    this.loading = true;

    this.platillosService.getAllTiposPlatillo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tipos) => {
          const tipo = tipos.find(t =>
            (t.__id_tipo_platillo__ || t.id_tipo_platillo) === this.id_tipo_platillo
          );

          if (tipo) {
            console.log('Tipo cargado:', tipo);
            this.tipoOriginal = tipo;
            this.rellenarFormulario(tipo);

            // Guardar valores originales
            this.valoresOriginales = this.form.getRawValue();
            console.log('Valores originales guardados:', this.valoresOriginales);

            this.loading = false;
          } else {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontró el tipo de platillo'
            });
          }
        },
        error: (error) => {
          console.error('Error cargando tipo:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del tipo de platillo'
          });
        }
      });
  }

  rellenarFormulario(tipo: TipoPlatillo): void {
    this.colorSeleccionado = tipo.color || '#FF6B6B';
    this.colorPersonalizado = tipo.color || '#FF6B6B';

    this.form.patchValue({
      descripcion: tipo.descripcion,
      color: tipo.color || '#FF6B6B',
      estatus: tipo.estatus
    });

    // Cargar ícono si existe
    if (tipo.ruta_icono) {
      this.previsualizacionIcono = `${this.apiUrlserve}/${tipo.ruta_icono}`;
    }
  }

  /**
   * Selecciona un color de la paleta
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
   * Obtiene las iniciales del tipo
   */
  getInicialesTipo(): string {
    const descripcion = this.form.get('descripcion')?.value || this.tipoOriginal?.descripcion || '';
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

      // Validar tamaño (máximo 2MB)
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
   * Sube el ícono al backend
   */
  async subirIcono(): Promise<void> {
    if (!this.iconoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin ícono',
        text: 'Por favor selecciona un ícono primero',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    this.subiendoIcono = true;

    try {
      const resultado = await this.platillosService.uploadIconTipoPlatillo(
        this.id_tipo_platillo,
        this.iconoSeleccionado
      ).toPromise();

      console.log('Ícono subido correctamente:', resultado);

      Swal.fire({
        icon: 'success',
        title: '¡Ícono actualizado!',
        text: 'El ícono del tipo se actualizó correctamente',
        confirmButtonColor: '#d4af37'
      });

      // Limpiar selección y recargar
      this.iconoSeleccionado = null;
      this.cargarDatosTipo();

    } catch (error: any) {
      console.error('Error subiendo ícono:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al subir ícono',
        text: error.error?.detail || error.message || 'Ocurrió un error al subir el ícono',
        confirmButtonColor: '#773832'
      });
    } finally {
      this.subiendoIcono = false;
    }
  }

  /**
   * Elimina el ícono seleccionado
   */
  eliminarIconoSeleccionado(): void {
    this.iconoSeleccionado = null;

    // Restaurar previsualización original
    if (this.tipoOriginal?.ruta_icono) {
      this.previsualizacionIcono = `${this.apiUrlserve}/${this.tipoOriginal.ruta_icono}`;
    } else {
      this.previsualizacionIcono = null;
    }

    // Limpiar el input file
    const inputFile = document.getElementById('icono-tipo') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  /**
   * Obtiene solo los campos modificados
   */
  private obtenerCamposModificados(): Partial<TipoPlatillo> {
    const valoresActuales = this.form.getRawValue();
    const camposModificados: any = {};

    // IMPORTANTE: Usar el color final
    valoresActuales.color = this.getColorFinal();

    Object.keys(valoresActuales).forEach(key => {
      const valorActual = valoresActuales[key];
      const valorOriginal = this.valoresOriginales[key];

      const actualNormalizado = this.normalizarValor(valorActual);
      const originalNormalizado = this.normalizarValor(valorOriginal);

      if (actualNormalizado !== originalNormalizado) {
        camposModificados[key] = valorActual;
        console.log(`Campo modificado: ${key}`, {
          original: valorOriginal,
          actual: valorActual
        });
      }
    });

    return camposModificados;
  }

  private normalizarValor(valor: any): any {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (typeof valor === 'string') {
      return valor.trim();
    }

    return valor;
  }

  guardarCambios(): void {
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

    const camposModificados = this.obtenerCamposModificados();

    if (Object.keys(camposModificados).length === 0 && !this.iconoSeleccionado) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se detectaron cambios en el formulario',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    console.log('Campos modificados:', camposModificados);

    // Mostrar confirmación
    this.mostrarConfirmacionGuardar(camposModificados);
  }

  private mostrarConfirmacionGuardar(camposModificados: Partial<TipoPlatillo>): void {
    const cambiosHTML = Object.keys(camposModificados).map(key => {
      const valor = camposModificados[key as keyof TipoPlatillo];

      if (key === 'color') {
        return `<p><strong>Color:</strong> <span style="display: inline-block; width: 20px; height: 20px; background: ${valor}; border: 1px solid #ddd; border-radius: 3px; vertical-align: middle;"></span> ${valor}</p>`;
      }

      return `<p><strong>${this.getNombreCampo(key)}:</strong> ${valor}</p>`;
    }).join('');

    const iconoHTML = this.iconoSeleccionado
      ? '<p><strong>Ícono:</strong> ✓ Nuevo archivo seleccionado</p>'
      : '';

    Swal.fire({
      title: '¿Guardar cambios?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          ${cambiosHTML || '<p>Solo se actualizará el ícono</p>'}
          ${iconoHTML}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarActualizacion(camposModificados);
      }
    });
  }

  private getNombreCampo(key: string): string {
    const nombres: { [key: string]: string } = {
      'descripcion': 'Descripción',
      'color': 'Color',
      'estatus': 'Estatus'
    };
    return nombres[key] || key;
  }

  private async ejecutarActualizacion(camposModificados: Partial<TipoPlatillo>): Promise<void> {
    this.loading = true;

    try {
      // 1. Actualizar campos del formulario si hay cambios
      if (Object.keys(camposModificados).length > 0) {
        await this.platillosService.updateTipoPlatillo(
          this.id_tipo_platillo,
          camposModificados
        ).toPromise();

        console.log('Tipo actualizado correctamente');
      }

      // 2. Subir ícono si fue seleccionado
      if (this.iconoSeleccionado) {
        await this.subirIconoEnActualizacion();
      }

      this.mostrarExitoYSalir();

    } catch (error: any) {
      console.error('Error actualizando tipo:', error);
      this.loading = false;

      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: error.error?.detail || error.message || 'Ocurrió un error al actualizar el tipo',
        confirmButtonColor: '#773832'
      });
    }
  }

  /**
   * Sube el ícono durante la actualización
   */
  private async subirIconoEnActualizacion(): Promise<void> {
    if (!this.iconoSeleccionado) return;

    try {
      await this.platillosService.uploadIconTipoPlatillo(
        this.id_tipo_platillo,
        this.iconoSeleccionado
      ).toPromise();

      console.log('Ícono actualizado correctamente');

    } catch (error: any) {
      console.error('Error al subir ícono:', error);

      // No detener el proceso, solo mostrar advertencia
      Swal.fire({
        icon: 'warning',
        title: 'Tipo actualizado',
        text: 'El tipo se actualizó correctamente, pero hubo un problema al subir el ícono.',
        confirmButtonColor: '#d4af37'
      });
    }
  }

  /**
   * Muestra mensaje de éxito y sale
   */
  private mostrarExitoYSalir(): void {
    this.loading = false;

    Swal.fire({
      icon: 'success',
      title: '¡Cambios guardados!',
      text: 'El tipo de platillo se actualizó correctamente',
      confirmButtonColor: '#d4af37'
    }).then(() => {
      this.volver.emit();
    });
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