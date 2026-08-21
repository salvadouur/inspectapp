import { login } from "@/lib/auth-actions";
import { HeaderBar } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <HeaderBar />

      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.message && (
            <Alert>
              <AlertDescription>{params.message}</AlertDescription>
            </Alert>
          )}
          {params.error && (
            <Alert variant="destructive">
              <AlertDescription>{params.error}</AlertDescription>
            </Alert>
          )}

          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
