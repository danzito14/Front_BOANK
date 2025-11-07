import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UntilsPedido {
  private id_mesa: string | null = null;
  private Nombre_mesa: string | null = null;
  private id_pedido: string | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  set_datos_pedido(id_mesa: string, Nombre_mesa: string, id_pedido?: string) {
    this.id_mesa = id_mesa;
    this.Nombre_mesa = Nombre_mesa;
    this.id_pedido = "";
    if (id_pedido) this.id_pedido = id_pedido;

    // ✅ Guardar solo si estamos en navegador
    if (this.isBrowser()) {
      localStorage.setItem('datos_pedido', JSON.stringify({
        id_mesa: this.id_mesa,
        Nombre_mesa: this.Nombre_mesa,
        id_pedido: this.id_pedido,
      }));
    }
  }

  get_datos_pedido() {
    if (!this.id_mesa || !this.Nombre_mesa) {
      if (this.isBrowser()) {
        const datosGuardados = localStorage.getItem('datos_pedido');
        if (datosGuardados) {
          const { id_mesa, Nombre_mesa, id_pedido } = JSON.parse(datosGuardados);
          this.id_mesa = id_mesa;
          this.Nombre_mesa = Nombre_mesa;
          this.id_pedido = id_pedido;
        }
      }
    }

    return {
      id_mesa: this.id_mesa,
      Nombre_mesa: this.Nombre_mesa,
      id_pedido: this.id_pedido,
    };
  }

  limpiar_datos_pedido() {
    this.id_mesa = null;
    this.Nombre_mesa = null;
    this.id_pedido = null;

    if (this.isBrowser()) {
      localStorage.removeItem('datos_pedido');
    }
  }


}
