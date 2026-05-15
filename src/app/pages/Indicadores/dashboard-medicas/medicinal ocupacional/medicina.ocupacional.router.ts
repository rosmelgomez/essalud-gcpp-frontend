import { Routes } from '@angular/router';
import { DmTotalAtencionesMo } from './dm-total-atenciones-mo/dm-total-atenciones-mo';
import { DmTotalHorasEfectivasMo } from './dm-total-horas-efectivas-mo/dm-total-horas-efectivas-mo';
import { DmTotalHorasProgramadasMo } from './dm-total-horas-programadas-mo/dm-total-horas-programadas-mo';
import { DmTotalMedicosMo } from './dm-total-medicos-mo/dm-total-medicos-mo';

export const medicinaOcupacionalRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/medicina-ocupacional/..
    //indicadores medicina ocupacional
    { path: 'dm-total-atenciones-mo', component: DmTotalAtencionesMo },
    { path: 'dm-total-medicos-mo', component: DmTotalMedicosMo },
    { path: 'dm-total-horas-efectivas-mo', component: DmTotalHorasEfectivasMo },
    { path: 'dm-total-horas-programadas-mo', component: DmTotalHorasProgramadasMo },
];