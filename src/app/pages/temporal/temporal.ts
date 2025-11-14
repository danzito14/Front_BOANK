import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Categoria, CategoriasService } from '../../services/categorias/categorias-service';
import { Filtros } from '../../services/filtrado/filtros';
import { Producto, CombosInterface, ProductosService } from '../../services/home/productos-service';
import { UntilsPedido } from '../../services/untils/untils-pedido';
import { FormsModule } from '@angular/forms';
import { TarjetaCombos } from '../../components/tarjeta-combos/tarjeta-combos';
import { TarjetaOferta } from '../../components/tarjeta-oferta/tarjeta-oferta';
import { TarjetaProduct } from '../../components/tarjeta-product/tarjeta-product';

@Component({
  selector: 'app-temporal',
  standalone: true,
  imports: [CommonModule, FormsModule, TarjetaProduct, TarjetaCombos, TarjetaOferta],
  templateUrl: './temporal.html',
  styleUrls: ['./temporal.css'],

})
export class Temporal implements OnInit {
  modal$: boolean = true;
  //Arrays para las listas de productos y categorias
  productos: Producto[] = [];
  categoria: Categoria[] = [];
  combos: CombosInterface[] = [];
  //varaibles de los pedidos
  data: any;
  nombre_mesa: string = "";
  id_mesa: string = "";
  id_pedido: string = "";

  filtro_especial: string = "normal";

  constructor(
    private categoriaservice: CategoriasService,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private router: Router,
    private Aroute: ActivatedRoute,
    private productosService: ProductosService,
    private filtroproductoService: Filtros,
    private untilsService: UntilsPedido
  ) {
  }
  ngOnInit(): void {



    // cargar categorías
    this.categoriaservice.get_all_categorias().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.categoria = data;
          this.cd.detectChanges();
        });
      },
      error: (err) => console.log("Error al llamar al servidor", err)
    });

    this.get_datos_pedido();
    this.cargarProductos();
  }


  cargarProductos() {
    this.productosService.get_all_Productos().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.productos = data;
          this.cd.markForCheck();
        });
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }


  filtrarCategoria(categoria: number, descripcion_cat: string) {
    this.buscar_por_categoria(categoria);
  }


  buscar_por_categoria(cat: number) {
    this.filtroproductoService.get_productos_by_categoria(cat).subscribe({
      next: (productos) => {
        setTimeout(() => {

          this.zone.run(() => {
            this.productos = productos;
          })
          this.cd.detectChanges();
        });
      },
      error: (err) => console.error("Error al obenter los productos", err)
    })
  }

  get_datos_pedido() {
    this.data = this.untilsService.get_datos_pedido();
    this.id_mesa = this.data.id_mesa;
    this.id_pedido = this.data.id_pedido;
    this.nombre_mesa = this.data.Nombre_mesa;
  }

  buscar_filtro(filtro: string) {
    console.log("filtro aca usado", filtro)

    this.filtro_especial = filtro;
    switch (filtro) {
      case 'combo':
        this.cargarCombos();
        break;
      case 'inicio':
        this.cargarProductos();
        this.filtro_especial = 'normal';
        break;
      default:
        break;
    }
  }

  cargarCombos() {
    this.productosService.get_all_combos().subscribe({
      next: (data) => {
        // Ejecutar dentro de NgZone pero sin forzar detección manual
        this.zone.run(() => {
          this.combos = data;
          // Marca para verificación en el siguiente ciclo
          this.cd.markForCheck();
        });
      },
      error: (err) => console.error(err)
    });
  }



  cambiar_modal() {
    this.modal$ = !this.modal$;
  }


  regresar() {
    window.history.back();
  }
}
