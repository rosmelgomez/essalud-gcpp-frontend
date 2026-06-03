import { Routes } from "@angular/router";
import { DnmTotalAtencionesPt } from "./dnm-total-atenciones-pt/dnm-total-atenciones-pt";

export const procedimientoTerapeuticosRoutes: Routes = [

    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/procedimientos-terapeuticos/...
    { path: 'dnm-total-atenciones-pt', component: DnmTotalAtencionesPt },
];