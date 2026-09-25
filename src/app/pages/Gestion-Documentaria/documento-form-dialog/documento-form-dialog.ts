import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CatalogoExtension, Documento, TipoDocumento } from '../../../model/documento';
import { User } from '../../../model/user';
import { LocalStorageService } from '../../../services/local-storage-service';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';
import { CatalogoExtensionService } from '../../../services/documentos/catalogo-extension-service';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { UsersService } from '../../../services/usuario/users-service';

export type DocumentoFormMode = 'documento' | 'version' | 'tipo';

/**
 * Formulario flotante de registro de Gestión Documentaria.
 * Reemplaza la antigua página /documento/creacion: tipo de documento (ADMIN), documento y versión.
 */
@Component({
  selector: 'app-documento-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './documento-form-dialog.html',
  styleUrl: './documento-form-dialog.css',
})
export class DocumentoFormDialog implements OnInit {
  /** Pestaña con la que se abre el diálogo. */
  @Input() mode: DocumentoFormMode = 'documento';
  /** Documento preseleccionado al abrir en modo versión. */
  @Input() documentoId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ kind: DocumentoFormMode; message: string }>();

  registerTipoDocumentoForm!: FormGroup;
  registerDocumentoForm!: FormGroup;
  registerVersionDocumentoForm!: FormGroup;

  versionRequiresApproval = false;
  docTypeRequiresApproval = true;
  isDocumentoPublico = false;
  extensionesCatalogo: CatalogoExtension[] = [];
  idExtensionesSeleccionadas: number[] = [];
  tipoSubmitted = false;

  tipo_documento: TipoDocumento[] = [];
  users_aprobadores: User[] = [];
  documentosByUser: Documento[] = [];
  user: User | null = null;
  codred = '';

  creadorLabel = 'Usuario no identificado';
  fechaOperacionLabel = '';
  formatosPermitidos = '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .jpg, .png, .gif, .webp, .mp4, .avi, .mov, .zip, .rar, .7z';

  selectedFile: File | null = null;
  fileError = '';
  isDragging = false;
  isSaving = false;
  saveError = '';

  constructor(
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private tipoDocumentoService: TipoDocumentoService,
    private userService: UsersService,
    private documentoService: DocumentoService,
    private versionDocumentoService: VersionDocumentoService,
    private establecimientoService: EstablecimientoService,
    private catalogoExtensionService: CatalogoExtensionService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.user = this.localStorage.getUser();
    if (this.mode === 'tipo' && !this.isAdmin) {
      this.mode = 'documento';
    }
    this.reactiveForm();
    this.bindFormListeners();
    this.loadFormContextInfo();
    this.loadTiposDocumentos();
    this.loadCatalogoExtensiones();
    this.getRedCentro();
    if (this.documentoId) {
      this.registerVersionDocumentoForm.patchValue({ id_documento: this.documentoId });
    }
  }

  get isAdmin(): boolean {
    const roles = this.user?.roles as unknown;
    return Array.isArray(roles) ? roles.includes('ADMIN') : roles === 'ADMIN';
  }

  // ---------- Interacción del diálogo ----------

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    if (!this.isSaving) {
      this.closed.emit();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  setMode(mode: DocumentoFormMode): void {
    if (mode === 'tipo' && !this.isAdmin) return;
    this.mode = mode;
    this.saveError = '';
    if (mode === 'version') {
      this.getDocumentosByUser();
    }
  }

  get submitLabel(): string {
    if (this.isSaving) return 'Guardando…';
    return this.mode === 'tipo' ? 'Guardar tipo' : this.mode === 'version' ? 'Subir versión' : 'Crear documento';
  }

  get activeFormId(): string {
    return `form-${this.mode}`;
  }

  invalid(form: FormGroup, name: string): boolean {
    const c = form.get(name);
    return !!c && c.touched && c.invalid;
  }

  // ---------- Carga de datos ----------

  private getRedCentro(): void {
    const codcas = this.user?.codcas;
    if (!codcas) {
      console.error('No se encontró el codcas del usuario en el almacenamiento local');
      this.getDocumentosByUser();
      return;
    }
    this.establecimientoService.getCentroWithRedByCodcas(codcas).subscribe((response) => {
      this.codred = response?.redasiscod ?? '';
      this.getUsersAprobadores();
      this.getDocumentosByUser();
      this.cdr.detectChanges();
    });
  }

  private loadTiposDocumentos(): void {
    this.tipoDocumentoService.getTiposDocumentos().subscribe(
      (response) => {
        this.tipo_documento = response || [];
        const idTipo = this.registerDocumentoForm.get('id_tipo_documento')?.value;
        if (idTipo) this.updateDocumentoPublicoState(idTipo);
        const idDoc = this.registerVersionDocumentoForm.get('id_documento')?.value;
        if (idDoc) this.updateVersionApprovalState(idDoc);
        this.cdr.detectChanges();
      },
      (error) => console.error('Error al obtener los tipos de documentos', error),
    );
  }

  private getUsersAprobadores(): void {
    this.userService.getUsersByCodred(this.codred).subscribe(
      (response) => {
        this.users_aprobadores = response || [];
        this.cdr.detectChanges();
      },
      (error) => console.error('Error al obtener los usuarios aprobadores', error),
    );
  }

  private getDocumentosByUser(): void {
    if (!this.user) return;
    this.documentoService.getDocumentoByUser(this.user.id).subscribe(
      (response) => {
        this.documentosByUser = response || [];
        const idDoc = this.registerVersionDocumentoForm.get('id_documento')?.value;
        if (idDoc) this.updateVersionApprovalState(idDoc);
        this.cdr.detectChanges();
      },
      (error) => console.error('Error al obtener los documentos del usuario', error),
    );
  }

  private loadCatalogoExtensiones(): void {
    this.catalogoExtensionService.getall().subscribe(
      (response) => {
        this.extensionesCatalogo = response || [];
        this.cdr.detectChanges();
      },
      (error) => console.error('Error al cargar el catálogo de extensiones:', error),
    );
  }

  // ---------- Formularios ----------

  private reactiveForm(): void {
    this.registerTipoDocumentoForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      requiere_aprobacion: [false, [Validators.required]],
      max_size_mb: [1, [Validators.required, Validators.min(1)]],
      flag: [true, [Validators.required]],
    });

    this.registerDocumentoForm = this.formBuilder.group({
      codigo: ['', [Validators.required]],
      titulo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      id_tipo_documento: ['', [Validators.required]],
      flag: [true, [Validators.required]],
      publico: [false, [Validators.required]],
      solo_mi_red: [false, [Validators.required]],
    });

    this.registerVersionDocumentoForm = this.formBuilder.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      version: [1, [Validators.required]],
      archivo: [null, [Validators.required]],
      id_documento: ['', [Validators.required]],
      id_user_aprobador: [{ value: null, disabled: true }],
      visible: [true],
      prioridad: [{ value: 'MEDIA', disabled: true }, [Validators.required]],
      comentarioSolicitud: [{ value: '', disabled: true }],
    });
  }

  private bindFormListeners(): void {
    this.registerVersionDocumentoForm.get('id_documento')?.valueChanges.subscribe((id: number) => {
      this.updateVersionApprovalState(id);
      // El archivo elegido se valida contra el tipo del documento: al cambiar de documento se revalida.
      if (this.selectedFile) this.validateAndSetFile(this.selectedFile);
    });

    this.registerDocumentoForm.get('publico')?.valueChanges.subscribe((isPublic: boolean) => {
      if (!isPublic) this.registerDocumentoForm.patchValue({ solo_mi_red: false });
      this.cdr.detectChanges();
    });

    this.registerDocumentoForm.get('id_tipo_documento')?.valueChanges.subscribe((idTipo: number) => {
      this.updateDocumentoPublicoState(idTipo);
    });
  }

  setPublico(value: boolean): void {
    const ctrl = this.registerDocumentoForm.get('publico');
    if (ctrl?.disabled) return;
    ctrl?.setValue(value);
  }

  setSoloMiRed(value: boolean): void {
    this.registerDocumentoForm.get('solo_mi_red')?.setValue(value);
    this.cdr.detectChanges();
  }

  toggleExtension(id: number): void {
    const index = this.idExtensionesSeleccionadas.indexOf(id);
    if (index > -1) this.idExtensionesSeleccionadas.splice(index, 1);
    else this.idExtensionesSeleccionadas.push(id);
    this.cdr.detectChanges();
  }

  isExtensionSelected(id: number): boolean {
    return this.idExtensionesSeleccionadas.includes(id);
  }

  /** Tipo del documento elegido en el formulario de versión (define tamaño y formatos). */
  get versionTipo(): TipoDocumento | undefined {
    const idDoc = this.registerVersionDocumentoForm?.get('id_documento')?.value;
    const doc = this.documentosByUser.find((d) => d.id === Number(idDoc));
    return doc ? this.tipo_documento.find((t) => t.id === Number(doc.id_tipo_documento)) : undefined;
  }

  get acceptAttr(): string {
    return this.versionTipo?.extensiones_permitidas || this.formatosPermitidos;
  }

  // ---------- Archivo ----------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validateAndSetFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    this.validateAndSetFile(event.dataTransfer?.files?.[0] ?? null);
  }

  clearFile(): void {
    this.selectedFile = null;
    this.fileError = '';
    this.registerVersionDocumentoForm.patchValue({ archivo: null });
  }

  private validateAndSetFile(file: File | null): void {
    this.fileError = '';
    const ctrl = this.registerVersionDocumentoForm.get('archivo');
    ctrl?.markAsTouched();

    if (!file) {
      this.selectedFile = null;
      ctrl?.setValue(null);
      return;
    }

    const idDoc = this.registerVersionDocumentoForm.get('id_documento')?.value;
    if (!idDoc) {
      this.fileError = 'Primero selecciona el documento base para validar el archivo.';
      this.selectedFile = null;
      ctrl?.setValue(null);
      return;
    }

    const tipo = this.versionTipo;
    if (tipo) {
      const maxSize = (tipo.max_size_mb || 1) * 1024 * 1024;
      if (file.size > maxSize) {
        this.fileError = `El archivo pesa ${this.formatSize(file.size)} y supera el máximo de ${tipo.max_size_mb} MB.`;
        this.selectedFile = null;
        ctrl?.setValue(null);
        return;
      }
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
      const allowed = (tipo.extensiones_permitidas || '').toLowerCase().split(',').map((e) => e.trim()).filter(Boolean);
      if (allowed.length && !allowed.includes(ext)) {
        this.fileError = `El formato ${ext} no está permitido. Formatos válidos: ${tipo.extensiones_permitidas}.`;
        this.selectedFile = null;
        ctrl?.setValue(null);
        return;
      }
    }

    this.selectedFile = file;
    ctrl?.setValue(file);
    // Sugerir el nombre del archivo si el campo está vacío
    const nombreCtrl = this.registerVersionDocumentoForm.get('nombre');
    if (!nombreCtrl?.value) {
      nombreCtrl?.setValue(file.name.replace(/\.[^.]+$/, ''));
    }
    this.cdr.detectChanges();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ---------- Envío ----------

  submit(): void {
    this.saveError = '';
    if (this.mode === 'tipo') this.registerTipoDocumento();
    else if (this.mode === 'documento') this.registerDocumento();
    else this.registerVersionDocumento();
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.isSaving = false;
    const detail = (error as any)?.error;
    this.saveError = typeof detail === 'string' && detail.length < 200 ? `${message}: ${detail}` : `${message}. Inténtalo de nuevo.`;
    this.cdr.detectChanges();
  }

  private registerTipoDocumento(): void {
    this.tipoSubmitted = true;
    if (this.registerTipoDocumentoForm.invalid || this.idExtensionesSeleccionadas.length === 0) {
      this.registerTipoDocumentoForm.markAllAsTouched();
      return;
    }
    const tipoDocumento: TipoDocumento = {
      id: 0,
      nombre: this.registerTipoDocumentoForm.get('nombre')?.value ?? '',
      descripcion: this.registerTipoDocumentoForm.get('descripcion')?.value ?? '',
      extensiones_permitidas: '',
      id_extensiones: this.idExtensionesSeleccionadas,
      requiere_aprobacion: this.registerTipoDocumentoForm.get('requiere_aprobacion')?.value ?? false,
      max_size_mb: this.registerTipoDocumentoForm.get('max_size_mb')?.value ?? 1,
      flag: this.registerTipoDocumentoForm.get('flag')?.value ?? true,
      date_creation: new Date(),
      date_update: new Date(),
    };
    this.isSaving = true;
    this.tipoDocumentoService.saveTipoDocumento(tipoDocumento).subscribe(
      () => {
        this.isSaving = false;
        this.saved.emit({ kind: 'tipo', message: `Tipo de documento "${tipoDocumento.nombre}" creado` });
      },
      (error) => this.handleError('No se pudo guardar el tipo de documento', error),
    );
  }

  private registerDocumento(): void {
    if (this.registerDocumentoForm.invalid) {
      this.registerDocumentoForm.markAllAsTouched();
      return;
    }
    const isPublic = this.registerDocumentoForm.get('publico')?.value ?? false;
    const documento: Documento = {
      id: 0,
      codigo: this.registerDocumentoForm.get('codigo')?.value ?? '',
      titulo: this.registerDocumentoForm.get('titulo')?.value ?? '',
      descripcion: this.registerDocumentoForm.get('descripcion')?.value ?? '',
      codcas: this.user?.codcas ?? '',
      codred: this.codred ?? '',
      publico: isPublic,
      solo_mi_red: isPublic ? (this.registerDocumentoForm.get('solo_mi_red')?.value ?? false) : false,
      date_creation: '',
      date_update: '',
      date_delete: '',
      flag: this.registerDocumentoForm.get('flag')?.value ?? true,
      id_user_creation: this.user?.id ?? 0,
      id_tipo_documento: this.registerDocumentoForm.get('id_tipo_documento')?.value ?? 0,
    };
    this.isSaving = true;
    this.documentoService.saveDocumento(documento).subscribe(
      () => {
        this.isSaving = false;
        this.saved.emit({ kind: 'documento', message: `Documento ${documento.codigo} creado. Ahora puedes subir su primera versión.` });
      },
      (error) => this.handleError('No se pudo guardar el documento', error),
    );
  }

  private registerVersionDocumento(): void {
    if (this.registerVersionDocumentoForm.invalid) {
      this.registerVersionDocumentoForm.markAllAsTouched();
      return;
    }
    const f = this.registerVersionDocumentoForm;
    const data = new FormData();
    const archivo = f.get('archivo')?.value as File | null;
    data.append('nombre', f.get('nombre')?.value ?? '');
    data.append('descripcion', f.get('descripcion')?.value ?? '');
    data.append('version', String(f.get('version')?.value ?? 1));
    data.append('visible', String(f.get('visible')?.value ?? false));
    if (archivo) data.append('archivo', archivo);
    data.append('id_user_creation', String(this.user?.id ?? 0));
    data.append('id_documento', String(f.get('id_documento')?.value ?? ''));
    const idAprobador = f.get('id_user_aprobador')?.value;
    if (idAprobador) data.append('id_user_aprobador', String(idAprobador));
    const prioridad = f.get('prioridad')?.value;
    if (prioridad) data.append('prioridad', prioridad);
    const comentarioSolicitud = f.get('comentarioSolicitud')?.value;
    if (comentarioSolicitud) data.append('comentarioSolicitud', comentarioSolicitud);

    this.isSaving = true;
    this.versionDocumentoService.saveVersionDocumento(data).subscribe(
      () => {
        this.isSaving = false;
        this.saved.emit({ kind: 'version', message: `Versión ${f.get('version')?.value ?? ''} subida correctamente` });
      },
      (error) => this.handleError('No se pudo subir la versión', error),
    );
  }

  // ---------- Reglas de negocio (idénticas a la página original) ----------

  private loadFormContextInfo(): void {
    const fullName = `${this.user?.name ?? ''} ${this.user?.lastname ?? ''}`.trim();
    this.creadorLabel = fullName || String(this.user?.username ?? '').trim() || 'Usuario no identificado';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    this.fechaOperacionLabel = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  private updateVersionApprovalState(idDocumento: number | null | undefined): void {
    const documento = this.documentosByUser.find((d) => d.id === Number(idDocumento));
    const tipo = this.tipo_documento.find((t) => t.id === Number(documento?.id_tipo_documento ?? null));
    const requires = !!tipo && tipo.requiere_aprobacion === true;
    this.versionRequiresApproval = requires;

    const f = this.registerVersionDocumentoForm;
    const aprobador = f.get('id_user_aprobador');
    const prioridad = f.get('prioridad');
    const comentario = f.get('comentarioSolicitud');
    if (requires) {
      aprobador?.enable();
      prioridad?.enable();
      comentario?.enable();
    } else {
      aprobador?.setValue(null);
      aprobador?.disable();
      prioridad?.setValue('MEDIA');
      prioridad?.disable();
      comentario?.setValue('');
      comentario?.disable();
    }

    this.isDocumentoPublico = documento ? documento.publico === true : false;
    const visible = f.get('visible');
    if (this.isDocumentoPublico) {
      visible?.enable();
      visible?.setValue(true);
    } else {
      visible?.setValue(false);
      visible?.disable();
    }
    this.cdr.detectChanges();
  }

  private updateDocumentoPublicoState(idTipo: number | string | null | undefined): void {
    const publicoCtrl = this.registerDocumentoForm.get('publico');
    if (idTipo === undefined || idTipo === null || idTipo === '') {
      publicoCtrl?.enable();
      return;
    }
    const tipo = this.tipo_documento.find((t) => t.id === Number(idTipo));
    this.docTypeRequiresApproval = tipo ? tipo.requiere_aprobacion === true : true;
    if (!this.docTypeRequiresApproval) {
      publicoCtrl?.setValue(false);
      publicoCtrl?.disable();
      this.registerDocumentoForm.patchValue({ solo_mi_red: false });
    } else {
      publicoCtrl?.enable();
    }
    this.cdr.detectChanges();
  }
}
