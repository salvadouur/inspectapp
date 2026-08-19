import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/logo";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PermisoPage({
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
      "id, obra, tarea, tipo_permiso, es_espacio_confinado, solicitante_contratista, status, m1_enviado_at, m1_habilitado_por_referente_at",
    )
    .eq("id", id)
    .single();

  if (!permiso) notFound();

  const step = permiso.m1_habilitado_por_referente_at ? 3 : permiso.m1_enviado_at ? 2 : 2;

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-10">
      <HeaderBar />
      <Stepper current={step as 1 | 2 | 3} />

      <Card>
        <CardHeader>
          <CardTitle>{permiso.obra} — {permiso.tarea}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{permiso.tipo_permiso}</Badge>
            {permiso.es_espacio_confinado && <Badge variant="secondary">Espacio confinado</Badge>}
            <Badge variant="secondary">{permiso.status === "autorizado" ? "Autorizado" : "En progreso"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Solicitante contratista: {permiso.solicitante_contratista || "sin definir"}
          </p>

          {permiso.status === "autorizado" ? (
            <p className="text-sm font-medium text-success">🚀 Excavación autorizada. Reporte generado.</p>
          ) : permiso.m1_habilitado_por_referente_at ? (
            <p className="text-sm font-medium text-success">✅ Momento 1 completo y Momento 2 habilitado.</p>
          ) : permiso.m1_enviado_at ? (
            <p className="text-sm text-muted-foreground">
              Momento 1 enviado, esperando habilitación del Referente para pasar a Momento 2.
            </p>
          ) : null}

          {permiso.m1_habilitado_por_referente_at ? (
            <Button render={<Link href={`/permisos/${permiso.id}/momento2`} />} className="w-full">
              {permiso.status === "autorizado" ? "Ver Momento 2" : "Ir a Momento 2 →"}
            </Button>
          ) : (
            <Button render={<Link href={`/permisos/${permiso.id}/momento1`} />} className="w-full">
              {permiso.m1_enviado_at ? "Continuar en Momento 1" : "Ir a Momento 1 →"}
            </Button>
          )}
          <Button render={<Link href="/" />} variant="outline" className="w-full">
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
