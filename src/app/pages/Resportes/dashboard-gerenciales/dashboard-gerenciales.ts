import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard-gerenciales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-gerenciales.html',
  styleUrl: './dashboard-gerenciales.css',
})
export class DashboardGerenciales {
  showReporte = true;
  showHistorico = false;

  showViewer = false;
  selectedUrl: SafeResourceUrl | null = null;

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
    { nombre: 'diferimiento_citas_ce', link: 'https://app.powerbi.com/view?r=eyJrIjoiZjJlZjk2NDgtMjdlMS00ZGRjLWJlMWMtN2QyYjJkNjNiOGU4IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' }
  ]

  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) { }

  openReport(nombre: string, event: Event) {
    const url = this.data_urls.find(x => x.nombre === nombre)!.link;
    event.preventDefault();
    if (!url) return;
    this.selectedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.showViewer = true;
  }

  closeViewer() {
    this.showViewer = false;
    this.selectedUrl = null;
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
