import { Component } from '@angular/core';
import { VersionDocumento } from '../../../model/documento';
import { LocalStorageService } from '../../../services/local-storage-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { DocumentoService } from '../../../services/documentos/documento-service';

@Component({
  selector: 'app-reports-version-documento',
  imports: [],
  templateUrl: './reports-version-documento.html',
  styleUrl: './reports-version-documento.css',
})
export class ReportsVersionDocumento {

  version_documentos: VersionDocumento[] = [];

  constructor(
    private lsService: LocalStorageService,
    private docService: DocumentoService,
    private vsService: VersionDocumentoService
  ) { }
}
