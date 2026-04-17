import { Component } from '@angular/core';

@Component({
  selector: 'app-report-dashboard-transplate',
  imports: [],
  templateUrl: './report-dashboard-transplante.html',
  styleUrl: './report-dashboard-transplante.css',
})
export class ReportDashboardTransplante {

  currentDate: string = '';

  // Estados para grado de complejidad
  loadingT: boolean = false;
  errorT: string | null = null;
  noDataT: boolean = false;
  selectPeriodoT: boolean = true;


  //data importantes
  centroAtencion: string = '';
  codcas: string = '';


}
