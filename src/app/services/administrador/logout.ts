import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Logout {

  private apiUrlserve = environment.apiUrl; // tu backend

  constructor(private http: HttpClient) { }

  // Genera headers con token
  private getHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 🔹 Logout Mesero
  logout_mesero(): Observable<boolean> {
    const headers = this.getHeaders();
    if (!headers) return of(false);

    return this.http.get<boolean>(
      `${this.apiUrlserve}/untils_empleados/logout_mesero`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error en logout_mesero:', err);
        return of(false);
      })
    );
  }

  // 🔹 Logout Cocinero (corregido: antes llamaba al endpoint incorrecto)
  logout_cocinero(): Observable<boolean> {
    const headers = this.getHeaders();
    if (!headers) return of(false);

    return this.http.get<boolean>(
      `${this.apiUrlserve}/untils_empleados/logout_cocinero`, // CORREGIDO
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error en logout_cocinero:', err);
        return of(false);
      })
    );
  }

  // 🔹 Logout Repartidor
  logout_repartidor(): Observable<boolean> {
    const headers = this.getHeaders();
    if (!headers) return of(false);

    return this.http.get<boolean>(
      `${this.apiUrlserve}/untils_empleados/logout_repartidor`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error en logout_repartidor:', err);
        return of(false);
      })
    );
  }

  // 🔹 Lógica para determinar qué logout ejecutar
  cerrar_sesion(nvl_usuario: string | null): Observable<boolean> {
    if (!nvl_usuario) return of(false);

    switch (nvl_usuario) {
      case '2': return this.logout_mesero();
      case '3': return this.logout_cocinero();
      case '4': return this.logout_mesero();
      case '5': return this.logout_repartidor();
      default: return of(false);
    }
  }

}
