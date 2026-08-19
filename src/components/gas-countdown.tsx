"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function GasCountdown({ targetMs }: { targetMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, targetMs - now);
  const totalSec = Math.floor(diff / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  const vencido = diff <= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-bold text-white",
        vencido ? "bg-brand-amber" : "bg-primary",
      )}
    >
      <span>⏰</span>
      <span>
        {vencido
          ? "Corresponde re-verificar la atmósfera (pasaron más de 60 minutos)"
          : `Próxima re-verificación en: ${m}:${s}`}
      </span>
    </div>
  );
}
