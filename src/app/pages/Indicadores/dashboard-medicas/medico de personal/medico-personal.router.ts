import { Routes } from '@angular/router';
import { DmTotalAtencionesMp } from './dm-total-atenciones-mp/dm-total-atenciones-mp';
import { DmTotalHorasEfectivasMp } from './dm-total-horas-efectivas-mp/dm-total-horas-efectivas-mp';
import { DmTotalHorasProgramadasMp } from './dm-total-horas-programadas-mp/dm-total-horas-programadas-mp';
import { DmTotalMedicosMp } from './dm-total-medicos-mp/dm-total-medicos-mp';

export const medicosPersonalRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/medico-personal/..
      //Indicadores de medicos de personal
      { path: 'dm-total-atenciones-mp', component: DmTotalAtencionesMp },
      { path: 'dm-total-medicos-mp', component: DmTotalMedicosMp },
      { path: 'dm-total-horas-efectivas-mp', component: DmTotalHorasEfectivasMp },
      { path: 'dm-total-horas-programadas-mp', component: DmTotalHorasProgramadasMp },  
];