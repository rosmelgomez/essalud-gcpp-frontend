import { Routes } from "@angular/router";
import { authenticateGuard } from "../../guards/authenticate-guard";


export const solicitudAccesoRoutes: Routes = [
    //solicitud-acceso/...  
    { path: 'registro', loadComponent: () => import('./solicitud-acceso-registro/solicitud-acceso-registro').then((m) => m.SolicitudAccesoRegistro) },
    { path: 'reports', loadComponent: () => import('./solicitud-acceso-reports/solicitud-acceso-reports').then((m) => m.SolicitudAccesoReports), canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
]   