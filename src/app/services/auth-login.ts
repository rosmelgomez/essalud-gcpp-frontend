import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth } from '../model/auth';
import { tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { BackendCredentials } from '../model/backendcredentials';
import { UsersService } from './users-service';

const base_url = BackendCredentials.api;

@Injectable({
  providedIn: 'root',
})
export class AuthLogin {
  private authStatusSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('user'));
  private logoutInProgress = false;

  constructor(
    private http: HttpClient,
    private userS: UsersService,
  ) { }

  login(user: Auth) {
    const url = base_url + `/login`;
    return this.http
      .post(url, user, {
        withCredentials: true,
        responseType: 'text',
      })
      .pipe(
        tap(() => {
          this.logoutInProgress = false;
          this.authStatusSubject.next(true);
          this.userS.getUser(user.username).subscribe((userDetails) => {
            localStorage.setItem('user', JSON.stringify(userDetails));
          });
        }),
        catchError((err) => {
          this.authStatusSubject.next(false);
          return throwError(() => err);
        }),
      );
  }

  accessToken() {
    return this.http.get(base_url + `/access-token`, { withCredentials: true, responseType: 'text' }).pipe(
      tap(() => {
        this.logoutInProgress = false;
        this.authStatusSubject.next(true);
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }

  refreshToken() {
    if (!this.canRefreshToken()) {
      return throwError(() => new Error('Refresh token bloqueado por logout o sesión inválida'));
    }

    const url = base_url + `/refresh-token`;
    return this.http.post(url, {}, { withCredentials: true, responseType: 'text' }).pipe(
      tap(() => {
        this.logoutInProgress = false;
        this.authStatusSubject.next(true);
        console.log('[AuthLogin] Token refrescado automáticamente');
      }),
      catchError((err) => {
        this.authStatusSubject.next(false);
        return throwError(() => err);
      }),
    );
  }

  logout() {
    this.logoutInProgress = true;
    const url = base_url + `/logout`;
    return this.http.post(url, {}, { withCredentials: true, responseType: 'text' });
  }

  canRefreshToken(): boolean {
    return !this.logoutInProgress;
  }

  isTokenExpired(): boolean {
    return !this.isLoggedIn();
  }

  // Obtener el estado actualizado de autenticación
  getAuthStatus() {
    return this.authStatusSubject.asObservable();
  }

  // Establecer el estado de autenticación manualmente
  setAuthStatus(status: boolean) {
    this.authStatusSubject.next(status);
  }

  clearToken(): void {
    this.logoutInProgress = true;
    localStorage.clear();
    this.authStatusSubject.next(false);
  }

  isLoggedIn(): boolean {
    return !this.logoutInProgress && (this.authStatusSubject.value || !!localStorage.getItem('user'));
  }
}
