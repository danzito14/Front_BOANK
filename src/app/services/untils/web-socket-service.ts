import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environments';

export interface WebSocketMessage {
  tipo: string;
  id_detalle?: string;
  id_pedido?: string;
  nombre_platillo?: string;
  tipo_pedido?: string;
  id_mesa?: string;
  nombre_mesa?: string;
  platillos?: any[];
  timestamp?: string;
  mensaje?: string;
  conexiones_activas?: number;
  [key: string]: any;
}

interface WebSocketConnection {
  socket: WebSocket;
  userType: string;
  reconnectAttempts: number;
  pingInterval?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  // Mapa de conexiones activas por tipo de usuario
  private connections = new Map<string, WebSocketConnection>();

  // Subject para mensajes de todos los tipos de usuario
  private messageSubject = new Subject<WebSocketMessage>();

  // Subject para el estado de conexión por tipo de usuario
  private connectionStatusSubject = new BehaviorSubject<Map<string, boolean>>(new Map());

  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private apiUrlserve = environment.apiUrl;

  // private wsUrl = 'ws://localhost:8000/ws/connect';
  private wsUrl = `${this.apiUrlserve}/ws/connect`;
  messages$: any;

  constructor() {
    console.log('🔧 WebSocketService inicializado');
  }

  /**
   * Conecta al servidor WebSocket para un tipo de usuario específico
   * @param userType Tipo de usuario: 'cocineros', 'meseros', 'admin', 'repartidor'
   */
  connect(userType: string): Observable<WebSocketMessage> {
    // Si ya existe una conexión activa para este tipo, retornar el observable filtrado
    if (this.isConnected(userType)) {
      console.log(`✅ Ya existe conexión activa para: ${userType}`);
      return this.getMessagesForUserType(userType);
    }

    const url = `${this.wsUrl}?user_type=${userType}`;
    console.log(`🔌 Conectando WebSocket para ${userType}: ${url}`);

    try {
      const socket = new WebSocket(url);

      // Crear conexión en el mapa
      const connection: WebSocketConnection = {
        socket,
        userType,
        reconnectAttempts: 0
      };
      this.connections.set(userType, connection);

      socket.onopen = (event) => {
        console.log(`✅ WebSocket conectado exitosamente para: ${userType}`);
        connection.reconnectAttempts = 0;
        this.updateConnectionStatus(userType, true);
        this.startPingInterval(userType);
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log(`📨 [${userType}] Mensaje recibido:`, message);

          // Agregar el userType al mensaje para poder filtrarlo después
          // Agregar el userType al mensaje para poder filtrarlo después
          message['_userType'] = userType;

          // Emitir el mensaje a todos los suscriptores
          this.messageSubject.next(message);
        } catch (error) {
          console.error(`❌ [${userType}] Error al parsear mensaje:`, error);
        }
      };

      socket.onerror = (error) => {
        console.error(`❌ [${userType}] Error en WebSocket:`, error);
        this.updateConnectionStatus(userType, false);
      };

      socket.onclose = (event) => {
        console.log(`🔌 [${userType}] WebSocket desconectado`);
        this.updateConnectionStatus(userType, false);
        this.stopPingInterval(userType);

        // Intentar reconectar automáticamente
        if (connection.reconnectAttempts < this.maxReconnectAttempts) {
          connection.reconnectAttempts++;
          console.log(`🔄 [${userType}] Reintentando (${connection.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connections.delete(userType);
            this.connect(userType).subscribe(); // Reconectar
          }, this.reconnectInterval);
        } else {
          console.error(`❌ [${userType}] Máximo de intentos alcanzado`);
          this.connections.delete(userType);
        }
      };

    } catch (error) {
      console.error(`❌ [${userType}] Error al crear WebSocket:`, error);
      this.updateConnectionStatus(userType, false);
    }

    return this.getMessagesForUserType(userType);
  }

  /**
   * Obtiene un observable filtrado de mensajes para un tipo de usuario específico
   */
  private getMessagesForUserType(userType: string): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable().pipe(
      filter(msg => {
        // Filtrar mensajes que no sean de sistema (ping/pong)
        if (msg.tipo === 'pong' || msg.tipo === 'ping') {
          return msg['_userType'] === userType;
        }
        // Los mensajes de broadcast se envían a todos
        return true;
      })
    );
  }

  /**
   * Envía un mensaje al servidor para un tipo de usuario específico
   */
  sendMessage(message: WebSocketMessage, userType: string): void {
    const connection = this.connections.get(userType);

    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
      console.log(`📤 [${userType}] Mensaje enviado:`, message);
    } else {
      console.warn(`⚠️ [${userType}] WebSocket no está conectado`);
    }
  }

  /**
   * Desconecta el WebSocket para un tipo de usuario específico
   */
  disconnect(userType?: string): void {
    if (userType) {
      // Desconectar un tipo específico
      const connection = this.connections.get(userType);
      if (connection) {
        this.stopPingInterval(userType);
        connection.socket.close();
        this.connections.delete(userType);
        this.updateConnectionStatus(userType, false);
        console.log(`🔌 [${userType}] WebSocket desconectado manualmente`);
      }
    } else {
      // Desconectar todos
      console.log('🔌 Desconectando todas las conexiones WebSocket...');
      this.connections.forEach((connection, type) => {
        this.disconnect(type);
      });
    }
  }

  /**
   * Verifica si el WebSocket está conectado para un tipo de usuario
   */
  isConnected(userType: string): boolean {
    const connection = this.connections.get(userType);
    return connection !== undefined &&
      connection.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Observable del estado de conexión
   */
  get connectionStatus$(): Observable<Map<string, boolean>> {
    return this.connectionStatusSubject.asObservable();
  }

  /**
   * Obtiene el estado de conexión para un tipo específico
   */
  getConnectionStatus(userType: string): boolean {
    return this.connectionStatusSubject.value.get(userType) || false;
  }

  /**
   * Actualiza el estado de conexión
   */
  private updateConnectionStatus(userType: string, connected: boolean): void {
    const currentStatus = this.connectionStatusSubject.value;
    currentStatus.set(userType, connected);
    this.connectionStatusSubject.next(new Map(currentStatus));
  }

  /**
   * Envía un ping para mantener la conexión activa
   */
  sendPing(userType: string): void {
    this.sendMessage({
      tipo: 'ping',
      timestamp: new Date().toISOString()
    }, userType);
  }

  /**
   * Inicia el intervalo de ping para un tipo de usuario
   */
  private startPingInterval(userType: string): void {
    this.stopPingInterval(userType);

    const connection = this.connections.get(userType);
    if (connection) {
      connection.pingInterval = setInterval(() => {
        if (this.isConnected(userType)) {
          this.sendPing(userType);
        }
      }, 30000); // Cada 30 segundos

      console.log(`🏓 [${userType}] Ping interval iniciado`);
    }
  }

  /**
   * Detiene el intervalo de ping para un tipo de usuario
   */
  private stopPingInterval(userType: string): void {
    const connection = this.connections.get(userType);
    if (connection && connection.pingInterval) {
      clearInterval(connection.pingInterval);
      connection.pingInterval = undefined;
      console.log(`🏓 [${userType}] Ping interval detenido`);
    }
  }

  /**
   * Obtiene el número de conexiones activas
   */
  getActiveConnectionsCount(): number {
    return Array.from(this.connections.values())
      .filter(conn => conn.socket.readyState === WebSocket.OPEN)
      .length;
  }

  /**
   * Obtiene información de debug
   */
  getDebugInfo(): any {
    return {
      totalConnections: this.connections.size,
      activeConnections: this.getActiveConnectionsCount(),
      connections: Array.from(this.connections.entries()).map(([type, conn]) => ({
        userType: type,
        connected: conn.socket.readyState === WebSocket.OPEN,
        reconnectAttempts: conn.reconnectAttempts
      }))
    };
  }
}