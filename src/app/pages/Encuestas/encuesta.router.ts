import { Routes } from '@angular/router';
import { DashboardEncuesta } from './dashboard-encuesta/dashboard-encuesta';
import { Encuesta } from './encuesta/encuesta';
import { redirectGuard } from '../../guards/redirect-guard';

export const encuestaRoutes: Routes = [
       ///Encuesta
       
       { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
       { path: 'register', component: Encuesta },
       { path: 'dashboard', component: DashboardEncuesta },

];