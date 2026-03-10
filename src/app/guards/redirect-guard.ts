import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../services/auth-login';
import { inject } from '@angular/core';

export const redirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthLogin);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.createUrlTree(['/home']);
  }

  return router.createUrlTree(['/login']);
};
