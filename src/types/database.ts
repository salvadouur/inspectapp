// Tipos escritos a mano reflejando supabase/migrations/0001_init.sql.
// Una vez que el proyecto de Supabase esté creado, se pueden regenerar automáticamente
// con: npx supabase gen types typescript --project-id <tu-project-id> > src/types/database.ts

export type Role = "inspector" | "referente";
export type TipoPermiso = "Frío" | "Caliente";
export type EstadoSertronic = "Verde" | "Rojo";
export type EntibadoAplica = "Sí" | "No";
export type TipoEvidencia = "charla" | "cpt" | "permiso_frente" | "permiso_dorso";
export type TipoNotificacion = "momento1" | "desvio" | "reporte";
export type EstadoPermiso = "en_progreso" | "autorizado";

export interface Gases {
  lel: number;
  o2: number;
  co: number;
  h2s: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role: Role;
        };
        Update: Partial<{
          full_name: string;
          role: Role;
        }>;
      };
      permisos: {
        Row: {
          id: string;
          inspector_id: string;
          obra: string;
          tarea: string;
          tipo_permiso: TipoPermiso | null;
          es_espacio_confinado: boolean;
          solicitante_contratista: string;
          num_permiso: string;
          num_cpt: string;
          sertronic_personal: EstadoSertronic;
          sertronic_vehiculos: EstadoSertronic;
          sertronic_maquinaria: EstadoSertronic;
          gases: Gases;
          gases_ultima_verificacion: string | null;
          cpt_checked: boolean;
          firma_inspector_m1: boolean;
          m1_enviado_at: string | null;
          m1_habilitado_por_referente_at: string | null;
          eq_nombre_deteccion: string;
          eq_calibracion_vigente: boolean;
          eq_acopio: boolean;
          eq_clima: boolean;
          cateo_360: boolean;
          eq_delimitacion: boolean;
          prof_plan: number;
          entibado_aplica: EntibadoAplica | null;
          chk_vigia: boolean;
          chk_escape: boolean;
          chk_no_madera: boolean;
          chk_entibado_instalado: boolean;
          chk_vallas: boolean;
          chk_arnes: boolean;
          maquinaria_paralela: boolean;
          omision_stop_mecanico_autorizada: boolean;
          status: EstadoPermiso;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["permisos"]["Row"]> & {
          inspector_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["permisos"]["Row"]>;
      };
      evidencias: {
        Row: {
          id: string;
          permiso_id: string;
          tipo: TipoEvidencia;
          storage_path: string;
          uploaded_at: string;
        };
        Insert: {
          permiso_id: string;
          tipo: TipoEvidencia;
          storage_path: string;
        };
        Update: Partial<{ storage_path: string }>;
      };
      interferencias: {
        Row: {
          id: string;
          permiso_id: string;
          tipo: string;
          profundidad: number;
          created_at: string;
        };
        Insert: {
          permiso_id: string;
          tipo: string;
          profundidad: number;
        };
        Update: Partial<{ tipo: string; profundidad: number }>;
      };
      tokens_omision: {
        Row: {
          id: string;
          permiso_id: string;
          token: string;
          motivo: string;
          generado_por: string;
          generado_at: string;
          usado_at: string | null;
          usado_por: string | null;
        };
        Insert: {
          permiso_id: string;
          token: string;
          motivo: string;
          generado_por: string;
        };
        Update: Partial<{ usado_at: string; usado_por: string }>;
      };
      notificaciones: {
        Row: {
          id: string;
          permiso_id: string;
          tipo: TipoNotificacion;
          mensaje: string;
          created_at: string;
          leida: boolean;
        };
        Insert: {
          permiso_id: string;
          tipo: TipoNotificacion;
          mensaje: string;
        };
        Update: Partial<{ leida: boolean }>;
      };
    };
  };
}
