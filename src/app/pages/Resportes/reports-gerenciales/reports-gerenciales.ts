import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-reports-gerenciales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-gerenciales.html',
  styleUrl: './reports-gerenciales.css',
})
export class ReportsGerenciales {
  showReporte =  true;
  showHistorico = false;

  showViewer = false;
  selectedUrl: SafeResourceUrl | null = null;

  data_urls = [
    { atenciones_ce: 'https://app.powerbi.com/view?r=eyJrIjoiZDU3ODFkZjMtMDlkMi00YjgxLWE2MGYtNWRhMzA2ZWI2NmRjIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { atendidos_ce: 'https://app.powerbi.com/view?r=eyJrIjoiMjkzNzY3YzYtNDYyMy00MTdhLTlmZDYtMGE4NjYxNGFlYTI5IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9' },
    { atendidos_topico_eme:'https://app.powerbi.com/view?r=eyJrIjoiYjhlMzQ1NGEtNjhlNy00NTA2LTlmOWQtMzQzM2YzYTAyMjcxIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9'},
    { resumen_ce_2023:'https://app.powerbi.com/view?r=eyJrIjoiMjNkMTQ0MjMtMTIyYi00NjhkLThlMmMtZTg1ZDk5ZTYxM2QzIiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9'},
    { resumen_ce_2024:'https://app.powerbi.com/view?r=eyJrIjoiMjg4MDMzNmMtMjhhZS00ODlkLWI0YjMtOWYxYTc1NWE1NzY1IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9'},
    { resumen_ce_2025:'https://app.powerbi.com/view?r=eyJrIjoiN2Q3OTk3YjEtOTVkYy00MjJkLWI4ZGYtNmNlODM3YTc2ZTg5IiwidCI6IjM0ZjMyNDE5LTFjMDUtNDc1Ni04OTZlLTQ1ZDYzMzcyNjU5YiIsImMiOjR9'}

  ]

  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}

  openReport(url: string, event: Event) {
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
    this.cdr.detectChanges();
  }

  desactivarHistorico() {
    this.showHistorico = false;
    this.showReporte = true;
    this.closeViewer();
    this.cdr.detectChanges();
  }


}
