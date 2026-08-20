"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EstadoSertronic } from "@/types/database";

export function SertronicToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: EstadoSertronic;
  onChange: (value: EstadoSertronic) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label="Habilitado"
          className={cn(
            "text-lg",
            value === "Verde" && "border-success bg-success text-success-foreground hover:bg-success/90",
          )}
          onClick={() => onChange("Verde")}
        >
          ✅
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label="No habilitado"
          className={cn(
            "text-lg",
            value === "Rojo" && "border-destructive bg-destructive text-white hover:bg-destructive/90",
          )}
          onClick={() => onChange("Rojo")}
        >
          🛑
        </Button>
      </div>
    </div>
  );
}
