
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
  selector: 'app-historial',
  imports: [CommonModule],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
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
export class Historial implements OnInit {

  openedIndex: number | null = null; // Guarda cuál mesa está abierta

  pedidos: PedidoMesaInterface[] = [];
  pedidos_absolute: PedidoEntregaInterface[] = [];

  nvl_usuario: string | null = "";

  constructor(private meseroService: PedidoService, private zone: NgZone, private cd: ChangeDetectorRef,
    private router: Router, private untils_pedido: UntilsPedido, private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    let nvl_usu = this.getToken2();

    this.get_pedido_usuario();

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



  get_pedido_usuario() {
    this.meseroService.gets_pedidos_usuario().subscribe(data => {
      this.pedidos_absolute = data.filter((p: any) =>
        p.estado_pedido === 'Cancelado' ||
        p.estado_pedido === 'Pagada'
      );
    });
  }


}
