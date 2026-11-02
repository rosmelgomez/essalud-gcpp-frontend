import { Routes } from '@angular/router';


export const atencionesMedicasRoutes: Routes = [

    // la ruta padre es :  /indicador/dashboard-medicas/atenciones-medicas/...

    //indicadores atenciones medicas
    { path: 'dm-total-atenciones-am', loadComponent: () => import('./dm-total-atenciones-am/dm-total-atenciones-am').then((m) => m.DmTotalAtencionesAm) },
    { path: 'dm-total-pacientes-atendidos-am', loadComponent: () => import('./dm-total-atendidos-am/dm-total-atendidos-am').then((m) => m.DmTotalAtendidosAm)},
    { path: 'dm-total-medicos-am', loadComponent: () => import('./dm-total-medicos-am/dm-total-medicos-am').then((m) => m.DmTotalMedicosAm)},
    { path: 'dm-total-horas-efectivas-am', loadComponent: () => import('./dm-total-horas-efectivas-am/dm-total-horas-efectivas-am').then((m) => m.DmTotalHorasEfectivasAm)},
    { path: 'dm-total-horas-programadas-am', loadComponent: () => import('./dm-total-horas-programadas-am/dm-total-horas-programadas-am').then((m) => m.DmTotalHorasProgramadasAm)},
    { path: 'dm-total-citados-am', loadComponent: () => import('./dm-total-citados-am/dm-total-citados-am').then((m) => m.DmTotalCitadosAm)},
    { path: 'dm-total-deserciones-am', loadComponent: () => import('./dm-total-desercion-am/dm-total-desercion-am').then((m) => m.DmTotalDesercionAm)},
    
];