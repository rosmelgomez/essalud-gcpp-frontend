import { Component, OnInit } from '@angular/core';
import { TmiIndicadoresService } from '../../services/tmi-indicadores-service';

@Component({
  selector: 'app-tmi-indicadores',
  imports: [],
  templateUrl: './tmi-indicadores.html',
  styleUrl: './tmi-indicadores.css',
})
export class TmiIndicadores implements OnInit {


  constructor(private tmiIndicadoresService: TmiIndicadoresService) { }

  ngOnInit(): void {
    this.getQueryEstandares();
    this.getQueryCentrosTMI();
  }

  getQueryEstandares() {
    this.tmiIndicadoresService.getQueryEstandares().subscribe((res: any) => {
      console.log(res);
    });
  }

  getQueryCentrosTMI() {
    this.tmiIndicadoresService.getQueryCentrosTMI().subscribe((res: any) => {
      console.log(res);
    });
  }


}
