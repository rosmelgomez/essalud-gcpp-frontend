import { Routes } from '@angular/router';

export const documentoRoutes: Routes = [
    /// ruta padre /documento/......
    { path: 'reports', loadComponent: () => import('./reports-documento/reports-documento').then((m) => m.ReportsDocumento) },
    { path: 'auditoria', loadComponent: () => import('./auditoria-documento/auditoria-documento').then((m) => m.AuditoriaDocumento), data: { role: ['ADMIN'] } },
];