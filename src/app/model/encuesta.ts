export interface Modulo {
  id: number;
  name_modulo: string;
  active: boolean;
}

export interface Categoria {
  id: number;
  name_categoria: string;
  active: boolean;
  id_modulo: number;
}

export interface Subcategoria {
  id: number;
  name_categoria: string;
  active: boolean;
  id_categoria: number;
}

export interface Variable {
  id: number;
  name_variable: string;
  active: boolean;
  id_subcategoria: number;
}

export interface Encuesta {
  id: number,
  codcas: string,
  status: string,
  comment: string,
  date_creation: string,
  id_user: number,
  id_modulo: number,
  id_categoria: number,
  id_subcategoria: number,
  id_variable: number
}


