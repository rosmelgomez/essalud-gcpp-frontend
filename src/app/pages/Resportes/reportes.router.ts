import { Routes } from '@angular/router';
import { ReportDashboard } from './report-dashboard/report-dashboard';
import { ReportDashboardMedicas } from './report-dashboard-medicas/report-dashboard-medicas';
import { ReportDashboardNoMedicas } from './report-dashboard-no-medicas/report-dashboard-no-medicas';
import { ReportDashboardEme } from './report-dashboard-eme/report-dashboard-eme';
import { ReportDashboardIntervencionesQuirurgicas } from './report-dashboard-intervenciones-quirurgicas/report-dashboard-intervenciones-quirurgicas';
import { ReportDashboardTransplante } from './report-dashboard-transplante/report-dashboard-transplante';
import { authenticateGuard } from '../../guards/authenticate-guard';
import { ReportDashboardTramas } from './report-dashboard-tramas/report-dashboard-tramas';
import { DashboardProcedimientos } from './dashboard-procedimientos/dashboard-procedimientos';
import { DashboardHospitalizacion } from './dashboard-hospitalizacion/dashboard-hospitalizacion';
import { ReportsGerenciales } from './reports-gerenciales/reports-gerenciales';
import { ReportDashboardOdontologicas } from './report-dashboard-odontologicas/report-dashboard-odontologicas';

export const reportesRoutes: Routes = [

    { path: 'select', component: ReportDashboard, canActivate: [authenticateGuard] },

    ///dashboard-medicas
    { path: 'dashboard-medicas', component: ReportDashboardMedicas, canActivate: [authenticateGuard] },

    ///dashboard-no-medicas
    { path: 'dashboard-no-medicas', component: ReportDashboardNoMedicas, canActivate: [authenticateGuard] },

    ///dashboard-odontologicas
    { path: 'dashboard-odontologicas', component: ReportDashboardOdontologicas, canActivate: [authenticateGuard] },

    ///dashboard-emergencia
    { path: 'dashboard-eme', component: ReportDashboardEme, canActivate: [authenticateGuard] },

    ///Dashboard de intervenciones quirurgicas
    { path: 'dashboard-intervenciones-quirurgicas', component: ReportDashboardIntervencionesQuirurgicas, canActivate: [authenticateGuard] },

    ///dashboard- transplante
    { path: 'dashboard-transplante', component: ReportDashboardTransplante, canActivate: [authenticateGuard] },

    ///dashboard-tramas
    { path: 'dashboard-tramas', component: ReportDashboardTramas, canActivate: [authenticateGuard] },

    //Hospitalizacion
    { path: 'dashboard-hospitalizacion', component: DashboardHospitalizacion, canActivate: [authenticateGuard] },

    ///dashboard-procedimientos
    { path: 'dashboard-procedimientos', component: DashboardProcedimientos, canActivate: [authenticateGuard] },

    ///reports-gerenciales
    { path: 'reports-gerenciales', component: ReportsGerenciales, canActivate: [authenticateGuard] },

];
