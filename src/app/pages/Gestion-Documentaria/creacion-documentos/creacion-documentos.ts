import { LocalStorageService } from './../../../services/local-storage-service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Documento, TipoDocumento, VersionDocumento, CatalogoExtension } from '../../../model/documento';
import { TipoDocumentoService } from '../../../services/documentos/tipo-documento-service';
import { CatalogoExtensionService } from '../../../services/documentos/catalogo-extension-service';
import { User } from '../../../model/user';
import { DocumentoService } from '../../../services/documentos/documento-service';
import { VersionDocumentoService } from '../../../services/documentos/version-documento-service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { UsersService } from '../../../services/usuario/users-service';

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
  public activeMode: 'documento' | 'version' | 'tipo' = 'documento';
  public versionRequiresApproval: boolean = false;
  public docTypeRequiresApproval: boolean = true;
  public isDocumentoPublico: boolean = false;
  public extensionesChips: string[] = [];
  public extensionesCatalogo: CatalogoExtension[] = [];
  public idExtensionesSeleccionadas: number[] = [];

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
  redes: any[] = [];

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
    private catalogoExtensionService: CatalogoExtensionService,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.localStorage.getUser();
    this.getRedCentro();
  }

  ngOnInit(): void {
    this.reactiveForm();
    this.loadDocumentoFromNavigation();
    this.loadFormContextInfo();
    this.bindFormListeners();
    this.loadRedes();
    this.loadCatalogoExtensiones();
  }

  private bindFormListeners(): void {
    // Cuando cambia el documento seleccionado en la versión
    this.registerVersionDocumentoForm.get('id_documento')?.valueChanges.subscribe((idDocumento: number) => {
      this.updateVersionApprovalState(idDocumento);
    });

    // Cuando cambia la visibilidad del documento
    this.registerDocumentoForm.get('publico')?.valueChanges.subscribe((isPublic: boolean) => {
      if (!isPublic) {
        this.registerDocumentoForm.patchValue({
          solo_mi_red: false
        });
      }
      this.cdr.detectChanges();
    });

    // Cuando cambia el tipo de documento
    this.registerDocumentoForm.get('id_tipo_documento')?.valueChanges.subscribe((idTipo: number) => {
      this.updateDocumentoPublicoState(idTipo);
    });
  }

  setSoloMiRed(val: boolean): void {
    this.registerDocumentoForm.get('solo_mi_red')?.setValue(val);
    this.cdr.detectChanges();
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


  getRedCentro() {
    const codcas = this.localStorage.getUser()?.codcas;
    if (!codcas) {
      console.error('No se encontró el codcas del usuario en el almacenamiento local');
      return;
    }
    this.establecimientoService.getCentroWithRedByCodcas(codcas).subscribe(
      (response) => {
        console.log(response);
        this.codred = response?.redasiscod ?? '';
        console.log(this.codred);
        this.getTiposDocumentos();
        this.getUsersAprobadores();
        this.getDocumentosByUser();
        this.cdr.detectChanges();
      }
    );
  }

  getTiposDocumentos() {
    this.activeMode = 'documento';
    this.tipoDocumentoService.getTiposDocumentos().subscribe(
      (response) => {
        this.tipo_documento = response;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al obtener los tipos de documentos', error);
      }
    );
  }

  getUsersAprobadores() {
    const codcas = this.localStorage.getUser()?.codcas;

    if (!codcas) {
      console.error('No se encontró el codcas del usuario en el almacenamiento local');
      return;
    }


    this.userService.getUsersByCodred(this.codred).subscribe(
      (response) => {
        this.users_aprobadores = response;
        console.log("users-aprobadores " + this.users_aprobadores[0].id);
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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

  loadCatalogoExtensiones(): void {
    this.catalogoExtensionService.getall().subscribe(
      (response) => {
        this.extensionesCatalogo = response || [];
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error al cargar el catálogo de extensiones:', error);
      }
    );
  }

  toggleExtension(id: number): void {
    const index = this.idExtensionesSeleccionadas.indexOf(id);
    if (index > -1) {
      this.idExtensionesSeleccionadas.splice(index, 1);
    } else {
      this.idExtensionesSeleccionadas.push(id);
    }
    this.cdr.detectChanges();
  }

  isExtensionSelected(id: number): boolean {
    return this.idExtensionesSeleccionadas.includes(id);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.registerVersionDocumentoForm.patchValue({ archivo: null });
      this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
      this.cdr.detectChanges();
      return;
    }

    const idDoc = this.registerVersionDocumentoForm.get('id_documento')?.value;
    if (!idDoc) {
      alert('Por favor, seleccione primero el Documento base para poder validar las restricciones del archivo.');
      input.value = '';
      this.registerVersionDocumentoForm.patchValue({ archivo: null });
      this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
      this.cdr.detectChanges();
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
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
          return;
        }
      }
    }

    this.registerVersionDocumentoForm.patchValue({ archivo: file });
    this.registerVersionDocumentoForm.get('archivo')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }


  registerTipoDocumento() {
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
    console.log('Registrando tipo de documento:', tipoDocumento);
    this.tipoDocumentoService.saveTipoDocumento(tipoDocumento).subscribe(
      (response) => {
        console.log('Tipo de documento guardado exitosamente', response);
        this.registerTipoDocumentoForm.reset({ requiere_aprobacion: false, flag: true, max_size_mb: 1 });
        this.idExtensionesSeleccionadas = [];
        this.getTiposDocumentos();
        this.cdr.detectChanges();
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
    const isPublic = this.registerDocumentoForm.get('publico')?.value ?? false;

    const documento: Documento = {
      id: Number(this.editingDocumentoId ?? 0),
      codigo: this.registerDocumentoForm.get('codigo')?.value ?? '',
      titulo: this.registerDocumentoForm.get('titulo')?.value ?? '',
      descripcion: this.registerDocumentoForm.get('descripcion')?.value ?? '',
      codcas: user?.codcas ?? '',
      codred: this.codred ?? '',
      publico: isPublic,
      solo_mi_red: isPublic ? (this.registerDocumentoForm.get('solo_mi_red')?.value ?? false) : false,
      date_creation: '',
      date_update: '',
      date_delete: '',
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
        this.cdr.detectChanges();
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

    const isVisible = this.registerVersionDocumentoForm.get('visible')?.value ?? false;
    documentoFormData.append('visible', String(isVisible));


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
    const prioridad = this.registerVersionDocumentoForm.get('prioridad')?.value;
    if (prioridad) {
      documentoFormData.append('prioridad', prioridad);
    }
    const comentarioSolicitud = this.registerVersionDocumentoForm.get('comentarioSolicitud')?.value;
    if (comentarioSolicitud) {
      documentoFormData.append('comentarioSolicitud', comentarioSolicitud);
    }
    this.versionDocumentoService.saveVersionDocumento(documentoFormData).subscribe(
      (response) => {
        console.log('Versión de documento guardada exitosamente', response);
        this.registerVersionDocumentoForm.reset({ version: 1 });
        this.cdr.detectChanges();
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
    this.activeMode = 'documento';
    this.editingDocumentoId = documento.id ?? null;

    this.registerDocumentoForm.patchValue({
      codigo: documento.codigo ?? '',
      titulo: documento.titulo ?? '',
      descripcion: documento.descripcion ?? '',
      id_tipo_documento: documento.id_tipo_documento ?? '',
      flag: documento.flag ?? true,
      publico: documento.publico ?? false,
      solo_mi_red: documento.solo_mi_red ?? false,
    });
    this.updateDocumentoPublicoState(documento.id_tipo_documento);
    this.cdr.detectChanges();
  }

  private loadFormContextInfo(): void {
    const user = this.localStorage.getUser();

    this.creadorLabel = this.buildUserDisplayName(user) || 'Usuario no identificado';
    this.fechaOperacionLabel = this.formatNow();
    this.cdr.detectChanges();
  }

  private buildUserDisplayName(user: any): string {
    if (!user) {
      return '';
    }

    const fullName = `${user?.name ?? ''} ${user?.lastname ?? ''}`.trim();
    return fullName || String(user?.username ?? '').trim();
  }

  private updateVersionApprovalState(idDocumento: number | null | undefined): void {
    const documento = this.documentosByUser.find(d => d.id === Number(idDocumento));
    const tipoId = documento?.id_tipo_documento ?? null;
    const tipo = this.tipo_documento.find(t => t.id === Number(tipoId));
    const requires = !!tipo && tipo.requiere_aprobacion === true;
    this.versionRequiresApproval = requires;

    const control = this.registerVersionDocumentoForm.get('id_user_aprobador');
    const prioridadCtrl = this.registerVersionDocumentoForm.get('prioridad');
    const comentarioCtrl = this.registerVersionDocumentoForm.get('comentarioSolicitud');
    if (requires) {
      control?.enable?.();
      prioridadCtrl?.enable?.();
      comentarioCtrl?.enable?.();
    } else {
      control?.setValue(null);
      control?.disable?.();
      prioridadCtrl?.setValue('MEDIA');
      prioridadCtrl?.disable?.();
      comentarioCtrl?.setValue('');
      comentarioCtrl?.disable?.();
    }

    this.isDocumentoPublico = documento ? documento.publico === true : false;
    const visibleControl = this.registerVersionDocumentoForm.get('visible');
    if (this.isDocumentoPublico) {
      visibleControl?.enable?.();
      visibleControl?.setValue(true);
    } else {
      visibleControl?.setValue(false);
      visibleControl?.disable?.();
    }

    this.cdr.detectChanges();
  }

  private updateDocumentoPublicoState(idTipo: number | string | null | undefined): void {
    if (idTipo === undefined || idTipo === null || idTipo === '') {
      this.registerDocumentoForm.get('publico')?.enable();
      return;
    }
    const tipo = this.tipo_documento.find(t => t.id === Number(idTipo));
    const requiresApproval = tipo ? tipo.requiere_aprobacion === true : true;
    this.docTypeRequiresApproval = requiresApproval;

    const publicoCtrl = this.registerDocumentoForm.get('publico');
    if (!requiresApproval) {
      publicoCtrl?.setValue(false);
      publicoCtrl?.disable();
      this.registerDocumentoForm.patchValue({
        solo_mi_red: false
      });
    } else {
      publicoCtrl?.enable();
    }
    this.cdr.detectChanges();
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
