import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError, throwError, timeout, map, finalize, shareReplay } from 'rxjs';
import { User } from '../../model/user';
import { Backend } from '../../model/api';
import { Router } from '@angular/router';
import { LocalStorageService } from '../local-storage-service';

const base_url = Backend.api;

export const MENSAJE_SESION_EXPIRADA = 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.';
/** Estado de navegación que ponen los guards al mandar al login: ya comprobaron que no hay sesión. */
export const SIN_SESION = 'sinSesionVerificada';

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

  /**
   * Con la sesión ya confirmada (api_token válido): si el navegador no tiene el usuario (p. ej. se borró
   * mientras el backend estaba apagado), lo recupera con /user/me. Emite true si queda un usuario cargado.
   */
  asegurarUsuario(): Observable<boolean> {
    if (this.userSubject.value || this.localStorageService.getUser()) return of(true);
    return this.http.get<User>(base_url + `/user/me`, { withCredentials: true }).pipe(
      tap((user) => this.setCurrentUser(user)),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /**
   * El backend no respondió: no se sabe si la sesión sigue viva, así que no se borra nada (las cookies y el
   * usuario siguen sirviendo cuando el servidor vuelva). Se va al login sin marcarlo como "sin sesión" para
   * que vuelva a preguntar por ella.
   */
  irAlLoginSinServidor(): void {
    if (this.cerrandoSesion) return;
    this.cerrandoSesion = true;
    this.router.navigate(['/login']).finally(() => (this.cerrandoSesion = false));
  }

  logout(): Observable<any> {
    return this.http.post(base_url + `/logout-user`, {}, { withCredentials: true, responseType: 'text' }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login'], { state: { [SIN_SESION]: true } });
      }),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/login'], { state: { [SIN_SESION]: true } });
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

  /** Cierre de sesión completo cuando el token de larga duración expiró o el backend no responde (sin aviso). */
  endSession(mensaje: string | null = MENSAJE_SESION_EXPIRADA): void {
    if (this.cerrandoSesion) return;
    this.cerrandoSesion = true;
    this.clearSession();
    this.borrarCookiesSesion();
    // la sesión ya se dio por terminada: el login no vuelve a preguntar por ella
    this.router.navigate(['/login'], { state: { [SIN_SESION]: true }, ...(mensaje ? { queryParams: { message: mensaje } } : {}) })
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
  private renovacionEnCurso: Observable<boolean> | null = null;

  /**
   * Renueva el access_token en essalud-gcpp-backend: su filtro JWT lo regenera con el api_token y lo devuelve
   * en la cookie. Lo usan los backends que solo validan el token (TMI). Las renovaciones simultáneas se comparten.
   */
  renovarAcceso(): Observable<boolean> {
    if (!this.renovacionEnCurso) {
      this.renovacionEnCurso = this.http.get(base_url + `/user/me`, { withCredentials: true }).pipe(
        timeout(8000),
        map(() => true),
        catchError(() => of(false)),
        finalize(() => (this.renovacionEnCurso = null)),
        shareReplay(1),
      );
    }
    return this.renovacionEnCurso;
  }
}
