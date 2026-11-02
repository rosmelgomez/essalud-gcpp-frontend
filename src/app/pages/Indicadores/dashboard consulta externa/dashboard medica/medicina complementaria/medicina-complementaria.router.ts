import { Routes } from '@angular/router';

export const medicinaComplementariaRoutes: Routes = [

   // la ruta padre es :  /indicador/dashboard-medicas/medicina-complementaria/...
    //indicadores medicina complementaria
    { path: 'dm-total-atenciones-mc', loadComponent: () => import('./dm-total-atenciones-mc/dm-total-atenciones-mc').then((m) => m.DmTotalAtencionesMc) },
    { path: 'dm-total-medicos-mc', loadComponent: () => import('./dm-total-medicos-mc/dm-total-medicos-mc').then((m) => m.DmTotalMedicosMc) },
    { path: 'dm-total-horas-efectivas-mc', loadComponent: () => import('./dm-total-horas-efectivas-mc/dm-total-horas-efectivas-mc').then((m) => m.DmTotalHorasEfectivasMc) },
    { path: 'dm-total-horas-programadas-mc', loadComponent: () => import('./dm-total-horas-programadas-mc/dm-total-horas-programadas-mc').then((m) => m.DmTotalHorasProgramadasMc) },


];