import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../model/user';
import { AuthService } from '../../../services/usuario/auth.service';
import { EstablecimientoService } from '../../../services/establecimiento-service';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  user: User | null = null;
  redName: string = '';
  centroName: string = '';
  isLoading: boolean = true;
  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private establecimientoService: EstablecimientoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe({
      next: (user) => {
        this.user = user;
        if (this.user) {
          this.loadNames();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  loadNames(): void {
    forkJoin({
      red: this.establecimientoService.getRed(),
      centro: this.establecimientoService.getCentrosWithRed(),
    }).subscribe({
      next: ({ red, centro }) => {
        if (this.user) {
          const userRedCode = String(this.user.codred ?? '').trim().toLowerCase();
          const userCentroCode = String(this.user.codcas ?? '').trim().toLowerCase();

          const foundRed = red.find((r: any) => String(r.redasiscod).trim().toLowerCase() === userRedCode);
          this.redName = foundRed ? foundRed.redasisdes : (this.user.codred || 'No asignada');

          const foundCentro = centro.find((c: any) => String(c.cenasicod).trim().toLowerCase() === userCentroCode);
          this.centroName = foundCentro ? foundCentro.cenasides : (this.user.codcas || 'No asignado');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading catalogues:', err);
        this.isLoading = false;
      }
    });
  }

  getInitials(): string {
    if (!this.user?.name || !this.user?.lastname) {
      return 'US';
    }
    const firstInitial = this.user.name.charAt(0).toUpperCase();
    const lastInitial = this.user.lastname.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }
}
