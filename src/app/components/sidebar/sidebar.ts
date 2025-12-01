import { Component, Input, OnInit, NgZone, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Categoria, CategoriasService } from '../../services/categorias/categorias-service';
import { MaxAndMinPrice, maxandmin } from '../../services/home/max-and-min-price';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, debounceTime, Subject } from 'rxjs';
import { AuthStoreService } from '../../services/auth/auth-store';
import { PlatillosService } from '../../services/administrador/platillos';
import Swal from 'sweetalert2';
import { Logout } from '../../services/administrador/logout';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  animations: [
    trigger('slideInOut', [
      state('hidden', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('hidden => visible', [
        animate('350ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('350ms ease-in')
      ])
    ])
  ]
})
export class Sidebar implements OnInit {

  @Input() isVisible = false;
  @Output() sidebarClose = new EventEmitter<void>();

  token: string | null = null;
  categoria: Categoria[] = [];
  prices: maxandmin = { min_price: 0, max_price: 0 };

  precioMin: number = 0;
  precioMax: number = 0;

  private precioSubject = new Subject<number>();
  private tokenSubject = new BehaviorSubject<string | null>(null);

  token$ = this.tokenSubject.asObservable();
  rangoActual: number = this.precioMax / 2;

  constructor(
    private categoriaservice: CategoriasService,
    private cd: ChangeDetectorRef,
    private zone: NgZone,
    private maxandmin: MaxAndMinPrice,
    private router: Router,
    private productosService: PlatillosService,
    private authstore: AuthStoreService,
    private logoutService: Logout
  ) {
    this.precioSubject.pipe(debounceTime(1000))
      .subscribe(valor => this.filtrarPorPrecio(this.prices.min_price, valor));
  }

  ngOnInit(): void {
    this.token = this.get_nvl_usuario();

    if (this.token === '1') {

      this.categoriaservice.get_all_categorias().subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.categoria = data;
            this.cd.detectChanges();
          });
        },
        error: (err) => console.log("Error al cargar categorías", err)
      });

      this.maxandmin.get_min_and_max_price().subscribe({
        next: (dataprice) => {
          this.zone.run(() => {
            this.prices = dataprice;
            this.precioMin = dataprice.min_price;
            this.precioMax = dataprice.max_price;
            this.cd.detectChanges();
          });
        },
        error: (err) => console.log("Error al cargar precios", err)
      });

    }
  }

  closeSidebar() {
    this.isVisible = false;
    this.sidebarClose.emit();
  }

  buscarTexto(texto: string) {
    this.router.navigate(['/result'], { queryParams: { search: texto } });
    this.closeSidebar();
  }

  filtrarCategoria(categoria: number, descripcion_cat: string) {
    this.router.navigate(['/result'], {
      queryParams: {
        categoria,
        descripcion_cat
      }
    });
    this.closeSidebar();
  }

  onSliderChange(valor: number) {
    this.rangoActual = valor;
    this.precioSubject.next(valor);
    this.closeSidebar();
  }

  filtrarPorPrecio(min: number, max: number) {
    this.router.navigate(['/result'], { queryParams: { minprice: min, maxprice: max } });
    this.closeSidebar();
  }

  buscar_filtro(filtro: string) {
    this.router.navigate(['/result'], { queryParams: { filtro_especial: filtro } });
    this.closeSidebar();
  }

  getImageUrl(rutaImagen: string): string {
    const defaultImg = 'profiles/maquin_de_apoyo.jpeg';
    if (!rutaImagen) return defaultImg;

    const url = rutaImagen.startsWith('http')
      ? rutaImagen
      : `${this.productosService['API_BASE']}/${rutaImagen}`;

    const img = new Image();
    img.src = url;
    img.onerror = () => img.src = defaultImg;

    return img.src;
  }

  get_nvl_usuario() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('nvl_usuario');
    this.tokenSubject.next(token);
    return token;
  }

  logout() {

    Swal.fire({
      title: '¿Está seguro de que quiere cerrar sesión?',
      showCancelButton: true,
      confirmButtonColor: '#D0AF43',
      cancelButtonColor: '#773832',
      icon: 'question',
      iconColor: '#D0AF43',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then(result => {

      if (!result.isConfirmed) return;

      this.logoutService.cerrar_sesion(this.token).subscribe((puedeSalir) => {

        if (puedeSalir) {
          Swal.fire({
            title: 'Puedes salir sin problemas',
            text: 'No queda nada por hacer pude cerrar sesión sin problemas',
            confirmButtonColor: '#D0AF43',
            icon: 'warning',
            iconColor: '#D0AF43',
            confirmButtonText: 'Entendido',
          }).then(() => {

            localStorage.removeItem('token');
            localStorage.removeItem('nvl_usuario');
            localStorage.removeItem('datos_pedido');
            sessionStorage.clear();

            this.router.navigate(['/login']);
            this.closeSidebar();
          })

        } else {

          Swal.fire({
            title: 'No se puede cerrar sesión aún',
            text: 'Hay cosas por hacer aún',
            confirmButtonColor: '#D0AF43',
            icon: 'success',
            iconColor: '#D0AF43',
            confirmButtonText: 'Entendido',
          }).then(() => {

            this.closeSidebar();
          })

        }

      });

    });
  }

}
