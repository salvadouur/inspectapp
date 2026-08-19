"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TAREAS_DISPONIBLES } from "@/lib/content";
import type { TipoPermiso } from "@/types/database";

export async function crearPermiso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const obra = String(formData.get("obra") ?? "");
  const solicitanteContratista = String(formData.get("solicitante_contratista") ?? "");
  const tarea = String(formData.get("tarea") ?? "");
  const tipoPermisoRaw = String(formData.get("tipo_permiso") ?? "");
  const esEspacioConfinado = formData.get("es_espacio_confinado") === "on";

  if (!TAREAS_DISPONIBLES.includes(tarea)) {
    redirect(`/permisos/nuevo?error=${encodeURIComponent("Esa tarea todavía no está disponible en el MVP.")}`);
  }
  if (tipoPermisoRaw !== "Frío" && tipoPermisoRaw !== "Caliente") {
    redirect(`/permisos/nuevo?error=${encodeURIComponent("Seleccioná el tipo de permiso para continuar.")}`);
  }
  const tipoPermiso = tipoPermisoRaw as TipoPermiso;

  const { data, error } = await supabase
    .from("permisos")
    .insert({
      inspector_id: user.id,
      obra,
      tarea,
      tipo_permiso: tipoPermiso,
      es_espacio_confinado: esEspacioConfinado,
      solicitante_contratista: solicitanteContratista,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/permisos/nuevo?error=${encodeURIComponent("No se pudo crear la inspección. Probá de nuevo.")}`);
  }

  redirect(`/permisos/${data.id}`);
}
