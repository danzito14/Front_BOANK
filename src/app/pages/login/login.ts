import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth-service';
import { AuthStoreService } from '../../services/auth/auth-store';
import { Cocina } from '../../services/untils/cocina';
import { RepartidorService } from '../../services/repartidor/repartidor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  usuario = '';
  contrasena = '';

  constructor(
    private authservice: AuthService,
    private authStore: AuthStoreService, // ✅ Inyecta aquí
    private router: Router,
    private cocinaService: Cocina,
    private RepartidorService: RepartidorService
  ) { }

  onLogin(): void {
    this.authservice.login(this.usuario, this.contrasena).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);

        // ✅ Guardar token en el AuthStoreService
        this.authStore.setToken(response.access_token);
        this.authStore.setToken2(response.nvl_usuario);
        if (response.nvl_usuario === 3) {
          // Aqui vamos a llamar la funcion de activar sesion del cocinero para asignarle un platillo
          this.cocinaService.logear_cocinero().subscribe({
            next: (res) => {
              console.log('Cocinero actualizado');
            },
            error: (err) => console.error('Error al actualizar estado del platillo:', err)
          });
        } else if (response.nvl_usuario === 5) {
          // Aqui vamos a llamar la funcion de activar sesion del cocinero para asignarle un platillo
          this.RepartidorService.loggear_repartidor().subscribe({
            next: (res) => {
              console.log('Repartidor actualizado');
            },
            error: (err) => console.error('Error al actualizar estado del platillo:', err)
          });
        } else {
          console.log(response.nvl_usuario);
        }
        this.router.navigate(['']);
      },
      error: (error) => {
        console.error('Error al iniciar sesión', error);
        alert('Usuario o contraseña incorrectos');
      }
    });
  }
}
