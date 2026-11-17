import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/local-storage-service';
import { AuthService, MENSAJE_SESION_EXPIRADA, SIN_SESION } from '../services/usuario/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { tieneAccesoTmiAdmin } from './tmi-acceso';


export const authenticateGuard: CanActivateFn = (route) => {

  const authService = inject(AuthLogin);
  const dataImport = inject(LocalStorageService);
  const router = inject(Router);
  const sesion = inject(AuthService);

  const validateRoles = () => {
    const requiredRoles = (route.data['role'] || route.data['rol']) as Array<string> | undefined;
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = dataImport.getUser();
    const userRolesRaw = user?.roles;
    let userRoles: string[] = [];

    if (Array.isArray(userRolesRaw)) {
      userRoles = userRolesRaw.map((r: any) => (r == null ? '' : String(r)));
    } else if (typeof userRolesRaw === 'string' && (userRolesRaw as string).trim() !== '') {
      userRoles = [(userRolesRaw as string).trim()];
    }

    const hasRequired = requiredRoles.some((r) => userRoles.includes(r));

    // sin el rol pedido va a /home ("/" lleva a la administración del TMI y volvería a caer aquí)
    return hasRequired ? true : router.createUrlTree(['/home']);
  };

  /** Rutas con data.accessTmi: además del rol, el usuario debe tener access_tmi = true. */
  const validarAccesoTmi = () => {
    if (!route.data['accessTmi']) return true;
    if (tieneAccesoTmiAdmin(dataImport.getUser())) return true;
    return router.createUrlTree(['/home']);
  };

  const validar = () => {
    const roles = validateRoles();
    return roles === true ? validarAccesoTmi() : roles;
  };

  return authService.apiToken().pipe(
    // la sesión sigue viva: si el usuario se perdió (p. ej. tras reiniciar el backend) se recupera antes de validar
    switchMap(() => sesion.asegurarUsuario()),
    map(() => validar()),
    catchError((err: HttpErrorResponse) => {
      // backend sin respuesta: no se sabe si la sesión sigue viva, no se borra nada y el login vuelve a preguntar
      if (!(err instanceof HttpErrorResponse) || err.status === 0) {
        return of(router.createUrlTree(['/login']));
      }
      // api_token vencido: se borra todo lo guardado de la sesión
      const mostrarAviso = !!dataImport.getUser();
      sesion.clearSession();
      sesion.borrarCookiesSesion();
      // el login no vuelve a preguntar por la sesión: ya se sabe que no hay
      const login = router.createUrlTree(['/login'], mostrarAviso ? { queryParams: { message: MENSAJE_SESION_EXPIRADA } } : {});
      return of(new RedirectCommand(login, { state: { [SIN_SESION]: true } }));
    }),
  );

};
