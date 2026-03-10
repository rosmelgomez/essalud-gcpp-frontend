import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/users-service';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { User } from '../../model/user';
import { CentroService } from '../../services/centro-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, MatButtonModule,],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {

  // Controla la visibilidad del campo contraseña
  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  private _snackBar = inject(MatSnackBar);
  public registerForm!: FormGroup;

  @ViewChildren('redOption') redOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('centroOption') centroOptions!: QueryList<ElementRef<HTMLElement>>;

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

  // Rol actual seleccionado en el formulario
  currentrol: string = '';


  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private centroService: CentroService,
  ) { }

  openDropdownRed() {
    if (!this.isRedEnabled) {
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

    // USER: si hay red seleccionada, Centro se mantiene filtrado por esa red.
    // Si no hay red seleccionada, Centro vuelve a mostrar todos.
    const selectedRedCode = this.registerForm.get('code_red')?.value;
    this.updateCentroDataByRedSelection(selectedRedCode || undefined);
  }

  filterRed(event: any) {
    if (!this.isRedEnabled) {
      return;
    }

    const searchValue = event.target.value.toLowerCase();
    this.searchRed = searchValue;
    this.isDropdownRedOpen = true;

    // Cuando el usuario edita el input, limpiar la selección actual
    if (this.selectedRedName) {
      this.selectedRedName = '';
      this.registerForm.patchValue({ code_red: '' });

      if (this.getSelectedrol() === 'USER') {
        this.updateCentroDataByRedSelection();
      }
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

    const rol = this.getSelectedrol();

    if (rol === 'USER') {
      // USER: filtra centros por la red seleccionada
      this.updateCentroDataByRedSelection(red.redasiscod);

      this.selectedCentroName = '';
      this.registerForm.patchValue({ codcas: '' });
    } else {
      this.isCentroEnabled = false;
      this.selectedCentroName = '';
      this.registerForm.patchValue({ codcas: '' });
    }
  }

  /// Centro Asistencial Metodos

  openDropdownCentro() {
    if (this.isCentroEnabled) {
      this.isDropdownCentroOpen = true;
      this.filteredCentro = this.dataCentro;
      const options = this.getCentroOptions();
      this.activeCentroIndex = options.length > 0 ? 0 : -1;
      this.scrollActiveCentroIntoView();
    }
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
    if (!this.isCentroEnabled) {
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

  ngOnInit(): void {
    this.reactiveForm();
    this.getRed();
    this.getCentroWithRed();
    this.setuprolBehavior();
    this.applyrolRules(this.getSelectedrol());
  }

  reactiveForm() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      dni: ['', [Validators.required]],
      codcas: [''],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rol: ['', [Validators.required]],
      code_red: [''],
    });
  }

  private setuprolBehavior() {
    this.registerForm.get('rol')?.valueChanges.subscribe((rol) => {
      this.applyrolRules(rol ?? '');
    });
  }

  private getSelectedrol(): string {
    return this.registerForm.get('rol')?.value ?? '';
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

  // Actualiza la lista de centros según la red seleccionada.
  // Si no hay red y el rol es USER, muestra todos los centros.
  private updateCentroDataByRedSelection(redCode?: string) {
    if (this.getSelectedrol() !== 'USER') {
      this.dataCentro = [];
      this.filteredCentro = [];
      return;
    }

    this.dataCentro = redCode
      ? this.dataCentroCompleto.filter((centro: any) => centro.redasiscod === redCode)
      : [...this.dataCentroCompleto];

    this.filteredCentro = this.dataCentro;
  }

  private applyrolRules(rol: string) {
    const redControl = this.registerForm.get('code_red');
    const centroControl = this.registerForm.get('codcas');
    this.currentrol = rol;

    redControl?.clearValidators();
    centroControl?.clearValidators();

    if (rol === 'ADMIN') {
      // ADMIN: no requiere ni Red ni Centro
      this.isRedEnabled = false;
      this.isCentroEnabled = false;
      this.clearRedSelection();
      this.clearCentroSelection();
      this.dataCentro = [];
      this.filteredCentro = [];
    }

    if (rol === 'ADMIN_RED') {
      // ADMIN_RED: solo requiere Red
      this.isRedEnabled = true;
      this.isCentroEnabled = false;
      this.clearCentroSelection();
      this.dataCentro = [];
      this.filteredCentro = [];
      redControl?.setValidators([Validators.required]);
    }

    if (rol === 'USER') {
      // USER: ambos filtros activos; Centro muestra todos hasta elegir una Red
      this.isRedEnabled = true;
      this.isCentroEnabled = true;
      redControl?.setValidators([Validators.required]);
      centroControl?.setValidators([Validators.required]);

      const selectedRedCode = this.registerForm.get('code_red')?.value;
      this.updateCentroDataByRedSelection(selectedRedCode || undefined);
    }

    if (!rol) {
      this.isRedEnabled = false;
      this.isCentroEnabled = false;
      this.clearRedSelection();
      this.clearCentroSelection();
      this.dataCentro = [];
      this.filteredCentro = [];
    }

    redControl?.updateValueAndValidity({ emitEvent: false });
    centroControl?.updateValueAndValidity({ emitEvent: false });
  }

  getRed() {
    this.centroService.getRed().subscribe({
      next: (resp) => {
        this.dataRed = resp;
      },
      error: (err) => {
        console.log('Error al obtener las redes', err);
      },
    });
  }

  getCentroWithRed() {
    this.centroService.getCentrosWithRed().subscribe({
      next: (resp) => {
        this.dataCentroCompleto = resp;

        if (this.getSelectedrol() === 'USER') {
          const selectedRedCode = this.registerForm.get('code_red')?.value;
          this.updateCentroDataByRedSelection(selectedRedCode || undefined);
        }
      },
      error: (err) => {
        console.log('Error al obtener los centros', err);
      },
    });
  }

  register() {
    if (this.registerForm.valid) {
      const rol = this.registerForm.value.rol;

      const users: User = {
        id: 0,
        name: this.registerForm.value.name,
        lastname: this.registerForm.value.lastname,
        dni: this.registerForm.value.dni,
        codcas: rol === 'USER' ? this.registerForm.value.codcas : '',
        username: this.registerForm.value.username,
        password: this.registerForm.value.password,
        rol: rol,
        code_red: rol === 'ADMIN_RED' ? this.registerForm.value.code_red : '',
        date_creation: "",
        date_update: "",
        flag: true
      };
      this.usersService.registerUser(users).subscribe({
        next: (resp) => {
          this._snackBar.open('Registro exitoso', 'Cerrar', {
            duration: 3000,
          });
          console.log('Registro exitoso:', resp);
        },
        error: (err) => {
          console.log('Error en el registro', err);
        },
      });
      this.registerForm.reset();
      this.selectedRedName = '';
      this.selectedCentroName = '';
      this.isRedEnabled = false;
      this.isCentroEnabled = false;
      this.applyrolRules('');
    } else {
      const invalidFields: string[] = [];
      Object.keys(this.registerForm.controls).forEach((key) => {
        if (this.registerForm.get(key)?.invalid) {
          invalidFields.push(key);
        }
      });
      alert('Faltan campos requeridos: ' + invalidFields.join(', '));
    }
  }
}
