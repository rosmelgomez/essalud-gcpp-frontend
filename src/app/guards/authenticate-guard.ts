import { CanActivateFn , Router} from '@angular/router';
import { AuthLogin } from '../services/auth-login';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/local-storage-service';
import { catchError, map, of } from 'rxjs';


export const authenticateGuard: CanActivateFn = (route, state) => {

  const authService = inject( AuthLogin);
  const dataImport=inject(LocalStorageService);
  const router = inject(Router);

  return authService.apiToken().pipe(
    map(() => {
      const requiredrols = route.data['rol'] as Array<string>;
      if (!requiredrols || requiredrols.length === 0) {
        return true;
      }

      const userrols = dataImport.getUser()?.roles || '';
      const hasRequiredrol = requiredrols.some((rol) => userrols.includes(rol));

      return hasRequiredrol ? true : router.createUrlTree(['/']);
    }),
    catchError(() => of(router.createUrlTree(['/login']))),
  );

};
