import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { EmpleadosService, Empleado, Puesto, Uniforme } from '../../../../services/administrador/empleados';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Telefononumeros } from "../../../../directives/inputs_usuario/telefononumeros";
import { CorreoDirective } from "../../../../directives/inputs_usuario/correousuario";

@Component({

  selector: 'app-agregar-empleado',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Telefononumeros, CorreoDirective],
  templateUrl: './agregar-empleado.html',
  styleUrl: './agregar-empleado.css',
})
export class AgregarEmpleado implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading: boolean = false;

  puestos: Puesto[] = [];
  uniformes: Uniforme[] = [];
  uniformesFiltrados: Uniforme[] = [];

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;

  estados: string[] = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
    'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  @Output() volver = new EventEmitter<void>();

  constructor(
    private empleadosService: EmpleadosService,
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
      estatus: [true, Validators.required]
    });

    // Observar cambios en puesto para filtrar uniformes
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

  onPuestoChange(idPuesto: number | null): void {
    if (!idPuesto) {
      this.uniformesFiltrados = [];
      this.form.patchValue({ id_uniforme: null });
      return;
    }

    // Mostrar TODOS los uniformes para el puesto seleccionado
    this.uniformesFiltrados = this.uniformes.filter(
      uniforme => uniforme.id_puesto === idPuesto
    );

    // Limpiar selección de uniforme si no es válido para el nuevo puesto
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

  /**
   * Crea un nuevo empleado
   */
  create_usuario(): void {
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

    const nuevoEmpleado: Partial<Empleado> = this.form.getRawValue();

    // Mostrar confirmación
    Swal.fire({
      title: '¿Crear nuevo empleado?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Nombre:</strong> ${nuevoEmpleado.Nombre} ${nuevoEmpleado.Apellido}</p>
          <p><strong>Correo:</strong> ${nuevoEmpleado.Correo_electronico}</p>
          <p><strong>Teléfono:</strong> ${nuevoEmpleado.Num_telefonico}</p>
          <p><strong>Puesto:</strong> ${this.getNombrePuesto(nuevoEmpleado.id_puesto!)}</p>
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
        this.guardarEmpleado(nuevoEmpleado);
      }
    });
  }

  /**
   * Guarda el empleado en la base de datos
   */
  private guardarEmpleado(empleado: Partial<Empleado>): void {
    this.loading = true;

    this.empleadosService.createEmpleado(empleado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Empleado creado exitosamente:', response);
          Swal.fire({
            title: 'Cuenta',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p><strong>Nombre:</strong> ${response.nombre}</p>
                <p><strong>Usuario:</strong> ${response.usuario}</p>
                <p><strong>Contraseña:</strong> ${response.contraseña}</p>
              </div>
            `,

            confirmButtonColor: '#d4af37',
            confirmButtonText: 'Ok'
          }).then(() => {
            this.loading = false;
            this.form.reset({ estatus: true });
            this.imagenSeleccionada = null;
            this.previsualizacionImagen = null;
            this.volver.emit();
          });
          // // Si hay imagen seleccionada, subirla
          // if (this.imagenSeleccionada && response.id_empleado) {
          //   this.subirImagenEmpleado(response.id_empleado, empleado);
          // } else {
          // this.mostrarExitoYSalir(empleado);
          // }
        },
        error: (error) => {
          console.error('Error al crear empleado:');
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error al crear empleado',
            text: error.message || 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  /**
   * Sube la imagen del empleado después de crearlo
   */
  private subirImagenEmpleado(idEmpleado: string, empleado: Partial<Empleado>): void {
    if (!this.imagenSeleccionada) {
      this.mostrarExitoYSalir(empleado);
      return;
    }

    this.empleadosService.actualizarImagenPerfil(idEmpleado, this.imagenSeleccionada)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          console.log('Imagen subida exitosamente:', resultado);
          this.mostrarExitoYSalir(empleado);
        },
        error: (error) => {
          console.error('Error al subir imagen:', error);
          // Aunque falle la imagen, el empleado ya fue creado
          Swal.fire({
            icon: 'warning',
            title: 'Empleado creado',
            text: `${empleado.Nombre} ${empleado.Apellido} fue creado exitosamente, pero no se pudo subir la imagen.`,
            confirmButtonColor: '#d4af37'
          }).then(() => {
            this.form.reset({ estatus: true });
            this.imagenSeleccionada = null;
            this.previsualizacionImagen = null;
            this.loading = false;
            this.volver.emit();
          });
        }
      });
  }

  /**
   * Muestra mensaje de éxito y sale del formulario
   */
  private mostrarExitoYSalir(empleado: Partial<Empleado>): void {
    this.loading = false;

    Swal.fire({
      icon: 'success',
      title: '¡Empleado creado!',
      text: `${empleado.Nombre} ${empleado.Apellido} ha sido agregado exitosamente`,
      confirmButtonColor: '#d4af37'
    }).then(() => {
      this.form.reset({ estatus: true });
      this.imagenSeleccionada = null;
      this.previsualizacionImagen = null;
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
   * Obtiene las iniciales del empleado para el placeholder
   */
  getInicialesEmpleado(): string {
    const nombre = this.form.get('Nombre')?.value?.charAt(0) || '';
    const apellido = this.form.get('Apellido')?.value?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || '?';
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
    const inputFile = document.getElementById('imagen-perfil') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }
}
