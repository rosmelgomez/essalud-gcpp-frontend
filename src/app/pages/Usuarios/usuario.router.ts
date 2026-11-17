import { Routes } from "@angular/router";

export const usuarioRoutes: Routes = [

    ///ruta padre /usuario/...
    { path: 'perfil', loadComponent: () => import('./perfil/perfil').then((m) => m.Perfil) },
    { path: 'manage-users', loadComponent: () => import('./manage-users/manage-users').then((m) => m.ManageUsers), data: { role: ['ADMIN'] } },
];