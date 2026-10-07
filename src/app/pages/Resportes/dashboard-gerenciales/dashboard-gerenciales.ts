import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type ReportGroup = 'main' | 'historico';

interface ReportTile {
  /** Clave del reporte en data_urls; vacío para agrupadores. */
  key: string;
  label: string;
  img: string;
  group: ReportGroup;
  /** false = módulo en desarrollo (se muestra como "Próximamente"). */
  available: boolean;
  /** Abre el submenú de históricos en lugar de un reporte. */
  opensHistorico?: boolean;
}

@Component({
  selector: 'app-dashboard-gerenciales',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-gerenciales.html',
  styleUrl: './dashboard-gerenciales.css',
})
export class DashboardGerenciales {
  showReporte = true;
  showHistorico = false;

  showViewer = false;
  selectedUrl: SafeResourceUrl | null = null;
  selectedKey = '';
  isViewerLoading = false;

  readonly tiles: ReportTile[] = [
    { key: 'atenciones_ce', label: 'Atenciones CE', img: '/images/order_1420037.png', group: 'main', available: true },
    { key: 'atendidos_ce', label: 'Atendidos CE', img: '/images/shortlist_8915786.png', group: 'main', available: true },
    { key: 'atendidos_topico_eme', label: 'Atención por tópicos - EME', img: '/images/ambulance.png', group: 'main', available: true },
    { key: '', label: 'Resumen CE', img: '/images/reporte-gerencial/historico.png', group: 'main', available: true, opensHistorico: true },
    { key: 'intervenciones_quirurgicas', label: 'Intervenciones quirúrgicas', img: '/images/reporte-gerencial/inverciones-quirurgicas.png', group: 'main', available: true },
    { key: 'cambios_ses', label: 'Cambios SES', img: '/images/cambios-ses.png', group: 'main', available: true },
    { key: 'lista_quirurgica', label: 'Espera de lista quirúrgica', img: '/images/lista_quirurgica.png', group: 'main', available: true },
    // Módulos en proceso de desarrollo
    { key: 'accidentes', label: 'Accidentes', img: '/images/accidente.png', group: 'main', available: false },
    { key: 'diferimiento_citas_ce', label: 'Diferimiento de citas CE', img: '/images/diferimiento.png', group: 'main', available: false },
    { key: '', label: 'Reportes Gerenciales', img: '/images/analytics.png', group: 'main', available: false },
    // Históricos
    { key: 'resumen_ce_2023', label: 'Resumen CE 2023', img: '/images/reporte-gerencial/historico-ce.png', group: 'historico', available: true },
    { key: 'resumen_ce_2024', label: 'Resumen CE 2024', img: '/images/reporte-gerencial/historico-ce.png', group: 'historico', available: true },
    { key: 'resumen_ce_2025', label: 'Resumen CE 2025', img: '/images/reporte-gerencial/historico-ce.png', group: 'historico', available: true },
  ];

  data_urls = [
    { nombre: 'atenciones_ce', link: 'https://app.powerbi.com/view?r=eyJrIjoiZDU3ODFkZjMtMDlkMi00YjgxLWE2MGYtNWRhMzA2ZWI2NmRjIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'atendidos_ce', link: 'https://app.powerbi.com/view?r=eyJrIjoiMjkzNzY3YzYtNDYyMy00MTdhLTlmZDYtMGE4NjYxNGFlYTI5IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'atendidos_topico_eme', link: 'https://app.powerbi.com/view?r=eyJrIjoiYjhlMzQ1NGEtNjhlNy00NTA2LTlmOWQtMzQzM2YzYTAyMjcxIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'resumen_ce_2023', link: 'https://app.powerbi.com/view?r=eyJrIjoiMjNkMTQ0MjMtMTIyYi00NjhkLThlMmMtZTg1ZDk5ZTYxM2QzIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'resumen_ce_2024', link: 'https://app.powerbi.com/view?r=eyJrIjoiMjg4MDMzNmMtMjhhZS00ODlkLWI0YjMtOWYxYTc1NWE1NzY1IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'resumen_ce_2025', link: 'https://app.powerbi.com/view?r=eyJrIjoiN2Q3OTk3YjEtOTVkYy00MjJkLWI4ZGYtNmNlODM3YTc2ZTg5IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'intervenciones_quirurgicas', link: 'https://app.powerbi.com/view?r=eyJrIjoiOTJkZjBjZGItMzk0OC00NDlmLWExZjYtODY0NTBhNzIwODZkIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'cambios_ses', link: 'https://app.powerbi.com/view?r=eyJrIjoiOTZhMzAxM2ItZTNhYS00MWMyLWE3MDQtOTRmOGJkYWJjNmZjIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'accidentes', link: 'https://app.powerbi.com/view?r=eyJrIjoiZGU0YTAxMzktMDdiMi00NDEyLThjMmYtMTQ3ZGIwMmQ0MTIyIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'diferimiento_citas_ce', link: 'https://app.powerbi.com/view?r=eyJrIjoiZjJlZjk2NDgtMjdlMS00ZGRjLWJlMWMtN2QyYjJkNjNiOGU4IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { nombre: 'lista_quirurgica', link: 'https://app.powerbi.com/view?r=eyJrIjoiNjgyZjM5YWUtMTY0OC00NTc2LWE4NWMtNjcxZmE4MDczYTliIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
  ]

  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) { }

  get currentGroup(): ReportGroup {
    return this.showHistorico ? 'historico' : 'main';
  }

  get visibleTiles(): ReportTile[] {
    return this.tiles.filter((t) => t.group === this.currentGroup);
  }

  /** Reportes disponibles del grupo actual, para cambiar de reporte desde el visor. */
  get viewerSiblings(): ReportTile[] {
    return this.visibleTiles.filter((t) => t.available && !t.opensHistorico && !!t.key);
  }

  get selectedTitle(): string {
    return this.tiles.find((t) => t.key === this.selectedKey)?.label ?? 'Reporte';
  }

  get selectedRawUrl(): string {
    return this.data_urls.find((x) => x.nombre === this.selectedKey)?.link ?? '';
  }

  get availableCount(): number {
    return this.visibleTiles.filter((t) => t.available).length;
  }

  trackByLabel = (_: number, t: ReportTile) => t.label;

  onTileClick(tile: ReportTile): void {
    if (!tile.available) return;
    if (tile.opensHistorico) {
      this.activarHistorico();
      return;
    }
    this.openReport(tile.key);
  }

  openReport(nombre: string, event?: Event) {
    event?.preventDefault();
    const url = this.data_urls.find((x) => x.nombre === nombre)?.link;
    if (!url) return;
    this.selectedKey = nombre;
    this.selectedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.isViewerLoading = true;
    this.showViewer = true;
  }

  onIframeLoad(): void {
    this.isViewerLoading = false;
  }

  closeViewer() {
    this.showViewer = false;
    this.selectedUrl = null;
    this.selectedKey = '';
    this.isViewerLoading = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showViewer) {
      this.closeViewer();
    }
  }

  activarHistorico() {
    this.showHistorico = true;
    this.showReporte = false;
    this.closeViewer();
    this.cdr.detectChanges();
  }

  desactivarHistorico() {
    this.showHistorico = false;
    this.showReporte = true;
    this.closeViewer();
    this.cdr.detectChanges();
  }
}
