import { Routes } from "@angular/router";

export const procedimientoTerapeuticosRoutes: Routes = [

    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/procedimientos-terapeuticos/...
    { path: 'dnm-total-atenciones-pt', loadComponent: () => import('./dnm-total-atenciones-pt/dnm-total-atenciones-pt').then((m) => m.DnmTotalAtencionesPt) },
];