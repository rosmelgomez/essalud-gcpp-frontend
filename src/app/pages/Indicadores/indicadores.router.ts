import { Routes } from '@angular/router';
import { consultaExternaRoutes } from './dashboard consulta externa/consulta-externa.router';
import { emergenciaRoutes } from './dashboard-emergencia/emergencia.router';
import { centroQuirurgicoRoutes } from './dashboard-centro-quirurgico/centro-quirurgico';

export const indicadoresRoutes: Routes = [
    //ruta padre /indicador/..
    { path: 'consulta-externa', children: consultaExternaRoutes },
    { path: 'centro-quirurgico', children: centroQuirurgicoRoutes },
    { path: 'emergencia', children: emergenciaRoutes },

];