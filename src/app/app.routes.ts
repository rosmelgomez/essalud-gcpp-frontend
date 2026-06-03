import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/Usuarios/register/register';
import { ChangePassword } from './pages/Usuarios/change-password/change-password';
import { ManageUsers } from './pages/Usuarios/manage-users/manage-users';

import { HomePage } from './pages/home-page/home-page';
import { LogsReports } from './pages/logs-reports/logs-reports';

import { authenticateGuard } from './guards/authenticate-guard';
import { redirectGuard } from './guards/redirect-guard';

import { ReportDashboardReporteador } from './pages/Resportes/report-dashboard-reporteador/report-dashboard-reporteador';
import { ReportDashboardOdontologicas } from './pages/Resportes/report-dashboard-odontologicas/report-dashboard-odontologicas';

import { SolicitudAccesoRegistro } from './pages/Solicitud-Acceso/solicitud-acceso-registro/solicitud-acceso-registro';
import { SolicitudAccesoReports } from './pages/Solicitud-Acceso/solicitud-acceso-reports/solicitud-acceso-reports';

import { TablasHomologadas } from './pages/tablas-homologadas/tablas-homologadas';
import { encuestaRoutes } from './pages/Encuestas/encuesta.router';
import { documentoRoutes } from './pages/Gestion-Documentaria/documento.router';
import { reportesRoutes } from './pages/Resportes/reportes.router';
import { indicadoresRoutes } from './pages/Indicadores/indicadores.router';


export const routes: Routes = [
    { path: '', pathMatch: 'full', canActivate: [redirectGuard], children: [] },

    //solicitud de acceso
    { path: 'solicitar-acceso-registro', component: SolicitudAccesoRegistro },
    { path: 'solicitud-acceso-reports', component: SolicitudAccesoReports, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },


    { path: 'login', component: Login },
    { path: 'register', component: Register, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'change-password', component: ChangePassword, canActivate: [authenticateGuard] },
    { path: 'manage-users', component: ManageUsers, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'home', component: HomePage, canActivate: [authenticateGuard] },
    { path: 'logs-reports', component: LogsReports, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },

    { path: 'reporte', children: reportesRoutes, canActivate: [authenticateGuard] },

    ///indicadores
    { path: 'indicador', children: indicadoresRoutes, canActivate: [authenticateGuard] },


    ///dashboard- transplante
    //{ path: 'dashboard-transplante', component: ReportDashboardTransplante, canActivate: [authenticateGuard] },


    ///dashboard-reporteador
    { path: 'dashboard-reporteador', component: ReportDashboardReporteador, canActivate: [authenticateGuard] },


    ///Tablas homologadas
    { path: 'tablas-homologadas', component: TablasHomologadas, canActivate: [authenticateGuard] },

    ///Encuesta

    { path: 'encuesta', children: encuestaRoutes, canActivateChild: [authenticateGuard] },

    //Gestion de documentos
    { path: 'documentos', children: documentoRoutes, canActivate: [authenticateGuard] },


];
