import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth-service';
import { AuthStoreService } from '../../services/auth/auth-store';
import { Cocina } from '../../services/untils/cocina';
import { RepartidorService } from '../../services/repartidor/repartidor';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Unsolonumero } from "../../directives/register/unsolonumero";
import { Usuarioservices } from '../../services/usuario_services/usuarioservices';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, Unsolonumero],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  usuario = '';
  contrasena = '';
  recuperar_contra = false;
  correo = "";
  correo_encontrado = "";
  enviar_correo = false;
  login = true;
  cargando = false;
  no_se_logro = false;
  cambiar_password = false;

  // Contraseñas nuevas
  nueva_contrasena = '';
  confirmar_contrasena = '';

  // 👉 Aquí guardamos cada dígito del PIN
  codigo: string[] = ["", "", "", ""];

  constructor(
    private authservice: AuthService,
    private authStore: AuthStoreService,
    private router: Router,
    private cocinaService: Cocina,
    private RepartidorService: RepartidorService,
    private usuariosService: Usuarioservices
  ) { }

  onLogin(): void {
    this.authservice.login(this.usuario, this.contrasena).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);

        this.authStore.setToken(response.access_token);
        this.authStore.setToken2(response.nvl_usuario);

        if (response.nvl_usuario === 3) {
          this.cocinaService.logear_cocinero().subscribe();
        }
        else if (response.nvl_usuario === 5) {
          this.RepartidorService.loggear_repartidor().subscribe();
        }

        this.router.navigate(['']);
      },
      error: (error) => {
        console.error('Error al iniciar sesión', error);
        Swal.fire({
          title: 'Error',
          text: 'Usuario o contraseña incorrectos',
          icon: "error",
          iconColor: "#773832",
          confirmButtonColor: "#D0AF43",
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  regresar_a_login() {
    this.login = true;
    this.recuperar_contra = false;
    this.enviar_correo = false;
    this.cambiar_password = false;
    this.codigo = ["", "", "", ""];
    this.nueva_contrasena = '';
    this.confirmar_contrasena = '';
  }

  cambiar_a_recuperar() {
    if (!this.usuario.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor ingresa tu usuario primero',
        icon: "warning",
        iconColor: "#D0AF43",
        confirmButtonColor: "#D0AF43",
        confirmButtonText: 'Ok'
      });
      return;
    }

    this.login = false;
    this.recuperar_contra = true;

    this.authservice.recupear_contra(this.usuario).subscribe({
      next: (res) => {
        console.log("Respuesta del backend:", res);

        if (!res?.correo) {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró correo asociado a este usuario',
            icon: "error",
            iconColor: "#773832",
            confirmButtonColor: "#D0AF43",
            confirmButtonText: 'Ok'
          });
          this.regresar_a_login();
          return;
        }

        // Guardar correo REAL
        this.correo = res.correo;

        // Ocultar correo (el mostrado)
        let [usuario, dominio] = res.correo.split("@");
        let ultimo4 = usuario.slice(-4);
        this.correo_encontrado = "..." + ultimo4 + '@' + dominio;
      },
      error: (err) => {
        console.error("Error al recuperar contraseña:", err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo verificar el usuario',
          icon: "error",
          iconColor: "#773832",
          confirmButtonColor: "#D0AF43",
          confirmButtonText: 'Ok'
        });
        this.regresar_a_login();
      }
    });
  }

  // 1️⃣ Enviar el código al correo
  enviar_codigo_al_correo() {
    this.cargando = true;

    this.usuariosService.enviar_correo_cambio_contra_publico(this.correo)
      .subscribe({
        next: (resp) => {
          console.log("Código enviado correctamente al correo");
          this.cargando = false;
          this.no_se_logro = false;

          Swal.fire({
            title: 'Correo enviado',
            text: 'Revisa tu bandeja de entrada',
            icon: "success",
            iconColor: "#D0AF43",
            confirmButtonColor: "#D0AF43",
            confirmButtonText: 'Ok',
            timer: 3000
          });

          // Cambiamos a la pantalla de ingreso de código
          this.recuperar_contra = false;
          this.enviar_correo = true;
        },
        error: (err) => {
          this.cargando = false;
          this.no_se_logro = true;
          console.error("Error al enviar código:", err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo enviar el correo. Intenta de nuevo',
            icon: "error",
            iconColor: "#773832",
            confirmButtonColor: "#D0AF43",
            confirmButtonText: 'Ok'
          });
        }
      });
  }

  // 2️⃣ Verificar el código ingresado
  verificar_codigo() {
    const codigoFinal = this.codigo.join("");

    if (codigoFinal.length !== 4) {
      Swal.fire({
        title: 'Error',
        text: 'Debes ingresar los 4 dígitos',
        icon: "warning",
        iconColor: "#D0AF43",
        confirmButtonColor: "#D0AF43",
        confirmButtonText: 'Ok'
      });
      return;
    }

    console.log("Código a verificar:", codigoFinal);
    this.cargando = true;

    this.usuariosService.validar_codigo_cambio_contra_publico(codigoFinal, this.correo)
      .subscribe({
        next: (resp) => {
          console.log("Respuesta de validación:", resp);
          this.cargando = false;

          if (resp.valid || resp.valido) {
            Swal.fire({
              title: '¡Código correcto!',
              text: 'Ahora ingresa tu nueva contraseña',
              icon: "success",
              iconColor: "#D0AF43",
              confirmButtonColor: "#D0AF43",
              confirmButtonText: 'Ok',
              timer: 2000
            });

            // Cambiamos a la pantalla de cambiar contraseña
            this.enviar_correo = false;
            this.cambiar_password = true;
          } else {
            Swal.fire({
              title: 'Código incorrecto',
              text: 'Verifica el código e intenta de nuevo',
              icon: "error",
              iconColor: "#773832",
              confirmButtonColor: "#D0AF43",
              confirmButtonText: 'Ok'
            });
          }
        },
        error: (err) => {
          this.cargando = false;
          console.error("Error al validar código:", err);
          Swal.fire({
            title: 'Error',
            text: 'Código incorrecto o expirado',
            icon: "error",
            iconColor: "#773832",
            confirmButtonColor: "#D0AF43",
            confirmButtonText: 'Ok'
          });
        }
      });
  }

  // 3️⃣ Cambiar la contraseña
  cambiar_contrasena() {
    // Validaciones
    if (!this.nueva_contrasena || !this.confirmar_contrasena) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa ambos campos',
        icon: "warning",
        iconColor: "#D0AF43",
        confirmButtonColor: "#D0AF43",
        confirmButtonText: 'Ok'
      });
      return;
    }

    if (this.nueva_contrasena.length < 6) {
      Swal.fire({
        title: 'Error',
        text: 'La contraseña debe tener al menos 6 caracteres',
        icon: "warning",
        iconColor: "#D0AF43",
        confirmButtonColor: "#D0AF43",
        confirmButtonText: 'Ok'
      });
      return;
    }

    if (this.nueva_contrasena !== this.confirmar_contrasena) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        icon: "error",
        iconColor: "#773832",
        confirmButtonColor: "#D0AF43",
        confirmButtonText: 'Ok'
      });
      return;
    }

    this.cargando = true;
    const codigoFinal = this.codigo.join("");

    this.usuariosService.cambiar_contrasena_con_codigo(
      this.correo,
      codigoFinal,
      this.nueva_contrasena
    ).subscribe({
      next: (resp) => {
        console.log("Contraseña cambiada exitosamente:", resp);
        this.cargando = false;

        Swal.fire({
          title: '¡Contraseña actualizada!',
          text: 'Ya puedes iniciar sesión con tu nueva contraseña',
          icon: "success",
          iconColor: "#D0AF43",
          confirmButtonColor: "#D0AF43",
          confirmButtonText: 'Ir al login'
        }).then(() => {
          this.regresar_a_login();
        });
      },
      error: (err) => {
        this.cargando = false;
        console.error("Error al cambiar contraseña:", err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cambiar la contraseña. Intenta de nuevo',
          icon: "error",
          iconColor: "#773832",
          confirmButtonColor: "#D0AF43",
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  // 4️⃣ Mover entre inputs del código
  mover(event: any, index: number) {
    const valor = event.target.value;

    // Guardar el valor en el array
    this.codigo[index] = valor;

    if (valor.length === 1 && index < 3) {
      const inputs = document.querySelectorAll('.codigo') as NodeListOf<HTMLInputElement>;
      inputs[index + 1].focus();
    }
  }
}