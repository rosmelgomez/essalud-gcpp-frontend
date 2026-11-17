import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from './local-storage-service';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { catchError, of, timeout } from 'rxjs';
import { AuthLogin } from './usuario/auth-login';
import { AuthService, SIN_SESION } from './usuario/auth-service';
import { Backend } from '../model/api';

const log_url = Backend.api + '/log/register';

// Rutas cuyo acceso no se guarda en el log de auditoría
const EXCLUDED_ROUTES = new Set(['/home', '/logs-reports']);

@Injectable({
  providedIn: 'root',
})
export class RouteLogger {
  private readonly LAST_LOGGED_URL_KEY = 'lastLoggedUrl';
  private isLoggingOut = false;
  private isLogoutInProgress = false;
  private readonly almacen = inject(LocalStorageService);

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthLogin,
    private sesion: AuthService,
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

    // No registrar rutas públicas (sin mirar los query params: /login?message=... también es el login)
    const ruta = url.split(/[?#]/)[0];
    if (ruta === '/login' || ruta === '/') {
      return;
    }

    // Sin sesión no se registra: el backend responde 401 (p. ej. dashboards públicos abiertos sin iniciar sesión)
    if (!this.almacen.getUser()) {
      return;
    }

    // Obtener la última URL registrada del sessionStorage
    const lastLoggedUrl = sessionStorage.getItem(this.LAST_LOGGED_URL_KEY);

    // No registrar rutas excluidas de la auditoría (se ignoran query params y fragmentos).
    // Se guarda igual como última URL para que, al volver a la ruta anterior, esta sí se registre.
    const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
    if (EXCLUDED_ROUTES.has(path)) {
      sessionStorage.setItem(this.LAST_LOGGED_URL_KEY, url);
      return;
    }

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

    // Limpiar la última URL registrada y lo que el navegador guarda de la sesión
    sessionStorage.removeItem(this.LAST_LOGGED_URL_KEY);
    this.sesion.clearSession();
    // Navegar al login (la sesión se acaba de cerrar: el login no vuelve a preguntar por ella)
    this.router.navigate(['/login'], { state: { [SIN_SESION]: true } });
    // Resetear la bandera después de un tiempo para permitir nuevos logins
    setTimeout(() => { this.isLoggingOut = false; }, 500);
    this.isLogoutInProgress = false;
  }
}
