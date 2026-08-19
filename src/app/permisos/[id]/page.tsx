import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/logo";
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
    .select("id, obra, tarea, tipo_permiso, es_espacio_confinado, solicitante_contratista, status")
    .eq("id", id)
    .single();

  if (!permiso) notFound();

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-10">
      <HeaderBar />

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
          <p className="text-sm text-muted-foreground">
            Configuración de obra guardada. El siguiente paso (Momento 1: Sertronic, gases, evidencias)
            todavía se está construyendo.
          </p>
          <Button render={<Link href="/" />} variant="outline" className="w-full">
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
