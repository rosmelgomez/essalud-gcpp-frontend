import { Routes } from '@angular/router';

export const psicologiaRoutes: Routes = [
    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/psicologia/..
    { path: 'dnm-total-atenciones-ps', loadComponent: () => import('./dnm-total-atenciones-ps/dnm-total-atenciones-ps').then((m) => m.DnmTotalAtencionesPs)},
];