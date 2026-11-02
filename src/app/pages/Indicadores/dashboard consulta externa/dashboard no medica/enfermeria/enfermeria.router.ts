import { Routes } from "@angular/router";

export const enfermeriaRoutes: Routes = [
    //ruta padre /indicador/dashboard-no-medicas/enfermeria/..
    { path: 'dnm-total-atenciones-en', loadComponent: () => import('./dnm-total-atenciones-en/dnm-total-atenciones-en').then((m) => m.DnmTotalAtencionesEn) },
]