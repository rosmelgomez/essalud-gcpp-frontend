import { Routes } from "@angular/router";
import { authenticateGuard } from "../../guards/authenticate-guard";


export const TmiRoutes: Routes = [
    //tmi/..   
    { path: 'administrativo', loadComponent: () => import('./Administrativo/tmi-indicadores').then((m) => m.TmiIndicadores), canActivate: [authenticateGuard], data: { role: ['ADMIN'], accessTmi: true }  },   // ADMIN y usuario.access_tmi = true
    { path: 'dashboard', loadComponent: () => import('./Dashboard/tmi-dashboard/tmi-dashboard').then((m) => m.TmiDashboard)  },
    { path: 'dashboard-estandar', loadComponent: () => import('./Dashboard/tmi-dashboard-estandar/tmi-dashboard-estandar').then((m) => m.TmiDashboardEstandar)  },
]   