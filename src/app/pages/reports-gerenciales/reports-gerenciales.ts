import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-reports-gerenciales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-gerenciales.html',
  styleUrl: './reports-gerenciales.css',
})
export class ReportsGerenciales {
  showViewer = false;
  selectedUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

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
}
