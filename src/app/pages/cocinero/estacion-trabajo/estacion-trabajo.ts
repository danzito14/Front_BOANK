import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { WebSocketService, WebSocketMessage } from '../../../services/untils/web-socket-service';
import { ListaPlatoPendienteInterface, ObtenerListas } from '../../../services/untils/obtener-listas';
import { Cocina } from '../../../services/untils/cocina';
import { PedidoService } from '../../../services/mesero/pedido';

@Component({
  selector: 'app-temporal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estacion-trabajo.html',
  styleUrl: './estacion-trabajo.css',
})
export class EstacionTrabajo implements OnInit, OnDestroy {

  listaspendiente: ListaPlatoPendienteInterface[] = [];
  primerPlatillo: ListaPlatoPendienteInterface | null = null;
  cargando = true;


  //Nombre y puesto del empleado
  empleado_puesto_nombre: any = null;

  private wsSubscription?: Subscription;

  constructor(
    private listasservice: ObtenerListas,
    private cocinaService: Cocina,
    private meseroService: PedidoService,
    public webSocketService: WebSocketService,
    private zone: NgZone,
    private cd: ChangeDetectorRef

  ) { }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.obtener_nombre_puesto();
      this.inicializarCocinero();
      this.conectarWebSocket();
    }
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

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
  }

  manejarMensajeWebSocket(mensaje: WebSocketMessage): void {
    switch (mensaje.tipo) {
      case 'nuevo_pedido':
        console.log('🆕 Nuevo pedido recibido:', mensaje.id_pedido);
        this.mostrarNotificacionNuevoPedido(mensaje);
        this.recargarListaPendientes();
        break;

      case 'platillo_listo':
        console.log('✅ Platillo listo:', mensaje.id_detalle);
        this.recargarListaPendientes();
        break;

      case 'platillo_cancelado':
        console.log('❌ Platillo cancelado:', mensaje.id_detalle);
        if (this.primerPlatillo?.id_detalle === mensaje.id_detalle) {
          this.mostrarNotificacionCancelacion(mensaje);
          this.primerPlatillo = null;
          this.cocinaService.limpiar_cocina().subscribe({
            next: () => {
              console.log('✅ Cocina limpiada en backend');
              this.recargarListaPendientes();
            },
            error: (err) => console.error('❌ Error al limpiar cocina:', err),

          });
        }
        this.recargarListaPendientes();
        break;

      case 'pedido_cancelado':
        console.log('❌ Pedido cancelado completo:', mensaje.id_pedido);
        if (this.primerPlatillo?.id_pedido === mensaje.id_pedido) {
          this.primerPlatillo = null;
          this.mostrarNotificacionCancelacion(mensaje);

          this.cocinaService.limpiar_cocina().subscribe({
            next: () => {
              console.log('✅ Cocina limpiada en backend');
              this.recargarListaPendientes();
            },
            error: (err) => console.error('❌ Error al limpiar cocina:', err),

          });
        }
        this.recargarListaPendientes();
        break;

      case 'conexion_exitosa':
        console.log('✅ Conexión WebSocket exitosa:', mensaje.mensaje);
        break;

      case 'pong':
        break;

      default:
        console.log('📩 Mensaje no manejado:', mensaje);
    }
  }

  mostrarNotificacionCancelacion(mensaje: WebSocketMessage): void {
    let pedido = "";
    if (mensaje.id_detalle) {
      pedido = mensaje.id_detalle
    } else if (mensaje.id_pedido) {
      pedido = mensaje.id_pedido
    }
    Swal.fire({
      title: '❌ Platillo Cancelado',
      html: `
        <p><strong>Platillo:</strong> ${pedido}</p>
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
    this.reproducirSonidoNotificacion("cancelar");

  }



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

    this.reproducirSonidoNotificacion("");
  }

  reproducirSonidoNotificacion(action: string): void {
    try {
      let audio = new Audio('sistema/sounds/notificacion.mp3');
      if (action === 'cancelar') {
        audio = new Audio('sistema/sounds/cancelacion.mp3');
      }
      audio.volume = 0.5;
      audio.play().catch(err => console.log('No se pudo reproducir el sonido:', err));
    } catch (error) {
      console.log('Error al reproducir sonido:', error);
    }
  }



  // 🔥 CORREGIDO: Recarga sin resetear platillo actual
  recargarListaPendientes(): void {
    console.log('🔄 Recargando lista de platillos pendientes...');

    this.listasservice.get_lista_platillos_pendientes().subscribe({
      next: (data) => {
        // 🔥 Filtrar el platillo actual de la lista pendiente
        if (this.primerPlatillo) {
          this.listaspendiente = data.filter(
            p => p.id_detalle !== this.primerPlatillo!.id_detalle
          );
        } else {
          this.listaspendiente = data;
        }

        console.log('✅ Lista actualizada:', this.listaspendiente.length, 'platillos pendientes');

        // Si no hay platillo actual y hay pendientes, asignar uno
        if (!this.primerPlatillo && this.listaspendiente.length > 0) {
          this.verificarYTomarPlatillo();
        }
      },
      error: (err) => console.error('❌ Error al recargar lista:', err)
    });
  }

  // ==================== MÉTODOS DE INICIALIZACIÓN ====================

  inicializarCocinero(): void {
    this.cargando = true;
    console.log('🔍 Verificando si el cocinero ya tiene un platillo asignado...');

    this.cocinaService.check_cocina_platillo().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const platoActual = data[0];
          console.log('✅ Platillo en curso encontrado:', platoActual);

          // Cargar datos completos del platillo
          this.listasservice.get_lista_platillos_by_id(platoActual.id_detalle).subscribe({
            next: (detalle) => {
              this.primerPlatillo = detalle[0];
              console.log('📋 Detalle del platillo en curso:', this.primerPlatillo);
              this.cargarListaPendientes();
            },
            error: (err) => {
              console.error('❌ Error al cargar detalle del platillo:', err);
              this.cargarListaPendientes();
            },
          });
        } else {
          console.log('ℹ️ No hay platillo asignado, cargando lista...');
          this.cargarListaPendientes();
        }
      },
      error: (err) => {
        console.error('❌ Error al verificar platillo actual:', err);
        this.cargarListaPendientes();
      },
      complete: () => (this.cargando = false),
    });
  }

  cargarListaPendientes(): void {
    this.listasservice.get_lista_platillos_pendientes().subscribe({
      next: (data) => {
        // 🔥 Filtrar platillo actual si existe
        if (this.primerPlatillo) {
          this.listaspendiente = data.filter(
            p => p.id_detalle !== this.primerPlatillo!.id_detalle
          );
        } else {
          this.listaspendiente = data;
        }

        console.log('📋 Lista de pendientes cargada:', this.listaspendiente.length);
        this.verificarYTomarPlatillo();
      },
      error: (err) => console.error('❌ Error al cargar lista de cocina:', err),
    });
  }

  // 🔥 CORREGIDO: Lógica de asignación automática
  verificarYTomarPlatillo(): void {
    // Si ya hay platillo activo, no hacer nada
    if (this.primerPlatillo) {
      console.log('✅ Ya hay un platillo en curso:', this.primerPlatillo.Nombre_platillo);
      return;
    }

    // Verificar si backend ya tiene asignado uno
    this.cocinaService.check_cocina_platillo().subscribe({
      next: (actual) => {
        if (actual && actual.length > 0) {
          const platoActual = actual[0];
          console.log('✅ Backend ya tiene platillo asignado:', platoActual.id_detalle);

          // Cargar datos completos
          this.listasservice.get_lista_platillos_by_id(platoActual.id_detalle).subscribe({
            next: (detalles) => {
              this.primerPlatillo = detalles[0];

              // 🔥 Actualizar lista pendiente sin este platillo
              this.listaspendiente = this.listaspendiente.filter(
                p => p.id_detalle !== this.primerPlatillo!.id_detalle
              );

              console.log('✅ Platillo asignado cargado:', this.primerPlatillo.Nombre_platillo);
            },
            error: (err) => console.error('❌ Error al obtener detalle:', err)
          });

          return;
        }

        // No tiene platillo, solicitar asignación
        console.log('🔄 Solicitando asignación de nuevo platillo...');
        this.cocinaService.asignar_plato().subscribe({
          next: (response) => {
            if (!response || !response.id_detalle) {
              console.log('ℹ️ No hay platillos pendientes en backend.');
              return;
            }

            console.log('✅ Backend asignó platillo:', response.id_detalle);

            // 🔥 DESCOMENTAR Y CORREGIR: Cargar datos completos del platillo asignado
            this.listasservice.get_lista_platillos_by_id(response.id_detalle).subscribe({
              next: (detalle) => {
                this.primerPlatillo = detalle[0];

                // 🔥 Quitar de lista local
                this.listaspendiente = this.listaspendiente.filter(
                  p => p.id_detalle !== this.primerPlatillo!.id_detalle
                );

                console.log('✅ Platillo asignado y cargado:', this.primerPlatillo.Nombre_platillo);
              },
              error: (err) => {
                console.error('❌ Error al cargar detalle del platillo asignado:', err);
                // Intentar recargar todo
                this.cargarListaPendientes();
              }
            });
          },
          error: (err) => {
            console.error('❌ Error al solicitar asignación:', err);
            // Reintentar después de 1 segundo
            setTimeout(() => this.verificarYTomarPlatillo(), 1000);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al verificar platillo:', err);
      }
    });
  }

  // ==================== ACCIONES DE PLATILLO ====================

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
        const deleteObservable = id_mesa
          ? this.meseroService.delete_pedidos_mesa(id_detalle, id_pedido, id_mesa)
          : this.meseroService.delete_pedidos_entrega(id_detalle, id_pedido);

        deleteObservable.subscribe({
          next: () => {
            Swal.fire({
              title: "Hecho",
              text: "Platillo cancelado",
              icon: "success",
              confirmButtonColor: "#D0AF43",
              iconColor: "#d6b45a"
            });

            // 🔥 Limpiar platillo actual
            this.primerPlatillo = null;

            // 🔥 Limpiar cocina en backend
            this.cocinaService.limpiar_cocina().subscribe({
              next: () => {
                console.log('✅ Cocina limpiada en backend');
                this.recargarListaPendientes();
              },
              error: (err) => console.error('❌ Error al limpiar cocina:', err),
            });
          },
          error: (err) => console.error("❌ Error al cancelar pedido:", err),
        });
      }
    });
  }

  terminar_plato(estado: string, id_detalle?: string) {
    if (!id_detalle) {
      console.warn("⚠️ No hay platillo para terminar");
      return;
    }

    this.listasservice.update_estado_platillo(id_detalle, estado).subscribe({
      next: () => {
        console.log(`✅ Platillo ${id_detalle} actualizado a estado "${estado}"`);

        // 🔥 Limpiar platillo actual
        this.primerPlatillo = null;

        // 🔥 Limpiar cocina en backend
        this.cocinaService.limpiar_cocina().subscribe({
          next: () => {
            console.log('✅ Cocina limpiada');
            // 🔥 Recargar lista y asignar nuevo platillo automáticamente
            this.cargarListaPendientes();
          },
          error: (err) => console.error('❌ Error al limpiar cocina:', err),
        });
      },
      error: (err) => console.error('❌ Error al actualizar estado del platillo:', err),
    });
  }


  // ##########################################################
  obtener_nombre_puesto() {
    this.meseroService.get_nombre_empleado().subscribe(empleado => {
      this.zone.run(() => {
        console.log(empleado);
        this.empleado_puesto_nombre = empleado;
        this.cd.detectChanges();
      });
    });
  }
}