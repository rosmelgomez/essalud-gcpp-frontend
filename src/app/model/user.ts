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