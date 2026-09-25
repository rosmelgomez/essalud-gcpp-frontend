import { Routes } from "@angular/router";
import { Perfil } from "./perfil/perfil";
import { ManageUsers } from "./manage-users/manage-users";
import { LogsReports } from "../logs-reports/logs-reports";

export const usuarioRoutes: Routes = [

    ///ruta padre /usuario/...
    { path: 'perfil', component: Perfil },
    { path: 'manage-users', component: ManageUsers, data: { role: ['ADMIN'] } },
    { path: 'logs-reports', component: LogsReports, data: { role: ['ADMIN'] } },
];