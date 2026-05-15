import { Routes } from '@angular/router';
import { medicasRoutes } from './dashboard-medicas/medicas.router';

export const indicadoresRoutes: Routes = [
    //ruta padre /indicador/..
    {path: 'dashboard-medicas', children: medicasRoutes },
];