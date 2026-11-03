import { Routes } from "@angular/router";
import { authenticateGuard } from "../../guards/authenticate-guard";


export const TmiRoutes: Routes = [
    //tmi/..  
    { path: 'administrativo', loadComponent: () => import('./Administrativo/tmi-indicadores').then((m) => m.TmiIndicadores), canActivate: [authenticateGuard], data: { role: ['ADMIN'] }  },
    { path: 'dashboard', loadComponent: () => import('./Dashboard/tmi-dashboard/tmi-dashboard').then((m) => m.TmiDashboard), canActivate: [authenticateGuard], data: { role: ['ADMIN'] }  },
]   