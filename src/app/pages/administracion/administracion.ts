import { Component } from '@angular/core';
import { Temporal } from "../temporal/temporal";

@Component({
  selector: 'app-administracion',
  imports: [Temporal],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion {
  accion = "main";
  cambiar_div(accion: string) {
    this.accion = accion
  }
}
