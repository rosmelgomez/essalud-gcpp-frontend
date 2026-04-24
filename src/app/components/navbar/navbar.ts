import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { User } from '../../model/user';
import { LocalStorageService } from '../../services/local-storage-service';
import { RouteLogger } from '../../services/route-logger';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  user: User | null = null;
  isMenuOpen = false;

  constructor(
    private dataImport: LocalStorageService,
    private routeLogger: RouteLogger,
  ) {}

  ngOnInit(): void {
    this.getUser();
  }

  getUser(): void {
    this.user = this.dataImport.getUser();
    this.getInitials();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  getInitials(): string {
    if (!this.user?.name || !this.user?.lastname) {
      return 'GGI';
    }
    const firstInitial = this.user.name.charAt(0).toUpperCase();
    const lastInitial = this.user.lastname.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  logout() {
    this.closeMenu();
    this.routeLogger.logLogout();
    localStorage.clear();
  }
}
