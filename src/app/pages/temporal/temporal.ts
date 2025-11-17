import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { WebSocketService, WebSocketMessage } from '../../services/untils/web-socket-service';
import { ListaPlatoPendienteInterface, ObtenerListas } from '../../services/untils/obtener-listas';
import { PedidoEntregaInterface, PedidoService } from '../../services/mesero/pedido';


@Component({
  selector: 'app-temporal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './temporal.html',
  styleUrls: ['./temporal.css'],
})
export class Temporal implements OnInit, OnDestroy {
  openedIndex: number | null = null; // Guarda cuál mesa está abierta

  pedidos_absolute: PedidoEntregaInterface[] = [];

  id_pedidoSeleccionado: string = "";
  titularSeleccionado: string = "";
  direccionSeleccionada: string = "";

  cargando = true;

  private wsSubscription?: Subscription;

  constructor(
    public webSocketService: WebSocketService,
    private meseroService: PedidoService
  ) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // this.conectarWebSocket();
    }
    this.get_pedido_mesa_absolute();
  }

  ngOnDestroy(): void {
    // if (this.wsSubscription) {
    //   this.wsSubscription.unsubscribe();
    // }
    // this.webSocketService.disconnect();
  }

  //      Por el momento vamos a desactivar web sockets para diseñar todo

  // conectarWebSocket(): void {
  //   console.log('🔌 Conectando al WebSocket como repartido...');

  //   this.wsSubscription = this.webSocketService.connect('repartidor').subscribe({
  //     next: (mensaje: WebSocketMessage) => {
  //       console.log('📨 Mensaje WebSocket recibido:', mensaje);
  //       this.manejarMensajeWebSocket(mensaje);
  //     },
  //     error: (error) => {
  //       console.error('❌ Error en WebSocket:', error);
  //     }
  //   });
  // }

  // manejarMensajeWebSocket(mensaje: WebSocketMessage): void {
  //   switch (mensaje.tipo) {
  //     case 'nuevo_pedido':
  //       console.log('🆕 Nuevo pedido recibido:', mensaje.id_pedido);
  //       this.mostrarNotificacionNuevoPedido(mensaje);
  //       this.recargarListaPendientes();
  //       break;

  //     case 'platillo_listo':
  //       console.log('✅ Platillo listo:', mensaje.id_detalle);
  //       this.recargarListaPendientes();
  //       break;

  //     case 'platillo_cancelado':
  //       console.log('❌ Platillo cancelado:', mensaje.id_detalle);
  //       if (this.primerPlatillo?.id_detalle === mensaje.id_detalle) {
  //         this.mostrarNotificacionCancelacion(mensaje);
  //         this.primerPlatillo = null;
  //         this.cocinaService.limpiar_cocina().subscribe({
  //           next: () => {
  //             console.log('✅ Cocina limpiada en backend');
  //             this.recargarListaPendientes();
  //           },
  //           error: (err) => console.error('❌ Error al limpiar cocina:', err),

  //         });
  //       }
  //       this.recargarListaPendientes();
  //       break;

  //     case 'pedido_cancelado':
  //       console.log('❌ Pedido cancelado completo:', mensaje.id_pedido);
  //       if (this.primerPlatillo?.id_pedido === mensaje.id_pedido) {
  //         this.primerPlatillo = null;
  //         this.mostrarNotificacionCancelacion(mensaje);

  //         this.cocinaService.limpiar_cocina().subscribe({
  //           next: () => {
  //             console.log('✅ Cocina limpiada en backend');
  //             this.recargarListaPendientes();
  //           },
  //           error: (err) => console.error('❌ Error al limpiar cocina:', err),

  //         });
  //       }
  //       this.recargarListaPendientes();
  //       break;

  //     case 'conexion_exitosa':
  //       console.log('✅ Conexión WebSocket exitosa:', mensaje.mensaje);
  //       break;

  //     case 'pong':
  //       break;

  //     default:
  //       console.log('📩 Mensaje no manejado:', mensaje);
  //   }
  // }

  // mostrarNotificacionCancelacion(mensaje: WebSocketMessage): void {
  //   let pedido = "";
  //   if (mensaje.id_detalle) {
  //     pedido = mensaje.id_detalle
  //   } else if (mensaje.id_pedido) {
  //     pedido = mensaje.id_pedido
  //   }
  //   Swal.fire({
  //     title: '❌ Platillo Cancelado',
  //     html: `
  //       <p><strong>Platillo:</strong> ${pedido}</p>
  //       <p>El platillo que estabas preparando ha sido cancelado.</p>
  //     `,
  //     icon: 'warning',
  //     iconColor: '#ffc107',
  //     confirmButtonColor: '#D0AF43',
  //     timer: 5000,
  //     timerProgressBar: true,
  //     toast: true,
  //     position: 'top-end',
  //     showConfirmButton: true
  //   });
  //   this.reproducirSonidoNotificacion("cancelar");

  // }

  // mostrarNotificacionNuevoPedido(mensaje: WebSocketMessage): void {
  //   const platillos = mensaje.platillos || [];
  //   const cantidad = platillos.length;

  //   Swal.fire({
  //     title: '🔔 Nuevo Pedido',
  //     html: `
  //       <p><strong>Pedido:</strong> ${mensaje.id_pedido?.substring(0, 8)}...</p>
  //       <p><strong>Tipo:</strong> ${mensaje.tipo_pedido}</p>
  //       ${mensaje.id_mesa ? `<p><strong>Mesa:</strong> ${mensaje.nombre_mesa || mensaje.id_mesa}</p>` : ''}
  //       <p><strong>Platillos:</strong> ${cantidad}</p>
  //     `,
  //     icon: 'info',
  //     iconColor: '#d6b45a',
  //     confirmButtonColor: '#D0AF43',
  //     timer: 5000,
  //     timerProgressBar: true,
  //     toast: true,
  //     position: 'top-end',
  //     showConfirmButton: false
  //   });

  //   this.reproducirSonidoNotificacion("");
  // }

  // reproducirSonidoNotificacion(action: string): void {
  //   try {
  //     let audio = new Audio('sistema/sounds/notificacion.mp3');
  //     if (action === 'cancelar') {
  //       audio = new Audio('sistema/sounds/cancelacion.mp3');
  //     }
  //     audio.volume = 0.5;
  //     audio.play().catch(err => console.log('No se pudo reproducir el sonido:', err));
  //   } catch (error) {
  //     console.log('Error al reproducir sonido:', error);
  //   }
  // }



  // // 🔥 CORREGIDO: Recarga sin resetear platillo actual
  // recargarListaPendientes(): void {
  //   console.log('🔄 Recargando lista de platillos pendientes...');

  //   this.listasservice.get_lista_platillos_pendientes().subscribe({
  //     next: (data) => {
  //       // 🔥 Filtrar el platillo actual de la lista pendiente
  //       if (this.primerPlatillo) {
  //         this.listaspendiente = data.filter(
  //           p => p.id_detalle !== this.primerPlatillo!.id_detalle
  //         );
  //       } else {
  //         this.listaspendiente = data;
  //       }

  //       console.log('✅ Lista actualizada:', this.listaspendiente.length, 'platillos pendientes');

  //       // Si no hay platillo actual y hay pendientes, asignar uno
  //       if (!this.primerPlatillo && this.listaspendiente.length > 0) {
  //         this.verificarYTomarPlatillo();
  //       }
  //     },
  //     error: (err) => console.error('❌ Error al recargar lista:', err)
  //   });
  // }

  // ==================== MÉTODOS DE INICIALIZACIÓN ====================

  get_pedido_mesa_absolute() {
    this.meseroService.get_pedidos_mesa_absolute().subscribe(data => {
      // console.log(JSON.stringify(data, null, 2));
      this.pedidos_absolute = [...data]; // 👈 esto sí fuerza el render sin conflictos
    });
  }


  // ======================Metodos generales ==========================
  toggleMapa(index: number) {
    this.openedIndex = this.openedIndex === index ? null : index;
  }

  selectedPedido: any = null;
  mostrarModal: boolean = false;

  abrirModalPedido(pedido: any) {
    this.selectedPedido = pedido;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.selectedPedido = null;
  }

  seleccionar_que_cancelar() {
    Swal.fire({
      title: `¿Qué desea cancelar?`,
      html: "Puede: <br>Cancelar la ruta actual  y cambiar de pedido <br>ó<br>Cancelar el pedido",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      showDenyButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      denyButtonColor: "#8B5E3C",
      confirmButtonText: "Cancelar la ruta y cambiar el pedido",
      cancelButtonText: "Cancelar",
      denyButtonText: "Cancelar el pedido"
    }).then((result) => {
      if (result.isConfirmed) {

      } if (result.isDenied) {
      }
    });
  }

  pedido_seleccionado(id_pedido: string, titular: string, direccion_completa: string) {
    // Primero las limpiamos por si quedo residuo de una seleccion anterior
    this.direccionSeleccionada = "";
    this.id_pedidoSeleccionado = "";
    this.titularSeleccionado = "";
    // y ya despues ps le damos sus valores 
    this.id_pedidoSeleccionado = id_pedido;
    this.titularSeleccionado = titular;
    this.direccionSeleccionada = direccion_completa;

    //y despues cerramos el modal
    this.cerrarModal();
  }

  cancelar_pedido_entrega(var22: string, var2: string, var3: string) {

  }

  cancelar_todo_pedido_entrega(var22: string, var3: string) {

  }

}