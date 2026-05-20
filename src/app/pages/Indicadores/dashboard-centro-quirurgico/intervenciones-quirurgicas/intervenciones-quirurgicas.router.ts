import { Routes } from "@angular/router";
import { gradoComplejidadRoutes } from "./grado-complejidad/grado-complejidad";

export const intervencionesQuirurgicasRoutes:Routes = [

    /// ruta padre /indicador/centro-quirurgico/intervenciones-quirurgicas/..
    {path:'grado-complejidad', children: gradoComplejidadRoutes},
    
]