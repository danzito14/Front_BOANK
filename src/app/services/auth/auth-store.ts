import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';


@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      this.tokenSubject.next(token);
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return this.tokenSubject.value || localStorage.getItem('token');
  }


  getToken2(): string | null {
    if (typeof window === 'undefined') return null;
    console.log(localStorage.getItem('nvl_usuario'));
    return this.tokenSubject.value || localStorage.getItem('nvl_usuario');
  }

  setToken2(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nvl_usuario', token);
    }
    this.tokenSubject.next(token);
  }



  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    this.tokenSubject.next(token);
  }

  clearToken() {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }




  decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (e) {
      return null;
    }
  }

}
