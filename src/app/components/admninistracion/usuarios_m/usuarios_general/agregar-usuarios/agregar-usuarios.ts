import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
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
  selector: 'app-agregar-usuario',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Telefononumeros, CorreoDirective],
  templateUrl: './agregar-usuarios.html',
  styleUrl: './agregar-usuarios.css',
})
export class AgregarUsuario implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading: boolean = false;

  nivelesUsuario: NivelUsuario[] = [];

  // Variables para la imagen
  imagenSeleccionada: File | null = null;
  previsualizacionImagen: string | null = null;

  @Output() volver = new EventEmitter<void>();

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarNivelesUsuario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      Nickname: ['', [Validators.required, Validators.minLength(3)]],
      Contraseña: ['', [Validators.required, Validators.minLength(6)]],
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

  getNombreNivel(idNivel: number): string {
    const nivel = this.nivelesUsuario.find(n => n.id_nvl_usuario === idNivel);
    return nivel?.descripcion || 'Nivel no encontrado';
  }

  /**
   * Crea un nuevo usuario
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

    const nuevoUsuario: Partial<Usuario> = this.form.getRawValue();

    // Mostrar confirmación
    Swal.fire({
      title: '¿Crear nuevo usuario?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Usuario:</strong> ${nuevoUsuario.Nickname}</p>
          <p><strong>Nombre:</strong> ${nuevoUsuario.Nombre} ${nuevoUsuario.Apellido || ''}</p>
          <p><strong>Correo:</strong> ${nuevoUsuario.Correo_electronico}</p>
          <p><strong>Nivel:</strong> ${this.getNombreNivel(nuevoUsuario.id_nvl_usuario!)}</p>
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
        this.guardarUsuario(nuevoUsuario);
      }
    });
  }

  /**
   * Guarda el usuario en la base de datos
   */
  private guardarUsuario(usuario: Partial<Usuario>): void {
    this.loading = true;

    this.usuariosService.createUsuario(usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Usuario creado exitosamente:', response);

          // Si hay imagen seleccionada, subirla
          if (this.imagenSeleccionada && response.id_usuario) {
            this.subirImagenUsuario(response.id_usuario, usuario);
          } else {
            this.mostrarExitoYSalir(usuario);
          }
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.loading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: error.message || 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
            confirmButtonColor: '#773832'
          });
        }
      });
  }

  /**
   * Sube la imagen del usuario después de crearlo
   */
  private subirImagenUsuario(idUsuario: string, usuario: Partial<Usuario>): void {
    if (!this.imagenSeleccionada) {
      this.mostrarExitoYSalir(usuario);
      return;
    }

    this.usuariosService.actualizarImagenPerfil(idUsuario, this.imagenSeleccionada)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          console.log('Imagen subida exitosamente:', resultado);
          this.mostrarExitoYSalir(usuario);
        },
        error: (error) => {
          console.error('Error al subir imagen:', error);
          // Aunque falle la imagen, el usuario ya fue creado
          Swal.fire({
            icon: 'warning',
            title: 'Usuario creado',
            text: `${usuario.Nickname} fue creado exitosamente, pero no se pudo subir la imagen.`,
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
  private mostrarExitoYSalir(usuario: Partial<Usuario>): void {
    this.loading = false;

    Swal.fire({
      icon: 'success',
      title: '¡Usuario creado!',
      text: `El usuario ${usuario.Nickname} ha sido agregado exitosamente`,
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
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
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
    this.previsualizacionImagen = null;

    // Limpiar el input file
    const inputFile = document.getElementById('imagen-perfil') as HTMLInputElement;
    if (inputFile) {
      inputFile.value = '';
    }
  }
}