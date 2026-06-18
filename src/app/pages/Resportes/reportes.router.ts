import { Routes } from '@angular/router';
import { DashboardMedicas } from './dashboard-medicas/dashboard-medicas';
import { DashboardNoMedicas } from './dashboard-no-medicas/dashboard-no-medicas';
import { DashboardEmergencia } from './dashboard-emergencia/dashboard-emergencia';
import { DashboardTransplante } from './dashboard-transplante/dashboard-transplante';
import { DashboardTramas } from './dashboard-tramas/dashboard-tramas';
import { DashboardProcedimientos } from './dashboard-procedimientos/dashboard-procedimientos';
import { DashboardHospitalizacion } from './dashboard-hospitalizacion/dashboard-hospitalizacion';
import { DashboardGerenciales } from './dashboard-gerenciales/dashboard-gerenciales';
import { DashboardOdontologicas } from './dashboard-odontologicas/dashboard-odontologicas';
import { DashboardReporteador } from './dashboard-reporteador/dashboard-reporteador';
import { DashboardIntervencionesQuirurgicas } from './dashboard-intervenciones-quirurgicas/dashboard-intervenciones-quirurgicas';
import { DashboardTablasHomologadas } from './dashboard-tablas-homologadas/dashboard-tablas-homologadas';
import { DashboardHomologacionCama } from './dashboard-homologacion-cama/dashboard-homologacion-cama';


export const reportesRoutes: Routes = [

    ///ruta padre /reporte/...

    ///dashboard-medicas
    { path: 'dashboard-medicas', component: DashboardMedicas },

    ///dashboard-no-medicas
    { path: 'dashboard-no-medicas', component: DashboardNoMedicas },

    ///dashboard-odontologicas
    { path: 'dashboard-odontologicas', component: DashboardOdontologicas },

    ///dashboard-emergencia
    { path: 'dashboard-emergencia', component: DashboardEmergencia },

    ///Dashboard de intervenciones quirurgicas
    { path: 'dashboard-intervenciones-quirurgicas', component: DashboardIntervencionesQuirurgicas },

    ///dashboard- transplante
    { path: 'dashboard-transplante', component: DashboardTransplante },

    ///dashboard-tramas
    { path: 'dashboard-tramas', component: DashboardTramas },

    //Hospitalizacion
    { path: 'dashboard-hospitalizacion', component: DashboardHospitalizacion },

    ///dashboard-procedimientos
    { path: 'dashboard-procedimientos', component: DashboardProcedimientos },

    ///dashboard-gerenciales
    { path: 'dashboard-gerenciales', component: DashboardGerenciales },

    ///dashboard-reporteador
    { path: 'dashboard-reporteador', component: DashboardReporteador },

    ///dashboard-tablas-homologadas
    { path: 'dashboard-tablas-homologadas', component: DashboardTablasHomologadas },

    ///dashboard-homologacion-cama
    { path: 'dashboard-homologacion-cama', component: DashboardHomologacionCama },


];
