import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { filter } from 'rxjs';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Navbar
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {

  title = 'Essalud_GCPP_Frontend';

  currentNavbar: string = 'login';
  private readonly publicRoutesWithoutNavbar = ['/login', '/solicitar-acceso', '/solicitar-acceso-registro'];

  constructor(
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateNavbar(event.urlAfterRedirects);
      });
  }

  updateNavbar(url: string): void {
    const routePath = url.split('?')[0];

    if (this.publicRoutesWithoutNavbar.includes(routePath)) {
      this.currentNavbar = 'login';
    } else {
      this.currentNavbar = 'app';
    }
  }

  showNavbar(): boolean {
    return this.currentNavbar === 'app';
  }
}
