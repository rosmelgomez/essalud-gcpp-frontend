import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../services/auth-login';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

export const redirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthLogin);
  const router = inject(Router);

  return authService.apiToken().pipe(
    map(() => router.createUrlTree(['/home'])),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
