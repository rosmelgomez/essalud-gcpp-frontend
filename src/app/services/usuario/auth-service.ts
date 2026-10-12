import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError, throwError, timeout, map, finalize, shareReplay } from 'rxjs';
import { User } from '../../model/user';
import { Backend } from '../../model/api';
import { Router } from '@angular/router';
import { LocalStorageService } from '../local-storage-service';

const base_url = Backend.api;

export const MENSAJE_SESION_EXPIRADA = 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.';
export const MENSAJE_SIN_SERVIDOR = 'No se pudo comunicar con el servidor. Por seguridad se cerró la sesión; inicie sesión de nuevo.';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // El perfil completo (con DNI y correo) solo vive en memoria; en localStorage va el perfil mínimo.
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  private cerrandoSesion = false;
  private verificacionEnCurso: Observable<boolean> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
    const initialUser = this.localStorageService.getUser();
    if (initialUser) {
      // reescribe con el perfil mínimo lo guardado por versiones anteriores (DNI, correo, etc.)
      this.localStorageService.saveUser(initialUser);
      this.userSubject.next(initialUser);
      // al recargar la página se recupera el perfil completo desde el backend (sin guardarlo).
      // Se aplaza: este servicio puede crearse dentro del interceptor, en mitad de otra petición.
      setTimeout(() => {
        this.http.get<User>(base_url + `/user/me`, { withCredentials: true }).subscribe({
          next: (user) => {
            if (this.userSubject.value) this.userSubject.next({ ...user, password: '' });
          },
          error: () => { },
        });
      });
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      this.localStorageService.saveUser(user);
      this.userSubject.next({ ...user, password: '' });
    } else {
      this.clearSession();
    }
  }

  getCurrentUserValue(): User | null {
    return this.userSubject.value;
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(base_url + `/user/me`, { withCredentials: true }).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
      catchError((err) => {
        this.setCurrentUser(null);
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(base_url + `/logout-user`, {}, { withCredentials: true, responseType: 'text' }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      }),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  /** Borra todo lo que el navegador guarda de la sesión (localStorage, sessionStorage y memoria). */
  clearSession(): void {
    this.localStorageService.clearFrontendSession();
    this.userSubject.next(null);
  }

  /**
   * Pide al backend que borre las cookies access_token y api_token. Son httpOnly, así que
   * JavaScript no puede borrarlas: si el backend no responde, caducan solas y ya no sirven.
   */
  borrarCookiesSesion(): void {
    this.http.post(base_url + `/logout-user`, {}, { withCredentials: true, responseType: 'text' })
      .pipe(timeout(3000), catchError(() => of(null)))
      .subscribe();
  }

  /** Cierre de sesión completo cuando el token de larga duración expiró o el backend no responde. */
  endSession(mensaje: string = MENSAJE_SESION_EXPIRADA): void {
    if (this.cerrandoSesion) return;
    this.cerrandoSesion = true;
    this.clearSession();
    this.borrarCookiesSesion();
    this.router.navigate(['/login'], { queryParams: { message: mensaje } })
      .finally(() => (this.cerrandoSesion = false));
  }

  /**
   * Comprueba si la sesión sigue viva (api_token). Emite false si expiró (401/403) o si el
   * backend no respondió (status 0 o timeout). Las comprobaciones simultáneas se comparten.
   */
  verificarSesion(): Observable<{ activa: boolean; sinServidor: boolean }> {
    if (!this.verificacionEnCurso) {
      this.verificacionEnCurso = this.http.get(base_url + `/api-token`, { withCredentials: true, responseType: 'text' }).pipe(
        timeout(8000),
        map(() => true),
        catchError((err) => {
          this.ultimoErrorSinServidor = !(err instanceof HttpErrorResponse) || err.status === 0;
          return of(false);
        }),
        finalize(() => (this.verificacionEnCurso = null)),
        shareReplay(1),
      );
    }
    return this.verificacionEnCurso.pipe(map((activa) => ({ activa, sinServidor: !activa && this.ultimoErrorSinServidor })));
  }

  private ultimoErrorSinServidor = false;
}
