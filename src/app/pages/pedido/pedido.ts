import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger, state, style, transition, animate
} from '@angular/animations';
import Swal from 'sweetalert2';
import { map } from 'rxjs';
import { CarritoService } from '../../services/carrito/carrito';
import { MesasInterface, PedidoService, PedidoMesaInterface } from '../../services/mesero/pedido';
import { UntilsPedido } from '../../services/untils/untils-pedido';
import { Router } from '@angular/router';
import { title } from 'process';

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

  constructor(private meseroService: PedidoService, private zone: NgZone, private cd: ChangeDetectorRef,
    private router: Router, private untils_pedido: UntilsPedido, private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.get_pedido_mesa();
  }

  toggleMesa(index: number) {
    this.openedIndex = this.openedIndex === index ? null : index;
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

  get_pedido_mesa() {
    this.meseroService.get_pedidos_mesa().subscribe(data => {
      console.log(JSON.stringify(data, null, 2));
      this.pedidos = [...data]; // 👈 esto sí fuerza el render sin conflictos
    });
  }


}
