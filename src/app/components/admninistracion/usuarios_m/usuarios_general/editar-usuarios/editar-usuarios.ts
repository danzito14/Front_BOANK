import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { UsuariosService, Usuario, NivelUsuario } from '../../../../../services/administrador/usuarios';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Telefononumeros } from "../../../../../directives/inputs_usuario/telefononumeros";
import { CorreoDirective } from "../../../../../directives/inputs_usuario/correousuario";

@Component({
  selector: 'app-editar-usuario',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Telefononumeros, CorreoDirective],
  templateUrl: './editar-usuarios.html',
  styleUrl: './editar-usuarios.css',
})
export class EditarUsuario implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() id_usuario!: string;
  @Output() volver = new EventEmitter<void>();

  form!: FormGroup;
  loading: boolean = false;
  loadingData: boolean = true;

  nivelesUsuario: NivelUsuario[] = [];
  usuarioOriginal: Usuario | null = null;

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;
  imagenActual: string | null = null;

  // Control de cambio de contraseña
  cambiarPassword: boolean = false;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarNivelesUsuario();
    this.cargarDatosUsuario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      Nickname: ['', [Validators.required, Validators.minLength(3)]],
      Contraseña: [''],
      Nombre: ['', [Validators.required, Validators.minLength(2)]],
      Apellido: [''],
      Correo_electronico: ['', [Validators.required, Validators.email]],
      Num_telefonico: ['', Validators.required],
      id_nvl_usuario: [null, Validators.required],
      estatus: [true, Validators.required]
    });
  }

  cargarNivelesUsuario(): void {
    this.usuariosService.getAllNivelesUsuario()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (niveles) => {
          // Filtrar niveles 7 (Genérico) y 8 (Temporal)
          this.nivelesUsuario = niveles.filter(
            nivel => nivel.id_nvl_usuario !== 7 && nivel.id_nvl_usuario !== 8
          );
        },
        error: (error) => {
          console.error('Error cargando niveles de usuario:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los niveles de usuario'
          });
        }
      });
  }

  cargarDatosUsuario(): void {
    if (!this.id_usuario) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se proporcionó un ID de usuario válido',
        confirmButtonColor: '#773832'
      }).then(() => {
        this.volver.emit();
      });
      return;
    }

    this.loadingData = true;

    this.usuariosService.getUsuarioByIdADIM(this.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.usuarioOriginal = usuario;
          this.cargarDatosEnFormulario(usuario);
          this.loadingData = false;
        },
        error: (error) => {
          console.error('Error cargando usuario:', error);
          this.loadingData = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del usuario: ' + error.message,
            confirmButtonColor: '#773832'
          }).then(() => {
            this.volver.emit();
          });
        }
      });
  }

  cargarDatosEnFormulario(usuario: Usuario): void {
    this.form.patchValue({
      Nickname: usuario.Nickname,
      Nombre: usuario.Nombre,
      Apellido: usuario.Apellido,
      Correo_electronico: usuario.Correo_electronico,
      Num_telefonico: usuario.Num_telefonico,
      id_nvl_usuario: usuario.id_nvl_usuario,
      estatus: usuario.estatus
    });

    // Cargar imagen actual si existe
    if (usuario.Ruta_imagen) {
      this.imagenActual = usuario.Ruta_imagen;
      this.previsualizacionImagen = `${this.usuariosService['API_BASE']}${usuario.Ruta_imagen}`;
    }

    // Marcar formulario como pristine después de cargar datos
    this.form.markAsPristine();
  }

  getNombreNivel(idNivel: number): string {
    const nivel = this.nivelesUsuario.find(n => n.id_nvl_usuario === idNivel);
    return nivel?.descripcion || 'Nivel no encontrado';
  }

  toggleCambiarPassword(): void {
    this.cambiarPassword = !this.cambiarPassword;

    if (this.cambiarPassword) {
      this.form.get('Contraseña')?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      this.form.get('Contraseña')?.clearValidators();
      this.form.get('Contraseña')?.setValue('');
    }

    this.form.get('Contraseña')?.updateValueAndValidity();
  }

  /**
   * Actualiza el usuario
   */
  actualizarUsuario(): void {
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

    const datosActualizados: Partial<Usuario> = this.form.getRawValue();

    // Si no se cambió la contraseña, no enviarla
    if (!this.cambiarPassword || !datosActualizados.Contraseña) {
      delete datosActualizados.Contraseña;
    }

    // Mostrar confirmación
    Swal.fire({
      title: '¿Actualizar usuario?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Usuario:</strong> ${datosActualizados.Nickname}</p>
          <p><strong>Nombre:</strong> ${datosActualizados.Nombre} ${datosActualizados.Apellido || ''}</p>
          <p><strong>Correo:</strong> ${datosActualizados.Correo_electronico}</p>
          <p><strong>Nivel:</strong> ${this.getNombreNivel(datosActualizados.id_nvl_usuario!)}</p>
          ${this.cambiarPassword ? '<p style="color: #d4af37;"><strong>⚠ Se cambiará la contraseña</strong></p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarCambios(datosActualizados);
      }
    });
  }

  /**
   * Guarda los cambios en la base de datos
   */
  private guardarCambios(usuario: Partial<Usuario>): void {
    this.loading = true;

    this.usuariosService.updateUsuarioADMIN(this.id_usuario, usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Usuario actualizado exitosamente');

          // Si hay imagen seleccionada, subirla
          if (this.imagenSeleccionada) {
            this.subirImagenUsuario(usuario);
          } else {
            this.mostrarExitoYSalir(usuario);
          }
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar',
            text: error.message || 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  /**
   * Sube la imagen del usuario
   */
  private subirImagenUsuario(usuario: Partial<Usuario>): void {
    if (!this.imagenSeleccionada) {
      this.mostrarExitoYSalir(usuario);
      return;
    }

    this.usuariosService.actualizarImagenPerfil(this.id_usuario, this.imagenSeleccionada)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          console.log('Imagen actualizada exitosamente:', resultado);
          this.mostrarExitoYSalir(usuario);
        },
        error: (error) => {
          console.error('Error al subir imagen:', error);
          Swal.fire({
            icon: 'warning',
            title: 'Usuario actualizado',
            text: `Los datos fueron actualizados, pero no se pudo subir la imagen.`,
            confirmButtonColor: '#d4af37'
          }).then(() => {
            this.loading = false;
            this.volver.emit();
          });
        }
      });
  }

  /**
   * Muestra mensaje de éxito y sale del formulario
   */
  private mostrarExitoYSalir(usuario: Partial<Usuario>): void {
    this.loading = false;

    Swal.fire({
      icon: 'success',
      title: '¡Usuario actualizado!',
      text: `El usuario ${usuario.Nickname} ha sido actualizado exitosamente`,
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
    if (control?.hasError('email')) {
      return 'Ingresa un correo válido';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    return '';
  }

  regresar(): void {
    if (this.form.dirty || this.imagenSeleccionada) {
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

  /**
   * Obtiene las iniciales del usuario para el placeholder
   */
  getInicialesUsuario(): string {
    const nombre = this.form.get('Nombre')?.value?.charAt(0) || '';
    const apellido = this.form.get('Apellido')?.value?.charAt(0) || '';
    const nickname = this.form.get('Nickname')?.value?.charAt(0) || '';

    if (nombre && apellido) {
      return (nombre + apellido).toUpperCase();
    } else if (nombre) {
      return nombre.toUpperCase();
    } else if (nickname) {
      return nickname.toUpperCase();
    }
    return '?';
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

    // Restaurar imagen actual si existe
    if (this.imagenActual) {
      this.previsualizacionImagen = this.imagenActual;
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
   * Verifica si hay cambios en el formulario
   */
  hayCambios(): boolean {
    return this.form.dirty || this.imagenSeleccionada !== null;
  }
}