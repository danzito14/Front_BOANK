import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { CombosService, ComboSchema, ComboDetalleSchema } from '../../../../services/administrador/combos';
import { PlatillosService, Platillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface PlatilloCombo {
  id_platillo: string;
  Nombre_platillo: string;
  Ruta_imagen?: string;
  precio_platillo: number;
  cantidad: number;
}

@Component({
  selector: 'app-agregar-combo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agregar-combo.html',
  styleUrls: ['./agregar-combo.css'],
})
export class AgregarCombo implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrlserve = environment.apiUrl;

  tab: string = "informacion_basica";
  form!: FormGroup;
  loading: boolean = false;
  guardando: boolean = false;

  // Variables para platillos disponibles
  platillosDisponibles: Platillo[] = [];
  platillosFiltrados: Platillo[] = [];
  busquedaPlatillo: string = '';
  cargandoPlatillos: boolean = false;

  // Platillos seleccionados para el combo
  platillosSeleccionados: PlatilloCombo[] = [];

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;
  subiendoImagen: boolean = false;

  @Output() volver = new EventEmitter<void>();

  constructor(
    private combosService: CombosService,
    private platillosService: PlatillosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarPlatillos();
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

  cargarPlatillos(): void {
    this.cargandoPlatillos = true;

    this.platillosService.getAllPlatillos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (platillos) => {
          // Filtrar solo platillos activos
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
    Swal.fire({
      title: '¿Quitar platillo?',
      text: `¿Deseas quitar "${this.platillosSeleccionados[index].Nombre_platillo}" del combo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
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

    // Actualizar el precio sugerido del combo
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

      // Validar archivo
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
  // GUARDAR COMBO
  // ============================================

  async guardarCombo(): Promise<void> {
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
        text: 'Debes agregar al menos un platillo al combo',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Crear combo?',
      text: 'Se creará el combo con los datos proporcionados',
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
      // 1. Crear el combo
      const comboData: ComboSchema = {
        Nombre_combo: this.form.get('Nombre_combo')?.value,
        Descripcion: this.form.get('Descripcion')?.value,
        precio_combo: this.form.get('precio_combo')?.value,
        estatus: this.form.get('estatus')?.value
      };

      const responseCombo = await this.combosService.createCombo(comboData).toPromise();
      const idCombo = responseCombo?.id_combo;

      if (!idCombo) {
        throw new Error('No se pudo obtener el ID del combo creado');
      }

      // 2. Subir imagen si existe
      if (this.imagenSeleccionada) {
        try {
          await this.combosService.uploadComboImage(idCombo, this.imagenSeleccionada).toPromise();
        } catch (errorImagen) {
          console.error('Error subiendo imagen:', errorImagen);
          // Continuar aunque la imagen falle
        }
      }

      // 3. Agregar platillos al combo
      const detallesCombo: ComboDetalleSchema[] = this.platillosSeleccionados.map(p =>
      ({
        id_platillo: p.id_platillo,
        Cantidad: p.cantidad
      }));

      console.table(detallesCombo);

      await this.combosService.createComboDetalle(idCombo, detallesCombo).toPromise();

      this.guardando = false;

      Swal.fire({
        icon: 'success',
        title: '¡Combo creado!',
        text: 'El combo se creó correctamente',
        confirmButtonColor: '#d4af37'
      }).then(() => {
        this.volver.emit();
      });

    } catch (error: any) {
      console.error('Error creando combo:', error);
      this.guardando = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo crear el combo: ${error.message}`,
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
    if (this.form.dirty || this.platillosSeleccionados.length > 0 || this.imagenSeleccionada) {
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