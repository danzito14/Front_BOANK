import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { AuthStoreService } from '../auth/auth-store';

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

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  // la verdad dudo usar mas de una funcion de mesas aqui
  private apiUrlMesas = 'http://127.0.0.1:8000/mesas';
  private apiUrlUntilsEmpleados = 'http://127.0.0.1:8000/untils_empleados';
  private apiUrlPedidogets = 'http://localhost:8000/pedido_gets';

  private apiUrlPagar = 'http://localhost:8000/pagar';

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


  generar_pago(id_pedido: string,
    metodo_pago: string,
    id_mesa: string,
    referencia_pago: string) {
    const headers = this.getHeaders();
    if (!headers) return of([]);
    const data = {
      id_pedido: id_pedido,
      metodo_pago: metodo_pago,
      id_mesa: id_mesa,
      referencia_pago: referencia_pago
    }
    return this.http.post(`${this.apiUrlPagar}/pagar`, data, { headers });

  }

}
