import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { retryWhen, tap, delayWhen } from 'rxjs/operators';

export interface WebSocketMessage {
  tipo: string;
  id_pedido?: string;
  tipo_pedido?: string;
  id_mesa?: string;
  platillos?: any[];
  timestamp?: string;
  mensaje?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 segundos

  // Cambia esta URL según tu configuración
  private wsUrl = 'ws://localhost:8000/ws/connect';

  constructor() { }

  /**
   * Conecta al servidor WebSocket
   * @param userType Tipo de usuario: 'cocineros', 'meseros', 'admin'
   */
  connect(userType: string): Observable<WebSocketMessage> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return this.messageSubject.asObservable();
    }

    const url = `${this.wsUrl}?user_type=${userType}`;
    console.log(`Conectando a WebSocket: ${url}`);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = (event) => {
        console.log('✅ WebSocket conectado exitosamente');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Mensaje recibido:', message);
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Error al parsear mensaje WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket desconectado');
        this.socket = null;

        // Intentar reconectar automáticamente
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(userType), this.reconnectInterval);
        } else {
          console.error('❌ Máximo de intentos de reconexión alcanzado');
        }
      };

    } catch (error) {
      console.error('Error al crear WebSocket:', error);
    }

    return this.messageSubject.asObservable();
  }

  /**
   * Envía un mensaje al servidor
   */
  sendMessage(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('📤 Mensaje enviado:', message);
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log('WebSocket desconectado manualmente');
    }
  }

  /**
   * Verifica si el WebSocket está conectado
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Envía un ping para mantener la conexión activa
   */
  sendPing(): void {
    this.sendMessage({
      tipo: 'ping',
      timestamp: new Date().toISOString()
    });
  }
}