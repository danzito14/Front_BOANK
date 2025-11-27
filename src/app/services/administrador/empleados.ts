import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environments';

// Interfaces para los modelos
export interface Empleado {
  __id_empleado__?: string;
  id_empleado?: string;
  id_puesto?: number;
  id_uniforme?: number;
  Nombre: string;
  Apellido: string;
  Correo_electronico: string;
  Num_telefonico: string;
  Calle?: string;
  No_ext?: string;
  No_int?: string;
  Colonia?: string;
  CP?: string;
  Ciudad?: string;
  Municipio?: string;
  Estado?: string;
  Fecha_de_contratacion: string;
  Fecha_de_despido?: string;
  Razon_despido?: string;
  Fecha_de_recontratacion?: string;
  id_usuario?: string;
  estatus: boolean;
  Ruta_imagen?: string;
  nombre?: string;
  usuario?: string;
  contraseña?: string;
}

export interface Puesto {
  __id_puesto__?: number;
  id_puesto?: number;
  Nombre_puesto?: string;
  Sueldo?: number;
  estatus?: boolean;
  id_nvl_usuario?: number;
}

export interface Uniforme {
  __id_uniforme__?: number;
  id_uniforme?: number;
  id_puesto?: number;
  Talla: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  Descripcion: string;
  estatus: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private readonly API_BASE = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ============================================
  // EMPLEADOS
  // ============================================

  getAllEmpleados(): Observable<Empleado[]> {
    return this.http.get<any[]>(`${this.API_BASE}/empleado/get_all_empleado`).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  getEmpleadoById(id: string): Observable<Empleado> {
    return this.http.get<any>(`${this.API_BASE}/empleado/get_empleado_by_id`, {
      params: { id_empleado: id }
    }).pipe(
      map(response => {
        if (response._mapping) {
          return response._mapping;
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  createEmpleado(empleado: Partial<Empleado>): Observable<Empleado> {
    return this.http.post<Empleado>(`${this.API_BASE}/empleado/create_empleado`, empleado).pipe(
      catchError(this.handleError)
    );
  }

  updateEmpleado(id: string, empleado: Partial<Empleado>): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.API_BASE}/empleado/update_empleado/${id}`, empleado).pipe(
      catchError(this.handleError)
    );
  }

  deleteEmpleado(id: string): Observable<any> {
    return this.http.delete(`${this.API_BASE}/empleado/delete_empleado/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getEmpleadosActivos(): Observable<Empleado[]> {
    return this.getAllEmpleados().pipe(
      map(empleados => empleados.filter(emp => emp.estatus === true))
    );
  }

  /**
   * Obtiene empleados que usan un uniforme específico
   */
  getEmpleadosByUniforme(idUniforme: number): Observable<Empleado[]> {
    return this.getAllEmpleados().pipe(
      map(empleados => empleados.filter(emp => emp.id_uniforme === idUniforme))
    );
  }

  /**
   * Actualiza el uniforme de múltiples empleados
   */
  actualizarUniformeEmpleados(empleadosIds: string[], nuevoIdUniforme: number): Observable<any> {
    const requests = empleadosIds.map(id =>
      this.updateEmpleado(id, { id_uniforme: nuevoIdUniforme })
    );
    console.log(nuevoIdUniforme);
    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(() => {
          observer.next({ success: true });
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // ============================================
  // PUESTOS
  // ============================================

  getAllPuestos(): Observable<Puesto[]> {
    return this.http.get<any[]>(`${this.API_BASE}/puestos/get_all_puestos`).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  getPuestoById(id: number): Observable<Puesto> {
    return this.http.get<Puesto>(`${this.API_BASE}/puestos/get_puesto?id_puesto=${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getPuestosActivos(): Observable<Puesto[]> {
    return this.getAllPuestos().pipe(
      map(puestos => puestos.filter(puesto => puesto.estatus === true))
    );
  }

  createPuesto(puesto: Puesto): Observable<Puesto> {
    puesto.estatus = true;
    return this.http.post<Puesto>(
      `${this.API_BASE}/puestos/create_puesto`,
      puesto
    ).pipe(
      catchError(this.handleError)
    );
  }

  updatePuesto(id: number, puesto: Puesto): Observable<Puesto> {
    return this.http.put(`${this.API_BASE}/puestos/update_puesto/${id}`, puesto).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // UNIFORMES
  // ============================================

  getAllUniformes(): Observable<Uniforme[]> {
    return this.http.get<any[]>(`${this.API_BASE}/uniforme/get_all_uniforme`).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  getUniformeById(id: number): Observable<Uniforme> {
    return this.http.get<any>(`${this.API_BASE}/uniforme/get_uniforme/${id}`).pipe(
      map(response => {
        if (response._mapping) {
          return response._mapping;
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  getUniformesActivos(): Observable<Uniforme[]> {
    return this.getAllUniformes().pipe(
      map(uniformes => uniformes.filter(uniforme => uniforme.estatus === true))
    );
  }

  getUniformesByPuesto(idPuesto: number): Observable<Uniforme[]> {
    return this.getAllUniformes().pipe(
      map(uniformes => uniformes.filter(uniforme =>
        uniforme.id_puesto === idPuesto && uniforme.estatus === true
      ))
    );
  }

  createUniforme(uniforme: Partial<Uniforme>): Observable<Uniforme> {
    uniforme.estatus = true;
    return this.http.post<Uniforme>(
      `${this.API_BASE}/uniforme/create_uniforme`,
      uniforme
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateUniforme(id: number, uniforme: Partial<Uniforme>): Observable<any> {
    return this.http.put(
      `${this.API_BASE}/uniforme/update_uniforme/${id}`,
      uniforme
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // UTILIDADES
  // ============================================

  private mapResponse(response: any[]): any[] {
    if (response.length > 0 && response[0]._mapping) {
      return response.map(item => item._mapping);
    }
    return response;
  }

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

  formatSueldo(sueldo: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(sueldo);
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatFechaInput(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toISOString().split('T')[0];
  }

  actualizarImagenPerfil(idEmpleado: string, imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('id_empleado', idEmpleado);

    return this.http.post(`${this.API_BASE}/empleado/actualizar_imagen_perfil`, formData).pipe(
      catchError(this.handleError)
    );
  }
}