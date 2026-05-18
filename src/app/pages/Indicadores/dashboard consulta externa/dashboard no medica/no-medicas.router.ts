import { Routes } from '@angular/router';
import { obstetriciaRoutes } from './obstetricia/obstetricia.router';
import { preventivoPromocionalRoutes } from './preventivo promocional/preventivo-promocional.router';
import { nutricionRoutes } from './nutricion/nutricion.router';
import { enfermeriaRoutes } from './enfermeria/enfermeria.router';
import { psicologiaRoutes } from './psicologia/psicologia.router';
import { trabajoSocialRoutes } from './trabajo social/trabajo-social.router';


export const noMedicasRoutes: Routes = [
    //ruta padre /indicador/dashboard-no-medicas/..
    { path: 'obstetricia', children: obstetriciaRoutes },
    { path: 'preventivo-promocional', children: preventivoPromocionalRoutes },
    { path: 'nutricion', children: nutricionRoutes },
    { path: 'enfermeria', children: enfermeriaRoutes },
    { path: 'psicologia', children: psicologiaRoutes },
    { path: 'trabajo-social', children: trabajoSocialRoutes },
];