"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { marcarNotificacionesLeidas } from "@/lib/notificaciones-actions";
import type { TipoNotificacion } from "@/types/database";

interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  created_at: string;
  leida: boolean;
}

const ICONOS: Record<TipoNotificacion, string> = {
  momento1: "📋",
  desvio: "⚠️",
  reporte: "📄",
};

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NotificationBell({ notificacionesIniciales }: { notificacionesIniciales: Notificacion[] }) {
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("panel-referente-notificaciones")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificaciones" }, (payload) => {
        setNotificaciones((list) => [payload.new as Notificacion, ...list]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  function handleOpen() {
    const yaAbierto = open;
    setOpen((o) => !o);
    if (yaAbierto) return;

    const noLeidas = notificaciones.filter((n) => !n.leida).map((n) => n.id);
    if (noLeidas.length === 0) return;
    setNotificaciones((list) => list.map((n) => (noLeidas.includes(n.id) ? { ...n, leida: true } : n)));
    startTransition(async () => {
      await marcarNotificacionesLeidas(noLeidas);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={handleOpen}
        className="relative flex size-9 items-center justify-center rounded-full border text-lg hover:bg-accent"
      >
        🔔
        {sinLeer > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
            {sinLeer > 9 ? "9+" : sinLeer}
          </Badge>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-20 mt-2 w-80 max-w-[85vw] space-y-1.5 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md",
          )}
        >
          <p className="text-sm font-medium">Notificaciones</p>
          {notificaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notificaciones todavía.</p>
          ) : (
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {notificaciones.slice(0, 20).map((n) => (
                <p key={n.id} className="text-sm">
                  <span className="text-muted-foreground">{formatHora(n.created_at)} —</span> {ICONOS[n.tipo]}{" "}
                  {n.mensaje}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
