import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CombosService, ComboSchema, ComboDetalleSchema, Combo } from '../../../../services/administrador/combos';
import { PlatillosService, Platillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface PlatilloCombo {
  id_detalle_combo?: string;
  id_platillo: string;
  Nombre_platillo: string;
  Ruta_imagen?: string;
  precio_platillo: number;
  cantidad: number;
}

@Component({
  selector: 'app-editar-combo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './editar-combo.html',
  styleUrls: ['./editar-combo.css'],
})
export class EditarCombo implements OnInit, OnDestroy, OnChanges {
  private destroy$ = new Subject<void>();
  private apiUrlserve = environment.apiUrl;

  @Input() idCombo!: string;
  @Output() volver = new EventEmitter<void>();

  tab: string = "informacion_basica";
  form!: FormGroup;
  loading: boolean = true;
  guardando: boolean = false;

  // Combo original
  comboOriginal?: Combo;

  // Variables para platillos disponibles
  platillosDisponibles: Platillo[] = [];
  platillosFiltrados: Platillo[] = [];
  busquedaPlatillo: string = '';
  cargandoPlatillos: boolean = false;

  // Platillos seleccionados para el combo
  platillosSeleccionados: PlatilloCombo[] = [];
  platillosEliminados: string[] = []; // IDs de detalles eliminados

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;
  imagenOriginal: string | null = null;
  imagenModificada: boolean = false;
  eliminarImagenExistente: boolean = false;

  constructor(
    private combosService: CombosService,
    private platillosService: PlatillosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCombo'] && this.idCombo) {
      this.cargarDatos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      Nombre_combo: ['', [Validators.required, Validators.minLength(3)]],
      Descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio_combo: [0, [Validators.required, Validators.min(0)]],
      estatus: [1, Validators.required]
    });
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;

    try {
      // Cargar combo y platillos en paralelo
      await Promise.all([
        this.cargarCombo(),
        this.cargarPlatillos()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos del combo'
      });
    } finally {
      this.loading = false;
    }
  }

  async cargarCombo(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.combosService.getComboByNombre(this.idCombo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (combo) => {
            this.comboOriginal = combo;
            this.cargarDatosFormulario(combo);
            resolve();
          },
          error: (error) => {
            console.error('Error cargando combo:', error);
            reject(error);
          }
        });
    });
  }

  cargarDatosFormulario(combo: Combo): void {
    // Cargar datos básicos
    this.form.patchValue({
      Nombre_combo: combo.Nombre_combo,
      Descripcion: combo.Descripcion || '',
      precio_combo: combo.precio_combo,
      estatus: combo.estatus ? true : false
    });

    // Cargar imagen
    if (combo.Ruta_imagen) {
      this.imagenOriginal = combo.Ruta_imagen;
      this.previsualizacionImagen = this.getImagenCombo(combo.Ruta_imagen);
    }

    // Cargar platillos del combo
    if (combo.platillos && combo.platillos.length > 0) {
      this.platillosSeleccionados = combo.platillos.map(p => ({
        id_detalle_combo: p.id_detalle_combo,
        id_platillo: p.id_platillo,
        Nombre_platillo: p.Nombre_platillo,
        precio_platillo: p.precio_platillo,
        cantidad: p.Cantidad
      }));
    }
  }

  cargarPlatillos(): void {
    this.cargandoPlatillos = true;

    this.platillosService.getAllPlatillos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (platillos) => {
          this.platillosDisponibles = platillos.filter(p => p.estatus === true);
          this.platillosFiltrados = [...this.platillosDisponibles];
          this.cargandoPlatillos = false;
        },
        error: (error) => {
          console.error('Error cargando platillos:', error);
          this.cargandoPlatillos = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los platillos disponibles'
          });
        }
      });
  }

  buscarPlatillo(): void {
    const termino = this.busquedaPlatillo.toLowerCase().trim();

    if (!termino) {
      this.platillosFiltrados = [...this.platillosDisponibles];
      return;
    }

    this.platillosFiltrados = this.platillosDisponibles.filter(p =>
      p.Nombre_platillo.toLowerCase().includes(termino)
    );
  }

  getImagenPlatillo(Ruta_imagen: string): string {
    if (Ruta_imagen) {
      return `${this.apiUrlserve}/${Ruta_imagen}`;
    }
    return 'assets/images/platillo-placeholder.png';
  }

  getImagenCombo(Ruta_imagen: string): string {
    if (Ruta_imagen) {
      return `${this.apiUrlserve}/${Ruta_imagen}`;
    }
    return 'assets/images/combo-placeholder.png';
  }

  getInicialesPlatillo(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase() || '🍽️';
  }

  esPlatilloSeleccionado(idPlatillo: string): boolean {
    return this.platillosSeleccionados.some(p => p.id_platillo === idPlatillo);
  }

  agregarPlatillo(platillo: Platillo): void {
    if (this.esPlatilloSeleccionado(platillo.id_platillo!)) {
      Swal.fire({
        icon: 'info',
        title: 'Platillo ya agregado',
        text: 'Este platillo ya está en el combo',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const platilloCombo: PlatilloCombo = {
      id_platillo: platillo.id_platillo!,
      Nombre_platillo: platillo.Nombre_platillo,
      Ruta_imagen: platillo.Ruta_imagen,
      precio_platillo: platillo.precio_venta || 0,
      cantidad: 1
    };

    this.platillosSeleccionados.push(platilloCombo);
    this.calcularPrecioTotal();
  }

  quitarPlatillo(index: number): void {
    const platillo = this.platillosSeleccionados[index];

    Swal.fire({
      title: '¿Quitar platillo?',
      text: `¿Deseas quitar "${platillo.Nombre_platillo}" del combo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Si tiene id_detalle_combo, marcarlo para eliminar
        if (platillo.id_detalle_combo) {
          this.platillosEliminados.push(platillo.id_detalle_combo);
        }

        this.platillosSeleccionados.splice(index, 1);
        this.calcularPrecioTotal();
      }
    });
  }

  actualizarCantidad(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let cantidad = parseInt(input.value) || 1;

    if (cantidad < 1) {
      cantidad = 1;
      input.value = '1';
    }

    this.platillosSeleccionados[index].cantidad = cantidad;
    this.calcularPrecioTotal();
  }

  calcularPrecioTotal(): void {
    const total = this.platillosSeleccionados.reduce((sum, platillo) => {
      return sum + (platillo.precio_platillo * platillo.cantidad);
    }, 0);

    this.form.patchValue({
      precio_combo: total
    }, { emitEvent: false });
  }

  getSubtotalPlatillo(platillo: PlatilloCombo): number {
    return platillo.precio_platillo * platillo.cantidad;
  }

  getPrecioTotalCalculado(): number {
    return this.platillosSeleccionados.reduce((sum, platillo) => {
      return sum + this.getSubtotalPlatillo(platillo);
    }, 0);
  }

  // ============================================
  // GESTIÓN DE IMAGEN
  // ============================================

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const validacion = this.combosService.validateImageFile(file);
      if (!validacion.valid) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          text: validacion.error
        });
        return;
      }

      this.imagenSeleccionada = file;
      this.imagenModificada = true;
      this.eliminarImagenExistente = false;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagenSeleccionada(): void {
    this.imagenSeleccionada = null;
    this.previsualizacionImagen = null;
    this.imagenModificada = true;

    // Si había imagen original, marcarla para eliminar
    if (this.imagenOriginal) {
      this.eliminarImagenExistente = true;
    }

    const inputFile = document.getElementById('imagen-combo') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  getInicialesCombo(): string {
    const nombre = this.form.get('Nombre_combo')?.value || '';
    if (!nombre) return '🍽️';

    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase() || '🍽️';
  }

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  async guardarCambios(): Promise<void> {
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

    if (this.platillosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin platillos',
        text: 'Debes tener al menos un platillo en el combo',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Se actualizará el combo con los datos modificados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.guardando = true;

    try {
      // 1. Actualizar información básica del combo
      const comboData: Partial<ComboSchema> = {
        Nombre_combo: this.form.get('Nombre_combo')?.value,
        Descripcion: this.form.get('Descripcion')?.value,
        precio_combo: this.form.get('precio_combo')?.value,
        estatus: this.form.get('estatus')?.value
      };
      await this.combosService.updateCombo(this.idCombo, comboData).toPromise();

      // 2. Gestionar imagen
      if (this.eliminarImagenExistente && this.imagenOriginal) {
        try {
          await this.combosService.deleteComboImage(this.idCombo).toPromise();
        } catch (error) {
          console.error('Error eliminando imagen:', error);
        }
      }

      if (this.imagenSeleccionada) {
        try {
          await this.combosService.uploadComboImage(this.idCombo, this.imagenSeleccionada).toPromise();
        } catch (error) {
          console.error('Error subiendo imagen:', error);
        }
      }

      // 3. Eliminar platillos marcados
      for (const idDetalle of this.platillosEliminados) {
        try {
          await this.combosService.deleteComboDetalle(idDetalle).toPromise();
        } catch (error) {
          console.error('Error eliminando detalle:', error);
        }
      }

      // 4. Actualizar/agregar platillos
      const platillosNuevos: ComboDetalleSchema[] = [];

      for (const platillo of this.platillosSeleccionados) {
        if (platillo.id_detalle_combo) {
          // Actualizar existente
          try {
            await this.combosService.updateComboDetalle(
              platillo.id_detalle_combo,
              { Cantidad: platillo.cantidad }
            ).toPromise();
          } catch (error) {
            console.error('Error actualizando detalle:', error);
          }
        } else {
          // Nuevo platillo
          platillosNuevos.push({
            id_platillo: platillo.id_platillo,
            Cantidad: platillo.cantidad
          });
        }
      }

      // Agregar platillos nuevos
      if (platillosNuevos.length > 0) {
        await this.combosService.addPlatillosToCombo(this.idCombo, platillosNuevos).toPromise();
      }

      this.guardando = false;

      Swal.fire({
        icon: 'success',
        title: '¡Cambios guardados!',
        text: 'El combo se actualizó correctamente',
        confirmButtonColor: '#d4af37'
      }).then(() => {
        this.volver.emit();
      });

    } catch (error: any) {
      console.error('Error actualizando combo:', error);
      this.guardando = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo actualizar el combo: ${error.message}`,
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

    return '';
  }

  cancelar(): void {
    if (this.form.dirty || this.imagenModificada || this.platillosEliminados.length > 0) {
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