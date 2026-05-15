import { EstablecimientoService } from '../../../services/establecimiento-service';
import { SolicitudAccesoService } from '../../../services/solicitud-acceso-service';
import { Component, ElementRef, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../model/user';
import { SolicitudAcceso as SolicitudAccesoPayload } from '../../../model/SolicitudAcceso';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../../services/usuario/users-service';


@Component({
  selector: 'app-solicitud-acceso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './solicitud-acceso-registro.html',
  styleUrl: './solicitud-acceso-registro.css',
})
export class SolicitudAccesoRegistro implements OnInit {
  readonly TIPO_CABEZA_RED = 'HEAD_NETWORK';
  readonly TIPO_USUARIO_CENTRO = 'CENTER_USER';
  currentBlock: 1 | 2 = 1;


  private _snackBar = inject(MatSnackBar);
  public registerForm!: FormGroup;

  @ViewChildren('redOption') redOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('centroOption') centroOptions!: QueryList<ElementRef<HTMLElement>>;

  ///Usuario
  user: User | null = null;

  /// Datos para el dropdown de Red Asistencial
  dataRed: any[] = [];
  filteredRed: any = [];

  searchRed: string = '';
  isDropdownRedOpen: boolean = false;
  selectedRedName: string = '';
  isRedEnabled: boolean = false;
  activeRedIndex: number = -1;

  ///Datos para el dropdown de Centro Asistencial
  dataCentro: any[] = [];
  dataCentroCompleto: any[] = [];
  filteredCentro: any = [];

  searchCentro: string = '';
  isDropdownCentroOpen: boolean = false;
  selectedCentroName: string = '';
  isCentroEnabled: boolean = false;
  activeCentroIndex: number = -1;

  constructor(
    private solicitudAccesoService: SolicitudAccesoService,
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private establecimientoService: EstablecimientoService,
  ) { }

  ngOnInit(): void {
    this.reactiveForm();
    this.setupTipoTrabajadorBehavior();
    this.getRed();
    this.getCentroWithRed();
  }

  reactiveForm() {
    this.registerForm = this.formBuilder.group({
      tipoTrabajador: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required]],
      apellidoPaterno: ['', [Validators.required]],
      apellidoMaterno: ['', [Validators.required]],
      code_red: [''],
      codcas: [''],
      email: ['', [Validators.required, Validators.email]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  get isHeadNetwork(): boolean {
    return this.registerForm?.get('tipoTrabajador')?.value === this.TIPO_CABEZA_RED;
  }

  get isCenterUser(): boolean {
    return this.registerForm?.get('tipoTrabajador')?.value === this.TIPO_USUARIO_CENTRO;
  }

  get canOpenSecondBlock(): boolean {
    return !!this.registerForm?.get('tipoTrabajador')?.value;
  }

  irBloqueSiguiente() {
    if (!this.canOpenSecondBlock) {
      return;
    }
    this.currentBlock = 2;
  }

  irBloqueAnterior() {
    this.currentBlock = 1;
  }

  private setupTipoTrabajadorBehavior() {
    this.registerForm.get('tipoTrabajador')?.valueChanges.subscribe((tipo) => {
      if (!tipo && this.currentBlock === 2) {
        this.currentBlock = 1;
      }
      this.applyTipoTrabajadorRules(tipo ?? '');
    });
  }

  private applyTipoTrabajadorRules(tipo: string) {
    const redControl = this.registerForm.get('code_red');
    const centroControl = this.registerForm.get('codcas');

    redControl?.clearValidators();
    centroControl?.clearValidators();

    if (tipo === this.TIPO_CABEZA_RED) {
      redControl?.setValidators([Validators.required]);
      this.clearCentroSelection();
    }

    if (tipo === this.TIPO_USUARIO_CENTRO) {
      redControl?.setValidators([Validators.required]);
      centroControl?.setValidators([Validators.required]);
      const selectedRedCode = this.registerForm.get('code_red')?.value;
      this.updateCentroDataByRedSelection(selectedRedCode || undefined);
    }

    if (!tipo) {
      this.clearRedSelection();
      this.clearCentroSelection();
      this.dataCentro = [...this.dataCentroCompleto];
      this.filteredCentro = [...this.dataCentroCompleto];
    }

    redControl?.updateValueAndValidity({ emitEvent: false });
    centroControl?.updateValueAndValidity({ emitEvent: false });
  }

  openDropdownRed() {
    if (!this.registerForm.get('tipoTrabajador')?.value) {
      return;
    }
    this.isDropdownRedOpen = true;
    if (!this.searchRed) {
      this.filteredRed = this.dataRed;
    }
    this.activeRedIndex = this.filteredRed.length > 0 ? 0 : -1;
    this.scrollActiveRedIntoView();
  }

  closeDropdownRed() {
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;
    const selectedRedCode = this.registerForm.get('code_red')?.value;
    this.updateCentroDataByRedSelection(selectedRedCode || undefined);
  }

  filterRed(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchRed = searchValue;
    this.isDropdownRedOpen = true;

    if (this.selectedRedName) {
      this.selectedRedName = '';
      this.registerForm.patchValue({ code_red: '' });
      this.updateCentroDataByRedSelection();
      this.selectedCentroName = '';
      this.registerForm.patchValue({ codcas: '' });
    }

    if (searchValue.trim() === '') {
      this.filteredRed = this.dataRed;
    } else {
      this.filteredRed = this.dataRed.filter((red: any) =>
        red.redasisdes.toLowerCase().includes(searchValue),
      );
    }
    this.activeRedIndex = this.filteredRed.length > 0 ? 0 : -1;
    this.scrollActiveRedIntoView();
  }

  selectOptionRed(red: any) {
    this.selectedRedName = red.redasisdes;
    this.registerForm.patchValue({ code_red: red.redasiscod });
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;

    this.updateCentroDataByRedSelection(red.redasiscod);
    this.selectedCentroName = '';
    this.registerForm.patchValue({ codcas: '' });
  }

  /// Centro Asistencial Metodos

  openDropdownCentro() {
    if (!this.isCenterUser) {
      return;
    }
    this.isDropdownCentroOpen = true;
    this.filteredCentro = this.dataCentro;
    const options = this.getCentroOptions();
    this.activeCentroIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }

  closeDropdownCentro() {
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
  }

  filterCentro(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchCentro = searchValue;
    this.isDropdownCentroOpen = true;

    if (searchValue.trim() === '') {
      this.filteredCentro = this.dataCentro;
    } else {
      this.filteredCentro = this.dataCentro.filter((centro: any) =>
        centro.cenasides.toLowerCase().includes(searchValue),
      );
    }
    const options = this.getCentroOptions();
    this.activeCentroIndex = options.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }
  selectOptionCentro(centro: any) {
    this.selectedCentroName = centro.cenasides;
    this.registerForm.patchValue({ codcas: centro.cenasicod });
    this.isDropdownCentroOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
  }

  private getCentroOptions(): any[] {
    return this.searchCentro ? this.filteredCentro : this.dataCentro;
  }

  handleRedKeydown(event: KeyboardEvent) {
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownRedOpen) {
        this.openDropdownRed();
      }
      const options = this.filteredRed;
      if (options.length === 0) {
        this.activeRedIndex = -1;
        return;
      }
      this.activeRedIndex = Math.min(this.activeRedIndex + 1, options.length - 1);
      this.scrollActiveRedIntoView();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isDropdownRedOpen) {
        this.openDropdownRed();
      }
      const options = this.filteredRed;
      if (options.length === 0) {
        this.activeRedIndex = -1;
        return;
      }
      this.activeRedIndex = Math.max(this.activeRedIndex - 1, 0);
      this.scrollActiveRedIntoView();
      return;
    }

    if (key === 'Enter') {
      if (!this.isDropdownRedOpen) {
        return;
      }
      event.preventDefault();
      const options = this.filteredRed;
      const index = this.activeRedIndex >= 0 ? this.activeRedIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectOptionRed(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdownRed();
    }
  }

  handleCentroKeydown(event: KeyboardEvent) {
    if (!this.isCenterUser) {
      return;
    }
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownCentroOpen) {
        this.openDropdownCentro();
      }
      const options = this.getCentroOptions();
      if (options.length === 0) {
        this.activeCentroIndex = -1;
        return;
      }
      this.activeCentroIndex = Math.min(this.activeCentroIndex + 1, options.length - 1);
      this.scrollActiveCentroIntoView();
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isDropdownCentroOpen) {
        this.openDropdownCentro();
      }
      const options = this.getCentroOptions();
      if (options.length === 0) {
        this.activeCentroIndex = -1;
        return;
      }
      this.activeCentroIndex = Math.max(this.activeCentroIndex - 1, 0);
      this.scrollActiveCentroIntoView();
      return;
    }

    if (key === 'Enter') {
      if (!this.isDropdownCentroOpen) {
        return;
      }
      event.preventDefault();
      const options = this.getCentroOptions();
      const index = this.activeCentroIndex >= 0 ? this.activeCentroIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectOptionCentro(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdownCentro();
    }
  }

  private scrollActiveRedIntoView() {
    if (!this.isDropdownRedOpen || this.activeRedIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.redOptions?.toArray();
      const target = items?.[this.activeRedIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  private scrollActiveCentroIntoView() {
    if (!this.isDropdownCentroOpen || this.activeCentroIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.centroOptions?.toArray();
      const target = items?.[this.activeCentroIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  private clearRedSelection() {
    this.selectedRedName = '';
    this.searchRed = '';
    this.filteredRed = this.dataRed;
    this.activeRedIndex = -1;
    this.isDropdownRedOpen = false;
    this.registerForm.patchValue({ code_red: '' }, { emitEvent: false });
  }

  private clearCentroSelection() {
    this.selectedCentroName = '';
    this.searchCentro = '';
    this.filteredCentro = this.dataCentro;
    this.activeCentroIndex = -1;
    this.isDropdownCentroOpen = false;
    this.registerForm.patchValue({ codcas: '' }, { emitEvent: false });
  }

  private updateCentroDataByRedSelection(redCode?: string) {
    if (!this.isCenterUser) {
      this.dataCentro = [];
      this.filteredCentro = [];
      return;
    }

    this.dataCentro = redCode
      ? this.dataCentroCompleto.filter((centro: any) => String(centro.redasiscod) === String(redCode))
      : [...this.dataCentroCompleto];

    this.filteredCentro = this.dataCentro;
  }

  getRed() {
    this.establecimientoService.getRed().subscribe({
      next: (resp) => {
        this.dataRed = resp;
        this.filteredRed = resp;
        this.syncSelectedRedAndCentroNames();
      },
      error: (err) => {
        console.log('Error al obtener las redes', err);
      },
    });
  }

  getCentroWithRed() {
    this.establecimientoService.getCentrosWithRed().subscribe({
      next: (resp) => {
        this.dataCentroCompleto = resp;
        this.dataCentro = [...resp];
        this.filteredCentro = [...resp];
        this.syncSelectedRedAndCentroNames();
      },
      error: (err) => {
        console.log('Error al obtener los centros', err);
      },
    });
  }

  getUserByDni(dni: string) {
    const dniNormalizado = (dni || '').trim();
    if (!/^\d{8}$/.test(dniNormalizado)) {
      this._snackBar.open('Ingrese un DNI válido de 8 dígitos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.usersService.getUserByDni(dniNormalizado).subscribe({
      next: (resp) => {
        if (resp) {
          this.user = resp;
          const { apellidoPaterno, apellidoMaterno } = this.splitLastnames(String(resp.lastname || ''));

          this.registerForm.patchValue({
            name: String(resp.name || ''),
            apellidoPaterno,
            apellidoMaterno,
          });

          this._snackBar.open('Usuario encontrado. Se autocompletaron nombre y apellidos.', 'Cerrar', {
            duration: 3000,
          });
        } else {
          this.user = null;
          this._snackBar.open('No se encontró usuario con ese DNI', 'Cerrar', {
            duration: 3000,
          });
        }
      },
      error: (err) => {
        console.log('Error al verificar el DNI', err);
        this.user = null;
        this._snackBar.open('No se encontró usuario con ese DNI', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  enviarSolicitud() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this._snackBar.open('Completa todos los campos obligatorios', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const apellidoPaterno = String(this.registerForm.value.apellidoPaterno || '').trim();
    const apellidoMaterno = String(this.registerForm.value.apellidoMaterno || '').trim();


    const payload: SolicitudAccesoPayload = {
      id: 0,
      dni: this.registerForm.value.dni,
      name: this.registerForm.value.name,
      lastname: [apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim(),
      code_red_solicitud: this.registerForm.value.code_red,
      codcas_solicitud: this.isCenterUser ? this.registerForm.value.codcas : '',
      email: this.registerForm.value.email,
      rol_solicitud: this.registerForm.value.tipoTrabajador === this.TIPO_CABEZA_RED ? 'ADMIN_RED' : 'USER',
      descripcion: this.registerForm.value.descripcion,
      date_creation:"" ,
      date_update: "",
      status: "",
    };

    console.log('Payload a enviar:', payload);

    this.solicitudAccesoService.enviarSolicitud(payload).subscribe({
      next: () => {
        this._snackBar.open('Solicitud enviada correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.resetForm();
      },
      error: (err) => {
        console.log('Error al enviar solicitud', err);
        this._snackBar.open('No se pudo enviar la solicitud', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  private syncSelectedRedAndCentroNames() {
    const redCode = String(this.registerForm?.get('code_red')?.value || '');
    const codcas = String(this.registerForm?.get('codcas')?.value || '');

    if (redCode) {
      const red = this.dataRed.find((item: any) => String(item.redasiscod) === redCode);
      this.selectedRedName = red?.redasisdes ?? '';
    } else {
      this.selectedRedName = '';
    }

    if (codcas) {
      const centro = this.dataCentroCompleto.find((item: any) => String(item.cenasicod) === codcas);
      this.selectedCentroName = centro?.cenasides ?? '';
    } else {
      this.selectedCentroName = '';
    }
  }

  private resolveRedCodeFromResponse(resp: any): string {
    return String(
      resp?.code_red_solicitud ??
      resp?.code_red ??
      resp?.redasiscod ??
      '',
    ).trim();
  }

  private resolveCentroCodeFromResponse(resp: any): string {
    return String(
      resp?.codcas_solicitud ??
      resp?.codcas ??
      resp?.cenasicod ??
      '',
    ).trim();
  }

  private splitLastnames(lastname: string): { apellidoPaterno: string; apellidoMaterno: string } {
    const value = String(lastname || '').trim();
    if (!value) {
      return { apellidoPaterno: '', apellidoMaterno: '' };
    }

    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { apellidoPaterno: parts[0], apellidoMaterno: '' };
    }

    return {
      apellidoPaterno: parts[0],
      apellidoMaterno: parts.slice(1).join(' '),
    };
  }

  resetForm() {
    this.registerForm.reset();
    this.currentBlock = 1;
    this.user = null;
    this.clearRedSelection();
    this.clearCentroSelection();
    this.dataCentro = [];
    this.filteredCentro = [];
    this.filteredRed = [...this.dataRed];
  }

}
