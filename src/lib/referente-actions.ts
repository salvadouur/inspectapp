"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generarToken } from "@/lib/rules";

export async function habilitarMomento2(permisoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("permisos")
    .update({ m1_habilitado_por_referente_at: new Date().toISOString() })
    .eq("id", permisoId);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/referente/${permisoId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function generarTokenReferente(permisoId: string) {
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
  revalidatePath(`/referente/${permisoId}`);
  return { ok: true as const, token };
}
