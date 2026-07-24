import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLogin } from '../services/usuario/auth-login';
import { catchError, switchMap, throwError } from 'rxjs';

export const auditoryInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthLogin);
  const router = inject(Router);
  const publicRoutes = ['/login', '/solicitar-acceso-registro'];
  const isLogoutRequest = req.url.includes('/logout') || req.url.includes('/log/register');
  const currentPath = router.url.split('?')[0];
  const isPublicRoute = publicRoutes.includes(currentPath);

  const redirectToLogin = () => {
  
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
      }

      return throwError(() => error);
    })
  );
};
