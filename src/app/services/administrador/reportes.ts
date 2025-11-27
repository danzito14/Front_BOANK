// services/administrador/reportes.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface ReporteInterface {
  platillos_preparados: number;
  platillos_cancelados: number;
  total_platillos: number;
  ingresos_estimados: number;
  egresos_estimados: number;
  ganancia_estimada: number;
  margen_ganancia?: number;
  egresos_cancelados?: number;
}

export interface ReporteExtendidoInterface extends ReporteInterface {
  // Métricas adicionales
  ticket_promedio: number;
  tasa_cancelacion: number;
  platillos_por_pedido: number;
  total_pedidos: number;
  pedidos_completados: number;
  pedidos_cancelados: number;
  pedidos_locales: number;
  pedidos_domicilio: number;
}

export interface PedidoInterface {
  id_pedido: string;
  Fecha: string;
  total_platillos: number;
  total: number;
  Estado: string;
  Tipo_pedido: string;
}

export interface PedidosResponseInterface {
  orders: PedidoInterface[];
  total: number;
  page: number;
  total_pages: number;
}

export interface VentaPeriodo {
  name: string;
  ventas: number;
  pedidos: number;
}

export interface PlatilloTop {
  name: string;
  cantidad: number;
  ingresos: number;
}

export interface DistribucionItem {
  name: string;
  value: number;
}

export interface ChartDataInterface {
  ventas_por_periodo: VentaPeriodo[];
  platillos_top: PlatilloTop[];
  distribucion: DistribucionItem[];
}

export interface PlatilloRentableInterface {
  nombre: string;
  cantidad_vendida: number;
  ingresos_totales: number;
  ganancia_total: number;
  margen_porcentaje: number;
}

@Injectable({
  providedIn: 'root'
})
export class Reportes {
  private apiUrlserve = environment.apiUrl;

  private apiUrl = `${this.apiUrlserve}/reportes`; // Ajusta tu URL

  constructor(private http: HttpClient) { }

  get_reporte_ventas_hoy(): Observable<ReporteExtendidoInterface> {
    return this.http.get<ReporteExtendidoInterface>(`${this.apiUrl}/hoy`);
  }

  get_reporte_ventas_semana(): Observable<ReporteExtendidoInterface> {
    return this.http.get<ReporteExtendidoInterface>(`${this.apiUrl}/semana`);
  }

  get_reporte_ventas_mes(): Observable<ReporteExtendidoInterface> {
    return this.http.get<ReporteExtendidoInterface>(`${this.apiUrl}/mes`);
  }

  get_reporte_ventas_intervalo(inicio: string, fin: string): Observable<ReporteExtendidoInterface> {
    return this.http.get<ReporteExtendidoInterface>(`${this.apiUrl}/intervalo`, {
      params: { inicio, fin }
    });
  }

  get_pedidos(periodo: string, page: number = 1, limit: number = 50): Observable<PedidosResponseInterface> {
    return this.http.get<PedidosResponseInterface>(`${this.apiUrl}/pedidos`, {
      params: { periodo, page: page.toString(), limit: limit.toString() }
    });
  }

  get_pedidos_intervalo(inicio: string, fin: string, page: number = 1, limit: number = 50): Observable<PedidosResponseInterface> {
    return this.http.get<PedidosResponseInterface>(`${this.apiUrl}/pedidos/intervalo`, {
      params: { inicio, fin, page: page.toString(), limit: limit.toString() }
    });
  }

  get_chart_data(periodo: string): Observable<ChartDataInterface> {
    return this.http.get<ChartDataInterface>(`${this.apiUrl}/graficas/${periodo}`);
  }

  get_chart_data_intervalo(inicio: string, fin: string): Observable<ChartDataInterface> {
    return this.http.get<ChartDataInterface>(`${this.apiUrl}/graficas/intervalo`, {
      params: { inicio, fin }
    });
  }

  get_platillo_mas_rentable(periodo: string): Observable<PlatilloRentableInterface> {
    return this.http.get<PlatilloRentableInterface>(`${this.apiUrl}/platillo-mas-rentable/${periodo}`);
  }

  get_platillo_mas_rentable_intervalo(inicio: string, fin: string): Observable<PlatilloRentableInterface> {
    return this.http.get<PlatilloRentableInterface>(`${this.apiUrl}/platillo-mas-rentable/intervalo`, {
      params: { inicio, fin }
    });
  }
}