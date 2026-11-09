import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/local-storage-service';
import { AuthService, MENSAJE_SESION_EXPIRADA } from '../services/usuario/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { tieneAccesoTmiAdmin } from './tmi-acceso';


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
    // sin el rol pedido va a /home ("/" lleva a la administración del TMI y volvería a caer aquí)
    return hasRequired ? true : router.createUrlTree(['/home']);
  };

  /** Rutas con data.accessTmi: además del rol, el usuario debe tener access_tmi = true. */
  const validarAccesoTmi = () => {
    if (!route.data['accessTmi']) return true;
    if (tieneAccesoTmiAdmin(dataImport.getUser())) return true;
    console.log('[AuthGuard] Sin access_tmi: no puede entrar a', route.routeConfig?.path);
    return router.createUrlTree(['/home']);
  };

  const validar = () => {
    const roles = validateRoles();
    return roles === true ? validarAccesoTmi() : roles;
  };

  return authService.apiToken().pipe(
    map(() => validar()),
    catchError((err: HttpErrorResponse) => {
      // api_token vencido o backend sin respuesta: se borra todo lo guardado de la sesión
      // (si el backend no respondió no se muestra aviso)
      const mostrarAviso = !!dataImport.getUser() && err?.status !== 0;
      sesion.clearSession();
      sesion.borrarCookiesSesion();
      return of(router.createUrlTree(['/login'], mostrarAviso ? { queryParams: { message: MENSAJE_SESION_EXPIRADA } } : {}));
    }),
  );

};
