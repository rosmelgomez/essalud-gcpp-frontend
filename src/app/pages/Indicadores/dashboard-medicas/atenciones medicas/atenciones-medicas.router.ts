import { Routes } from '@angular/router';
import { DmTotalAtencionesAm } from './dm-total-atenciones-am/dm-total-atenciones-am';
import { DmTotalAtendidosAm } from './dm-total-atendidos-am/dm-total-atendidos-am';
import { DmTotalMedicosAm } from './dm-total-medicos-am/dm-total-medicos-am';
import { DmTotalHorasEfectivasAm } from './dm-total-horas-efectivas-am/dm-total-horas-efectivas-am';
import { DmTotalHorasProgramadasAm } from './dm-total-horas-programadas-am/dm-total-horas-programadas-am';
import { DmTotalCitadosAm } from './dm-total-citados-am/dm-total-citados-am';
import { DmTotalDesercionAm } from './dm-total-desercion-am/dm-total-desercion-am';


export const atencionesMedicasRoutes: Routes = [

    // la ruta padre es :  /indicador/dashboard-medicas/atenciones-medicas/...

    //indicadores atenciones medicas
    { path: 'dm-total-atenciones-am', component: DmTotalAtencionesAm },
    { path: 'dm-total-pacientes-atendidos-am', component: DmTotalAtendidosAm},
    { path: 'dm-total-medicos-am', component: DmTotalMedicosAm},
    { path: 'dm-total-horas-efectivas-am', component: DmTotalHorasEfectivasAm},
    { path: 'dm-total-horas-programadas-am', component: DmTotalHorasProgramadasAm},
    { path: 'dm-total-citados-am', component: DmTotalCitadosAm},
    { path: 'dm-total-deserciones-am', component: DmTotalDesercionAm},
    
];