export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion: string;
  extensiones_permitidas: string;
  requiere_aprobacion: boolean;
  max_size_mb: number;
  flag: boolean;
  date_creation: Date;
  date_update: Date;
}

export interface Documento {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  codcas: string;
  codred: string;
  publico: boolean;
  solo_mi_red?: boolean;
  date_creation: string;
  date_update: string;
  flag: boolean;
  id_user_creation: number;
  id_tipo_documento: number;
}

export interface VersionDocumento {
  id: number;
  nombre: string;
  descripcion: string;
  extencion: string;
  version: number;
  size: number;
  date_creation: Date;
  date_update: Date;
  archivo: Blob;
  id_user_creation: number;
  id_documento: number;
  id_user_aprobador: number | null;
  visible: boolean;
}


export interface FlujoAprobacion {
  id: number;
  comentario: string;
  status: string;
  date_creation: Date;
  date_update: Date;
  id_user_aprobador: number;
  id_version_documento: number;
}

