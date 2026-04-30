
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileService } from '../../../services/file-service';
import { ChangeDetectorRef } from '@angular/core';

interface ReporteDocumento {
  id?: number | string;
  nombre?: string;
  descripcion?: string;
  archivo?: string;
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
  loading = false;
  errorMessage = '';

  previewVisible = false;
  previewName = '';
  previewUrl = '';
  previewSafeUrl: SafeResourceUrl | null = null;

  constructor(
    private fileService: FileService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
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
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los documentos', error);
        this.documentos = [];
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el listado de documentos.';
      },
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

  openArchivo(documento: ReporteDocumento): void {
    const archivo = this.getArchivoNombre(documento);

    if (!archivo || archivo === 'Archivo no disponible') {
      this.errorMessage = 'Este documento no tiene archivo asociado.';
      return;
    }

    this.fileService.getFile(archivo).subscribe({
      next: (blob: Blob) => {
        this.clearPreviewUrl();
        this.previewName = archivo;
        this.previewUrl = URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
        this.previewVisible = true;
      },
      error: (error) => {
        console.error('Error al abrir el archivo', error);
        this.errorMessage = 'No se pudo abrir el archivo solicitado.';
      },
    });
  }

  getArchivo(id: number | string): void {
    this.fileService.getArchivo(id).subscribe({
      next: (blob: Blob) => {
        this.clearPreviewUrl();
        this.previewName = `Archivo_${id}`;
        this.previewUrl = URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
        this.previewVisible = true;
      },
      error: (error) => {
        console.error('Error al abrir el archivo', error);
        this.errorMessage = 'No se pudo abrir el archivo solicitado.';
      }
    });
  }

  closePreview(): void {
    this.previewVisible = false;
    this.clearPreviewUrl();
  }

  private normalizeDocumentos(response: any): ReporteDocumento[] {
    const rawDocuments = Array.isArray(response)
      ? response
      : response?.data ?? response?.documentos ?? response?.items ?? response?.result ?? [];

    return rawDocuments.map((documento: any) => ({
      ...documento,
      nombre: documento?.nombre ?? documento?.name ?? documento?.titulo ?? documento?.fileName ?? documento?.archivo ?? '',
      descripcion: documento?.descripcion ?? documento?.description ?? '',
      archivo: documento?.archivo ?? documento?.fileName ?? documento?.nameFile ?? documento?.nombreArchivo ?? documento?.rutaArchivo ?? documento?.nombre ?? '',
      date_creation: documento?.date_creation ?? documento?.createdAt ?? documento?.fecha_creacion ?? '',
      date_update: documento?.date_update ?? documento?.updatedAt ?? documento?.fecha_actualizacion ?? '',
      usuario_creation: documento?.usuario_creation ?? documento?.creator ?? '',
      usuario_update: documento?.usuario_update ?? documento?.updater ?? '',
    }));
  }

  private clearPreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = '';
    this.previewSafeUrl = null;
  }
}
