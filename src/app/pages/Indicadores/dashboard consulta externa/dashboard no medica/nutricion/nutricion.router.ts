import { Routes } from "@angular/router";

export const nutricionRoutes: Routes = [

    //ruta padre /indicador/dashboard-no-medicas/nutricion/..
    { path: 'dnm-total-atenciones-nu', loadComponent: () => import('./dnm-total-atenciones-nu/dnm-total-atenciones-nu').then((m) => m.DnmTotalAtencionesNu) },
]