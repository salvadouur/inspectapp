import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/logo";
import { PageNav } from "@/components/page-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfigObraForm } from "./config-obra-form";

export default async function NuevoPermisoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-10">
      <HeaderBar />

      <Card>
        <CardHeader>
          <PageNav backHref="/" backLabel="Volver al inicio" />
          <CardTitle>Configuración de Obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error && (
            <Alert variant="destructive">
              <AlertDescription>{params.error}</AlertDescription>
            </Alert>
          )}
          <ConfigObraForm inspectorName={profile?.full_name || user.email || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
