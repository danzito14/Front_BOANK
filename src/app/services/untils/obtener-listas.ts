
/**
 *  Este service tiene como objetivo obtener solamente las listas
 * que se van a usar ya sea para mostrar la cola de platillos pendientes a cocinar
 * como los platos que ya estan listos para servir para los meseros
 * esas y cualquier otra lista que se me ocurra y por estar aqui posible tambien ponga la de cambiar estados
 * aprovechando que tengo las mismas rutas tanto para la listas como para los update de estado
 *  */

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environments';


export interface ListaPlatoPendienteInterface {
  id_detalle: string;
  id_pedido: string;
  id_platillo: string;
  Nombre_platillo: string;
  Ruta_imagen: string;
  estado: string;
  detalles_adicionales: string;
  Tipo_pedido: string;
  id_mesa: string
  Nombre_mesa: string;

}

@Injectable({
  providedIn: 'root',
})
export class ObtenerListas {
  private apiUrlserve = environment.apiUrl;

  // apiUrlListas = 'http://localhost:8000/pedido_gets'
  apiUrlListas = `${this.apiUrlserve}/pedido_gets`;

  constructor(private http: HttpClient) { }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  private getHeaders(): HttpHeaders | null {
    const token = this.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : null;
  }

  get_lista_platillos_pendientes(): Observable<ListaPlatoPendienteInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<ListaPlatoPendienteInterface[]>(
      `${this.apiUrlListas}/lista_pendiente`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los platillos pendientes:', err);
        return of([]);
      })
    );
  }



  get_lista_platillos_listos(): Observable<ListaPlatoPendienteInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<ListaPlatoPendienteInterface[]>(
      `${this.apiUrlListas}/lista_listo`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los platillos pendientes:', err);
        return of([]);
      })
    );
  }

  get_lista_platillos_by_id(id_detalle: string): Observable<ListaPlatoPendienteInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<ListaPlatoPendienteInterface[]>(
      `${this.apiUrlListas}/get_lista_platillo_by_id?id_detalle=${id_detalle}`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los platillos pendientes:', err);
        return of([]);
      })
    );
  }



  update_estado_platillo(id_detalle: string, estado: string): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.put<any>(
      `${this.apiUrlListas}/actualizar_estado_platillo?id_detalle=${id_detalle}&estado=${estado}`,
      {}, // cuerpo vacío porque solo mandas parámetros por query
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del platillo:', err);
        return of(null);
      })
    );
  }



}

