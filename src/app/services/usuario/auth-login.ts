import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { catchError, throwError } from 'rxjs';
import { Backend } from '../../model/api';
import { Auth } from '../../model/user';

const base_url = Backend.api;

@Injectable({
  providedIn: 'root',
})
export class AuthLogin {
  constructor(
    private http: HttpClient,
  ) { }

  login(user: Auth) {
    return this.http.post(base_url + `/login`, user, {withCredentials: true,responseType: 'text' })
      .pipe(
        catchError((err) => {
          return throwError(() => err);
        }),
      );
  }

  apiToken() {
    return this.http.get(base_url + `/api-token`, { withCredentials: true, responseType: 'text' })
      .pipe(
        catchError((err) => {
          return throwError(() => err);
        }),
      );
  }

  logout() {
    return this.http.post(base_url + `/logout-user`, {}, { withCredentials: true, responseType: 'text' });
  }
}
