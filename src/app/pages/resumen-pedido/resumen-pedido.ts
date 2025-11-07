import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { TarjetaCarrito } from '../../components/tarjeta-carrito/tarjeta-carrito';
import { CarritoService, TemporalInterface } from '../../services/carrito/carrito';
import { Router } from '@angular/router';
import { FormsModule } from "@angular/forms";
import Swal from "sweetalert2"
import { UntilsPedido } from '../../services/untils/untils-pedido';

@Component({
  selector: 'app-resumen-pedido',
  imports: [CommonModule, TarjetaCarrito, FormsModule],
  templateUrl: './resumen-pedido.html',
  styleUrls: ['./resumen-pedido.css']
})
export class ResumenPedido implements OnInit {
  resumen: TemporalInterface[] = [];
  idscarrito: any[] = [];
  ticket: any[] = [];

  enviandocorreo = false;


  data: any;
  nombre_mesa: string = "";;
  id_mesa: string = "";;
  id_pedido: string = "";;


  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private untilsService: UntilsPedido
  ) { }

  ngOnInit() {
    this.obtener_resumen();
    this.get_datos_pedido();
  }

  regresar() {
    window.history.back();
  }

  obtener_resumen() {
    this.carritoService.get_resumen_pedido().subscribe(res => {
      this.zone.run(() => {
        // 🔹 Si res no es un arreglo, lo guardamos como único objeto
        this.resumen = Array.isArray(res) ? res : [res];

        // 🔹 Extraemos datos de los arrays internos
        if (this.resumen.length > 0) {
          const r = this.resumen[0]; // ya que solo hay un objeto principal
          this.idscarrito = r.datos_pedido || [];
          this.ticket = r.lista_producto || [];
        }

        // 🔹 Forzamos actualización del DOM
        this.cd.detectChanges();
      });
    });
  }

  pagar() {
    Swal.fire({
      title: "¿Encargar ya?",
      text: "Se le mandará un correo electrónico con la información del pedido",
      icon: "question",
      iconColor: "#d6b45a",
      showCancelButton: true,
      cancelButtonColor: "#773832",
      confirmButtonColor: "#D0AF43",
      confirmButtonText: "Encargar ya",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.id_pedido) {
          this.actualizar_pedido();
        } else {
          this.enviarCorreo();
        }
      }
    });
  }

  actualizar_pedido() {
    if (this.resumen.length === 0) return;

    const pedido = this.resumen[0];
    const payload = {
      id_temporal: pedido.id_temporal,
      id_pedido: this.id_pedido,
      precio: pedido.precio,
      productos: this.ticket
    };

    this.enviandocorreo = true;
    this.carritoService.enviarCorreoResumen(payload).subscribe({
      next: (res) => {
        this.enviandocorreo = false;

        // Solo cuando el correo se envía correctamente mostramos el Swal
        Swal.fire({
          title: "Pedido actulizado",
          text: "Se han enviado los pedidos a las cocina",
          icon: "success",
          iconColor: "#d6b45a",
          confirmButtonColor: "#d6b45a"
        }).then(() => {
          this.router.navigate(['']);
        });
      },
      error: (err) => {
        this.enviandocorreo = false;

        console.error(err);
        Swal.fire({
          title: "Error",
          text: "No se pudo enviar el correo.",
          icon: "error",
          iconColor: "#d33",
          confirmButtonColor: "#d33"
        });
      }
    });
  }

  enviarCorreo() {
    if (this.resumen.length === 0) return;

    const pedido = this.resumen[0];
    const payload = {
      id_temporal: pedido.id_temporal,
      direccion: pedido.direccion,
      metodo_pago: pedido.metodo_pago,
      precio: pedido.precio,
      productos: this.ticket
    };

    this.enviandocorreo = true;

    this.carritoService.enviarCorreoResumen(payload).subscribe({
      next: (res) => {
        this.enviandocorreo = false;

        // Solo cuando el correo se envía correctamente mostramos el Swal
        Swal.fire({
          title: "Pedido realizado",
          text: "En un momento le llegará el correo",
          icon: "success",
          iconColor: "#d6b45a",
          confirmButtonColor: "#d6b45a"
        }).then(() => {
          this.router.navigate(['']);
        });
      },
      error: (err) => {
        this.enviandocorreo = false;

        console.error(err);
        Swal.fire({
          title: "Error",
          text: "No se pudo enviar el correo.",
          icon: "error",
          iconColor: "#d33",
          confirmButtonColor: "#d33"
        });
      }
    });
  }

  get_datos_pedido() {
    this.data = this.untilsService.get_datos_pedido();
    this.id_mesa = this.data.id_mesa;
    this.id_pedido = this.data.id_pedido;
    this.nombre_mesa = this.data.Nombre_mesa;
  }


}
