import { Routes } from "@angular/router";
import { AtenTopicos2 } from "./aten-topicos-2/aten-topicos-2";
import { AtenTopicos3 } from "./aten-topicos-3/aten-topicos-3";
import { AtenTopicos4 } from "./aten-topicos-4/aten-topicos-4";
import { AtenTopicos5 } from "./aten-topicos-5/aten-topicos-5";
import { AtenTopicos1 } from "./aten-topicos-1/aten-topicos-1";


export const emergenciaRoutes: Routes = [

    // Ruta padre /indicador/emergencia/..
    { path: 'ate-prioridad1', component: AtenTopicos1 },
    { path: 'ate-prioridad2', component: AtenTopicos2 },
    { path: 'ate-prioridad3', component: AtenTopicos3 },
    { path: 'ate-prioridad4', component: AtenTopicos4 },
    { path: 'ate-prioridad5', component: AtenTopicos5 },


]