import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Importa el servicio WebSocket
import { WebSocketService, WebSocketMessage } from '../../services/untils/web-socket-service';
import { ListaPlatoPendienteInterface, ObtenerListas } from '../../services/untils/obtener-listas';
import { Cocina } from '../../services/untils/cocina';
import { PedidoService } from '../../services/mesero/pedido';

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

  // 🔥 Suscripción al WebSocket
  private wsSubscription?: Subscription;

  constructor(
    private listasservice: ObtenerListas,
    private cocinaService: Cocina,
    private meseroService: PedidoService,
    public webSocketService: WebSocketService // 🔥 Inyectar servicio WebSocket
  ) { }

  ngOnInit(): void {
    // Solo conectar WebSocket en el navegador (no en SSR)
    if (typeof window !== 'undefined') {
      this.inicializarCocinero();
      this.conectarWebSocket(); // 🔥 Conectar al WebSocket
    }
  }

  ngOnDestroy(): void {
    // 🔥 Desconectar WebSocket al destruir el componente
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

  // Método conectarWebSocket actualizado para Cocineros
  conectarWebSocket(): void {
    console.log('🔌 Conectando al WebSocket como cocinero...');

    this.wsSubscription = this.webSocketService.connect('cocineros').subscribe({
      next: (mensaje: WebSocketMessage) => {
        console.log('📨 Mensaje WebSocket recibido:', mensaje);
        this.manejarMensajeWebSocket(mensaje);
      },
      error: (error) => {
        console.error('❌ Error en WebSocket:', error);
      }
    });

    // ❌ ELIMINAR ESTE INTERVALO - Ya lo maneja el servicio automáticamente
    // setInterval(() => { ... }, 30000);
  }

  // 🔥 Manejar diferentes tipos de mensajes WebSocket
  manejarMensajeWebSocket(mensaje: WebSocketMessage): void {
    switch (mensaje.tipo) {
      case 'nuevo_pedido':
        console.log('🆕 Nuevo pedido recibido:', mensaje.id_pedido);
        this.mostrarNotificacionNuevoPedido(mensaje);
        this.recargarListaPendientes(); // 🔥 Recargar la lista automáticamente
        break;

      case 'platillo_cancelado':
        console.log('❌ Platillo cancelado:', mensaje.id_detalle);
        // Si es el platillo actual, liberarlo
        if (this.primerPlatillo?.id_detalle === mensaje.id_detalle) {
          this.mostrarNotificacionCancelacion(mensaje);
          this.primerPlatillo = null;
          this.recargarListaPendientes();
        }
        break;

      case 'pedido_cancelado':
        console.log('❌ Pedido cancelado completo:', mensaje.id_pedido);
        // Verificar si el platillo actual pertenece a este pedido
        if (this.primerPlatillo?.id_pedido === mensaje.id_pedido) {
          this.primerPlatillo = null;
        }
        this.recargarListaPendientes();
        break;

      case 'conexion_exitosa':
        console.log('✅ Conexión WebSocket exitosa:', mensaje.mensaje);
        break;

      case 'pong':
        // No hacer nada, es solo para mantener la conexión
        break;

      default:
        console.log('📩 Mensaje no manejado:', mensaje);
    }
  }

  // 🔥 NUEVO: Notificación de cancelación
  mostrarNotificacionCancelacion(mensaje: WebSocketMessage): void {
    Swal.fire({
      title: '❌ Platillo Cancelado',
      html: `
      <p><strong>Platillo:</strong> ${mensaje.nombre_platillo}</p>
      <p>El platillo que estabas preparando ha sido cancelado.</p>
    `,
      icon: 'warning',
      iconColor: '#ffc107',
      confirmButtonColor: '#D0AF43',
      timer: 5000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: true
    });
  }

  // 🔥 Mostrar notificación de nuevo pedido
  mostrarNotificacionNuevoPedido(mensaje: WebSocketMessage): void {
    const platillos = mensaje.platillos || [];
    const cantidad = platillos.length;

    Swal.fire({
      title: '🔔 Nuevo Pedido',
      html: `
      <p><strong>Pedido:</strong> ${mensaje.id_pedido?.substring(0, 8)}...</p>
      <p><strong>Tipo:</strong> ${mensaje.tipo_pedido}</p>
      ${mensaje.id_mesa ? `<p><strong>Mesa:</strong> ${mensaje.nombre_mesa || mensaje.id_mesa}</p>` : ''}
      <p><strong>Platillos:</strong> ${cantidad}</p>
    `,
      icon: 'info',
      iconColor: '#d6b45a',
      confirmButtonColor: '#D0AF43',
      timer: 5000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false
    });

    this.reproducirSonidoNotificacion();
  }

  // 🔥 Reproducir sonido de notificación
  reproducirSonidoNotificacion(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('No se pudo reproducir el sonido:', err));
    } catch (error) {
      console.log('Error al reproducir sonido:', error);
    }
  }

  // 🔥 Recargar lista de pendientes sin resetear el platillo actual
  recargarListaPendientes(): void {
    console.log('🔄 Recargando lista de platillos pendientes...');

    this.listasservice.get_lista_platillos_pendientes().subscribe({
      next: (data) => {
        this.listaspendiente = data;
        console.log('✅ Lista actualizada:', this.listaspendiente.length, 'platillos');

        // Si no hay platillo actual, asignar uno automáticamente
        if (!this.primerPlatillo && this.listaspendiente.length > 0) {
          this.verificarYTomarPlatillo();
        }
      },
      error: (err) => console.error('Error al recargar lista:', err)
    });
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
              this.cocinaService.limpiar_cocina().subscribe({
                next: () => console.log('Cocina limpiada'),
                error: (err) => console.error('Error al actualizar cocina:', err),
              });
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
              this.cocinaService.limpiar_cocina().subscribe({
                next: () => console.log('Cocina limpiada'),
                error: (err) => console.error('Error al actualizar cocina:', err),
              });
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
        this.cocinaService.limpiar_cocina().subscribe({
          next: () => console.log('Cocina limpiada'),
          error: (err) => console.error('Error al actualizar cocina:', err),
        });
        this.cargarListaPendientes();
      },
      error: (err) => console.error('Error al actualizar estado del platillo:', err),
    });
  }
}