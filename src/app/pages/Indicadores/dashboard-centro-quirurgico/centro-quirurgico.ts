import { Routes } from '@angular/router';
import { ReportDashboardIntervencionesQuirurgicas } from '../../Resportes/report-dashboard-intervenciones-quirurgicas/report-dashboard-intervenciones-quirurgicas';


export const indicadoresRoutes: Routes = [
    
    // ruta padre /indicador/..
    { path: 'dashboard-intervenciones-quirurgicas', component: ReportDashboardIntervencionesQuirurgicas},
    
];