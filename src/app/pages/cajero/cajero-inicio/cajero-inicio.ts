import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Categoria, CategoriasService } from '../../../services/categorias/categorias-service';
import { Filtros } from '../../../services/filtrado/filtros';
import { Producto, CombosInterface, ProductosService } from '../../../services/home/productos-service';
import { UntilsPedido } from '../../../services/untils/untils-pedido';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../../services/carrito/carrito';
import { PedidoService } from '../../../services/mesero/pedido';
import { PagarMesa } from "../../mesero/component/pagar-mesa/pagar-mesa";




@Component({
  selector: 'app-cajero-inicio',
  imports: [CommonModule, FormsModule, PagarMesa],
  templateUrl: './cajero-inicio.html',
  styleUrl: './cajero-inicio.css',
})
export class CajeroInicio {
  modal$: string = "modal";
  //Arrays para las listas de productos y categorias
  productos: Producto[] = [];
  categoria: Categoria[] = [];
  combos: CombosInterface[] = [];

  empleado_puesto_nombre: any = null;

  //varaibles de los pedidos
  data: any;
  nombre_mesa: string = "";
  id_mesa: string = "";
  id_pedido: string = "";

  filtro_especial: string = "normal";

  mesaSeleccionada: string = "";
  Estado_mesa: string = "";

  constructor(
    private categoriaservice: CategoriasService,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private router: Router,
    private Aroute: ActivatedRoute,
    private productosService: ProductosService,
    private filtroproductoService: Filtros,
    private untilsService: UntilsPedido,
    private carritoService: CarritoService,
    private meseroService: PedidoService
  ) {
  }
  ngOnInit(): void {
    this.obtener_nombre_puesto();
    this.untilsService.set_datos_pedido(this.id_mesa = "", this.mesaSeleccionada = "", this.id_pedido = "");
    this.carritoService.vaciarCarrito().subscribe({
      next: (res) => {
        console.log('Carrito vaciado correctamente');

      },
      error: (err) => console.error('Error al vaciar carrito:', err)
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


  cambiar_modal(ventana: string) {
    this.modal$ = ventana;
  }


  regresar() {
    window.history.back();
  }

  pedido_page() {
    this.router.navigate(['/pedido'])
  }

  menu_page() {
    this.router.navigate(['/mesero-menu'])
  }
}
