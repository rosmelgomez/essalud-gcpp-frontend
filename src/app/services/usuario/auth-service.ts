import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../../model/user';
import { Backend } from '../../model/api';
import { Router } from '@angular/router';
import { LocalStorageService } from '../local-storage-service';

const base_url = Backend.api;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
    const initialUser = this.localStorageService.getUser();
    if (initialUser) {
      this.userSubject.next(initialUser);
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      this.localStorageService.saveUser(user);
    } else {
      sessionStorage.removeItem('user');
    }
    this.userSubject.next(user);
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

  clearSession(): void {
    this.localStorageService.clearFrontendSession();
    this.userSubject.next(null);
  }
}
