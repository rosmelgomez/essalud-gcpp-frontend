import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthService, SIN_SESION } from '../services/usuario/auth-service';
import { LocalStorageService } from '../services/local-storage-service';
import { rutaInicio } from './tmi-acceso';

export const redirectGuard: CanActivateFn = () => {
  const authService = inject(AuthLogin);
  const router = inject(Router);
  const sesion = inject(AuthService);
  const almacen = inject(LocalStorageService);

  return authService.apiToken().pipe(
    switchMap(() => sesion.asegurarUsuario()),
    map(() => router.createUrlTree([rutaInicio(almacen.getUser())])),
    catchError((err) => {
      // backend sin respuesta: no se borra la sesión; el login vuelve a preguntar por ella
      if (!(err instanceof HttpErrorResponse) || err.status === 0) return of(router.createUrlTree(['/login']));
      sesion.clearSession();
      // el login no vuelve a preguntar por la sesión: ya se sabe que no hay
      return of(new RedirectCommand(router.createUrlTree(['/login']), { state: { [SIN_SESION]: true } }));
    }),
  );
};
