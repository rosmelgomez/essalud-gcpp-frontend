import { Routes } from "@angular/router";


export const emergenciaRoutes: Routes = [

    // Ruta padre /indicador/emergencia/..
    { path: 'ate-prioridad1', loadComponent: () => import('./aten-topicos-1/aten-topicos-1').then((m) => m.AtenTopicos1) },
    { path: 'ate-prioridad2', loadComponent: () => import('./aten-topicos-2/aten-topicos-2').then((m) => m.AtenTopicos2) },
    { path: 'ate-prioridad3', loadComponent: () => import('./aten-topicos-3/aten-topicos-3').then((m) => m.AtenTopicos3) },
    { path: 'ate-prioridad4', loadComponent: () => import('./aten-topicos-4/aten-topicos-4').then((m) => m.AtenTopicos4) },
    { path: 'ate-prioridad5', loadComponent: () => import('./aten-topicos-5/aten-topicos-5').then((m) => m.AtenTopicos5) },


]