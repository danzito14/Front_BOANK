import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface RepartidorInfo {
  id_repartidor: string;
  id_usuario: string;
  nombre_completo: string;
  telefono: string;
  activo: boolean;
  en_ruta: boolean;
  pedidos_asignados: number;
  estado: 'En local' | 'Repartiendo';
  pedidos_actuales: PedidoRepartidor[];
  id_pedido: string;
}

export interface PedidoRepartidor {
  id_pedido: string;
  estado: string;
  total: number;
  cliente: string;
  direccion: string;
  ciudad: string;
  municipio: string;
}

export interface AsignacionResponse {
  success: boolean;
  id_pedido: string;
  id_repartidor: string;
  razon_asignacion: string;
  prioridad: string;
  eficiencia: string;
  detalles_pedido: any;
}

@Injectable({
  providedIn: 'root'
})
export class RepartidorService {
  private apiUrlserve = environment.apiUrl;

  private apiUrl = this.apiUrlserve; // Ajusta tu URL base

  constructor(private http: HttpClient) { }


  /**
   * Actualizar info  y logearlo del repartidor
   */
  loggear_repartidor() {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    const body = { 'activo': true };
    return this.http.put<any>(
      `${this.apiUrl}/repartidores/update_repartidor`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del cocinero:', err);
        return of(null);
      })
    );
  }


  //Asignar pedido a repartidor para conservar en recarga de pagina o si por alguna razon se recarga o tiene que cargar y no perder el dato
  asignar_pedido_repartidor(id_pedido: string) {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    const body = { 'id_pedido': id_pedido };
    return this.http.put<any>(
      `${this.apiUrl}/repartidores/update_repartidor`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del cocinero:', err);
        return of(null);
      })
    );
  }

  // Limpiar pedido repartiendo para asignarle uno nuevo o porque ya no le quedaron pedidos
  limpiar_repartidor() {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    const body = { 'id_pedido': null };
    return this.http.put<any>(
      `${this.apiUrl}/repartidores/update_repartidor`,
      body,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el estado del cocinero:', err);
        return of(null);
      })
    );
  }

  /**
   * Obtiene información del repartidor actual
   */
  obtenerInfoRepartidor(): Observable<RepartidorInfo> {
    return this.http.get<RepartidorInfo>(
      `${this.apiUrl}/repartidores/info`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene todos los repartidores disponibles (para admin/cajero)
   */
  obtenerRepartidoresDisponibles(): Observable<RepartidorInfo[]> {
    return this.http.get<RepartidorInfo[]>(
      `${this.apiUrl}/repartidores/disponibles`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Asigna un pedido usando IA (manual)
   */
  asignarPedidoConIA(idPedido: string): Observable<AsignacionResponse> {
    return this.http.post<AsignacionResponse>(
      `${this.apiUrl}/repartidores/asignar-pedido`,
      { id_pedido: idPedido },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Marca un pedido como entregado
   */
  marcarEntregado(idPedido: string, idRepartidor: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/repartidores/marcar-entregado`,
      {
        id_pedido: idPedido,
        id_repartidor: idRepartidor
      },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene los pedidos de un repartidor específico
   */
  obtenerPedidosRepartidor(idRepartidor: string): Observable<PedidoRepartidor[]> {
    return this.http.get<PedidoRepartidor[]>(
      `${this.apiUrl}/repartidores/${idRepartidor}/pedidos`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Headers con autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtiene el token del localStorage
   */
  private getToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  }
}

