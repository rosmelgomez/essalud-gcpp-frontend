import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { SolicitudAccesoService } from '../../../services/solicitud-acceso-service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { SolicitudAcceso } from '../../../model/SolicitudAcceso';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-solicitud-acceso-reports',
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './solicitud-acceso-reports.html',
  styleUrl: './solicitud-acceso-reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudAccesoReports implements OnInit, OnDestroy {
  readonly ROLE_ADMIN_RED = 'ADMIN_RED';
  readonly ROLE_USER = 'USER';
  readonly roleOptions: string[] = [this.ROLE_ADMIN_RED, this.ROLE_USER];
  readonly statusOptions: string[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];
  readonly virtualItemSize = 500;
  readonly virtualMinBufferPx = this.virtualItemSize * 4;
  readonly virtualMaxBufferPx = this.virtualItemSize * 8;

  dataSolicitudAcceso: SolicitudAcceso[] = [];
  filteredSolicitudes: SolicitudAcceso[] = [];
  virtualRows: SolicitudAcceso[][] = [];

  dataRed: any[] = [];
  dataCentroCompleto: any[] = [];
  centrosByRedCode: Record<string, any[]> = {};
  redNameByCode: Record<string, string> = {};
  centroNameByCode: Record<string, string> = {};

  selectedRedFilter: string = '';
  selectedCentroFilter: string = '';
  dniFilter: string = '';

  editingState: Record<string, boolean> = {};
  draftSolicitud: Record<string, SolicitudAcceso> = {};
  savingState: Record<string, boolean> = {};
  validationState: Record<string, string> = {};

  isLoadingSolicitudes: boolean = true;
  isLoadingCatalogos: boolean = true;

  private dniFilterDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private readonly dniFilterDebounceMs = 120;
  private cardKeyCounter: number = 0;
  private cardKeyByRef = new WeakMap<SolicitudAcceso, string>();
  private cardsPerRow: number = 3;


  constructor(
    private solicitudAccesoService: SolicitudAccesoService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.cardsPerRow = this.calculateCardsPerRow();
    this.getDataRedCentro();
    this.getDataSolicitudAcceso();
  }

  ngOnDestroy(): void {
    this.clearDniDebounce();
  }

  get isLoading(): boolean {
    return this.isLoadingSolicitudes || this.isLoadingCatalogos;
  }

  get centrosFiltrados(): any[] {
    if (!this.selectedRedFilter) {
      return [];
    }
    return this.dataCentroCompleto.filter(
      (centro: any) => String(centro.redasiscod) === this.selectedRedFilter,
    );
  }

  get totalResultados(): number {
    return this.filteredSolicitudes.length;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const nextCardsPerRow = this.calculateCardsPerRow();
    if (nextCardsPerRow !== this.cardsPerRow) {
      this.cardsPerRow = nextCardsPerRow;
      this.rebuildVirtualRows();
      this.cdr.markForCheck();
    }
  }


  getDataSolicitudAcceso(): void {
    this.solicitudAccesoService.getListSolicitud().subscribe({
      next: (data) => {
        this.dataSolicitudAcceso = data;
        this.initializeCardKeys(data);
        this.applyFilters();
        this.isLoadingSolicitudes = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.isLoadingSolicitudes = false;
        this.cdr.markForCheck();
      },
    });
  }

  getDataRedCentro(): void {

    forkJoin({
      red: this.establecimientoService.getRed(),
      centro: this.establecimientoService.getCentrosWithRed(),
    }).subscribe({
      next: ({ red, centro }) => {
        this.dataRed = red;
        this.dataCentroCompleto = centro;
        this.centrosByRedCode = this.buildCentrosByRedMap(centro);
        this.redNameByCode = red.reduce((acc: Record<string, string>, item: any) => {
          acc[String(item.redasiscod)] = item.redasisdes;
          return acc;
        }, {});
        this.centroNameByCode = centro.reduce((acc: Record<string, string>, item: any) => {
          acc[String(item.cenasicod)] = item.cenasides;
          return acc;
        }, {});
        this.isLoadingCatalogos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching data:', err);
        this.isLoadingCatalogos = false;
        this.cdr.markForCheck();
      },
    });
  }

  onRedFilterChange(): void {
    this.selectedCentroFilter = '';
    this.applyFilters();
  }

  onCentroFilterChange(): void {
    this.applyFilters();
  }

  onDniFilterChange(): void {
    this.clearDniDebounce();
    this.dniFilterDebounceHandle = setTimeout(() => {
      this.applyFilters();
      this.cdr.markForCheck();
    }, this.dniFilterDebounceMs);
  }

  limpiarFiltros(): void {
    this.clearDniDebounce();
    this.selectedRedFilter = '';
    this.selectedCentroFilter = '';
    this.dniFilter = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const dniNormalized = this.dniFilter.trim().toLowerCase();

    this.filteredSolicitudes = this.dataSolicitudAcceso.filter((item) => {
      const codeRed = this.resolveRedCode(item);
      const codcas = this.resolveCentroCode(item);
      const matchesRed = !this.selectedRedFilter || String(codeRed ?? '') === this.selectedRedFilter;
      const matchesCentro =
        !this.selectedCentroFilter || String(codcas ?? '') === this.selectedCentroFilter;
      const matchesDni = !dniNormalized || String(item.dni ?? '').toLowerCase().includes(dniNormalized);

      return matchesRed && matchesCentro && matchesDni;
    });

    this.rebuildVirtualRows();
  }

  getRedName(code?: string): string {
    if (!code) {
      return '-';
    }
    return this.redNameByCode[String(code)] ?? String(code);
  }

  resolveRedCode(solicitud: SolicitudAcceso): string {
    const item = solicitud as any;
    return String(item.code_red_solicitud ?? item.code_red ?? '');
  }

  resolveCentroCode(solicitud: SolicitudAcceso): string {
    const item = solicitud as any;
    return String(item.codcas_solicitud ?? item.codcas ?? '');
  }

  setRedCode(solicitud: SolicitudAcceso, value: string): void {
    const item = solicitud as any;
    item.code_red_solicitud = value;
    item.code_red = value;
  }

  setCentroCode(solicitud: SolicitudAcceso, value: string): void {
    const item = solicitud as any;
    item.codcas_solicitud = value;
    item.codcas = value;
  }

  getCentroName(code?: string): string {
    if (!code) {
      return '-';
    }
    return this.centroNameByCode[String(code)] ?? String(code);
  }

  formatDate(date?: string): string {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleString('es-PE');
  }

  getCardKey(solicitud: SolicitudAcceso): string {
    const existingKey = this.cardKeyByRef.get(solicitud);
    if (existingKey) {
      return existingKey;
    }

    const newKey = `${solicitud.id ?? 'new'}-${solicitud.dni ?? 'dni'}-${this.cardKeyCounter++}`;
    this.cardKeyByRef.set(solicitud, newKey);
    return newKey;
  }

  trackBySolicitud = (_index: number, solicitud: SolicitudAcceso): string => this.getCardKey(solicitud);

  isEditing(solicitud: SolicitudAcceso): boolean {
    return !!this.editingState[this.getCardKey(solicitud)];
  }

  getDraft(solicitud: SolicitudAcceso): SolicitudAcceso {
    const key = this.getCardKey(solicitud);
    return this.draftSolicitud[key] ?? solicitud;
  }

  iniciarEdicion(solicitud: SolicitudAcceso): void {
    const key = this.getCardKey(solicitud);
    this.editingState[key] = true;
    this.draftSolicitud[key] = this.normalizeDraftByRoleRules({ ...solicitud });
    this.validationState[key] = '';
  }

  cancelarEdicion(solicitud: SolicitudAcceso): void {
    const key = this.getCardKey(solicitud);
    delete this.editingState[key];
    delete this.draftSolicitud[key];
    delete this.savingState[key];
    delete this.validationState[key];
  }

  guardarEdicion(solicitud: SolicitudAcceso): void {
    const key = this.getCardKey(solicitud);
    const payload = this.draftSolicitud[key];

    if (!payload) {
      return;
    }

    const validationError = this.getValidationError(payload);
    if (validationError) {
      this.validationState[key] = validationError;
      return;
    }

    this.validationState[key] = '';

    this.savingState[key] = true;
    this.solicitudAccesoService.updateSolicitud(payload).subscribe({
      next: () => {
        const index = this.dataSolicitudAcceso.findIndex((item) => this.getCardKey(item) === key);

        if (index >= 0) {
          const updated = { ...payload } as SolicitudAcceso;
          this.cardKeyByRef.set(updated, key);
          this.dataSolicitudAcceso[index] = updated;
        }

        this.cancelarEdicion(solicitud);
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.savingState[key] = false;
        this.cdr.markForCheck();
      },
    });
  }

  onRoleEditChange(solicitud: SolicitudAcceso): void {
    const key = this.getCardKey(solicitud);
    const draft = this.draftSolicitud[key];
    if (!draft) {
      return;
    }

    this.draftSolicitud[key] = this.normalizeDraftByRoleRules(draft);
    this.validationState[key] = '';
  }

  onRedEditChange(solicitud: SolicitudAcceso): void {
    const key = this.getCardKey(solicitud);
    const draft = this.draftSolicitud[key];
    if (!draft) {
      return;
    }

    const draftRedCode = this.resolveRedCode(draft);
    const draftCentroCode = this.resolveCentroCode(draft);

    if (this.isUserRole(draft.rol_solicitud) && draftCentroCode) {
      const existsCentro = this.getCentrosByRedCode(draftRedCode).some(
        (centro: any) => String(centro.cenasicod) === String(draftCentroCode),
      );
      if (!existsCentro) {
        this.setCentroCode(draft, '');
      }
    }

    if (this.isAdminRedRole(draft.rol_solicitud)) {
      this.setCentroCode(draft, '');
    }

    this.validationState[key] = '';
  }

  canEditCentro(solicitud: SolicitudAcceso): boolean {
    const draft = this.getDraft(solicitud);
    return this.isUserRole(draft.rol_solicitud) && !!String(this.resolveRedCode(draft)).trim();
  }

  getRoleDescription(role?: string): string {
    if (this.isAdminRedRole(role)) {
      return 'Cabeza de red';
    }
    if (this.isUserRole(role)) {
      return 'Usuario de centro';
    }
    return '-';
  }

  private normalizeDraftByRoleRules(draft: SolicitudAcceso): SolicitudAcceso {
    const redCode = this.resolveRedCode(draft);
    const centroCode = this.resolveCentroCode(draft);

    const normalized: SolicitudAcceso = {
      ...draft,
      rol_solicitud: this.isAdminRedRole(draft.rol_solicitud) ? this.ROLE_ADMIN_RED : this.ROLE_USER,
    };

    this.setRedCode(normalized, redCode);
    this.setCentroCode(normalized, centroCode);

    if (this.isAdminRedRole(normalized.rol_solicitud)) {
      this.setCentroCode(normalized, '');
    }

    return normalized;
  }

  private getValidationError(draft: SolicitudAcceso): string {
    const red = String(this.resolveRedCode(draft) ?? '').trim();
    const centro = String(this.resolveCentroCode(draft) ?? '').trim();

    if (!red) {
      return 'La red es obligatoria para el rol seleccionado.';
    }

    if (this.isUserRole(draft.rol_solicitud) && !centro) {
      return 'Para el rol USER debe seleccionar un centro.';
    }

    return '';
  }

  private isAdminRedRole(role?: string): boolean {
    return String(role ?? '').toUpperCase() === this.ROLE_ADMIN_RED;
  }

  private isUserRole(role?: string): boolean {
    return String(role ?? '').toUpperCase() === this.ROLE_USER;
  }

  getCentrosByRedCode(codeRed?: string): any[] {
    const key = String(codeRed ?? '');
    if (!key) {
      return [];
    }
    return this.centrosByRedCode[key] ?? [];
  }

  private buildCentrosByRedMap(centros: any[]): Record<string, any[]> {
    return centros.reduce((acc: Record<string, any[]>, centro: any) => {
      const key = String(centro.redasiscod ?? '');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(centro);
      return acc;
    }, {});
  }

  private initializeCardKeys(data: SolicitudAcceso[]): void {
    data.forEach((item) => {
      const existingKey = this.cardKeyByRef.get(item);
      if (!existingKey) {
        const generatedKey = `${item.id ?? 'new'}-${item.dni ?? 'dni'}-${this.cardKeyCounter++}`;
        this.cardKeyByRef.set(item, generatedKey);
      }
    });
  }

  private clearDniDebounce(): void {
    if (this.dniFilterDebounceHandle) {
      clearTimeout(this.dniFilterDebounceHandle);
      this.dniFilterDebounceHandle = null;
    }
  }

  private calculateCardsPerRow(): number {
    if (typeof window === 'undefined') {
      return 3;
    }
    if (window.innerWidth < 900) {
      return 1;
    }
    if (window.innerWidth < 1400) {
      return 2;
    }
    return 3;
  }

  private rebuildVirtualRows(): void {
    const rows: SolicitudAcceso[][] = [];
    for (let index = 0; index < this.filteredSolicitudes.length; index += this.cardsPerRow) {
      rows.push(this.filteredSolicitudes.slice(index, index + this.cardsPerRow));
    }
    this.virtualRows = rows;
  }

}
