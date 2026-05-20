import { Component } from '@angular/core';
import { Documento } from '../../../model/documento';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { LocalStorageService } from '../../../services/local-storage-service';

@Component({
  selector: 'app-reports-documento',
  imports: [],
  templateUrl: './reports-documento.html',
  styleUrl: './reports-documento.css',
})
export class ReportsDocumento {

  documentos: Documento[] = [];

  constructor(
    private lsService: LocalStorageService,
    private docService: DocumentoService,
  ) { }

  getDocumentos() {
    this.docService.getDocumentos().subscribe(
      (data) => {
        this.documentos = data;
      },
      (error) => {
        console.error('Error al obtener los documentos:', error);
      }
    );
  }

  getDocumentosByCodred(codred: string) {
    this.docService.getDocumentosByCodred(codred).subscribe(
      (data) => {
        this.documentos = data;
      },
      (error) => {
        console.error('Error al obtener los documentos por codred:', error);
      }
    );
  }

  getDocumentosByCodcas(codcas: string) {
    this.docService.getDocumentoByCodcas(codcas).subscribe(
      (data) => {
        this.documentos = data;
      },
      (error) => {
        console.error('Error al obtener los documentos por codcas:', error);
      }
    );
  }

  getDocumentosByUser(iduser: number) {

    this.docService.getDocumentoByUser(iduser).subscribe(
      (data) => {
        this.documentos = data;
      },
      (error) => {
        console.error('Error al obtener los documentos por usuario:', error);
      }
    );
  }

}
