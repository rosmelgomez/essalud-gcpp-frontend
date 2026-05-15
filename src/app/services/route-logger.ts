import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { catchError, of, timeout } from 'rxjs';
import { AuthLogin } from './usuario/auth-login';
import { Backend } from '../model/api';

const log_url = Backend.api + '/log/register';

@Injectable({
  providedIn: 'root',
})
export class RouteLogger {
  private readonly LAST_LOGGED_URL_KEY = 'lastLoggedUrl';
  private isLoggingOut = false;
  private isLogoutInProgress = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthLogin,
  ) {
    this.initRouteLogging();
  }

  private initRouteLogging(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.logRouteAccess(event.urlAfterRedirects);
      });
  }

  private logRouteAccess(url: string): void {
    // No registrar logs durante el proceso de logout
    if (this.isLoggingOut) {
      return;
    }

    // No registrar rutas públicas
    if (url === '/login' || url === '/') {
      return;
    }

    // Obtener la última URL registrada del sessionStorage
    const lastLoggedUrl = sessionStorage.getItem(this.LAST_LOGGED_URL_KEY);

    // No registrar si es la misma URL que ya fue registrada
    if (url === lastLoggedUrl) {
      return;
    }

    // Guardar la URL actual en sessionStorage
    sessionStorage.setItem(this.LAST_LOGGED_URL_KEY, url);

    const logData = {
      action: 'ROUTE_ACCESS',
      status: 'SUCCESS',
      url: url,
      message: `Acceso a ruta: ${url}`,
    };

    this.http.post(log_url, logData, { withCredentials: true, responseType: 'text' }).subscribe({
      next: () => {},
      error: (err) => {
        if (err.status !== 200) {
          console.error('Error enviando log de ruta:', err);
        }
      },
    });
  }

  logLogin(): void {
    const logData = {
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      url: '/login',
      message: 'Acceso a ruta: /login',
    };

    this.http.post(log_url, logData, { withCredentials: true, responseType: 'text' }).subscribe({
      next: () => {},
      error: (err) => {
        if (err.status !== 200) {
          console.error('Error enviando log de login:', err);
        }
      },
    });
  }

  logLogout(): void {
    if (this.isLogoutInProgress) {
      return;
    }

    this.isLogoutInProgress = true;
    // Marcar que estamos en proceso de logout
    this.isLoggingOut = true;

    const logData = {
      action: 'LOGOUT',
      url: '/logout',
      status: 'SUCCESS',
      message: 'Acceso a ruta: /logout',
    };

    // Primero intentar enviar el log; con timeout para no bloquear el cierre de sesión.
    this.http.post(log_url, logData, { withCredentials: true, responseType: 'text' }).pipe(
      timeout(2500),
      catchError(() => {
        console.log('Log de logout no pudo ser enviado, continuando con logout local');
        return of(null);
      }),
    ).subscribe(() => {
      // Luego llamar al logout del backend para eliminar el token.
      this.performBackendLogout();
    });
  }

  private performBackendLogout(): void {
    this.auth.logout().subscribe({
      next: (resp: any) => {
        console.log('Logout successful:', resp);
        this.completeLogout();
      },
      error: () => {
        // Si el backend falla (401, 403, etc.), aún así completar el logout local
        console.log('Backend logout completado, limpiando sesión local');
        this.completeLogout();
      },
    });
  }

  private completeLogout(): void {

    // Limpiar la última URL registrada
    sessionStorage.removeItem(this.LAST_LOGGED_URL_KEY);
    // Navegar al login
    this.router.navigate(['/login']);
    // Resetear la bandera después de un tiempo para permitir nuevos logins
    setTimeout(() => { this.isLoggingOut = false; }, 500);
    this.isLogoutInProgress = false;
  }
}
