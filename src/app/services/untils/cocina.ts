import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

// 🔥 Interfaz para la respuesta de asignar_plato
interface AsignarPlatoResponse {
  id_detalle: string;
}

@Injectable({
  providedIn: 'root',
})
export class Cocina {
  private apiUrlserve = environment.apiUrl;

  private apiUrlCocina = `${this.apiUrlserve}/cocineros`;

  constructor(private http: HttpClient) { }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(): HttpHeaders | null {
    const token = this.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : null;
  }

  logear_cocinero() {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    const body = { 'estatus': true };
    return this.http.put<any>(
      `${this.apiUrlCocina}/update_cocinero`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del cocinero:', err);
        return of(null);
      })
    );
  }

  update_cocina(id_detalle: string) {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    const body = { 'id_detalle': id_detalle };
    return this.http.put<any>(
      `${this.apiUrlCocina}/update_cocinero_plato`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el platillo del cocinero:', err);
        return of(null);
      })
    );
  }

  limpiar_cocina() {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    const body = { 'id_detalle': null };
    return this.http.put<any>(
      `${this.apiUrlCocina}/update_cocinero_plato`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al limpiar cocina:', err);
        return of(null);
      })
    );
  }

  check_cocina_platillo(): Observable<any[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<any[]>(
      `${this.apiUrlCocina}/tiene_plato`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al verificar platillo actual:', err);
        return of([]);
      })
    );
  }

  // 🔥 CORREGIDO: Devuelve la respuesta correcta del backend
  asignar_plato(): Observable<AsignarPlatoResponse> {
    const headers = this.getHeaders();
    if (!headers) return of({ id_detalle: '' });

    return this.http.get<AsignarPlatoResponse>(
      `${this.apiUrlCocina}/asignar_plato`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al asignar platillo:', err);
        return of({ id_detalle: '' });
      })
    );
  }
}