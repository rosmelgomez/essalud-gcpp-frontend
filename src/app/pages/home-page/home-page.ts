import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../model/user';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstablecimientoService } from '../../services/establecimiento-service';
import { LocalStorageService } from '../../services/local-storage-service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  public centroForm!: FormGroup;

  @ViewChildren('redOption') redOptions!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('centroOption') centroOptions!: QueryList<ElementRef<HTMLElement>>;

  /* Estados */
  selectCentro: boolean = false;

  user: User | null = null;

  nameRed: string = '';
  nameCentro: string = '';

  ///Estados para el manejo de componentes
  showModulosPrincipales: boolean = true;
  showVariableSES: boolean = false;

  showModuloConsultaExterna: boolean = false;
  showModuloCentroQuirurgico: boolean = false;

  // Datos de Redes Asistenciales
  dataRed: any[] = [];
  filteredRed: any = [];
  searchRed: string = '';
  isDropdownRedOpen: boolean = false;
  selectedRedName: string = '';
  activeRedIndex: number = -1;

  // Datos para el dropdown de Centro Asistencial
  dataCentro: any = [];
  dataCentroCompleto: any[] = [];
  filteredCentro: any = [];
  searchCentro: string = '';
  isDropdownOpen: boolean = false;
  selectedCentroName: string = '';
  activeCentroIndex: number = -1;
  showSurveyReminder: boolean = false;
  surveyReminderError: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private establecimientoService: EstablecimientoService,
    private dataImport: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  /* Métodos para el manejo de componentes */
  showSESVariables(): void {
    this.showModulosPrincipales = false;
    this.showVariableSES = true;
  }

  retornoMainModulos(): void {
    this.showModulosPrincipales = true;
    this.showVariableSES = false;
  }

  showMainConsultaExterna(): void {
    this.showModulosPrincipales = false;
    this.showVariableSES = false;
    this.showModuloConsultaExterna = true;
  }

  retornoMainSES(): void {
    this.showModulosPrincipales = false;
    this.showVariableSES = true;
    this.showModuloConsultaExterna = false;
    this.showModuloCentroQuirurgico = false;
  }

  showMainCentroQuirurgico(): void {
    this.showModulosPrincipales = false;
    this.showVariableSES = false;
    this.showModuloCentroQuirurgico = true;
  }

  ngOnInit(): void {
    this.reactiveForm();
    this.user = this.dataImport.getUser();
    this.handleSurveyReminder();

    // Solo usuarios ADMIN pueden acceder a getRed y getCentroWithRed
    if (Array.isArray(this.user?.roles) ? this.user?.roles.includes('ADMIN') : this.user?.roles === 'ADMIN') {
      this.getRed();
      this.getCentroWithRed();
    }

    this.processUserData();
  }

  reactiveForm() {
    this.centroForm = this.formBuilder.group({
      centro: ['', [Validators.required]],
      code_red: [''],
    });
  }

  private handleSurveyReminder(): void {
    const surveyReminderFromNavigation = this.router.getCurrentNavigation()?.extras.state?.['surveyReminder'];
    const surveyReminderFromHistory = history.state?.surveyReminder;
    const shouldShowReminder = surveyReminderFromNavigation === '1' || surveyReminderFromHistory === '1';

    if (shouldShowReminder) {
      this.showSurveyReminder = true;

      // Limpiar el state para evitar re-mostrar el recordatorio al refrescar.
      const { surveyReminder, ...stateWithoutReminder } = history.state || {};
      history.replaceState(stateWithoutReminder, '', this.router.url);
    }
  }

  goToEncuesta(): void {
    if (!this.canGoToEncuesta()) {
      this.surveyReminderError = 'Primero debes seleccionar un centro asistencial para completar la encuesta.';
      return;
    }

    this.surveyReminderError = '';
    this.showSurveyReminder = false;
    void this.router.navigate(['/encuesta']);
  }

  closeSurveyReminder(): void {
    this.surveyReminderError = '';
    this.showSurveyReminder = false;
  }

  canGoToEncuesta(): boolean {
    const dataCentro = this.dataImport.getDataCentro();
    const codcas = dataCentro?.codcas?.toString().trim();
    return !!codcas;
  }

  getCentro() {
    const isUser = Array.isArray(this.user?.roles) ? this.user?.roles.includes('USER') : this.user?.roles === 'USER';
    const isAdminRed = Array.isArray(this.user?.roles) ? this.user?.roles.includes('ADMIN_RED') : this.user?.roles === 'ADMIN_RED';

    if (isAdminRed) {
      this.selectCentro = false;
      const codeRed = this.user?.codred?.toString() || '';
      this.establecimientoService.getCentrosByRed(codeRed).subscribe({
        next: (resp) => {
          this.dataCentro = resp;
          this.nameRed = resp.length > 0 ? resp[0].redasisdes : '';
          this.cdr.detectChanges();
        },
        error: () => {
          console.log('Error al obtener los centros por red');
        },
      });
    } else {
      // Para usuarios USER, establecer selectCentro = true ANTES de la suscripción asincrónica
      if (isUser) {
        this.selectCentro = true;
      }

      this.establecimientoService.getCentros().subscribe({
        next: (resp) => {
          this.dataCentro = resp;
          if (isUser) {
            const codcas = this.user?.codcas?.toString();
            this.nameCentro = this.dataCentro.find((centro: any) => centro.cenasicod === codcas)?.cenasides || '';
            this.dataImport.saveDataCentro(codcas, this.nameCentro);
          }
          this.cdr.detectChanges();
        },
      });
    }
  }

  processUserData() {
    const centro = this.dataImport.getDataCentro();
    this.user = this.dataImport.getUser();

    if (centro && Object.keys(centro).length > 0) {
      this.selectCentro = true;
      this.nameCentro = centro.nameCentro?.toString() || '';
      return;
    } else {
      this.getCentro();
    }
  }

  // Métodos para Red Asistencial
  openDropdownRed() {
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

    // Si no hay red seleccionada, se restablece la lista completa de centros.
    if (!this.selectedRedName) {
      this.restoreAllCentros();
    }
  }

  filterRed(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchRed = searchValue;
    this.isDropdownRedOpen = true;

    if (this.selectedRedName) {
      this.selectedRedName = '';
      this.centroForm.patchValue({ code_red: '' });
      this.restoreAllCentros();
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
    this.centroForm.patchValue({ code_red: red.redasiscod });
    this.isDropdownRedOpen = false;
    this.searchRed = '';
    this.activeRedIndex = -1;

    // Si se selecciona una red, se muestra solo sus centros.
    this.dataCentro = this.dataCentroCompleto.filter(
      (centro: any) => centro.redasiscod === red.redasiscod,
    );
    this.filteredCentro = this.dataCentro;

    // Limpiar centro seleccionado anteriormente
    this.selectedCentroName = '';
    this.centroForm.patchValue({ centro: '' });
  }

  // Métodos para Centro Asistencial
  filterCentro(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.searchCentro = searchValue;
    this.isDropdownOpen = true;

    if (searchValue.trim() === '') {
      this.filteredCentro = this.dataCentro;
    } else {
      this.filteredCentro = this.dataCentro.filter((centro: any) =>
        centro.cenasides.toLowerCase().includes(searchValue),
      );
    }
    const centroOptions = this.getCentroOptions();
    this.activeCentroIndex = centroOptions.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }

  openDropdown() {
    this.isDropdownOpen = true;
    this.filteredCentro = this.dataCentro;
    this.activeCentroIndex = this.filteredCentro.length > 0 ? 0 : -1;
    this.scrollActiveCentroIntoView();
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
  }

  selectDropdownOption(centro: any) {
    this.selectedCentroName = centro.cenasides;
    this.centroForm.patchValue({ centro: centro.cenasicod });
    this.isDropdownOpen = false;
    this.searchCentro = '';
    this.activeCentroIndex = -1;
  }

  saveCentro() {
    if (this.centroForm.valid) {
      this.selectCentro = true;
      const codcas = this.centroForm.value.centro;
      this.nameCentro = this.dataCentro.find((centro: any) => centro.cenasicod === codcas)?.cenasides || '';
      this.dataImport.saveDataCentro(codcas, this.nameCentro);
      this.dataImport.deleteDataIndicadores();
      if (this.canGoToEncuesta()) {
        this.surveyReminderError = '';
      }
    } else {
      this.selectCentro = false;
    }
  }

  changeCentro() {
    if (this.dataCentro.length === 0) {
      this.getCentro();
    }
    this.selectCentro = false;
    this.selectedCentroName = '';
    this.selectedRedName = '';
    this.searchCentro = '';
    this.searchRed = '';
    this.activeCentroIndex = -1;
    this.activeRedIndex = -1;
    this.centroForm.reset();

    // Para admin, al cambiar centro se vuelve al estado sin filtro de red.
    if (Array.isArray(this.user?.roles) ? this.user?.roles.includes('ADMIN') : this.user?.roles === 'ADMIN') {
      this.restoreAllCentros();
    }
  }

  // Restaura el listado completo de centros cuando no hay red activa.
  private restoreAllCentros() {
    if (this.dataCentroCompleto.length > 0) {
      this.dataCentro = this.dataCentroCompleto;
      this.filteredCentro = this.dataCentroCompleto;
    }
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
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isDropdownOpen) {
        this.openDropdown();
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
      if (!this.isDropdownOpen) {
        this.openDropdown();
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
      if (!this.isDropdownOpen) {
        return;
      }
      event.preventDefault();
      const options = this.getCentroOptions();
      const index = this.activeCentroIndex >= 0 ? this.activeCentroIndex : 0;
      if (options.length > 0 && options[index]) {
        this.selectDropdownOption(options[index]);
      }
      return;
    }

    if (key === 'Escape') {
      this.closeDropdown();
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
    if (!this.isDropdownOpen || this.activeCentroIndex < 0) {
      return;
    }
    setTimeout(() => {
      const items = this.centroOptions?.toArray();
      const target = items?.[this.activeCentroIndex]?.nativeElement;
      target?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  getRed() {
    this.establecimientoService.getRed().subscribe({
      next: (resp) => {
        this.dataRed = resp;
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
        // Admin inicia con todos los centros y opcionalmente filtra por red.
        if (Array.isArray(this.user?.roles) ? this.user?.roles.includes('ADMIN') : this.user?.roles === 'ADMIN' && !this.selectedRedName) {
          this.dataCentro = resp;
          this.filteredCentro = resp;
        }
      },
      error: (err) => {
        console.log('Error al obtener los centros', err);
      },
    });
  }

  saveModulo(modulo: string) {
    this.dataImport.saveDataModulo(modulo);
  }
}
