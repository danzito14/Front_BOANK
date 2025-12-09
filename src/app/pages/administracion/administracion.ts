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
import { AgregarPlatillo } from "../../components/admninistracion/platillos_m/agregar-platillo/agregar-platillo";
import { EditarPlatillo } from "../../components/admninistracion/platillos_m/editar-platillo/editar-platillo";
import { AgregarTipoPlatillo } from "../../components/admninistracion/platillos_m/agregar-tipo-platillo/agregar-tipo-platillo";
import { EditarTipoPlatillo } from "../../components/admninistracion/platillos_m/editar-tipo-platillo/editar-tipo-platillo";
import { UsuariosGeneral } from "../../components/admninistracion/usuarios_m/usuarios-general/usuarios-general";
import { AgregarUsuario } from "../../components/admninistracion/usuarios_m/usuarios_general/agregar-usuarios/agregar-usuarios";
import { EditarUsuario } from "../../components/admninistracion/usuarios_m/usuarios_general/editar-usuarios/editar-usuarios";
import { CombosGeneral } from "../../components/admninistracion/combos_m/combos-general/combos-general";
import { AgregarCombo } from "../../components/admninistracion/combos_m/agregar-combo/agregar-combo";
import { EditarCombo } from "../../components/admninistracion/combos_m/editar-combo/editar-combo";
import { OfertasGeneral } from "../../components/admninistracion/ofertas_m/ofertas-general/ofertas-general";
import { AgregarOferta } from "../../components/admninistracion/ofertas_m/agregar-oferta/agregar-oferta";
import { EditarOferta } from "../../components/admninistracion/ofertas_m/editar-oferta/editar-oferta";
import { AutomovilesGeneral } from "../../components/admninistracion/autos_m/autos-general/autos-general";
import { AgregarAutomovil } from "../../components/admninistracion/autos_m/agregar-auto/agregar-auto";
import { EditarAutomovil } from "../../components/admninistracion/autos_m/editar-auto/editar-auto";
import { MesasGeneral } from "../../components/admninistracion/mesas_m/mesas-general/mesas-general";
import { AgregarMesa } from "../../components/admninistracion/mesas_m/agregar-mesa/agregar-mesa";
import { EditarMesa } from "../../components/admninistracion/mesas_m/editar-mesa/editar-mesa";
import { MineriaDatosComponent } from "../../components/admninistracion/mineriadatos/mineriadatos";

@Component({
  selector: 'app-administracion',
  imports: [CommonModule, ReporteVentasl, EmpleadosGeneral, EditarEmpleado, AgregarEmpleado, AgregarPuesto, EditarPuesto, AgregarUniforme, EditarUniforme, PlatillosGeneral, AgregarPlatillo, EditarPlatillo, AgregarTipoPlatillo, EditarTipoPlatillo, UsuariosGeneral, AgregarUsuario, EditarUsuario, CombosGeneral, AgregarCombo, EditarCombo, OfertasGeneral, AgregarOferta, EditarOferta, AutomovilesGeneral, AgregarAutomovil, EditarAutomovil, MesasGeneral, AgregarMesa, EditarMesa, MineriaDatosComponent],
  templateUrl: './administracion.html',
  styleUrl: './administracion.css',
})
export class Administracion {
  accion = "ventas";
  cambiar_div(accion: string) {
    console.log(accion);
    this.accion = accion
  }

  id_seleccionado: any;
  recibir_id(id: any) {
    console.log(id);
    this.id_seleccionado = id;
  }
  tab_destino_empleados: string = "empleados";
  tab_destino_platillos: string = "platillos";
  recibir_tab_empleado(tab: string) {
    this.tab_destino_empleados = tab;
  }
  recibir_tab_platillo(tab: string) {
    this.tab_destino_platillos = tab;
  }

  reiniciar_tab() {
    this.tab_destino_empleados = "empleados";
    this.tab_destino_platillos = "platillos";

  }
}
