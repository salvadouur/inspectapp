import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/logo";
import { PageNav } from "@/components/page-nav";
import { Stepper } from "@/components/stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Momento2Form } from "./momento2-form";

export default async function Momento2Page({
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
      "id, obra, tarea, m1_habilitado_por_referente_at, eq_nombre_deteccion, eq_calibracion_vigente, eq_acopio, eq_clima, cateo_360, eq_delimitacion, prof_plan, entibado_aplica, chk_vigia, chk_escape, chk_no_madera, chk_entibado_instalado, chk_vallas, chk_arnes, maquinaria_paralela, omision_stop_mecanico_autorizada, status",
    )
    .eq("id", id)
    .single();

  if (!permiso) notFound();

  const { data: interferencias } = await supabase
    .from("interferencias")
    .select("id, tipo, profundidad")
    .eq("permiso_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-10">
      <HeaderBar />
      <PageNav backHref={`/permisos/${id}/momento1`} backLabel="Volver a Momento 1" />
      <Stepper current={3} />

      <Card>
        <CardHeader>
          <CardTitle>Momento 2 — Inspección Operativa en Campo</CardTitle>
        </CardHeader>
        <CardContent>
          {!permiso.m1_habilitado_por_referente_at ? (
            <Alert variant="destructive">
              <AlertDescription>
                🛑 Momento 2 Bloqueado: el Referente todavía no habilitó el paso a Momento 2. Completá y
                enviá el Momento 1 primero.
              </AlertDescription>
            </Alert>
          ) : (
            <Momento2Form permiso={permiso} interferenciasIniciales={interferencias ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
