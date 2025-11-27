import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

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
}
