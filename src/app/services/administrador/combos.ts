import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces
export interface Platillo {
  id_detalle_combo: string;
  id_platillo: string;
  Nombre_platillo: string;
  precio_platillo: number;
  Cantidad: number;
}

export interface Combo {
  id_combo: string;
  Nombre_combo: string;
  Descripcion: string;
  Ruta_imagen: string;
  precio_combo: number;
  estatus: boolean;
  platillos: Platillo[];
}

export interface ComboSchema {
  Nombre_combo: string;
  precio_combo: number;
  Descripcion?: string;
  Ruta_imagen?: string;
  estatus?: boolean;
}

export interface ComboDetalleSchema {
  id_platillo: string;
  Cantidad: number;
}

export interface UploadImageResponse {
  message: string;
  ruta: string;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class CombosService {
  private API_BASE = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ==================== GESTIÓN DE IMÁGENES ====================

  /**
   * Subir imagen para un combo
   */
  uploadComboImage(idCombo: string, file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadImageResponse>(
      `${this.API_BASE}/combos/${idCombo}/upload-image`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar imagen de un combo
   */
  deleteComboImage(idCombo: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_BASE}/combos/${idCombo}/delete-image`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validar archivo de imagen
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Use JPG, PNG, GIF o WEBP'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es muy grande. Máximo 5MB'
      };
    }

    return { valid: true };
  }

  // ==================== COMBOS (Cabeza) ====================

  createCombo(data: ComboSchema): Observable<{ message: string; id_combo: string }> {
    return this.http.post<{ message: string; id_combo: string }>(
      `${this.API_BASE}/combos/create_combo`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear combo con imagen
   */
  createComboWithImage(data: ComboSchema, image?: File): Observable<{ message: string; id_combo: string }> {
    return new Observable(observer => {
      // Primero crear el combo
      this.createCombo(data).subscribe({
        next: (response) => {
          // Si hay imagen, subirla
          if (image) {
            this.uploadComboImage(response.id_combo, image).subscribe({
              next: () => {
                observer.next(response);
                observer.complete();
              },
              error: (error) => {
                // Combo creado pero imagen falló
                console.error('Error subiendo imagen:', error);
                observer.next({
                  ...response,
                  message: response.message + ' (advertencia: no se pudo subir la imagen)'
                });
                observer.complete();
              }
            });
          } else {
            observer.next(response);
            observer.complete();
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  getAllCombos(): Observable<Combo[]> {
    return this.http.get<Combo[]>(
      `${this.API_BASE}/combos/get_combo_cabeza`
    ).pipe(
      catchError(this.handleError)
    );
  }

  getComboByNombre(id_combo: string): Observable<Combo> {
    return this.http.get<Combo>(
      `${this.API_BASE}/combos/get_combo`,
      { params: { id_combo: id_combo } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getComboById(idCombo: string): Observable<Combo> {
    return this.getAllCombos().pipe(
      map(combos => {
        const combo = combos.find(c => c.id_combo === idCombo);
        if (!combo) {
          throw new Error('Combo no encontrado');
        }
        return combo;
      }),
      catchError(this.handleError)
    );
  }

  updateCombo(idCombo: string, data: Partial<ComboSchema>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.API_BASE}/combos/update_combo/${idCombo}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar combo con imagen
   */
  updateComboWithImage(idCombo: string, data: Partial<ComboSchema>, image?: File): Observable<{ message: string }> {
    return new Observable(observer => {
      // Actualizar datos del combo
      this.updateCombo(idCombo, data).subscribe({
        next: (response) => {
          // Si hay imagen, subirla
          if (image) {
            this.uploadComboImage(idCombo, image).subscribe({
              next: () => {
                observer.next(response);
                observer.complete();
              },
              error: (error) => {
                console.error('Error subiendo imagen:', error);
                observer.next({
                  message: response.message + ' (advertencia: no se pudo actualizar la imagen)'
                });
                observer.complete();
              }
            });
          } else {
            observer.next(response);
            observer.complete();
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  getComboCabeza(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/combos/get_combo_cabeza`
    ).pipe(
      catchError(this.handleError)
    );
  }

  getCombosByPrice(minPrice: number, maxPrice: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/combos/get_combo_by_price`,
      { params: { min_price: minPrice.toString(), max_price: maxPrice.toString() } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getIdPlatillosCombo(idCombo: string): Observable<{ id_platillo: string }[]> {
    return this.http.get<{ id_platillo: string }[]>(
      `${this.API_BASE}/combos/id_platos`,
      { params: { id_combo: idCombo } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== COMBO DETALLE ====================

  createComboDetalle(idCombo: string, detalles: ComboDetalleSchema[]): Observable<{ message: string }> {
    console.log(detalles);
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/combos/create_detalle_combo/${idCombo}`,
      detalles
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateComboDetalle(idDetalleCombo: string, data: Partial<ComboDetalleSchema>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.API_BASE}/combos/update_detalle_combo/${idDetalleCombo}`,
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  addPlatillosToCombo(idCombo: string, platillos: ComboDetalleSchema[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/combos/add_platillo_combo/${idCombo}`,
      platillos
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteComboDetalle(idDetalleCombo: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_BASE}/combos/delete_detalle_combo/${idDetalleCombo}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteAllComboDetalle(idCombo: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_BASE}/combos/delete_all_detalle_combo/${idCombo}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== UTILIDADES ====================

  formatPrecio(value: number): string {
    if (value === null || value === undefined) return '—';
    return `$${value.toFixed(2)}`;
  }

  calcularTotalCombo(combo: Combo): number {
    if (!combo || !combo.platillos || combo.platillos.length === 0) {
      return 0;
    }
    return combo.platillos.reduce((total, platillo) => {
      return total + (platillo.precio_platillo * platillo.Cantidad);
    }, 0);
  }

  tienePlatillos(combo: Combo): boolean {
    return combo && combo.platillos && combo.platillos.length > 0;
  }

  getImageUrl(rutaImagen: string | null | undefined): string {
    if (!rutaImagen) {
      return 'assets/images/combo-placeholder.png';
    }
    return `${this.API_BASE}/${rutaImagen}`;
  }

  getEstatusTexto(estatus: boolean): string {
    return estatus === true ? 'Activo' : 'Inactivo';
  }

  getEstatusClass(estatus: boolean): string {
    return estatus === true ? 'estatus-activo' : 'estatus-inactivo';
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.detail || `Error ${error.status}: ${error.message}`;
    }

    console.error('Error en CombosService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}