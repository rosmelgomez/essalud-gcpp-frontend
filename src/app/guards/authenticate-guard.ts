import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/local-storage-service';
import { AuthService, MENSAJE_SESION_EXPIRADA, MENSAJE_SIN_SERVIDOR } from '../services/usuario/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';


export const authenticateGuard: CanActivateFn = (route) => {

  const authService = inject(AuthLogin);
  const dataImport = inject(LocalStorageService);
  const router = inject(Router);
  const sesion = inject(AuthService);

  const validateRoles = () => {
    const requiredRoles = (route.data['role'] || route.data['rol']) as Array<string> | undefined;
    console.log('[AuthGuard] Route:', route.routeConfig?.path, 'Required roles:', requiredRoles);
    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('[AuthGuard] No roles required, allowing access');
      return true;
    }

    const user = dataImport.getUser();
    const userRolesRaw = user?.roles;
    console.log('[AuthGuard] User roles raw:', userRolesRaw);
    let userRoles: string[] = [];

    if (Array.isArray(userRolesRaw)) {
      userRoles = userRolesRaw.map((r: any) => (r == null ? '' : String(r)));
    } else if (typeof userRolesRaw === 'string' && (userRolesRaw as string).trim() !== '') {
      userRoles = [(userRolesRaw as string).trim()];
    }

    console.log('[AuthGuard] Normalized user roles:', userRoles);
    const hasRequired = requiredRoles.some((r) => userRoles.includes(r));

    console.log('[AuthGuard] Has required roles:', hasRequired);
    return hasRequired ? true : router.createUrlTree(['/']);
  };

  return authService.apiToken().pipe(
    map(() => validateRoles()),
    catchError((err: HttpErrorResponse) => {
      // api_token vencido o backend sin respuesta: se borra todo lo guardado de la sesión
      const huboSesion = !!dataImport.getUser();
      sesion.clearSession();
      sesion.borrarCookiesSesion();
      const message = err?.status === 0 ? MENSAJE_SIN_SERVIDOR : MENSAJE_SESION_EXPIRADA;
      return of(router.createUrlTree(['/login'], huboSesion ? { queryParams: { message } } : {}));
    }),
  );

};
