import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/Usuarios/register/register';
import { ChangePassword } from './pages/Usuarios/change-password/change-password';
import { ManageUsers } from './pages/Usuarios/manage-users/manage-users';
import { Perfil } from './pages/Usuarios/perfil/perfil'
import { HomePage } from './pages/home-page/home-page';
import { LogsReports } from './pages/logs-reports/logs-reports';
import { authenticateGuard } from './guards/authenticate-guard';
import { redirectGuard } from './guards/redirect-guard'
import { encuestaRoutes } from './pages/Encuestas/encuesta.router';
import { documentoRoutes } from './pages/Gestion-Documentaria/documento.router';
import { reportesRoutes } from './pages/Resportes/reportes.router';
import { indicadoresRoutes } from './pages/Indicadores/indicadores.router';
import { solicitudAccesoRoutes } from './pages/Solicitud-Acceso/solucitud-acceso.router';


export const routes: Routes = [
    { path: '', pathMatch: 'full', canActivate: [redirectGuard], children: [] },

    // core del sistema 
    { path: 'login', component: Login },
    { path: 'register', component: Register, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'change-password', component: ChangePassword, canActivate: [authenticateGuard] },
    { path: 'perfil', component: Perfil, canActivate: [authenticateGuard] },
    { path: 'manage-users', component: ManageUsers, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'home', component: HomePage, canActivate: [authenticateGuard] },
    { path: 'logs-reports', component: LogsReports, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },

    //solicitud de acceso
    { path: 'solicitud-acceso', children: solicitudAccesoRoutes },

    //reports
    { path: 'reporte', children: reportesRoutes, canActivate: [authenticateGuard] },

    ///indicadores
    { path: 'indicador', children: indicadoresRoutes, canActivate: [authenticateGuard] },

    ///Encuesta
    { path: 'encuesta', children: encuestaRoutes, canActivateChild: [authenticateGuard] },

    //Gestion de documentos
    { path: 'documento', children: documentoRoutes, canActivate: [authenticateGuard] },

];
