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

export const routes: Routes = [
    { path: '', component: Home, canActivate: [AuthGuard, RoleGuard], data: { roles: ['1'] } },
    { path: 'carrito', component: Carrito, canActivate: [AuthGuard] },
    { path: 'usuario', component: User, canActivate: [AuthGuard] },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'auth-code', component: AuthCode },
    { path: 'auth-error', component: AuthError },
    { path: 'result', component: Result, canActivate: [AuthGuard] },
    { path: 'direccion-pago', component: DireccionPago, canActivate: [AuthGuard] },
    { path: 'general', component: General, canActivate: [AuthGuard] },
    { path: 'resumen-pedido', component: ResumenPedido, canActivate: [AuthGuard] },


    { path: 'temporal', component: Temporal }
];
