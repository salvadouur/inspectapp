import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth-actions";
import { HeaderBar } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification-bell";
import { ReferentePanel } from "./referente-panel";

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

  const { data: permisosInspector } = esInspector
    ? await supabase
        .from("permisos")
        .select("id, obra, tarea, tipo_permiso, status")
        .eq("inspector_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null };

  let notificaciones: {
    id: string;
    tipo: "momento1" | "desvio" | "reporte";
    mensaje: string;
    created_at: string;
    leida: boolean;
  }[] = [];
  let permisosReferente: Array<{
    id: string;
    obra: string;
    tarea: string;
    tipo_permiso: "Frío" | "Caliente" | null;
    status: "en_progreso" | "autorizado";
    inspector_id: string;
    m1_enviado_at: string | null;
    m1_habilitado_por_referente_at: string | null;
    inspectorName: string;
  }> = [];

  if (!esInspector) {
    const [{ data: notifs }, { data: permisos }] = await Promise.all([
      supabase
        .from("notificaciones")
        .select("id, tipo, mensaje, created_at, leida")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("permisos")
        .select("id, obra, tarea, tipo_permiso, status, inspector_id, m1_enviado_at, m1_habilitado_por_referente_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    notificaciones = notifs ?? [];

    const inspectorIds = [...new Set((permisos ?? []).map((p) => p.inspector_id))];
    const { data: inspectorProfiles } =
      inspectorIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", inspectorIds)
        : { data: [] };
    const nombreMap = new Map((inspectorProfiles ?? []).map((p) => [p.id, p.full_name]));

    permisosReferente = (permisos ?? []).map((p) => ({
      ...p,
      inspectorName: nombreMap.get(p.inspector_id) || "—",
    }));
  }

  return (
    <div className={`mx-auto flex min-h-svh flex-col justify-center px-4 py-10 ${esInspector ? "max-w-md" : "max-w-2xl"}`}>
      <HeaderBar />

      <Card>
        <CardHeader>
          <CardTitle>Sesión iniciada</CardTitle>
          {!esInspector && (
            <CardAction>
              <NotificationBell notificacionesIniciales={notificaciones} />
            </CardAction>
          )}
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

          {esInspector && permisosInspector && permisosInspector.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Inspecciones en curso</p>
              {permisosInspector.map((permiso) => (
                <Link
                  key={permiso.id}
                  href={`/permisos/${permiso.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
                >
                  <span className="min-w-0 break-words">
                    {permiso.obra} — {permiso.tarea}
                  </span>
                  <Badge variant="secondary">
                    {permiso.status === "autorizado" ? "Autorizado" : "En progreso"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {!esInspector && <ReferentePanel permisos={permisosReferente} />}

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
