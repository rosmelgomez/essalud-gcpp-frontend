import { LocalStorageService } from './../../../services/local-storage-service';
import { Component } from '@angular/core';
import { FileService } from '../../../services/file-service';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OnInit } from '@angular/core';

// Mapeo de extensiones a MIME types para archivos que podrían no detectarse correctamente
const MIME_TYPES_MAP: { [key: string]: string } = {
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'pdf': 'application/pdf',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
};

@Component({
  selector: 'app-creacion-documentos',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './creacion-documentos.html',
  styleUrl: './creacion-documentos.css',
})
export class CreacionDocumentos implements OnInit {
  public registerForm!: FormGroup;
  public isEditing = false;
  public creadorLabel = 'Usuario no identificado';
  public fechaOperacionLabel = '';
  public formatosPermitidos = '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .jpg, .png, .gif, .webp, .mp4, .avi, .mov, .zip, .rar, .7z';
  private editingDocumentoId: number | string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private fileService: FileService,
    private localStorage: LocalStorageService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.reactiveForm();
    this.loadFormContextInfo();
    this.loadDocumentoFromNavigation();
  }

  reactiveForm() {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      archivo: [null, [Validators.required]],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.registerForm.patchValue({ archivo: file });
    this.registerForm.get('archivo')?.updateValueAndValidity();
  }


  registerDocumento() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const user = this.localStorage.getUser();
    const usuario = this.buildUserDisplayName(user);
    
    const documentoFormData = new FormData();
    const archivo = this.registerForm.get('archivo')?.value as File | null;

    // Obtener el tipo MIME correcto del archivo
    const tipoArchivoCorrect = archivo ? this.getMimeType(archivo) : '';

    // Add all metadata fields as individual form fields
    documentoFormData.append('id', this.editingDocumentoId?.toString() ?? '');
    documentoFormData.append('nombre', this.registerForm.get('nombre')?.value ?? '');
    documentoFormData.append('descripcion', this.registerForm.get('descripcion')?.value ?? '');
    documentoFormData.append('tipo_archivo', tipoArchivoCorrect);
    documentoFormData.append('usuario_creation', usuario);
    documentoFormData.append('usuario_update', usuario);
    documentoFormData.append('date_creation', '');
    documentoFormData.append('date_update', '');

    // Add file if present
    if (archivo) {
      documentoFormData.append('archivo', archivo);
    }

    const request = this.isEditing
      ? this.fileService.updateArchivo(documentoFormData)
      : this.fileService.insertfile(documentoFormData);

    request.subscribe(
      (response) => {
        console.log(this.isEditing ? 'Archivo actualizado exitosamente' : 'Archivo subido exitosamente', response);
        this.registerForm.reset();
        this.isEditing = false;
        this.editingDocumentoId = null;
        void this.router.navigate(['/report-documentos']);
      },
      (error) => {
        console.error(this.isEditing ? 'Error al actualizar el archivo' : 'Error al subir el archivo', error);
      }
    );
  }

  /**
   * Detecta el MIME type correcto basado en la extensión del archivo
   * Fallback a archivo.type si no se encuentra en el mapa
   */
  private getMimeType(file: File): string {
    // Intentar usar el tipo MIME nativo del archivo primero
    if (file.type && file.type !== '') {
      return file.type;
    }

    // Si no tiene tipo MIME, extraer la extensión y buscar en el mapa
    const fileName = file.name.toLowerCase();
    const lastDot = fileName.lastIndexOf('.');
    
    if (lastDot === -1) {
      // Sin extensión, retornar tipo genérico
      return 'application/octet-stream';
    }

    const extension = fileName.substring(lastDot + 1);
    const mimeType = MIME_TYPES_MAP[extension];

    return mimeType || 'application/octet-stream';
  }

  private loadDocumentoFromNavigation(): void {
    const documento = history.state?.documento;

    if (!documento) {
      return;
    }

    this.isEditing = true;
    this.editingDocumentoId = documento.id ?? null;
    this.registerForm.patchValue({
      nombre: documento.nombre ?? documento.name ?? documento.titulo ?? documento.fileName ?? '',
      descripcion: documento.descripcion ?? documento.description ?? '',
    });
  }

  private loadFormContextInfo(): void {
    const user = this.localStorage.getUser();

    this.creadorLabel = this.buildUserDisplayName(user) || 'Usuario no identificado';
    this.fechaOperacionLabel = this.formatNow();
  }

  private buildUserDisplayName(user: any): string {
    if (!user) {
      return '';
    }

    const fullName = `${user?.name ?? ''} ${user?.lastname ?? ''}`.trim();
    return fullName || String(user?.username ?? '').trim();
  }

  private formatNow(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}
