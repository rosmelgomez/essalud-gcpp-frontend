import { Routes } from "@angular/router";
import { DnmTotalAtencionesTs } from "./dnm-total-atenciones-ts/dnm-total-atenciones-ts";

export const trabajoSocialRoutes: Routes = [
    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/trabajo-social/..
    { path: 'dnm-total-atenciones-ts', component: DnmTotalAtencionesTs },
];