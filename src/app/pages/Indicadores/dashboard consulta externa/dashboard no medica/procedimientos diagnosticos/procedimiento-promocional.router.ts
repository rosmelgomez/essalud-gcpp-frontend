import { DnmTotalAtencionesPd } from "./dnm-total-atenciones-pd/dnm-total-atenciones-pd";
import { Routes } from "@angular/router";


export const procedimientoPromocionalRoutes: Routes = [
    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/procedimientos-promocional/...
    { path: 'dnm-total-atenciones-pd', component: DnmTotalAtencionesPd }
]