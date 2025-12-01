import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';

export interface UsuarioInterface {
  id_usuario?: string;
  id_nvl_usuario?: string;
  Nickname?: string;
  Contraseña?: string;
  Nombre?: string;
  Apellido?: string;
  Correo_electronico?: string;
  Num_telefonico?: string;
  Ruta_imagen?: string;
  estatus?: boolean;
}

@Injectable({
  providedIn: 'root',
})


export class Usuarioservices {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  private getHeaders(): HttpHeaders | null {
    const token = this.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : null;
  }

  get_datos_usuario(): Observable<UsuarioInterface> {
    const headers = this.getHeaders();
    if (!headers) return of(null as any);

    return this.http.get<UsuarioInterface>(
      `${this.apiUrl}/user/get_user_id`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al obtener el usuario:', err);
        return of(null as any);
      })
    );
  }

  get_nvl_usuario(id_nvl_usuario?: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/untils_empleados/get_nombre_nvl_usuario?nvl_usuario=${id_nvl_usuario}`
    ).pipe(
      catchError(err => {
        console.error('Error al obtener el usuario:', err);
        return of(null as any);
      })
    );
  }

  update_usuario_by_id(data: UsuarioInterface): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return throwError(() => new Error('No headers'));

    return this.http.put<any>(
      `${this.apiUrl}/user/update_user_by_id`,
      data,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al actualizar el usuario:', err);
        return throwError(() => err);  // ⬅ DEVUELVE EL ERROR REAL AL SUBSCRIBE
      })
    );
  }

  enviar_correo_de_cambio(correo: string): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    return this.http.put(
      `${this.apiUrl}/untils_empleados/cambio_correo`,
      { correo },                // <- CORREGIDO
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al enviar correo:', err);
        return throwError(() => err);
      })
    );
  }

  enviar_correo_cambio_contra(correo: string): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    return this.http.put(
      `${this.apiUrl}/untils_empleados/generar_codigo`,
      { correo },                // <- CORREGIDO
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al enviar correo:', err);
        return throwError(() => err);
      })
    );
  }

  validar_codigo_cambio_contra(codigo: string): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    return this.http.post(
      `${this.apiUrl}/untils_empleados/validar_codigo`,
      { codigo },                // <- CORREGIDO
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al validar código:', err);
        return of({ valid: false });
      })
    );
  }

  getFotoPerfil(Ruta_imagen: string | null | undefined): string {
    // Si NO tiene foto en BD → usar imagen default
    if (!Ruta_imagen) {
      return '/profiles/maquin_de_apoyo.jpeg';
    }

    // Si tiene foto en BD → arma la URL completa
    console.log(`${this.apiUrl}${Ruta_imagen}`);
    return `${this.apiUrl}${Ruta_imagen}`;
  }


  subirImagenPerfil(imagen: File): Observable<any> {

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("imagen", imagen);

    return this.http.post(
      `${this.apiUrl}/user/actualizar_imagen_perfil`,
      formData,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
        // NOTA: NO poner Content-Type
      }
    ).pipe(
      catchError(err => {
        console.error("Error al subir imagen:", err);
        return of(null);
      })
    );
  }

  delete_direccion_by_id(id_direccion: string): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    return this.http.delete<any>(
      `${this.apiUrl}/direcciones/delete_direccion/?id_direccion=${id_direccion}`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al eliminar la dirección:', err);
        return of(null);
      })
    );
  }

  delete_tarjeta_by_id(id_tarjeta: string): Observable<any> {
    const headers = this.getHeaders();
    if (!headers) return of(null);

    return this.http.delete<any>(
      `${this.apiUrl}/tarjetas/delete_tarjeta?id_tarjeta=${id_tarjeta}`,
      { headers }
    ).pipe(
      catchError(err => {
        console.error('Error al eliminar la dirección:', err);
        return of(null);
      })
    );
  }


}