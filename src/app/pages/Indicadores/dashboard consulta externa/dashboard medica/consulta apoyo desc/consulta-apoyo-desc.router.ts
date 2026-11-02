import { Routes } from '@angular/router';

export const consultaApoyoDescRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/consulta-apoyo-desc/..
    //indicadores consulta apoyo desc
    { path: 'dm-total-atenciones-cad', loadComponent: () => import('./dm-total-atenciones-cad/dm-total-atenciones-cad').then((m) => m.DmTotalAtencionesCad) },
    { path: 'dm-total-medicos-cad', loadComponent: () => import('./dm-total-medicos-cad/dm-total-medicos-cad').then((m) => m.DmTotalMedicosCad) },
    { path: 'dm-total-horas-efectivas-cad', loadComponent: () => import('./dm-total-horas-efectivas-cad/dm-total-horas-efectivas-cad').then((m) => m.DmTotalHorasEfectivasCad) },
    { path: 'dm-total-horas-programadas-cad', loadComponent: () => import('./dm-total-horas-programadas-cad/dm-total-horas-programadas-cad').then((m) => m.DmTotalHorasProgramadasCad) },
];