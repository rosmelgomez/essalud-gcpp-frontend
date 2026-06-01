import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Documento, VersionDocumento } from '../../../model/documento';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { FlujoAprobacionDocumentoService } from '../../../services/documentos/flujo-aprobacion-documento-service';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';
import { LocalStorageService } from '../../../services/local-storage-service';
import { User } from '../../../model/user';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reports-documento',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './reports-documento.html',
  styleUrl: './reports-documento.css',
})
export class ReportsDocumento implements OnInit {
  documentos: Documento[] = [];
  filteredDocumentos: Documento[] = [];

  tiposDocumento: any[] = [];
  user: User | null = null;

  // Métricas
  totalCount: number = 0;
  approvedCount: number = 0;
  pendingCount: number = 0;
  noApprovalCount: number = 0;

  // Filtros
  filterSearch: string = '';
  filterTipo: string = '';
  filterStatus: string = '';

  // Diccionarios para detalles de documentos
  versionsMap: { [docId: number]: VersionDocumento[] } = {};
  activeVersionMap: { [docId: number]: VersionDocumento | null } = {};
  activeFlowMap: { [docId: number]: any | null } = {};

  // Estado de los Modales
  showTimelineModal: boolean = false;
  showDecisionModal: boolean = false;
  selectedDoc: Documento | null = null;
  selectedVersion: VersionDocumento | null = null;
  selectedFlow: any | null = null;
  observacion: string = '';
  historialAcciones: any[] = [];

  // Edición de Versión
  showEditVersionForm: boolean = false;
  editVersionNombre: string = '';
  editVersionComentario: string = '';

  constructor(
    private lsService: LocalStorageService,
    private docService: DocumentoService,
    private versionService: VersionDocumentoService,
    private flujoService: FlujoAprobacionDocumentoService,
    private tipoDocumentoService: TipoDocumentoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user = this.lsService.getUser();
    this.loadTiposDocumentos();
  }

  loadTiposDocumentos() {
    this.tipoDocumentoService.getTiposDocumentos().subscribe(
      (data) => {
        this.tiposDocumento = data;
        this.getDocumentos();
      },
      (error) => {
        console.error('Error al cargar tipos de documentos:', error);
        this.getDocumentos();
      }
    );
  }

  getDocumentos() {
    // Si el usuario es de red, cargar solo sus documentos correspondientes (si aplica en backend)
    // De lo contrario, usar getDocumentos del servicio general
    const codred = this.user?.codred;
    const codcas = this.user?.codcas;

    if (this.user?.roles?.includes('ADMIN')) {
      this.docService.getDocumentos().subscribe(
        (data) => this.setDocumentos(data),
        (error) => console.error('Error al obtener documentos:', error)
      );
    } else if (codred && this.user?.roles?.includes('ADMIN_RED')) {
      this.docService.getDocumentosByCodred(codred).subscribe(
        (data) => this.setDocumentos(data),
        (error) => console.error('Error al obtener documentos por red:', error)
      );
    } else if (codcas) {
      this.docService.getDocumentoByCodcas(codcas).subscribe(
        (data) => this.setDocumentos(data),
        (error) => console.error('Error al obtener documentos por cas:', error)
      );
    } else {
      this.docService.getDocumentos().subscribe(
        (data) => this.setDocumentos(data),
        (error) => console.error('Error al obtener documentos:', error)
      );
    }
  }

  setDocumentos(data: Documento[]) {
    this.documentos = data || [];
    this.filteredDocumentos = [...this.documentos];
    this.updateCounters();
    this.cdr.detectChanges();

    // Cargar detalles para cada documento de manera asíncrona
    this.documentos.forEach(doc => {
      this.loadDocumentDetails(doc);
    });
  }

  loadDocumentDetails(doc: Documento) {
    this.versionService.getVersionDocumentoByIdDoc(doc.id).subscribe(
      (versions) => {
        if (versions && versions.length > 0) {
          // Ordenar versiones por número descendente
          versions.sort((a, b) => b.version - a.version);
          this.versionsMap[doc.id] = versions;
          const activeVer = versions[0];
          this.activeVersionMap[doc.id] = activeVer;

          // Verificar si el tipo de documento requiere aprobación
          const tipo = this.tiposDocumento.find(t => t.id === doc.id_tipo_documento);
          const requiereAprobacion = tipo ? tipo.requiere_aprobacion : false;

          if (requiereAprobacion) {
            this.flujoService.getFlujoByVersionId(activeVer.id).subscribe(
              (flows: any[]) => {
                this.activeFlowMap[doc.id] = flows && flows.length > 0 ? flows[0] : null;
                this.updateCounters();
                this.applyFilters();
                this.cdr.detectChanges();
              },
              () => {
                this.activeFlowMap[doc.id] = null;
                this.updateCounters();
                this.applyFilters();
                this.cdr.detectChanges();
              }
            );
          } else {
            this.activeFlowMap[doc.id] = null;
            this.updateCounters();
            this.applyFilters();
            this.cdr.detectChanges();
          }
        } else {
          this.versionsMap[doc.id] = [];
          this.activeVersionMap[doc.id] = null;
          this.activeFlowMap[doc.id] = null;
          this.updateCounters();
          this.applyFilters();
          this.cdr.detectChanges();
        }
      },
      (error) => {
        console.error(`Error al cargar versiones del documento ${doc.id}:`, error);
      }
    );
  }

  applyFilters() {
    this.filteredDocumentos = this.documentos.filter(doc => {
      // 1. Filtro de Texto (Código, Título, Descripción)
      const query = this.filterSearch.toLowerCase().trim();
      const matchSearch = !query ||
        doc.titulo.toLowerCase().includes(query) ||
        doc.codigo.toLowerCase().includes(query) ||
        (doc.descripcion && doc.descripcion.toLowerCase().includes(query));

      // 2. Filtro de Tipo
      const matchTipo = !this.filterTipo || doc.id_tipo_documento === Number(this.filterTipo);

      // 3. Filtro de Estado
      const flow = this.activeFlowMap[doc.id];
      const status = flow ? flow.status : 'No Requiere Aprobación';

      let matchStatus = true;
      if (this.filterStatus) {
        if (this.filterStatus === 'SIN_APROBACION') {
          matchStatus = status === 'No Requiere Aprobación';
        } else {
          matchStatus = status.toLowerCase() === this.filterStatus.toLowerCase();
        }
      }

      return matchSearch && matchTipo && matchStatus;
    });
    this.cdr.detectChanges();
  }

  updateCounters() {
    this.totalCount = this.documentos.length;
    this.approvedCount = 0;
    this.pendingCount = 0;
    this.noApprovalCount = 0;

    this.documentos.forEach(doc => {
      const flow = this.activeFlowMap[doc.id];
      const status = flow ? flow.status : 'No Requiere Aprobación';
      if (status === 'Aprobado') {
        this.approvedCount++;
      } else if (status === 'Pendiente') {
        this.pendingCount++;
      } else if (status === 'No Requiere Aprobación' || !flow) {
        const tipo = this.tiposDocumento.find(t => t.id === doc.id_tipo_documento);
        const requires = tipo ? tipo.requiere_aprobacion : false;
        if (!requires) {
          this.noApprovalCount++;
        } else {
          this.pendingCount++;
        }
      } else if (status === 'Rechazado') {
        this.pendingCount++;
      }
    });
    this.cdr.detectChanges();
  }

  getTipoNombre(idTipo: number): string {
    const tipo = this.tiposDocumento.find(t => t.id === idTipo);
    return tipo ? tipo.nombre : 'Desconocido';
  }



  descargarArchivo(version: VersionDocumento) {
    this.versionService.getArchivo(version.id).subscribe(
      (response) => {
        const blob = response.body;
        if (blob) {
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const fileBlob = new Blob([blob], { type: contentType });
          const url = window.URL.createObjectURL(fileBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = version.nombre || 'archivo';
          document.body.appendChild(a);
          a.click();
          window.URL.createObjectURL(fileBlob);
          a.remove();
        }
      },
      (error) => {
        console.error('Error al descargar archivo:', error);
        alert('Acceso Denegado: La versión del documento no ha sido aprobada o no cuenta con los permisos necesarios para realizar la descarga.');
      }
    );
  }

  eliminarDocumento(doc: Documento) {
    if (confirm(`¿Está seguro que desea eliminar permanentemente el documento "${doc.titulo}"? (Esta acción realiza un borrado lógico para auditorías)`)) {
      this.docService.deleteDocumento(doc.id, this.user?.id || 0).subscribe(
        () => {
          alert('Documento eliminado con éxito.');
          this.getDocumentos();
        },
        (error) => {
          console.error('Error al eliminar documento:', error);
          alert('Ocurrió un error al eliminar el documento.');
        }
      );
    }
  }

  // Modales y Timeline Lógica
  abrirHistorial(doc: Documento) {
    this.selectedDoc = doc;
    const versions = this.versionsMap[doc.id] || [];
    this.selectedVersion = this.activeVersionMap[doc.id];
    this.showTimelineModal = true;
    this.historialAcciones = [];
    if (this.selectedVersion) {
      this.cargarHistorialDeVersion(this.selectedVersion);
    }
    this.cdr.detectChanges();
  }

  onTimelineVersionChange(version: VersionDocumento) {
    this.selectedVersion = version;
    this.cargarHistorialDeVersion(version);
    this.cdr.detectChanges();
  }

  cargarHistorialDeVersion(version: VersionDocumento) {
    this.historialAcciones = [];
    this.flujoService.getFlujoByVersionId(version.id).subscribe(
      (flows: any[]) => {
        const flow = flows && flows.length > 0 ? flows[0] : null;
        if (flow) {
          this.flujoService.getHistorial(flow.id).subscribe(
            (hist) => {
              this.historialAcciones = hist || [];
              this.cdr.detectChanges();
            },
            (err) => {
              console.error('Error al cargar historial:', err);
            }
          );
        }
      }
    );
  }

  abrirAprobacion(doc: Documento) {
    this.selectedDoc = doc;
    this.selectedVersion = this.activeVersionMap[doc.id];
    this.selectedFlow = this.activeFlowMap[doc.id];
    this.observacion = '';
    this.showDecisionModal = true;
    this.cdr.detectChanges();
  }

  procesarDecision(nuevoEstado: 'Aprobado' | 'Rechazado') {
    if (!this.selectedFlow || !this.selectedVersion || !this.selectedDoc) return;

    const dto = {
      id: this.selectedFlow.id,
      comentario: this.observacion || `Revisión: Documento ${nuevoEstado.toLowerCase()}`,
      status: nuevoEstado,
      id_version_documento: this.selectedVersion.id,
      id_user_aprobador: this.user?.id
    };

    this.flujoService.updateFlujoAprobacion(dto).subscribe(
      () => {
        alert(`Estado actualizado a: ${nuevoEstado}`);
        this.showDecisionModal = false;
        if (this.selectedDoc) {
          this.loadDocumentDetails(this.selectedDoc);
        }
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al actualizar flujo de aprobación:', error);
        alert('Ocurrió un error al guardar la decisión de aprobación.');
      }
    );
  }

  puedeAprobar(doc: Documento): boolean {
    const flow = this.activeFlowMap[doc.id];
    if (!flow || flow.status !== 'Pendiente') return false;
    // Si es ADMIN, ADMIN_RED o si su id_user_aprobador coincide con el usuario logueado
    return !!(this.user?.roles?.includes('ADMIN') || this.user?.roles?.includes('ADMIN_RED') || flow.id_user_aprobador === this.user?.id);
  }

  cerrarModales() {
    this.showTimelineModal = false;
    this.showDecisionModal = false;
    this.selectedDoc = null;
    this.selectedVersion = null;
    this.selectedFlow = null;
    this.observacion = '';
    this.historialAcciones = [];
    this.showEditVersionForm = false;
    this.cdr.detectChanges();
  }

  // Métodos de Acciones de Edición/Eliminación y Visualización Controlada

  editarDocumento(doc: Documento) {
    void this.router.navigate(['/creacion'], { state: { documento: doc } });
  }

  puedeDescargarFisico(version: VersionDocumento): boolean {
    // Solo puede descargar físicamente si es creador, admin o aprobador
    if (this.user?.roles?.includes('ADMIN') || this.user?.roles?.includes('ADMIN_RED')) {
      return true;
    }
    if (version.id_user_creation === this.user?.id) {
      return true;
    }
    // Aprobador asignado en flujo
    const flow = this.activeFlowMap[version.id_documento];
    if (flow && flow.id_user_aprobador === this.user?.id) {
      return true;
    }
    return false;
  }

  puedeEditarVersion(version: VersionDocumento): boolean {
    return !!(this.user?.roles?.includes('ADMIN') || 
           this.user?.roles?.includes('ADMIN_RED') || 
           version.id_user_creation === this.user?.id);
  }

  puedeEliminarVersion(version: VersionDocumento): boolean {
    return !!(this.user?.roles?.includes('ADMIN') || this.user?.roles?.includes('ADMIN_RED'));
  }

  visualizarArchivo(version: VersionDocumento) {
    this.versionService.getArchivo(version.id, false).subscribe(
      (response) => {
        const blob = response.body;
        if (blob) {
          const contentType = response.headers.get('content-type') || 'application/pdf';
          const fileBlob = new Blob([blob], { type: contentType });
          const url = window.URL.createObjectURL(fileBlob);
          window.open(url, '_blank');
        }
      },
      (error) => {
        console.error('Error al visualizar archivo:', error);
        alert('Acceso Denegado: No tiene permisos para visualizar esta versión.');
      }
    );
  }

  descargarArchivoFisico(version: VersionDocumento) {
    this.versionService.getArchivo(version.id, true).subscribe(
      (response) => {
        const blob = response.body;
        if (blob) {
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const fileBlob = new Blob([blob], { type: contentType });
          const url = window.URL.createObjectURL(fileBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = version.nombre || 'archivo';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }
      },
      (error) => {
        console.error('Error al descargar archivo:', error);
        alert('Acceso Denegado: No tiene permisos para descargar esta versión físicamente.');
      }
    );
  }

  abrirEditarVersion(version: VersionDocumento) {
    this.selectedVersion = version;
    this.editVersionNombre = version.nombre;
    this.editVersionComentario = version.comentario || '';
    this.showEditVersionForm = true;
    this.cdr.detectChanges();
  }

  actualizarVersion() {
    if (!this.selectedVersion) return;
    const dto = {
      id: this.selectedVersion.id,
      nombre: this.editVersionNombre,
      descripcion: this.editVersionComentario,
      version: this.selectedVersion.version,
      id_documento: this.selectedVersion.id_documento,
      id_user_creation: this.selectedVersion.id_user_creation
    };
    this.versionService.updateVersionDocumento(dto).subscribe(
      () => {
        alert('Versión actualizada exitosamente.');
        this.showEditVersionForm = false;
        if (this.selectedDoc) {
          this.loadDocumentDetails(this.selectedDoc);
          this.selectedVersion!.nombre = this.editVersionNombre;
          this.selectedVersion!.comentario = this.editVersionComentario;
        }
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al actualizar versión:', error);
        alert('Ocurrió un error al actualizar la versión.');
      }
    );
  }

  eliminarVersion(version: VersionDocumento) {
    if (confirm(`¿Está seguro que desea eliminar la versión ${version.version} ("${version.nombre}")? (Esta acción realiza un borrado lógico)`)) {
      this.versionService.deleteVersionDocumento(version.id, this.user?.id || 0).subscribe(
        () => {
          alert('Versión eliminada con éxito.');
          this.showEditVersionForm = false;
          if (this.selectedDoc) {
            this.getDocumentos();
            this.cerrarModales();
          }
        },
        (error) => {
          console.error('Error al eliminar versión:', error);
          alert('Ocurrió un error al eliminar la versión.');
        }
      );
    }
  }
}
