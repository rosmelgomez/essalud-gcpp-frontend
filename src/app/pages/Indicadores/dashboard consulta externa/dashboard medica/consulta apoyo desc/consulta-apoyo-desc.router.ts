import { Routes } from '@angular/router';
import { DmTotalAtencionesCad } from './dm-total-atenciones-cad/dm-total-atenciones-cad';
import { DmTotalHorasEfectivasCad } from './dm-total-horas-efectivas-cad/dm-total-horas-efectivas-cad';
import { DmTotalHorasProgramadasCad } from './dm-total-horas-programadas-cad/dm-total-horas-programadas-cad';
import { DmTotalMedicosCad } from './dm-total-medicos-cad/dm-total-medicos-cad';

export const consultaApoyoDescRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/consulta-apoyo-desc/..
    //indicadores consulta apoyo desc
    { path: 'dm-total-atenciones-cad', component: DmTotalAtencionesCad },
    { path: 'dm-total-medicos-cad', component: DmTotalMedicosCad },
    { path: 'dm-total-horas-efectivas-cad', component: DmTotalHorasEfectivasCad },
    { path: 'dm-total-horas-programadas-cad', component: DmTotalHorasProgramadasCad },
];