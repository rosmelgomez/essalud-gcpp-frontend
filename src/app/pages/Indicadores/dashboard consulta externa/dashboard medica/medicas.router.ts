import { Routes } from '@angular/router';
import { atencionesMedicasRoutes } from './atencion medica/atenciones-medicas.router';
import { consultaApoyoDescRoutes } from './consulta apoyo desc/consulta-apoyo-desc.router';
import { consultaAtencionInmediataRoutes } from './consulta de atencion inmediata/consulta-atencion-inmediata.router';
import { medicinaComplementariaRoutes } from './medicina complementaria/medicina-complementaria.router';
import { medicosPersonalRoutes } from './medico de personal/medico-personal.router';
import { medicinaOcupacionalRoutes } from './medicina ocupacional/medicina-ocupacional.router';


export const medicasRoutes: Routes = [
    //ruta padre /indicador/dashboard-medicas/..
    {path:'atenciones-medicas', children: atencionesMedicasRoutes },
    {path:'medicina-complementaria', children: medicinaComplementariaRoutes },
    {path:'medicina-ocupacional', children: medicinaOcupacionalRoutes },
    {path:'medico-personal', children: medicosPersonalRoutes },
    {path:'consulta-atencion-inmediata', children: consultaAtencionInmediataRoutes },
    {path:'consulta-apoyo-desc', children: consultaApoyoDescRoutes },
];