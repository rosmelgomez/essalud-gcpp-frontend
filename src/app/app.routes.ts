import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/Usuarios/register/register';
import { ChangePassword } from './pages/Usuarios/change-password/change-password';
import { ManageUsers } from './pages/Usuarios/manage-users/manage-users';

import { HomePage } from './pages/home-page/home-page';
import { LogsReports } from './pages/logs-reports/logs-reports';

import { ReportsGerenciales } from './pages/Resportes/reports-gerenciales/reports-gerenciales';
import { authenticateGuard } from './guards/authenticate-guard';
import { redirectGuard } from './guards/redirect-guard';

import { ReportDashboardIntervencionesQuirurgicas } from './pages/Resportes/report-dashboard-intervenciones-quirurgicas/report-dashboard-intervenciones-quirurgicas';
import { DiqComplejidadAGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-a-gc/diq-complejidad-a-gc';
import { DiqComplejidadBGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-b-gc/diq-complejidad-b-gc';
import { DiqComplejidadCGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-c-gc/diq-complejidad-c-gc';
import { DiqComplejidadDGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-d-gc/diq-complejidad-d-gc';
import { DiqComplejidadEGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-e-gc/diq-complejidad-e-gc';
import { DiqSinComplejidadGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-sin-complejidad-gc/diq-sin-complejidad-gc';

import { ReportDashboardReporteador } from './pages/Resportes/report-dashboard-reporteador/report-dashboard-reporteador';
import { ReportDashboardOdontologicas } from './pages/Resportes/report-dashboard-odontologicas/report-dashboard-odontologicas';

import { SolicitudAccesoRegistro } from './pages/Solicitud-Acceso/solicitud-acceso-registro/solicitud-acceso-registro';
import { SolicitudAccesoReports } from './pages/Solicitud-Acceso/solicitud-acceso-reports/solicitud-acceso-reports';
import { ReportDashboardTransplante } from './pages/Resportes/report-dashboard-transplante/report-dashboard-transplante';

import { TablasHomologadas } from './pages/tablas-homologadas/tablas-homologadas';
import { ReportDashboard } from './pages/Resportes/report-dashboard/report-dashboard';
import { encuestaRoutes } from './pages/Encuestas/encuesta.router';
import { documentoRoutes } from './pages/Gestion-Documentaria/documento.router';
import { reportesRoutes } from './pages/Resportes/reportes.router';
import { indicadoresRoutes } from './pages/Indicadores/indicadores.router';
import { DnmTotalAtencionesPd } from './pages/Indicadores/dashboard consulta externa/dashboard no medica/procedimientos diagnosticos/dnm-total-atenciones-pd/dnm-total-atenciones-pd';
import { DnmTotalAtencionesPt } from './pages/Indicadores/dashboard consulta externa/dashboard no medica/procedimientos terapeuticos/dnm-total-atenciones-pt/dnm-total-atenciones-pt';


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
    { path: 'reports-gerenciales', component: ReportsGerenciales, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },


    { path: 'reporte', children:reportesRoutes, canActivate: [authenticateGuard] },

    ///indicadores
    {path: 'indicador', children: indicadoresRoutes, canActivate: [authenticateGuard] },


    ///dashboard-no-medicas

    //indicadores de procedimientos terapeuticos
    { path: 'dnm-total-atenciones-pt', component: DnmTotalAtencionesPt, canActivate: [authenticateGuard] },

    //indicadores de procedimientos diagnosticos
    { path: 'dnm-total-atenciones-pd', component: DnmTotalAtencionesPd, canActivate: [authenticateGuard] },

    ///Dashboard de odontologicas
    { path: 'dashboard-odontologicas', component: ReportDashboardOdontologicas, canActivate: [authenticateGuard] },


    ///Dashboard de intervenciones quirurgicas
    { path: 'dashboard-intervenciones-quirurgicas', component: ReportDashboardIntervencionesQuirurgicas, canActivate: [authenticateGuard] },

    ///indicadores de intervenciones quirurgicas por grado de complejidad
    { path: 'diq-complejidad-a-gc', component: DiqComplejidadAGc, canActivate: [authenticateGuard] },
    { path: 'diq-complejidad-b-gc', component: DiqComplejidadBGc, canActivate: [authenticateGuard] },
    { path: 'diq-complejidad-c-gc', component: DiqComplejidadCGc, canActivate: [authenticateGuard] },
    { path: 'diq-complejidad-d-gc', component: DiqComplejidadDGc, canActivate: [authenticateGuard] },
    { path: 'diq-complejidad-e-gc', component: DiqComplejidadEGc, canActivate: [authenticateGuard] },
    { path: 'diq-sin-complejidad-gc', component: DiqSinComplejidadGc, canActivate: [authenticateGuard] },


    ///dashboard- transplante
    //{ path: 'dashboard-transplante', component: ReportDashboardTransplante, canActivate: [authenticateGuard] },


    ///dashboard-reporteador
    { path: 'dashboard-reporteador', component: ReportDashboardReporteador, canActivate: [authenticateGuard] },


    ///Tablas homologadas
    { path: 'tablas-homologadas', component: TablasHomologadas, canActivate: [authenticateGuard] },

    ///Encuesta

    { path: 'encuesta', children: encuestaRoutes, canActivateChild: [authenticateGuard] },

    //Gestion de documentos
    {path:'documentos', children: documentoRoutes, canActivate: [authenticateGuard]  },


];
