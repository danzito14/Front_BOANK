import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger, state, style, transition, animate
} from '@angular/animations';
import Swal from 'sweetalert2';
import { CarritoService } from '../../services/carrito/carrito';
import { MesasInterface, PedidoService, PedidoMesaInterface, PedidoEntregaInterface } from '../../services/mesero/pedido';
import { UntilsPedido } from '../../services/untils/untils-pedido';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedido.html',
  styleUrls: ['./pedido.css'],
  animations: [
    trigger('slideToggle', [
      state('closed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        padding: '0'
      })),
      state('open', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        padding: '*'
      })),
      transition('closed <=> open', animate('250ms ease-in-out'))
    ])
  ]
})
export class Pedido implements OnInit {

  openedIndex: number | null = null; // Guarda cuál mesa está abierta

  pedidos: PedidoMesaInterface[] = [];
  pedidos_absolute: PedidoEntregaInterface[] = [];

  nvl_usuario: string | null = "";

  constructor(private meseroService: PedidoService, private zone: NgZone, private cd: ChangeDetectorRef,
    private router: Router, private untils_pedido: UntilsPedido, private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    let nvl_usu = this.getToken2();
    switch (nvl_usu) {
      case '2':
        this.get_pedido_mesa();
        break;
      case '4':
        this.get_pedido_mesa();
        this.get_pedido_mesa_absolute();
        break;
      case '1':
        this.get_pedido_usuario();
        break;
      default:
        break;
    }
  }

  getToken2() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('nvl_usuario');
    // console.log(token);
    this.nvl_usuario = token;
    return token;
  }

  toggleMesa(index: number) {
    this.openedIndex = this.openedIndex === index ? null : index;
  }

  formatEstado(estado: string): string {
    return estado.replace(/\s+/g, '');
  }

  cancelar_pedido(id_detalle: string, id_pedido: string, nombre: string, id_mesa: string) {
    Swal.fire({
      title: `¿Esta seguro de que desea quitar:  ${nombre} de su orden?`,
      text: "Una vez cancelada no se podra recuperar",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Quitar platillo",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.meseroService.delete_pedidos_mesa(id_detalle, id_pedido, id_mesa)
          .subscribe(resp => {
            Swal.fire({
              title: "Hecho",
              text: "Platillo cancelado",
              icon: "success",
              confirmButtonColor: "#D0AF43",
              iconColor: "#d6b45a"
            });
            this.get_pedido_mesa();  // 👈 refrescar lista
          });
      }
    });
  }



  cancelar_pedido_entrega(id_detalle: string, id_pedido: string, nombre: string) {
    Swal.fire({
      title: `¿Esta seguro de que desea quitar:  ${nombre} de su orden?`,
      text: "Una vez cancelada no se podra recuperar",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Quitar platillo",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.meseroService.delete_pedidos_entrega(id_detalle, id_pedido)
          .subscribe(resp => {
            Swal.fire({
              title: "Hecho",
              text: "Platillo cancelado",
              icon: "success",
              confirmButtonColor: "#D0AF43",
              iconColor: "#d6b45a"
            });
            this.get_pedido_mesa_absolute(); // 👈 refrescar lista de entrega
          });
      }
    });
  }


  cancelar_todo_pedido(id_pedido: string, nombre: string, id_mesa: string) {
    Swal.fire({
      title: `¿Esta seguro de que desea cancelar todo el pedido de la mesa:  ${nombre}?`,
      text: "Una vez cancelada no se podra recuperar",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Cancelar toda la orden",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.meseroService.cancelar_pedido(id_pedido, id_mesa)
          .subscribe(resp => {
            Swal.fire({
              title: "Hecho",
              text: "Pedido cancelado",
              icon: "success",
              confirmButtonColor: "#D0AF43",
              iconColor: "#d6b45a"
            });

            this.get_pedido_mesa(); // refrescar
          });
      }
    });
  }


  cancelar_todo_pedido_entrega(id_pedido: string, nombre: string) {
    Swal.fire({
      title: `¿Esta seguro de que desea cancelar todo el pedido de:  ${nombre}?`,
      text: "Una vez cancelada no se podra recuperar",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Cancelar toda la orden",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.meseroService.cancelar_pedido_entrega(id_pedido)
          .subscribe(resp => {
            Swal.fire({
              title: "Hecho",
              text: "Pedido cancelado",
              icon: "success",
              confirmButtonColor: "#D0AF43",
              iconColor: "#d6b45a"
            });

            this.get_pedido_mesa_absolute();
            this.get_pedido_usuario(); // refrescar
          });
      }
    });
  }


  get_pedido_mesa() {
    this.meseroService.get_pedidos_mesa().subscribe(data => {
      // console.log(JSON.stringify(data, null, 2));
      this.pedidos = [...data]; // 👈 esto sí fuerza el render sin conflictos
    });
  }


  get_pedido_mesa_absolute() {
    this.meseroService.get_pedidos_mesa_absolute().subscribe(data => {
      // console.log(JSON.stringify(data, null, 2));
      this.pedidos_absolute = [...data]; // 👈 esto sí fuerza el render sin conflictos
    });
  }

  get_pedido_usuario() {
    this.meseroService.gets_pedidos_usuario().subscribe(data => {
      this.pedidos_absolute = data.filter((p: any) =>
        p.estado_pedido !== 'Cancelado' &&
        p.estado_pedido !== 'Pagada');
    });
  }
}
