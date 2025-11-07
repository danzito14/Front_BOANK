import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router'; // <-- ajusta el path según tu proyecto
import { Observable } from 'rxjs';
import { AuthStoreService } from '../services/auth/auth-store';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authStore: AuthStoreService, private router: Router) { }

  canActivate(): boolean | UrlTree {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        return true;
      } else {
        console.log("yo te estoy enviando para aca");
        return this.router.parseUrl('/login'); // redirige al login
      }
    }

    return true; // durante SSR dejamos pasar
  }

}
