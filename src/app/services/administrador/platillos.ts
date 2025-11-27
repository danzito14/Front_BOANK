import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environments';

// Interfaces para los modelos
export interface Platillo {
  __id_platillo__?: string;
  id_platillo?: string;
  id_tipo_platillo?: string;
  Nombre_platillo: string;
  Ruta_imagen?: string;
  precio_produccion: number;
  precio_venta: number;
  estatus: boolean;
  Descripcion?: string;
  tiempo_preparacion?: number;
  // Campos adicionales para ofertas
  En_oferta?: boolean;
  Porcentaje_oferta?: number;
  precio_original?: number;
}

export interface TipoPlatillo {
  __id_tipo_platillo__?: number;
  id_tipo_platillo?: number;
  descripcion: string;
  estatus: boolean;
  ruta_icono?: string;
  color?: string;
}

export interface OpcionPlatillo {
  __id_option__?: number;
  id_option?: number;
  id_platillo: string;
  opcion: string;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlatillosService {
  private readonly API_BASE = environment.apiUrl;
  // private apiUrlserve = environment.apiUrl;



  constructor(private http: HttpClient) { }

  // ============================================
  // PLATILLOS
  // ============================================

  /**
   * Obtiene todos los platillos con ofertas aplicadas
   */
  getAllPlatillos(): Observable<Platillo[]> {
    return this.http.get<any[]>(`${this.API_BASE}/platillo/get_all_platillos`).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un platillo por ID
   */
  getPlatilloById(id: string): Observable<Platillo> {
    return this.http.get<any>(`${this.API_BASE}/platillo/get_platillo_id`, {
      params: { id }
    }).pipe(
      map(response => {
        if (Array.isArray(response) && response.length > 0) {
          return response[0]._mapping || response[0];
        }
        if (response._mapping) {
          return response._mapping;
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Busca platillos por nombre
   */
  searchPlatillos(nombre: string): Observable<Platillo[]> {
    return this.http.get<any[]>(`${this.API_BASE}/platillo/get_platillo`, {
      params: { Nombre_platillo: nombre }
    }).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene platillos por tipo
   */
  getPlatillosByTipo(idTipo: number): Observable<Platillo[]> {
    return this.http.get<any[]>(`${this.API_BASE}/platillo/get_platillo_by_tipo`, {
      params: { id_tipo_platillo: idTipo.toString() }
    }).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene platillos por rango de precio
   */
  getPlatillosByPrice(minPrice: number, maxPrice: number): Observable<Platillo[]> {
    return this.http.get<any[]>(`${this.API_BASE}/platillo/get_platillo_by_price`, {
      params: {
        min_price: minPrice.toString(),
        max_price: maxPrice.toString()
      }
    }).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo platillo
   */
  createPlatillo(platillo: Partial<Platillo>): Observable<any> {
    return this.http.post(`${this.API_BASE}/platillo/create_platillo`, platillo).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un platillo existente
   */
  updatePlatillo(id: string, platillo: Partial<Platillo>): Observable<any> {
    return this.http.put(`${this.API_BASE}/platillo/update_platillo/${id}`, platillo).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene platillos activos
   */
  getPlatillosActivos(): Observable<Platillo[]> {
    return this.getAllPlatillos().pipe(
      map(platillos => platillos.filter(p => p.estatus === true))
    );
  }

  // ============================================
  // TIPOS DE PLATILLO
  // ============================================

  /**
   * Obtiene todos los tipos de platillo
   */
  getAllTiposPlatillo(): Observable<TipoPlatillo[]> {
    return this.http.get<any[]>(`${this.API_BASE}/tipo_platillos/get_all_tipo_platillos`).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo tipo de platillo
   */
  createTipoPlatillo(tipo: Partial<TipoPlatillo>): Observable<TipoPlatillo> {
    tipo.estatus = true;
    return this.http.post<TipoPlatillo>(
      `${this.API_BASE}/tipo_platillos/create_tipo_platillo`,
      tipo
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un tipo de platillo
   */
  updateTipoPlatillo(id: number, tipo: Partial<TipoPlatillo>): Observable<any> {
    return this.http.put(
      `${this.API_BASE}/tipo_platillos/update_tipo_platillo/${id}`,
      tipo
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un tipo de platillo
   */
  deleteTipoPlatillo(id: number): Observable<any> {
    return this.http.delete(
      `${this.API_BASE}/tipo_platillos/delete_tipo_platillos/${id}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene tipos de platillo activos
   */
  getTiposPlatilloActivos(): Observable<TipoPlatillo[]> {
    return this.getAllTiposPlatillo().pipe(
      map(tipos => tipos.filter(t => t.estatus === true))
    );
  }

  // ============================================
  // OPCIONES DE PLATILLO
  // ============================================

  /**
   * Obtiene las opciones de un platillo
   */
  getOpcionesPlatillo(idPlatillo: string): Observable<OpcionPlatillo[]> {
    return this.http.get<any[]>(`${this.API_BASE}/platillos/get_platillo_option`, {
      params: { id_platillo: idPlatillo }
    }).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Crea una nueva opción de platillo
   */
  createOpcionPlatillo(opcion: Partial<OpcionPlatillo>): Observable<any> {
    return this.http.post(
      `${this.API_BASE}/platillo/create_options_platillo`,
      opcion
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una opción de platillo
   */
  updateOpcionPlatillo(idOption: number, opcion: Partial<OpcionPlatillo>): Observable<any> {
    return this.http.put(
      `${this.API_BASE}/platillo/update_options_platillo`,
      opcion,
      { params: { id_option: idOption.toString() } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una opción de platillo
   */
  deleteOpcionPlatillo(idOption: number): Observable<any> {
    return this.http.delete(
      `${this.API_BASE}/platillo/delete_option/${idOption}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Mapea la respuesta del backend (maneja _mapping)
   */
  private mapResponse(response: any[]): any[] {
    if (!response || response.length === 0) return [];

    if (response[0]._mapping) {
      return response.map(item => item._mapping);
    }
    return response;
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error en la operación';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;

      switch (error.status) {
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 400:
          errorMessage = error.error.detail || 'Datos inválidos en la solicitud';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'Acceso prohibido';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
      }
    }

    console.error('Error en el servicio:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Formatea el precio a formato de moneda mexicana
   */
  formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  /**
   * Calcula el precio con descuento
   */
  calcularPrecioConDescuento(precioOriginal: number, porcentajeDescuento: number): number {
    return Math.round(precioOriginal * (1 - porcentajeDescuento / 100) * 100) / 100;
  }

  /**
   * Formatea el tiempo de preparación
   */
  formatTiempoPreparacion(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }
}