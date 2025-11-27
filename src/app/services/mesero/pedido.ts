import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { AuthStoreService } from '../auth/auth-store';
import { environment } from '../../../environments/environment';

export interface MesasInterface {
  id_mesa: string;
  Nombre_mesa: string;
  Capacidad: number;
  Estado: string;
  estatus_bool: boolean;
  id_pedido?: string;
}

export interface NombreEmpleadoInterface {
  id_usuario: string;
  id_empleado: string;
  id_puesto: number;
  Nombre_puesto: string;
  Nombre_empleado: string;
}

export interface PedidoMesaInterface {
  mesa: string;
  id_mesa: string;
  id_pedido: string;
  estado_pedido: string;
  platillos: platillos_detalle[];
}

export interface platillos_detalle {
  id_detalle: string;
  nombre_platillo: string;
  estado_detalle: string;
  detalles_adicionales: string;
}


export interface PedidoEntregaInterface {
  id_pedido: string;
  fecha: string; // formato ISO (ej. "2025-11-07T17:15:00")
  estado_pedido: string;
  tipo_pedido: string; // 'Entrega' o 'Local'
  id_usuario: string;
  forma_pago: string;
  nombre_completo: string;
  total: number;
  id_direccion: string;
  direccion_completa: string;
  platillos: platillos_detalle[];
}




@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private apiUrlserve = environment.apiUrl;


  private apiUrlMesas = `${this.apiUrlserve}/mesas`;
  private apiUrlUntilsEmpleados = `${this.apiUrlserve}/untils_empleados`;
  private apiUrlPedidogets = `${this.apiUrlserve}/pedido_gets`;

  private apiUrlPagar = `${this.apiUrlserve}/pagar`;

  constructor(private http: HttpClient, private authStore: AuthStoreService) {

  }
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  private getHeaders(): HttpHeaders | null {
    const token = this.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : null;
  }


  get_all_mesas(): Observable<MesasInterface[]> {
    return this.http.get<MesasInterface[]>(
      `${this.apiUrlMesas}/get_all_mesas`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener todas las direcciones:', err);
        return of([]);
      })
    );
  }

  get_all_mesas_ocupadas(): Observable<MesasInterface[]> {
    return this.http.get<MesasInterface[]>(
      `${this.apiUrlMesas}/get_all_mesas_ocupadas`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener todas las direcciones:', err);
        return of([]);
      })
    );
  }

  get_nombre_empleado(): Observable<NombreEmpleadoInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);
    return this.http.get<NombreEmpleadoInterface[]>(
      `${this.apiUrlUntilsEmpleados}/get_nombre_empleado`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener el nombre del empleado:', err);
        return of([]);
      })
    );
  }

  get_pedidos_mesa(): Observable<PedidoMesaInterface[]> {
    return this.http.get<PedidoMesaInterface[]>(
      `${this.apiUrlPedidogets}/gets_pedidos`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los pedidos:', err);
        return of([]);
      })
    )
  }

  get_pedidos_mesa_absolute(): Observable<PedidoEntregaInterface[]> {
    return this.http.get<PedidoEntregaInterface[]>(
      `${this.apiUrlPedidogets}/gets_pedidos_absolute`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los pedidos:', err);
        return of([]);
      })
    )
  }

  gets_pedidos_usuario(): Observable<PedidoEntregaInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<PedidoEntregaInterface[]>(
      `${this.apiUrlPedidogets}/gets_pedido_usuario`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los pedidos:', err);
        return of([]);
      })
    )
  }

  gets_pedidos_repartidor(): Observable<PedidoEntregaInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<PedidoEntregaInterface[]>(
      `${this.apiUrlPedidogets}/gets_pedidos_repartidor`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los pedidos:', err);
        return of([]);
      })
    )
  }

  gets_pedido_by_id_for_repartidor(id_pedido: string): Observable<PedidoEntregaInterface[]> {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.get<PedidoEntregaInterface[]>(
      `${this.apiUrlPedidogets}/gets_pedidos_by_id_for_repartidor/${id_pedido}`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener los pedidos:', err);
        return of([]);
      })
    )
  }

  delete_pedidos_mesa(id_detalle: string, id_pedido: string, id_mesa: string) {
    return this.http.delete(
      `${this.apiUrlPedidogets}/delete_platillo`,
      {
        params: {
          id_detalle,
          id_pedido,
          id_mesa
        }
      }
    ).pipe(
      catchError(err => {
        console.error('Error al cancelar platillo:', err);
        return of({ error: true });
      })
    );
  }

  delete_pedidos_entrega(id_detalle: string, id_pedido: string) {
    return this.http.delete(
      `${this.apiUrlPedidogets}/delete_platillo`,
      {
        params: {
          id_detalle,
          id_pedido
        }
      }
    ).pipe(
      catchError(err => {
        console.error('Error al cancelar platillo:', err);
        return of({ error: true });
      })
    );
  }

  cancelar_pedido(id_pedido: string, id_mesa: string) {
    return this.http.delete(
      `${this.apiUrlPedidogets}/cancelar_pedido`,
      {
        params: {
          id_pedido,
          id_mesa
        }
      }
    ).pipe(
      catchError(err => {
        console.error('Error al cancelar pedido:', err);
        return of({ error: true });
      })
    );
  }

  cancelar_pedido_entrega(id_pedido: string) {
    const headers = this.getHeaders();
    if (!headers) return of([]);

    return this.http.delete(
      `${this.apiUrlPedidogets}/cancelar_pedido`,
      {
        headers,
        params: {
          id_pedido
        }
      }
    ).pipe(
      catchError(err => {
        console.error('Error al cancelar pedido:', err);
        return of({ error: true });
      })
    );
  }

  get_total_pedido(id_pedido: string): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrlPagar}/total_pedido?id_pedido=${id_pedido}`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener el total del pedido:', err);
        return of(0); // Devuelve 0 en caso de error
      })
    );
  }

  get_estado_pedido(id_pedido: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrlPagar}/verificar_pedido?id_pedido=${id_pedido}`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener el total del pedido:', err);
        return of(false); // Devuelve 0 en caso de error
      })
    );
  }


  generar_pago(
    id_pedido: string,
    metodo_pago: string,
    referencia_pago: string,
    id_mesa?: string
  ) {
    const headers = this.getHeaders();
    if (!headers) return of([]);
    const data = {
      id_pedido: id_pedido,
      metodo_pago: metodo_pago,
      referencia_pago: referencia_pago,
      id_mesa: id_mesa || null
    }
    return this.http.post(`${this.apiUrlPagar}/pagar`, data, { headers });

  }

}
