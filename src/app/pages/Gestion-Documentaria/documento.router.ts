import { Routes } from '@angular/router';
import { CreacionDocumentos } from './creacion-documentos/creacion-documentos';
import { ReportsTipoDocumento } from './reports-tipo-documento/reports-tipo-documento';
import { ReportsDocumento } from './reports-documento/reports-documento';
import { ReportsVersionDocumento } from './reports-version-documento/reports-version-documento';



export const documentoRoutes: Routes = [
    {path: 'creacion', component: CreacionDocumentos },
    {path: 'reports-tipo-documento', component: ReportsTipoDocumento },
    {path: 'reports-documento',component:ReportsDocumento},
    {path: 'reports-version-documento', component:ReportsVersionDocumento },

];