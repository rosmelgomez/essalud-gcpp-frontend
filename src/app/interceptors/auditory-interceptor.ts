import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { LocalStorageService } from '../services/local-storage-service';
import { catchError, switchMap, tap, throwError } from 'rxjs';

const AUTH_RETRY_DONE = new HttpContextToken<boolean>(() => false);

export const auditoryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthLogin);
  const router = inject(Router);
  const storage = inject(LocalStorageService);
  const publicRoutes = ['/login', '/solicitar-acceso-registro'];
  const isLogoutRequest = req.url.includes('/logout') || req.url.includes('/log/register');
  const isRefreshRequest = req.url.includes('/refresh-token');
  const isApiTokenRequest = req.url.includes('/api-token');
  const currentPath = router.url.split('?')[0];
  const isPublicRoute = publicRoutes.includes(currentPath);

  const redirectToLogin = () => {
    storage.clearFrontendSession();

    router.navigate(['/login'], {
      queryParams: {
        message: 'Vuelve a autentificarte de nuevo.',
      },
    });
  };

  const handleAuthFailure = (error: HttpErrorResponse) => {
    const errorMessage = error.error?.message || 'No se pudo validar la sesión. Por favor, inicie sesión nuevamente.';
    console.error('Error validando sesión:', errorMessage);

    redirectToLogin();
    return throwError(() => error);
  };
  
  const hasAlreadyRetried = req.context.get(AUTH_RETRY_DONE);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[AuthInterceptor] Error HTTP capturado', {
        url: req.url,
        status: error?.status,
      });

      // Manejar errores de autenticación
      if (error.status === 401 || error.status === 403) {
        if (isPublicRoute) {
          console.log('[AuthInterceptor] Ruta publica, no se intenta refresh.');
          return throwError(() => error);
        }

        if (isApiTokenRequest) {
          return handleAuthFailure(error);
        }

        if (isRefreshRequest) {
          const errorMessage = error.error?.message || 'No se pudo renovar la sesión.';
          console.error('Error renovando sesión:', errorMessage);
          return handleAuthFailure(error);
        }

        if (hasAlreadyRetried) {
          return throwError(() => error);
        }

        if (!isLogoutRequest && !isApiTokenRequest && !isRefreshRequest) {
          console.log('[AuthInterceptor] 401/403 detectado, iniciando recuperacion de sesion.', req.url);

          const requestWithAuthState = req.clone({
            context: req.context.set(AUTH_RETRY_DONE, true),
          });

          return auth.apiToken().pipe(
            tap(() => {
              console.log('[AuthInterceptor] apiToken validado, ejecutando refreshToken.');
            }),
            switchMap(() => auth.refreshToken()),
            tap(() => {
              console.log('[AuthInterceptor] refreshToken exitoso, reintentando request original.');
            }),
            switchMap(() => next(requestWithAuthState)),
            catchError((recoveryError: HttpErrorResponse) => {
              const errorMessage =
                recoveryError.error?.message ||
                'No se pudo recuperar la sesión.';
              console.error('Error de recuperación de sesión:', errorMessage);
              return handleAuthFailure(recoveryError);
            }),
          );
        }
      }

      return throwError(() => error);
    })
  );
};
