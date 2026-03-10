import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthLogin } from '../services/auth-login';

export const logoutGuard: CanActivateFn = () => {

  const auth = inject(AuthLogin);
  const router = inject(Router);

  // ENVÍA EL LOGOUT AL BACKEND (SEGURA)
  auth.logout();

 
  router.navigate(['/login']);

  //  IMPIDE QUE SE CARGUE UNA VISTA
  return false;
};
