import { Routes } from "@angular/router";
import { DnmTotalAtencionesOb } from "./dnm-total-atenciones-ob/dnm-total-atenciones-ob";


export const obstetriciaRoutes: Routes = [

    //ruta padre /indicador/consulta-externa/dashboard-no-medicas/obtetricia/...
    { path: 'dnm-total-atenciones-ob', component: DnmTotalAtencionesOb },
];