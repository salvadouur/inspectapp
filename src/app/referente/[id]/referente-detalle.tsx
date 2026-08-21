"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { habilitarMomento2, generarTokenReferente } from "@/lib/referente-actions";
import { createClient } from "@/lib/supabase/client";
import type { EstadoPermiso, TipoEvidencia, TipoNotificacion, TipoPermiso } from "@/types/database";
import type { EvidenciaInicial } from "@/components/evidence-uploader";

function CopyTokenButton({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(token);
        setCopiado(true);
        toast.success("Token copiado.");
        setTimeout(() => setCopiado(false), 1500);
      }}
    >
      {copiado ? "✅ Copiado" : "📋 Copiar"}
    </Button>
  );
}

const COOLDOWN_MS = 60_000;

const EVIDENCIAS: Array<{ tipo: TipoEvidencia; label: string }> = [
  { tipo: "charla", label: "Charla 5 min" },
  { tipo: "cpt", label: "CPT" },
  { tipo: "permiso_frente", label: "Permiso — Frente" },
  { tipo: "permiso_dorso", label: "Permiso — Dorso" },
];

interface TokenRow {
  id: string;
  token: string;
  motivo: string;
  generado_at: string;
  usado_at: string | null;
}

interface PermisoReferente {
  id: string;
  tipo_permiso: TipoPermiso | null;
  es_espacio_confinado: boolean;
  status: EstadoPermiso;
  m1_enviado_at: string | null;
  m1_habilitado_por_referente_at: string | null;
}

export function ReferenteDetalle({
  permiso,
  inspectorName,
  evidencias,
  tokensIniciales,
}: {
  permiso: PermisoReferente;
  inspectorName: string;
  evidencias: Record<TipoEvidencia, EvidenciaInicial | null>;
  tokensIniciales: TokenRow[];
}) {
  const [habilitado, setHabilitado] = useState(!!permiso.m1_habilitado_por_referente_at);
  const [tokens, setTokens] = useState(tokensIniciales);
  const [pendingHabilitar, startHabilitarTransition] = useTransition();
  const [pendingToken, startTokenTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [solicitudPendiente, setSolicitudPendiente] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Realtime: si el Inspector pide un token de Omisión Autorizada, avisamos acá al toque.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`referente-${permiso.id}-notificaciones`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones", filter: `permiso_id=eq.${permiso.id}` },
        (payload) => {
          const n = payload.new as { tipo: TipoNotificacion; mensaje: string };
          if (n.tipo === "desvio" && n.mensaje.toLowerCase().includes("solicita token")) {
            setSolicitudPendiente(true);
            toast.info("El Inspector solicita un token de Omisión Autorizada.");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permiso.id]);

  const cooldownRestanteMs = Math.max(0, cooldownUntil - now);
  const enCooldown = cooldownRestanteMs > 0;

  function handleHabilitar() {
    startHabilitarTransition(async () => {
      const res = await habilitarMomento2(permiso.id);
      if (res.ok) {
        setHabilitado(true);
        toast.success("Momento 2 habilitado para el Inspector.");
      } else {
        toast.error("No se pudo habilitar Momento 2.");
      }
    });
  }

  function handleGenerarToken() {
    if (enCooldown) return;
    startTokenTransition(async () => {
      const res = await generarTokenReferente(permiso.id);
      if (res.ok) {
        setTokens((list) => [
          { id: crypto.randomUUID(), token: res.token, motivo: "Excavación a menos de 1.00 m del ducto — Stop Mecánico", generado_at: new Date().toISOString(), usado_at: null },
          ...list,
        ]);
        setCooldownUntil(Date.now() + COOLDOWN_MS);
        setSolicitudPendiente(false);
        toast.success(`Token generado: ${res.token}. Dictáselo al Inspector por teléfono.`);
      } else {
        toast.error("No se pudo generar el token.");
      }
    });
  }

  const tokenActivo = tokens.find((t) => !t.usado_at);
  const historial = tokens.filter((t) => t.usado_at);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {permiso.tipo_permiso && <Badge>{permiso.tipo_permiso}</Badge>}
        {permiso.es_espacio_confinado && <Badge variant="secondary">Espacio confinado</Badge>}
        <Badge variant="secondary">{permiso.status === "autorizado" ? "Autorizado" : "En progreso"}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Inspector: {inspectorName}</p>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-medium">Habilitación de Momento 2</p>
        {!permiso.m1_enviado_at ? (
          <p className="text-sm text-muted-foreground">El Inspector todavía no envió el Momento 1.</p>
        ) : (
          <>
            <p className="text-sm font-medium">Auditoría visual de evidencias</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EVIDENCIAS.map(({ tipo, label }) => {
                const ev = evidencias[tipo];
                return (
                  <div key={tipo} className="space-y-1">
                    {ev?.signedUrl ? (
                      <button
                        type="button"
                        onClick={() => setImagenAmpliada({ url: ev.signedUrl!, label })}
                        className="block w-full"
                      >
                        <Image
                          src={ev.signedUrl}
                          alt={label}
                          width={150}
                          height={100}
                          unoptimized
                          className="h-20 w-full rounded-md border object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex h-20 items-center justify-center rounded-md border text-xs text-muted-foreground">
                        Sin adjuntar
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                );
              })}
            </div>

            {habilitado ? (
              <p className="text-sm font-medium text-success">Momento 2 ya habilitado.</p>
            ) : (
              <Button type="button" onClick={handleHabilitar} disabled={pendingHabilitar}>
                ✅ Habilitar Momento 2
              </Button>
            )}
          </>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-medium">Omisión Autorizada — Generar token</p>
        <p className="text-xs text-muted-foreground">
          Evaluá la situación con el Inspector y, si corresponde, generá un token de 4 dígitos para dictarle
          por teléfono.
        </p>
        {solicitudPendiente && (
          <p className="text-sm font-medium text-brand-amber">
            🔔 El Inspector solicitó un token — todavía no generaste ninguno.
          </p>
        )}
        {tokenActivo && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-brand-amber">Token activo sin usar: {tokenActivo.token}</p>
            <CopyTokenButton token={tokenActivo.token} />
          </div>
        )}
        <Button type="button" variant="outline" onClick={handleGenerarToken} disabled={pendingToken || enCooldown}>
          🔑 {enCooldown ? `Podés generar otro en ${Math.ceil(cooldownRestanteMs / 1000)}s` : "Generar nuevo token"}
        </Button>

        {historial.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <p className="text-sm font-medium">Historial de Omisiones Autorizadas</p>
            {historial.map((t) => (
              <p key={t.id} className="text-xs text-muted-foreground">
                {new Date(t.usado_at!).toLocaleString()} — {t.motivo} (token {t.token})
              </p>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!imagenAmpliada} onOpenChange={(o) => !o && setImagenAmpliada(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>{imagenAmpliada?.label}</DialogTitle>
          {imagenAmpliada && (
            <Image
              src={imagenAmpliada.url}
              alt={imagenAmpliada.label}
              width={800}
              height={600}
              unoptimized
              className="h-auto max-h-[75vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
