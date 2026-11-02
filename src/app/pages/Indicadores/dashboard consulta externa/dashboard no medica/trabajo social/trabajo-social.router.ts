import { Routes } from "@angular/router";

export const trabajoSocialRoutes: Routes = [
    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/trabajo-social/..
    { path: 'dnm-total-atenciones-ts', loadComponent: () => import('./dnm-total-atenciones-ts/dnm-total-atenciones-ts').then((m) => m.DnmTotalAtencionesTs) },
];