import { Component, OnInit, ChangeDetectorRef, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
import { Usuarioservices } from '../../../services/usuario_services/usuarioservices';
import { Router } from '@angular/router';
import { DireccionInterface, TarjetaInterface, CarritoService, TemporalInterface } from '../../../services/carrito/carrito';


@Component({
  selector: 'app-tarjetas-y-direccion',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarjetas-y-direccion.html',
  styleUrl: './tarjetas-y-direccion.css',
})
export class TarjetasYDireccion implements OnInit {
  @Input() mostrar = "";

  @Output() cambiar_div = new EventEmitter<void>();

  direcciones: DireccionInterface[] = [];
  tarjetas: TarjetaInterface[] = [];
  direccionSeleccionada: string | null = null;

  tarjetaSeleccionada: string | null = null; // ✅ nombre correcto
  metodoPagoSeleccionado: any;

  titularSeleccionado: string | null = null;
  direccionPersonalizadaSeleccionada: string | null = null;

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor(
    private router: Router,
    private carritoService: CarritoService,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private UsuariosService: Usuarioservices
  ) { }

  ngOnInit() {
    if (this.mostrar === "direcciones") {
      this.obtener_direccions();
    }
    else if (this.mostrar === "tarjetas") {
      this.obtener_tarjetas(); // ✅ ahora sí se obtienen las tarjetas
    }
  }

  agregar_tarjeta_o_direccion(agregar: string) {
    this.cambiar_div.emit();
  }

  obtener_direccions() {
    this.carritoService.get_direcciones_by_user().subscribe(direcciones => {
      this.zone.run(() => {
        this.direcciones = direcciones;
        this.cd.detectChanges();
      });
    });
  }

  obtener_tarjetas() {
    this.carritoService.get_tarjetas_by_user().subscribe(tarjet => {
      this.zone.run(() => {
        this.tarjetas = tarjet;
        this.cd.detectChanges();
      });
    });
  }


  regresar() {
    window.history.back();
  }


  eliminar_direccion(id_direccion: string) {
    Swal.fire({
      title: '¿Estás seguro de que deseas eliminar esta dirección?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      iconColor: '#d6b45a',
      showCancelButton: true,
      confirmButtonColor: '#d6b45a',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.UsuariosService.delete_direccion_by_id(id_direccion).subscribe(response => {
          Swal.fire({
            title: 'Eliminado',
            text: 'La dirección ha sido eliminada exitosamente.',
            icon: 'success',
            iconColor: '#d6b45a',
            confirmButtonColor: '#d6b45a'
          });
          this.obtener_direccions();
        });
      }
    });
  }

  elimnar_tarjeta(id_tarjeta: string) {
    Swal.fire({
      title: '¿Estás seguro de que deseas eliminar esta tarjeta?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      iconColor: '#d6b45a',
      showCancelButton: true,
      confirmButtonColor: '#d6b45a',
      cancelButtonColor: '#773832',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.UsuariosService.delete_tarjeta_by_id(id_tarjeta).subscribe(response => {
          Swal.fire({
            title: 'Eliminado',
            text: 'La tarjeta ha sido eliminada exitosamente.',
            icon: 'success',
            iconColor: '#d6b45a',
            confirmButtonColor: '#d6b45a'
          });
          this.obtener_tarjetas();
        });
      }
    });
  }


}
