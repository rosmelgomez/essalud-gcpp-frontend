import { Routes } from '@angular/router';
import { DmTotalAtencionesCai } from './dm-total-atenciones-cai/dm-total-atenciones-cai';
import { DmTotalHorasEfectivasCai } from './dm-total-horas-efectivas-cai/dm-total-horas-efectivas-cai';
import { DmTotalHorasProgramadasCai } from './dm-total-horas-programadas-cai/dm-total-horas-programadas-cai';
import { DmTotalMedicosCai } from './dm-total-medicos-cai/dm-total-medicos-cai';

export const consultaAtencionInmediataRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/consulta-atencion-inmediata/..
    //Indicadores de consulta atencion inmediata
    { path: 'dm-total-atenciones-cai', component: DmTotalAtencionesCai },
    { path: 'dm-total-medicos-cai', component: DmTotalMedicosCai },
    { path: 'dm-total-horas-efectivas-cai', component: DmTotalHorasEfectivasCai },
    { path: 'dm-total-horas-programadas-cai', component: DmTotalHorasProgramadasCai },

];