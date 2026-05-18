import { Routes } from "@angular/router";
import { DnmTotalAtencionesEn } from "./dnm-total-atenciones-en/dnm-total-atenciones-en";

export const enfermeriaRoutes: Routes = [
    //ruta padre /indicador/dashboard-no-medicas/enfermeria/..
    { path: 'dnm-total-atenciones-en', component: DnmTotalAtencionesEn },
]