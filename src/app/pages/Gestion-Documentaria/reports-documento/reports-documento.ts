import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Documento, VersionDocumento } from '../../../model/documento';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { FlujoAprobacionDocumentoService } from '../../../services/documentos/flujo-aprobacion-documento-service';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';
import { LocalStorageService } from '../../../services/local-storage-service';
import { User } from '../../../model/user';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { UsersService } from '../../../services/usuario/users-service';
import { DocumentoFormDialog, DocumentoFormMode } from '../documento-form-dialog/documento-form-dialog';

@Component({
  selector: 'app-reports-documento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, DocumentoFormDialog],
  templateUrl: './reports-documento.html',
  styleUrl: './reports-documento.css',
})
export class ReportsDocumento implements OnInit {
  documentos: any[] = [];
  filteredDocumentos: any[] = [];
  pagedDocumentos: any[] = [];

  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  activeApprovalSubTab: 'por_mi_aprobar' | 'mis_solicitudes' = 'por_mi_aprobar';
  activePublicSubTab: 'general' | 'mi_red' = 'general';
  Math = Math;

  tiposDocumento: any[] = [];
  user: User | null = null;

  // Métricas
  totalCount: number = 0;
  approvedCount: number = 0;
  pendingCount: number = 0;
  noApprovalCount: number = 0;

  // Secciones / Tabs
  activeTab: 'publicos' | 'privados' | 'por_aprobar' = 'publicos';
  redes: any[] = [];

  // Filtros
  filterSearch: string = '';
  filterTipo: string = '';
  filterStatus: string = '';
  filterCodred: string = '';
  filterPrivacy: string = '';

  // Diccionarios para detalles de documentos
  versionsMap: { [docId: number]: VersionDocumento[] } = {};
  activeVersionMap: { [docId: number]: VersionDocumento | null } = {};
  activeFlowMap: { [docId: number]: any | null } = {};

  // Estado de los Modales
  showTimelineModal: boolean = false;
  showDecisionModal: boolean = false;
  selectedDoc: any | null = null;
  selectedVersion: VersionDocumento | null = null;
  selectedFlow: any | null = null;
  selectedVersionFlow: any | null = null;
  observacion: string = '';
  historialAcciones: any[] = [];

  // Edición de Versión
  showEditVersionForm: boolean = false;
  editVersionNombre: string = '';
  editVersionComentario: string = '';
  editVersionVisible: boolean = true;
  users_aprobadores: User[] = [];
  editVersionAprobadorId: number | null = null;
  editVersionFile: File | null = null;

  // Edición de Documento
  showEditDocumentModal: boolean = false;
  editDocId: number | null = null;
  editDocCodigo: string = '';
  editDocTitulo: string = '';
  editDocDescripcion: string = '';
  editDocPublico: boolean = false;
  editDocSoloMiRed: boolean = false;
  editDocIdTipoDocumento: number | null = null;
  editDocFlag: boolean = true;

  constructor(
    private lsService: LocalStorageService,
    private docService: DocumentoService,
    private versionService: VersionDocumentoService,
    private flujoService: FlujoAprobacionDocumentoService,
    private tipoDocumentoService: TipoDocumentoService,
    private establecimientoService: EstablecimientoService,
    private userService: UsersService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user = this.lsService.getUser();
    this.loadRedes();
    this.getRedCentro();
  }

  loadRedes() {
    this.establecimientoService.getRed().subscribe(
      (data) => {
        this.redes = data || [];
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al cargar redes:', error);
      }
    );
  }

  getRedNombre(codred: string): string {
    if (!codred) return 'Sin Red';
    const red = this.redes.find(r => r.redasiscod === codred);
    return red ? red.redasisdes : `Red ${codred}`;
  }

  setActiveTab(tab: 'publicos' | 'privados' | 'por_aprobar') {
    this.activeTab = tab;
    this.filterCodred = ''; // Resetear filtro de red al cambiar de sección
    this.filterPrivacy = ''; // Resetear filtro de privacidad al cambiar de sección
    this.currentPage = 1;
    if (tab === 'publicos') {
      this.activePublicSubTab = 'general';
    } else if (tab === 'por_aprobar') {
      this.activeApprovalSubTab = 'por_mi_aprobar';
    }
    this.applyFilters();
    this.updateCounters();
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

  codred: string = '';

  getRedCentro() {
    const codcas = this.user?.codcas;
    if (!codcas) {
      console.error('No se encontró el codcas del usuario en el almacenamiento local');
      this.loadTiposDocumentos();
      this.loadUsersAprobadores();
      return;
    }
    this.establecimientoService.getCentroWithRedByCodcas(codcas).subscribe(
      (response) => {
        console.log(response);
        this.codred = response?.redasiscod ?? '';
        this.loadTiposDocumentos();
        this.loadUsersAprobadores();
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al obtener centro y red:', error);
        this.loadTiposDocumentos();
        this.loadUsersAprobadores();
      }
    );
  }

  getDocumentos() {
    this.docService.getDocumentos().subscribe(
      (data) => this.setDocumentos(data),
      (error) => console.error('Error al obtener documentos:', error)
    );
  }

  setDocumentos(data: any[]) {
    this.documentos = data || [];
    this.filteredDocumentos = [...this.documentos];
    this.updateCounters();
    this.applyFilters();
    this.cdr.detectChanges();

    // Cargar detalles para cada documento de manera asíncrona
    this.documentos.forEach(doc => {
      this.loadDocumentDetails(doc);
    });
  }

  requiereAprobacionDoc(doc: any): boolean {
    const tipo = this.tiposDocumento.find(t => t.id === doc.id_tipo_documento);
    return tipo ? tipo.requiere_aprobacion : false;
  }

  hasAccessToVersion(doc: any, version: VersionDocumento): boolean {
    if (!doc || !version) return false;
    
    const isOwner = doc.id_user_creation === this.user?.id || version.id_user_creation === this.user?.id;
    const flow = this.activeFlowMap[version.id];
    const isApprover = version.id_user_aprobador === this.user?.id || (flow && flow.id_user_aprobador === this.user?.id);
    const isAdmin = !!(this.user?.roles?.includes('ADMIN') || this.user?.roles?.includes('ADMIN_RED'));
    
    // Si requiere aprobación y no está aprobado:
    if (this.requiereAprobacionDoc(doc)) {
      const isApproved = flow && flow.status === 'Aprobado';
      if (!isApproved) {
        if (this.activeTab === 'publicos') {
          return false;
        }
        if (!isOwner && !isApprover && !isAdmin) {
          return false;
        }
      }
    }
    
    // Si el documento o la versión es privada/borrador:
    if (!doc.publico || version.visible === false) {
      if (isOwner) return true;
      if (isApprover) return true;
      return false;
    }

    // Si es público y la versión es pública, validar restricción de red (solo_mi_red)
    if (doc.solo_mi_red) {
      return doc.codred === this.codred || isOwner || isApprover || isAdmin;
    }

    return true;
  }

  resolveActiveVersion(doc: any): VersionDocumento | null {
    const versions = this.versionsMap[doc.id];
    if (!versions || versions.length === 0) {
      return null;
    }

    // Si es "Por Aprobar", la versión activa a mostrar en la tabla debería ser la versión pendiente de aprobación
    if (this.activeTab === 'por_aprobar') {
      for (const v of versions) {
        const flow = this.activeFlowMap[v.id];
        if (flow && flow.status === 'Pendiente') {
          return v;
        }
      }
    }

    // Buscamos la última versión a la que el usuario tiene acceso
    for (const v of versions) {
      if (this.activeTab === 'publicos' && v.visible === false) {
        continue;
      }
      if (this.hasAccessToVersion(doc, v)) {
        return v;
      }
    }
    return null;
  }

  shouldShowVersionInTimeline(ver: VersionDocumento): boolean {
    if (!ver) return false;
    const doc = this.documentos.find(d => d.id === ver.id_documento);
    if (!doc) return false;

    if (this.activeTab === 'por_aprobar') {
      const flow = this.activeFlowMap[ver.id];
      return flow && flow.status === 'Pendiente';
    }
    if (this.activeTab === 'publicos') {
      if (ver.visible === false) return false;
      return this.hasAccessToVersion(doc, ver);
    }
    return true;
  }

  updateActiveVersion(doc: any) {
    this.activeVersionMap[doc.id] = this.resolveActiveVersion(doc);
    this.updateCounters();
    this.applyFilters();
    this.cdr.detectChanges();
  }

  loadDocumentDetails(doc: any) {
    this.versionService.getVersionDocumentoByIdDoc(doc.id).subscribe(
      (versions) => {
        if (versions && versions.length > 0) {
          versions.sort((a, b) => b.version - a.version);
          this.versionsMap[doc.id] = versions;

          const tipo = this.tiposDocumento.find(t => t.id === doc.id_tipo_documento);
          const requiereAprobacion = tipo ? tipo.requiere_aprobacion : false;

          if (requiereAprobacion) {
            let loadedCount = 0;
            versions.forEach(ver => {
              this.flujoService.getFlujoByVersionId(ver.id).subscribe(
                (flows: any[]) => {
                  this.activeFlowMap[ver.id] = flows && flows.length > 0 ? flows[0] : null;
                  loadedCount++;
                  if (loadedCount === versions.length) {
                    this.updateActiveVersion(doc);
                  }
                },
                () => {
                  this.activeFlowMap[ver.id] = null;
                  loadedCount++;
                  if (loadedCount === versions.length) {
                    this.updateActiveVersion(doc);
                  }
                }
              );
            });
          } else {
            versions.forEach(ver => {
              this.activeFlowMap[ver.id] = null;
            });
            this.updateActiveVersion(doc);
          }
        } else {
          this.versionsMap[doc.id] = [];
          this.activeVersionMap[doc.id] = null;
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
    if (this.documentos) {
      this.documentos.forEach(doc => {
        this.activeVersionMap[doc.id] = this.resolveActiveVersion(doc);
      });
    }

    this.filteredDocumentos = this.documentos.filter(doc => {
      // Filtro de sección (Públicos / Privados / Por Aprobar)
      let matchPublico = false;
      if (this.activeTab === 'publicos') {
        const activeVer = this.activeVersionMap[doc.id];
        if (!activeVer) {
          matchPublico = false;
        } else {
          if (this.activePublicSubTab === 'general') {
            matchPublico = doc.publico === true && doc.solo_mi_red === false;
          } else {
            matchPublico = doc.publico === true && doc.solo_mi_red === true && doc.codred === this.codred;
          }
        }
      } else if (this.activeTab === 'privados') {
        const isMyDoc = this.user ? doc.id_user_creation === this.user.id : false;
        if (!isMyDoc) {
          matchPublico = false;
        } else {
          if (this.filterPrivacy === 'publico') {
            matchPublico = doc.publico === true;
          } else if (this.filterPrivacy === 'privado') {
            matchPublico = doc.publico !== true;
          } else {
            matchPublico = true;
          }
        }
      } else if (this.activeTab === 'por_aprobar') {
        if (this.activeApprovalSubTab === 'por_mi_aprobar') {
          matchPublico = this.puedeAprobar(doc);
        } else {
          matchPublico = this.isMiSolicitudPendiente(doc);
        }
      }

      // Filtro por Red Asistencial (solo para públicos si se selecciona)
      let matchCodred = true;
      if (this.activeTab === 'publicos' && this.filterCodred) {
        matchCodred = doc.codred === this.filterCodred;
      }

      // 1. Filtro de Texto (Código, Título, Descripción)
      const query = this.filterSearch.toLowerCase().trim();
      const matchSearch = !query ||
        doc.titulo.toLowerCase().includes(query) ||
        doc.codigo.toLowerCase().includes(query) ||
        (doc.descripcion && doc.descripcion.toLowerCase().includes(query));

      // 2. Filtro de Tipo
      const matchTipo = !this.filterTipo || doc.id_tipo_documento === Number(this.filterTipo);

      // 3. Filtro de Estado
      const activeVer = this.activeVersionMap[doc.id];
      const flow = activeVer ? this.activeFlowMap[activeVer.id] : null;
      const status = flow ? flow.status : 'No Requiere Aprobación';

      let matchStatus = true;
      if (this.filterStatus) {
        if (this.filterStatus === 'SIN_APROBACION') {
          matchStatus = status === 'No Requiere Aprobación';
        } else {
          matchStatus = status.toLowerCase() === this.filterStatus.toLowerCase();
        }
      }

      return matchPublico && matchCodred && matchSearch && matchTipo && matchStatus;
    });
    this.updatePagedDocumentos();
    this.cdr.detectChanges();
  }

  updateCounters() {
    this.totalCount = 0;
    this.approvedCount = 0;
    this.pendingCount = 0;
    this.noApprovalCount = 0;

    const filteredByTab = this.documentos.filter(doc => {
      if (this.activeTab === 'publicos') {
        const activeVer = this.activeVersionMap[doc.id];
        if (!activeVer) return false;

        if (this.activePublicSubTab === 'general') {
          return doc.publico === true && doc.solo_mi_red === false;
        } else {
          return doc.publico === true && doc.solo_mi_red === true && doc.codred === this.codred;
        }
      } else if (this.activeTab === 'privados') {
        const isMyDoc = this.user ? doc.id_user_creation === this.user.id : false;
        if (!isMyDoc) return false;
        if (this.filterPrivacy === 'publico') {
          return doc.publico === true;
        } else if (this.filterPrivacy === 'privado') {
          return doc.publico !== true;
        }
        return true;
      } else if (this.activeTab === 'por_aprobar') {
        if (this.activeApprovalSubTab === 'por_mi_aprobar') {
          return this.puedeAprobar(doc);
        } else {
          return this.isMiSolicitudPendiente(doc);
        }
      }
      return false;
    });

    this.totalCount = filteredByTab.length;

    if (this.activeTab === 'por_aprobar') {
      this.pendingCount = this.totalCount;
      this.cdr.detectChanges();
      return;
    }

    const filteredByTabForNonApproval = this.documentos.filter(doc => {
      if (this.activeTab === 'publicos') {
        const activeVer = this.activeVersionMap[doc.id];
        if (!activeVer) return false;

        if (this.activePublicSubTab === 'general') {
          return doc.publico === true && doc.solo_mi_red === false;
        } else {
          return doc.publico === true && doc.solo_mi_red === true && doc.codred === this.codred;
        }
      } else if (this.activeTab === 'privados') {
        const isMyDoc = this.user ? doc.id_user_creation === this.user.id : false;
        if (!isMyDoc) return false;
        if (this.filterPrivacy === 'publico') {
          return doc.publico === true;
        } else if (this.filterPrivacy === 'privado') {
          return doc.publico !== true;
        }
        return true;
      }
      return false;
    });

    filteredByTabForNonApproval.forEach(doc => {
      const activeVer = this.activeVersionMap[doc.id];
      const flow = activeVer ? this.activeFlowMap[activeVer.id] : null;
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

  eliminarDocumento(doc: any) {
    if (this.user?.id !== doc.id_user_creation) {
      alert('Acceso denegado: Solo el creador del documento puede eliminarlo.');
      return;
    }
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
  abrirHistorial(doc: any) {
    const realDoc = doc.id_documento_real ? this.documentos.find(d => d.id === doc.id_documento_real) : doc;
    this.selectedDoc = realDoc;
    this.selectedVersion = doc.version_objeto || this.activeVersionMap[realDoc.id];
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
    this.selectedVersionFlow = null;
    this.flujoService.getFlujoByVersionId(version.id).subscribe(
      (flows: any[]) => {
        const flow = flows && flows.length > 0 ? flows[0] : null;
        this.selectedVersionFlow = flow;
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
        this.cdr.detectChanges();
      }
    );
  }

  descargarDocumentoVersion(doc: any) {
    const ver = doc.version_objeto || this.activeVersionMap[doc.id];
    if (ver) {
      this.descargarArchivo(ver);
    }
  }

  abrirAprobacion(doc: any) {
    if (doc.flujo_objeto) {
      this.selectedDoc = this.documentos.find(d => d.id === doc.id_documento_real) || doc;
      this.selectedVersion = doc.version_objeto;
      this.selectedFlow = doc.flujo_objeto;
    } else {
      this.selectedDoc = doc;
      this.selectedVersion = this.activeVersionMap[doc.id];
      this.selectedFlow = this.activeVersionMap[doc.id] ? this.activeFlowMap[this.activeVersionMap[doc.id]!.id] : null;
    }
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
        if (this.selectedVersion) {
          this.cargarHistorialDeVersion(this.selectedVersion);
        }
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al actualizar flujo de aprobación:', error);
        alert('Ocurrió un error al guardar la decisión de aprobación.');
      }
    );
  }

  puedeAprobar(doc: any): boolean {
    if (doc.flujo_objeto) {
      return doc.flujo_objeto.status === 'Pendiente' && doc.flujo_objeto.id_user_aprobador === this.user?.id;
    }
    const activeVer = this.activeVersionMap[doc.id];
    if (!activeVer) return false;
    const flow = this.activeFlowMap[activeVer.id];
    if (!flow || flow.status !== 'Pendiente') return false;
    return flow.id_user_aprobador === this.user?.id;
  }

  isMiSolicitudPendiente(doc: any): boolean {
    if (doc.flujo_objeto) {
      return doc.flujo_objeto.status === 'Pendiente' && doc.id_user_creation === this.user?.id;
    }
    const activeVer = this.activeVersionMap[doc.id];
    if (!activeVer) return false;
    const flow = this.activeFlowMap[activeVer.id];
    if (!flow || flow.status !== 'Pendiente') return false;
    return doc.id_user_creation === this.user?.id;
  }

  setApprovalSubTab(subTab: 'por_mi_aprobar' | 'mis_solicitudes') {
    this.activeApprovalSubTab = subTab;
    this.currentPage = 1;
    this.applyFilters();
    this.updateCounters();
  }

  setPublicSubTab(subTab: 'general' | 'mi_red') {
    this.activePublicSubTab = subTab;
    this.currentPage = 1;
    this.applyFilters();
    this.updateCounters();
  }

  getActiveFlowPriority(doc: any): string | null {
    if (doc.flujo_objeto) {
      return doc.flujo_objeto.prioridad || 'MEDIA';
    }
    const activeVer = this.activeVersionMap[doc.id];
    if (!activeVer) return null;
    const flow = this.activeFlowMap[activeVer.id];
    return flow ? (flow.prioridad || 'MEDIA') : null;
  }

  getActiveFlowStatus(doc: any): string | null {
    if (doc.flujo_objeto) {
      return doc.flujo_objeto.status;
    }
    const activeVer = this.activeVersionMap[doc.id];
    if (!activeVer) return null;
    const flow = this.activeFlowMap[activeVer.id];
    return flow ? flow.status : null;
  }

  updatePagedDocumentos() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedDocumentos = this.filteredDocumentos.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagedDocumentos();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagedDocumentos();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDocumentos.length / this.pageSize) || 1;
  }

  // ---- Registro flotante (reemplaza /documento/creacion) ----
  showCreateDialog: boolean = false;
  createMode: DocumentoFormMode = 'documento';
  createDocumentoId: number | null = null;
  toastMessage: string = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  openCreate(mode: DocumentoFormMode, documentoId: number | null = null): void {
    this.createMode = mode;
    this.createDocumentoId = documentoId;
    this.showCreateDialog = true;
    this.cdr.detectChanges();
  }

  closeCreate(): void {
    this.showCreateDialog = false;
    this.cdr.detectChanges();
  }

  onCreateSaved(event: { kind: DocumentoFormMode; message: string }): void {
    this.showCreateDialog = false;
    this.showToast(event.message);
    if (event.kind === 'tipo') {
      this.loadTiposDocumentos();
    }
    this.getDocumentos();
    this.cdr.detectChanges();
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4500);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showDecisionModal || this.showTimelineModal || this.showEditDocumentModal) {
      this.cerrarModales();
    }
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterSearch.trim() || this.filterTipo || this.filterStatus || this.filterCodred || this.filterPrivacy);
  }

  limpiarFiltros(): void {
    this.filterSearch = '';
    this.filterTipo = '';
    this.filterStatus = '';
    this.filterCodred = '';
    this.filterPrivacy = '';
    this.applyFilters();
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
    this.showEditDocumentModal = false;
    this.editDocId = null;
    this.editDocCodigo = '';
    this.editDocTitulo = '';
    this.editDocDescripcion = '';
    this.editDocPublico = false;
    this.editDocSoloMiRed = false;
    this.editDocIdTipoDocumento = null;
    this.editDocFlag = true;
    this.cdr.detectChanges();
  }

  // Métodos de Acciones de Edición/Eliminación y Visualización Controlada

  editarDocumento(doc: any) {
    if (this.user?.id !== doc.id_user_creation) {
      alert('Acceso denegado: Solo el creador del documento puede editarlo.');
      return;
    }
    this.selectedDoc = doc;
    this.editDocId = doc.id;
    this.editDocCodigo = doc.codigo;
    this.editDocTitulo = doc.titulo;
    this.editDocDescripcion = doc.descripcion || '';
    
    const requiresApproval = this.requiereAprobacionDoc(doc);
    this.editDocPublico = requiresApproval ? (doc.publico === true) : false;
    this.editDocSoloMiRed = requiresApproval ? (doc.solo_mi_red === true) : false;
    
    this.editDocIdTipoDocumento = doc.id_tipo_documento;
    this.editDocFlag = doc.flag !== false;
    this.showEditDocumentModal = true;
    this.cdr.detectChanges();
  }

  actualizarDocumento() {
    if (!this.editDocId) return;

    const dto: Documento = {
      id: this.editDocId,
      codigo: this.editDocCodigo,
      titulo: this.editDocTitulo,
      descripcion: this.editDocDescripcion,
      publico: this.editDocPublico,
      solo_mi_red: this.editDocPublico ? this.editDocSoloMiRed : false,
      id_tipo_documento: this.editDocIdTipoDocumento || 0,
      flag: this.editDocFlag,
      codcas: this.selectedDoc.codcas,
      codred: this.selectedDoc.codred,
      id_user_creation: this.selectedDoc.id_user_creation,
      date_creation: this.selectedDoc.date_creation,
      date_update: '',
      date_delete: ''
    };

    this.docService.saveDocumento(dto).subscribe(
      () => {
        alert('Documento actualizado exitosamente.');
        this.showEditDocumentModal = false;
        this.getDocumentos();
      },
      (error) => {
        console.error('Error al actualizar documento:', error);
        alert('Ocurrió un error al actualizar el documento.');
      }
    );
  }

  getFlowForVersion(version: VersionDocumento): any | null {
    if (this.selectedVersion && this.selectedVersion.id === version.id) {
      return this.selectedVersionFlow;
    }
    return this.activeFlowMap[version.id];
  }

  puedeAprobarVersion(version: VersionDocumento): boolean {
    if (!version) return false;
    const flow = this.getFlowForVersion(version);
    if (!flow || (flow.status !== 'Pending' && flow.status !== 'Pendiente')) return false;
    return flow.id_user_aprobador === this.user?.id;
  }

  abrirAprobacionVersion(doc: any, version: VersionDocumento, flow: any) {
    this.selectedDoc = doc;
    this.selectedVersion = version;
    this.selectedFlow = flow;
    this.observacion = '';
    this.showDecisionModal = true;
    this.cdr.detectChanges();
  }

  puedeDescargarFisico(version: VersionDocumento): boolean {
    const doc = this.documentos.find(d => d.id === version.id_documento);
    if (!doc) return false;

    const isOwner = doc.id_user_creation === this.user?.id || version.id_user_creation === this.user?.id;
    const flow = this.getFlowForVersion(version);
    const isApprover = (flow && flow.id_user_aprobador === this.user?.id) || version.id_user_aprobador === this.user?.id;
    const isAdmin = !!(this.user?.roles?.includes('ADMIN') || this.user?.roles?.includes('ADMIN_RED'));

    // Si requiere aprobación y no está aprobado:
    if (this.requiereAprobacionDoc(doc)) {
      const isApproved = flow && flow.status === 'Aprobado';
      if (!isApproved && !isOwner && !isApprover && !isAdmin) {
        return false;
      }
    }

    // Si el documento es privado, solo el dueño o aprobador asignado pueden descargar
    if (!doc.publico) {
      return isOwner || !!isApprover || isAdmin;
    }

    // Si la versión es privada/borrador, solo el creador de la versión o aprobador asignado pueden descargar
    if (version.visible === false) {
      return isOwner || !!isApprover || isAdmin;
    }

    // Si es público y la versión es pública, validar restricción de red (solo_mi_red)
    if (doc.solo_mi_red) {
      return doc.codred === this.codred || isOwner || !!isApprover || isAdmin;
    }

    return true;
  }

  puedeVisualizarVersion(version: VersionDocumento): boolean {
    return this.puedeDescargarFisico(version);
  }

  puedeEditarVersion(version: VersionDocumento): boolean {
    return version.id_user_creation === this.user?.id;
  }

  puedeEliminarVersion(version: VersionDocumento): boolean {
    return version.id_user_creation === this.user?.id;
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
    this.editVersionComentario = version.descripcion || '';
    this.editVersionVisible = version.visible !== false;
    this.editVersionAprobadorId = version.id_user_aprobador;
    this.editVersionFile = null;
    this.showEditVersionForm = true;
    this.cdr.detectChanges();
  }

  onEditFileChange(event: any) {
    const file = event.target.files && event.target.files.length > 0 ? event.target.files[0] : null;
    this.editVersionFile = file;
  }



  loadUsersAprobadores() {
    if (!this.codred) {
      this.userService.getAllUsers().subscribe(
        (data) => {
          this.users_aprobadores = data || [];
          this.cdr.detectChanges();
        },
        (err) => console.error('Error al cargar usuarios aprobadores:', err)
      );
      return;
    }
    this.userService.getUsersByCodred(this.codred).subscribe(
      (data) => {
        this.users_aprobadores = data || [];
        this.cdr.detectChanges();
      },
      (err) => console.error('Error al cargar usuarios aprobadores:', err)
    );
  }

  actualizarVersion() {
    if (!this.selectedVersion) return;

    const formData = new FormData();
    formData.append('id', String(this.selectedVersion.id));
    formData.append('nombre', this.editVersionNombre);
    formData.append('descripcion', this.editVersionComentario);
    formData.append('version', String(this.selectedVersion.version));
    formData.append('id_documento', String(this.selectedVersion.id_documento));
    formData.append('id_user_creation', String(this.selectedVersion.id_user_creation));
    formData.append('visible', String(this.editVersionVisible));

    if (this.editVersionFile) {
      formData.append('archivo', this.editVersionFile, this.editVersionFile.name);
    }
    if (this.editVersionAprobadorId !== null) {
      formData.append('id_user_aprobador', String(this.editVersionAprobadorId));
    }

    this.versionService.updateVersionDocumento(formData).subscribe(
      () => {
        alert('Versión actualizada exitosamente.');
        this.showEditVersionForm = false;
        if (this.selectedDoc) {
          this.loadDocumentDetails(this.selectedDoc);
          this.selectedVersion!.nombre = this.editVersionNombre;
          this.selectedVersion!.descripcion = this.editVersionComentario;
          this.selectedVersion!.visible = this.editVersionVisible;
          this.selectedVersion!.id_user_aprobador = this.editVersionAprobadorId;
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
