"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { evaluarZanja, generarToken, type ZanjaInput } from "@/lib/rules";
import type { EntibadoAplica } from "@/types/database";

export async function agregarInterferencia(permisoId: string, tipo: string, profundidad: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interferencias")
    .insert({ permiso_id: permisoId, tipo, profundidad })
    .select("id, tipo, profundidad")
    .single();

  if (error || !data) return { ok: false as const, error: error?.message ?? "No se pudo agregar la interferencia." };
  revalidatePath(`/permisos/${permisoId}/momento2`);
  return { ok: true as const, interferencia: data };
}

export async function quitarInterferencia(interferenciaId: string, permisoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("interferencias").delete().eq("id", interferenciaId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/permisos/${permisoId}/momento2`);
  return { ok: true as const };
}

// Genera el token en nombre del Referente. Temporal: hasta que exista el Panel del
// Referente (con Realtime), el propio Inspector lo dispara para poder seguir probando
// el flujo de Omisión Autorizada desde un solo dispositivo.
export async function generarTokenDemo(permisoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado." };

  const token = generarToken();
  const { error } = await supabase.from("tokens_omision").insert({
    permiso_id: permisoId,
    token,
    motivo: "Excavación a menos de 1.00 m del ducto — Stop Mecánico",
    generado_por: user.id,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, token };
}

export async function validarTokenOmision(permisoId: string, codigo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado." };

  const { data: tokenRow } = await supabase
    .from("tokens_omision")
    .select("id")
    .eq("permiso_id", permisoId)
    .eq("token", codigo)
    .is("usado_at", null)
    .order("generado_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tokenRow) {
    return { ok: false as const, error: "Token inválido o vencido. Pedile uno nuevo al Referente." };
  }

  await supabase
    .from("tokens_omision")
    .update({ usado_at: new Date().toISOString(), usado_por: user.id })
    .eq("id", tokenRow.id);

  await supabase
    .from("permisos")
    .update({ omision_stop_mecanico_autorizada: true })
    .eq("id", permisoId);

  await supabase.from("notificaciones").insert({
    permiso_id: permisoId,
    tipo: "desvio",
    mensaje: "Se validó la Omisión Autorizada (Stop Mecánico).",
  });

  revalidatePath(`/permisos/${permisoId}/momento2`);
  return { ok: true as const };
}

export interface ReporteLiberacionInput {
  eqNombreDeteccion: string;
  eqCalibracionVigente: boolean;
  cateo360: boolean;
  eqAcopio: boolean;
  eqClima: boolean;
  eqDelimitacion: boolean;
  profPlan: number;
  entibadoAplica: EntibadoAplica | null;
  chkVigia: boolean;
  chkEscape: boolean;
  chkNoMadera: boolean;
  chkEntibadoInstalado: boolean;
  chkVallas: boolean;
  chkArnes: boolean;
  maquinariaParalela: boolean;
  omisionValidadaOrNoRequerida: boolean;
}

export async function generarReporteLiberacion(permisoId: string, input: ReporteLiberacionInput) {
  const supabase = await createClient();

  const zanjaInput: ZanjaInput = {
    profPlan: input.profPlan,
    chkVigia: input.chkVigia,
    chkEscape: input.chkEscape,
    chkNoMadera: input.chkNoMadera,
    entibadoAplica: input.entibadoAplica,
    chkEntibadoInstalado: input.chkEntibadoInstalado,
    chkVallas: input.chkVallas,
    chkArnes: input.chkArnes,
  };
  const { bloqueado: bloqueoFosa } = evaluarZanja(zanjaInput);

  const m2Listo =
    input.eqCalibracionVigente &&
    input.eqDelimitacion &&
    input.cateo360 &&
    input.eqAcopio &&
    input.eqClima &&
    input.maquinariaParalela &&
    !bloqueoFosa &&
    input.omisionValidadaOrNoRequerida;

  if (!m2Listo) {
    return { ok: false as const, error: "Resolvé los bloqueos pendientes antes de generar el reporte." };
  }

  const { data: permiso, error } = await supabase
    .from("permisos")
    .update({
      eq_nombre_deteccion: input.eqNombreDeteccion,
      eq_calibracion_vigente: input.eqCalibracionVigente,
      eq_acopio: input.eqAcopio,
      eq_clima: input.eqClima,
      cateo_360: input.cateo360,
      eq_delimitacion: input.eqDelimitacion,
      prof_plan: input.profPlan,
      entibado_aplica: input.entibadoAplica,
      chk_vigia: input.chkVigia,
      chk_escape: input.chkEscape,
      chk_no_madera: input.chkNoMadera,
      chk_entibado_instalado: input.chkEntibadoInstalado,
      chk_vallas: input.chkVallas,
      chk_arnes: input.chkArnes,
      maquinaria_paralela: input.maquinariaParalela,
      status: "autorizado",
    })
    .eq("id", permisoId)
    .select("obra, tarea")
    .single();

  if (error || !permiso) return { ok: false as const, error: error?.message ?? "No se pudo generar el reporte." };

  await supabase.from("notificaciones").insert({
    permiso_id: permisoId,
    tipo: "reporte",
    mensaje: `Reporte de liberación de excavación generado en ${permiso.obra} (${permiso.tarea}).`,
  });

  revalidatePath(`/permisos/${permisoId}/momento2`);
  revalidatePath(`/permisos/${permisoId}`);
  return { ok: true as const };
}
