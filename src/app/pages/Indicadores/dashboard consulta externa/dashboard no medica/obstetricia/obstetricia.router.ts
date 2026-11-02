import { Routes } from "@angular/router";


export const obstetriciaRoutes: Routes = [

    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/obtetricia/...
    { path: 'dnm-total-atenciones-ob', loadComponent: () => import('./dnm-total-atenciones-ob/dnm-total-atenciones-ob').then((m) => m.DnmTotalAtencionesOb) },
];