import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/usuario/auth-service';
import { LocalStorageService } from '../services/local-storage-service';
import { rutaInicio } from './tmi-acceso';

export const redirectGuard: CanActivateFn = () => {
  const authService = inject(AuthLogin);
  const router = inject(Router);
  const sesion = inject(AuthService);
  const almacen = inject(LocalStorageService);

  return authService.apiToken().pipe(
    map(() => router.createUrlTree([rutaInicio(almacen.getUser())])),
    catchError(() => {
      sesion.clearSession();
      return of(router.createUrlTree(['/login']));
    }),
  );
};
