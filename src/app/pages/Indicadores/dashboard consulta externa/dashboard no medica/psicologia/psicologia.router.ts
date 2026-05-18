import { Routes } from '@angular/router';
import { DnmTotalAtencionesPs } from './dnm-total-atenciones-ps/dnm-total-atenciones-ps';

export const psicologiaRoutes: Routes = [
    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/psicologia/..
    { path: 'dnm-total-atenciones-ps', component: DnmTotalAtencionesPs},
];