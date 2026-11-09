import { User } from '../model/user';

/** Rol que puede entrar a la administración del TMI (además debe tener usuario.access_tmi = true). */
export const ROL_ADMIN_TMI = 'ADMIN';

/** Administración del TMI: rol ADMIN y access_tmi = true. */
export function tieneAccesoTmiAdmin(user: User | null | undefined): boolean {
  const roles = Array.isArray(user?.roles) ? user!.roles.map((r) => String(r ?? '')) : [];
  return roles.includes(ROL_ADMIN_TMI) && user?.access_tmi === true;
}

/** Página de inicio después del login: la administración del TMI solo para quien tiene acceso; el resto, /home. */
export function rutaInicio(user: User | null | undefined): string {
  return tieneAccesoTmiAdmin(user) ? '/tmi/administrativo' : '/home';
}
