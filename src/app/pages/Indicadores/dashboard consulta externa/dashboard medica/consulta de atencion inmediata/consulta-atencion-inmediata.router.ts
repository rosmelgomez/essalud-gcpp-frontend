import { Routes } from '@angular/router';

export const consultaAtencionInmediataRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/consulta-atencion-inmediata/..
    //Indicadores de consulta atencion inmediata
    { path: 'dm-total-atenciones-cai', loadComponent: () => import('./dm-total-atenciones-cai/dm-total-atenciones-cai').then((m) => m.DmTotalAtencionesCai) },
    { path: 'dm-total-medicos-cai', loadComponent: () => import('./dm-total-medicos-cai/dm-total-medicos-cai').then((m) => m.DmTotalMedicosCai) },
    { path: 'dm-total-horas-efectivas-cai', loadComponent: () => import('./dm-total-horas-efectivas-cai/dm-total-horas-efectivas-cai').then((m) => m.DmTotalHorasEfectivasCai) },
    { path: 'dm-total-horas-programadas-cai', loadComponent: () => import('./dm-total-horas-programadas-cai/dm-total-horas-programadas-cai').then((m) => m.DmTotalHorasProgramadasCai) },

];