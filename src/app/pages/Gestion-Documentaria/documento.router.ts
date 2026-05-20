import { Routes } from '@angular/router';
import { CreacionDocumentos } from './creacion-documentos/creacion-documentos';
import { ReportDashboard } from '../Resportes/report-dashboard/report-dashboard';


export const documentoRoutes: Routes = [
    {path: 'creacion', component: CreacionDocumentos },
    {path: 'dashboard', component: ReportDashboard },
];