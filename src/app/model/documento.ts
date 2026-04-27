export interface Documento {
  id: number;
  nombre: string;
  descripcion: string;
  date_creation:string;
  date_update:string;
  usuario_creation:string;
  usuario_update:string;
  archivo: File;
}
