import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/logo";
import { PageNav } from "@/components/page-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReferenteDetalle } from "./referente-detalle";
import type { TipoEvidencia } from "@/types/database";
import type { EvidenciaInicial } from "@/components/evidence-uploader";

const TIPOS_EVIDENCIA: TipoEvidencia[] = ["charla", "cpt", "permiso_frente", "permiso_dorso"];

export default async function ReferenteDetallePage({
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "referente") redirect("/");

  const { data: permiso } = await supabase
    .from("permisos")
    .select(
      "id, obra, tarea, tipo_permiso, es_espacio_confinado, inspector_id, status, m1_enviado_at, m1_habilitado_por_referente_at",
    )
    .eq("id", id)
    .single();

  if (!permiso) notFound();

  const { data: inspectorProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", permiso.inspector_id)
    .single();

  const { data: evidenciasRows } = await supabase
    .from("evidencias")
    .select("id, tipo, storage_path")
    .eq("permiso_id", id);

  const evidencias: Record<TipoEvidencia, EvidenciaInicial | null> = {
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
    evidencias[tipo] = { id: row.id, storagePath: row.storage_path, signedUrl: signed?.signedUrl ?? null };
  }

  const { data: tokens } = await supabase
    .from("tokens_omision")
    .select("id, token, motivo, generado_at, usado_at")
    .eq("permiso_id", id)
    .order("generado_at", { ascending: false });

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-10">
      <HeaderBar />
      <PageNav backHref="/" backLabel="Volver al inicio" />

      <Card>
        <CardHeader>
          <CardTitle>{permiso.obra} — {permiso.tarea}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferenteDetalle
            permiso={permiso}
            inspectorName={inspectorProfile?.full_name || "—"}
            evidencias={evidencias}
            tokensIniciales={tokens ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
