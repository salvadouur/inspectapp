"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { evaluarGases, evaluarSertronic, requiereGases } from "@/lib/rules";
import type { EstadoSertronic, Gases } from "@/types/database";

export async function registrarVerificacionGases(permisoId: string, gases: Gases) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("permisos")
    .update({ gases, gases_ultima_verificacion: new Date().toISOString() })
    .eq("id", permisoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/permisos/${permisoId}/momento1`);
  return { ok: true as const };
}

export async function enviarMomento1(
  permisoId: string,
  input: {
    numPermiso: string;
    numCpt: string;
    sertronicPersonal: EstadoSertronic;
    sertronicVehiculos: EstadoSertronic;
    sertronicMaquinaria: EstadoSertronic;
    gases: Gases;
    gasesUltimaVerificacion: string | null;
    tipoPermiso: string | null;
    esEspacioConfinado: boolean;
    cptChecked: boolean;
    evidenciasCompletas: boolean;
  },
) {
  const supabase = await createClient();

  const { bloqueado: bloqueoSertronic } = evaluarSertronic(
    input.sertronicPersonal,
    input.sertronicVehiculos,
    input.sertronicMaquinaria,
  );
  const { bloqueado: bloqueoGases } = evaluarGases(input.gases);
  const gasesNoVerificados =
    requiereGases(input.tipoPermiso, input.esEspacioConfinado) && !input.gasesUltimaVerificacion;

  if (bloqueoSertronic || bloqueoGases || gasesNoVerificados || !input.cptChecked || !input.evidenciasCompletas) {
    return { ok: false as const, error: "Todavía faltan pasos obligatorios para completar Momento 1." };
  }

  const { data: permiso, error } = await supabase
    .from("permisos")
    .update({
      num_permiso: input.numPermiso,
      num_cpt: input.numCpt,
      sertronic_personal: input.sertronicPersonal,
      sertronic_vehiculos: input.sertronicVehiculos,
      sertronic_maquinaria: input.sertronicMaquinaria,
      cpt_checked: input.cptChecked,
      firma_inspector_m1: true,
      m1_enviado_at: new Date().toISOString(),
    })
    .eq("id", permisoId)
    .select("obra, tarea, tipo_permiso")
    .single();

  if (error || !permiso) return { ok: false as const, error: error?.message ?? "No se pudo enviar Momento 1." };

  await supabase.from("notificaciones").insert({
    permiso_id: permisoId,
    tipo: "momento1",
    mensaje: `Momento 1 completado en ${permiso.obra} (${permiso.tarea}, permiso ${permiso.tipo_permiso}). Pendiente de habilitación para pasar a Momento 2.`,
  });

  revalidatePath(`/permisos/${permisoId}/momento1`);
  return { ok: true as const };
}

// Atajo temporal: hasta que el Panel del Referente (con Realtime) exista, esto permite
// seguir probando el flujo completo desde un solo dispositivo.
export async function habilitarBypassDemo(permisoId: string) {
  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("permisos")
    .select("m1_enviado_at")
    .eq("id", permisoId)
    .single();

  const { error } = await supabase
    .from("permisos")
    .update({
      m1_habilitado_por_referente_at: new Date().toISOString(),
      ...(actual?.m1_enviado_at ? {} : { m1_enviado_at: new Date().toISOString() }),
    })
    .eq("id", permisoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/permisos/${permisoId}/momento1`);
  return { ok: true as const };
}
