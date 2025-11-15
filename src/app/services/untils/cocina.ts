import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { ListaPlatoPendienteInterface } from './obtener-listas';

@Injectable({
  providedIn: 'root',
})
export class Cocina {

  private apiUrlCocina = 'http://localhost:8000/cocineros';

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
    if (!headers) return of([]);

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
    if (!headers) return of([]);

    const body = { 'id_detalle': id_detalle };

    return this.http.put<any>(
      `${this.apiUrlCocina}/update_cocinero_plato`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del cocinero:', err);
        return of(null);
      })
    );
  }


  limpiar_cocina() {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    const body = { 'id_detalle': null };

    return this.http.put<any>(
      `${this.apiUrlCocina}/update_cocinero_plato`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del cocinero:', err);
        return of(null);
      })
    );
  }


  check_cocina_platillo(): Observable<ListaPlatoPendienteInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<ListaPlatoPendienteInterface[]>(
      `${this.apiUrlCocina}/tiene_plato`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los platillos pendientes:', err);
        return of([]);
      })
    );
  }



}
