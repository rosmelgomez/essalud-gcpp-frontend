import { Routes } from '@angular/router';
import { DiqComplejidadAGc } from './diq-complejidad-a-gc/diq-complejidad-a-gc';
import { DiqComplejidadBGc } from './diq-complejidad-b-gc/diq-complejidad-b-gc';
import { DiqComplejidadCGc } from './diq-complejidad-c-gc/diq-complejidad-c-gc';
import { DiqComplejidadDGc } from './diq-complejidad-d-gc/diq-complejidad-d-gc';
import { DiqComplejidadEGc } from './diq-complejidad-e-gc/diq-complejidad-e-gc';
import { DiqSinComplejidadGc } from './diq-sin-complejidad-gc/diq-sin-complejidad-gc';    


export const indicadoresRoutes: Routes = [

    ///indicadores de intervenciones quirurgicas por grado de complejidad
    { path: 'diq-complejidad-a-gc', component: DiqComplejidadAGc},
    { path: 'diq-complejidad-b-gc', component: DiqComplejidadBGc},
    { path: 'diq-complejidad-c-gc', component: DiqComplejidadCGc},
    { path: 'diq-complejidad-d-gc', component: DiqComplejidadDGc},
    { path: 'diq-complejidad-e-gc', component: DiqComplejidadEGc},
    { path: 'diq-sin-complejidad-gc', component: DiqSinComplejidadGc},


];