import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth-actions";
import { HeaderBar } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /login si no hay usuario, pero por las dudas.
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const esInspector = profile?.role !== "referente";

  const { data: permisos } = esInspector
    ? await supabase
        .from("permisos")
        .select("id, obra, tarea, tipo_permiso, status")
        .eq("inspector_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <HeaderBar />

      <Card>
        <CardHeader>
          <CardTitle>Sesión iniciada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Hola, <strong>{profile?.full_name || user.email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Rol:{" "}
            <Badge variant={profile?.role === "referente" ? "secondary" : "default"}>
              {profile?.role ?? "sin definir"}
            </Badge>
          </p>

          {esInspector && (
            <Button render={<Link href="/permisos/nuevo" />} size="lg" className="w-full">
              + Nueva inspección
            </Button>
          )}

          {esInspector && permisos && permisos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Inspecciones en curso</p>
              {permisos.map((permiso) => (
                <Link
                  key={permiso.id}
                  href={`/permisos/${permiso.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent"
                >
                  <span>
                    {permiso.obra} — {permiso.tarea}
                  </span>
                  <Badge variant="secondary">
                    {permiso.status === "autorizado" ? "Autorizado" : "En progreso"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {!esInspector && (
            <p className="text-sm text-muted-foreground">
              El panel del Referente (notificaciones, habilitación de Momento 2) todavía se está
              construyendo.
            </p>
          )}

          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
