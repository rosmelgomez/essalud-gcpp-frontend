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
import { MatChipsModule } from '@angular/material/chips';
import { Documento, TipoDocumento, VersionDocumento, CategoriaDocumento } from '../../../model/documento';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';
import { CategoriaDocumentoService } from '../../../services/documentos/categoria-documento-service';
import { User } from '../../../model/user';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { UsersService } from '../../../services/usuario/users-service';

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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatChipsModule],
  templateUrl: './creacion-documentos.html',
  styleUrl: './creacion-documentos.css',
})
export class CreacionDocumentos implements OnInit {
  public registerTipoDocumentoForm!: FormGroup;
  public registerDocumentoForm!: FormGroup;
  public registerVersionDocumentoForm!: FormGroup;
  public registerCategoriaForm!: FormGroup;
  public activeMode: 'documento' | 'version' | 'tipo' | 'categoria' = 'documento';
  public documentoRequiresApproval: boolean = false;
  public versionRequiresApproval: boolean = false;
  public extensionesChips: string[] = [];
  public categorias: CategoriaDocumento[] = [];

  public get registerForm(): FormGroup {
    return this.registerDocumentoForm;
  }
  public isEditing = false;
  public creadorLabel = 'Usuario no identificado';
  public fechaOperacionLabel = '';
  public formatosPermitidos = '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .jpg, .png, .gif, .webp, .mp4, .avi, .mov, .zip, .rar, .7z';
  private editingDocumentoId: number | string | null = null;

  tipo_documento: TipoDocumento[] = [];

  users_aprobadores: User[] = [];
  domentos: Documento[] = [];

  documentosByUser: Documento[] = [];

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
    private establecimientoService: EstablecimientoService,
    private categoriaService: CategoriaDocumentoService
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
    this.loadCategorias();
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

  loadCategorias() {
    this.categoriaService.getCategorias().subscribe(
      (response) => {
        this.categorias = response;
      },
      (error) => {
        console.error('Error al obtener las categorías', error);
      }
    );
  }

  getCategoriasAndSwitchMode() {
    this.activeMode = 'categoria';
    this.loadCategorias();
  }

  registerCategoria() {
    if (this.registerCategoriaForm.invalid) {
      this.registerCategoriaForm.markAllAsTouched();
      return;
    }
    const category: CategoriaDocumento = {
      nombre: this.registerCategoriaForm.get('nombre')?.value ?? '',
      descripcion: this.registerCategoriaForm.get('descripcion')?.value ?? '',
      flag: true
    };
    this.categoriaService.saveCategoria(category).subscribe(
      () => {
        this.registerCategoriaForm.reset();
        this.loadCategorias();
        this.activeMode = 'documento'; // switch to document creation after creating category
      },
      (error) => {
        console.error('Error al registrar la categoría', error);
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
    this.registerTipoDocumentoForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      requiere_aprobacion: [false, [Validators.required]],
      max_size_mb: [1, [Validators.required, Validators.min(1)]],
      flag: [true, [Validators.required]],
    });

    this.registerCategoriaForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
    });

    this.registerDocumentoForm = this.formBuilder.group({
      codigo: ['', [Validators.required]],
      titulo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      id_tipo_documento: ['', [Validators.required]],
      id_categoria: ['', [Validators.required]],
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

  addExtension(extensionInput: HTMLInputElement): void {
    const extension = extensionInput.value.trim().toLowerCase();

    if (!extension) {
      return;
    }

    // Agregar punto si no lo tiene
    const extensionFormatted = extension.startsWith('.') ? extension : '.' + extension;

    // Evitar duplicados
    if (!this.extensionesChips.includes(extensionFormatted)) {
      this.extensionesChips.push(extensionFormatted);
      extensionInput.value = '';
    }
  }

  removeExtension(extension: string): void {
    this.extensionesChips = this.extensionesChips.filter(ext => ext !== extension);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.registerVersionDocumentoForm.patchValue({ archivo: null });
      this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
      return;
    }

    const idDoc = this.registerVersionDocumentoForm.get('id_documento')?.value;
    if (!idDoc) {
      alert('Por favor, seleccione primero el Documento base para poder validar las restricciones del archivo.');
      input.value = '';
      this.registerVersionDocumentoForm.patchValue({ archivo: null });
      this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
      return;
    }

    const doc = this.documentosByUser.find(d => d.id === Number(idDoc));
    if (doc) {
      // Si tipo_documento no está cargado, cargar todos primero
      const tipo = this.tipo_documento.find(t => t.id === Number(doc.id_tipo_documento));
      if (tipo) {
        // Validar tamaño máximo
        const maxSize = (tipo.max_size_mb || 1) * 1024 * 1024;
        if (file.size > maxSize) {
          alert(`El archivo seleccionado excede el tamaño máximo permitido de ${tipo.max_size_mb} MB.`);
          input.value = '';
          this.registerVersionDocumentoForm.patchValue({ archivo: null });
          this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
          return;
        }

        // Validar extensión
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = tipo.extensiones_permitidas.toLowerCase().split(',').map(e => e.trim());
        if (!allowedExtensions.includes(ext)) {
          alert(`El formato de archivo '${ext}' no está permitido. Formatos válidos: ${tipo.extensiones_permitidas}`);
          input.value = '';
          this.registerVersionDocumentoForm.patchValue({ archivo: null });
          this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
          return;
        }
      }
    }

    this.registerVersionDocumentoForm.patchValue({ archivo: file });
    this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
  }


  registerTipoDocumento() {
    if (this.registerTipoDocumentoForm.invalid || this.extensionesChips.length === 0) {
      this.registerTipoDocumentoForm.markAllAsTouched();
      return;
    }
    const tipoDocumento: TipoDocumento = {
      id: 0,
      nombre: this.registerTipoDocumentoForm.get('nombre')?.value ?? '',
      descripcion: this.registerTipoDocumentoForm.get('descripcion')?.value ?? '',
      extensiones_permitidas: this.extensionesChips.join(', ') ?? '',
      requiere_aprobacion: this.registerTipoDocumentoForm.get('requiere_aprobacion')?.value ?? false,
      max_size_mb: this.registerTipoDocumentoForm.get('max_size_mb')?.value ?? 1,
      flag: this.registerTipoDocumentoForm.get('flag')?.value ?? true,
      date_creation: new Date(),
      date_update: new Date(),
    };
    console.log('Registrando tipo de documento:', tipoDocumento);
    this.tipoDocumentoService.saveTipoDocumento(tipoDocumento).subscribe(
      (response) => {
        console.log('Tipo de documento guardado exitosamente', response);
        this.registerTipoDocumentoForm.reset({ requiere_aprobacion: false, flag: true, max_size_mb: 1 });
        this.extensionesChips = [];
        this.getTiposDocumentos();
      },
      (error) => {
        console.error('Error al guardar el tipo de documento', error);
      }
    );
  }


  registerDocumento() {
    if (this.registerDocumentoForm.invalid) {
      this.registerDocumentoForm.markAllAsTouched();
      return;
    }

    const user = this.localStorage.getUser();

    const documento: Documento = {
      id: 0,
      codigo: this.registerDocumentoForm.get('codigo')?.value ?? '',
      titulo: this.registerDocumentoForm.get('titulo')?.value ?? '',
      descripcion: this.registerDocumentoForm.get('descripcion')?.value ?? '',
      codcas: user?.codcas ?? '',
      codred: user?.codred ?? '',
      publico: this.registerDocumentoForm.get('publico')?.value ?? false,
      date_creation: '',
      date_update: '',
      flag: this.registerDocumentoForm.get('flag')?.value ?? true,
      id_user_creation: user?.id ?? 0,
      id_tipo_documento: this.registerDocumentoForm.get('id_tipo_documento')?.value ?? 0,
      id_categoria: this.registerDocumentoForm.get('id_categoria')?.value ?? 0,
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

    const documentoFormData = new FormData();
    const archivo = this.registerVersionDocumentoForm.get('archivo')?.value as File | null;
    const comentario = this.registerVersionDocumentoForm.get('descripcion')?.value ?? '';
    const version = this.registerVersionDocumentoForm.get('version')?.value ?? 1;
    const idDocumento = this.registerVersionDocumentoForm.get('id_documento')?.value ?? '';


    documentoFormData.append('nombre', this.registerVersionDocumentoForm.get('nombre')?.value ?? '');
    documentoFormData.append('descripcion', comentario);
    documentoFormData.append('version', String(version));


    // Add file if present
    if (archivo) {
      documentoFormData.append('archivo', archivo);
    }

    documentoFormData.append('id_user_creation', String(user?.id ?? 0));
    documentoFormData.append('id_documento', String(idDocumento));
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
