import { Routes } from "@angular/router";
import { SolicitudAccesoRegistro } from "./solicitud-acceso-registro/solicitud-acceso-registro";
import { SolicitudAccesoReports } from "./solicitud-acceso-reports/solicitud-acceso-reports";
import { authenticateGuard } from "../../guards/authenticate-guard";


export const solicitudAccesoRoutes: Routes = [
    //solicitud-acceso/...  
    { path: 'registro', component: SolicitudAccesoRegistro },
    { path: 'reports', component: SolicitudAccesoReports, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
]   