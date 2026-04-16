import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ChangePassword } from './pages/change-password/change-password';
import { ManageUsers } from './pages/manage-users/manage-users';

import { HomePage } from './pages/home-page/home-page';
import { LogsReports } from './pages/logs-reports/logs-reports';


import { ReportsGerenciales } from './pages/reports-gerenciales/reports-gerenciales';
import { authenticateGuard } from './guards/authenticate-guard';
import { redirectGuard } from './guards/redirect-guard';
import { ReportDashboard } from './pages/report-dashboard/report-dashboard';
import { ReportDashboardEme } from './pages/report-dashboard-eme/report-dashboard-eme';
import { DmTotalAtencionesCai } from './pages/Indicadores/dashboard-medicas/consulta de atencion inmediata/dm-total-atenciones-cai/dm-total-atenciones-cai';
import { DmTotalAtencionesAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-atenciones-am/dm-total-atenciones-am';
import { DmTotalAtendidosAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-atendidos-am/dm-total-atendidos-am';
import { DmTotalMedicosAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-medicos-am/dm-total-medicos-am';
import { DmTotalDesercionAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-desercion-am/dm-total-desercion-am';
import { DmTotalHorasEfectivasAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-horas-efectivas-am/dm-total-horas-efectivas-am';
import { DmTotalHorasProgramadasAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-horas-programadas-am/dm-total-horas-programadas-am';
import { DmTotalCitadosAm } from './pages/Indicadores/dashboard-medicas/atenciones medicas/dm-total-citados-am/dm-total-citados-am';
import { ReportDashboardNoMedicas } from './pages/report-dashboard-no-medicas/report-dashboard-no-medicas';
import { ReportDashboardMedicas } from './pages/report-dashboard-medicas/report-dashboard-medicas';
import { DmTotalAtencionesMc } from './pages/Indicadores/dashboard-medicas/medicina complementaria/dm-total-atenciones-mc/dm-total-atenciones-mc';
import { DmTotalMedicosMc } from './pages/Indicadores/dashboard-medicas/medicina complementaria/dm-total-medicos-mc/dm-total-medicos-mc';
import { DmTotalHorasEfectivasCad } from './pages/Indicadores/dashboard-medicas/consulta apoyo desc/dm-total-horas-efectivas-cad/dm-total-horas-efectivas-cad';
import { DmTotalHorasEfectivasMc } from './pages/Indicadores/dashboard-medicas/medicina complementaria/dm-total-horas-efectivas-mc/dm-total-horas-efectivas-mc';
import { DmTotalHorasProgramadasMc } from './pages/Indicadores/dashboard-medicas/medicina complementaria/dm-total-horas-programadas-mc/dm-total-horas-programadas-mc';
import { DmTotalAtencionesMo } from './pages/Indicadores/dashboard-medicas/medicinal ocupacional/dm-total-atenciones-mo/dm-total-atenciones-mo';
import { DmTotalMedicosMo } from './pages/Indicadores/dashboard-medicas/medicinal ocupacional/dm-total-medicos-mo/dm-total-medicos-mo';
import { DmTotalHorasEfectivasMo } from './pages/Indicadores/dashboard-medicas/medicinal ocupacional/dm-total-horas-efectivas-mo/dm-total-horas-efectivas-mo';
import { DmTotalHorasProgramadasMo } from './pages/Indicadores/dashboard-medicas/medicinal ocupacional/dm-total-horas-programadas-mo/dm-total-horas-programadas-mo';
import { DmTotalHorasProgramadasCai } from './pages/Indicadores/dashboard-medicas/consulta de atencion inmediata/dm-total-horas-programadas-cai/dm-total-horas-programadas-cai';
import { DmTotalHorasEfectivasCai } from './pages/Indicadores/dashboard-medicas/consulta de atencion inmediata/dm-total-horas-efectivas-cai/dm-total-horas-efectivas-cai';
import { DmTotalMedicosCai } from './pages/Indicadores/dashboard-medicas/consulta de atencion inmediata/dm-total-medicos-cai/dm-total-medicos-cai';
import { DmTotalHorasProgramadasCad } from './pages/Indicadores/dashboard-medicas/consulta apoyo desc/dm-total-horas-programadas-cad/dm-total-horas-programadas-cad';
import { DmTotalMedicosCad } from './pages/Indicadores/dashboard-medicas/consulta apoyo desc/dm-total-medicos-cad/dm-total-medicos-cad';
import { DmTotalAtencionesCad } from './pages/Indicadores/dashboard-medicas/consulta apoyo desc/dm-total-atenciones-cad/dm-total-atenciones-cad';
import { DmTotalHorasProgramadasMp } from './pages/Indicadores/dashboard-medicas/medico de personal/dm-total-horas-programadas-mp/dm-total-horas-programadas-mp';
import { DmTotalHorasEfectivasMp } from './pages/Indicadores/dashboard-medicas/medico de personal/dm-total-horas-efectivas-mp/dm-total-horas-efectivas-mp';
import { DmTotalMedicosMp } from './pages/Indicadores/dashboard-medicas/medico de personal/dm-total-medicos-mp/dm-total-medicos-mp';
import { DmTotalAtencionesMp } from './pages/Indicadores/dashboard-medicas/medico de personal/dm-total-atenciones-mp/dm-total-atenciones-mp';
import { AtenTopicos1 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-1/aten-topicos-1';
import { AtenTopicos2 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-2/aten-topicos-2';
import { AtenTopicos3 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-3/aten-topicos-3';
import { AtenTopicos4 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-4/aten-topicos-4';
import { AtenTopicos5 } from './pages/Indicadores/dashboard-emergencia/aten-topicos-5/aten-topicos-5';

import { DnmTotalAtencionesOb } from './pages/Indicadores/dashboard-no-medicas/obstetricia/dnm-total-atenciones-ob/dnm-total-atenciones-ob';
import { DnmTotalAtencionesPs } from './pages/Indicadores/dashboard-no-medicas/psicologia/dnm-total-atenciones-ps/dnm-total-atenciones-ps';
import { DnmTotalAtencionesPd } from './pages/Indicadores/dashboard-no-medicas/procedimientos diagnosticos/dnm-total-atenciones-pd/dnm-total-atenciones-pd';
import { DnmTotalAtencionesPp } from './pages/Indicadores/dashboard-no-medicas/preventivo promocional/dnm-total-atenciones-pp/dnm-total-atenciones-pp';
import { DnmTotalAtencionesEn } from './pages/Indicadores/dashboard-no-medicas/enfermeria/dnm-total-atenciones-en/dnm-total-atenciones-en';
import { DnmTotalAtencionesNu } from './pages/Indicadores/dashboard-no-medicas/nutricion/dnm-total-atenciones-nu/dnm-total-atenciones-nu';
import { DnmTotalAtencionesTs } from './pages/Indicadores/dashboard-no-medicas/trabajo social/dnm-total-atenciones-ts/dnm-total-atenciones-ts';
import { DnmTotalAtencionesPt } from './pages/Indicadores/dashboard-no-medicas/procedimientos terapeuticos/dnm-total-atenciones-pt/dnm-total-atenciones-pt';

import { ReportDashboardIntervencionesQuirurgicas } from './pages/report-dashboard-intervenciones-quirurgicas/report-dashboard-intervenciones-quirurgicas';
import { DiqComplejidadAGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-a-gc/diq-complejidad-a-gc';
import { DiqComplejidadBGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-b-gc/diq-complejidad-b-gc';
import { DiqComplejidadCGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-c-gc/diq-complejidad-c-gc';
import { DiqComplejidadDGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-d-gc/diq-complejidad-d-gc';
import { DiqComplejidadEGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-complejidad-e-gc/diq-complejidad-e-gc';
import { DiqSinComplejidadGc } from './pages/Indicadores/dashboard-centro-quirurgico/intervenciones-quirurgicas/grado-complejidad/diq-sin-complejidad-gc/diq-sin-complejidad-gc';

import { ReportDashboardReporteador } from './pages/report-dashboard-reporteador/report-dashboard-reporteador';
import { ReportDashboardOdontologicas } from './pages/report-dashboard-odontologicas/report-dashboard-odontologicas';
import { Encuesta } from './pages/encuesta/encuesta';
import { DashboardEncuesta } from './pages/dashboard-encuesta/dashboard-encuesta';
import { SolicitudAccesoRegistro } from './pages/Solicitud-Acceso/solicitud-acceso-registro/solicitud-acceso-registro';
import { SolicitudAccesoReports } from './pages/Solicitud-Acceso/solicitud-acceso-reports/solicitud-acceso-reports';


export const routes: Routes = [
    { path: '', pathMatch: 'full', canActivate: [redirectGuard], children: [] },

    //solicitud de acceso
    { path: 'solicitar-acceso-registro',component:SolicitudAccesoRegistro },
    { path: 'solicitud-acceso-reports', component: SolicitudAccesoReports, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },


    { path: 'login', component: Login },
    { path: 'register', component: Register, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'change-password', component: ChangePassword, canActivate: [authenticateGuard] },
    { path: 'manage-users', component: ManageUsers, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'home', component: HomePage, canActivate: [authenticateGuard] },
    { path: 'logs-reports', component: LogsReports, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },
    { path: 'reports-gerenciales', component: ReportsGerenciales, canActivate: [authenticateGuard], data: { role: ['ADMIN'] } },

    { path: 'dashboard', component: ReportDashboard, canActivate: [authenticateGuard] },

    ///dashboard-medicas
    { path: 'dashboard-medicas', component: ReportDashboardMedicas, canActivate: [authenticateGuard] },

    //indicadores atenciones medicas
    { path: 'dm-total-atenciones-am', component: DmTotalAtencionesAm, canActivate: [authenticateGuard] },
    { path: 'dm-total-pacientes-atendidos-am', component: DmTotalAtendidosAm, canActivate: [authenticateGuard] },
    { path: 'dm-total-medicos-am', component: DmTotalMedicosAm, canActivate: [authenticateGuard] },
    { path: 'dm-total-horas-efectivas-am', component: DmTotalHorasEfectivasAm, canActivate: [authenticateGuard] },
    { path: 'dm-total-horas-programadas-am', component: DmTotalHorasProgramadasAm, canActivate: [authenticateGuard] },
    { path: 'dm-total-citados-am', component: DmTotalCitadosAm, canActivate: [authenticateGuard] },
    { path: 'dm-total-deserciones-am', component: DmTotalDesercionAm, canActivate: [authenticateGuard] },

    //indicadores medicina complementaria
    {path: 'dm-total-atenciones-mc', component: DmTotalAtencionesMc, canActivate: [authenticateGuard] },
    {path: 'dm-total-medicos-mc', component: DmTotalMedicosMc, canActivate: [authenticateGuard]},
    {path: 'dm-total-horas-efectivas-mc', component: DmTotalHorasEfectivasMc, canActivate: [authenticateGuard]},
    {path: 'dm-total-horas-programadas-mc', component: DmTotalHorasProgramadasMc, canActivate: [authenticateGuard]},

    //indicadores medicina ocupacional
    {path:'dm-total-atenciones-mo', component: DmTotalAtencionesMo, canActivate: [authenticateGuard]},
    {path:'dm-total-medicos-mo', component: DmTotalMedicosMo, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-efectivas-mo', component: DmTotalHorasEfectivasMo, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-programadas-mo', component: DmTotalHorasProgramadasMo, canActivate: [authenticateGuard]},

    //Indicadores de medicos de personal
    {path:'dm-total-atenciones-mp', component: DmTotalAtencionesMp, canActivate: [authenticateGuard]},
    {path:'dm-total-medicos-mp', component: DmTotalMedicosMp, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-efectivas-mp', component: DmTotalHorasEfectivasMp, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-programadas-mp', component: DmTotalHorasProgramadasMp, canActivate: [authenticateGuard]},

    //Indicadores de consulta atencion inmediata
    {path:'dm-total-atenciones-cai', component: DmTotalAtencionesCai, canActivate: [authenticateGuard]},
    {path:'dm-total-medicos-cai', component: DmTotalMedicosCai, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-efectivas-cai', component: DmTotalHorasEfectivasCai, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-programadas-cai', component: DmTotalHorasProgramadasCai, canActivate: [authenticateGuard]},

    //indicadores consulta apoyo desc
    {path:'dm-total-atenciones-cad', component: DmTotalAtencionesCad, canActivate: [authenticateGuard]},
    {path:'dm-total-medicos-cad', component: DmTotalMedicosCad, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-efectivas-cad', component: DmTotalHorasEfectivasCad, canActivate: [authenticateGuard]},
    {path:'dm-total-horas-programadas-cad', component: DmTotalHorasProgramadasCad, canActivate: [authenticateGuard]},



    ///dashboard-no-medicas
    { path: 'dashboard-no-medicas', component: ReportDashboardNoMedicas, canActivate: [authenticateGuard] },

    //indicadores de obstetricia
    {path:'dnm-total-atenciones-ob', component: DnmTotalAtencionesOb, canActivate: [authenticateGuard]},

    //indicadores de preventivo promocional
    {path:'dnm-total-atenciones-pp', component: DnmTotalAtencionesPp, canActivate: [authenticateGuard]},

    //indicadores de nutricion
    {path:'dnm-total-atenciones-nu', component: DnmTotalAtencionesNu, canActivate: [authenticateGuard]},

    //indicadores de enfermeria
    {path:'dnm-total-atenciones-en', component: DnmTotalAtencionesEn, canActivate: [authenticateGuard]},

    //indicadores de psicologia
    {path:'dnm-total-atenciones-ps', component: DnmTotalAtencionesPs, canActivate: [authenticateGuard]},

    //indicadores de trabajo social
    {path:'dnm-total-atenciones-ts', component: DnmTotalAtencionesTs, canActivate: [authenticateGuard]},

    //indicadores de procedimientos terapeuticos
    {path:'dnm-total-atenciones-pt', component: DnmTotalAtencionesPt, canActivate: [authenticateGuard]},

    //indicadores de procedimientos diagnosticos
    {path:'dnm-total-atenciones-pd', component: DnmTotalAtencionesPd, canActivate: [authenticateGuard]},

    ///Dashboard de odontologicas
    {path:'dashboard-odontologicas', component: ReportDashboardOdontologicas, canActivate: [authenticateGuard]},


    ///dashboard-emergencia
    { path: 'dashboard-eme', component: ReportDashboardEme, canActivate: [authenticateGuard] },

    ///atenciones por prioridad
    { path: 'ate-prioridad1', component: AtenTopicos1, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad2', component: AtenTopicos2, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad3', component: AtenTopicos3, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad4', component: AtenTopicos4, canActivate: [authenticateGuard] },
    { path: 'ate-prioridad5', component: AtenTopicos5, canActivate: [authenticateGuard] },


    ///Dashboard de intervenciones quirurgicas
    {path:'dashboard-intervenciones-quirurgicas', component: ReportDashboardIntervencionesQuirurgicas, canActivate: [authenticateGuard]},
    {path:'diq-complejidad-a-gc', component: DiqComplejidadAGc, canActivate: [authenticateGuard]},
    {path:'diq-complejidad-b-gc', component: DiqComplejidadBGc, canActivate: [authenticateGuard]},
    {path:'diq-complejidad-c-gc', component: DiqComplejidadCGc, canActivate: [authenticateGuard]},
    {path:'diq-complejidad-d-gc', component: DiqComplejidadDGc, canActivate: [authenticateGuard]},
    {path:'diq-complejidad-e-gc', component: DiqComplejidadEGc, canActivate: [authenticateGuard]},
    {path:'diq-sin-complejidad-gc', component: DiqSinComplejidadGc, canActivate: [authenticateGuard]},


    ///indicadores de intervenciones quirurgicas por grado de complejidad
    {path:'diq-complejidad-a-gc', component: DiqComplejidadAGc, canActivate: [authenticateGuard]},

    ///dashboard-reporteador
    {path:'dashboard-reporteador', component: ReportDashboardReporteador, canActivate: [authenticateGuard]},

    ///Encuesta

    {path:'encuesta', component:Encuesta, canActivate: [authenticateGuard]},
    {path:'dashboard-encuesta',component:DashboardEncuesta, canActivate: [authenticateGuard]},


];
