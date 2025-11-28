import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { TarjetaProduct } from "../../../components/tarjeta-product/tarjeta-product";
import { TarjetaOferta } from "../../../components/tarjeta-oferta/tarjeta-oferta";
import { ActivatedRoute, Router } from '@angular/router';
import { Categoria, CategoriasService } from '../../../services/categorias/categorias-service';
import { MaxAndMinPrice } from '../../../services/home/max-and-min-price';
import { CombosInterface, Producto, ProductosService } from '../../../services/home/productos-service';
import { Filtros } from '../../../services/filtrado/filtros';
import { UntilsPedido } from '../../../services/untils/untils-pedido';
import { TarjetaCombos } from '../../../components/tarjeta-combos/tarjeta-combos';

@Component({
  selector: 'app-mesero-menu',
  imports: [CommonModule, FormsModule, TarjetaProduct, TarjetaCombos, TarjetaOferta],
  templateUrl: './mesero-menu.html',
  styleUrl: './mesero-menu.css',
})
export class MeseroMenu {

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

  getImageUrl(rutaImagen: string): string {

    const defaultImg = 'profiles/maquin_de_apoyo.jpeg';
    // Si no viene nada
    if (!rutaImagen) return defaultImg;

    // Si ya es una URL completa
    const url = rutaImagen.startsWith('http')
      ? rutaImagen
      : `${this.productosService['apiUrlserve']}/${rutaImagen}`;

    // Verificar si la imagen existe cargándola en memoria
    const img = new Image();
    img.src = url;

    // Si falla, devuelve default
    img.onerror = () => img.src = defaultImg;

    return img.src;
  }

  regresar() {
    window.history.back();
  }
}
