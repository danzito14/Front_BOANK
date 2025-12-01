import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaz para Usuario
export interface Usuario {
  id_usuario?: string;
  Nickname: string;
  Nombre?: string;
  Apellido?: string;
  Correo_electronico?: string;
  Num_telefonico?: string;
  Contraseña?: string;
  id_nvl_usuario: number;
  estatus: boolean;
  Ruta_imagen?: string;
}

// Interfaz para Nivel de Usuario (solo lectura)
export interface NivelUsuario {
  id_nvl_usuario: number;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly API_BASE = environment.apiUrl;

  // Niveles de usuario estáticos
  private readonly nivelesUsuario: NivelUsuario[] = [
    { id_nvl_usuario: 1, descripcion: 'Cliente' },
    { id_nvl_usuario: 2, descripcion: 'Mesero' },
    { id_nvl_usuario: 3, descripcion: 'Cocinero' },
    { id_nvl_usuario: 4, descripcion: 'Cajero' },
    { id_nvl_usuario: 5, descripcion: 'Repartidor' },
    { id_nvl_usuario: 6, descripcion: 'Administrador' },
    { id_nvl_usuario: 7, descripcion: 'Genérico' },
    { id_nvl_usuario: 8, descripcion: 'Temporal' }
  ];

  constructor(private http: HttpClient) { }

  // ============================================
  // USUARIOS
  // ============================================

  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<any[]>(`${this.API_BASE}/user/get_all_users`).pipe(
      map(response => this.mapResponse(response)),
      catchError(this.handleError)
    );
  }

  getUsuarioById(id: string): Observable<Usuario> {
    return this.http.get<any>(`${this.API_BASE}/user/get_user_id`, {
      params: { id_usuario: id }
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

  getUsuarioByIdADIM(id: string): Observable<Usuario> {
    return this.http.get<any>(`${this.API_BASE}/user/get_user_id_adm`, {
      params: { id_usuario: id }
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

  getUsuarioByNickname(nickname: string): Observable<Usuario> {
    return this.http.get<any>(`${this.API_BASE}/user/get_user_nickname`, {
      params: { Nickname: nickname }
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

  createUsuario(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_BASE}/user/create_user`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  updateUsuario(id: string, usuario: Partial<Usuario>): Observable<any> {
    return this.http.put(`${this.API_BASE}/user/update_user_by_id`, usuario, {
      params: { id_usuario: id }
    }).pipe(
      catchError(this.handleError)
    );
  }


  updateUsuarioADMIN(id: string, usuario: Partial<Usuario>): Observable<any> {
    return this.http.put(`${this.API_BASE}/user/update_user_by_id_adm`, usuario, {
      params: { current_user: id }
    }).pipe(
      catchError(this.handleError)
    );
  }


  updateUsuarioByNickname(nickname: string, usuario: Partial<Usuario>): Observable<any> {
    return this.http.put(`${this.API_BASE}/user/update_user/${nickname}`, usuario).pipe(
      catchError(this.handleError)
    );
  }

  deleteUsuario(id: string): Observable<any> {
    // Nota: Implementar el endpoint de eliminación en el backend si no existe
    return this.http.delete(`${this.API_BASE}/user/delete_user/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getUsuariosActivos(): Observable<Usuario[]> {
    return this.getAllUsuarios().pipe(
      map(usuarios => usuarios.filter(user => user.estatus === true))
    );
  }

  getUsuariosByNivel(idNivel: number): Observable<Usuario[]> {
    return this.getAllUsuarios().pipe(
      map(usuarios => usuarios.filter(user => user.id_nvl_usuario === idNivel))
    );
  }

  actualizarImagenPerfil(idUsuario: string, imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('current_user', idUsuario);
    formData.append('imagen', imagen);

    return this.http.post(`${this.API_BASE}/user/actualizar_imagen_perfil_adm`, formData).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // NIVELES DE USUARIO (Solo lectura)
  // ============================================

  getAllNivelesUsuario(): Observable<NivelUsuario[]> {
    // Retorna los niveles estáticos
    return new Observable(observer => {
      observer.next(this.nivelesUsuario);
      observer.complete();
    });
  }

  getNivelUsuarioById(id: number): Observable<NivelUsuario | undefined> {
    return new Observable(observer => {
      const nivel = this.nivelesUsuario.find(n => n.id_nvl_usuario === id);
      observer.next(nivel);
      observer.complete();
    });
  }

  getNivelDescripcion(id: number): string {
    const nivel = this.nivelesUsuario.find(n => n.id_nvl_usuario === id);
    return nivel ? nivel.descripcion : 'Desconocido';
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
          errorMessage = 'Usuario no encontrado';
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
        case 409:
          errorMessage = 'El usuario ya existe';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
      }
    }

    console.error('Error en el servicio:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
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
}