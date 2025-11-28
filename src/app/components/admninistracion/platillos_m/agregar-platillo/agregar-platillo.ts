import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { PlatillosService, Platillo, TipoPlatillo, OpcionPlatillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface OpcionTemp {
  opcion: string;
  precio: number;
}

@Component({
  selector: 'app-agregar-platillo',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-platillo.html',
  styleUrl: './agregar-platillo.css',
})
export class AgregarPlatillo implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading: boolean = false;

  tiposPlatillo: TipoPlatillo[] = [];

  // Variables para opciones de platillo
  opciones: OpcionTemp[] = [];
  mostrarFormOpcion: boolean = false;
  opcionNombre: string = '';
  opcionPrecio: number = 0;
  editandoOpcionIndex: number | null = null;

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;

  @Output() volver = new EventEmitter<void>();

  constructor(
    private platillosService: PlatillosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      Nombre_platillo: ['', [Validators.required, Validators.minLength(3)]],
      id_tipo_platillo: [null, Validators.required],
      precio_produccion: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      Descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tiempo_preparacion: [0, [Validators.min(0)]],
      estatus: [true, Validators.required]
    });

    // Validar que precio de venta sea mayor a precio de producción
    this.form.get('precio_venta')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validarPrecios());

    this.form.get('precio_produccion')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.validarPrecios());
  }

  validarPrecios(): void {
    const precioProduccion = this.form.get('precio_produccion')?.value || 0;
    const precioVenta = this.form.get('precio_venta')?.value || 0;

    if (precioVenta > 0 && precioProduccion > 0 && precioVenta <= precioProduccion) {
      this.form.get('precio_venta')?.setErrors({ precioInvalido: true });
    } else if (this.form.get('precio_venta')?.hasError('precioInvalido')) {
      this.form.get('precio_venta')?.setErrors(null);
    }
  }

  cargarCatalogos(): void {
    this.platillosService.getTiposPlatilloActivos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tipos) => {
          this.tiposPlatillo = tipos;
        },
        error: (error) => {
          console.error('Error cargando tipos de platillo:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los tipos de platillo disponibles'
          });
        }
      });
  }

  getNombreTipoPlatillo(idTipo: number): string {
    const tipo = this.tiposPlatillo.find(t =>
      (t.__id_tipo_platillo__ || t.id_tipo_platillo) === idTipo
    );
    return tipo?.descripcion || 'Tipo no encontrado';
  }

  getTipoPlatilloId(tipo: TipoPlatillo): number {
    return tipo.__id_tipo_platillo__ || tipo.id_tipo_platillo || 0;
  }

  /**
   * Obtiene las iniciales del platillo para el placeholder
   */
  getInicialesPlatillo(): string {
    const nombre = this.form.get('Nombre_platillo')?.value || '';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase() || '🍽️';
  }

  /**
   * Maneja la selección de imagen
   */
  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          text: 'Por favor selecciona una imagen válida (JPG, PNG, GIF)'
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'La imagen no debe superar los 5MB'
        });
        return;
      }

      this.imagenSeleccionada = file;

      // Crear previsualización
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Elimina la imagen seleccionada
   */
  eliminarImagenSeleccionada(): void {
    this.imagenSeleccionada = null;
    this.previsualizacionImagen = null;

    // Limpiar el input file
    const inputFile = document.getElementById('imagen-platillo') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  // ============================================
  // GESTIÓN DE OPCIONES
  // ============================================

  /**
   * Muestra el formulario para agregar/editar opción
   */
  mostrarFormularioOpcion(): void {
    this.mostrarFormOpcion = true;
    this.opcionNombre = '';
    this.opcionPrecio = 0;
    this.editandoOpcionIndex = null;
  }

  /**
   * Agrega una nueva opción a la lista
   */
  agregarOpcion(): void {
    if (!this.opcionNombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Por favor ingresa el nombre de la opción',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    if (this.opcionPrecio < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio debe ser mayor o igual a 0',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    // Verificar si ya existe una opción con el mismo nombre
    const existe = this.opciones.some((opt, index) =>
      opt.opcion.toLowerCase() === this.opcionNombre.toLowerCase() &&
      index !== this.editandoOpcionIndex
    );

    if (existe) {
      Swal.fire({
        icon: 'warning',
        title: 'Opción duplicada',
        text: 'Ya existe una opción con ese nombre',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    if (this.editandoOpcionIndex !== null) {
      // Editar opción existente
      this.opciones[this.editandoOpcionIndex] = {
        opcion: this.opcionNombre.trim(),
        precio: this.opcionPrecio
      };
    } else {
      // Agregar nueva opción
      this.opciones.push({
        opcion: this.opcionNombre.trim(),
        precio: this.opcionPrecio
      });
    }

    this.cancelarOpcion();
  }

  /**
   * Edita una opción existente
   */
  editarOpcion(index: number): void {
    const opcion = this.opciones[index];
    this.opcionNombre = opcion.opcion;
    this.opcionPrecio = opcion.precio;
    this.editandoOpcionIndex = index;
    this.mostrarFormOpcion = true;
  }

  /**
   * Elimina una opción de la lista
   */
  eliminarOpcion(index: number): void {
    Swal.fire({
      title: '¿Eliminar opción?',
      text: `¿Deseas eliminar la opción "${this.opciones[index].opcion}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.opciones.splice(index, 1);
      }
    });
  }

  /**
   * Cancela la creación/edición de opción
   */
  cancelarOpcion(): void {
    this.mostrarFormOpcion = false;
    this.opcionNombre = '';
    this.opcionPrecio = 0;
    this.editandoOpcionIndex = null;
  }

  /**
   * Crea un nuevo platillo
   */
  create_platillo(): void {
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

    if (!this.imagenSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen requerida',
        text: 'Por favor selecciona una imagen para el platillo',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const nuevoPlatillo: Partial<Platillo> = this.form.getRawValue();

    // Construir HTML para mostrar opciones
    let opcionesHTML = '';
    if (this.opciones.length > 0) {
      opcionesHTML = '<p><strong>Opciones:</strong></p><ul style="text-align: left; margin-left: 20px;">';
      this.opciones.forEach(opt => {
        opcionesHTML += `<li>${opt.opcion} - ${opt.precio.toFixed(2)}</li>`;
      });
      opcionesHTML += '</ul>';
    }

    // Mostrar confirmación
    Swal.fire({
      title: '¿Crear nuevo platillo?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Nombre:</strong> ${nuevoPlatillo.Nombre_platillo}</p>
          <p><strong>Tipo:</strong> ${this.getNombreTipoPlatillo(nuevoPlatillo.id_tipo_platillo!)}</p>
          <p><strong>Precio Venta:</strong> ${nuevoPlatillo.precio_venta?.toFixed(2)}</p>
          <p><strong>Precio Producción:</strong> ${nuevoPlatillo.precio_produccion?.toFixed(2)}</p>
          ${opcionesHTML}
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
        this.guardarPlatillo(nuevoPlatillo);
      }
    });
  }

  /**
   * Guarda el platillo en la base de datos
   */
  private guardarPlatillo(platillo: Partial<Platillo>): void {
    this.loading = true;

    // Primero, subir la imagen y obtener la ruta
    if (this.imagenSeleccionada) {
      this.subirImagenPlatillo(platillo);
    } else {
      this.crearPlatilloEnDB(platillo);
    }
  }

  /**
   * Sube la imagen del platillo
   */
  private subirImagenPlatillo(platillo: Partial<Platillo>): void {
    if (!this.imagenSeleccionada) {
      this.crearPlatilloEnDB(platillo);
      return;
    }

    const formData = new FormData();
    formData.append('file', this.imagenSeleccionada);

    // Subir imagen primero
    this.platillosService.uploadImagenPlatillo(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Imagen subida:', response);
          // Asignar la ruta de la imagen al platillo
          platillo.Ruta_imagen = response.ruta_imagen;
          this.crearPlatilloEnDB(platillo);
        },
        error: (error) => {
          console.error('Error al subir imagen:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error al subir imagen',
            text: error.message || 'No se pudo subir la imagen. Intenta nuevamente.',
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  /**
   * Crea el platillo en la base de datos
   */
  private crearPlatilloEnDB(platillo: Partial<Platillo>): void {
    this.platillosService.createPlatillo(platillo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Platillo creado exitosamente:', response);

          // Si hay opciones, crearlas después del platillo
          if (this.opciones.length > 0 && response.id_platillo) {
            this.crearOpcionesPlatillo(response.id_platillo, platillo);
          } else {
            this.mostrarExitoYSalir(platillo);
          }
        },
        error: (error) => {
          console.error('Error al crear platillo:', error);
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error al crear platillo',
            text: error.message || 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  /**
   * Crea las opciones del platillo
   */
  private crearOpcionesPlatillo(idPlatillo: string, platillo: Partial<Platillo>): void {
    let opcionesCreadas = 0;
    let erroresOpciones = 0;

    this.opciones.forEach((opcion, index) => {
      const nuevaOpcion: Partial<OpcionPlatillo> = {
        id_platillo: idPlatillo,
        opcion: opcion.opcion,
        precio: opcion.precio
      };

      this.platillosService.createOpcionPlatillo(nuevaOpcion)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            opcionesCreadas++;
            this.verificarFinalizacionOpciones(opcionesCreadas, erroresOpciones, platillo);
          },
          error: (error) => {
            console.error(`Error al crear opción ${opcion.opcion}:`, error);
            erroresOpciones++;
            this.verificarFinalizacionOpciones(opcionesCreadas, erroresOpciones, platillo);
          }
        });
    });
  }

  /**
   * Verifica si se terminaron de crear todas las opciones
   */
  private verificarFinalizacionOpciones(
    opcionesCreadas: number,
    erroresOpciones: number,
    platillo: Partial<Platillo>
  ): void {
    const totalOpciones = this.opciones.length;

    if (opcionesCreadas + erroresOpciones === totalOpciones) {
      if (erroresOpciones > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Platillo creado con advertencias',
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p>${platillo.Nombre_platillo} fue creado exitosamente.</p>
              <p><strong>Opciones creadas:</strong> ${opcionesCreadas} de ${totalOpciones}</p>
              ${erroresOpciones > 0 ? `<p style="color: #773832;"><strong>Errores:</strong> ${erroresOpciones} opciones no se pudieron crear</p>` : ''}
            </div>
          `,
          confirmButtonColor: '#d4af37'
        }).then(() => {
          this.resetFormulario();
        });
      } else {
        this.mostrarExitoYSalir(platillo);
      }
    }
  }

  /**
   * Muestra mensaje de éxito y sale del formulario
   */
  private mostrarExitoYSalir(platillo: Partial<Platillo>): void {
    this.loading = false;

    const mensajeOpciones = this.opciones.length > 0
      ? ` con ${this.opciones.length} opción(es)`
      : '';

    Swal.fire({
      icon: 'success',
      title: '¡Platillo creado!',
      text: `${platillo.Nombre_platillo} ha sido agregado exitosamente${mensajeOpciones}`,
      confirmButtonColor: '#d4af37'
    }).then(() => {
      this.resetFormulario();
    });
  }

  /**
   * Resetea el formulario y variables
   */
  private resetFormulario(): void {
    this.form.reset({ estatus: true });
    this.imagenSeleccionada = null;
    this.previsualizacionImagen = null;
    this.opciones = [];
    this.cancelarOpcion();
    this.volver.emit();
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
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('precioInvalido')) {
      return 'El precio de venta debe ser mayor al precio de producción';
    }

    return '';
  }

  regresar(): void {
    if (this.form.dirty || this.imagenSeleccionada || this.opciones.length > 0) {
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