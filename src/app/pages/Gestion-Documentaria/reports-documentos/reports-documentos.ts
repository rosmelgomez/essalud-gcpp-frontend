
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FileService } from '../../../services/file-service';
import { ChangeDetectorRef } from '@angular/core';

// Tipos de archivo que pueden visualizarse en el navegador
const TIPOS_VISUALIZABLES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'text/plain',
];

// Mapeo de MIME types a extensiones de archivo
const EXTENSION_MAP: { [key: string]: string } = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/x-msvideo': 'avi',
  'video/quicktime': 'mov',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'application/x-7z-compressed': '7z',
  'application/octet-stream': 'bin',
};

interface ReporteDocumento {
  id?: number | string;
  nombre?: string;
  descripcion?: string;
  archivo?: string;
  tipo_archivo?: string;
  date_creation?: string;
  date_update?: string;
  usuario_creation?: string;
  usuario_update?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-reports-documentos',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './reports-documentos.html',
  styleUrl: './reports-documentos.css',
})
export class ReportsDocumentos implements OnInit, OnDestroy {
  documentos: ReporteDocumento[] = [];
  documentosFiltrados: ReporteDocumento[] = [];
  loading = false;
  errorMessage = '';

  previewVisible = false;
  previewName = '';
  previewUrl = '';
  previewSafeUrl: SafeResourceUrl | null = null;

  // Filtro
  // Filtros
  filtroTipoArchivo: string = '';
  filtroNombre: string = '';
  filtroDescripcion: string = '';
  filtroUsuarioCreation: string = '';
  filtroUsuarioUpdate: string = '';
  tiposArchivoDisponibles: Array<{ key: string; label: string }> = [];

  constructor(
    private fileService: FileService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.getDocumentos();
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
  }

  getDocumentos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.fileService.getFiles().subscribe({
      next: (response: any) => {
        this.documentos = this.normalizeDocumentos(response);
        this.extraerTiposArchivoDisponibles();
        this.aplicarFiltro();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los documentos', error);
        this.documentos = [];
        this.documentosFiltrados = [];
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el listado de documentos.';
      },
    });
  }

  updateDocumentos(): void {




    this.getDocumentos();
  }

  deleteDocumento(documento: ReporteDocumento): void {
    if (!documento.id) {
      this.errorMessage = 'No se puede eliminar un documento.';
      return;
    }

    this.fileService.deleteArchivo(documento.id).subscribe({
      next: () => {
        this.documentos = this.documentos.filter(doc => doc.id !== documento.id);
        this.aplicarFiltro();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar el documento', error);
        this.errorMessage = 'No se pudo eliminar el documento solicitado.';
      }
    });
  }

  editDocumento(documento: ReporteDocumento): void {
    this.router.navigate(['/creacion-documento'], {
      state: { documento },
    });
  }

  downloadDocumento(documento: ReporteDocumento): void {
    if (!documento.id) {
      this.errorMessage = 'No se puede descargar un documento sin identificador.';
      return;
    }
    this.fileService.getArchivo(documento.id).subscribe({
      next: (resp: any) => {
        const blob: Blob = resp.body as Blob;

        if (!blob || blob.size === 0) {
          this.errorMessage = 'No se pudo descargar el archivo. Intenta de nuevo.';
          return;
        }

        // Intentar obtener nombre desde headers
        const disposition = resp.headers?.get?.('Content-Disposition') || resp.headers?.get?.('content-disposition');
        const filenameFromHeader = this.obtenerNombreArchivoDesdeDisposition(disposition);
        const downloadName = filenameFromHeader ?? this.getArchivoNombreConExtension(documento) ?? `Archivo_${documento.id}`;

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Error al descargar el documento', error);
        this.errorMessage = 'No se pudo descargar el documento solicitado.';
      }
    });
  }

  trackByDocumento(index: number, documento: ReporteDocumento): number | string {
    return documento.id ?? documento.archivo ?? documento.nombre ?? index;
  }

  getNombreDocumento(documento: ReporteDocumento): string {
    return String(documento.nombre ?? documento.descripcion ?? documento.archivo ?? 'Sin nombre');
  }

  getArchivoNombre(documento: ReporteDocumento): string {
    return String(documento.archivo ?? documento.nombre ?? 'Archivo no disponible');
  }

  /**
   * Genera nombre de archivo con extensión basada en el tipo MIME
   */
  getArchivoNombreConExtension(documento: ReporteDocumento): string {
    const nombreBase = documento.nombre ?? documento.archivo ?? `Archivo_${documento.id}`;
    const tipoArchivo = documento.tipo_archivo || '';
    
    return this.generarNombreDescargaConExtension(nombreBase, tipoArchivo);
  }

  /**
   * Extrae el nombre de archivo desde header Content-Disposition si existe
   */
  private obtenerNombreArchivoDesdeDisposition(disposition: string | null | undefined): string | null {
    if (!disposition) return null;
    const match = /filename\*=UTF-8''(.+)$/.exec(disposition);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }

    const matchSimple = /filename="?([^";]+)"?/.exec(disposition);
    return matchSimple?.[1] ?? null;
  }

  /**
   * Genera el nombre final del archivo agregando la extensión correcta si es necesaria
   */
  private generarNombreDescargaConExtension(nombreBase: string, contentType: string): string {
    // Si el nombre ya tiene extensión, retornarlo tal cual
    if (nombreBase.includes('.')) {
      return nombreBase;
    }

    // Obtener la extensión del mapa
    const extension = EXTENSION_MAP[contentType.toLowerCase()] || 'bin';
    return `${nombreBase}.${extension}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return '---';
    }

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return '---';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return '---';
    }
  }

  

  openArchivo(documento: ReporteDocumento): void {
    if (!documento.id) {
      this.errorMessage = 'Este documento no tiene archivo asociado.';
      return;
    }

    // Mostrar el contenedor de vista previa al instante para que no parezca que requiere doble click.
    this.errorMessage = '';
    this.previewName = this.getNombreDocumento(documento);
    this.previewVisible = true;
    this.clearPreviewUrl();

    this.getArchivo(documento.id, this.getNombreDocumento(documento), documento.tipo_archivo);
  }

  getArchivo(id: number | string, previewLabel?: string, tipoArchivo?: string): void {
    this.fileService.getArchivo(id).subscribe({
      next: (resp: any) => {
        const blob: Blob = resp.body as Blob;

        // Validar que el archivo se descargó correctamente
        if (!blob || blob.size === 0) {
          this.previewVisible = false;
          this.clearPreviewUrl();
          this.errorMessage = 'No se pudo obtener el archivo. Intenta descargarlo en su lugar.';
          return;
        }

        // Determinar tipo de contenido (usar el proporcionado, header o inferir del blob)
        const headerContentType = resp.headers?.get?.('Content-Type') || resp.headers?.get?.('content-type');
        const contentType = (tipoArchivo || headerContentType || blob.type || 'application/octet-stream').toString();

        // Verificar si el archivo es visualizable
        const esVisualizableType = this.esArchivoVisualizable(contentType);

        if (esVisualizableType) {
          // Abrir en vista previa
          this.clearPreviewUrl();
          this.previewName = previewLabel ?? `Archivo_${id}`;
          this.previewUrl = URL.createObjectURL(blob);
          this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
          this.previewVisible = true;
          this.cdr.detectChanges();
        } else {
          // Archivo no visualizable - solo mostrar alerta (NO descargar)
          const disposition = resp.headers?.get?.('Content-Disposition') || resp.headers?.get?.('content-disposition');
          const filenameFromHeader = this.obtenerNombreArchivoDesdeDisposition(disposition);
          const downloadName = filenameFromHeader ?? this.generarNombreDescargaConExtension(previewLabel ?? `Archivo_${id}`, contentType);

          this.previewVisible = false;
          this.clearPreviewUrl();
          this.errorMessage = '';
          alert(`El archivo no se puede visualizar en línea.\n\nTipo: ${contentType}\nNombre: ${downloadName}\n\nUsa el botón "Descargar" para obtener el archivo.`);
        }
      },
      error: (error) => {
        console.error('Error al abrir el archivo', error);
        this.previewVisible = false;
        this.clearPreviewUrl();
        this.errorMessage = 'No se pudo abrir el archivo solicitado. Intenta descargarlo.';
      }
    });
  }

  /**
   * Valida si un tipo de archivo puede visualizarse en el navegador
   */
  private esArchivoVisualizable(contentType: string): boolean {
    return TIPOS_VISUALIZABLES.some((tipo) => contentType.toLowerCase().includes(tipo));
  }
  /**
   * Normaliza un tipo MIME a una clave legible y una etiqueta para mostrar
   */
  private normalizeTipo(contentType: string | undefined): { key: string; label: string } {
    const ct = (contentType || '').toLowerCase();

    if (!ct) return { key: 'otro', label: 'Otro' };

    if (ct.includes('wordprocessingml') || ct.includes('msword')) {
      return { key: 'documento', label: 'Documento (.doc/.docx)' };
    }

    if (ct.includes('excel') || ct.includes('spreadsheet')) {
      return { key: 'hoja_calculo', label: 'Hoja de cálculo (.xls/.xlsx)' };
    }

    if (ct.includes('powerpoint') || ct.includes('presentation')) {
      return { key: 'presentacion', label: 'Presentación (.ppt/.pptx)' };
    }

    if (ct.includes('pdf')) {
      return { key: 'pdf', label: 'PDF' };
    }

    if (ct.startsWith('image/')) {
      return { key: 'imagen', label: 'Imagen' };
    }

    if (ct.startsWith('video/')) {
      return { key: 'video', label: 'Video' };
    }

    if (ct.includes('text') || ct.includes('csv')) {
      return { key: 'texto', label: 'Texto/CSV' };
    }

    return { key: 'otro', label: 'Otro' };
  }

  /**
   * Extrae los tipos de archivo únicos disponibles de los documentos (normalizados)
   */
  private extraerTiposArchivoDisponibles(): void {
    const map = new Map<string, string>();

    this.documentos.forEach((doc) => {
      const normalized = this.normalizeTipo(String(doc.tipo_archivo || ''));
      map.set(normalized.key, normalized.label);
    });

    this.tiposArchivoDisponibles = Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Aplica los filtros múltiples (nombre, descripción, tipo, usuarios)
   */
  aplicarFiltro(): void {
    const nameFilter = (this.filtroNombre || '').toLowerCase().trim();
    const descFilter = (this.filtroDescripcion || '').toLowerCase().trim();
    const tipoFilter = (this.filtroTipoArchivo || '').toLowerCase().trim();
    const userCreationFilter = (this.filtroUsuarioCreation || '').toLowerCase().trim();
    const userUpdateFilter = (this.filtroUsuarioUpdate || '').toLowerCase().trim();

    this.documentosFiltrados = this.documentos.filter((doc: any) => {
      const nombre = String(doc.nombre || '').toLowerCase();
      const descripcion = String(doc.descripcion || '').toLowerCase();
      const usuarioCreation = String(doc.usuario_creation || '').toLowerCase();
      const usuarioUpdate = String(doc.usuario_update || '').toLowerCase();

      if (nameFilter && !nombre.includes(nameFilter)) return false;
      if (descFilter && !descripcion.includes(descFilter)) return false;
      if (userCreationFilter && !usuarioCreation.includes(userCreationFilter)) return false;
      if (userUpdateFilter && !usuarioUpdate.includes(userUpdateFilter)) return false;

      if (tipoFilter) {
        // comparar con la clave normalizada
        const normalized = this.normalizeTipo(String(doc.tipo_archivo || '')).key;
        if (normalized !== tipoFilter) return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  /**
   * Manejador para cambios en el filtro
   */
  onFiltroTipoArchivoChange(valor: string): void {
    this.filtroTipoArchivo = valor;
    this.aplicarFiltro();
  }

  closePreview(): void {
    this.previewVisible = false;
    this.clearPreviewUrl();
  }

  private normalizeDocumentos(response: any): ReporteDocumento[] {
    const rawDocuments = Array.isArray(response)
      ? response
      : response?.data ?? response?.documentos ?? response?.items ?? response?.result ?? [];
    return rawDocuments.map((documento: any) => {
      const tipoRaw = documento?.tipo_archivo ?? documento?.fileType ?? documento?.tipoArchivo ?? '';
      const normalized = this.normalizeTipo(String(tipoRaw));

      return {
        ...documento,
        nombre: documento?.nombre ?? documento?.name ?? documento?.titulo ?? documento?.fileName ?? documento?.archivo ?? '',
        descripcion: documento?.descripcion ?? documento?.description ?? '',
        archivo: documento?.archivo ?? documento?.fileName ?? documento?.nameFile ?? documento?.nombreArchivo ?? documento?.rutaArchivo ?? documento?.nombre ?? '',
        tipo_archivo: String(tipoRaw || ''),
        tipo_archivo_normalized: normalized.key,
        tipo_archivo_label: normalized.label,
        date_creation: documento?.date_creation ?? documento?.createdAt ?? documento?.fecha_creacion ?? '',
        date_update: documento?.date_update ?? documento?.updatedAt ?? documento?.fecha_actualizacion ?? '',
        usuario_creation: documento?.usuario_creation ?? documento?.creator ?? '',
        usuario_update: documento?.usuario_update ?? documento?.updater ?? '',
      } as ReporteDocumento & { tipo_archivo_normalized?: string; tipo_archivo_label?: string };
    });
  }

  private clearPreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = '';
    this.previewSafeUrl = null;
  }
}
