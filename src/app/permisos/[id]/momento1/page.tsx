import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/logo";
import { PageNav } from "@/components/page-nav";
import { Stepper } from "@/components/stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Momento1Form } from "./momento1-form";
import type { TipoEvidencia } from "@/types/database";
import type { EvidenciaInicial } from "@/components/evidence-uploader";

const TIPOS_EVIDENCIA: TipoEvidencia[] = ["charla", "cpt", "permiso_frente", "permiso_dorso"];

export default async function Momento1Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: permiso } = await supabase
    .from("permisos")
    .select(
      "id, obra, tarea, tipo_permiso, es_espacio_confinado, num_permiso, num_cpt, sertronic_personal, sertronic_vehiculos, sertronic_maquinaria, gases, gases_ultima_verificacion, cpt_checked, firma_inspector_m1, m1_enviado_at, m1_habilitado_por_referente_at",
    )
    .eq("id", id)
    .single();

  if (!permiso) notFound();

  const { data: evidenciasRows } = await supabase
    .from("evidencias")
    .select("id, tipo, storage_path")
    .eq("permiso_id", id);

  const evidenciasIniciales: Record<TipoEvidencia, EvidenciaInicial | null> = {
    charla: null,
    cpt: null,
    permiso_frente: null,
    permiso_dorso: null,
  };

  for (const tipo of TIPOS_EVIDENCIA) {
    const row = evidenciasRows?.find((r) => r.tipo === tipo);
    if (!row) continue;
    const { data: signed } = await supabase.storage
      .from("evidencias")
      .createSignedUrl(row.storage_path, 3600);
    evidenciasIniciales[tipo] = {
      id: row.id,
      storagePath: row.storage_path,
      signedUrl: signed?.signedUrl ?? null,
    };
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-10">
      <HeaderBar />
      <PageNav backHref={`/permisos/${id}`} backLabel="Volver" />
      <Stepper current={2} />

      <Card>
        <CardHeader>
          <CardTitle>Momento 1 — Verificación Documental</CardTitle>
        </CardHeader>
        <CardContent>
          <Momento1Form permiso={permiso} evidenciasIniciales={evidenciasIniciales} />
        </CardContent>
      </Card>
    </div>
  );
}
