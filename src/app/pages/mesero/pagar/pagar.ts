import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../../services/mesero/pedido';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-pagar',
  templateUrl: './pagar.html',
  styleUrl: './pagar.css',
})
export class Pagar implements OnInit {

  id_mesa: string = "";
  id_pedido: string = "";
  nombre_mesa: string = "";
  total: number = 0;


  metodo_pago = 'efectivo'; // valor por defecto
  referencia_pago = ''; // se generará dinámicamente

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private pedidoService: PedidoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.id_mesa = params['id_mesa'] || "";
      this.id_pedido = params['id_pedido'] || "";
      this.nombre_mesa = params['nombre_mesa'] || "";

      if (this.id_pedido) {
        this.pedido_listo();
        this.get_total_pedido();
      }
    });
  }

  get_total_pedido() {
    this.pedidoService.get_total_pedido(this.id_pedido).subscribe({
      next: (res) => {
        this.total = res;
        console.log("Total del pedido:", res);
        this.cd.detectChanges();
      },
      error: (err) => console.error("Error al obtener total:", err)
    });
  }

  pedido_listo() {
    this.pedidoService.get_estado_pedido(this.id_pedido).subscribe((estado) => {
      if (!estado) {
        Swal.fire({
          title: `Pedido de la mesa ${this.nombre_mesa}, aún no está terminado`,
          text: "Espere a que se sirvan toda la orden",
          icon: "info",
          iconColor: "#d6b45a",
          confirmButtonColor: "#D0AF43",
          confirmButtonText: "Encargar ya",
          allowOutsideClick: true,
          allowEscapeKey: true,
        }).then(() => {
          this.router.navigate(['/mesero-inicio']);
        });
      }
    });
  }


  cambiarMetodoPago(event: any) {
    this.metodo_pago = event.target.value;
  }


  pagarPedido() {
    // 💳 Simulamos referencia según método
    if (this.metodo_pago === 'efectivo') {
      this.referencia_pago = 'Pago en efectivo';
    } else {
      // simulamos número de transacción o referencia bancaria
      this.referencia_pago = `REF-${Math.floor(Math.random() * 1000000)}`;
    }

    Swal.fire({
      title: `Confirmar pago por $${this.total} MXN`,
      text: `Método: ${this.metodo_pago.toUpperCase()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#D0AF43',
      iconColor: '#D0AF43',
      cancelButtonColor: '#773832'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidoService.generar_pago(
          this.id_pedido,
          this.metodo_pago,
          this.referencia_pago,
          this.id_mesa
        ).subscribe({
          next: (res: any) => {
            Swal.fire({
              icon: 'success',
              title: 'Pago realizado con éxito',
              text: `Referencia: ${this.referencia_pago}`,
              confirmButtonColor: '#D0AF43',
              iconColor: '#D0AF43'
            }).then(() => {
              this.regresar();
            })
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error al procesar el pago',
              text: err.error?.detail || 'Intente nuevamente',
              confirmButtonColor: '#773832'
            });
          }
        });
      }
    });
  }


  regresar() {
    window.history.back();
  }
}
