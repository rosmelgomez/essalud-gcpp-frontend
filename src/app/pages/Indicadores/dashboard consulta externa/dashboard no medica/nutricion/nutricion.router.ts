import { Routes } from "@angular/router";
import { DnmTotalAtencionesNu } from "./dnm-total-atenciones-nu/dnm-total-atenciones-nu";

export const nutricionRoutes: Routes = [

    //ruta padre /indicador/dashboard-no-medicas/nutricion/..
    { path: 'dnm-total-atenciones-nu', component: DnmTotalAtencionesNu },
]