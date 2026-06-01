import { Component, ChangeDetectorRef } from '@angular/core';
import { TipoDocumento } from '../../../model/documento';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';

@Component({
  selector: 'app-reports-tipo-documento',
  imports: [],
  templateUrl: './reports-tipo-documento.html',
  styleUrl: './reports-tipo-documento.css',
})
export class ReportsTipoDocumento {


  tipo_documentos: TipoDocumento[] = [];

  constructor(
    private tdService: TipoDocumentoService,
    private cdr: ChangeDetectorRef
  ) { }


  getTipoDocumentos() {
    this.tdService.getTiposDocumentos().subscribe(
      (data) => {
        this.tipo_documentos = data;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al obtener los tipos de documentos:', error);
      }
    );
  }

}
