import { Component } from '@angular/core';
import { ProcedimientosService } from '../../../services/reportes/procedimientos-service';
import { FormGroup } from '@angular/forms';
import { LocalStorageService } from '../../../services/local-storage-service';

@Component({
  selector: 'app-dashboard-procedimientos',
  imports: [],
  templateUrl: './dashboard-procedimientos.html',
  styleUrl: './dashboard-procedimientos.css',
})
export class DashboardProcedimientos {
  currentDate: string = '';
  centroAtencion: string = '';

  // Estados para Procedimientos 
  loadingP: boolean = false;
  errorP: string | null = null;
  noDataP: boolean = false;
  selectPeriodoP: boolean = true;

  //filtros para Procedimientos 
  periodoP: string = '';
  anioP: string = '';
  tipo_aseguradoP: string = '';

  //indicadores 
  totalAblacionTranscateter: number = 0; // Ablación T3ranscatéter --> relacionado con 1
  totalOXHOOD: number = 0; // Administración de Oxígeno por Casco Cefálico (OXIHOOD)" --> relacionado con 2
  totalAngiografiaCrebral: number = 0;// Angiografía Cerebral --> relacionado con 3
  totalAgioplatiaCoronaria: number = 0;// Angioplastia coronaria --> relacionado con 4
  totalAngiografiaRetinal: number = 0;// Angiografía Retinal--> relacionado con 5
  totalAngioPlastiaBalon: number = 0;// Angioplastia con Balón --> relacionado con 6
  totalAngioplatiaStentMetalico: number = 0;// Angioplastia con Stent Metálico --> relacionado con 7
  totalAudiometria: number = 0;// Audiometría --> relacionado con 8
  totalBiopsiuaEndiocardica: number = 0;// Biopsia Endomiocárdica --> relacionado con 9
  totalCardioHolter: number = 0;//Cardio Holter--> relacionado con 10
  totalCardioversionElectricaEfectiva: number = 0;// Cardioversión Eléctrica Electiva --> relacionado con 11
  totalCateterismoMedicionCIA: number = 0;// Cateterismo + Medición de CIA --> relacionado con 12
  totalCateterismoCardiaco: number = 0;//Cateterismo Cardíaco--> relacionado con 13
  totalColposcopia: number = 0;// Colposcopía --> relacionado con 14
  totalConoFrio: number = 0;//Cono Frío-> relacionado con 15
  totalConoLEEP: number = 0;//Cono LEEP--> relacionado con 16
  totalCrioterapia: number = 0;//Crioterapia --> relacionado con 17
  totalDilatacionProtesisCoartacionAorta: number = 0; //Dilatación con Protesis de Coartación de Aorta--> relacionado con 18
  totalEcocardiografiaStress: number = 0;// Ecocardiografía Stress--> relacionado con 19
  totalEcocardiografiaTransesofagica: number = 0;//Ecocardiografía Transesofágica--> relacionado con 20
  totalEcocardiografiaTranstoracica: number = 0;//Ecocardiografía Transtorácica --> relacionado con 21
  totaalElectrocardiografia: number = 0;//Electrocardiografía--> relacionado con 22
  totalElectroencefalografia: number = 0;//Electroencefalografía --> relacionado con 23
  totalElectromiagrafiaVelocidadConduccion: number = 0; //Electromiografía y Velocidad de Conducción --> relacionado con 24
  totalEndoscopiaNoDiagnostica: number = 0;//Endoscopía Diagnóstica no Digestiva --> relacionado con 25
  totalEndoscopiaDiagnostica: number = 0;//Endoscopía Digestiva Diagnóstica --> relacionado con 26
  totalEspirometria: number = 0; //Espirometría --> relacionado con 27
  totalEstimulacionElectricaCerebral: number = 0; //Estimulacion Electrica Cerebral--> relacionado con 28
  totalEstudiosFisiologicos: number = 0; //Estudios Fisiológicos (Electrofisiológicos)--> relacionado con 29 
  totalImplantacionCardiovectorDesfibriladorAutomatico: number = 0; //Implantación de Cardiovector Desfibrilador Automático--> relacionado con 30
  totalInstalacionMantenientoCPACBurbuja: number = 0;//Instalación y Mantenimiento de CPAC de burbuja--> relacionado con 31
  totalPICC: number = 0; //Instalacion y Mantenimiento de Cateter Venoso Central de Insercion Periferica (PICC)--> relacionado con 32
  totalLaparoscopiaDiagnostica: number = 0;//Laparoscopía Diagnóstica--> relacionado con 33
  totalLaserterapiaOcular: number = 0;//Laserterapia Ocular--> relacionado con 34
  totalMarcapasoDedinitivoBicameral: number = 0;//Marcapaso Definitivo Bicameral--> relacionado con 35
  totalMarcapasoDefinitivoResincronizacion: number = 0;//Marcapaso Definitivo para Resincronización--> relacionado con 36
  totalMarcapasoDefinitivoUnicameral: number = 0;//Marcapaso Definitivo Unicameral--> relacionado con 37
  totalMarcapasoTransitorio: number = 0;//Marcapaso Transitorio--> relacionado con 38
  totalOclusionDefectoSeptalInterauricular: number = 0;//Oclusión de Defecto Septal Interauricular--> relacionado con 39
  totalOclusionDefectoSeptalInterventricular: number = 0; //Oclusión de Defecto Septal Interventricular--> relacionado con 40
  totalPerimetria: number = 0;//Perimetría (Campimetría)--> relacionado con 41
  totalProcedimientoCornealInstrumentado: number = 0;// Procedimiento Corneal Instrumentado--> relacionado con 42
  totalProcedimientoMedicoRehabilitacion: number = 0;//Procedimientos Médicos de Rehabilitación--> relacionado con 43
  totalPruebaEsfuerzo: number = 0;//Prueba de Esfuerzo--> relacionado con 44
  totalReservaFlujoFraccionado: number = 0;//Reserva de Flujo Fraccionado--> relacionado con 45
  totalTotalInclinacion: number = 0; //Test de Inclinación --> relacionado con 46
  totalTestAliento: number = 0;//Test del Aliento--> relacionado con 47
  totalTomografiaCoherenciaOptica: number = 0;// Tomografía de Coherencia Óptica (OCT)--> relacionado con 48
  totalTratamientoDolor: number = 0;// Tratamiento del Dolor (Manejo del Dolor)--> relacionado con 49
  totalTrombolisisSistemica: number = 0; // Trombólisis Sistémica --> relacionado con 50
  totalUtrasonicoEndovascular: number = 0; //Ultrasonico Endovascular --> relacionado con 51
  totalUrodinamia: number = 0; // Urodinamia --> relacionado con 52
  totalValvuloplastiaMitralBalon: number = 0; //Valvuloplastia Mitral con Balón --> relacionado con 53
  totalValvuloplatiaPulmonarAortica: number = 0; //Valvuloplastía Pulmonar y/o Aórtica --> relacionado con 54
  totalVideoEpilepsia: number = 0; //Video/Epilepsia --> relacionado con 55

  constructor(
    private lsService: LocalStorageService,
    private proservice: ProcedimientosService
  ) { }

  getDP() {
    this.loadingP = true;
    this.errorP = null;
    this.noDataP = false;
    this.selectPeriodoP = true;

    const anio = this.anioP;
    const periodo = this.periodoP;
    const codcas = this.lsService.getDataCentro()?.codcas || '';
    const codasegu = this.tipo_aseguradoP;

    const codes = "1";

    this.proservice.getqueryDP(anio, periodo, codcas, codasegu, codes).subscribe(
      (data) => {

      },
      (error) => {
        this.errorP = 'Error al cargar los datos';
        this.loadingP = false;
        this.noDataP = true;
      }
    );
  }

}
