export interface CatalogoExtension {
  id: number;
  nombre: string;
  mimeType: string;
}

export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion: string;
  extensiones_permitidas: string;
  id_extensiones?: number[];
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
  date_delete: string;
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
  date_delete: Date;
  archivo: Blob;
  visible: boolean;
  id_user_creation: number;
  id_documento: number;
  id_user_aprobador: number | null;
  prioridad: string;
  comentario_solicitud: string;
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

export interface AuditoriaDocumentaria {
  id: number;
  ip_address: string;
  user_agent: string;
  fecha_accion: string;
  id_documento: number;
  id_version_documento: number;
  id_usuario: number;
}

export interface HistoriaLAprobacionesDocumentos {
  id: number;
  estado_anterior: string;
  estado_actual: string;
  comentario: string;
  fecha_accion: string;
  id_usuario_accion: number;
  id_flujo_aprobacion: number;
}

