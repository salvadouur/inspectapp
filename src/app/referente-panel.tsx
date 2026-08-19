"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { TipoNotificacion, EstadoPermiso, TipoPermiso } from "@/types/database";

interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  created_at: string;
}

interface PermisoConInspector {
  id: string;
  obra: string;
  tarea: string;
  tipo_permiso: TipoPermiso | null;
  status: EstadoPermiso;
  inspector_id: string;
  m1_enviado_at: string | null;
  m1_habilitado_por_referente_at: string | null;
  inspectorName: string;
}

const ICONOS: Record<TipoNotificacion, string> = {
  momento1: "📋",
  desvio: "⚠️",
  reporte: "📄",
};

export function ReferentePanel({
  notificacionesIniciales,
  permisos,
}: {
  notificacionesIniciales: Notificacion[];
  permisos: PermisoConInspector[];
}) {
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("panel-referente-notificaciones")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        (payload) => {
          setNotificaciones((list) => [payload.new as Notificacion, ...list]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendientes = permisos.filter((p) => p.m1_enviado_at && !p.m1_habilitado_por_referente_at);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-2">
        <p className="font-medium">Notificaciones</p>
        {notificaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin notificaciones todavía.</p>
        ) : (
          <div className="space-y-1.5">
            {notificaciones.slice(0, 10).map((n) => (
              <p key={n.id} className="text-sm">
                <span className="text-muted-foreground">
                  {new Date(n.created_at).toLocaleTimeString()} —
                </span>{" "}
                {ICONOS[n.tipo]} {n.mensaje}
              </p>
            ))}
          </div>
        )}
      </div>

      {pendientes.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium">Pendientes de habilitar Momento 2</p>
          {pendientes.map((p) => (
            <Link
              key={p.id}
              href={`/referente/${p.id}`}
              className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent"
            >
              <span>
                {p.obra} — {p.tarea} <span className="text-muted-foreground">({p.inspectorName})</span>
              </span>
              <Badge>{p.tipo_permiso}</Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-2">
        <p className="font-medium">Todos los permisos</p>
        {permisos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay inspecciones cargadas.</p>
        ) : (
          permisos.map((p) => (
            <Link
              key={p.id}
              href={`/referente/${p.id}`}
              className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent"
            >
              <span>
                {p.obra} — {p.tarea} <span className="text-muted-foreground">({p.inspectorName})</span>
              </span>
              <Badge variant="secondary">{p.status === "autorizado" ? "Autorizado" : "En progreso"}</Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
