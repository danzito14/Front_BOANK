// services/administrador/mineria-datos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces para predicción de cancelaciones
export interface PrediccionCancelacion {
  platillo: string;
  categoria: string;
  tasa_cancelacion: number;
  precio_venta: number;
  nivel_riesgo: 'Alto' | 'Medio' | 'Bajo';
}

export interface FactorImportancia {
  [key: string]: number;
}

export interface PrediccionCancelacionesResponse {
  accuracy_modelo: number;
  total_datos_analizados: number;
  periodo_analisis: string;  // NUEVO: "Últimos 30 días"
  predicciones: PrediccionCancelacion[];
  factores_importantes: FactorImportancia;
  recomendaciones: string[];
  error?: string;  // NUEVO: Para manejar cuando no hay suficientes datos
}

// Interfaces para patrones temporales
export interface VentaPorHora {
  hora: string;
  pedidos: number;
  ingresos: number;
  tasa_cancelacion: number;
}

export interface VentaPorDia {
  dia: string;
  pedidos: number;
  ingresos: number;
  tasa_cancelacion: number;
}

export interface HoraPico {
  hora: string;
  pedidos: number;
}

export interface PatronesTemporalesResponse {
  periodo_analisis: string;  // NUEVO: "Últimos 30 días"
  ventas_por_hora: VentaPorHora[];
  ventas_por_dia_semana: VentaPorDia[];
  horas_pico: HoraPico[];
  horas_bajas: HoraPico[];
  insights: string[];
  error?: string;  // NUEVO: Para manejar cuando no hay datos
}

// Interfaces para predicción de demanda
export interface PrediccionDemanda {
  platillo: string;
  demanda_promedio_diaria: number;
  demanda_ultima_semana: number;
  prediccion_proxima_semana: number;
  tendencia: number;
  estado_tendencia: 'Creciente' | 'Estable' | 'Decreciente';
}

export interface PrediccionDemandaResponse {
  fecha_analisis: string;
  periodo_datos: string;  // Ya existía y es correcto
  predicciones: PrediccionDemanda[];
  recomendaciones_inventario: string[];
  error?: string;  // NUEVO: Para manejar cuando no hay datos
}

// Interfaces para análisis de rentabilidad
export interface PlatilloRentable {
  platillo: string;
  ventas_totales: number;
  ganancia_total: number;
  margen: number;
  roi: number;
}

export interface PlatilloBajoRendimiento {
  platillo: string;
  ventas_totales: number;
  margen: number;
  tasa_cancelacion: number;
  problema: string;
}

export interface RentabilidadCategoria {
  categoria: string;
  ventas: number;
  margen_promedio: number;
  tasa_cancelacion: number;
}

export interface AnalisisRentabilidadResponse {
  periodo_analisis: string;  // NUEVO: "Últimos 30 días"
  top_rentables: PlatilloRentable[];
  bajo_rendimiento: PlatilloBajoRendimiento[];
  por_categoria: RentabilidadCategoria[];
  recomendaciones: string[];
  error?: string;  // NUEVO: Para manejar cuando no hay datos
}

// Interfaces para segmentación
export interface SegmentoCliente {
  tipo: string;
  total_pedidos: number;
  ingresos_totales: number;
  ticket_promedio: number;
  tasa_cancelacion: number;
}

export interface SegmentacionResponse {
  periodo_analisis: string;  // NUEVO: "Últimos 30 días"
  resumen_por_tipo: SegmentoCliente[];
  insights: string[];
  error?: string;  // NUEVO: Para manejar cuando no hay datos
}

@Injectable({
  providedIn: 'root'
})
export class MineriaDatosService {
  private apiUrlserve = environment.apiUrl;
  private apiUrl = `${this.apiUrlserve}/mineria`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene predicciones de platillos con alto riesgo de cancelación
   * Analiza los últimos 30 días de datos
   */
  getPredicionCancelaciones(): Observable<PrediccionCancelacionesResponse> {
    return this.http.get<PrediccionCancelacionesResponse>(
      `${this.apiUrl}/prediccion-cancelaciones`
    );
  }

  /**
   * Analiza patrones temporales de ventas
   * Analiza los últimos 30 días de datos
   */
  getPatronesTemporales(): Observable<PatronesTemporalesResponse> {
    return this.http.get<PatronesTemporalesResponse>(
      `${this.apiUrl}/patrones-temporales`
    );
  }

  /**
   * Predice la demanda futura de platillos
   * Analiza los últimos 30 días de datos
   */
  getPrediccionDemanda(): Observable<PrediccionDemandaResponse> {
    return this.http.get<PrediccionDemandaResponse>(
      `${this.apiUrl}/prediccion-demanda`
    );
  }

  /**
   * Obtiene análisis avanzado de rentabilidad
   * Analiza los últimos 30 días de datos
   */
  getAnalisisRentabilidad(): Observable<AnalisisRentabilidadResponse> {
    return this.http.get<AnalisisRentabilidadResponse>(
      `${this.apiUrl}/analisis-rentabilidad`
    );
  }

  /**
   * Obtiene segmentación de clientes
   * Analiza los últimos 30 días de datos
   */
  getSegmentacionClientes(): Observable<SegmentacionResponse> {
    return this.http.get<SegmentacionResponse>(
      `${this.apiUrl}/segmentacion-clientes`
    );
  }
}