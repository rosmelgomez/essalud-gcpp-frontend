export interface SolicitudAcceso {
    id?: number;
    name?: string;
    lastname: string;
    dni: string;
    codcas_solicitud: string;
    code_red_solicitud: string;
    email?: string;
    rol_solicitud?: string;
    descripcion?: string;
    date_creation?: string;
    date_update?: string;
    status?: string;
    comentario_revisor?: string;
    nombre_revisor?: string;
    date_resolution?: string;
}
