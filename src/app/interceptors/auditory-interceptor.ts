import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ApplicationRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { AuthService, MENSAJE_SESION_EXPIRADA, MENSAJE_SIN_SERVIDOR } from '../services/usuario/auth-service';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { Backend } from '../model/api';

/** Marca la petición ya repetida tras renovar el token, para no reintentarla otra vez. */
const REINTENTO_CON_TOKEN_NUEVO = new HttpContextToken<boolean>(() => false);

export const auditoryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthLogin);
  const authService = inject(AuthService);
  const router = inject(Router);
  const appRef = inject(ApplicationRef);
  const refrescarVista = () => {
    try {
      appRef.tick();
    } catch {
      // ya hay un ciclo en curso: ese mismo ciclo pinta los cambios
    }
  };
  const publicRoutes = ['/login', '/solicitar-acceso-registro'];
  // peticiones que forman parte del propio manejo de sesión: nunca disparan un cierre
  const esPeticionDeSesion = ['/login', '/api-token', '/logout', '/log/register'].some((r) => req.url.includes(r));
  const currentPath = router.url.split('?')[0];
  const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/solicitud-acceso');

  const cleanedHeaders = req.headers.has('Authorization')
    ? req.headers.delete('Authorization')
    : req.headers;

  const requestWithCredentials = req.clone({
    withCredentials: true,
    headers: cleanedHeaders,
  });

  // 401: el access_token no se pudo renovar. 0: el backend no respondió.
  // Antes de cerrar la sesión se confirma con /api-token (un 401 aislado de un endpoint
  // o un backend caído momentáneamente no deben bastar para expulsar al usuario).
  const confirmarSesion = (error: HttpErrorResponse) => {
    if ((error.status === 401 || error.status === 0) && !esPeticionDeSesion && !isPublicRoute) {
      authService.verificarSesion().subscribe(({ activa, sinServidor }) => {
        if (!activa) {
          authService.endSession(sinServidor ? MENSAJE_SIN_SERVIDOR : MENSAJE_SESION_EXPIRADA);
        }
      });
    }
  };

  return next(requestWithCredentials).pipe(
    // La app corre sin zone.js: una respuesta HTTP no refresca la vista por sí sola
    // (solo lo hacía el siguiente clic). Tras cada respuesta o error se programa un
    // ciclo de detección de cambios de toda la app, después del subscribe del componente.
    finalize(() => queueMicrotask(refrescarVista)),
    catchError((error: HttpErrorResponse) => {
      // El backend TMI solo valida el token de essalud-gcpp-backend: con un 401 se renueva allí
      // (GET /user/me regenera la cookie access_token) y se repite la petición una sola vez.
      if (error.status === 401 && req.url.startsWith(Backend.apiTmi) && !req.context.get(REINTENTO_CON_TOKEN_NUEVO) && !isPublicRoute) {
        return authService.renovarAcceso().pipe(
          switchMap((renovado) => renovado
            ? next(requestWithCredentials.clone({ context: req.context.set(REINTENTO_CON_TOKEN_NUEVO, true) }))
            : throwError(() => error)),
          catchError((err: HttpErrorResponse) => {
            confirmarSesion(err);
            return throwError(() => err);
          }),
          finalize(() => queueMicrotask(refrescarVista)),
        );
      }
      confirmarSesion(error);
      return throwError(() => error);
    })
  );
};
