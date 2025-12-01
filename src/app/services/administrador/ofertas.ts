import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces - Exactas a las tablas de BD
export interface Oferta {
  id_oferta: string;                      // varchar(36) PK
  nombre_oferta?: string | null;           // varchar(100)
  descripcion?: string | null;             // text
  porcentaje_descuento?: number | null;    // decimal(5,2)
  fecha_inicio?: string | null;            // datetime
  fecha_fin?: string | null;               // datetime
  activo: boolean;               // tinyint(1)
}

export interface OfertaPlatillo {
  id_oferta_platillo?: string;    // varchar(36) PK
  id_platillo?: string;            // varchar(36)
  id_oferta?: string;              // varchar(36)
  activo: boolean;       // tinyint(1)
  // Campos adicionales de la vista (si vienen del JOIN)
  Nombre_platillo?: string;
  precio_platillo?: number;
  precio_venta?: number;
  Ruta_imagen?: string;
}

export interface OfertaCompleta extends Oferta {
  platillos?: OfertaPlatillo[];
  total_platillos?: number;
}

export interface OfertasSchema {
  nombre_oferta: string;
  descripcion: string;
  porcentaje_descuento?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean | number;
}

export interface OfertaPlatilloSchema {
  id_platillo: string | string[];
  activo?: boolean | number;
}

@Injectable({
  providedIn: 'root'
})
export class OfertasService {
  private API_BASE = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ==================== OFERTAS (CABEZA) ====================

  /**
   * Crear nueva oferta
   */
  createOferta(data: OfertasSchema): Observable<{ message: string; id_oferta?: string }> {
    return this.http.post<{ message: string; id_oferta?: string }>(
      `${this.API_BASE}/ofertas/create_oferta`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todas las ofertas
   */
  getAllOfertas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(
      `${this.API_BASE}/ofertas/get_all_ofertas`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener ofertas completas con platillos
   */
  getAllOfertasCompletas(): Observable<OfertaCompleta[]> {
    return this.getAllOfertas().pipe(
      map(ofertas => {
        return ofertas.map(oferta => ({
          ...oferta,
          platillos: [],
          total_platillos: 0
        }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener una oferta por nombre
   */
  getOfertaByNombre(nombreOferta: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(
      `${this.API_BASE}/ofertas/get_oferta/${nombreOferta}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener oferta por ID
   */
  getOfertaById(idOferta: string): Observable<Oferta> {
    return this.getAllOfertas().pipe(
      map(ofertas => {
        const oferta = ofertas.find(o => o.id_oferta === idOferta);
        if (!oferta) {
          throw new Error('Oferta no encontrada');
        }
        return oferta;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar oferta
   */
  updateOferta(idOferta: string, data: Partial<OfertasSchema>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.API_BASE}/ofertas/update_oferta/${idOferta}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== OFERTA PLATILLOS ====================

  /**
   * Crear relación oferta-platillo(s)
   */
  createOfertaPlatillo(idOferta: string, data: OfertaPlatilloSchema): Observable<{ message: string; registros?: any[] }> {
    const payload = {
      id_oferta: idOferta,
      ...data
    };

    return this.http.post<{ message: string; registros?: any[] }>(
      `${this.API_BASE}/ofertas/create_oferta_platillo/`,
      payload
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todos los platillos de todas las ofertas
   */
  getAllOfertasPlatillos(): Observable<OfertaPlatillo[]> {
    return this.http.get<OfertaPlatillo[]>(
      `${this.API_BASE}/ofertas/get_all_ofertas_platillos`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener platillos de una oferta específica
   */
  getPlatillosByOferta(idOferta: string): Observable<OfertaPlatillo[]> {
    return this.http.get<OfertaPlatillo[]>(
      `${this.API_BASE}/ofertas/get_oferta_platillo/${idOferta}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener ofertas para el home (vista pública)
   */
  getOfertasForHome(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/ofertas/get_ofertas_for_home`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Agregar múltiples platillos a una oferta
   */
  addPlatillosToOferta(idOferta: string, platillos: OfertaPlatilloSchema[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/ofertas/add_platillos_oferta/${idOferta}`,
      platillos
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un platillo de una oferta
   */
  deleteOfertaPlatillo(idOfertaPlatillo: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_BASE}/ofertas/delete_platillo_oferta/`,
      { params: { id_oferta_platillo: idOfertaPlatillo } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar todos los platillos de una oferta
   */
  deleteAllPlatillosOferta(idOferta: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_BASE}/ofertas/delete_all_platillo_oferta`,
      { params: { id_oferta: idOferta } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear precio
   */
  formatPrecio(value: number): string {
    if (value === null || value === undefined) return '—';
    return `$${value.toFixed(2)}`;
  }

  /**
   * Formatear porcentaje de descuento
   */
  formatDescuento(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(0)}%`;
  }

  /**
   * Formatear fecha
   */
  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  /**
   * Obtener texto del estatus
   */
  getEstatusTexto(activo: boolean | number): string {
    // Manejar tanto boolean como tinyint(1)
    const isActivo = activo === true || activo === 1;
    return isActivo ? 'Activa' : 'Inactiva';
  }

  /**
   * Obtener clase CSS del estatus
   */
  getEstatusClass(activo: boolean | number): string {
    const isActivo = activo === true || activo === 1;
    return isActivo ? 'estatus-activo' : 'estatus-inactivo';
  }

  /**
   * Verificar si una oferta está vigente
   */
  isOfertaVigente(oferta: Oferta): boolean {
    const isActivo = oferta.activo === true;
    if (!isActivo) return false;

    const now = new Date();

    if (oferta.fecha_inicio) {
      const inicio = new Date(oferta.fecha_inicio);
      if (now < inicio) return false;
    }

    if (oferta.fecha_fin) {
      const fin = new Date(oferta.fecha_fin);
      if (now > fin) return false;
    }

    return true;
  }

  /**
   * Calcular precio con descuento
   */
  calcularPrecioConDescuento(precioOriginal: number, porcentajeDescuento: number | null | undefined): number {
    if (!porcentajeDescuento) return precioOriginal;
    return precioOriginal - (precioOriginal * (porcentajeDescuento / 100));
  }

  /**
   * Calcular ahorro
   */
  calcularAhorro(precioOriginal: number, porcentajeDescuento: number | null | undefined): number {
    if (!porcentajeDescuento) return 0;
    return precioOriginal * (porcentajeDescuento / 100);
  }

  /**
   * Obtener URL de imagen
   */
  getImageUrl(rutaImagen: string | null | undefined): string {
    if (!rutaImagen) {
      return 'assets/images/oferta-placeholder.png';
    }
    return `${this.API_BASE}/${rutaImagen}`;
  }

  /**
   * Validar fechas de oferta
   */
  validarFechas(fechaInicio: string, fechaFin: string): { valid: boolean; error?: string } {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (inicio >= fin) {
      return {
        valid: false,
        error: 'La fecha de inicio debe ser anterior a la fecha de fin'
      };
    }

    return { valid: true };
  }

  /**
   * Verificar si oferta tiene platillos
   */
  tienePlatillos(oferta: OfertaCompleta): boolean | undefined {
    return oferta && oferta.platillos && oferta.platillos.length > 0;
  }

  /**
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.detail || `Error ${error.status}: ${error.message}`;
    }

    console.error('Error en OfertasService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}