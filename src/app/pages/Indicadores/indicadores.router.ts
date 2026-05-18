import { Routes } from '@angular/router';
import { consultaExternaRoutes } from './dashboard consulta externa/consulta-externa.router';
import { emergenciaRoutes } from './dashboard-emergencia/emergencia.router';

export const indicadoresRoutes: Routes = [
    //ruta padre /indicador/..
    { path: 'consulta-externa', children: consultaExternaRoutes },
    { path: 'dashboard-emergencia', children: emergenciaRoutes },

];