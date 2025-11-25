import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Carrito } from './pages/carrito/carrito';
import { User } from './pages/user/user';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AuthCode } from './pages/auth-code/auth-code';
import { AuthError } from './pages/auth-error/auth-error';
import { Temporal } from './pages/temporal/temporal';
import { Result } from './pages/result/result';
import { DireccionPago } from './pages/direccion-pago/direccion-pago';
import { General } from './pages/general/general';
import { ResumenPedido } from './pages/resumen-pedido/resumen-pedido';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';
import { MeseroInicio } from './pages/mesero/mesero-inicio/mesero-inicio';
import { MeseroMenu } from './pages/mesero/mesero-menu/mesero-menu';
import { Pedido } from './pages/pedido/pedido';
import { Pagar } from './pages/mesero/pagar/pagar';
import { CajeroInicio } from './pages/cajero/cajero-inicio/cajero-inicio';
import { EstacionTrabajo } from './pages/cocinero/estacion-trabajo/estacion-trabajo';
import { Historial } from './pages/historial/historial';
import { Repartidor } from './pages/repartidor/repartidor';
import { Administracion } from './pages/administracion/administracion';

export const routes: Routes = [
    { path: '', component: Home, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1'] } },
    { path: 'carrito', component: Carrito, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1', '2', '4'] } },
    { path: 'usuario', component: User, canActivate: [AuthGuard] },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'auth-code', component: AuthCode },
    { path: 'auth-error', component: AuthError },
    { path: 'result', component: Result, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1'] } },
    { path: 'direccion-pago', component: DireccionPago, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1', '4'] } },
    { path: 'general', component: General, canActivate: [AuthGuard] },
    { path: 'resumen-pedido', component: ResumenPedido, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1', '2', '4'] } },
    { path: 'pedido', component: Pedido, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1', '2', '4'] } },
    { path: 'historial', component: Historial, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1'] } },

    // Mesero
    { path: 'mesero-inicio', component: MeseroInicio, canActivate: [AuthGuard, RoleGuard], data: { roles: ['2'] } },
    { path: 'mesero-menu', component: MeseroMenu, canActivate: [AuthGuard, RoleGuard], data: { roles: ['2', '4'] } },
    { path: 'pagar', component: Pagar, canActivate: [AuthGuard, RoleGuard], data: { roles: ['2', '4'] } },

    //Cocinero
    { path: 'cocina', component: EstacionTrabajo, canActivate: [AuthGuard, RoleGuard], data: { roles: ['3'] } },


    //cajero
    { path: 'cajero-inicio', component: CajeroInicio, canActivate: [AuthGuard, RoleGuard], data: { roles: ['4'] } },

    //Repartidor
    { path: 'repartidor', component: Repartidor, canActivate: [AuthGuard, RoleGuard], data: { roles: ['5'] } },


    //Admin
    { path: 'administracion', component: Administracion },
    { path: 'temporal', component: Temporal }
];
