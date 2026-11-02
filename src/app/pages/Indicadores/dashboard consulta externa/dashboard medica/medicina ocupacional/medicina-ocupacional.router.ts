import { Routes } from "@angular/router";



export const medicinaOcupacionalRoutes: Routes = [
    //ruta padre /indicador/consulta-externa/dashboard-medicas/medicina-ocupacional/..
    //indicadores medicina ocupacional
    { path: 'dm-total-atenciones-mo', loadComponent: () => import('./dm-total-atenciones-mo/dm-total-atenciones-mo').then((m) => m.DmTotalAtencionesMo) },
    { path: 'dm-total-medicos-mo', loadComponent: () => import('./dm-total-medicos-mo/dm-total-medicos-mo').then((m) => m.DmTotalMedicosMo) },
    { path: 'dm-total-horas-efectivas-mo', loadComponent: () => import('./dm-total-horas-efectivas-mo/dm-total-horas-efectivas-mo').then((m) => m.DmTotalHorasEfectivasMo) },
    { path: 'dm-total-horas-programadas-mo', loadComponent: () => import('./dm-total-horas-programadas-mo/dm-total-horas-programadas-mo').then((m) => m.DmTotalHorasProgramadasMo) },
];