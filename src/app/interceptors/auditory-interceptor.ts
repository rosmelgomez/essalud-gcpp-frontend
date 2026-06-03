import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage-service';
import { catchError, throwError } from 'rxjs';

export const auditoryInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(LocalStorageService);
  const publicRoutes = ['/login', '/solicitar-acceso-registro'];
  
  const currentPath = router.url.split('?')[0];
  const isPublicRoute = publicRoutes.includes(currentPath);

  const redirectToLogin = () => {
    storage.clearFrontendSession();
    router.navigate(['/login'], {
      queryParams: {
        message: 'Sesión expirada. Por favor, vuelva a iniciar sesión.',
      },
    });
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[AuthInterceptor] Error HTTP capturado', {
        url: req.url,
        status: error?.status,
      });

      // Solo si la petición de api-token falla, limpiamos la sesión y redirigimos a login
      if (req.url.includes('/api-token')) {
        console.warn('[AuthInterceptor] La petición api-token falló. Limpiando sesión y redirigiendo a Login.');
        redirectToLogin();
      }

      return throwError(() => error);
    })
  );
};
