import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { PlatillosService, Platillo, TipoPlatillo, OpcionPlatillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface OpcionTemp {
  id_option?: number;
  opcion: string;
  precio: number;
  esNueva?: boolean;
  esModificada?: boolean;
}

@Component({
  selector: 'app-editar-platillo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './editar-platillo.html',
  styleUrls: ['./editar-platillo.css'],
})
export class EditarPlatillo implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrlserve = environment.apiUrl;

  tab: string = "informacion_basica";
  form!: FormGroup;
  loading: boolean = false;
  platilloOriginal?: Platillo;

  // Guardar valores originales para comparación
  private valoresOriginales: any = {};

  tiposPlatillo: TipoPlatillo[] = [];

  // Variables para opciones
  opciones: OpcionTemp[] = [];
  opcionesOriginales: OpcionPlatillo[] = [];
  opcionesEliminadas: number[] = [];
  mostrarFormOpcion: boolean = false;
  opcionNombre: string = '';
  opcionPrecio: number = 0;
  editandoOpcionIndex: number | null = null;

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;
  subiendoImagen: boolean = false;
  imagenCambiada: boolean = false;

  @Input() id_platillo: string = "";
  @Output() volver = new EventEmitter<void>();

  constructor(
    private platillosService: PlatillosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();

    if (this.id_platillo) {
      this.cargarDatosPlatillo();
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

  cargarDatosPlatillo(): void {
    this.loading = true;

    this.platillosService.getPlatilloByIdADIM(this.id_platillo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (platillo) => {
          console.log('Platillo cargado:', platillo);
          this.platilloOriginal = platillo;
          this.rellenarFormulario(platillo);

          // Guardar valores originales
          this.valoresOriginales = this.form.getRawValue();
          console.log('Valores originales guardados:', this.valoresOriginales);

          // Cargar opciones del platillo
          this.cargarOpciones();

          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando platillo:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del platillo'
          });
        }
      });
  }

  cargarOpciones(): void {
    this.platillosService.getOpcionesPlatillo(this.id_platillo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opciones) => {
          console.log('Opciones cargadas:', opciones);
          this.opcionesOriginales = opciones;
          this.opciones = opciones.map(op => ({
            id_option: op.id_option || op.__id_option__,
            opcion: op.opcion,
            precio: op.precio,
            esNueva: false,
            esModificada: false
          }));
        },
        error: (error) => {
          console.error('Error cargando opciones:', error);
        }
      });
  }

  rellenarFormulario(platillo: Platillo): void {
    this.form.patchValue({
      Nombre_platillo: platillo.Nombre_platillo,
      id_tipo_platillo: platillo.id_tipo_platillo,
      precio_produccion: platillo.precio_produccion,
      precio_venta: platillo.precio_venta,
      Descripcion: platillo.Descripcion,
      tiempo_preparacion: platillo.tiempo_preparacion || 0,
      estatus: platillo.estatus
    });

    // Cargar imagen si existe
    if (platillo.Ruta_imagen) {
      this.previsualizacionImagen = `${this.apiUrlserve}/${platillo.Ruta_imagen}`;
    }
  }

  /**
   * Obtiene solo los campos que han sido modificados
   */
  private obtenerCamposModificados(): Partial<Platillo> {
    const valoresActuales = this.form.getRawValue();
    const camposModificados: any = {};

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

  /**
   * Normaliza valores para comparación
   */
  private normalizarValor(valor: any): any {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    if (typeof valor === 'number') {
      return valor;
    }

    if (typeof valor === 'string') {
      return valor.trim();
    }

    return valor;
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

  // ============================================
  // GESTIÓN DE OPCIONES
  // ============================================

  mostrarFormularioOpcion(): void {
    this.mostrarFormOpcion = true;
    this.opcionNombre = '';
    this.opcionPrecio = 0;
    this.editandoOpcionIndex = null;
  }

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

    // Verificar duplicados
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
      const opcionActual = this.opciones[this.editandoOpcionIndex];
      this.opciones[this.editandoOpcionIndex] = {
        ...opcionActual,
        opcion: this.opcionNombre.trim(),
        precio: this.opcionPrecio,
        esModificada: !opcionActual.esNueva
      };
    } else {
      // Agregar nueva opción
      this.opciones.push({
        opcion: this.opcionNombre.trim(),
        precio: this.opcionPrecio,
        esNueva: true
      });
    }

    this.cancelarOpcion();
  }

  editarOpcion(index: number): void {
    const opcion = this.opciones[index];
    this.opcionNombre = opcion.opcion;
    this.opcionPrecio = opcion.precio;
    this.editandoOpcionIndex = index;
    this.mostrarFormOpcion = true;
  }

  eliminarOpcion(index: number): void {
    const opcion = this.opciones[index];

    Swal.fire({
      title: '¿Eliminar opción?',
      text: `¿Deseas eliminar la opción "${opcion.opcion}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si tiene id_option, es una opción existente
        if (opcion.id_option) {
          this.opcionesEliminadas.push(opcion.id_option);
        }
        this.opciones.splice(index, 1);
      }
    });
  }

  cancelarOpcion(): void {
    this.mostrarFormOpcion = false;
    this.opcionNombre = '';
    this.opcionPrecio = 0;
    this.editandoOpcionIndex = null;
  }

  // ============================================
  // GESTIÓN DE IMAGEN
  // ============================================

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          text: 'Por favor selecciona una imagen válida (JPG, PNG, GIF)'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'La imagen no debe superar los 5MB'
        });
        return;
      }

      this.imagenSeleccionada = file;
      this.imagenCambiada = true;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Sube la imagen del platillo (independiente de otros cambios)
   */
  async subirImagen(): Promise<void> {
    if (!this.imagenSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin imagen',
        text: 'Por favor selecciona una imagen primero',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    // Confirmar subida
    const confirmacion = await Swal.fire({
      title: '¿Actualizar imagen?',
      text: 'Se actualizará la imagen del platillo',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.subiendoImagen = true;

    try {
      const formData = new FormData();
      formData.append('file', this.imagenSeleccionada);

      const resultado = await this.platillosService.updateImagenPlatillo(
        this.id_platillo,
        formData
      ).toPromise();

      console.log('Imagen actualizada:', resultado);

      Swal.fire({
        icon: 'success',
        title: '¡Imagen actualizada!',
        text: 'La imagen del platillo se actualizó correctamente',
        confirmButtonColor: '#d4af37'
      });

      // Actualizar previsualización con la nueva ruta
      if (resultado?.ruta_imagen) {
        this.previsualizacionImagen = `${this.apiUrlserve}/${resultado.ruta_imagen}`;

        // Actualizar el platillo original
        if (this.platilloOriginal) {
          this.platilloOriginal.Ruta_imagen = resultado.ruta_imagen;
        }
      }

      // Limpiar estado de imagen cambiada
      this.imagenSeleccionada = null;
      this.imagenCambiada = false;

      // Limpiar input file
      const inputFile = document.getElementById('imagen-platillo') as HTMLInputElement;
      if (inputFile) {
        inputFile.value = '';
      }

    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo subir la imagen: ${error.message || 'Error desconocido'}`,
        confirmButtonColor: '#773832'
      });
    } finally {
      this.subiendoImagen = false;
    }
  }

  eliminarImagenSeleccionada(): void {
    this.imagenSeleccionada = null;
    this.imagenCambiada = false;

    if (this.platilloOriginal?.Ruta_imagen) {
      this.previsualizacionImagen = `${this.apiUrlserve}/${this.platilloOriginal.Ruta_imagen}`;
    } else {
      this.previsualizacionImagen = null;
    }

    const inputFile = document.getElementById('imagen-platillo') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  getInicialesPlatillo(): string {
    if (!this.platilloOriginal) return '🍽️';

    const nombre = this.platilloOriginal.Nombre_platillo || '';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase() || '🍽️';
  }

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

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
    const hayOpcionesModificadas = this.hayOpcionesConCambios();

    if (Object.keys(camposModificados).length === 0 && !hayOpcionesModificadas) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se detectaron cambios en el formulario',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    // Advertir si hay imagen sin subir
    if (this.imagenCambiada && this.imagenSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen sin subir',
        text: 'Tienes una imagen seleccionada que no has subido. Por favor usa el botón "Subir Imagen" primero.',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    console.log('Campos modificados:', camposModificados);
    console.log('Opciones modificadas:', hayOpcionesModificadas);

    this.ejecutarActualizacion(camposModificados);
  }

  private hayOpcionesConCambios(): boolean {
    return this.opciones.some(op => op.esNueva || op.esModificada) || this.opcionesEliminadas.length > 0;
  }

  private async ejecutarActualizacion(camposModificados: Partial<Platillo>): Promise<void> {
    this.loading = true;

    try {

      // 1. Actualizar platillo si hay cambios
      if (Object.keys(camposModificados).length > 0) {
        await this.platillosService.updatePlatillo(this.id_platillo, camposModificados).toPromise();
      }

      // 2. Eliminar opciones marcadas
      for (const idOpcion of this.opcionesEliminadas) {
        await this.platillosService.deleteOpcionPlatillo(idOpcion).toPromise();
      }

      // 3. Crear nuevas opciones
      const opcionesNuevas = this.opciones.filter(op => op.esNueva);
      for (const opcion of opcionesNuevas) {
        await this.platillosService.createOpcionPlatillo({
          id_platillo: this.id_platillo,
          opcion: opcion.opcion,
          precio: opcion.precio
        }).toPromise();
      }

      // 4. Actualizar opciones modificadas
      const opcionesModificadas = this.opciones.filter(op => op.esModificada && op.id_option);
      for (const opcion of opcionesModificadas) {
        await this.platillosService.updateOpcionPlatillo(opcion.id_option!, {
          id_platillo: this.id_platillo,
          opcion: opcion.opcion,
          precio: opcion.precio
        }).toPromise();
      }

      this.loading = false;

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'El platillo se actualizó correctamente',
        confirmButtonColor: '#d4af37'
      }).then(() => {
        this.volver.emit();
      });

    } catch (error: any) {
      console.error('Error actualizando platillo:', error);
      this.loading = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo actualizar el platillo: ${error.message}`,
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
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('precioInvalido')) {
      return 'El precio de venta debe ser mayor al precio de producción';
    }

    return '';
  }

  regresar(): void {
    if (this.form.dirty || this.hayOpcionesConCambios() || this.imagenCambiada) {
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