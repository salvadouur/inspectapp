"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { TipoEvidencia } from "@/types/database";

export interface EvidenciaInicial {
  id: string;
  storagePath: string;
  signedUrl: string | null;
}

export function EvidenceUploader({
  permisoId,
  tipo,
  label,
  initial,
  onChange,
}: {
  permisoId: string;
  tipo: TipoEvidencia;
  label: string;
  initial: EvidenciaInicial | null;
  onChange: (completo: boolean) => void;
}) {
  const [evidencia, setEvidencia] = useState(initial);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setSubiendo(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${permisoId}/${tipo}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("evidencias").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: row, error: insertError } = await supabase
        .from("evidencias")
        .insert({ permiso_id: permisoId, tipo, storage_path: path })
        .select("id")
        .single();
      if (insertError || !row) throw insertError;

      const { data: signed } = await supabase.storage.from("evidencias").createSignedUrl(path, 3600);

      setEvidencia({ id: row.id, storagePath: path, signedUrl: signed?.signedUrl ?? null });
      onChange(true);
    } catch {
      toast.error(`No se pudo subir la foto de "${label}". Probá de nuevo.`);
    } finally {
      setSubiendo(false);
    }
  }

  async function handleRemove() {
    if (!evidencia) return;
    const supabase = createClient();
    await supabase.storage.from("evidencias").remove([evidencia.storagePath]);
    await supabase.from("evidencias").delete().eq("id", evidencia.id);
    setEvidencia(null);
    onChange(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (evidencia) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="overflow-hidden rounded-lg border">
          {evidencia.signedUrl && (
            <Image
              src={evidencia.signedUrl}
              alt={label}
              width={300}
              height={200}
              unoptimized
              className="h-40 w-full object-cover"
            />
          )}
        </div>
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleRemove}>
          ❌ Eliminar / Volver a adjuntar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">📷 {label}</p>
      <p className="text-xs text-muted-foreground">Abre cámara o galería en el celular.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        disabled={subiendo}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
      />
      {subiendo && <p className="text-xs text-muted-foreground">Subiendo...</p>}
    </div>
  );
}
