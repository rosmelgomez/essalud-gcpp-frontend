import { Routes } from '@angular/router';

export const medicosPersonalRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/medico-personal/..
      //Indicadores de medicos de personal
      { path: 'dm-total-atenciones-mp', loadComponent: () => import('./dm-total-atenciones-mp/dm-total-atenciones-mp').then((m) => m.DmTotalAtencionesMp) },
      { path: 'dm-total-medicos-mp', loadComponent: () => import('./dm-total-medicos-mp/dm-total-medicos-mp').then((m) => m.DmTotalMedicosMp) },
      { path: 'dm-total-horas-efectivas-mp', loadComponent: () => import('./dm-total-horas-efectivas-mp/dm-total-horas-efectivas-mp').then((m) => m.DmTotalHorasEfectivasMp) },
      { path: 'dm-total-horas-programadas-mp', loadComponent: () => import('./dm-total-horas-programadas-mp/dm-total-horas-programadas-mp').then((m) => m.DmTotalHorasProgramadasMp) },  
];