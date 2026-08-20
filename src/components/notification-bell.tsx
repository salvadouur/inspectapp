"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TipoNotificacion } from "@/types/database";

interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  created_at: string;
}

const ICONOS: Record<TipoNotificacion, string> = {
  momento1: "📋",
  desvio: "⚠️",
  reporte: "📄",
};

export function NotificationBell({ notificacionesIniciales }: { notificacionesIniciales: Notificacion[] }) {
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const [open, setOpen] = useState(false);
  const [vistas, setVistas] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("panel-referente-notificaciones")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificaciones" }, (payload) => {
        setNotificaciones((list) => [payload.new as Notificacion, ...list]);
        setVistas(false);
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

  const sinLeer = vistas ? 0 : notificaciones.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={() => {
          setOpen((o) => !o);
          setVistas(true);
        }}
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
                  <span className="text-muted-foreground">{new Date(n.created_at).toLocaleTimeString()} —</span>{" "}
                  {ICONOS[n.tipo]} {n.mensaje}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
