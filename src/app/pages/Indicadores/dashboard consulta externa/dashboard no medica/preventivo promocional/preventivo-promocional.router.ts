import { Routes } from "@angular/router";
import { DnmTotalAtencionesPp } from "./dnm-total-atenciones-pp/dnm-total-atenciones-pp";

export const preventivoPromocionalRoutes: Routes = [

    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/preventivo-promocional/...
    { path: 'dnm-total-atenciones-pp', component: DnmTotalAtencionesPp},
];