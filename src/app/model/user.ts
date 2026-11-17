export interface Auth {
  username: string,
  password: string,
}

export interface User {
  id: number;
  name: string;
  lastname: string;
  dni: string;
  codcas: string;
  codred: string;
  email: string;
  username: string;
  password: string;
  date_creation: string;
  date_update: string;
  flag: boolean;
  roles?: string[] | string[];
  /** Debe cambiar la contraseña antes de usar el sistema (así lo envía el backend). */
  first_Login?: boolean;
  /** Nombre antiguo del mismo dato; el backend no lo envía, se mantiene por compatibilidad. */
  firstLogin?: boolean;
  /** Puede entrar a la administración del TMI (junto con el rol ADMIN). */
  access_tmi?: boolean;
}

export interface Rol {
  id: number;
  name: string;
  description: string;
  date_creation: string;
  date_update: string;
  flag: boolean;
}