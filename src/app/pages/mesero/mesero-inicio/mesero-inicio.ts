import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { interval, map, Subscription } from 'rxjs';
import { FormsModule } from "@angular/forms";
import { MesasInterface, NombreEmpleadoInterface, PedidoService } from '../../../services/mesero/pedido';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { UntilsPedido } from '../../../services/untils/untils-pedido';
import { CarritoService } from '../../../services/carrito/carrito';
import { ListaPlatoPendienteInterface, ObtenerListas } from '../../../services/untils/obtener-listas';
import { WebSocketService, WebSocketMessage } from '../../../services/untils/web-socket-service';
import { ProductosService } from '../../../services/home/productos-service';

@Component({
  selector: 'app-mesero-inicio',
  imports: [CommonModule, FormsModule],
  templateUrl: './mesero-inicio.html',
  styleUrl: './mesero-inicio.css',
})
export class MeseroInicio implements OnInit, OnDestroy {

  mesas$: MesasInterface[] = [];
  empleado_puesto_nombre: any = null;

  hora$ = interval(1000).pipe(
    map(() => new Date().toLocaleTimeString('es-MX', { hour12: false }))
  );

  mesaSeleccionada: string = "";
  id_mesa: string = "";
  Estado_mesa: string = "";
  id_pedido: string = "";

  listasListos: ListaPlatoPendienteInterface[] = [];

  // WebSocket
  private wsSubscription: Subscription | null = null;
  isWebSocketConnected: boolean = false;

  constructor(
    private meseroService: PedidoService,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private router: Router,
    private untils_pedido: UntilsPedido,
    private carritoService: CarritoService,
    private listasservice: ObtenerListas,
    public wsService: WebSocketService,
    private productoService: ProductosService
  ) { }

  ngOnInit(): void {
    this.cargarListaListos();
    this.obtener_mesas();
    this.obtener_nombre_puesto();
    this.untils_pedido.set_datos_pedido(this.id_mesa = "", this.mesaSeleccionada = "", this.id_pedido = "");
    this.carritoService.vaciarCarrito().subscribe({
      next: (res) => {
        console.log('Carrito vaciado correctamente');
      },
      error: (err) => console.error('Error al vaciar carrito:', err)
    });

    // 🔥 Conectar al WebSocket como mesero
    this.conectarWebSocket();
  }

  ngOnDestroy(): void {
    // 🔥 Limpiar suscripción y desconectar WebSocket
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }

  /**
   * 🔥 Conecta al WebSocket y escucha notificaciones
   */
  conectarWebSocket(): void {
    console.log('🔌 Conectando al WebSocket como mesero...');

    this.wsSubscription = this.wsService.connect('meseros').subscribe({
      next: (mensaje: WebSocketMessage) => {
        console.log('📨 Mensaje WebSocket recibido para mesero:', mensaje);
        this.handleWebSocketMessage(mensaje);
      },
      error: (error) => {
        console.error('❌ Error en WebSocket:', error);
      }
    });
  }

  /**
   * 🔥 Maneja los mensajes recibidos por WebSocket
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    console.log('📨 Notificación recibida:', message);

    switch (message.tipo) {
      case 'platillo_listo':
        this.manejarPlatilloListo(message);
        break;
      case 'platillo_servido':
        this.cargarListaListos();
        break;
      case 'platillo_cancelado':
        this.mostrarNotificacion(
          'Platillo cancelado',
          `Se ha cancelado un platillo`,
          'warning'
        );
        this.cargarListaListos();
        this.obtener_mesas();
        break;

      case 'pedido_cancelado':
        this.mostrarNotificacion(
          'Pedido cancelado',
          `Se ha cancelado un pedido completo`,
          'warning'
        );
        this.cargarListaListos();
        this.obtener_mesas();
        break;

      case 'nuevo_pedido':

        this.obtener_mesas();
        break;

      case 'pago_completado':
        this.obtener_mesas();

        break;

      case 'pong':
        // No hacer nada, es solo para mantener la conexión
        break;

      default:
        console.log('Tipo de mensaje no manejado:', message.tipo);
    }
  }

  /**
   * 🔥 Maneja la notificación de platillo listo
   */
  private manejarPlatilloListo(message: WebSocketMessage): void {
    // Agregar el platillo a la lista de listos
    this.cargarListaListos();

    // Mostrar notificación visual
    this.mostrarNotificacion(
      '🍽️ Platillo Listo',
      `${message.nombre_platillo} está listo en ${message.nombre_mesa || 'mesa'}`,
      'success'
    );

    // Reproducir sonido (opcional)
    this.reproducirSonidoNotificacion();
  }

  /**
   * 🔥 Maneja la notificación de pago completado
   */
  private manejarPagoCompletado(message: WebSocketMessage): void {
    // Actualizar lista de mesas

    // Limpiar selección si era la mesa que se pagó
    if (this.id_mesa === message.id_mesa) {
      this.mesaSeleccionada = "";
      this.id_mesa = "";
      this.Estado_mesa = "";
      this.id_pedido = "";
    }

    // Mostrar notificación
    const mesaTexto = message.nombre_mesa || 'una mesa';


    // Reproducir sonido
    this.reproducirSonidoNotificacion();
  }

  /**
   * 🔥 Muestra una notificación toast
   */
  private mostrarNotificacion(title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info'): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: icon,
      title: title,
      text: text
    });
  }

  /**
   * 🔥 Reproduce un sonido de notificación (opcional)
   */
  private reproducirSonidoNotificacion(): void {
    try {
      const audio = new Audio('sistema/sounds/notificacion.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('No se pudo reproducir el sonido:', err));
    } catch (error) {
      console.log('Error al reproducir sonido:', error);
    }
  }

  cargarListaListos(): void {
    this.listasservice.get_lista_platillos_listos().subscribe({
      next: (data) => {
        console.log(data);
        this.listasListos = data;
      },
      error: (err) => console.error('Error al cargar lista de cocina:', err),
    });
  }

  obtener_mesas() {
    this.meseroService.get_all_mesas().subscribe(tmesas => {
      this.zone.run(() => {
        this.mesas$ = tmesas.filter(m => m.estatus_bool !== false);
        this.cd.detectChanges();
      });
    });
  }

  obtener_nombre_puesto() {
    this.meseroService.get_nombre_empleado().subscribe(empleado => {
      this.zone.run(() => {
        console.log(empleado);
        this.empleado_puesto_nombre = empleado;
        this.cd.detectChanges();
      });
    });
  }

  mesaseleccionada(id_mesa: string, Nombre_mesa: string, Estado: string, id_pedido?: string) {
    this.mesaSeleccionada = "";
    this.id_mesa = "";
    this.Estado_mesa = "";
    this.id_pedido = "";
    this.mesaSeleccionada = Nombre_mesa;
    this.id_mesa = id_mesa;
    this.Estado_mesa = Estado;
    if (id_pedido) {
      this.id_pedido = id_pedido;
    }
  }

  confirmarMesa() {
    console.log(this.id_pedido);
    if (this.id_pedido) {
      Swal.fire({
        title: "Seleccione una mesa disponible",
        text: `La mesa que selecciono ya esta ocupada con un pedido abierto, si desea puede agregar mas pedidos a la orden con "AGREGAR A LA ORDEN"`,
        icon: "warning",
        confirmButtonColor: "#D0AF43"
      });
      return;
    }

    Swal.fire({
      title: `¿Abrir orden en la mesa ${this.mesaSeleccionada}?`,
      text: "Asegúrese de estar en la misma mesa que seleccionó.",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Encargar ya",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.untils_pedido.set_datos_pedido(this.id_mesa, this.mesaSeleccionada);
        this.carritoService.vaciarCarrito().subscribe({
          next: (res) => {
            console.log('Carrito vaciado correctamente');
            this.router.navigate(['/mesero-menu']);
          },
          error: (err) => console.error('Error al vaciar carrito:', err)
        });
      }
    });
  }

  actualizarpedido() {
    console.log(this.id_pedido);
    if (!this.id_pedido) {
      Swal.fire({
        title: "Seleccione una mesa con una orden ya abierta",
        text: `La mesa que selecciono esta disponible para abrir una `,
        icon: "warning",
        confirmButtonColor: "#D0AF43"
      });
      return;
    }

    Swal.fire({
      title: `¿Agregar platillos en la mesa ${this.mesaSeleccionada}?`,
      text: "Asegúrese de estar en la misma mesa que seleccionó.",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      showDenyButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      denyButtonColor: "#8B5E3C",
      confirmButtonText: "Agregar a la orden",
      cancelButtonText: "Cancelar",
      denyButtonText: "Pagar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.untils_pedido.set_datos_pedido(this.id_mesa, this.mesaSeleccionada, this.id_pedido);
        this.carritoService.vaciarCarrito();
        this.router.navigate(['/mesero-menu']);
      } if (result.isDenied) {
        this.router.navigate(['/pagar'], { queryParams: { id_mesa: this.id_mesa, id_pedido: this.id_pedido, nombre_mesa: this.mesaSeleccionada } });
      }
    });
  }

  terminar_plato(estado: string, id_detalle: string) {
    this.listasservice.update_estado_platillo(id_detalle, estado).subscribe({
      next: () => {
        console.log(`Platillo ${id_detalle} actualizado a estado "${estado}"`);

        // Quitar el platillo de la lista local
        this.listasListos = this.listasListos.filter(
          platillo => platillo.id_detalle !== id_detalle
        );
      },
      error: (err) => console.error('Error al actualizar estado del platillo:', err),
    });
  }

  getImageUrl(rutaImagen: string): string {
    const defaultImg = 'profiles/maquin_de_apoyo.jpeg';

    if (!rutaImagen) return defaultImg;

    const url = rutaImagen.startsWith('http')
      ? rutaImagen
      : `${this.productoService['apiUrlserve']}/${rutaImagen}`;

    const img = new Image();
    img.src = url;
    img.onerror = () => img.src = defaultImg;

    return img.src;
  }
}