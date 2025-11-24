import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authStore: AuthStoreService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    // 👇 Evita error en entornos SSR
    if (typeof window === 'undefined') {
      return true; // o redirige a una página segura si quieres
    }

    const nivelUsuario = localStorage.getItem('nvl_usuario');
    if (!nivelUsuario) {
      console.log(nivelUsuario);
      console.log("auxilio");
      return this.router.parseUrl('/login');
    }

    const rolesPermitidos = route.data['roles'] as string[];

    if (nivelUsuario === '2' && !rolesPermitidos.includes('2')) {
      return this.router.parseUrl('/mesero-inicio');
    }
    else if (nivelUsuario === '3' && !rolesPermitidos.includes('3')) {
      return this.router.parseUrl('/cocina');
    } else if (nivelUsuario === '4' && !rolesPermitidos.includes('4')) {
      return this.router.parseUrl('/cajero-inicio');
    } else if (nivelUsuario === '5' && !rolesPermitidos.includes('5')) {
      return this.router.parseUrl('/repartidor');
    }

    if (!rolesPermitidos.includes(nivelUsuario)) {
      return this.router.parseUrl('/temporal');
    }

    return true;
  }

}
