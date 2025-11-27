import { Component } from '@angular/core';
import { Temporald } from "../temporal/temporal";
import { ReporteVentasl } from "../../components/admninistracion/reporte-ventas/reporte-ventas";
import { CommonModule } from '@angular/common';
import { EmpleadosGeneral } from "../../components/admninistracion/empleados/empleados-general/empleados-general";
import { EditarEmpleado } from "../../components/admninistracion/empleados/editar-empleado/editar-empleado";
import { AgregarEmpleado } from "../../components/admninistracion/empleados/agregar-empleado/agregar-empleado";
import { AgregarPuesto } from "../../components/admninistracion/puestos/agregar-puesto/agregar-puesto";
import { EditarPuesto } from "../../components/admninistracion/puestos/editar-puesto/editar-puesto";
import { AgregarUniforme } from "../../components/admninistracion/uniformes/agregar-uniforme/agregar-uniforme";
import { EditarUniforme } from "../../components/admninistracion/uniformes/editar-uniforme/editar-uniforme";
import { PlatillosGeneral } from "../../components/admninistracion/platillos_m/platillos-general/platillos-general";

@Component({
  selector: 'app-administracion',
  imports: [CommonModule, ReporteVentasl, EmpleadosGeneral, EditarEmpleado, AgregarEmpleado, AgregarPuesto, EditarPuesto, AgregarUniforme, EditarUniforme, PlatillosGeneral],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion {
  accion = "ventas";
  cambiar_div(accion: string) {
    this.accion = accion
  }

  id_seleccionado: any;
  recibir_id(id: any) {
    this.id_seleccionado = id;
  }
  tab_destino_empleados: string = "empleados";
  recibir_tab_empleado(tab: string) {
    this.tab_destino_empleados = tab;
  }

  reiniciar_tab() {
    this.tab_destino_empleados = "empleados";
  }
}
