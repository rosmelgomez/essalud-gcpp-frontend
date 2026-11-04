import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/usuario/auth-service';

export const redirectGuard: CanActivateFn = () => {
  const authService = inject(AuthLogin);
  const router = inject(Router);
  const sesion = inject(AuthService);

  return authService.apiToken().pipe(
    map(() => router.createUrlTree(['/tmi/administrativo'])),
    catchError(() => {
      sesion.clearSession();
      return of(router.createUrlTree(['/login']));
    }),
  );
};
