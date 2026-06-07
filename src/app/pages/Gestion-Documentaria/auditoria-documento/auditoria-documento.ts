import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuditoriaDocumentoService } from '../../../services/documentos/auditoria-documento-service';
import { LocalStorageService } from '../../../services/local-storage-service';
import { User } from '../../../model/user';

@Component({
  selector: 'app-auditoria-documento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './auditoria-documento.html',
  styleUrl: './auditoria-documento.css',
})
export class AuditoriaDocumento implements OnInit {
  auditorias: any[] = [];
  filteredAuditorias: any[] = [];
  pagedAuditorias: any[] = [];

  // Paginación
  currentPage: number = 1;
  pageSize: number = 15;
  pageSizeOptions: number[] = [10, 15, 30, 50, 100];
  Math = Math;

  // Filtros
  searchTerm: string = '';
  actionFilter: string = '';
  startDate: string = '';
  endDate: string = '';

  // Métricas
  totalAcciones: number = 0;
  totalDescargas: number = 0;
  totalVisualizaciones: number = 0;
  usuariosUnicos: number = 0;

  user: User | null = null;
  isLoading: boolean = true;

  constructor(
    private lsService: LocalStorageService,
    private auditoriaService: AuditoriaDocumentoService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user = this.lsService.getUser();
    
    // Verificación adicional de rol
    const isAdmin = !!(this.user?.roles?.includes('ADMIN'));
    if (!isAdmin) {
      alert('Acceso Denegado: No cuenta con permisos para ver este módulo.');
      void this.router.navigate(['/home']);
      return;
    }

    this.loadAuditorias();
  }

  loadAuditorias(): void {
    this.isLoading = true;
    this.auditoriaService.getAuditorias().subscribe(
      (data) => {
        this.auditorias = data || [];
        this.isLoading = false;
        this.calculateMetrics();
        this.applyFilters();
      },
      (error) => {
        console.error('Error al cargar auditorías:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  calculateMetrics(): void {
    this.totalAcciones = this.auditorias.length;
    this.totalDescargas = this.auditorias.filter(a => a.accion === 'DESCARGAR').length;
    this.totalVisualizaciones = this.auditorias.filter(a => a.accion === 'VISUALIZAR').length;

    // Usuarios únicos
    const usernames = new Set<string>();
    this.auditorias.forEach(a => {
      if (a.usuario_username) {
        usernames.add(a.usuario_username);
      }
    });
    this.usuariosUnicos = usernames.size;
    this.cdr.detectChanges();
  }

  applyFilters(): void {
    this.filteredAuditorias = this.auditorias.filter(a => {
      // 1. Filtro de búsqueda por texto (Usuario, Código, Título de Documento, IP, User Agent)
      const query = this.searchTerm.toLowerCase().trim();
      const matchSearch = !query ||
        (a.usuario_nombre && a.usuario_nombre.toLowerCase().includes(query)) ||
        (a.usuario_username && a.usuario_username.toLowerCase().includes(query)) ||
        (a.documento_codigo && a.documento_codigo.toLowerCase().includes(query)) ||
        (a.documento_titulo && a.documento_titulo.toLowerCase().includes(query)) ||
        (a.ip_address && a.ip_address.toLowerCase().includes(query)) ||
        (a.user_agent && a.user_agent.toLowerCase().includes(query));

      // 2. Filtro de tipo de acción
      const matchAction = !this.actionFilter || a.accion === this.actionFilter;

      // 3. Filtro por rango de fechas
      let matchDate = true;
      if (a.fecha_accion) {
        const actionTime = new Date(a.fecha_accion).getTime();
        
        if (this.startDate) {
          const start = new Date(this.startDate + 'T00:00:00').getTime();
          matchDate = matchDate && actionTime >= start;
        }
        if (this.endDate) {
          const end = new Date(this.endDate + 'T23:59:59').getTime();
          matchDate = matchDate && actionTime <= end;
        }
      }

      return matchSearch && matchAction && matchDate;
    });

    this.currentPage = 1;
    this.updatePagedAuditorias();
  }

  updatePagedAuditorias(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedAuditorias = this.filteredAuditorias.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedAuditorias();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagedAuditorias();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAuditorias.length / this.pageSize) || 1;
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.actionFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }
}
