import { Routes } from '@angular/router';
import { CreacionDocumentos } from './creacion-documentos/creacion-documentos';
import { ReportsDocumento } from './reports-documento/reports-documento';
import { AuditoriaDocumento } from './auditoria-documento/auditoria-documento';

export const documentoRoutes: Routes = [
    { path: 'creacion', component: CreacionDocumentos },
    { path: 'reports-documento', component: ReportsDocumento },
    { path: 'auditoria-documento', component: AuditoriaDocumento, data: { role: ['ADMIN'] } },
];