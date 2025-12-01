import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaz para Mesa
export interface Mesa {
  id_mesa?: string;
  Nombre_mesa: string;
  Capacidad: number;
  Estado: 'Libre' | 'Ocupada' | 'Reservada';
  estatus_bool: boolean;
  id_pedido?: string | null;
}

// Schema para crear/actualizar mesa
export interface MesaSchema {
  Nombre_mesa?: string;
  Capacidad?: number;
  Estado?: 'Libre' | 'Ocupada' | 'Reservada';
  estatus_bool?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MesasService {
  private apiUrl = `${environment.apiUrl}/mesas`;

  constructor(private http: HttpClient) { }

  // Obtener todas las mesas
  getAllMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiUrl}/get_all_mesas`);
  }

  // Obtener todas las mesas ocupadas
  getAllMesasOcupadas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiUrl}/get_all_mesas_ocupadas`);
  }

  // Obtener una mesa por nombre
  getMesa(nombreMesa: string): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiUrl}/get_mesa/${nombreMesa}`);
  }

  // Crear una nueva mesa
  createMesa(data: MesaSchema): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/create_mesa`, data);
  }

  // Actualizar una mesa
  updateMesa(idMesa: string, data: Partial<MesaSchema>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/update_mesa/${idMesa}`, data);
  }

  // Eliminar una mesa
  deleteMesa(idMesa: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/delete_mesa/?id_mesa=${idMesa}`);
  }
}