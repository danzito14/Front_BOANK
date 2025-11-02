import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';

import { jwtDecode } from 'jwt-decode';
import { AuthStoreService } from '../services/auth/auth-store';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authStore: AuthStoreService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nvl_usuario');
      if (token) {
        const rolesPermitidos = route.data['roles'] as Array<string>;
        console.log(token);
        console.log(rolesPermitidos);
        if (!rolesPermitidos.includes(token)) {
          // 🚫 No tiene permiso → redirige a acceso denegado o dashboard
          return this.router.createUrlTree(['/temporal']);
        }
        return true;
      } else {
        return this.router.parseUrl('/login'); // redirige al login
      }
    }


    return true;
  }
}
