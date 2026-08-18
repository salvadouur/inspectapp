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
          <p className="text-sm text-muted-foreground">
            La autenticación real ya está funcionando — falta construir el resto de las
            pantallas (Configuración de Obra, Momento 1, Momento 2, Panel del Referente).
          </p>
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
