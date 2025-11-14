import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListaPlatoPendienteInterface } from '../../services/untils/obtener-listas';
import { ObtenerListas } from '../../services/untils/obtener-listas';
import { Cocina } from '../../services/untils/cocina';
import Swal from 'sweetalert2';
import { PedidoService } from '../../services/mesero/pedido';

import { Subscription } from 'rxjs';

// Importa el servicio WebSocket
import { WebSocketService, WebSocketMessage } from '../../services/untils/web-socket-service';
@Component({
  selector: 'app-temporal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './temporal.html',
  styleUrls: ['./temporal.css'],
})
export class Temporal implements OnInit, OnDestroy {

  listaspendiente: ListaPlatoPendienteInterface[] = [];
  primerPlatillo: ListaPlatoPendienteInterface | null = null;
  cargando = true;

  // 🔥 NUEVO: Suscripción al WebSocket
  private wsSubscription: Subscription | null = null;

  constructor(
    private listasservice: ObtenerListas,
    private cocinaService: Cocina,
    private meseroService: PedidoService,
    // 🔥 NUEVO: Inyectar el servicio WebSocket
    public wsService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.inicializarCocinero();
    this.conectarWebSocket();
  }

  // 🔥 NUEVO: Limpiar la conexión WebSocket al destruir el componente
  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }

  // 🔥 NUEVO: Conectar y escuchar eventos del WebSocket
  conectarWebSocket(): void {
    // Obtener el ID del usuario actual (ajusta según tu lógica de autenticación)
    const userId = this.obtenerIdUsuario();

    // Conectar al WebSocket como "cocina"
    this.wsService.connect('cocina', userId);

    // Escuchar mensajes entrantes
    this.wsSubscription = this.wsService.onMessage().subscribe({
      next: (message: WebSocketMessage) => {
        this.manejarMensajeWebSocket(message);
      },
      error: (err) => {
        console.error('Error en WebSocket:', err);
      }
    });
  }

  // 🔥 NUEVO: Manejar los diferentes tipos de mensajes WebSocket
  manejarMensajeWebSocket(message: WebSocketMessage): void {
    console.log('Mensaje WebSocket recibido:', message);

    switch (message.tipo) {
      case 'nuevo_pedido':
        this.onNuevoPedido(message);
        break;

      case 'actualizacion_pedido':
        this.onActualizacionPedido(message);
        break;

      case 'nuevos_platillos':
        this.onNuevosPlatillos(message);
        break;

      default:
        console.log('Tipo de mensaje no manejado:', message.tipo);
    }
  }

  // 🔥 NUEVO: Cuando llega un nuevo pedido
  onNuevoPedido(message: WebSocketMessage): void {
    console.log('🆕 Nuevo pedido recibido:', message.id_pedido);

    // Mostrar notificación visual
    this.mostrarNotificacion('Nuevo pedido', `Pedido ${message.id_pedido} recibido`);

    // Recargar la lista de pendientes
    this.cargarListaPendientes();
  }

  // 🔥 NUEVO: Cuando se actualiza un pedido existente
  onActualizacionPedido(message: WebSocketMessage): void {
    console.log('🔄 Pedido actualizado:', message.id_pedido);

    this.mostrarNotificacion('Pedido actualizado', `Se agregaron platillos al pedido ${message.id_pedido}`);

    // Recargar la lista
    this.cargarListaPendientes();
  }

  // 🔥 NUEVO: Cuando se agregan nuevos platillos
  onNuevosPlatillos(message: WebSocketMessage): void {
    console.log('🍽️ Nuevos platillos agregados:', message.platillos);

    const cantidad = message.platillos?.length || 0;
    this.mostrarNotificacion(
      'Nuevos platillos',
      `${cantidad} platillo(s) agregado(s) al pedido ${message.id_pedido}`
    );

    // Recargar la lista de pendientes
    this.cargarListaPendientes();
  }

  // 🔥 NUEVO: Mostrar notificación toast
  mostrarNotificacion(titulo: string, mensaje: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: 'info',
      title: titulo,
      text: mensaje,
      iconColor: '#d6b45a'
    });
  }

  // 🔥 NUEVO: Obtener ID del usuario (ajusta según tu auth)
  obtenerIdUsuario(): string {
    // Implementa según tu sistema de autenticación
    // Ejemplo usando localStorage:
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id_usuario || 'unknown';
    }
    return 'cocinero_' + Date.now();
  }

  // ==================== MÉTODOS EXISTENTES ====================

  /** 🔹 Flujo principal: primero verifica si tiene platillo, si no lo tiene carga lista */
  inicializarCocinero(): void {
    this.cargando = true;
    console.log('Verificando si el cocinero ya tiene un platillo asignado...');

    this.cocinaService.check_cocina_platillo().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // ✅ Ya tiene platillo asignado
          const platoActual = data[0];
          console.log('Platillo en curso encontrado:', platoActual);

          // Cargar los datos completos del platillo actual
          this.listasservice.get_lista_platillos_by_id(platoActual.id_detalle).subscribe({
            next: (detalle) => {
              this.primerPlatillo = detalle[0];
              console.log('Detalle del platillo en curso:', this.primerPlatillo);
              this.cargarListaPendientes();
            },
            error: (err) => {
              console.error('Error al cargar detalle del platillo:', err);
              this.cargarListaPendientes();
            },
          });
        } else {
          // 🚫 No tiene platillo, cargamos lista de pendientes y asignamos uno
          console.log('No hay platillo asignado, cargando lista...');
          this.cargarListaPendientes();
        }
      },
      error: (err) => {
        console.error('Error al verificar platillo actual:', err);
        this.cargarListaPendientes();
      },
      complete: () => (this.cargando = false),
    });
  }

  /** 🔹 Carga la lista de platillos pendientes desde el backend */
  cargarListaPendientes(): void {
    this.listasservice.get_lista_platillos_pendientes().subscribe({
      next: (data) => {
        this.listaspendiente = data;
        console.log('Lista de pendientes cargada:', this.listaspendiente);
        this.verificarYTomarPlatillo();
      },
      error: (err) => console.error('Error al cargar lista de cocina:', err),
    });
  }

  /** 🔹 Si no hay platillo activo, toma el primero pendiente */
  verificarYTomarPlatillo(): void {
    if (!this.primerPlatillo && this.listaspendiente.length > 0) {
      const platillo = this.listaspendiente[0];

      console.log('Asignando nuevo platillo al cocinero:', platillo.Nombre_platillo);

      // 1️⃣ Actualiza el estado del platillo a "cocinando"
      this.updatePlatilloEstado(platillo.id_detalle, 'cocinando', platillo);

      // 2️⃣ Actualiza la tabla cocina para asociarlo al cocinero
      this.cocinaService.update_cocina(platillo.id_detalle).subscribe({
        next: () => console.log('Cocina actualizada con nuevo platillo'),
        error: (err) => console.error('Error al actualizar cocina:', err),
      });
    } else if (this.primerPlatillo) {
      console.log('Ya hay un platillo en curso:', this.primerPlatillo.Nombre_platillo);
    } else {
      console.log('No hay platillos pendientes para cocinar.');
    }
  }

  /** 🔹 Actualiza el estado del platillo y lo asigna como el actual */
  updatePlatilloEstado(id_detalle: string, estado: string, platillo: ListaPlatoPendienteInterface): void {
    this.listasservice.update_estado_platillo(id_detalle, estado).subscribe({
      next: () => {
        console.log(`Platillo ${id_detalle} actualizado a estado "${estado}"`);
        this.primerPlatillo = { ...platillo, estado: estado };
        this.listaspendiente = this.listaspendiente.filter(p => p.id_detalle !== id_detalle);
      },
      error: (err) => console.error('Error al actualizar estado del platillo:', err),
    });
  }

  cancelar_pedido(id_detalle?: string, id_pedido?: string, nombre?: string, id_mesa?: string) {
    if (!id_detalle || !id_pedido || !nombre) {
      console.warn("⚠️ No hay platillo seleccionado o los datos están incompletos.");
      return;
    }

    Swal.fire({
      title: `¿Está seguro de que desea quitar: ${nombre}?`,
      text: "Una vez cancelada no se podrá recuperar.",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Quitar platillo",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        if (!id_mesa) {
          this.meseroService.delete_pedidos_entrega(id_detalle, id_pedido).subscribe({
            next: () => {
              Swal.fire({
                title: "Hecho",
                text: "Platillo cancelado",
                icon: "success",
                confirmButtonColor: "#D0AF43",
                iconColor: "#d6b45a"
              });
              this.primerPlatillo = null;
              this.cargarListaPendientes();
            },
            error: (err) => console.error("Error al cancelar pedido:", err),
          });
        } else {
          this.meseroService.delete_pedidos_mesa(id_detalle, id_pedido, id_mesa).subscribe({
            next: () => {
              Swal.fire({
                title: "Hecho",
                text: "Platillo cancelado",
                icon: "success",
                confirmButtonColor: "#D0AF43",
                iconColor: "#d6b45a"
              });
              this.primerPlatillo = null;
              this.cargarListaPendientes();
            },
            error: (err) => console.error("Error al cancelar pedido:", err),
          });
        }
      }
    });
  }

  terminar_plato(estado: string, id_detalle?: string) {
    this.listasservice.update_estado_platillo(id_detalle!, estado).subscribe({
      next: () => {
        console.log(`Platillo ${id_detalle} actualizado a estado "${estado}"`);
        this.primerPlatillo = null;
        this.cargarListaPendientes();
      },
      error: (err) => console.error('Error al actualizar estado del platillo:', err),
    });
  }
}