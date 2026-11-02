import { Routes } from "@angular/router";

export const preventivoPromocionalRoutes: Routes = [

    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/preventivo-promocional/...
    { path: 'dnm-total-atenciones-pp', loadComponent: () => import('./dnm-total-atenciones-pp/dnm-total-atenciones-pp').then((m) => m.DnmTotalAtencionesPp)},
];