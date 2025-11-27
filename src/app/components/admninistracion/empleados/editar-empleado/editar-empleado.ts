import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { EmpleadosService, Empleado, Puesto, Uniforme } from '../../../../services/administrador/empleados';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Telefononumeros } from '../../../../directives/inputs_usuario/telefononumeros';
import { CorreoDirective } from '../../../../directives/inputs_usuario/correousuario';
import { environment } from '../../../../../environments/environments';
@Component({
  selector: 'app-editar-empleado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Telefononumeros, CorreoDirective],
  templateUrl: './editar-empleado.html',
  styleUrls: ['./editar-empleado.css'],
})
export class EditarEmpleado implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrlserve = environment.apiUrl;


  tab: string = "datos_personales";
  form!: FormGroup;
  loading: boolean = false;
  empleadoOriginal?: Empleado;

  // Guardar valores originales para comparación
  private valoresOriginales: any = {};

  puestos: Puesto[] = [];
  uniformes: Uniforme[] = [];
  uniformesFiltrados: Uniforme[] = [];

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;
  subiendoImagen: boolean = false;

  estados: string[] = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
    'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  @Input() id_empleado: string = "";
  @Output() volver = new EventEmitter<void>();

  constructor(
    private empleadosService: EmpleadosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogos();

    if (this.id_empleado) {
      this.cargarDatosEmpleado();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  cancelar() {
    Swal.fire({
      title: "¿Seguro que quiere salir?",
      text: "Algunos cambios no se guardaran si no dio guardar previamente",
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
      Nombre: ['', [Validators.required, Validators.minLength(2)]],
      Apellido: ['', [Validators.required, Validators.minLength(2)]],
      Correo_electronico: ['', [Validators.required, Validators.email]],
      Num_telefonico: ['', Validators.required],
      Calle: [''],
      No_ext: [''],
      No_int: [''],
      Colonia: [''],
      CP: ['', [Validators.pattern(/^\d{5}$/)]],
      Ciudad: [''],
      Municipio: [''],
      Estado: [''],
      id_puesto: [null, Validators.required],
      id_uniforme: [null],
      Fecha_de_contratacion: ['', Validators.required],
      estatus: [true, Validators.required], // true = activo, false = inactivo
      Fecha_de_despido: [''],
      Razon_despido: [''],
      Fecha_de_recontratacion: ['']
    });

    this.form.get('id_puesto')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(idPuesto => {
        this.onPuestoChange(idPuesto);
      });
  }

  cargarCatalogos(): void {
    this.empleadosService.getAllPuestos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (puestos) => {
          this.puestos = puestos;
        },
        error: (error) => {
          console.error('Error cargando puestos:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los puestos disponibles'
          });
        }
      });

    this.empleadosService.getAllUniformes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (uniformes) => {
          this.uniformes = uniformes;
        },
        error: (error) => {
          console.error('Error cargando uniformes:', error);
        }
      });
  }

  cargarDatosEmpleado(): void {
    this.loading = true;

    this.empleadosService.getEmpleadoById(this.id_empleado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleado) => {
          console.log('Empleado cargado:', empleado);
          this.empleadoOriginal = empleado;
          this.rellenarFormulario(empleado);

          // Guardar valores originales DESPUÉS de rellenar el formulario
          this.valoresOriginales = this.form.getRawValue();
          console.log('Valores originales guardados:', this.valoresOriginales);

          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando empleado:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del empleado'
          });
        }
      });
  }

  rellenarFormulario(empleado: Empleado): void {
    this.form.patchValue({
      Nombre: empleado.Nombre,
      Apellido: empleado.Apellido,
      Correo_electronico: empleado.Correo_electronico,
      Num_telefonico: empleado.Num_telefonico,
      Calle: empleado.Calle,
      No_ext: empleado.No_ext,
      No_int: empleado.No_int,
      Colonia: empleado.Colonia,
      CP: empleado.CP,
      Ciudad: empleado.Ciudad,
      Municipio: empleado.Municipio,
      Estado: empleado.Estado,
      id_puesto: empleado.id_puesto,
      id_uniforme: empleado.id_uniforme,
      Fecha_de_contratacion: this.empleadosService.formatFechaInput(empleado.Fecha_de_contratacion),
      estatus: empleado.estatus,
      Fecha_de_despido: empleado.Fecha_de_despido ?
        this.empleadosService.formatFechaInput(empleado.Fecha_de_despido) : '',
      Razon_despido: empleado.Razon_despido,
      Fecha_de_recontratacion: empleado.Fecha_de_recontratacion ?
        this.empleadosService.formatFechaInput(empleado.Fecha_de_recontratacion) : ''
    });

    // Cargar imagen de perfil si existe
    if (empleado.Ruta_imagen) {
      this.previsualizacionImagen = `${this.apiUrlserve}${empleado.Ruta_imagen}`;
    }

    if (empleado.id_puesto) {
      this.onPuestoChange(empleado.id_puesto);
    }
  }

  /**
   * Obtiene solo los campos que han sido modificados
   */
  private obtenerCamposModificados(): Partial<Empleado> {
    const valoresActuales = this.form.getRawValue();
    const camposModificados: any = {};

    // Comparar cada campo con su valor original
    Object.keys(valoresActuales).forEach(key => {
      const valorActual = valoresActuales[key];
      const valorOriginal = this.valoresOriginales[key];

      // Normalizar valores para comparación
      const actualNormalizado = this.normalizarValor(valorActual);
      const originalNormalizado = this.normalizarValor(valorOriginal);

      // Si son diferentes, agregar al objeto de cambios
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
   * Normaliza valores para comparación (maneja null, undefined, '', etc.)
   */
  private normalizarValor(valor: any): any {
    // Convertir null, undefined, '' a null para comparación consistente
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    // Convertir números a strings si es necesario para comparación
    if (typeof valor === 'number') {
      return valor;
    }

    // Trim de strings
    if (typeof valor === 'string') {
      return valor.trim();
    }

    return valor;
  }

  onPuestoChange(idPuesto: number | null): void {
    if (!idPuesto) {
      this.uniformesFiltrados = [];
      this.form.patchValue({ id_uniforme: null });
      return;
    }

    this.uniformesFiltrados = this.uniformes.filter(
      uniforme => uniforme.id_puesto === idPuesto
    );

    const uniformeActual = this.form.get('id_uniforme')?.value;
    const uniformeValido = this.uniformesFiltrados.find(
      u => (u.__id_uniforme__ || u.id_uniforme) === uniformeActual
    );

    if (!uniformeValido) {
      this.form.patchValue({ id_uniforme: null });
    }
  }

  getNombrePuesto(idPuesto: number): string {
    const puesto = this.puestos.find(p =>
      (p.__id_puesto__ || p.id_puesto) === idPuesto
    );
    return puesto?.Nombre_puesto || 'Puesto no encontrado';
  }

  guardarCambios(): void {
    if (this.form.invalid) {
      this.marcarCamposInvalidos();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente'
      });
      return;
    }

    // Obtener solo campos modificados
    const camposModificados = this.obtenerCamposModificados();

    // Verificar si hay cambios
    if (Object.keys(camposModificados).length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se detectaron cambios en el formulario',
        confirmButtonColor: '#d4af37'
      });
      return;
    }

    console.log('Campos modificados a enviar:', camposModificados);

    // Obtener estatus (convertir string a boolean si es necesario)
    let estatusActual = camposModificados.estatus ?? this.valoresOriginales.estatus;
    const estatusOriginal = this.empleadoOriginal?.estatus;

    // Convertir estatus a boolean si viene como string del select
    if (typeof estatusActual === 'string') {
      estatusActual = estatusActual === 'true';
    }

    console.log('Estatus Original:', estatusOriginal, 'Estatus Actual:', estatusActual);

    // Caso 1: El empleado pasa de activo (true) a inactivo (false) - DESPIDO
    if (estatusOriginal === true && estatusActual === false) {
      this.confirmarDespido(camposModificados);
      return;
    }

    // Caso 2: El empleado pasa de inactivo (false) a activo (true) - RECONTRATACIÓN
    if (estatusOriginal === false && estatusActual === true) {
      this.confirmarRecontratacion(camposModificados);
      return;
    }

    // Caso 3: No hay cambio en el estatus - guardar normalmente
    this.ejecutarActualizacion(camposModificados);
  }

  private confirmarDespido(camposModificados: Partial<Empleado>): void {
    Swal.fire({
      title: '¿Despedir empleado?',
      html: `
        <p style="margin-bottom: 15px;">Estás a punto de cambiar el estatus de <strong>${this.empleadoOriginal?.Nombre} ${this.empleadoOriginal?.Apellido}</strong> a <strong>Inactivo</strong>.</p>
        <p style="margin-bottom: 10px;">Por favor, proporciona la razón del despido:</p>
        <textarea 
          id="razon-despido" 
          class="swal2-textarea" 
          placeholder="Escribe la razón del despido aquí..." 
          rows="4"
          style="width: 100%; font-size: 14px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
        ></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#773832',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, despedir',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const razon = (document.getElementById('razon-despido') as HTMLTextAreaElement)?.value;
        if (!razon || razon.trim() === '') {
          Swal.showValidationMessage('Debes proporcionar una razón del despido');
          return false;
        }
        return razon.trim();
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const fechaActual = new Date().toISOString().split('T')[0];

        // FORZAR actualización de campos de despido (aunque no estén modificados)
        camposModificados.estatus = false; // Asegurar que estatus sea 0
        camposModificados.Fecha_de_despido = fechaActual;
        camposModificados.Razon_despido = result.value;
        camposModificados.Fecha_de_recontratacion = ''; // Limpiar recontratación

        // Actualizar el formulario para mantener sincronía
        this.form.patchValue({
          Fecha_de_despido: fechaActual,
          Razon_despido: result.value,
          Fecha_de_recontratacion: ''
        }, { emitEvent: false });

        console.log('Datos de despido agregados:', {
          Fecha_de_despido: fechaActual,
          Razon_despido: result.value,
          estatus: 0
        });

        this.ejecutarActualizacion(camposModificados);
      } else {
        // Si cancela, revertir el estatus en el formulario
        this.form.patchValue({
          estatus: this.empleadoOriginal?.estatus
        }, { emitEvent: false });
      }
    });
  }

  private confirmarRecontratacion(camposModificados: Partial<Empleado>): void {
    const razonDespido = this.empleadoOriginal?.Razon_despido || 'No especificada';
    const fechaDespido = this.empleadoOriginal?.Fecha_de_despido
      ? this.empleadosService.formatFecha(this.empleadoOriginal.Fecha_de_despido)
      : 'No registrada';

    Swal.fire({
      title: '¿Recontratar empleado?',
      html: `
        <p style="margin-bottom: 15px;">Estás a punto de recontratar a <strong>${this.empleadoOriginal?.Nombre} ${this.empleadoOriginal?.Apellido}</strong>.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: left;">
          <p style="margin: 5px 0;"><strong>Fecha de despido:</strong> ${fechaDespido}</p>
          <p style="margin: 5px 0;"><strong>Razón del despido:</strong></p>
          <p style="margin: 5px 0; font-style: italic; color: #666;">${razonDespido}</p>
        </div>
        <p style="margin-bottom: 10px;">¿Confirmas la recontratación?</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, recontratar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const fechaActual = new Date().toISOString().split('T')[0];

        // FORZAR actualización de fecha de recontratación y estatus
        camposModificados.estatus = true; // Asegurar que estatus sea 1
        camposModificados.Fecha_de_recontratacion = fechaActual;

        // Actualizar el formulario para mantener sincronía
        this.form.patchValue({
          Fecha_de_recontratacion: fechaActual
        }, { emitEvent: false });

        console.log('Datos de recontratación agregados:', {
          Fecha_de_recontratacion: fechaActual,
          estatus: 1
        });

        this.ejecutarActualizacion(camposModificados);
      } else {
        // Si cancela, revertir el estatus en el formulario
        this.form.patchValue({
          estatus: this.empleadoOriginal?.estatus
        }, { emitEvent: false });
      }
    });
  }

  private ejecutarActualizacion(camposModificados: Partial<Empleado>): void {
    this.loading = true;

    // Convertir estatus a boolean si viene como string del select
    if (camposModificados.estatus !== undefined && typeof camposModificados.estatus === 'string') {
      camposModificados.estatus = camposModificados.estatus === 'true';
    }

    console.log('Enviando actualización con campos modificados:', camposModificados);

    this.empleadosService.updateEmpleado(this.id_empleado, camposModificados)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Empleado actualizado:', response);
          this.loading = false;

          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Los datos del empleado se actualizaron correctamente',
            confirmButtonColor: '#d4af37'
          }).then(() => {
            this.volver.emit();
          });
        },
        error: (error) => {
          console.error('Error actualizando empleado:', error);
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo actualizar el empleado: ${error.message}`
          });
        }
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
    if (control?.hasError('email')) {
      return 'Ingresa un correo válido';
    }
    if (control?.hasError('pattern')) {
      if (campo === 'Num_telefonico') {
        return 'El teléfono debe tener 10 dígitos';
      }
      if (campo === 'CP') {
        return 'El código postal debe tener 5 dígitos';
      }
    }
    if (control?.hasError('minLength')) {
      return `Mínimo ${control.errors?.['minLength'].requiredLength} caracteres`;
    }

    return '';
  }

  regresar(): void {
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

  getUniformeId(uniforme: Uniforme): number {
    return uniforme.__id_uniforme__ || uniforme.id_uniforme || 0;
  }

  getPuestoId(puesto: Puesto): number {
    return puesto.__id_puesto__ || puesto.id_puesto || 0;
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
          text: 'Por favor selecciona una imagen válida (JPG, PNG, etc.)'
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
   * Sube la imagen al servidor
   */
  async subirImagen(): Promise<void> {
    if (!this.imagenSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin imagen',
        text: 'Por favor selecciona una imagen primero'
      });
      return;
    }

    this.subiendoImagen = true;

    try {
      const resultado = await this.empleadosService.actualizarImagenPerfil(
        this.id_empleado,
        this.imagenSeleccionada
      ).toPromise();

      console.log('Imagen subida:', resultado);

      Swal.fire({
        icon: 'success',
        title: '¡Imagen actualizada!',
        text: 'La foto de perfil se actualizó correctamente',
        confirmButtonColor: '#d4af37'
      });

      // Actualizar la previsualización con la ruta del servidor
      if (resultado?.ruta) {
        this.previsualizacionImagen = `${this.apiUrlserve}${resultado.ruta}`;
      }

      this.imagenSeleccionada = null;

    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo subir la imagen: ${error.message || 'Error desconocido'}`
      });
    } finally {
      this.subiendoImagen = false;
    }
  }

  /**
   * Elimina la imagen seleccionada
   */
  eliminarImagenSeleccionada(): void {
    this.imagenSeleccionada = null;

    // Restaurar la imagen original si existe
    if (this.empleadoOriginal?.Ruta_imagen) {
      this.previsualizacionImagen = `${this.apiUrlserve}${this.empleadoOriginal.Ruta_imagen}`;
    } else {
      this.previsualizacionImagen = null;
    }

    // Limpiar el input file
    const inputFile = document.getElementById('imagen-perfil') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }

  /**
   * Obtiene las iniciales del empleado para el avatar por defecto
   */
  getInicialesEmpleado(): string {
    if (!this.empleadoOriginal) return '?';

    const nombre = this.empleadoOriginal.Nombre?.charAt(0) || '';
    const apellido = this.empleadoOriginal.Apellido?.charAt(0) || '';

    return (nombre + apellido).toUpperCase();
  }
}