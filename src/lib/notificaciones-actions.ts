"use server";

import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacionesLeidas(ids: string[]) {
  if (ids.length === 0) return { ok: true as const };
  const supabase = await createClient();
  const { error } = await supabase.from("notificaciones").update({ leida: true }).in("id", ids);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
