import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLogin } from '../services/auth-login';
import { catchError, switchMap, throwError } from 'rxjs';

export const auditoryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthLogin);
  const router = inject(Router);
  const publicRoutes = ['/login', '/solicitar-acceso-registro'];
  const isLogoutRequest = req.url.includes('/logout') || req.url.includes('/log/register');
  const isRefreshRequest = req.url.includes('/refresh-token');
  const isAccessTokenRequest = req.url.includes('/access-token');
  const currentPath = router.url.split('?')[0];
  const isPublicRoute = publicRoutes.includes(currentPath);

  const redirectToLogin = () => {
    auth.clearToken();
    router.navigate(['/'], {
      queryParams: {
        message: 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.',
      },
    });
  };

  const cleanedHeaders = req.headers.has('Authorization')
    ? req.headers.delete('Authorization')
    : req.headers;

  const requestWithCredentials = req.clone({
    withCredentials: true,
    headers: cleanedHeaders,
  });

  return next(requestWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar errores de autenticación
      if (error.status === 401 || error.status === 403) {
        if (isPublicRoute) {
          return throwError(() => error);
        }

        if (isRefreshRequest) {
          const errorMessage = error.error?.message || 'No se pudo renovar la sesión. Por favor, inicie sesión nuevamente.';
          console.error('Error en refresh-token:', errorMessage);

          redirectToLogin();
          return throwError(() => error);
        }

        if (!isLogoutRequest && !isRefreshRequest && !isAccessTokenRequest && auth.canRefreshToken()) {
          return auth.accessToken().pipe(
            switchMap(() => auth.refreshToken()),
            switchMap(() => next(requestWithCredentials)),
            catchError((recoveryError: HttpErrorResponse) => {
              const errorMessage =
                recoveryError.error?.message ||
                'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
              console.error('Error de recuperación de sesión:', errorMessage);

              redirectToLogin();

              return throwError(() => recoveryError);
            }),
          );
        }
      }

      return throwError(() => error);
    })
  );
};
