import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { UsuarioInterface, Usuarioservices } from '../../services/usuario_services/usuarioservices';
import { CommonModule } from '@angular/common';
import { EditarInfoPersonal } from "../../components/usuario/editar-info-personal/editar-info-personal";
import Swal from 'sweetalert2';
import { first } from 'rxjs';
import { Result } from "../result/result";
import { Pedido } from "../pedido/pedido";
import { TarjetasYDireccion } from "../../components/usuario/tarjetas-y-direccion/tarjetas-y-direccion";
import { Direccion } from "../../components/direccion-pago/direccion/direccion";
import { Tarjeta } from "../../components/direccion-pago/tarjeta/tarjeta";
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-user',
  imports: [CommonModule, EditarInfoPersonal, Result, Pedido, TarjetasYDireccion, Direccion, Tarjeta],
  templateUrl: './user.html',
  styleUrl: './user.css',
  animations: [
    trigger('slideToggle', [
      state('closed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        padding: '0'
      })),
      state('open', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        padding: '*'
      })),
      transition('closed <=> open', animate('250ms ease-in-out'))
    ])
  ]
})
export class User implements OnInit {
  cargado = false;
  accion = "main";

  menuOpen = false;
  // Datos del usuario
  usuarios_data: UsuarioInterface | null = null;
  nvl_usuario = "";
  ruta_imagen: string | null = null;

  imagenSeleccionada: File | null = null;
  previsualizacion: string | null = null;


  constructor(private usuarioservices: Usuarioservices, private zone: NgZone,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargar_datos_usuario();

  } // inicia abierto

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  cerrarmenu() {
    this.menuOpen = false;
  }



  cambiar_div(accion: string) {
    this.accion = accion
  }
  cargar_datos_usuario(): void {
    this.usuarioservices.get_datos_usuario().subscribe({
      next: (data) => {
        this.usuarios_data = data;
        this.getFotoUrl(data.Ruta_imagen ?? null);
        this.cargado = true;
        this.usuarioservices.get_nvl_usuario(this.usuarios_data.id_nvl_usuario).subscribe({
          next: (descrip) => {
            this.nvl_usuario = descrip.descripcion
          }
        })
      },
      error: (err) => console.error('Error al cargar los datos', err)
    });
  }


  cambiar_contra() {
    Swal.fire({
      title: '¿Quiere cambiar la contraseña?',
      text: 'Se enviará un correo con 4 dígitos...',
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      iconColor: "#d6b45a",
    }).then(result => {

      if (!result.isConfirmed) return;

      // Mostrar loading mientras se envía el correo
      Swal.fire({
        title: 'Enviando código...',
        text: 'Por favor espera',
        icon: 'info',
        iconColor: "#d6b45a",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Enviar correo con código
      this.usuarioservices.enviar_correo_cambio_contra(this.usuarios_data?.Correo_electronico!)
        .subscribe({
          next: (resp) => {

            // Modal para ingresar el código
            Swal.fire({
              title: 'Código enviado',
              text: 'Revisa tu correo e ingresa el código de 4 dígitos',
              input: 'text',
              inputAttributes: {
                maxlength: '4',
                autocomplete: 'off'
              },
              confirmButtonText: 'Validar',
              cancelButtonColor: "#773832",
              confirmButtonColor: "#D0AF43",
              iconColor: "#d6b45a",
              showCancelButton: true,
              showLoaderOnConfirm: true,
              preConfirm: (codigo) => {
                // Validar que el código tenga 4 dígitos
                if (!codigo || codigo.length !== 4) {
                  Swal.showValidationMessage('Por favor ingresa un código de 4 dígitos');
                  return false;
                }

                return this.usuarioservices.validar_codigo_cambio_contra(codigo)
                  .pipe(first())
                  .toPromise()
                  .then(res => {
                    if (!res?.valid) {
                      throw new Error('Código inválido');
                    }
                    return true;
                  })
                  .catch(() => {
                    Swal.showValidationMessage("Código incorrecto o expirado");
                    return false;
                  });
              },
              allowOutsideClick: () => !Swal.isLoading()
            }).then(validacion => {

              if (!validacion.isConfirmed) return;

              // Modal para ingresar nueva contraseña
              Swal.fire({
                title: 'Nueva contraseña',
                html: `
                <input type="password" id="password1" class="swal2-input" placeholder="Nueva contraseña">
                <input type="password" id="password2" class="swal2-input" placeholder="Confirmar contraseña">
              `,
                confirmButtonText: 'Actualizar',
                showCancelButton: true,
                cancelButtonColor: "#773832",
                confirmButtonColor: "#D0AF43",
                iconColor: "#d6b45a",
                focusConfirm: false,
                showLoaderOnConfirm: true,
                preConfirm: () => {
                  const password1 = (document.getElementById('password1') as HTMLInputElement).value;
                  const password2 = (document.getElementById('password2') as HTMLInputElement).value;

                  if (!password1 || !password2) {
                    Swal.showValidationMessage('Por favor completa ambos campos');
                    return false;
                  }

                  if (password1 !== password2) {
                    Swal.showValidationMessage('Las contraseñas no coinciden');
                    return false;
                  }

                  if (password1.length < 6) {
                    Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
                    return false;
                  }

                  // Retornar una promesa para actualizar la contraseña
                  const body: UsuarioInterface = {
                    Contraseña: password1
                  };

                  return this.usuarioservices.update_usuario_by_id(body)
                    .pipe(first())
                    .toPromise()
                    .then(resp => {
                      if (!resp) {
                        throw new Error('No se pudo actualizar');
                      }
                      return password1;
                    })
                    .catch(() => {
                      Swal.showValidationMessage('Error al actualizar la contraseña');
                      return false;
                    });
                },
                allowOutsideClick: () => !Swal.isLoading()
              }).then(pass => {

                if (pass.isConfirmed && pass.value) {
                  Swal.fire({
                    title: 'Contraseña actualizada',
                    text: 'Tu contraseña ha sido cambiada exitosamente',
                    icon: 'success',
                    iconColor: "#d6b45a",
                    confirmButtonColor: "#D0AF43",
                  });
                }

              });

            });

          },
          error: () => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo enviar el código de verificación',
              icon: 'error',
              iconColor: "#773832",
              confirmButtonColor: "#D0AF43",
            });
          }
        });

    });
  }


  getFotoUrl(ruta_imagen: string | null | undefined): void {
    if (!ruta_imagen) {
      // Si no hay ruta definida, usar imagen por defecto
      this.previsualizacion = '/profiles/maquin_de_apoyo.jpeg';
      return;
    }

    const url = this.usuarioservices.getFotoPerfil(
      ruta_imagen
    );
    console.log(this.ruta_imagen);
    // Intentar cargar la imagen
    const img = new Image();
    img.src = url;

    // Si se carga correctamente, usarla
    img.onload = () => {
      this.previsualizacion = url;
      console.log(url);
    };

    // Si ocurre error, usar imagen predeterminada
    img.onerror = () => {
      this.previsualizacion = '/profiles/maquin_de_apoyo.jpeg';
    };
  }




  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Error',
          text: 'Por favor selecciona una imagen válida',
          icon: 'error',
          iconColor: "#773832",
          confirmButtonColor: "#D0AF43"
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error',
          text: 'La imagen no debe superar los 5MB',
          icon: 'error',
          iconColor: "#773832",
          confirmButtonColor: "#D0AF43"
        });
        return;
      }

      this.imagenSeleccionada = file;

      // Crear previsualización
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previsualizacion = e.target?.result as string;
        this.mostrarVistaPrevia();
      };
      reader.readAsDataURL(file);
    }
  }

  mostrarVistaPrevia(): void {
    Swal.fire({
      title: '¿Actualizar foto de perfil?',
      html: `
        <div style="margin: 20px 0;">
          <img src="${this.previsualizacion}" 
               style="max-width: 100%; max-height: 300px; border-radius: 10px; object-fit: cover;" 
               alt="Vista previa">
        </div>
      `,
      icon: 'question',
      iconColor: "#d6b45a",
      showCancelButton: true,
      confirmButtonColor: "#D0AF43",
      cancelButtonColor: "#773832",
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: () => {
        return this.guardarImagen();
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({
          title: 'Imagen actualizada',
          text: 'Tu foto de perfil ha sido actualizada exitosamente',
          icon: 'success',
          iconColor: "#d6b45a",
          confirmButtonColor: "#D0AF43"
        });
      }
    });
  }

  async guardarImagen(): Promise<boolean> {
    if (!this.imagenSeleccionada) return false;

    try {
      // Subir imagen al backend
      const uploadResponse: any = await this.usuarioservices
        .subirImagenPerfil(this.imagenSeleccionada)
        .toPromise();

      if (!uploadResponse || !uploadResponse.ruta) {
        throw new Error('No se pudo subir la imagen');
      }

      const rutaImagen = uploadResponse.ruta; // Ej: "public/profiles/123_20250101.png"

      // Actualizar solo la ruta en la BD
      const body: UsuarioInterface = {
        Ruta_imagen: rutaImagen
      };

      const updateResponse = await this.usuarioservices
        .update_usuario_by_id(body)
        .toPromise();

      if (!updateResponse) {
        throw new Error('No se pudo actualizar el perfil');
      }

      // Actualizar la vista local
      this.usuarios_data!.Ruta_imagen = rutaImagen;

      return true;

    } catch (error) {
      console.error('Error al guardar imagen:', error);
      Swal.showValidationMessage('Error al guardar la imagen');
      return false;
    }
  }



  onImageError(event: any): void {
    if (!event.target.dataset.errorHandled) {
      event.target.dataset.errorHandled = "true";
      event.target.src = '/profiles/maquin_de_apoyo.jpeg';
    }
  }


}
