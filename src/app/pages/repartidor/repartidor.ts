import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { WebSocketService, WebSocketMessage } from '../../services/untils/web-socket-service';
import { PedidoEntregaInterface, PedidoService } from '../../services/mesero/pedido';

import { RepartidorService, RepartidorInfo } from '../../services/repartidor/repartidor';
import { Mapa, RutaInfo } from "../../components/mapa/mapa";


@Component({
  selector: 'app-repartidor',
  imports: [CommonModule, FormsModule, Mapa],
  templateUrl: './repartidor.html',
  styleUrl: './repartidor.css',
})
export class Repartidor implements OnInit, OnDestroy {
  openedIndex: number | null = null;

  // Datos del repartidor
  pedidos_disponibles: PedidoEntregaInterface[] = [];
  pedido_actual: PedidoEntregaInterface | null = null;
  repartidorInfo: RepartidorInfo | null = null;

  // Selección de pedido
  id_pedidoSeleccionado: string = "";
  forma_pagoSeleccionado: string = "";
  titularSeleccionado: string = "";
  direccionSeleccionada: string = "";

  // Estado UI
  cargando = true;
  enRuta = false;

  // Modal
  selectedPedido: PedidoEntregaInterface | null = null;
  mostrarModal: boolean = false;

  // WebSocket
  private wsSubscription?: Subscription;
  conectadoWS = false;


  distanciaActual = "";
  duracionActual = "";


  constructor(
    public webSocketService: WebSocketService,
    private pedidoService: PedidoService,
    private repartidorService: RepartidorService
  ) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.conectarWebSocket();
      this.cargarRepartidorInfo();
    }
    this.cargarPedidosDisponibles();
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect('repartidor');
  }

  // ==================== WEBSOCKET ====================

  conectarWebSocket(): void {
    console.log('🔌 Conectando al WebSocket como repartidor...');

    this.wsSubscription = this.webSocketService.connect('repartidor').subscribe({
      next: (mensaje: WebSocketMessage) => {
        console.log('📨 Mensaje WebSocket recibido en Repartidor:', mensaje);
        this.manejarMensajeWebSocket(mensaje);
      },
      error: (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.conectadoWS = false;
      }
    });

    // Verificar conexión después de 1 segundo
    setTimeout(() => {
      this.conectadoWS = this.webSocketService.isConnected('repartidor');
      console.log(`🔌 Estado conexión: ${this.conectadoWS ? '✅ Conectado' : '❌ Desconectado'}`);
    }, 1000);
  }

  manejarMensajeWebSocket(mensaje: WebSocketMessage): void {
    switch (mensaje.tipo) {
      case 'nuevo_pedido_asignado':
        console.log('🆕 Nuevo pedido asignado:', mensaje.id_pedido);
        this.mostrarNotificacionNuevoPedido(mensaje);
        this.cargarPedidosDisponibles();
        this.cargarRepartidorInfo();
        break;

      case 'pedido_cancelado':
        console.log('❌ Pedido cancelado:', mensaje.id_pedido);
        if (this.pedido_actual?.id_pedido === mensaje.id_pedido) {
          this.mostrarNotificacionCancelacion(mensaje);
          this.limpiarRutaActual();
          this.repartidorService.limpiar_repartidor().subscribe();
        }
        this.cargarPedidosDisponibles();
        break;

      case 'platillo_cancelado':
        console.log('❌ Platillo cancelado en pedido:', mensaje.id_pedido);
        this.cargarPedidosDisponibles();
        break;

      case 'conexion_exitosa':
        console.log('✅ Conexión WebSocket exitosa:', mensaje.mensaje);
        this.conectadoWS = true;
        break;

      case 'pong':
        // Respuesta al ping, no hacer nada
        break;

      default:
        console.log('📩 Mensaje no manejado:', mensaje);
    }
  }

  mostrarNotificacionNuevoPedido(mensaje: WebSocketMessage): void {

    Swal.fire({
      title: '🎉 Nuevo Pedido Asignado',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p>Precione el boton para ver los detalles </p>
            </div>
      `,
      icon: 'success',
      iconColor: '#d6b45a',
      confirmButtonColor: '#D0AF43',
      timer: 8000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: true,
      confirmButtonText: 'Ver pedido'
    }).then((result) => {
      if (result.isConfirmed) {
        // Buscar el pedido y mostrarlo
        const pedido = this.pedidos_disponibles.find(p => p.id_pedido === mensaje.id_pedido);
        if (pedido) {
          this.abrirModalPedido(pedido);
        }
      }
    });

    this.reproducirSonidoNotificacion('nuevo');
  }

  mostrarNotificacionCancelacion(mensaje: WebSocketMessage): void {

    Swal.fire({
      title: '❌ Pedido Cancelado',
      html: `
        <p>El pedido <strong>${mensaje}...</strong> ha sido cancelado.</p>
        <p>Por favor, selecciona un nuevo pedido.</p>
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

    this.reproducirSonidoNotificacion('cancelar');
  }

  reproducirSonidoNotificacion(action: string): void {
    try {
      let audio = new Audio('sistema/sounds/notificacion.mp3');
      if (action === 'cancelar') {
        audio = new Audio('sistema/sounds/cancelacion.mp3');
      } else if (action === 'nuevo') {
        audio = new Audio('sistema/sounds/notificacion.mp3');
      }
      audio.volume = 0.5;
      audio.play().catch(err => console.log('No se pudo reproducir el sonido:', err));
    } catch (error) {
      console.log('Error al reproducir sonido:', error);
    }
  }

  // ==================== CARGA DE DATOS ====================

  cargarPedidosDisponibles(): void {
    this.cargando = true;
    this.pedidoService.gets_pedidos_repartidor().subscribe({
      next: (data) => {
        // Filtrar solo pedidos listos o en camino
        this.pedidos_disponibles = data.filter(p =>
          p.estado_pedido === 'Listo' || p.estado_pedido === 'En camino'
        );
        console.log('✅ Pedidos disponibles cargados:', this.pedidos_disponibles.length);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar pedidos:', err);
        this.cargando = false;
      }
    });
  }

  cargarRepartidorInfo(): void {

    this.repartidorService.obtenerInfoRepartidor().subscribe({
      next: (info) => {
        if (info.id_pedido) { this.cargar_info_anterior(info.id_pedido) }
        this.repartidorInfo = info;
        this.enRuta = info.en_ruta;
      },
      error: (err) => {
        console.error('❌ Error al cargar info repartidor:', err);
      }
    });

  }


  cargar_info_anterior(id_pedido: string) {
    console.log("Tiene pedido asignado ya");
    this.pedidoService.gets_pedido_by_id_for_repartidor(id_pedido).subscribe({
      next: (data) => {
        const pedido = data[0];
        console.table(pedido);
        this.id_pedidoSeleccionado = pedido.id_pedido;
        this.forma_pagoSeleccionado = pedido.forma_pago;
        this.titularSeleccionado = pedido.nombre_completo;
        this.direccionSeleccionada = pedido.direccion_completa;
        this.pedido_actual = pedido;
      }
    });
  }

  // ==================== ACCIONES DE PEDIDO ====================

  pedido_seleccionado(pedido: PedidoEntregaInterface): void {
    this.id_pedidoSeleccionado = pedido.id_pedido;
    this.forma_pagoSeleccionado = pedido.forma_pago;
    this.titularSeleccionado = pedido.nombre_completo;
    this.direccionSeleccionada = pedido.direccion_completa;
    this.pedido_actual = pedido;

    this.repartidorService.limpiar_repartidor().subscribe();
    this.repartidorService.asignar_pedido_repartidor(pedido.id_pedido).subscribe();
    this.cerrarModal();

    Swal.fire({
      title: 'Pedido Seleccionado',
      text: `Has seleccionado el pedido de ${pedido.nombre_completo}`,
      icon: 'success',
      iconColor: '#d6b45a',
      confirmButtonColor: '#D0AF43',
      timer: 2000,
      showConfirmButton: false
    });
  }

  iniciarEntrega(): void {
    if (!this.pedido_actual) {
      Swal.fire({
        title: 'Selecciona un pedido',
        text: 'Primero debes seleccionar un pedido para iniciar la entrega',
        icon: 'warning',
        iconColor: '#d6b45a',
        confirmButtonColor: '#D0AF43'
      });
      return;
    }

    Swal.fire({
      title: '¿Iniciar entrega?',
      html: `
        <p>Cliente: <strong>${this.titularSeleccionado}</strong></p>
        <p>Dirección: <strong>${this.direccionSeleccionada}</strong></p>
      `,
      icon: 'question',
      iconColor: '#d6b45a',
      showCancelButton: true,
      confirmButtonColor: '#D0AF43',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Iniciar entrega',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.enRuta = true;

        // Aquí puedes agregar lógica para abrir Google Maps
        this.abrirGoogleMaps(this.direccionSeleccionada);

        Swal.fire({
          title: '🚗 Entrega iniciada',
          text: 'Buena suerte con la entrega',
          icon: 'success',
          iconColor: '#d6b45a',
          confirmButtonColor: '#D0AF43',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  marcarComoEntregado(id_pedido: string, forma_pago: string): void {
    if (!this.pedido_actual || !this.repartidorInfo) {
      return;
    }

    Swal.fire({
      title: '¿Marcar como entregado?',
      text: '¿Confirmaste la entrega del pedido y su pago?',
      icon: 'question',
      iconColor: '#d6b45a',
      showCancelButton: true,
      confirmButtonColor: '#D0AF43',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, entregado',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log(id_pedido);
        console.log(forma_pago);
        let referencia_pago = "";
        if (forma_pago === 'Efectivo') {
          referencia_pago = 'Pago en efectivo';
        } else {
          // simulamos número de transacción o referencia bancaria
          referencia_pago = `REF-${Math.floor(Math.random() * 1000000)}`;
        }
        this.pedidoService.generar_pago(
          id_pedido,
          forma_pago,
          referencia_pago
        ).subscribe({
          next: (res: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Pago realizado con éxito',
              text: `Referencia: ${referencia_pago}`,
              confirmButtonColor: '#D0AF43',
              iconColor: '#D0AF43'
            });
            this.limpiarRutaActual();
            this.cargarPedidosDisponibles();
            this.cargarRepartidorInfo();

          },
          error: (err) => {
            console.error('Error al marcar entregado:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo marcar como entregado',
              icon: 'error',
              confirmButtonColor: '#D0AF43'
            });
          }
        });
      }


    });
  }

  seleccionar_que_cancelar(): void {
    Swal.fire({
      title: `¿Qué desea cancelar?`,
      html: "Puede: <br>Cancelar la ruta actual y cambiar de pedido <br>ó<br>Cancelar el pedido completamente",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      showDenyButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      denyButtonColor: "#8B5E3C",
      confirmButtonText: "Cancelar ruta y cambiar",
      cancelButtonText: "Volver",
      denyButtonText: "Cancelar pedido completo"
    }).then((result) => {
      if (result.isConfirmed) {
        // Solo limpiar la ruta actual
        this.limpiarRutaActual();
      } else if (result.isDenied && this.pedido_actual) {
        // Cancelar pedido completo
        this.cancelar_todo_pedido_entrega(
          this.pedido_actual.id_pedido,
          this.pedido_actual.nombre_completo
        );
      }
    });
  }

  limpiarRutaActual(): void {
    this.pedido_actual = null;
    this.id_pedidoSeleccionado = "";
    this.forma_pagoSeleccionado = "";
    this.titularSeleccionado = "";
    this.direccionSeleccionada = "";
    this.enRuta = false;
    this.repartidorService.limpiar_repartidor().subscribe();
  }



  // ==================== MODAL ====================

  abrirModalPedido(pedido: PedidoEntregaInterface): void {
    this.selectedPedido = pedido;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.selectedPedido = null;
  }

  // ==================== CANCELACIONES ====================

  cancelar_pedido_entrega(id_detalle: string, id_pedido: string, nombre: string): void {
    Swal.fire({
      title: `¿Quitar ${nombre}?`,
      text: "Una vez cancelado no se podrá recuperar",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Quitar platillo",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.delete_pedidos_entrega(id_detalle, id_pedido)
          .subscribe({
            next: () => {
              Swal.fire({
                title: "Hecho",
                text: "Platillo cancelado",
                icon: "success",
                confirmButtonColor: "#D0AF43",
                iconColor: "#d6b45a"
              });
              this.cargarPedidosDisponibles();
            },
            error: (err) => {
              console.error('Error:', err);
              Swal.fire({
                title: "Error",
                text: "No se pudo cancelar el platillo",
                icon: "error",
                confirmButtonColor: "#D0AF43"
              });
            }
          });
      }
    });
  }

  cancelar_todo_pedido_entrega(id_pedido: string, nombre: string): void {
    Swal.fire({
      title: `¿Cancelar pedido de ${nombre}?`,
      text: "Una vez cancelado no se podrá recuperar",
      icon: "warning",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Cancelar pedido",
      cancelButtonText: "Volver",
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.cancelar_pedido_entrega(id_pedido)
          .subscribe({
            next: () => {
              Swal.fire({
                title: "Hecho",
                text: "Pedido cancelado",
                icon: "success",
                confirmButtonColor: "#D0AF43",
                iconColor: "#d6b45a"
              });

              if (this.pedido_actual?.id_pedido === id_pedido) {
                this.limpiarRutaActual();
              }

              this.cargarPedidosDisponibles();
            },
            error: (err) => {
              console.error('Error:', err);
              Swal.fire({
                title: "Error",
                text: "No se pudo cancelar el pedido",
                icon: "error",
                confirmButtonColor: "#D0AF43"
              });
            }
          });
      }
    });
  }

  // ==================== UTILS ====================

  toggleMapa(index: number): void {
    this.openedIndex = this.openedIndex === index ? null : index;
  }

  abrirGoogleMaps(direccion: string): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(direccion)}`;
    window.open(url, '_blank');
  }

  getIdUsuarioFromToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('id_usuario');
  }


  // Método opcional para manejar toda la info
  onRutaActualizada(info: RutaInfo): void {
    console.log('Ruta actualizada:', info);
    // Puedes usar info.distanciaMetros y info.duracionSegundos 
    // para cálculos (ej: mostrar alerta si está muy lejos)
  }

  // ==================== FORMATEO ====================

  formatEstado(estado: string): string {
    return estado.replace(/\s+/g, '');
  }

  obtenerColorEstado(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'Listo': '#578ead',
      'En camino': '#089c84',
      'Preparando': '#8b5e3c',
      'Entregado': '#d6b45a'
    };
    return estadoMap[estado] || '#gray';
  }
}