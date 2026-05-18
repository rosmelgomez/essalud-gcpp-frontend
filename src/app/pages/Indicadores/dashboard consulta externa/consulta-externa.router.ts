import { Routes } from "@angular/router";
import { medicasRoutes } from "./dashboard medica/medicas.router";
import { noMedicasRoutes } from "./dashboard no medica/no-medicas.router";


export  const consultaExternaRoutes: Routes = [
        //ruta padre /indicador/consulta-externa/..
        { path: 'dashboard-medicas', children: medicasRoutes },
        { path: 'dashboard-no-medicas', children: noMedicasRoutes },
]