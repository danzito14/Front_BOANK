import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface WebSocketMessage {
  tipo: 'nuevo_pedido' | 'actualizacion_pedido' | 'nuevos_platillos' | 'estado_actualizado';
  id_pedido?: string;
  id_detalle?: string;
  tipo_pedido?: string;
  id_mesa?: string;
  platillos?: any[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectInterval = 5000; // 5 segundos
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isIntentionalClose = false;

  constructor() { }

  /**
   * Conecta al WebSocket del servidor
   * @param role - El rol del usuario (cocina, meseros, admin, cliente)
   * @param userId - ID del usuario actual
   */
  connect(role: string, userId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/${role}/${userId}`;
    console.log(`Conectando a WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado exitosamente');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📩 Mensaje recibido por WebSocket:', message);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Error al parsear mensaje WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado', event);
        this.ws = null;

        // Solo reconectar si no fue un cierre intencional
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(role, userId), this.reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Error al crear WebSocket:', error);
    }
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.isIntentionalClose = true;
      this.ws.close();
      this.ws = null;
      console.log('WebSocket desconectado manualmente');
    }
  }

  /**
   * Observable para escuchar mensajes del WebSocket
   */
  onMessage(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Envía un mensaje al servidor (opcional, por si necesitas confirmaciones)
   */
  sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket no está conectado. No se puede enviar mensaje.');
    }
  }

  /**
   * Verifica si el WebSocket está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}