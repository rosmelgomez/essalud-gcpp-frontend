import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { HomePage } from './pages/home-page/home-page';
import { authenticateGuard } from './guards/authenticate-guard';
import { redirectGuard } from './guards/redirect-guard'
import { encuestaRoutes } from './pages/Encuestas/encuesta.router';
import { documentoRoutes } from './pages/Gestion-Documentaria/documento.router';
import { reportesRoutes } from './pages/Resportes/reportes.router';
import { indicadoresRoutes } from './pages/Indicadores/indicadores.router';
import { solicitudAccesoRoutes } from './pages/Solicitud-Acceso/solucitud-acceso.router';
import { usuarioRoutes } from './pages/Usuarios/usuario.router';
import { TmiIndicadores } from './pages/tmi-indicadores/tmi-indicadores';
import { LogsReports } from './pages/logs-reports/logs-reports';


export const routes: Routes = [
    { path: '', pathMatch: 'full', canActivate: [redirectGuard], children: [] },

    // core del sistema 
    { path: 'login', component: Login },


    // home page
    { path: 'home', component: HomePage, canActivate: [authenticateGuard] },

    // usuarios
    { path: 'usuario', children: usuarioRoutes, canActivate: [authenticateGuard] },

    //solicitud de acceso
    { path: 'solicitud-acceso', children: solicitudAccesoRoutes },

    //logs
    { path: 'logs-reports', component: LogsReports, canActivate: [authenticateGuard] },

    //reports
    { path: 'reporte', children: reportesRoutes, canActivate: [authenticateGuard] },

    //indicadores
    { path: 'indicador', children: indicadoresRoutes, canActivate: [authenticateGuard] },

    //Encuesta
    { path: 'encuesta', children: encuestaRoutes, canActivateChild: [authenticateGuard] },

    //Gestion de documentos
    { path: 'documento', children: documentoRoutes, canActivate: [authenticateGuard] },

    //tmi
    { path: 'tmi', component: TmiIndicadores, canActivate: [authenticateGuard] },

];
