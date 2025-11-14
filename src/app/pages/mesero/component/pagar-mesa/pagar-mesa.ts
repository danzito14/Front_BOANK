import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { interval, map } from 'rxjs';
import { FormsModule } from "@angular/forms";
import { MesasInterface, NombreEmpleadoInterface, PedidoService } from '../../../../services/mesero/pedido';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { UntilsPedido } from '../../../../services/untils/untils-pedido';
import { CarritoService } from '../../../../services/carrito/carrito';

@Component({
  selector: 'app-paga-mesa',
  imports: [CommonModule, FormsModule],
  templateUrl: './pagar-mesa.html',
  styleUrl: './pagar-mesa.css',
})
export class PagarMesa implements OnInit {

  mesas$: MesasInterface[] = [];
  empleado_puesto_nombre: any = null;

  hora$ = interval(1000).pipe(
    map(() => new Date().toLocaleTimeString('es-MX', { hour12: false }))
  );

  mesaSeleccionada: string = "";
  id_mesa: string = "";
  Estado_mesa: string = "";
  id_pedido: string = "";

  constructor(private meseroService: PedidoService, private zone: NgZone, private cd: ChangeDetectorRef,
    private router: Router, private untils_pedido: UntilsPedido, private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.obtener_mesas();
    this.obtener_nombre_puesto();
    this.untils_pedido.set_datos_pedido(this.id_mesa = "", this.mesaSeleccionada = "", this.id_pedido = "");
    this.carritoService.vaciarCarrito().subscribe({
      next: (res) => {
        console.log('Carrito vaciado correctamente');

      },
      error: (err) => console.error('Error al vaciar carrito:', err)
    });
  }


  obtener_mesas() {
    this.meseroService.get_all_mesas_ocupadas().subscribe(tmesas => {
      this.zone.run(() => {
        this.mesas$ = tmesas;
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
        // this.meseroService.generar_pago(this.id_pedido, metodo_pago,)
      }
    });
  }



}
