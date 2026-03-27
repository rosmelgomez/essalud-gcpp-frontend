import { CanActivateFn , Router} from '@angular/router';
import { AuthLogin } from '../services/auth-login';
import { inject } from '@angular/core';
import { DataImport } from '../services/data-import';


export const authenticateGuard: CanActivateFn = (route, state) => {

  const authService = inject( AuthLogin);
  const dataImport=inject(DataImport);
  const router = inject(Router);

  // Verificamos si el usuario está autenticado
  if (!authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

 // Verificamos si la ruta tiene rols requeridos definidos
 const requiredrols = route.data['rol'] as Array<string>;
 if (!requiredrols || requiredrols.length === 0) {
   // Si no hay rols definidos en la ruta, permitir acceso
   return true;
 }

  // Obtener los rols del usuario desde AuthService
  const userrols = dataImport.getUser()?.roles || "";

  // Verificar si el usuario tiene al menos uno de los rols requeridos
  const hasRequiredrol = requiredrols.some(rol => userrols.includes(rol));

  if (!hasRequiredrol) {
    // Redirigir a una página de acceso no autorizado o a donde desees
    router.navigate(['/']);
    return false;
  }
 return true;

};
