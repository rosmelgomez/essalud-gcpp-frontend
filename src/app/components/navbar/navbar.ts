import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from '../../model/user';
import { AuthService } from '../../services/usuario/auth-service';
import { RouteLogger } from '../../services/route-logger';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  user: User | null = null;
  isMenuOpen = false;
  isProfileOpen = false;
  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private routeLogger: RouteLogger,
    private elementRef: ElementRef,
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isProfileOpen = false;
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleProfile(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isProfileOpen = !this.isProfileOpen;
    if (this.isProfileOpen) {
      this.isMenuOpen = false;
    }
  }

  closeProfile(): void {
    this.isProfileOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeProfile();
      this.closeMenu();
    }
  }

  getInitials(): string {
    if (!this.user?.name || !this.user?.lastname) {
      return 'US';
    }
    const firstInitial = this.user.name.charAt(0).toUpperCase();
    const lastInitial = this.user.lastname.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  logout() {
    this.closeMenu();
    this.closeProfile();
    this.routeLogger.logLogout();
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {}
    });
  }
}
