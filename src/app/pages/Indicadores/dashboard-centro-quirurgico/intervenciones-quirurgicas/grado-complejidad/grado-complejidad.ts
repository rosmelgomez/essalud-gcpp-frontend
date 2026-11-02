import { Routes } from '@angular/router';


export const gradoComplejidadRoutes: Routes = [

    // ruta padre /indicador/centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/..
    { path: 'diq-complejidad-a-gc', loadComponent: () => import('./diq-complejidad-a-gc/diq-complejidad-a-gc').then((m) => m.DiqComplejidadAGc)},
    { path: 'diq-complejidad-b-gc', loadComponent: () => import('./diq-complejidad-b-gc/diq-complejidad-b-gc').then((m) => m.DiqComplejidadBGc)},
    { path: 'diq-complejidad-c-gc', loadComponent: () => import('./diq-complejidad-c-gc/diq-complejidad-c-gc').then((m) => m.DiqComplejidadCGc)},
    { path: 'diq-complejidad-d-gc', loadComponent: () => import('./diq-complejidad-d-gc/diq-complejidad-d-gc').then((m) => m.DiqComplejidadDGc)},
    { path: 'diq-complejidad-e-gc', loadComponent: () => import('./diq-complejidad-e-gc/diq-complejidad-e-gc').then((m) => m.DiqComplejidadEGc)},
    { path: 'diq-sin-complejidad-gc', loadComponent: () => import('./diq-sin-complejidad-gc/diq-sin-complejidad-gc').then((m) => m.DiqSinComplejidadGc)},

];