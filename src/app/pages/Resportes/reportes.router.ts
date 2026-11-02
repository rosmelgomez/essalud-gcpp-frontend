import { Routes } from '@angular/router';


export const reportesRoutes: Routes = [

    ///ruta padre /reporte/...

    ///dashboard-medicas
    { path: 'dashboard-medicas', loadComponent: () => import('./dashboard-medicas/dashboard-medicas').then((m) => m.DashboardMedicas) },

    ///dashboard-no-medicas
    { path: 'dashboard-no-medicas', loadComponent: () => import('./dashboard-no-medicas/dashboard-no-medicas').then((m) => m.DashboardNoMedicas) },

    ///dashboard-odontologicas
    { path: 'dashboard-odontologicas', loadComponent: () => import('./dashboard-odontologicas/dashboard-odontologicas').then((m) => m.DashboardOdontologicas) },

    ///dashboard-emergencia
    { path: 'dashboard-emergencia', loadComponent: () => import('./dashboard-emergencia/dashboard-emergencia').then((m) => m.DashboardEmergencia) },

    ///Dashboard de intervenciones quirurgicas
    { path: 'dashboard-intervenciones-quirurgicas', loadComponent: () => import('./dashboard-intervenciones-quirurgicas/dashboard-intervenciones-quirurgicas').then((m) => m.DashboardIntervencionesQuirurgicas) },

    ///dashboard- transplante
    { path: 'dashboard-transplante', loadComponent: () => import('./dashboard-transplante/dashboard-transplante').then((m) => m.DashboardTransplante) },

    ///dashboard-tramas
    { path: 'dashboard-tramas', loadComponent: () => import('./dashboard-tramas/dashboard-tramas').then((m) => m.DashboardTramas) },

    //Hospitalizacion
    { path: 'dashboard-hospitalizacion', loadComponent: () => import('./dashboard-hospitalizacion/dashboard-hospitalizacion').then((m) => m.DashboardHospitalizacion) },

    ///dashboard-procedimientos
    { path: 'dashboard-procedimientos', loadComponent: () => import('./dashboard-procedimientos/dashboard-procedimientos').then((m) => m.DashboardProcedimientos) },

    ///dashboard-gerenciales
    { path: 'dashboard-gerenciales', loadComponent: () => import('./dashboard-gerenciales/dashboard-gerenciales').then((m) => m.DashboardGerenciales) },

    ///dashboard-reporteador
    { path: 'dashboard-reporteador', loadComponent: () => import('./dashboard-reporteador/dashboard-reporteador').then((m) => m.DashboardReporteador) },

    ///dashboard-tablas-homologadas
    { path: 'dashboard-tablas-homologadas', loadComponent: () => import('./dashboard-tablas-homologadas/dashboard-tablas-homologadas').then((m) => m.DashboardTablasHomologadas) },


    ///dashboard-patologia
    { path: 'dashboard-patologia', loadComponent: () => import('./dashboard-patologia/dashboard-patologia').then((m) => m.DashboardPatologia) },

    ///dashboard-seguimiento-paciente
    { path: 'dashboard-seguimiento-paciente', loadComponent: () => import('./dashboard-seguimiento-paciente/dashboard-seguimiento-paciente').then((m) => m.DashboardSeguimientoPaciente) },

    ///dashboard-farmacia
    { path: 'dashboard-farmacia', loadComponent: () => import('./dashboard-farmacia/dashboard-farmacia').then((m) => m.DashboardFarmacia) },
];
