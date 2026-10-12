import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ApplicationRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { AuthService, MENSAJE_SESION_EXPIRADA, MENSAJE_SIN_SERVIDOR } from '../services/usuario/auth-service';
import { catchError, finalize, switchMap, throwError } from 'rxjs';

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

  return next(requestWithCredentials).pipe(
    // La app corre sin zone.js: una respuesta HTTP no refresca la vista por sí sola
    // (solo lo hacía el siguiente clic). Tras cada respuesta o error se programa un
    // ciclo de detección de cambios de toda la app, después del subscribe del componente.
    finalize(() => queueMicrotask(refrescarVista)),
    catchError((error: HttpErrorResponse) => {
      // 401: el access_token no se pudo renovar. 0: el backend no respondió.
      // Antes de cerrar la sesión se confirma con /api-token (un 401 aislado de un endpoint
      // o un backend caído momentáneamente no deben bastar para expulsar al usuario).
      if ((error.status === 401 || error.status === 0) && !esPeticionDeSesion && !isPublicRoute) {
        authService.verificarSesion().subscribe(({ activa, sinServidor }) => {
          if (!activa) {
            authService.endSession(sinServidor ? MENSAJE_SIN_SERVIDOR : MENSAJE_SESION_EXPIRADA);
          }
        });
      }
      return throwError(() => error);
    })
  );
};
