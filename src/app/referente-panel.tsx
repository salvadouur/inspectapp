"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { EstadoPermiso, TipoPermiso } from "@/types/database";

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

export function ReferentePanel({ permisos }: { permisos: PermisoConInspector[] }) {
  const pendientes = permisos.filter((p) => p.m1_enviado_at && !p.m1_habilitado_por_referente_at);

  return (
    <div className="space-y-4">
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
