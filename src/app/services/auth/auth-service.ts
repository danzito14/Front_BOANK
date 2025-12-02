import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrlserve = environment.apiUrl;

  //creamos la url privada
  private apiUrl = `${this.apiUrlserve}/BoaNK/login`;

  //hacemos el constructor
  constructor(private http: HttpClient) { }

  //creamos la funcion del login
  login(Nickname: string, contrasena: string): Observable<any> {
    const body = { Nickname, contrasena };
    return this.http.post(`${this.apiUrl}`, body);
  }

  recupear_contra(nickname: string): Observable<any> {
    return this.http.get(
      `${this.apiUrlserve}/untils_empleados/recuperar_contra?nickname=${nickname}`
    ).pipe(
      catchError(err => {
        console.error('Error en recuperar_contra:', err);
        return of(null); // <-- importante
      })
    );
  }

}
