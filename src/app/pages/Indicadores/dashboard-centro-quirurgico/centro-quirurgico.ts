import { Routes } from '@angular/router';
import { intervencionesQuirurgicasRoutes } from './intervenciones-quirurgicas/intervenciones-quirurgicas.router';


export const centroQuirurgicoRoutes: Routes = [
    
    // ruta padre /indicador/centro-quirurgico/..
    { path: 'intervenciones-quirurgicas', children: intervencionesQuirurgicasRoutes},
    
];