import { Routes } from '@angular/router';
import { DashboardEncuesta } from './dashboard-encuesta/dashboard-encuesta';
import { Encuesta } from './encuesta/encuesta';

export const encuestaRoutes: Routes = [

       //ruta padre /encuesta/..
       { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
       { path: 'register', component: Encuesta },
       { path: 'dashboard', component: DashboardEncuesta, data: { role: ['ADMIN'] } },

];