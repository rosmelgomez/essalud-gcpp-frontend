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


import { AtenTopicos1 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-1/aten-topicos-1';
import { AtenTopicos2 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-2/aten-topicos-2';
import { AtenTopicos3 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-3/aten-topicos-3';
import { AtenTopicos4 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-4/aten-topicos-4';
import { AtenTopicos5 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-5/aten-topicos-5';

import { DnmTotalAtencionesOb } from './pages/Indicadores/dashboard-no-medicas/obstetricia/dnm-total-atenciones-ob/dnm-total-atenciones-ob';
import { DnmTotalAtencionesPs } from './pages/Indicadores/dashboard-no-medicas/psicologia/dnm-total-atenciones-ps/dnm-total-atenciones-ps';
import { DnmTotalAtencionesPd } from './pages/Indicadores/dashboard-no-medicas/procedimientos diagnosticos/dnm-total-atenciones-pd/dnm-total-atenciones-pd';
import { DnmTotalAtencionesPp } from './pages/Indicadores/dashboard-no-medicas/preventivo promocional/dnm-total-atenciones-pp/dnm-total-atenciones-pp';
import { DnmTotalAtencionesEn } from './pages/Indicadores/dashboard-no-medicas/enfermeria/dnm-total-atenciones-en/dnm-total-atenciones-en';
import { DnmTotalAtencionesNu } from './pages/Indicadores/dashboard-no-medicas/nutricion/dnm-total-atenciones-nu/dnm-total-atenciones-nu';
import { DnmTotalAtencionesTs } from './pages/Indicadores/dashboard-no-medicas/trabajo social/dnm-total-atenciones-ts/dnm-total-atenciones-ts';
import { DnmTotalAtencionesPt } from './pages/Indicadores/dashboard-no-medicas/procedimientos terapeuticos/dnm-total-atenciones-pt/dnm-total-atenciones-pt';

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
    //{ path: 'dashboard-no-medicas', component: ReportDashboardNoMedicas, canActivate: [authenticateGuard] },

    //indicadores de obstetricia
    { path: 'dnm-total-atenciones-ob', component: DnmTotalAtencionesOb, canActivate: [authenticateGuard] },

    //indicadores de preventivo promocional
    { path: 'dnm-total-atenciones-pp', component: DnmTotalAtencionesPp, canActivate: [authenticateGuard] },

    //indicadores de nutricion
    { path: 'dnm-total-atenciones-nu', component: DnmTotalAtencionesNu, canActivate: [authenticateGuard] },

    //indicadores de enfermeria
    { path: 'dnm-total-atenciones-en', component: DnmTotalAtencionesEn, canActivate: [authenticateGuard] },

    //indicadores de psicologia
    { path: 'dnm-total-atenciones-ps', component: DnmTotalAtencionesPs, canActivate: [authenticateGuard] },

    //indicadores de trabajo social
    { path: 'dnm-total-atenciones-ts', component: DnmTotalAtencionesTs, canActivate: [authenticateGuard] },

    //indicadores de procedimientos terapeuticos
    { path: 'dnm-total-atenciones-pt', component: DnmTotalAtencionesPt, canActivate: [authenticateGuard] },

    //indicadores de procedimientos diagnosticos
    { path: 'dnm-total-atenciones-pd', component: DnmTotalAtencionesPd, canActivate: [authenticateGuard] },

    ///Dashboard de odontologicas
    { path: 'dashboard-odontologicas', component: ReportDashboardOdontologicas, canActivate: [authenticateGuard] },


    ///dashboard-emergencia
    //{ path: 'dashboard-eme', component: ReportDashboardEme, canActivate: [authenticateGuard] },

    ///atenciones por prioridad
    { path: 'ate-prioridad1', component: AtenTopicos1, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad2', component: AtenTopicos2, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad3', component: AtenTopicos3, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad4', component: AtenTopicos4, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad5', component: AtenTopicos5, canActivate: [authenticateGuard] },


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
