import { LocalStorageService } from './../../../services/local-storage-service';
import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Documento, TipoDocumento, VersionDocumento } from '../../../model/documento';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';
import { User } from '../../../model/user';
import { UsersService } from '../../../services/users-service';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { EstablecimientoService } from '../../../services/establecimiento-service';

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
  public registerDocumentoForm!: FormGroup;
  public registerVersionDocumentoForm!: FormGroup;
  public activeMode: 'documento' | 'version' = 'documento';
  public documentoRequiresApproval: boolean = false;
  public versionRequiresApproval: boolean = false;

  public get registerForm(): FormGroup {
    return this.registerDocumentoForm;
  }
  public isEditing = false;
  public creadorLabel = 'Usuario no identificado';
  public fechaOperacionLabel = '';
  public formatosPermitidos = '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .jpg, .png, .gif, .webp, .mp4, .avi, .mov, .zip, .rar, .7z';
  private editingDocumentoId: number | string | null = null;

  tipo_documento:TipoDocumento [] = [];
  
  users_aprobadores: User [] = [];
  domentos: Documento [] = [];

  documentosByUser: Documento [] = [];

  user: User | null = null;

  codred: string = '';


  constructor(
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private router: Router,
    private tipoDocumentoService: TipoDocumentoService,
    private userService: UsersService,
    private documentoService: DocumentoService,
    private versionDocumentoService: VersionDocumentoService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit(): void {
    this.reactiveForm();
    this.loadDocumentoFromNavigation();
    this.loadFormContextInfo();
    this.getRedCentro();
    this.user = this.localStorage.getUser();
    this.bindFormListeners();
  }

  private bindFormListeners(): void {
    // Cuando cambia el tipo de documento en el formulario de documento
    this.registerDocumentoForm.get('id_tipo_documento')?.valueChanges.subscribe((idTipo: number) => {
      this.updateDocumentoApprovalState(idTipo);
    });

    // Cuando cambia el documento seleccionado en la versión
    this.registerVersionDocumentoForm.get('id_documento')?.valueChanges.subscribe((idDocumento: number) => {
      this.updateVersionApprovalState(idDocumento);
    });
  }


  getRedCentro() {
    const codcas = this.localStorage.getUser()?.codcas;
    if (!codcas) {
      console.error('No se encontró el codcas del usuario en el almacenamiento local');
      return;
    }
    this.establecimientoService.getCentroWithRedByCodcas(codcas).subscribe(
      (response) => {
        this.codred = response?.redasiscod ?? '';
        this.getTiposDocumentos();
        this.getUsersAprobadores();
        this.getDocumentosByUser();
      }
    );
  }


  getTiposDocumentos() {
    this.activeMode = 'documento';
    this.tipoDocumentoService.getTiposDocumentos().subscribe(
      (response) => {
        this.tipo_documento = response;
        // Actualizar estado de aprobación si ya hay un valor seleccionado
        const idTipo = this.registerDocumentoForm.get('id_tipo_documento')?.value;
        if (idTipo) {
          this.updateDocumentoApprovalState(idTipo);
        }
      },
      (error) => {
        console.error('Error al obtener los tipos de documentos', error);
      }
    );
  }

  getUsersAprobadores() {

    if (!this.codred) {
      console.error('No se encontró el codred del usuario en el almacenamiento local');
      return;
    }
    this.userService.getAllUsersByCodred(this.codred).subscribe(
      (response) => {
        this.users_aprobadores = response;
      },
      (error) => {
        console.error('Error al obtener los usuarios aprobadores', error);
      }
    );
   
  }

  getDocumentosByUser() {
    this.activeMode = 'version';
    const user = this.localStorage.getUser();
    if (!user) {
      console.error('No se encontró un usuario en el almacenamiento local');
      return;
    }
    this.documentoService.getDocumentoByUser(user.id).subscribe(
      (response) => {
        this.documentosByUser = response;
        // Si ya hay un documento seleccionado, actualizar el estado
        const idDoc = this.registerVersionDocumentoForm.get('id_documento')?.value;
        if (idDoc) {
          this.updateVersionApprovalState(idDoc);
        }
      },
      (error) => {
        console.error('Error al obtener los documentos del usuario', error);
      }
    );
  }


  reactiveForm() {
    this.registerDocumentoForm = this.formBuilder.group({
      codigo: ['', [Validators.required]],
      titulo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      id_tipo_documento: ['', [Validators.required]],
      id_user_aprobador: [{ value: null, disabled: true }],
      flag: [true, [Validators.required]],
    });
    this.registerVersionDocumentoForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      version: [1, [Validators.required]],
      archivo: [null, [Validators.required]],
      id_documento: ['', [Validators.required]],
      id_user_aprobador: [{ value: null, disabled: true }],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.registerVersionDocumentoForm.patchValue({ archivo: file });
    this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
  }

   registerDocumento() {
    if (this.registerDocumentoForm.invalid) {
      this.registerDocumentoForm.markAllAsTouched();
      return;
    }

    const user = this.localStorage.getUser();

    const documento : Documento = {
      id: 0,
      codigo: this.registerDocumentoForm.get('codigo')?.value ?? '',
      titulo: this.registerDocumentoForm.get('titulo')?.value ?? '',
      descripcion: this.registerDocumentoForm.get('descripcion')?.value ?? '',
      codcas: user?.codcas ?? '',
      codred: user?.codred ?? '',
      date_creation: '',
      date_update: '',
      flag: this.registerDocumentoForm.get('flag')?.value ?? true,
      id_user_creation: user?.id ?? 0,
      id_tipo_documento: this.registerDocumentoForm.get('id_tipo_documento')?.value ?? 0,
    };

    // Si el tipo de documento requiere aprobación adjuntar id_user_aprobador
    const idAprobadorDoc = this.registerDocumentoForm.get('id_user_aprobador')?.value;
    if (idAprobadorDoc) {
      // attach or handle as needed by API — here we assume backend associates approver to versions, not to documento
      // leave as-is or send separately if required
    }
    this.documentoService.saveDocumento(documento).subscribe(
      (response) => {
        console.log('Documento guardado exitosamente', response);
        this.registerDocumentoForm.reset({ flag: true });
        void this.router.navigate(['/report-documentos']);
      },
      (error) => {
        console.error('Error al guardar el documento', error);
      }
    );
    
  }

  registerVersionDocumento() {
    if (this.registerVersionDocumentoForm.invalid) {
      this.registerVersionDocumentoForm.markAllAsTouched();
      return;
    }

    const user = this.localStorage.getUser();
    const usuario = this.buildUserDisplayName(user);
    
    const documentoFormData = new FormData();
    const archivo = this.registerVersionDocumentoForm.get('archivo')?.value as File | null;
    const comentario = this.registerVersionDocumentoForm.get('descripcion')?.value ?? '';
    const version = this.registerVersionDocumentoForm.get('version')?.value ?? 1;
    const idDocumento = this.registerVersionDocumentoForm.get('id_documento')?.value ?? '';

    // Obtener el tipo MIME correcto del archivo
    const tipoArchivoCorrect = archivo ? this.getMimeType(archivo) : '';

    documentoFormData.append('nombre', this.registerVersionDocumentoForm.get('nombre')?.value ?? '');
    documentoFormData.append('descripcion', comentario);
    documentoFormData.append('version', String(version));

   
    // Add file if present
    if (archivo) {
      documentoFormData.append('archivo', archivo);
    }

    documentoFormData.append('id_user_creation',String(user?.id ?? 0));
    documentoFormData.append('id_documento',String(idDocumento));
    console.log(documentoFormData)
    const idAprobador = this.registerVersionDocumentoForm.get('id_user_aprobador')?.value;
    if (idAprobador) {
      documentoFormData.append('id_user_aprobador', String(idAprobador));
    }
    this.versionDocumentoService.saveVersionDocumento(documentoFormData).subscribe(
      (response) => {
        console.log('Versión de documento guardada exitosamente', response);
        this.registerVersionDocumentoForm.reset({ version: 1 });
        void this.router.navigate(['/report-documentos']);
      },
      (error) => {
        console.error('Error al guardar la versión del documento', error);
      }
    );
  }


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
    this.activeMode = 'version';
    this.editingDocumentoId = documento.id ?? null;
    this.registerDocumentoForm.patchValue({
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

  private updateDocumentoApprovalState(idTipo: number | null | undefined): void {
    const tipo = this.tipo_documento.find(t => t.id === Number(idTipo));
    const requires = !!tipo && tipo.requiere_aprobacion === true;
    this.documentoRequiresApproval = requires;

    const control = this.registerDocumentoForm.get('id_user_aprobador');
    if (requires) {
      control?.enable?.();
    } else {
      control?.setValue(null);
      control?.disable?.();
    }
  }

  private updateVersionApprovalState(idDocumento: number | null | undefined): void {
    const documento = this.documentosByUser.find(d => d.id === Number(idDocumento));
    const tipoId = documento?.id_tipo_documento ?? null;
    const tipo = this.tipo_documento.find(t => t.id === Number(tipoId));
    const requires = !!tipo && tipo.requiere_aprobacion === true;
    this.versionRequiresApproval = requires;

    const control = this.registerVersionDocumentoForm.get('id_user_aprobador');
    if (requires) {
      control?.enable?.();
    } else {
      control?.setValue(null);
      control?.disable?.();
    }
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
