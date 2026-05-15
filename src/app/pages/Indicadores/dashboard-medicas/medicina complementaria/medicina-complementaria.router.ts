import { Routes } from '@angular/router';
import { DmTotalAtencionesMc } from './dm-total-atenciones-mc/dm-total-atenciones-mc';
import { DmTotalHorasEfectivasMc } from './dm-total-horas-efectivas-mc/dm-total-horas-efectivas-mc';
import { DmTotalHorasProgramadasMc } from './dm-total-horas-programadas-mc/dm-total-horas-programadas-mc';
import { DmTotalMedicosMc } from './dm-total-medicos-mc/dm-total-medicos-mc';

export const medicinaComplementariaRoutes: Routes = [

   // la ruta padre es :  /indicador/dashboard-medicas/medicina-complementaria/...
    //indicadores medicina complementaria
    { path: 'dm-total-atenciones-mc', component: DmTotalAtencionesMc },
    { path: 'dm-total-medicos-mc', component: DmTotalMedicosMc },
    { path: 'dm-total-horas-efectivas-mc', component: DmTotalHorasEfectivasMc },
    { path: 'dm-total-horas-programadas-mc', component: DmTotalHorasProgramadasMc },


];