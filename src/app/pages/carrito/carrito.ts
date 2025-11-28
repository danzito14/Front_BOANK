import { Component, OnInit } from '@angular/core';
import { CarritoInterface, CarritoService } from '../../services/carrito/carrito';
import { TarjetaCarrito } from '../../components/tarjeta-carrito/tarjeta-carrito';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UntilsPedido } from '../../services/untils/untils-pedido';
import { BehaviorSubject } from 'rxjs';
import { ProductosService } from '../../services/home/productos-service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [TarjetaCarrito, CommonModule],
  templateUrl: './carrito.html',
  styleUrls: ['./carrito.css']
})
export class Carrito implements OnInit {

  platillos: CarritoInterface[] = [];
  productosSeleccionados: CarritoInterface[] = [];
  total: number = 0;
  cargar: string = "carrito";
  nvl_usu: string | null = null;
  // Lista con cantidad por id_platillo
  resumenSeleccion: {
    subtotal: number; platillo: CarritoInterface, cantidad: number
  }[] = [];

  // Array con los IDs de detalle de carrito seleccionados
  public idscarrito: string[] = [];
  data: any;
  nombre_mesa: any;
  id_pedido: any;
  id_mesa: any;

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private untilsService: UntilsPedido,
    private productoService: ProductosService
  ) { }

  ngOnInit() {
    this.cargarPlatillos();
    this.get_datos_pedido();
    this.get_nvl_usuario();
  }

  cargarPlatillos() {
    this.carritoService.getCarritoByUser().subscribe(platillos => {
      this.platillos = platillos;
    });
  }

  // Se ejecuta cada vez que el hijo emite la selección
  onSeleccionChange(seleccion: CarritoInterface[]) {
    this.productosSeleccionados = seleccion;

    this.idscarrito = this.productosSeleccionados.map(p => p.id_detalle_carrito);

    // 🔹 Agrupar por id_platillo y contar cantidad, calculando subtotal
    const resumenMap = new Map<string, { platillo: CarritoInterface, cantidad: number, subtotal: number }>();

    seleccion.forEach(p => {
      if (resumenMap.has(p.id_platillo)) {
        const item = resumenMap.get(p.id_platillo)!;
        item.cantidad += 1;
        item.subtotal = item.platillo.precio_unitario * item.cantidad;
      } else {
        resumenMap.set(p.id_platillo, {
          platillo: p,
          cantidad: 1,
          subtotal: p.precio_unitario
        });
      }
    });

    this.resumenSeleccion = Array.from(resumenMap.values());

    // 🔹 Calcular total
    this.total = this.resumenSeleccion.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );

    // console.log("Resumen con subtotal:", this.resumenSeleccion);
    // console.log("Total:", this.total);
  }


  // 🔹 Enviar carrito temporal con todos los datos necesarios
  encargarPedido() {
    if (this.productosSeleccionados.length === 0) {
      console.warn('No hay productos seleccionados');
      return;
    }
    // if (this.id_pedido) {
    //   this.actualizar_pedido();
    // } else {


    // 🔹 Crear lista_producto según el formato esperado
    const lista_producto = this.resumenSeleccion.map(item => ({
      nombre: item.platillo.Nombre_platillo, // asegúrate que tu modelo CarritoInterface tenga esta propiedad
      cant: item.cantidad,
      subtotal: item.subtotal
    }));

    const data = {
      idscarrito: this.idscarrito,
      precio: this.total,
      lista_producto,
      ...(this.id_mesa && { id_mesa: this.id_mesa })
    };

    console.log(data);

    this.carritoService.agregar_temporal(data).subscribe({
      next: (res) => {
        // console.log('Carrito temporal guardado:', res);

        switch (this.nvl_usu) {
          case '1':
            this.router.navigate(['/direccion-pago']);
            break;
          case '2':
            this.router.navigate(['/resumen-pedido']);
            break;
          case '4':
            this.router.navigate(['/direccion-pago']);
            break;
          default:
            break;
        }
      },
      error: (err) => {
        console.error('Error al guardar el carrito temporal:', err);
      }
    });
    //}
  }

  actualizar_pedido() {
    alert(this.id_pedido);
  }


  get_datos_pedido() {
    this.data = this.untilsService.get_datos_pedido();
    this.nombre_mesa = this.data.Nombre_mesa;
    this.id_pedido = this.data.id_pedido;
    this.id_mesa = this.data.id_mesa;
  }


  get_nvl_usuario() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('nvl_usuario');
    this.tokenSubject.next(token);
    this.nvl_usu = token;
    return token;
  }

  getImageUrl(rutaImagen: string): string {

    const defaultImg = 'profiles/maquin_de_apoyo.jpeg';
    // Si no viene nada
    if (!rutaImagen) return defaultImg;

    // Si ya es una URL completa
    const url = rutaImagen.startsWith('http')
      ? rutaImagen
      : `${this.productoService['apiUrlserve']}/${rutaImagen}`;

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
