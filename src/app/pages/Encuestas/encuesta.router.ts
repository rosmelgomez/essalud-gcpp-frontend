import { Routes } from '@angular/router';

export const encuestaRoutes: Routes = [

       //ruta padre /encuesta/..
       { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
       { path: 'register', loadComponent: () => import('./encuesta/encuesta').then((m) => m.Encuesta) },
       { path: 'dashboard', loadComponent: () => import('./dashboard-encuesta/dashboard-encuesta').then((m) => m.DashboardEncuesta), data: { role: ['ADMIN'] } },

];