import { Routes } from '@angular/router';
import { CreacionDocumentos } from './creacion-documentos/creacion-documentos';
import { ReportsDocumento } from './reports-documento/reports-documento';
import { AuditoriaDocumento } from './auditoria-documento/auditoria-documento';

export const documentoRoutes: Routes = [
    /// ruta padre /documento/......
    { path: 'creacion', component: CreacionDocumentos },
    { path: 'reports', component: ReportsDocumento },
    { path: 'auditoria', component: AuditoriaDocumento, data: { role: ['ADMIN'] } },
];