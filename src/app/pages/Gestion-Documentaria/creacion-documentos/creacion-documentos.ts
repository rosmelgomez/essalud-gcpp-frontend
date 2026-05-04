import { LocalStorageService } from './../../../services/local-storage-service';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FileService } from '../../../services/file-service';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-creacion-documentos',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, MatButtonModule,],
  templateUrl: './creacion-documentos.html',
  styleUrl: './creacion-documentos.css',
})
export class CreacionDocumentos implements OnInit {
  public registerForm!: FormGroup;

  documentos: any[] = [];
  loading = false;
  errorMessage = '';

  filters: { [key: string]: string } = {
    nombre: '',
    descripcion: '',
    archivo: '',
    usuario_creation: '',
    date_creation: '',
  };

  previewVisible = false;
  previewName = '';
  previewUrl = '';
  previewSafeUrl: SafeResourceUrl | null = null;


  constructor(
    private formBuilder: FormBuilder,
    private fileService: FileService,
    private localStorage: LocalStorageService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.reactiveForm();
    this.loadDocumentos();
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

    const usuario =user?.name + ' ' + user?.lastname;

    const documentoFormData = new FormData();
    documentoFormData.append('id', '');
    documentoFormData.append('nombre', this.registerForm.get('nombre')?.value ?? '');
    documentoFormData.append('descripcion', this.registerForm.get('descripcion')?.value ?? '');
    documentoFormData.append('date_creation', '');
    documentoFormData.append('date_update', '');
    documentoFormData.append('usuario_creation', usuario);
    documentoFormData.append('usuario_update', usuario);

    const archivo = this.registerForm.get('archivo')?.value as File | null;
    if (archivo) {
      documentoFormData.append('archivo', archivo);
    }

    this.fileService.insertfile(documentoFormData).subscribe(
      (response) => {
        console.log('Archivo subido exitosamente', response);
        this.registerForm.reset();
        this.loadDocumentos();
      },
      (error) => {
        console.error('Error al subir el archivo', error);
      }
    );
  }

  loadDocumentos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.fileService.getFiles().subscribe({
      next: (response: any) => {
        const raw = Array.isArray(response) ? response : response?.data ?? response?.documentos ?? response?.items ?? response?.result ?? [];
        this.documentos = raw.map((d: any) => ({
          ...d,
          nombre: d?.nombre ?? d?.name ?? d?.titulo ?? d?.fileName ?? d?.archivo ?? '',
          descripcion: d?.descripcion ?? d?.description ?? '',
          archivo: d?.archivo ?? d?.fileName ?? d?.nameFile ?? d?.nombreArchivo ?? d?.rutaArchivo ?? '',
          date_creation: d?.date_creation ?? d?.createdAt ?? '',
          usuario_creation: d?.usuario_creation ?? d?.creator ?? '',
          id: d?.id ?? d?.pk ?? ''
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los documentos', error);
        this.documentos = [];
        this.loading = false;
        this.errorMessage = 'No se pudo cargar los documentos.';
      }
    });
  }

  filteredDocumentos(): any[] {
    return this.documentos.filter(doc => {
      return (!this.filters['nombre'] || String(doc['nombre']).toLowerCase().includes(this.filters['nombre'].toLowerCase()))
        && (!this.filters['descripcion'] || String(doc['descripcion']).toLowerCase().includes(this.filters['descripcion'].toLowerCase()))
        && (!this.filters['archivo'] || String(doc['archivo']).toLowerCase().includes(this.filters['archivo'].toLowerCase()))
        && (!this.filters['usuario_creation'] || String(doc['usuario_creation']).toLowerCase().includes(this.filters['usuario_creation'].toLowerCase()))
        && (!this.filters['date_creation'] || String(doc['date_creation']).toLowerCase().includes(this.filters['date_creation'].toLowerCase()));
    });
  }

  onFilterChange(key: string, value: string): void {
    this.filters[key] = value ?? '';
  }

  openArchivo(documento: any): void {
    const archivo = documento.archivo ?? documento.nombre ?? '';
    if (!archivo) {
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
      }
    });
  }

  getArchivoById(id: number | string): void {
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

  private clearPreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = '';
    this.previewSafeUrl = null;
  }

  editarDocumento(documento: any): void {
    // Implementar navegación o prefilling del formulario para edición
    console.log('Editar documento', documento);
  }

  eliminarDocumento(documento: any): void {
    if (!documento.id) {
      this.errorMessage = 'No se puede eliminar este documento.';
      return;
    }

    this.fileService.deleteArchivo(documento.id).subscribe({
      next: () => {
        this.documentos = this.documentos.filter(d => d.id !== documento.id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar el documento', error);
        this.errorMessage = 'No se pudo eliminar el documento.';
      }
    });
  }
}
