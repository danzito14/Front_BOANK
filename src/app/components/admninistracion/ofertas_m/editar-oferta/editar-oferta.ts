import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { OfertasService, OfertasSchema, OfertaPlatilloSchema, Oferta, OfertaPlatillo } from '../../../../services/administrador/ofertas';
import { PlatillosService, Platillo } from '../../../../services/administrador/platillos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface PlatilloOferta {
  id_platillo: string;
  Nombre_platillo: string;
  Ruta_imagen?: string;
  precio_platillo: number;
  precio_con_descuento?: number;
  id_oferta_platillo?: string; // Para poder eliminar
}

@Component({
  selector: 'app-editar-oferta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './editar-oferta.html',
  styleUrls: ['./editar-oferta.css'],
})
export class EditarOferta implements OnInit, OnDestroy, OnChanges {
  private destroy$ = new Subject<void>();
  private apiUrlserve = environment.apiUrl;

  @Input() idOferta!: string;
  @Output() volver = new EventEmitter<void>();

  tab: string = "informacion_basica";
  form!: FormGroup;
  loading: boolean = false;
  guardando: boolean = false;

  // Variables para platillos disponibles
  platillosDisponibles: Platillo[] = [];
  platillosFiltrados: Platillo[] = [];
  busquedaPlatillo: string = '';
  cargandoPlatillos: boolean = false;

  // Platillos seleccionados para la oferta
  platillosSeleccionados: PlatilloOferta[] = [];
  platillosOriginales: PlatilloOferta[] = []; // Para comparar cambios

  // Fecha mínima (hoy)
  fechaMinima: string = '';

  // Oferta original
  ofertaOriginal?: Oferta;

  constructor(
    private ofertasService: OfertasService,
    private platillosService: PlatillosService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.establecerFechaMinima();
    this.cargarPlatillos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idOferta'] && this.idOferta) {
      this.cargarOferta();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  establecerFechaMinima(): void {
    const hoy = new Date();
    this.fechaMinima = hoy.toISOString().split('T')[0];
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      nombre_oferta: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      porcentaje_descuento: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      fecha_inicio: ['', Validators.required],
      fecha_fin: ['', Validators.required],
      activo: [1, Validators.required]
    }, { validators: this.validarFechas });
  }

  validarFechas(group: FormGroup): { [key: string]: boolean } | null {
    const fechaInicio = group.get('fecha_inicio')?.value;
    const fechaFin = group.get('fecha_fin')?.value;

    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (inicio >= fin) {
        return { fechasInvalidas: true };
      }
    }

    return null;
  }

  // ============================================
  // CARGAR OFERTA EXISTENTE
  // ============================================

  async cargarOferta(): Promise<void> {
    this.loading = true;

    try {
      // Cargar datos de la oferta
      const oferta = await this.ofertasService.getOfertaById(this.idOferta).toPromise();

      if (!oferta) {
        throw new Error('Oferta no encontrada');
      }

      this.ofertaOriginal = oferta;

      // Llenar formulario
      this.form.patchValue({
        nombre_oferta: oferta.nombre_oferta || '',
        descripcion: oferta.descripcion || '',
        porcentaje_descuento: oferta.porcentaje_descuento || 0,
        fecha_inicio: this.formatDateForInput(oferta.fecha_inicio),
        fecha_fin: this.formatDateForInput(oferta.fecha_fin),
        activo: oferta.activo ? true : false
      });

      // Cargar platillos de la oferta
      await this.cargarPlatillosOferta();

      this.loading = false;
    } catch (error) {
      console.error('Error cargando oferta:', error);
      this.loading = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la oferta',
        confirmButtonColor: '#773832'
      }).then(() => {
        this.volver.emit();
      });
    }
  }

  async cargarPlatillosOferta(): Promise<void> {
    try {
      const platillosOferta = await this.ofertasService.getPlatillosByOferta(this.idOferta).toPromise();

      if (platillosOferta && platillosOferta.length > 0) {
        const descuento = this.form.get('porcentaje_descuento')?.value || 0;

        this.platillosSeleccionados = platillosOferta.map(p => ({
          id_platillo: p.id_platillo!,
          Nombre_platillo: p.Nombre_platillo || '',
          Ruta_imagen: p.Ruta_imagen,
          precio_platillo: p.precio_venta || 0,
          precio_con_descuento: this.ofertasService.calcularPrecioConDescuento(p.precio_venta || 0, descuento),
          id_oferta_platillo: p.id_oferta_platillo
        }));

        // Guardar copia de platillos originales
        this.platillosOriginales = [...this.platillosSeleccionados];
      }
    } catch (error) {
      console.error('Error cargando platillos de la oferta:', error);
    }
  }

  formatDateForInput(fecha: string | null | undefined): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
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

  getImagenPlatillo(Ruta_imagen: string | undefined): string {
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
        text: 'Este platillo ya está en la oferta',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const descuento = this.form.get('porcentaje_descuento')?.value || 0;
    const precioOriginal = platillo.precio_venta || 0;
    const precioConDescuento = this.ofertasService.calcularPrecioConDescuento(precioOriginal, descuento);

    const platilloOferta: PlatilloOferta = {
      id_platillo: platillo.id_platillo!,
      Nombre_platillo: platillo.Nombre_platillo,
      Ruta_imagen: platillo.Ruta_imagen,
      precio_platillo: precioOriginal,
      precio_con_descuento: precioConDescuento
    };

    this.platillosSeleccionados.push(platilloOferta);
  }

  quitarPlatillo(index: number): void {
    const platillo = this.platillosSeleccionados[index];

    Swal.fire({
      title: '¿Quitar platillo?',
      text: `¿Deseas quitar "${platillo.Nombre_platillo}" de la oferta?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.platillosSeleccionados.splice(index, 1);
      }
    });
  }

  onDescuentoChange(): void {
    const descuento = this.form.get('porcentaje_descuento')?.value || 0;

    this.platillosSeleccionados = this.platillosSeleccionados.map(p => ({
      ...p,
      precio_con_descuento: this.ofertasService.calcularPrecioConDescuento(p.precio_platillo, descuento)
    }));
  }

  getPrecioConDescuento(platillo: PlatilloOferta): number {
    return platillo.precio_con_descuento || platillo.precio_platillo;
  }

  getAhorro(platillo: PlatilloOferta): number {
    return platillo.precio_platillo - this.getPrecioConDescuento(platillo);
  }

  getTotalAhorro(): number {
    return this.platillosSeleccionados.reduce((sum, p) => sum + this.getAhorro(p), 0);
  }

  formatFecha(fecha: string | null): string {
    return this.ofertasService.formatFecha(fecha);
  }

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  async guardarOferta(): Promise<void> {
    if (this.form.invalid) {
      this.marcarCamposInvalidos();

      if (this.form.errors?.['fechasInvalidas']) {
        Swal.fire({
          icon: 'warning',
          title: 'Fechas inválidas',
          text: 'La fecha de inicio debe ser anterior a la fecha de fin',
          confirmButtonColor: '#d4af37'
        });
        return;
      }

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
        text: 'Debes agregar al menos un platillo a la oferta',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Guardar cambios?',
      text: 'Se actualizará la oferta con los datos proporcionados',
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
      // 1. Actualizar información de la oferta
      const ofertaData: Partial<OfertasSchema> = {
        nombre_oferta: this.form.get('nombre_oferta')?.value,
        descripcion: this.form.get('descripcion')?.value,
        porcentaje_descuento: this.form.get('porcentaje_descuento')?.value,
        fecha_inicio: this.form.get('fecha_inicio')?.value,
        fecha_fin: this.form.get('fecha_fin')?.value,
        activo: this.form.get('activo')?.value
      };

      await this.ofertasService.updateOferta(this.idOferta, ofertaData).toPromise();

      // 2. Gestionar cambios en platillos
      await this.actualizarPlatillos();

      this.guardando = false;

      Swal.fire({
        icon: 'success',
        title: '¡Oferta actualizada!',
        text: 'La oferta se actualizó correctamente',
        confirmButtonColor: '#d4af37'
      }).then(() => {
        this.volver.emit();
      });

    } catch (error: any) {
      console.error('Error actualizando oferta:', error);
      this.guardando = false;

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo actualizar la oferta: ${error.message}`,
        confirmButtonColor: '#773832'
      });
    }
  }

  async actualizarPlatillos(): Promise<void> {
    // Identificar platillos eliminados
    const platillosEliminados = this.platillosOriginales.filter(
      original => !this.platillosSeleccionados.some(actual => actual.id_platillo === original.id_platillo)
    );

    // Identificar platillos nuevos
    const platillosNuevos = this.platillosSeleccionados.filter(
      actual => !this.platillosOriginales.some(original => original.id_platillo === actual.id_platillo)
    );

    // Eliminar platillos que ya no están
    for (const platillo of platillosEliminados) {
      if (platillo.id_oferta_platillo) {
        await this.ofertasService.deleteOfertaPlatillo(platillo.id_oferta_platillo).toPromise();
      }
    }

    // Agregar nuevos platillos
    if (platillosNuevos.length > 0) {
      const idsPlatillos = platillosNuevos.map(p => p.id_platillo);

      const dataPlatillos: OfertaPlatilloSchema = {
        id_platillo: idsPlatillos,
        activo: 1
      };

      await this.ofertasService.createOfertaPlatillo(this.idOferta, dataPlatillos).toPromise();
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

    return '';
  }

  cancelar(): void {
    if (this.form.dirty || this.hayDiferenciasPlatillos()) {
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

  hayDiferenciasPlatillos(): boolean {
    if (this.platillosSeleccionados.length !== this.platillosOriginales.length) {
      return true;
    }

    return this.platillosSeleccionados.some(
      actual => !this.platillosOriginales.some(original => original.id_platillo === actual.id_platillo)
    );
  }
}